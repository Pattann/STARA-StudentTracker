import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { aiProvider } from "@/server/ai/provider";
import { z } from "zod";

const ThesisReviewSchema = z.object({
  titleOrDraft: z.string().min(3).max(300),
  programName: z.string().max(100).optional(),
  interests: z.string().max(200).optional(),
  methods: z.string().max(200).optional(),
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
    const parsed = ThesisReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Judul atau draf topik belum diisi." }, { status: 400 });
    }

    const profile = await prisma.academicProfile.findUnique({
      where: { guestSessionId: session.id },
    });

    const result = await aiProvider.reviewThesisTopic({
      titleOrDraft: parsed.data.titleOrDraft,
      programName: parsed.data.programName || profile?.programName || "Teknik Informatika",
      interests: parsed.data.interests,
      methods: parsed.data.methods,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /thesis/review POST]", error);
    return NextResponse.json({ error: "Gagal mengevaluasi judul skripsi." }, { status: 500 });
  }
}
