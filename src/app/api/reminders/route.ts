import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";

const VALID_CATEGORIES = ["akademik", "krs", "mbkm", "skripsi", "yudisium", "pribadi"] as const;

const CreateReminderSchema = z.object({
  title: z.string().trim().min(1, "Judul pengingat wajib diisi.").max(200),
  category: z
    .string()
    .transform((val) => (val === "magang" ? "mbkm" : val))
    .pipe(z.enum(VALID_CATEGORIES))
    .default("akademik"),
  deadline: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  sourceUrl: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  sourceLabel: z
    .string()
    .max(200)
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  isOfficial: z.boolean().default(false),
  notes: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
});

const UpdateReminderSchema = z.object({
  id: z.string().min(1, "ID pengingat diperlukan."),
  status: z.enum(["active", "done"]).optional(),
  title: z.string().trim().min(1).max(200).optional(),
  category: z
    .string()
    .transform((val) => (val === "magang" ? "mbkm" : val))
    .pipe(z.enum(VALID_CATEGORIES))
    .optional(),
  deadline: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === undefined ? undefined : val && val.trim().length > 0 ? val.trim() : null)),
  isOfficial: z.boolean().optional(),
  notes: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform((val) => (val === undefined ? undefined : val && val.trim().length > 0 ? val.trim() : null)),
});

function futureIsoDate(daysFromNow: number): string {
  const d = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}

const LEGACY_SEED_DATES: Record<string, number> = {
  "2025-02-15": 14,
  "2025-04-10": 45,
  "2025-01-15": 14,
  "2025-02-28": 35,
  "2025-07-01": 75,
};

async function resolveSession(req: NextRequest): Promise<{ id: string; userId: string | null } | null> {
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  const token =
    bearerToken ||
    req.headers.get("x-demo-token") ||
    req.nextUrl.searchParams.get("token");

  if (!token) return null;
  const session = await prisma.guestSession.findUnique({
    where: { token },
    include: { academicProfile: { select: { userId: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return {
    id: session.id,
    userId: session.academicProfile?.userId ?? null,
  };
}

function canAccessReminder(
  reminder: { guestSessionId: string | null; userId: string | null },
  session: { id: string; userId: string | null }
): boolean {
  if (reminder.guestSessionId && reminder.guestSessionId === session.id) return true;
  if (session.userId && reminder.userId === session.userId) return true;
  return false;
}

export async function GET(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) {
    return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  }

  try {
    const ownershipWhere = session.userId
      ? { OR: [{ guestSessionId: session.id }, { userId: session.userId }] }
      : { guestSessionId: session.id };

    let reminders = await prisma.reminder.findMany({
      where: ownershipWhere,
      orderBy: [{ status: "asc" }, { deadline: "asc" }, { createdAt: "desc" }],
    });

    // If an onboarded student has 0 reminders (e.g. created before reminder linking), seed 2 helpful starter reminders
    if (reminders.length === 0) {
      const profile = await prisma.academicProfile.findFirst({
        where: ownershipWhere,
        select: { currentSemester: true },
      });

      if (profile) {
        const nextSem = Math.min(14, (profile.currentSemester || 1) + 1);
        await prisma.reminder.createMany({
          data: [
            {
              guestSessionId: session.id,
              userId: session.userId ?? null,
              title: `Pengisian KRS Semester ${nextSem}`,
              category: "krs",
              deadline: futureIsoDate(14),
              isOfficial: false,
              notes: "Pastikan syarat prasyarat mata kuliah terpenuhi sebelum finalisasi KRS.",
            },
            {
              guestSessionId: session.id,
              userId: session.userId ?? null,
              title: "Evaluasi Nilai & Target IPK Tengah Semester",
              category: "akademik",
              deadline: futureIsoDate(45),
              isOfficial: false,
              notes: "Tinjau performa kuis dan tugas besar mata kuliah inti.",
            },
          ],
        });

        reminders = await prisma.reminder.findMany({
          where: ownershipWhere,
          orderBy: [{ status: "asc" }, { deadline: "asc" }, { createdAt: "desc" }],
        });
      }
    }

    // Auto-heal legacy hardcoded 2025 seed dates or legacy "magang" category so existing sessions show valid upcoming dates
    const updates: Promise<unknown>[] = [];
    const normalized = reminders.map((r) => {
      let nextDeadline = r.deadline;
      let nextCategory = r.category;
      let needsUpdate = false;

      if (r.deadline && LEGACY_SEED_DATES[r.deadline] !== undefined) {
        nextDeadline = futureIsoDate(LEGACY_SEED_DATES[r.deadline]);
        needsUpdate = true;
      }
      if (r.category === "magang") {
        nextCategory = "mbkm";
        needsUpdate = true;
      }
      if (session.userId && !r.userId) {
        needsUpdate = true;
      }

      if (needsUpdate) {
        updates.push(
          prisma.reminder.update({
            where: { id: r.id },
            data: {
              deadline: nextDeadline,
              category: nextCategory,
              ...(session.userId ? { userId: session.userId } : {}),
              guestSessionId: session.id,
            },
          })
        );
      }

      return {
        ...r,
        deadline: nextDeadline,
        category: nextCategory,
      };
    });

    if (updates.length > 0) {
      await Promise.allSettled(updates);
    }

    return NextResponse.json({ reminders: normalized });
  } catch (error) {
    console.error("[API /reminders GET]", error);
    return NextResponse.json({ error: "Gagal memuat pengingat." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) {
    return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as unknown;
    const parsed = CreateReminderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data pengingat tidak valid.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const reminder = await prisma.reminder.create({
      data: {
        guestSessionId: session.id,
        userId: session.userId ?? null,
        title: parsed.data.title,
        category: parsed.data.category,
        deadline: parsed.data.deadline,
        sourceUrl: parsed.data.sourceUrl,
        sourceLabel: parsed.data.sourceLabel,
        isOfficial: parsed.data.isOfficial,
        notes: parsed.data.notes,
        status: "active",
      },
    });

    return NextResponse.json({ reminder }, { status: 201 });
  } catch (error) {
    console.error("[API /reminders POST]", error);
    return NextResponse.json({ error: "Gagal menyimpan pengingat." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) {
    return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as unknown;
    const parsed = UpdateReminderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data pembaruan tidak valid.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...fields } = parsed.data;
    const reminder = await prisma.reminder.findUnique({ where: { id } });
    if (!reminder || !canAccessReminder(reminder, session)) {
      return NextResponse.json({ error: "Pengingat tidak ditemukan atau akses ditolak." }, { status: 403 });
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        ...(fields.status !== undefined ? { status: fields.status } : {}),
        ...(fields.title !== undefined ? { title: fields.title } : {}),
        ...(fields.category !== undefined ? { category: fields.category } : {}),
        ...(fields.deadline !== undefined ? { deadline: fields.deadline } : {}),
        ...(fields.isOfficial !== undefined ? { isOfficial: fields.isOfficial } : {}),
        ...(fields.notes !== undefined ? { notes: fields.notes } : {}),
      },
    });

    return NextResponse.json({ reminder: updated });
  } catch (error) {
    console.error("[API /reminders PATCH]", error);
    return NextResponse.json({ error: "Gagal memperbarui pengingat." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) {
    return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  }

  try {
    let id = req.nextUrl.searchParams.get("id");
    if (!id) {
      const body = (await req.json().catch(() => ({}))) as { id?: string };
      id = body.id ?? null;
    }

    if (!id) {
      return NextResponse.json({ error: "ID pengingat diperlukan." }, { status: 400 });
    }

    const reminder = await prisma.reminder.findUnique({ where: { id } });
    if (!reminder || !canAccessReminder(reminder, session)) {
      return NextResponse.json({ error: "Pengingat tidak ditemukan atau akses ditolak." }, { status: 403 });
    }

    await prisma.reminder.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("[API /reminders DELETE]", error);
    return NextResponse.json({ error: "Gagal menghapus pengingat." }, { status: 500 });
  }
}
