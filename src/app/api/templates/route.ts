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
  const session = await prisma.guestSession.findUnique({
    where: { token },
    include: { academicProfile: true },
  });
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
    const body = (await req.json()) as {
      templateId?: string;
      action?: string;
      title?: string;
      description?: string;
      category?: string;
      isAnonymous?: boolean;
      authorDisplayName?: string;
      strategyTip?: string;
    };

    // Aksi 1: Clone template
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

    // Aksi 2: Publish/Submit roadmap saya sebagai template baru ke Admin untuk verifikasi
    if (body.action === "publish_roadmap") {
      const title = body.title?.trim();
      const description = body.description?.trim();
      const category = body.category?.trim() || "semester";

      if (!title || title.length < 5) {
        return NextResponse.json({ error: "Judul template minimal 5 karakter." }, { status: 400 });
      }
      if (!description || description.length < 10) {
        return NextResponse.json({ error: "Deskripsi template minimal 10 karakter." }, { status: 400 });
      }

      // Ambil roadmap aktif mahasiswa
      const roadmap = await prisma.roadmap.findFirst({
        where: { guestSessionId: session.id },
        orderBy: { createdAt: "desc" },
      });

      if (!roadmap) {
        return NextResponse.json(
          { error: "Roadmap akademik Anda belum dibuat. Silakan susun rencana studi terlebih dahulu." },
          { status: 400 }
        );
      }

      // Cari versi roadmap aktif
      let versionId = roadmap.currentVersionId;
      if (!versionId) {
        const latestVer = await prisma.roadmapVersion.findFirst({
          where: { roadmapId: roadmap.id },
          orderBy: { versionNum: "desc" },
        });
        versionId = latestVer?.id || null;
      }

      if (!versionId) {
        return NextResponse.json(
          { error: "Versi rencana studi tidak ditemukan." },
          { status: 400 }
        );
      }

      const version = await prisma.roadmapVersion.findUnique({
        where: { id: versionId },
        include: {
          semesterPlans: {
            orderBy: { semesterNum: "asc" },
            include: {
              tasks: {
                where: { status: { not: "cancelled" } },
                orderBy: { createdAt: "asc" },
              },
            },
          },
        },
      });

      if (!version || version.semesterPlans.length === 0) {
        return NextResponse.json(
          { error: "Roadmap akademik Anda masih kosong. Isi mata kuliah sebelum mengajukannya sebagai template." },
          { status: 400 }
        );
      }

      const profile = session.academicProfile;
      const institutionName = profile?.institutionName || "Telkom University";
      const programName = profile?.programName || "Teknik Informatika";

      // Transformasi semesterPlans & tasks mahasiswa menjadi format semesterSteps
      const semesterSteps = version.semesterPlans.map((sp) => {
        const plannedCredits = sp.tasks.reduce(
          (sum: number, t) => sum + (t.itemType === "COURSE" || t.credits > 0 ? Number(t.credits) || 0 : 0),
          0
        );

        return {
          semesterNum: sp.semesterNum,
          title: `Semester ${sp.semesterNum}`,
          focus: sp.tasks.slice(0, 3).map((t) => t.title).join(", ") || `Kurikulum Semester ${sp.semesterNum}`,
          targetCredits: sp.targetCredits || plannedCredits || 20,
          strategyTip: body.strategyTip || "Fokus pada penguasaan fundamental mata kuliah dan jaga ritme belajar mingguan.",
          items: sp.tasks.map((t) => ({
            title: t.title,
            courseCode: t.courseCode || undefined,
            credits: Number(t.credits) || 0,
            category: t.category || "akademik",
            notes: t.notes || undefined,
            targetSemesterNum: sp.semesterNum,
          })),
        };
      });

      const authorName = body.isAnonymous
        ? "Mahasiswa Anonim"
        : body.authorDisplayName?.trim() || "Mahasiswa STARA";

      // Buat record template baru (sourceType: 'komunitas', isHidden: false)
      // Ini langsung masuk ke panel moderasi admin (/admin?tab=templates) untuk ditinjau / diverifikasi
      const newTemplate = await prisma.template.create({
        data: {
          title,
          description,
          category,
          institutionName,
          programName,
          cohortYear: profile?.entryYear || new Date().getFullYear(),
          goals: profile?.goals || `Target kelulusan ${programName}`,
          semesterSteps: JSON.stringify(semesterSteps),
          sourceType: "komunitas",
          isPublic: true,
          isHidden: false,
          usefulCount: 1,
          authorDisplayName: authorName,
          isAnonymous: Boolean(body.isAnonymous),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Roadmap berhasil diajukan sebagai template komunitas! Admin STARA akan memverifikasi kelayakannya.",
        templateId: newTemplate.id,
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (error) {
    console.error("[API /templates POST]", error);
    return NextResponse.json({ error: "Gagal memproses permintaan." }, { status: 500 });
  }
}
