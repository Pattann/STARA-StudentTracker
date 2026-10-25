import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

async function resolveSession(req: NextRequest) {
  const token = req.headers.get("x-demo-token") ?? req.nextUrl.searchParams.get("token");
  if (!token) return null;
  const session = await prisma.guestSession.findUnique({ where: { token } });
  if (!session || session.expiresAt < new Date()) return null;
  return session;
}

export async function POST(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) {
    return NextResponse.json({ error: "Sesi tidak valid atau telah berakhir." }, { status: 401 });
  }

  try {
    const { templateId } = (await req.json()) as { templateId?: string };
    if (!templateId) {
      return NextResponse.json({ error: "ID Template wajib disertakan." }, { status: 400 });
    }

    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json({ error: "Template tidak ditemukan." }, { status: 404 });
    }

    // Reset old roadmaps
    await prisma.roadmap.deleteMany({ where: { guestSessionId: session.id } });

    // Create new roadmap based on template
    const roadmap = await prisma.roadmap.create({
      data: {
        guestSessionId: session.id,
        title: `Roadmap: ${template.title}`,
        status: "active",
      },
    });

    const version = await prisma.roadmapVersion.create({
      data: {
        roadmapId: roadmap.id,
        versionNum: 1,
        label: `Adopsi dari ${template.sourceType === "terverifikasi" ? "Kerjasama Kampus" : "Komunitas"}: ${template.title}`,
        isBaseline: true,
      },
    });

    await prisma.roadmap.update({
      where: { id: roadmap.id },
      data: { currentVersionId: version.id },
    });

    // Parse template semesterSteps
    let steps: Array<{ semesterNum: number; targetCredits?: number; courses?: string[] }> = [];
    try {
      steps = JSON.parse(template.semesterSteps || "[]");
    } catch {
      steps = [];
    }

    if (steps.length === 0) {
      steps = [
        {
          semesterNum: 5,
          targetCredits: 20,
          courses: [
            "Kecerdasan Buatan & Machine Learning (4 SKS)",
            "Pengembangan Aplikasi Web & Cloud (3 SKS)",
            "Keamanan Informasi & Kriptografi (3 SKS)",
            "Basis Data Terdistribusi & Big Data (3 SKS)",
            "Sistem Operasi Lanjut & Virtualisasi (3 SKS)",
            "Analisis & Desain Algoritma Kompleks (3 SKS)",
          ],
        },
        { semesterNum: 6, targetCredits: 20, courses: ["Program Magang MBKM Industri (20 SKS)"] },
        {
          semesterNum: 7,
          targetCredits: 19,
          courses: [
            "Proyek Capstone Rekayasa Terpadu (4 SKS)",
            "Seminar Proposal Skripsi (2 SKS)",
            "Etika Profesi & Hukum Teknologi (2 SKS)",
            "Tata Kelola TI & Manajemen Proyek (3 SKS)",
            "Cloud Architecture & DevOps (3 SKS)",
            "Computer Vision & AI Terapan (3 SKS)",
            "Technopreneurship Digital (2 SKS)",
          ],
        },
        {
          semesterNum: 8,
          targetCredits: 8,
          courses: [
            "Skripsi / Tugas Akhir (6 SKS)",
            "Kolokium & Publikasi Ilmiah (2 SKS)",
          ],
        },
      ];
    }

    for (const step of steps) {
      const plan = await prisma.semesterPlan.create({
        data: {
          roadmapVersionId: version.id,
          semesterNum: step.semesterNum,
          isCurrentSemester: step.semesterNum === 5,
          targetCredits: step.targetCredits || 20,
          plannedCredits: step.targetCredits || 20,
          semesterLabel: `Semester ${step.semesterNum} — ${step.semesterNum % 2 === 1 ? "Ganjil" : "Genap"}`,
        },
      });

      if (step.courses && Array.isArray(step.courses)) {
        for (const courseName of step.courses) {
          const isSkripsi = courseName.toLowerCase().includes("skripsi") || courseName.toLowerCase().includes("tugas akhir");
          const isMagang = courseName.toLowerCase().includes("magang") || courseName.toLowerCase().includes("mbkm") || courseName.toLowerCase().includes("iisma");
          const isTak = courseName.toLowerCase().includes("tak") || courseName.toLowerCase().includes("ormawa");

          await prisma.roadmapTask.create({
            data: {
              semesterPlanId: plan.id,
              title: courseName,
              category: isSkripsi ? "skripsi" : isMagang ? "magang" : isTak ? "tak" : "akademik",
              credits: isSkripsi ? 6 : isMagang ? 20 : 3,
              status: "planned",
              certaintyLevel: template.sourceType === "terverifikasi" ? "pasti" : "estimasi",
            },
          });
        }
      }
    }

    // Increment template usefulCount
    await prisma.template.update({
      where: { id: template.id },
      data: { usefulCount: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      message: `Template "${template.title}" berhasil diadopsi ke Roadmap Anda!`,
      roadmapId: roadmap.id,
    });
  } catch (error) {
    console.error("[API /templates/adopt]", error);
    return NextResponse.json(
      { error: "Gagal mengadopsi template ke roadmap." },
      { status: 500 }
    );
  }
}
