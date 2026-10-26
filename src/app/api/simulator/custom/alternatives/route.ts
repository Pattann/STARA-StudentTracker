import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import type { AIAlternativesRequest } from "@/server/ai/provider";
import { buildCustomPlanContext } from "@/server/ai/custom-context";

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
    const ctx = await buildCustomPlanContext(session.id);
    const wish = (req.nextUrl.searchParams.get("goal") ?? "").slice(0, 300);

    const altReq: AIAlternativesRequest = {
      scenarioType: "custom",
      parameters: wish ? { keinginanMahasiswa: wish } : {},
      goalLabel: ctx.goalLabel,
      baselineSummary: `Kondisi roadmap saat ini: ${ctx.baselineSummary}. Rincian: ${ctx.roadmapOverview}`,
      scenarioSummary: wish
        ? `Mahasiswa ingin: ${wish}`
        : "Belum ada skenario spesifik; berikan rekomendasi rencana studi terbaik berdasarkan profil & roadmap.",
      semesterDelta: null,
      risks: [],
      studentProfile: ctx.studentProfile,
    };

    const { aiProvider } = await import("@/server/ai/provider");
    const result = await aiProvider.suggestAlternativeScenarios(altReq);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /simulator/custom/alternatives GET]", error);
    return NextResponse.json({ error: "Gagal menghasilkan rekomendasi." }, { status: 500 });
  }
}
