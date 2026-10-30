import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { aiProvider } from "@/server/ai/provider";
import { buildCustomPlanContext } from "@/server/ai/custom-context";
import { z } from "zod";

const SimulatePlanSchema = z.object({
  userPrompt: z.string().min(1),
  categoryBadge: z.string().default("Rencana Kustom"),
  detectedGoal: z.string().default("Rencana Studi"),
  formData: z.record(z.string()),
});

async function resolveSession(req: NextRequest) {
  const token = req.headers.get("x-demo-token") ?? req.nextUrl.searchParams.get("token");
  if (!token) return null;
  const session = await prisma.guestSession.findUnique({ where: { token } });
  if (!session || session.expiresAt < new Date()) return null;
  return session;
}

export async function POST(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

  try {
    const body = (await req.json()) as unknown;
    const parsed = SimulatePlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data simulasi tidak valid." }, { status: 400 });
    }

    const ctx = await buildCustomPlanContext(session.id);

    const result = await aiProvider.simulateCustomPlan({
      userPrompt: parsed.data.userPrompt,
      categoryBadge: parsed.data.categoryBadge,
      detectedGoal: parsed.data.detectedGoal,
      formData: parsed.data.formData,
      studentProfile: ctx.studentProfile,
      baselineSummary: ctx.baselineSummary,
      roadmapOverview: ctx.roadmapOverview,
    });

    // Save to Simulation model so it appears in history and can be applied to roadmap!
    let simulationId: string | null = null;
    try {
      const roadmap = await prisma.roadmap.findFirst({
        where: { guestSessionId: session.id },
        orderBy: { createdAt: "desc" },
      });

      if (roadmap) {
        const simRecord = await prisma.simulation.create({
          data: {
            guestSessionId: session.id,
            roadmapId: roadmap.id,
            scenarioType: "custom",
            title: parsed.data.detectedGoal || "Rencana Kustom dengan AI",
            parameters: JSON.stringify({
              userPrompt: parsed.data.userPrompt,
              categoryBadge: parsed.data.categoryBadge,
              formData: parsed.data.formData,
            }),
            aiExplanation: JSON.stringify(result),
            status: "calculated",
          },
        });
        simulationId = simRecord.id;
      }
    } catch (saveErr) {
      console.warn("[Simulate route] Could not save to history:", saveErr);
    }

    return NextResponse.json({ ...result, simulationId });
  } catch (error) {
    console.error("[API /simulator/custom/simulate POST]", error);
    return NextResponse.json({ error: "Gagal menjalankan simulasi rencana kustom." }, { status: 500 });
  }
}
