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

export async function GET(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

  try {
    const existing = await prisma.checkIn.findFirst({
      where: {
        guestSessionId: session.id,
        type: "thesis_11_stages",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!existing) {
      return NextResponse.json({ success: true, progress: null });
    }

    const parsedAnswers = JSON.parse(existing.answers);
    return NextResponse.json({
      success: true,
      progress: parsedAnswers,
      updatedAt: existing.createdAt,
    });
  } catch (error) {
    console.error("[API /thesis/progress GET]", error);
    return NextResponse.json({ error: "Gagal memuat progres skripsi." }, { status: 500 });
  }
}

const StageDataSchema = z.object({
  id: z.number(),
  title: z.string(),
  isCompleted: z.boolean(),
  status: z.enum(["belum_dimulai", "proses_bimbingan", "revisi_dospem", "acc_dospem"]),
  completedAt: z.string().nullable().optional(),
  fields: z.record(z.string()).default({}),
});

const ProgressPayloadSchema = z.object({
  stages: z.array(StageDataSchema),
  approvedTitle: z.string().optional(),
  supervisor1: z.string().optional(),
  supervisor2: z.string().optional(),
  completedCount: z.number().default(0),
  activeStageNumber: z.number().default(1),
});

export async function POST(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

  try {
    const body = (await req.json()) as unknown;
    const parsed = ProgressPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data progres tidak valid.", details: parsed.error.flatten() }, { status: 400 });
    }

    const payloadString = JSON.stringify(parsed.data);

    // Find if already exists
    const existing = await prisma.checkIn.findFirst({
      where: {
        guestSessionId: session.id,
        type: "thesis_11_stages",
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      await prisma.checkIn.update({
        where: { id: existing.id },
        data: {
          answers: payloadString,
          semesterNum: parsed.data.activeStageNumber,
        },
      });
    } else {
      await prisma.checkIn.create({
        data: {
          guestSessionId: session.id,
          type: "thesis_11_stages",
          semesterNum: parsed.data.activeStageNumber,
          answers: payloadString,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Progres tahapan skripsi berhasil disimpan.",
      progress: parsed.data,
    });
  } catch (error) {
    console.error("[API /thesis/progress POST]", error);
    return NextResponse.json({ error: "Gagal menyimpan progres skripsi." }, { status: 500 });
  }
}
