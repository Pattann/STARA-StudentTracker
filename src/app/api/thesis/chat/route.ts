import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { aiProvider } from "@/server/ai/provider";
import { z } from "zod";

const ThesisChatSchema = z.object({
  message: z.string().min(1).max(1000),
  chatHistory: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .max(20)
    .optional()
    .default([]),
  topicContext: z.string().max(300).optional(),
  programName: z.string().max(100).optional(),
  thesisProgress: z
    .object({
      completedStagesCount: z.number(),
      totalStages: z.number(),
      currentActiveStageNumber: z.number(),
      currentActiveStageTitle: z.string(),
      nextStageTitle: z.string().optional(),
      approvedTitle: z.string().optional(),
      completedStageTitles: z.array(z.string()),
      notesOrArtifacts: z.record(z.string()).optional(),
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
    const body = (await req.json()) as unknown;
    const parsed = ThesisChatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
    }

    const profile = await prisma.academicProfile.findUnique({
      where: { guestSessionId: session.id },
    });

    const result = await aiProvider.chatAboutThesis({
      programName: parsed.data.programName || profile?.programName || "Teknik Informatika",
      topicContext: parsed.data.topicContext,
      thesisProgress: parsed.data.thesisProgress,
      chatHistory: parsed.data.chatHistory,
      userMessage: parsed.data.message,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /thesis/chat POST]", error);
    return NextResponse.json({ error: "Gagal memproses percakapan skripsi." }, { status: 500 });
  }
}
