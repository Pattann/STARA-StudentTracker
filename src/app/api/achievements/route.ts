import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";

const AchievementSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.enum(["magang", "organisasi", "proyek", "lomba", "sertifikasi", "akademik", "relawan", "lainnya"]),
  role: z.string().max(100).optional(),
  description: z.string().min(1).max(2000),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  impact: z.string().max(500).optional(),
  skills: z.array(z.string()).default([]),
  evidenceUrl: z.string().url().optional().or(z.literal("")),
  includeInCv: z.boolean().default(true),
});

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

  const achievements = await prisma.achievement.findMany({
    where: { guestSessionId: session.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ achievements });
}

export async function POST(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

  try {
    const body = await req.json() as unknown;
    const parsed = AchievementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid.", details: parsed.error.flatten() }, { status: 400 });
    }

    const { skills, ...rest } = parsed.data;
    const achievement = await prisma.achievement.create({
      data: {
        guestSessionId: session.id,
        skills: JSON.stringify(skills),
        ...rest,
      },
    });
    return NextResponse.json({ achievement });
  } catch (error) {
    console.error("[API /achievements POST]", error);
    return NextResponse.json({ error: "Gagal menyimpan prestasi." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

  try {
    const body = await req.json() as { id?: string; includeInCv?: boolean };
    if (!body.id) return NextResponse.json({ error: "ID diperlukan." }, { status: 400 });

    const achievement = await prisma.achievement.findUnique({ where: { id: body.id } });
    if (!achievement || achievement.guestSessionId !== session.id) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const updated = await prisma.achievement.update({
      where: { id: body.id },
      data: { includeInCv: body.includeInCv ?? achievement.includeInCv },
    });
    return NextResponse.json({ achievement: updated });
  } catch {
    return NextResponse.json({ error: "Gagal memperbarui prestasi." }, { status: 500 });
  }
}
