import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";
import { THESIS_REQUIRED_MESSAGE, validateThesisField, validateThesisStage } from "@/lib/thesis-validation";

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

/**
 * Menolak payload yang melanggar aturan tracker:
 * - isian yang diketik harus bermakna (tidak asal-asalan),
 * - tahap hanya boleh ACC bila seluruh kolom wajibnya valid,
 * - tahap hanya boleh ACC bila tahap sebelumnya sudah ACC.
 */
function validateProgressStages(stages: z.infer<typeof StageDataSchema>[]): string | null {
  const accepted = new Set<number>();
  const ordered = [...stages].sort((a, b) => a.id - b.id);

  for (const stage of ordered) {
    const issues = validateThesisStage(stage.id, stage.fields);
    const invalidInput = issues.find((issue) => issue.message !== THESIS_REQUIRED_MESSAGE);
    if (invalidInput) {
      return `Tahap ${stage.id}: ${invalidInput.message}`;
    }

    if (stage.status === "acc_dospem") {
      if (issues.length > 0) {
        return `Tahap ${stage.id} belum bisa ditandai selesai karena formulirnya belum lengkap dan valid.`;
      }
      if (stage.id > 1 && !accepted.has(stage.id - 1)) {
        return `Tahap ${stage.id} belum bisa ditandai selesai sebelum Tahap ${stage.id - 1} selesai.`;
      }
      accepted.add(stage.id);
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

  try {
    const body = (await req.json()) as unknown;
    const parsed = ProgressPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data progres tidak valid.", details: parsed.error.flatten() }, { status: 400 });
    }

    const rejection = validateProgressStages(parsed.data.stages);
    if (rejection) {
      return NextResponse.json({ error: rejection }, { status: 422 });
    }

    const headerFields: Array<[string, string | undefined]> = [
      ["approvedTitle", parsed.data.approvedTitle],
      ["supervisor1", parsed.data.supervisor1],
      ["supervisor2", parsed.data.supervisor2],
    ];
    for (const [key, value] of headerFields) {
      const message = value ? validateThesisField(key, value) : null;
      if (message) {
        return NextResponse.json({ error: message }, { status: 422 });
      }
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
