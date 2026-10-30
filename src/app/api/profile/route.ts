import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { hashPassword } from "@/lib/auth";
import {
  getAcademicsData,
  seedInitialRoadmapForSession,
} from "@/server/admin/service";

async function resolveSession(req: NextRequest) {
  const token =
    req.headers.get("x-demo-token") ?? req.nextUrl.searchParams.get("token");
  if (!token) return null;
  const session = await prisma.guestSession.findUnique({ where: { token } });
  if (!session || session.expiresAt < new Date()) return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) {
    return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  }

  try {
    const isExport = req.nextUrl.searchParams.get("export") === "1";

    const [profile, academics] = await Promise.all([
      prisma.academicProfile.findUnique({
        where: { guestSessionId: session.id },
      }),
      getAcademicsData(),
    ]);

    if (isExport) {
      let roadmap = await prisma.roadmap.findFirst({
        where: { guestSessionId: session.id },
        orderBy: { createdAt: "desc" },
      });

      if (!roadmap && profile) {
        roadmap = await seedInitialRoadmapForSession(session.id, {
          programName: profile.programName,
          currentSemester: profile.currentSemester,
          entryYear: profile.entryYear,
        });
      }

      const [version, achievements, reminders] = await Promise.all([
        roadmap?.currentVersionId
          ? prisma.roadmapVersion.findUnique({
              where: { id: roadmap.currentVersionId },
              include: {
                semesterPlans: {
                  include: { tasks: { orderBy: { createdAt: "asc" } } },
                  orderBy: { semesterNum: "asc" },
                },
              },
            })
          : Promise.resolve(null),
        Promise.resolve([]),
        prisma.reminder.findMany({
          where: { guestSessionId: session.id },
          orderBy: { deadline: "asc" },
        }),
      ]);

      return NextResponse.json({
        profile,
        semesterPlans: version?.semesterPlans ?? [],
        achievements,
        reminders,
      });
    }

    return NextResponse.json({
      profile,
      campuses: academics.campuses.map((c: { name: string }) => c.name),
      programs: academics.programs.map(
        (p: {
          name: string;
          faculty: string;
          level: string;
          totalCredits: number;
        }) => ({
          name: p.name,
          faculty: p.faculty,
          level: p.level,
          totalCredits: p.totalCredits,
        })
      ),
    });
  } catch (error) {
    console.error("[API /profile GET]", error);
    return NextResponse.json(
      { error: "Gagal memuat data profil." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) {
    return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      type?: "account" | "academic" | "ai_preferences";
      userId?: string;
      name?: string;
      email?: string;
      newPassword?: string;
      institutionName?: string;
      facultyName?: string;
      programName?: string;
      educationLevel?: string;
      entryYear?: number;
      currentSemester?: number;
      totalCurriculumCredits?: number;
      completedCredits?: number;
      gpa?: number | null;
      goals?: string;
      interests?: string[];
      studyMode?: string;
      takEnabled?: boolean;
      takTarget?: number;
      weeklyHours?: number;
    };

    // 1. Update Account Identity / Password
    if (body.type === "account") {
      const cleanName = (body.name ?? "").trim();
      const cleanEmail = (body.email ?? "").trim().toLowerCase();

      if (!cleanName || !cleanEmail) {
        return NextResponse.json(
          { error: "Nama lengkap dan email wajib diisi." },
          { status: 400 }
        );
      }

      let updatedUser = null;
      if (body.userId && body.userId !== "demo-student") {
        const existingUser = await prisma.user.findUnique({
          where: { id: body.userId },
        });
        if (existingUser) {
          const updateData: { name: string; email: string; password?: string } = {
            name: cleanName,
            email: cleanEmail,
          };
          if (body.newPassword && body.newPassword.trim().length >= 6) {
            updateData.password = hashPassword(body.newPassword.trim());
          }
          updatedUser = await prisma.user.update({
            where: { id: existingUser.id },
            data: updateData,
          });
        }
      }

      return NextResponse.json({
        success: true,
        user: {
          id: updatedUser?.id ?? body.userId ?? "student-user",
          name: updatedUser?.name ?? cleanName,
          email: updatedUser?.email ?? cleanEmail,
          role: updatedUser?.role ?? "student",
        },
        message: body.newPassword
          ? "Identitas akun dan kata sandi berhasil diperbarui."
          : "Identitas akun berhasil diperbarui.",
      });
    }

    // 2. Update Academic Profile & AI Preferences
    const existingProfile = await prisma.academicProfile.findUnique({
      where: { guestSessionId: session.id },
    });

    const nextSemester =
      typeof body.currentSemester === "number"
        ? Math.min(14, Math.max(1, body.currentSemester))
        : existingProfile?.currentSemester ?? 4;

    const nextTotalCredits =
      typeof body.totalCurriculumCredits === "number"
        ? Math.min(200, Math.max(80, body.totalCurriculumCredits))
        : existingProfile?.totalCurriculumCredits ?? 144;

    const nextCompletedCredits =
      typeof body.completedCredits === "number"
        ? Math.min(nextTotalCredits, Math.max(0, body.completedCredits))
        : existingProfile?.completedCredits ?? 60;

    const profileData = {
      institutionName:
        body.institutionName?.trim() ||
        existingProfile?.institutionName ||
        "Telkom University",
      facultyName:
        body.facultyName?.trim() ??
        existingProfile?.facultyName ??
        "Fakultas Informatika",
      programName:
        body.programName?.trim() ||
        existingProfile?.programName ||
        "S1 Teknik Informatika",
      educationLevel:
        body.educationLevel || existingProfile?.educationLevel || "S1",
      entryYear:
        typeof body.entryYear === "number"
          ? body.entryYear
          : existingProfile?.entryYear ?? 2023,
      currentSemester: nextSemester,
      totalCurriculumCredits: nextTotalCredits,
      completedCredits: nextSemester === 1 ? 0 : nextCompletedCredits,
      inProgressCredits: Math.min(
        20,
        Math.max(0, nextTotalCredits - nextCompletedCredits)
      ),
      gpa:
        nextSemester === 1 ? 0 : typeof body.gpa === "number" && !isNaN(body.gpa)
          ? Math.min(4.0, Math.max(0.0, body.gpa))
          : existingProfile?.gpa ?? 3.5,
      goals: body.goals || existingProfile?.goals || "balanced",
      interests: Array.isArray(body.interests)
        ? JSON.stringify(body.interests)
        : existingProfile?.interests || "[]",
      studyMode:
        body.studyMode !== undefined
          ? body.studyMode
          : existingProfile?.studyMode || "academic_gpa",
      takEnabled:
        typeof body.takEnabled === "boolean"
          ? body.takEnabled
          : existingProfile?.takEnabled ?? true,
      takTarget:
        typeof body.takTarget === "number"
          ? body.takTarget
          : existingProfile?.takTarget ?? 120,
      weeklyHours:
        typeof body.weeklyHours === "number"
          ? body.weeklyHours
          : existingProfile?.weeklyHours ?? 20,
    };

    const savedProfile = existingProfile
      ? await prisma.academicProfile.update({
          where: { id: existingProfile.id },
          data: profileData,
        })
      : await prisma.academicProfile.create({
          data: {
            guestSessionId: session.id,
            ...profileData,
          },
        });

    // Sync active semester in Roadmap if currentSemester changed
    if (typeof body.currentSemester === "number") {
      const activeRoadmap = await prisma.roadmap.findFirst({
        where: { guestSessionId: session.id },
        orderBy: { createdAt: "desc" },
      });

      if (activeRoadmap?.currentVersionId) {
        await Promise.all([
          prisma.semesterPlan.updateMany({
            where: { roadmapVersionId: activeRoadmap.currentVersionId },
            data: { isCurrentSemester: false },
          }),
          prisma.semesterPlan.updateMany({
            where: {
              roadmapVersionId: activeRoadmap.currentVersionId,
              semesterNum: nextSemester,
            },
            data: { isCurrentSemester: true },
          }),
        ]);
      }
    }

    return NextResponse.json({
      success: true,
      profile: savedProfile,
      message: "Data akademik & preferensi berhasil disimpan dan disinkronkan.",
    });
  } catch (error) {
    console.error("[API /profile POST]", error);
    return NextResponse.json(
      { error: "Gagal menyimpan perubahan profil." },
      { status: 500 }
    );
  }
}
