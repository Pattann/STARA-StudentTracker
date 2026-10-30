import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { parseJsonSafe } from "@/lib/utils";
import { z } from "zod";
import type { AIChatRequest } from "@/server/ai/provider";

const ChatBodySchema = z.object({
  message: z.string().min(1).max(1000),
  chatHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .max(20)
    .optional()
    .default([]),
});

async function resolveSession(req: NextRequest) {
  const token = req.headers.get("x-demo-token") ?? req.nextUrl.searchParams.get("token");
  if (!token) return null;
  const session = await prisma.guestSession.findUnique({ where: { token } });
  if (!session || session.expiresAt < new Date()) return null;
  return session;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await resolveSession(req);
  if (!session) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

  try {
    const body = await req.json() as unknown;
    const parsed = ChatBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Input tidak valid." }, { status: 400 });
    }

    // Load simulation
    const sim = await prisma.simulation.findUnique({ where: { id } });
    if (!sim || sim.guestSessionId !== session.id) {
      return NextResponse.json({ error: "Simulasi tidak ditemukan." }, { status: 404 });
    }

    // Load profile for goal label
    const profile = await prisma.academicProfile.findUnique({
      where: { guestSessionId: session.id },
    });

    // Parse stored data
    const rulesResult = parseJsonSafe<{
      baseline: { remainingCredits: number; estimatedGraduationSemester: number | null };
      scenario: { remainingCredits: number; estimatedGraduationSemester: number | null };
      diff: { semesterDelta: number | null; creditsDelta: number };
    }>(sim.rulesResult, {
      baseline: { remainingCredits: 0, estimatedGraduationSemester: null },
      scenario: { remainingCredits: 0, estimatedGraduationSemester: null },
      diff: { semesterDelta: null, creditsDelta: 0 },
    });

    const explanation = parseJsonSafe<{
      summary: string;
      benefits: string[];
      risks: string[];
      tradeoffs: string[];
      recommendedNextSteps: string[];
      questionsForCampus: string[];
    }>(sim.aiExplanation, {
      summary: "",
      benefits: [],
      risks: [],
      tradeoffs: [],
      recommendedNextSteps: [],
      questionsForCampus: [],
    });

    const chatReq: AIChatRequest = {
      simulationContext: {
        scenarioType: sim.scenarioType,
        title: sim.title ?? "Simulasi Skenario",
        baselineSummary: `Baseline: ${rulesResult.baseline.remainingCredits} SKS tersisa, estimasi lulus semester ${rulesResult.baseline.estimatedGraduationSemester ?? "?"}`,
        scenarioSummary: `Skenario: ${rulesResult.scenario.remainingCredits} SKS tersisa, estimasi lulus semester ${rulesResult.scenario.estimatedGraduationSemester ?? "?"}`,
        semesterDelta: rulesResult.diff.semesterDelta,
        creditsDelta: rulesResult.diff.creditsDelta,
        goalLabel: profile?.goals ?? "Lulus tepat waktu",
      },
      explanation,
      chatHistory: parsed.data.chatHistory,
      userMessage: parsed.data.message,
    };

    const { aiProvider } = await import("@/server/ai/provider");
    const result = await aiProvider.chatAboutSimulation(chatReq);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /simulator/[id]/chat POST]", error);
    return NextResponse.json({ error: "Gagal memproses pertanyaan." }, { status: 500 });
  }
}
