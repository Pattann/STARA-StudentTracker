import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";
import type { AIChatRequest } from "@/server/ai/provider";
import { buildCustomPlanContext } from "@/server/ai/custom-context";

const ChatBodySchema = z.object({
  message: z.string().min(1).max(1000),
  chatHistory: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .max(20)
    .optional()
    .default([]),
  planContext: z
    .object({
      userPrompt: z.string().optional(),
      categoryBadge: z.string().optional(),
      detectedGoal: z.string().optional(),
      formData: z.record(z.string()).optional(),
      verdictTitle: z.string().optional(),
      impactSummary: z.string().optional(),
    })
    .optional(),
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
    const parsed = ChatBodySchema.safeParse((await req.json()) as unknown);
    if (!parsed.success) {
      return NextResponse.json({ error: "Input tidak valid.", details: parsed.error.flatten() }, { status: 400 });
    }

    const ctx = await buildCustomPlanContext(session.id);
    const plan = parsed.data.planContext;

    const formDetails = plan?.formData
      ? Object.entries(plan.formData)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")
      : "";

    const scenarioSummary = plan?.userPrompt
      ? `Rencana: "${plan.userPrompt}" (Kategori: ${plan.categoryBadge || "Kustom"}, Target: ${plan.detectedGoal || "Kegiatan"}). Parameter: ${formDetails}. Evaluasi: ${plan.verdictTitle || "Sedang disusun"} - ${plan.impactSummary || ""}`
      : "Mahasiswa sedang merancang rencana studi kustom bersama AI.";

    const chatReq: AIChatRequest = {
      simulationContext: {
        scenarioType: "custom",
        title: plan?.detectedGoal || "Rencana Kustom dengan AI",
        baselineSummary: `Kondisi roadmap saat ini: ${ctx.baselineSummary}. Rincian: ${ctx.roadmapOverview}`,
        scenarioSummary,
        semesterDelta: null,
        creditsDelta: 0,
        goalLabel: ctx.goalLabel,
      },
      explanation: {
        summary: plan?.userPrompt ? `Diskusi rencana "${plan.userPrompt}"` : "Diskusi rencana studi kustom berdasarkan roadmap aktif mahasiswa.",
        benefits: [],
        risks: [],
        tradeoffs: [],
        recommendedNextSteps: [],
        questionsForCampus: [],
      },
      chatHistory: parsed.data.chatHistory,
      userMessage: parsed.data.message,
    };

    const { aiProvider } = await import("@/server/ai/provider");
    const result = await aiProvider.chatAboutSimulation(chatReq);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /simulator/custom/chat POST]", error);
    return NextResponse.json({ error: "Gagal memproses pertanyaan." }, { status: 500 });
  }
}
