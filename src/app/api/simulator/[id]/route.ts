import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { parseJsonSafe } from "@/lib/utils";
import { z } from "zod";

async function resolveSession(req: NextRequest) {
  const token = req.headers.get("x-demo-token") ?? req.nextUrl.searchParams.get("token");
  if (!token) return null;
  const session = await prisma.guestSession.findUnique({ where: { token } });
  if (!session || session.expiresAt < new Date()) return null;
  return session;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await resolveSession(req);
  if (!session) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

  const sim = await prisma.simulation.findUnique({ where: { id } });
  if (!sim || sim.guestSessionId !== session.id) {
    return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ simulation: sim });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await resolveSession(req);
  if (!session) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

  const body = await req.json() as { action?: string };

  if (body.action === "apply") {
    const sim = await prisma.simulation.findUnique({ where: { id } });
    if (!sim || sim.guestSessionId !== session.id) {
      return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
    }
    if (sim.status === "applied") {
      return NextResponse.json({ error: "Skenario ini sudah diterapkan." }, { status: 400 });
    }

    // Get current roadmap version
    const roadmap = await prisma.roadmap.findUnique({ where: { id: sim.roadmapId } });
    if (!roadmap?.currentVersionId) {
      return NextResponse.json({ error: "Roadmap tidak ditemukan." }, { status: 404 });
    }

    const currentVersion = await prisma.roadmapVersion.findUnique({
      where: { id: roadmap.currentVersionId },
      include: { semesterPlans: { include: { tasks: true } } },
    });
    if (!currentVersion) {
      return NextResponse.json({ error: "Versi roadmap tidak ditemukan." }, { status: 404 });
    }

    // Create new version
    const maxVersion = await prisma.roadmapVersion.findFirst({
      where: { roadmapId: roadmap.id },
      orderBy: { versionNum: "desc" },
    });
    const nextVersionNum = (maxVersion?.versionNum ?? 0) + 1;

    const params = parseJsonSafe<Record<string, unknown>>(sim.parameters as string, {});
    const label = `Skenario ${sim.scenarioType} diterapkan`;

    const newVersion = await prisma.$transaction(async (tx) => {
      const nv = await tx.roadmapVersion.create({
        data: {
          roadmapId: roadmap.id,
          versionNum: nextVersionNum,
          label,
          appliedFromSimulationId: sim.id,
        },
      });

      // Clone current semester plans
      for (const sp of currentVersion.semesterPlans) {
        const offset = sim.scenarioType === "cuti"
          ? (sp.semesterNum >= (params.startSemester as number ?? 1) ? (params.durationSemesters as number ?? 1) : 0)
          : 0;

        const newPlan = await tx.semesterPlan.create({
          data: {
            roadmapVersionId: nv.id,
            semesterNum: sp.semesterNum + offset,
            semesterLabel: sp.semesterLabel,
            targetCredits: sp.targetCredits,
            plannedCredits: sp.plannedCredits,
            isCurrentSemester: sp.isCurrentSemester,
            notes: sp.notes,
          },
        });

        for (const task of sp.tasks) {
          await tx.roadmapTask.create({
            data: {
              semesterPlanId: newPlan.id,
              title: task.title,
              description: task.description,
              itemType: task.itemType || "COURSE",
              category: task.category,
              credits: task.credits,
              priority: task.priority,
              status: task.status,
              targetDate: task.targetDate,
              completedDate: task.completedDate,
              courseCode: task.courseCode,
              notes: task.notes,
              activityPeriod: task.activityPeriod,
              weeklyHours: task.weeklyHours,
              dataSource: task.dataSource,
              certaintyLevel: task.certaintyLevel,
              prerequisites: task.prerequisites,
            },
          });
        }
      }

      // Add scenario task if magang, mbkm, exchange, or advanced_course
      if (sim.scenarioType === "magang" || sim.scenarioType === "mbkm" || sim.scenarioType === "exchange") {
        const startSem = (params.startSemester as number) || 5;
        const dur = (params.durationSemesters as number) || 1;
        const convertedCredits = params.creditsToConvert ? Number(params.creditsToConvert) : 0;
        const isConfirmed = params.conversionStatus === "dikonfirmasi";

        const targetPlan = await tx.semesterPlan.findFirst({
          where: { roadmapVersionId: nv.id, semesterNum: startSem },
        });

        if (targetPlan) {
          await tx.roadmapTask.create({
            data: {
              semesterPlanId: targetPlan.id,
              title: sim.title || `Program ${sim.scenarioType.toUpperCase()}`,
              description: `Hasil penerapan simulasi ${sim.scenarioType}.`,
              itemType: "ACTIVITY",
              category: "karier",
              credits: isConfirmed ? convertedCredits : 0,
              priority: "high",
              status: "planned",
              activityPeriod: `${dur} Semester`,
              weeklyHours: 40,
              dataSource: "mahasiswa",
              certaintyLevel: isConfirmed ? "pasti" : "estimasi",
            },
          });
        }
      }

      // Recalculate plannedCredits for all plans in the new version
      const allNewPlans = await tx.semesterPlan.findMany({
        where: { roadmapVersionId: nv.id },
        include: { tasks: true },
      });

      for (const p of allNewPlans) {
        const planned = p.tasks
          .filter((t) => t.status !== "cancelled" && (t.itemType === "COURSE" || t.category === "akademik" || t.credits > 0))
          .reduce((sum, t) => sum + (Number(t.credits) || 0), 0);

        await tx.semesterPlan.update({
          where: { id: p.id },
          data: { plannedCredits: planned },
        });
      }

      await tx.roadmap.update({
        where: { id: roadmap.id },
        data: { currentVersionId: nv.id },
      });

      await tx.simulation.update({
        where: { id: sim.id },
        data: { status: "applied", appliedVersionId: nv.id },
      });

      return nv;
    });

    return NextResponse.json({ success: true, newVersionId: newVersion.id });
  }

  if (body.action === "archive" || body.action === "cancel") {
    const sim = await prisma.simulation.findUnique({ where: { id } });
    if (!sim || sim.guestSessionId !== session.id) {
      return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
    }
    await prisma.simulation.update({
      where: { id },
      data: { status: "archived" },
    });
    return NextResponse.json({ success: true, message: "Simulasi diarsipkan." });
  }

  return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
}
