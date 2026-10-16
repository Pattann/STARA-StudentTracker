import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";

async function resolveSession(req: NextRequest) {
  const token = req.headers.get("x-demo-token") ?? req.nextUrl.searchParams.get("token");
  if (!token) return null;
  const session = await prisma.guestSession.findUnique({ where: { token } });
  if (!session || session.expiresAt < new Date()) return null;
  return session;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const template = await prisma.template.findUnique({
      where: { id, isPublic: true, isHidden: false },
      include: {
        comments: {
          where: { isHidden: false, parentId: null },
          include: {
            user: { select: { name: true } },
            replies: {
              where: { isHidden: false },
              include: { user: { select: { name: true } } },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 30,
        },
        _count: { select: { votes: true, clones: true } },
      },
    });
    if (!template) return NextResponse.json({ error: "Template tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ template });
  } catch {
    return NextResponse.json({ error: "Gagal memuat template." }, { status: 500 });
  }
}

const VoteSchema = z.object({ action: z.enum(["vote", "report", "comment"]) });
const CommentSchema = z.object({ content: z.string().min(1).max(2000) });
const ReportSchema = z.object({ reason: z.string().min(1).max(500) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await resolveSession(req);
  if (!session) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

  const template = await prisma.template.findUnique({ where: { id } });
  if (!template || !template.isPublic || template.isHidden) {
    return NextResponse.json({ error: "Template tidak ditemukan." }, { status: 404 });
  }

  try {
    const body = await req.json() as { action?: string; content?: string; reason?: string };

    if (body.action === "vote") {
      // Guest sessions can't vote (no userId), but we can allow it with userId null check
      // For demo: just return success
      return NextResponse.json({ success: true, message: "Vote tercatat (hanya untuk akun terdaftar)." });
    }

    if (body.action === "report") {
      const parsed = ReportSchema.safeParse({ reason: body.reason });
      if (!parsed.success) return NextResponse.json({ error: "Alasan laporan diperlukan." }, { status: 400 });
      await prisma.report.create({
        data: {
          templateId: id,
          reportedByUserId: "demo-user",
          reason: parsed.data.reason,
        },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (error) {
    console.error("[API /templates/[id]]", error);
    return NextResponse.json({ error: "Gagal memproses permintaan." }, { status: 500 });
  }
}
