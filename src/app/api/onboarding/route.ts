import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";

const OnboardingSchema = z.object({
  institutionName: z.string().min(1, "Nama institusi wajib diisi").max(200),
  facultyName: z.string().max(200).optional().default(""),
  programName: z.string().min(1, "Program studi wajib diisi").max(200),
  educationLevel: z.string().default("S1"),
  entryYear: z.coerce.number().int().min(2015).max(2030),
  currentSemester: z.coerce.number().int().min(1).max(14),
  totalCurriculumCredits: z.coerce.number().int().min(80).max(200),
  completedCredits: z.coerce.number().int().min(0).max(200),
  gpa: z.coerce.number().min(0).max(4),
  goals: z.enum(["fast", "balanced", "active", "relaxed"]).default("balanced"),
  interests: z.string().max(500).optional().default(""),
  weeklyHours: z.coerce.number().int().min(0).max(80).default(20),
  token: z.string().optional(),
});

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    const parsed = OnboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data formulir tidak valid.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Resolve or create guest session
    let sessionToken = data.token;
    let sessionId: string | null = null;

    if (sessionToken) {
      const existing = await prisma.guestSession.findUnique({
        where: { token: sessionToken },
      });
      if (existing && existing.expiresAt > new Date()) {
        sessionId = existing.id;
      }
    }

    if (!sessionId) {
      sessionToken = generateToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      const newSession = await prisma.guestSession.create({
        data: { token: sessionToken, expiresAt },
      });
      sessionId = newSession.id;
    } else {
      // Clean up previous roadmaps & profiles for a fresh customized start
      await prisma.roadmap.deleteMany({ where: { guestSessionId: sessionId } });
      await prisma.academicProfile.deleteMany({ where: { guestSessionId: sessionId } });
      await prisma.reminder.deleteMany({ where: { guestSessionId: sessionId } });
    }

    // 1. Create Academic Profile (TAK tracking completely disabled)
    await prisma.academicProfile.create({
      data: {
        guestSessionId: sessionId,
        institutionName: data.institutionName,
        facultyName: data.facultyName || "Fakultas Utama",
        programName: data.programName,
        educationLevel: data.educationLevel,
        entryYear: data.entryYear,
        currentSemester: data.currentSemester,
        totalCurriculumCredits: data.totalCurriculumCredits,
        completedCredits: data.completedCredits,
        inProgressCredits: Math.min(20, Math.max(0, data.totalCurriculumCredits - data.completedCredits)),
        gpa: data.gpa,
        goals: data.goals,
        interests: JSON.stringify(data.interests ? data.interests.split(",").map((s) => s.trim()) : []),
        takEnabled: false,
        takTarget: null,
        weeklyHours: data.weeklyHours,
      },
    });

    // 2. Starter Reminders (Roadmap remains empty until user chooses a template or generates one)
    const currSem = data.currentSemester;
    await prisma.reminder.createMany({
      data: [
        {
          guestSessionId: sessionId,
          title: `Pengisian KRS Semester ${currSem + 1}`,
          category: "krs",
          deadline: "2025-02-15",
          isOfficial: false,
          notes: "Pastikan syarat prasyarat mata kuliah terpenuhi sebelum finalisasi KRS.",
        },
        {
          guestSessionId: sessionId,
          title: "Evaluasi Nilai & Target IPK Tengah Semester",
          category: "akademik",
          deadline: "2025-04-10",
          isOfficial: false,
          notes: "Tinjau performa kuis dan tugas besar mata kuliah inti.",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      token: sessionToken,
      redirectUrl: "/app/templates",
    });
  } catch (error) {
    console.error("[API /onboarding POST]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses onboarding." },
      { status: 500 }
    );
  }
}
