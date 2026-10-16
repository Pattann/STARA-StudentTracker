import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";

const ReminderSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.enum(["akademik", "krs", "mbkm", "skripsi", "yudisium", "pribadi"]),
  deadline: z.string().optional(),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  sourceLabel: z.string().max(200).optional(),
  isOfficial: z.boolean().default(false),
  notes: z.string().max(500).optional(),
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

  try {
    const reminders = await prisma.reminder.findMany({
      where: { guestSessionId: session.id },
      orderBy: [{ status: "asc" }, { deadline: "asc" }],
    });
    return NextResponse.json({ reminders });
  } catch {
    return NextResponse.json({ error: "Gagal memuat pengingat." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

  try {
    const body = await req.json() as unknown;
    const parsed = ReminderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid.", details: parsed.error.flatten() }, { status: 400 });
    }

    const reminder = await prisma.reminder.create({
      data: { guestSessionId: session.id, ...parsed.data },
    });
    return NextResponse.json({ reminder });
  } catch (error) {
    console.error("[API /reminders POST]", error);
    return NextResponse.json({ error: "Gagal menyimpan pengingat." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

  try {
    const body = await req.json() as { id?: string; status?: string };
    if (!body.id) return NextResponse.json({ error: "ID diperlukan." }, { status: 400 });

    const reminder = await prisma.reminder.findUnique({ where: { id: body.id } });
    if (!reminder || reminder.guestSessionId !== session.id) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const updated = await prisma.reminder.update({
      where: { id: body.id },
      data: { status: body.status ?? reminder.status },
    });
    return NextResponse.json({ reminder: updated });
  } catch {
    return NextResponse.json({ error: "Gagal memperbarui pengingat." }, { status: 500 });
  }
}
