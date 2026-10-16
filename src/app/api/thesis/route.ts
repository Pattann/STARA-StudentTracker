import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { aiProvider } from "@/server/ai/provider";
import { z } from "zod";

const ThesisAssessmentSchema = z.object({
  interests: z.array(z.string().min(1)).min(1).max(5),
  methods: z.array(z.string()).default([]),
  dataAvailability: z.string().min(1).max(200),
  timeAvailable: z.string().min(1).max(100),
  skills: z.array(z.string()).default([]),
  constraints: z.string().max(500).optional(),
  programName: z.string().min(1).max(100),
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
    const body = await req.json() as unknown;
    const parsed = ThesisAssessmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid.", details: parsed.error.flatten() }, { status: 400 });
    }

    const aiResult = await aiProvider.generateThesisDirections(parsed.data);

    return NextResponse.json({
      directions: aiResult.directions,
      isAiGenerated: aiResult.isAiGenerated,
      fallbackReason: aiResult.fallbackReason,
    });
  } catch (error) {
    console.error("[API /thesis POST]", error);
    return NextResponse.json({ error: "Gagal memproses permintaan." }, { status: 500 });
  }
}
