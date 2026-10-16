import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";

const ProfileSchema = z.object({
  institutionName: z.string().min(1).max(200),
  facultyName: z.string().max(200).optional(),
  programName: z.string().min(1).max(200),
  educationLevel: z.enum(["s1", "s2", "d3", "d4"]).default("s1"),
  entryYear: z.coerce.number().int().min(2000).max(2035),
  currentSemester: z.coerce.number().int().min(1).max(14),
  totalCurriculumCredits: z.coerce.number().int().min(100).max(200),
  completedCredits: z.coerce.number().int().min(0).max(200),
  inProgressCredits: z.coerce.number().int().min(0).max(40).default(0),
  gpa: z.coerce.number().min(0).max(4),
  goals: z.enum(["fast", "balanced", "active", "relaxed"]),
  interests: z.string().max(500).optional(),
  weeklyHours: z.coerce.number().int().min(0).max(80).default(20),
  takEnabled: z.boolean().default(false),
  takTarget: z.coerce.number().int().min(0).max(500).default(120),
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

  const profile = await prisma.academicProfile.findFirst({ where: { guestSessionId: session.id } });
  return NextResponse.json({ profile });
}

export async function POST(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

  try {
    const body = await req.json() as unknown;
    const parsed = ProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid.", details: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.academicProfile.findFirst({ where: { guestSessionId: session.id } });

    let profile;
    if (existing) {
      profile = await prisma.academicProfile.update({
        where: { id: existing.id },
        data: parsed.data,
      });
    } else {
      profile = await prisma.academicProfile.create({
        data: { guestSessionId: session.id, ...parsed.data },
      });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[API /profile POST]", error);
    return NextResponse.json({ error: "Gagal menyimpan profil." }, { status: 500 });
  }
}
