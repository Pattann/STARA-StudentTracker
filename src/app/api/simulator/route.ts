import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { calculateFullRoadmap, applyScenarioToDraftRoadmap, compareRoadmaps, generateRuleBasedTradeoffs } from "@/server/rules-engine";
import { parseJsonSafe } from "@/lib/utils";
import { z } from "zod";
import { getDefaultTasksForSemester } from "@/server/curriculum/defaults";

const ScenarioParamsSchema = z.object({
  type: z.enum(["magang", "mbkm", "advanced_course", "exchange", "cuti"]),
  startSemester: z.number().int().min(1).max(14),
  durationSemesters: z.number().int().min(1).max(4),
  creditsToConvert: z.number().int().min(0).max(40).optional(),
  conversionStatus: z.enum(["dikonfirmasi", "belum_diketahui", "tidak_ada"]).optional(),
  conflictsWithRegular: z.boolean().optional(),
  title: z.string().max(100).optional(),
});

async function resolveSession(req: NextRequest) {
  const token = req.headers.get("x-demo-token") ?? req.nextUrl.searchParams.get("token");
  if (!token) return null;
  const session = await prisma.guestSession.findUnique({ where: { token } });
  if (!session || session.expiresAt < new Date()) return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

  try {
    const simulations = await prisma.simulation.findMany({
      where: { guestSessionId: session.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ simulations });
  } catch {
    return NextResponse.json({ error: "Gagal memuat simulasi." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

  try {
    const body = await req.json() as unknown;
    const parsed = ScenarioParamsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Parameter tidak valid.", details: parsed.error.flatten() }, { status: 400 });
    }

    const params = parsed.data;

    // Get or auto-initialize profile
    let profile = await prisma.academicProfile.findUnique({
      where: { guestSessionId: session.id },
    });

    if (!profile) {
      profile = await prisma.academicProfile.create({
        data: {
          guestSessionId: session.id,
          institutionName: "Telkom University",
          programName: "S1 Informatika",
          educationLevel: "S1",
          entryYear: 2023,
          currentSemester: 5,
          totalCurriculumCredits: 144,
          completedCredits: 84,
          inProgressCredits: 20,
          gpa: 3.65,
          goals: "balanced",
          interests: "Software Engineering & Artificial Intelligence",
        },
      });
    }

    // Get or auto-initialize roadmap
    let roadmap = await prisma.roadmap.findFirst({
      where: { guestSessionId: session.id },
      orderBy: { createdAt: "desc" },
    });

    if (!roadmap) {
      roadmap = await prisma.roadmap.create({
        data: {
          guestSessionId: session.id,
          title: `Roadmap Akademik: ${profile.programName}`,
          status: "active",
        },
      });

      const newVersion = await prisma.roadmapVersion.create({
        data: {
          roadmapId: roadmap.id,
          versionNum: 1,
          label: "Baseline Akademik",
          isBaseline: true,
        },
      });

      await prisma.roadmap.update({
        where: { id: roadmap.id },
        data: { currentVersionId: newVersion.id },
      });

      for (let s = profile.currentSemester; s <= 8; s++) {
        const defaultTasks = getDefaultTasksForSemester(s, profile.programName, s === profile.currentSemester);
        const academicCredits = defaultTasks.reduce((sum, t) => sum + (t.credits || 0), 0);

        const plan = await prisma.semesterPlan.create({
          data: {
            roadmapVersionId: newVersion.id,
            semesterNum: s,
            isCurrentSemester: s === profile.currentSemester,
            targetCredits: academicCredits > 0 ? academicCredits : (s === 8 ? 8 : 20),
            plannedCredits: academicCredits > 0 ? academicCredits : (s === 8 ? 8 : 20),
            semesterLabel: `Semester ${s} (${s % 2 === 1 ? "Ganjil" : "Genap"})`,
          },
        });

        await prisma.roadmapTask.createMany({
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
    }

    const version = roadmap.currentVersionId
      ? await prisma.roadmapVersion.findUnique({
          where: { id: roadmap.currentVersionId },
          include: {
            semesterPlans: {
              include: { tasks: true },
              orderBy: { semesterNum: "asc" },
            },
          },
        })
      : null;

    if (!version || !profile) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    const roadmapData = {
      totalCurriculumCredits: profile.totalCurriculumCredits,
      completedCredits: profile.completedCredits,
      inProgressCredits: profile.inProgressCredits,
      currentSemester: profile.currentSemester,
      goals: profile.goals,
      semesterPlans: version.semesterPlans.map((sp) => ({
        semesterNum: sp.semesterNum,
        targetCredits: sp.targetCredits,
        plannedCredits: sp.plannedCredits,
        tasks: sp.tasks.map((t) => ({
          id: t.id,
          credits: t.credits,
          status: t.status,
          category: t.category,
          prerequisites: parseJsonSafe<string[]>(t.prerequisites, []),
        })),
      })),
    };

    // Calculate baseline
    const baseline = calculateFullRoadmap(roadmapData);

    // Apply scenario to draft
    const scenarioRoadmapData = applyScenarioToDraftRoadmap(roadmapData, params);
    const scenarioResult = calculateFullRoadmap(scenarioRoadmapData);

    // Compare
    const diff = compareRoadmaps(baseline, scenarioResult, params);

    // Generate explanation (AI with rule-based fallback)
    const { aiProvider } = await import("@/server/ai/provider");
    let explanation;
    try {
      explanation = await aiProvider.explainSimulation({
        goalLabel: profile.goals,
        scenarioType: params.type,
        parameters: params as Record<string, unknown>,
        baselineSummary: `Baseline: ${baseline.remainingCredits} SKS tersisa menuju estimasi lulus semester ${baseline.estimatedGraduationSemester ?? 8}.`,
        scenarioSummary: `Skenario: ${scenarioResult.remainingCredits} SKS tersisa menuju estimasi lulus semester ${scenarioResult.estimatedGraduationSemester ?? 8}.`,
        conflicts: [...diff.risks, ...scenarioResult.conflicts],
        unknowns: diff.unknowns,
        studentProfile: {
          institutionName: profile.institutionName,
          programName: profile.programName,
          educationLevel: profile.educationLevel,
          currentSemester: profile.currentSemester,
          completedCredits: profile.completedCredits,
          totalCurriculumCredits: profile.totalCurriculumCredits,
          gpa: profile.gpa ?? 3.5,
          interests: profile.interests ?? "",
        },
      });
    } catch {
      explanation = generateRuleBasedTradeoffs(params.type, diff);
    }

    const rulesResult = {
      baseline,
      scenario: scenarioResult,
      diff,
    };

    // Save simulation
    const sim = await prisma.simulation.create({
      data: {
        guestSessionId: session.id,
        roadmapId: roadmap.id,
        baselineVersionId: roadmap.currentVersionId ?? undefined,
        scenarioType: params.type,
        title: params.title ?? `Simulasi ${params.type}`,
        parameters: JSON.stringify(params),
        rulesResult: JSON.stringify(rulesResult),
        aiExplanation: JSON.stringify(explanation),
        assumptions: JSON.stringify(explanation.assumptions),
        unknowns: JSON.stringify(diff.unknowns),
        status: "calculated",
      },
    });

    return NextResponse.json({
      simulation: sim,
      baseline,
      scenario: scenarioResult,
      diff,
      explanation,
    });
  } catch (error) {
    console.error("[API /simulator POST]", error);
    return NextResponse.json({ error: "Gagal menjalankan simulasi." }, { status: 500 });
  }
}
