import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { hashPassword, createSessionForUser } from "@/lib/auth";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().email("Format email tidak valid").toLowerCase().trim(),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
});

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data tidak valid." },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan masuk." },
        { status: 409 }
      );
    }

    // Create user
    const hashedPassword = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "student",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Create session token
    const { token } = await createSessionForUser(user.id);

    return NextResponse.json({
      success: true,
      token,
      user,
      hasCompletedOnboarding: false,
      redirectUrl: "/onboarding",
    });
  } catch (error) {
    console.error("[API /auth/register]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat pendaftaran akun." },
      { status: 500 }
    );
  }
}
