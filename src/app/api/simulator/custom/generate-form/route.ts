import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { aiProvider } from "@/server/ai/provider";
import { buildCustomPlanContext } from "@/server/ai/custom-context";
import { z } from "zod";

const GenerateFormSchema = z.object({
  userPrompt: z.string().min(3).max(600),
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
    const parsed = GenerateFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Input rencana tidak valid.", details: parsed.error.flatten() }, { status: 400 });
    }

    const ctx = await buildCustomPlanContext(session.id);

    const result = await aiProvider.generateCustomPlanForms({
      userPrompt: parsed.data.userPrompt,
      studentProfile: ctx.studentProfile,
      baselineSummary: ctx.baselineSummary,
      roadmapOverview: ctx.roadmapOverview,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /simulator/custom/generate-form POST]", error);
    return NextResponse.json({ error: "Gagal menyusun formulir rencana AI." }, { status: 500 });
  }
}
