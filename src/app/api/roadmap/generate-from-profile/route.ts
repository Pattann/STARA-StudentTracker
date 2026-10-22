import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

async function resolveSession(req: NextRequest) {
  const token = req.headers.get("x-demo-token") ?? req.nextUrl.searchParams.get("token");
  if (!token) return null;
  const session = await prisma.guestSession.findUnique({ where: { token } });
  if (!session || session.expiresAt < new Date()) return null;
  return session;
}

export async function POST(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) {
    return NextResponse.json({ error: "Sesi tidak valid atau telah berakhir." }, { status: 401 });
  }

  try {
    let profile = await prisma.academicProfile.findFirst({
      where: { guestSessionId: session.id },
    });

    if (!profile) {
      let bodyData: Record<string, unknown> = {};
      try {
        bodyData = (await req.json()) as Record<string, unknown>;
      } catch {}

      if (bodyData.institutionName && bodyData.programName) {
        profile = await prisma.academicProfile.create({
          data: {
            guestSessionId: session.id,
            institutionName: String(bodyData.institutionName),
            programName: String(bodyData.programName),
            entryYear: Number(bodyData.entryYear) || 2023,
            currentSemester: Number(bodyData.currentSemester) || 5,
            totalCurriculumCredits: 144,
            completedCredits: 80,
            gpa: 3.5,
            goals: String(bodyData.goals || "balanced"),
          },
        });
      } else {
        return NextResponse.json(
          { error: "Profil akademik belum ditemukan. Silakan lengkapi onboarding terlebih dahulu." },
          { status: 404 }
        );
      }
    }

    // Reset old roadmaps for this session
    await prisma.roadmap.deleteMany({ where: { guestSessionId: session.id } });

    // 1. Create Roadmap
    const roadmap = await prisma.roadmap.create({
      data: {
        guestSessionId: session.id,
        title: `Roadmap Personal: ${profile.programName} (${profile.institutionName})`,
        status: "active",
      },
    });

    const version = await prisma.roadmapVersion.create({
      data: {
        roadmapId: roadmap.id,
        versionNum: 1,
        label: "Roadmap Auto-Generated Onboarding",
        isBaseline: true,
      },
    });

    await prisma.roadmap.update({
      where: { id: roadmap.id },
      data: { currentVersionId: version.id },
    });

    // 2. Generate Semester Plans from currentSemester up to target Graduation
    const currSem = profile.currentSemester;
    let targetSem = profile.goals === "fast" ? 7 : 8;
    if (currSem > targetSem) targetSem = currSem + 1;
    const futureSemCount = Math.max(1, targetSem - currSem + 1);
    const remainingCredits = Math.max(0, profile.totalCurriculumCredits - profile.completedCredits);
    const avgCredits = Math.max(12, Math.min(24, Math.round(remainingCredits / futureSemCount)));

    // 2. Coba susun daftar mata kuliah & rencana semester menggunakan AI jika provider tersedia
    let aiSemesterData: Array<{
      semesterNum: number;
      semesterLabel: string;
      targetCredits: number;
      tasks: Array<{
        title: string;
        category: string;
        credits: number;
        status: string;
        notes?: string;
      }>;
    }> | null = null;

    if (process.env.GOOGLE_AI_API_KEY) {
      try {
        const { GoogleGenAI } = require("@google/genai");
        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
        const prompt = `
Anda adalah konsultan kurikulum akademik perguruan tinggi STARA.
Rancanglah rencana semester dan mata kuliah yang realistis untuk mahasiswa:
- Perguruan Tinggi: ${profile.institutionName}
- Program Studi: ${profile.programName} (${profile.educationLevel})
- Semester Berjalan Saat Ini: Semester ${currSem}
- SKS Lulus Saat Ini: ${profile.completedCredits} dari ${profile.totalCurriculumCredits} SKS
- Target Ritme: ${profile.goals} (fast = lulus semester 7, balanced = semester 8, active = fokus magang/MBKM di semester 6-7)
- Minat Spesifik: ${profile.interests || "Umum"}

Susunlah daftar semester mulai dari semester ${currSem} hingga target lulus (semester ${targetSem}).
Untuk setiap semester, sertakan mata kuliah khas prodi ${profile.programName} (misal mata kuliah wajib, peminatan yang sesuai minat, magang/proyek, dan skripsi di semester akhir).
HANYA kembalikan format JSON valid tanpa backtick \`\`\`json:
{
  "semesters": [
    {
      "semesterNum": ${currSem},
      "semesterLabel": "Semester ${currSem} (Berjalan)",
      "targetCredits": 20,
      "tasks": [
        { "title": "Nama Mata Kuliah Nyata / Tugas", "category": "akademik", "credits": 3, "status": "in_progress", "notes": "Keterangan singkat" }
      ]
    }
  ]
}
`;
        const res = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const parsed = JSON.parse(res.text || "{}");
        if (Array.isArray(parsed.semesters) && parsed.semesters.length > 0) {
          aiSemesterData = parsed.semesters;
        }
      } catch (e) {
        console.warn("[Generate AI Roadmap Fallback]", e);
      }
    }

    if (aiSemesterData && aiSemesterData.length > 0) {
      for (const semItem of aiSemesterData) {
        const semNum = Number(semItem.semesterNum) || currSem;
        const isCurrent = semNum === currSem;
        const plan = await prisma.semesterPlan.create({
          data: {
            roadmapVersionId: version.id,
            semesterNum: semNum,
            isCurrentSemester: isCurrent,
            targetCredits: Number(semItem.targetCredits) || avgCredits,
            plannedCredits: Number(semItem.targetCredits) || avgCredits,
            semesterLabel: semItem.semesterLabel || `Semester ${semNum}`,
          },
        });

        if (Array.isArray(semItem.tasks) && semItem.tasks.length > 0) {
          await prisma.roadmapTask.createMany({
            data: semItem.tasks.map((t) => ({
              semesterPlanId: plan.id,
              title: String(t.title || "Mata Kuliah Pilihan"),
              category: String(t.category || "akademik"),
              credits: Number(t.credits) || 0,
              status: isCurrent ? "in_progress" : String(t.status || "planned"),
              notes: t.notes ? String(t.notes) : "Rekomendasi AI STARA",
              certaintyLevel: "estimasi",
            })),
          });
        }
      }
    } else {
      // Deterministic Fallback jika AI tidak merespon
      for (let sem = currSem; sem <= targetSem; sem++) {
        const isCurrent = sem === currSem;
        const isFinal = sem === targetSem;
        const targetCredits = isFinal
          ? Math.max(6, remainingCredits - avgCredits * (futureSemCount - 1))
          : avgCredits;

        const plan = await prisma.semesterPlan.create({
          data: {
            roadmapVersionId: version.id,
            semesterNum: sem,
            isCurrentSemester: isCurrent,
            targetCredits,
            plannedCredits: targetCredits,
            semesterLabel: `Semester ${sem} (${sem % 2 === 1 ? "Ganjil" : "Genap"})`,
          },
        });

      if (isCurrent) {
        await prisma.roadmapTask.createMany({
          data: [
            {
              semesterPlanId: plan.id,
              title: `Mata Kuliah Inti ${profile.programName} I`,
              category: "akademik",
              credits: 3,
              status: "in_progress",
              certaintyLevel: "pasti",
            },
            {
              semesterPlanId: plan.id,
              title: `Mata Kuliah Inti ${profile.programName} II`,
              category: "akademik",
              credits: 3,
              status: "in_progress",
              certaintyLevel: "pasti",
            },
            {
              semesterPlanId: plan.id,
              title: "Praktikum & Tugas Terapan",
              category: "akademik",
              credits: 3,
              status: "in_progress",
              certaintyLevel: "pasti",
            },
            {
              semesterPlanId: plan.id,
              title: "Konsultasi Rencana Studi Dosen Wali",
              category: "akademik",
              credits: 0,
              status: "done",
              certaintyLevel: "pasti",
            },
          ],
        });
      } else if (isFinal) {
        await prisma.roadmapTask.createMany({
          data: [
            {
              semesterPlanId: plan.id,
              title: "Skripsi / Tugas Akhir",
              category: "skripsi",
              credits: 6,
              status: "planned",
              certaintyLevel: "estimasi",
            },
            {
              semesterPlanId: plan.id,
              title: "Bimbingan & Revisi Draf Naskah",
              category: "skripsi",
              credits: 0,
              status: "planned",
              certaintyLevel: "estimasi",
            },
            {
              semesterPlanId: plan.id,
              title: "Sidang Tugas Akhir & Yudisium",
              category: "skripsi",
              credits: 0,
              status: "planned",
              certaintyLevel: "estimasi",
            },
          ],
        });
      } else {
        await prisma.roadmapTask.createMany({
          data: [
            {
              semesterPlanId: plan.id,
              title: sem === 6 && profile.goals === "active" ? "Program Magang MBKM Industri" : `Mata Kuliah Lanjut Semester ${sem}`,
              category: sem === 6 && profile.goals === "active" ? "magang" : "akademik",
              credits: sem === 6 && profile.goals === "active" ? 20 : 3,
              status: "planned",
              certaintyLevel: "estimasi",
            },
            {
              semesterPlanId: plan.id,
              title: `Mata Kuliah Pilihan ${profile.programName}`,
              category: "akademik",
              credits: 3,
              status: "planned",
              certaintyLevel: "estimasi",
            },
            {
              semesterPlanId: plan.id,
              title: "Eksplorasi Topik Skripsi & Calon Pembimbing",
              category: "skripsi",
              credits: 0,
              status: "planned",
              certaintyLevel: "estimasi",
            },
          ],
        });
      }
    }
  }

    return NextResponse.json({
      success: true,
      message: "Roadmap personal berhasil di-generate dari data profil!",
      roadmapId: roadmap.id,
    });
  } catch (error) {
    console.error("[API /roadmap/generate-from-profile]", error);
    return NextResponse.json(
      { error: "Gagal men-generate roadmap dari profil." },
      { status: 500 }
    );
  }
}
