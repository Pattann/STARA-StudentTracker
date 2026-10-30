import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getDefaultTasksForSemester } from "@/server/curriculum/defaults";
import { getCompletedCreditsBounds } from "@/lib/academic-rules";
import { z } from "zod";

const OnboardingSchema = z.object({
  institutionName: z.string().min(1, "Nama institusi wajib diisi").max(200),
  facultyName: z.string().max(200).optional().default(""),
  programName: z.string().min(1, "Program studi wajib diisi").max(200),
  educationLevel: z.string().default("S1"),
  entryYear: z.coerce.number().int().min(2015).max(2030),
  currentSemester: z.coerce.number().int().min(1).max(14),
  totalCurriculumCredits: z.coerce.number().int().min(80).max(200),
  completedCredits: z.coerce.number().int().min(0).max(200),
  gpa: z.coerce.number().min(0).max(4),
  goals: z.enum(["fast", "balanced", "active", "relaxed"]).default("balanced"),
  interests: z.string().max(500).optional().default(""),
  weeklyHours: z.coerce.number().int().min(0).max(80).default(20),
  token: z.string().optional(),
});

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    const parsed = OnboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data formulir tidak valid.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const currSem = data.currentSemester;
    const sksBounds = getCompletedCreditsBounds(currSem, data.totalCurriculumCredits);

    if (!sksBounds.isLocked) {
      if (data.completedCredits < sksBounds.min || data.completedCredits > sksBounds.max) {
        return NextResponse.json(
          {
            error: `Untuk Semester ${currSem}, SKS tuntas harus diisi minimal ${sksBounds.min} SKS dan maksimal ${sksBounds.max} SKS (17-24 SKS per semester lulus).`,
          },
          { status: 400 }
        );
      }
    }

    // Resolve or create guest session
    let sessionToken = data.token;
    let sessionId: string | null = null;

    if (sessionToken) {
      const existing = await prisma.guestSession.findUnique({
        where: { token: sessionToken },
      });
      if (existing && existing.expiresAt > new Date()) {
        sessionId = existing.id;
      }
    }

    if (!sessionId) {
      sessionToken = generateToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      const newSession = await prisma.guestSession.create({
        data: { token: sessionToken, expiresAt },
      });
      sessionId = newSession.id;
    } else {
      // Clean up previous roadmaps & profiles for a fresh customized start
      await prisma.roadmap.deleteMany({ where: { guestSessionId: sessionId } });
      await prisma.academicProfile.deleteMany({ where: { guestSessionId: sessionId } });
      await prisma.reminder.deleteMany({ where: { guestSessionId: sessionId } });
    }

    // Atomic fast creation: Academic Profile + Reminders + Initial Roadmap
    const effectiveCompletedCredits = sksBounds.isLocked
      ? 0
      : Math.min(data.totalCurriculumCredits, Math.max(0, data.completedCredits));
    const effectiveGpa = sksBounds.isLocked ? 0 : Math.min(4.0, Math.max(0.0, data.gpa));
    const remainingCredits = Math.max(0, data.totalCurriculumCredits - effectiveCompletedCredits);
    const activeSemCredits =
      currSem > 8
        ? Math.min(18, Math.max(0, remainingCredits))
        : getDefaultTasksForSemester(currSem, data.programName, true).reduce(
            (sum, t) => sum + (t.credits || 0),
            0
          );
    let targetSem = data.goals === "fast" ? 7 : 8;
    if (currSem >= targetSem) {
      targetSem = remainingCredits <= 20 ? currSem : currSem + 1;
    }
    const pastSemCount = Math.max(0, currSem - 1);
    const pastBaseCredits = pastSemCount > 0 ? Math.floor(effectiveCompletedCredits / pastSemCount) : 0;
    const pastRemainder = pastSemCount > 0 ? effectiveCompletedCredits % pastSemCount : 0;

    await prisma.$transaction(async (tx) => {
      // 1. Create Academic Profile (TAK tracking completely disabled)
      await tx.academicProfile.create({
        data: {
          guestSessionId: sessionId,
          institutionName: data.institutionName,
          facultyName: data.facultyName || "Fakultas Utama",
          programName: data.programName,
          educationLevel: data.educationLevel,
          entryYear: data.entryYear,
          currentSemester: data.currentSemester,
          totalCurriculumCredits: data.totalCurriculumCredits,
          completedCredits: effectiveCompletedCredits,
          inProgressCredits: Math.min(
            activeSemCredits > 0 ? activeSemCredits : 18,
            Math.max(0, data.totalCurriculumCredits - effectiveCompletedCredits)
          ),
          gpa: effectiveGpa,
          goals: data.goals,
          interests: JSON.stringify(data.interests ? data.interests.split(",").map((s) => s.trim()) : []),
          takEnabled: false,
          takTarget: null,
          weeklyHours: data.weeklyHours,
        },
      });

      // 2. Starter Reminders
      await tx.reminder.createMany({
        data: [
          {
            guestSessionId: sessionId,
            title: `Pengisian KRS Semester ${currSem + 1}`,
            category: "krs",
            deadline: "2025-02-15",
            isOfficial: false,
            notes: "Pastikan syarat prasyarat mata kuliah terpenuhi sebelum finalisasi KRS.",
          },
          {
            guestSessionId: sessionId,
            title: "Evaluasi Nilai & Target IPK Tengah Semester",
            category: "akademik",
            deadline: "2025-04-10",
            isOfficial: false,
            notes: "Tinjau performa kuis dan tugas besar mata kuliah inti.",
          },
        ],
      });

      // 3. Immediately Generate Active Roadmap with Semesters & Tasks
      const createdRoadmap = await tx.roadmap.create({
        data: {
          guestSessionId: sessionId,
          title: `Roadmap Personal: ${data.programName} (${data.institutionName})`,
          status: "active",
        },
      });

      const version = await tx.roadmapVersion.create({
        data: {
          roadmapId: createdRoadmap.id,
          versionNum: 1,
          label: "Roadmap Auto-Generated Onboarding",
          isBaseline: true,
          isDraft: false,
        },
      });

      await tx.roadmap.update({
        where: { id: createdRoadmap.id },
        data: { currentVersionId: version.id },
      });

      for (let sem = 1; sem <= targetSem; sem++) {
        const isCurrent = sem === currSem;
        const isPast = sem < currSem;
        const defaultTasks =
          isPast && sem >= 8
            ? [
                { title: `Mata Kuliah Pilihan Lanjut I (Sem ${sem})`, category: "akademik" as const, credits: 3, status: "done" as const, certaintyLevel: "pasti" as const, notes: "Peminatan Lanjut" },
                { title: `Mata Kuliah Pilihan Lanjut II (Sem ${sem})`, category: "akademik" as const, credits: 3, status: "done" as const, certaintyLevel: "pasti" as const, notes: "Peminatan Lanjut" },
                { title: `Mata Kuliah Pengayaan Kompetensi (Sem ${sem})`, category: "akademik" as const, credits: 3, status: "done" as const, certaintyLevel: "pasti" as const, notes: "Pengayaan" },
                { title: `Praktikum & Proyek Mandiri (Sem ${sem})`, category: "akademik" as const, credits: 3, status: "done" as const, certaintyLevel: "pasti" as const, notes: "Keterampilan Lanjutan" },
                { title: `Seminar & Persiapan Riset (Sem ${sem})`, category: "skripsi" as const, credits: 3, status: "done" as const, certaintyLevel: "pasti" as const, notes: "Persiapan Tugas Akhir" },
              ]
            : !isPast && sem > 8 && sem === targetSem
            ? [
                {
                  title: "Tugas Akhir / Skripsi",
                  category: "skripsi" as const,
                  credits: Math.max(2, Math.min(6, remainingCredits || 6)),
                  status: (isCurrent ? "in_progress" : "planned") as "in_progress" | "planned",
                  certaintyLevel: "pasti" as const,
                  notes: "Penyelesaian Tugas Akhir",
                },
                ...(remainingCredits > 6
                  ? [
                      {
                        title: `Penyelesaian SKS Pilihan Semester ${sem}`,
                        category: "akademik" as const,
                        credits: Math.min(14, remainingCredits - 6),
                        status: (isCurrent ? "in_progress" : "planned") as "in_progress" | "planned",
                        certaintyLevel: "estimasi" as const,
                        notes: "Pemenuhan Kurikulum",
                      },
                    ]
                  : []),
                {
                  title: "Sidang Tugas Akhir & Yudisium Kelulusan",
                  category: "skripsi" as const,
                  credits: 0,
                  status: (isCurrent ? "in_progress" : "planned") as "in_progress" | "planned",
                  certaintyLevel: "estimasi" as const,
                  notes: "Milestone Kelulusan",
                },
              ]
            : getDefaultTasksForSemester(sem, data.programName, isCurrent).map((t) => ({ ...t }));

        if (isPast && pastSemCount > 0) {
          const desiredPastCredits = pastBaseCredits + (sem <= pastRemainder ? 1 : 0);
          const courseIndices = defaultTasks
            .map((t, idx) => (t.credits > 0 ? idx : -1))
            .filter((idx) => idx >= 0);

          if (courseIndices.length > 0) {
            let currentSum = defaultTasks.reduce((sum, t) => sum + (t.credits || 0), 0);
            let cursor = 0;
            let guard = 0;
            while (currentSum !== desiredPastCredits && guard < 100) {
              const targetIdx = courseIndices[cursor % courseIndices.length];
              if (currentSum < desiredPastCredits && defaultTasks[targetIdx].credits < 6) {
                defaultTasks[targetIdx].credits += 1;
                currentSum += 1;
              } else if (currentSum > desiredPastCredits && defaultTasks[targetIdx].credits > 1) {
                defaultTasks[targetIdx].credits -= 1;
                currentSum -= 1;
              }
              cursor += 1;
              guard += 1;
            }
          }
        }

        const academicCredits = defaultTasks.reduce((sum, t) => sum + (t.credits || 0), 0);

        const plan = await tx.semesterPlan.create({
          data: {
            roadmapVersionId: version.id,
            semesterNum: sem,
            isCurrentSemester: isCurrent,
            targetCredits: academicCredits > 0 ? academicCredits : (sem === 8 ? 8 : 20),
            plannedCredits: academicCredits > 0 ? academicCredits : (sem === 8 ? 8 : 20),
            semesterLabel: `Semester ${sem} (${sem % 2 === 1 ? "Ganjil" : "Genap"})`,
          },
        });

        await tx.roadmapTask.createMany({
          data: defaultTasks.map((t) => ({
            semesterPlanId: plan.id,
            title: t.title,
            category: t.category,
            itemType: t.credits > 0 ? "COURSE" : "ACTIVITY",
            credits: t.credits,
            status: isPast ? "done" : t.status,
            courseCode: t.courseCode || null,
            notes: t.notes || (t.credits > 0 ? "Kurikulum reguler" : "Milestone akademik"),
            certaintyLevel: isPast ? "fixed" : t.certaintyLevel,
          })),
        });
      }
    });

    return NextResponse.json({
      success: true,
      token: sessionToken,
      redirectUrl: "/app?welcome=1",
    });
  } catch (error) {
    console.error("[API /onboarding POST]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses onboarding." },
      { status: 500 }
    );
  }
}
