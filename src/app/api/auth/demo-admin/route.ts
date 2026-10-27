import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { createSessionForUser, hashPassword } from "@/lib/auth";
import { ensureAdminAndSeededData } from "@/server/admin/service";

export async function POST() {
  try {
    // 1. Ensure admin user exists
    await ensureAdminAndSeededData();

    let adminUser = await prisma.user.findFirst({
      where: { role: "admin" },
    });

    if (!adminUser) {
      const defaultPassword = hashPassword("admin123");
      adminUser = await prisma.user.create({
        data: {
          email: "admin@stara.ac.id",
          name: "Administrator STARA",
          password: defaultPassword,
          role: "admin",
        },
      });
    }

    // 2. Create session
    const { token, session } = await createSessionForUser(adminUser.id);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: adminUser.id,
        name: adminUser.name || "Administrator STARA",
        email: adminUser.email,
        role: "admin",
      },
      redirectUrl: "/admin",
    });
  } catch (error) {
    console.error("[API /auth/demo-admin]", error);
    return NextResponse.json(
      { error: "Gagal masuk mode demo admin." },
      { status: 500 }
    );
  }
}
