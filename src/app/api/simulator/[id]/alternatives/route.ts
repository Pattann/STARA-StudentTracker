import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { parseJsonSafe } from "@/lib/utils";
import type { AIAlternativesRequest } from "@/server/ai/provider";

async function resolveSession(req: NextRequest) {
  const token = req.headers.get("x-demo-token") ?? req.nextUrl.searchParams.get("token");
  if (!token) return null;
  const session = await prisma.guestSession.findUnique({ where: { token } });
  if (!session || session.expiresAt < new Date()) return null;
  return session;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await resolveSession(req);
  if (!session) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

  try {
    // Load simulation
    const sim = await prisma.simulation.findUnique({ where: { id } });
    if (!sim || sim.guestSessionId !== session.id) {
      return NextResponse.json({ error: "Simulasi tidak ditemukan." }, { status: 404 });
    }

    // Load profile
    const profile = await prisma.academicProfile.findUnique({
      where: { guestSessionId: session.id },
    });

    const rulesResult = parseJsonSafe<{
      baseline: { remainingCredits: number; estimatedGraduationSemester: number | null };
      scenario: { remainingCredits: number; estimatedGraduationSemester: number | null };
      diff: { semesterDelta: number | null; creditsDelta: number; risks: string[] };
    }>(sim.rulesResult, {
      baseline: { remainingCredits: 0, estimatedGraduationSemester: null },
      scenario: { remainingCredits: 0, estimatedGraduationSemester: null },
      diff: { semesterDelta: null, creditsDelta: 0, risks: [] },
    });

    const explanation = parseJsonSafe<{ risks: string[] }>(sim.aiExplanation, { risks: [] });
    const parameters = parseJsonSafe<Record<string, unknown>>(sim.parameters, {});

    const altReq: AIAlternativesRequest = {
      scenarioType: sim.scenarioType,
      parameters,
      goalLabel: profile?.goals ?? "Lulus tepat waktu",
      baselineSummary: `Baseline: ${rulesResult.baseline.remainingCredits} SKS tersisa, estimasi lulus semester ${rulesResult.baseline.estimatedGraduationSemester ?? "?"}`,
      scenarioSummary: `Skenario: ${rulesResult.scenario.remainingCredits} SKS tersisa, estimasi lulus semester ${rulesResult.scenario.estimatedGraduationSemester ?? "?"}`,
      semesterDelta: rulesResult.diff.semesterDelta,
      risks: [...(rulesResult.diff.risks ?? []), ...(explanation.risks ?? [])],
      studentProfile: profile
        ? {
            programName: profile.programName,
            institutionName: profile.institutionName,
            currentSemester: profile.currentSemester,
            interests: profile.interests ?? "Umum",
          }
        : undefined,
    };

    const { aiProvider } = await import("@/server/ai/provider");
    const result = await aiProvider.suggestAlternativeScenarios(altReq);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /simulator/[id]/alternatives GET]", error);
    return NextResponse.json({ error: "Gagal menghasilkan alternatif." }, { status: 500 });
  }
}
