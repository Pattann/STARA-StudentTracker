import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { verifyPassword, createSessionForUser } from "@/lib/auth";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email("Format email tidak valid").toLowerCase().trim(),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data tidak valid." },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        academicProfile: true,
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Email atau kata sandi salah." },
        { status: 401 }
      );
    }

    // Verify password
    const isMatch = verifyPassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Email atau kata sandi salah." },
        { status: 401 }
      );
    }

    // Check if user has completed onboarding
    const hasCompletedOnboarding = Boolean(user.academicProfile);

    // Create session
    const { token, session } = await createSessionForUser(user.id);

    // If user already has profile, link it to this session as well
    if (user.academicProfile) {
      await prisma.academicProfile.update({
        where: { id: user.academicProfile.id },
        data: { guestSessionId: session.id },
      });

      // Also link any existing roadmaps
      await prisma.roadmap.updateMany({
        where: { userId: user.id },
        data: { guestSessionId: session.id },
      });
    }

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      hasCompletedOnboarding,
      redirectUrl: hasCompletedOnboarding ? "/app/templates" : "/onboarding",
    });
  } catch (error) {
    console.error("[API /auth/login]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat masuk akun." },
      { status: 500 }
    );
  }
}
