import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getDefaultTasksForSemester } from "@/server/curriculum/defaults";
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
    const currSem = data.currentSemester;
    const effectiveCompletedCredits =
      currSem === 1
        ? 0
        : Math.min(data.totalCurriculumCredits, Math.max(0, data.completedCredits));
    const effectiveGpa = currSem === 1 ? 0 : Math.min(4.0, Math.max(0.0, data.gpa));
    const activeSemCredits = getDefaultTasksForSemester(currSem, data.programName, true).reduce(
      (sum, t) => sum + (t.credits || 0),
      0
    );
    let targetSem = data.goals === "fast" ? 7 : 8;
    if (currSem > targetSem) targetSem = currSem + 1;

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
        const defaultTasks = getDefaultTasksForSemester(sem, data.programName, isCurrent);
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
