import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";

const TemplateSearchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
});

async function resolveSession(req: NextRequest) {
  const token = req.headers.get("x-demo-token") ?? req.nextUrl.searchParams.get("token");
  if (!token) return null;
  const session = await prisma.guestSession.findUnique({ where: { token } });
  if (!session || session.expiresAt < new Date()) return null;
  return session;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const parsed = TemplateSearchSchema.safeParse(Object.fromEntries(searchParams));
  const query = parsed.success ? parsed.data : { page: 1 };

  try {
    const where: Record<string, unknown> = { isPublic: true, isHidden: false };
    if (query.category) where.category = query.category;
    if (query.q) {
      where.OR = [
        { title: { contains: query.q } },
        { description: { contains: query.q } },
        { programName: { contains: query.q } },
      ];
    }

    const pageSize = 12;
    const skip = ((query.page ?? 1) - 1) * pageSize;

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        orderBy: { usefulCount: "desc" },
        take: pageSize,
        skip,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          institutionName: true,
          programName: true,
          sourceType: true,
          usefulCount: true,
          isAnonymous: true,
          authorDisplayName: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.template.count({ where }),
    ]);

    return NextResponse.json({ templates, total, page: query.page, pageSize });
  } catch (error) {
    console.error("[API /templates GET]", error);
    return NextResponse.json({ error: "Gagal memuat template." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

  try {
    const body = await req.json() as {
      templateId?: string;
      action?: string;
      title?: string;
      description?: string;
      category?: string;
      semesterSteps?: unknown;
    };

    if (body.action === "clone" && body.templateId) {
      const source = await prisma.template.findUnique({ where: { id: body.templateId } });
      if (!source || !source.isPublic || source.isHidden) {
        return NextResponse.json({ error: "Template tidak ditemukan." }, { status: 404 });
      }

      await prisma.templateClone.create({
        data: {
          sourceTemplateId: source.id,
          guestSessionId: session.id,
        },
      });

      return NextResponse.json({ success: true, message: "Template berhasil di-clone ke workspace kamu." });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (error) {
    console.error("[API /templates POST]", error);
    return NextResponse.json({ error: "Gagal memproses permintaan." }, { status: 500 });
  }
}
