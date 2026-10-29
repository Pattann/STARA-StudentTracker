import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getDefaultTasksForSemester } from "@/server/curriculum/defaults";

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

    // Reset old roadmaps and create new roadmap in a single fast transaction
    const currSem = profile.currentSemester;
    let targetSem = profile.goals === "fast" ? 7 : 8;
    if (currSem > targetSem) targetSem = currSem + 1;

    const roadmap = await prisma.$transaction(async (tx) => {
      await tx.roadmap.deleteMany({ where: { guestSessionId: session.id } });

      const createdRoadmap = await tx.roadmap.create({
        data: {
          guestSessionId: session.id,
          title: `Roadmap Personal: ${profile.programName} (${profile.institutionName})`,
          status: "active",
        },
      });

      const version = await tx.roadmapVersion.create({
        data: {
          roadmapId: createdRoadmap.id,
          versionNum: 1,
          label: "Roadmap Auto-Generated Onboarding",
          isBaseline: true,
        },
      });

      await tx.roadmap.update({
        where: { id: createdRoadmap.id },
        data: { currentVersionId: version.id },
      });

      for (let sem = currSem; sem <= targetSem; sem++) {
        const isCurrent = sem === currSem;
        const defaultTasks = getDefaultTasksForSemester(sem, profile.programName, isCurrent);
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
            credits: t.credits,
            status: t.status,
            courseCode: t.courseCode || null,
            notes: t.notes || (t.credits > 0 ? "Kurikulum reguler" : "Milestone akademik"),
            certaintyLevel: t.certaintyLevel,
          })),
        });
      }

      return createdRoadmap;
    });

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
