import "server-only";
import crypto from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/server/db/prisma";

const SECRET = process.env.NEXTAUTH_SECRET || "stara-secret-key-salt-2026";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 2) return false;
  const [salt, originalHash] = parts;
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === originalHash;
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSessionForUser(userId: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const session = await prisma.guestSession.create({
    data: {
      token,
      expiresAt,
    },
  });

  return { token, session };
}

export async function resolveAuthUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  let token: string | null = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    token = req.headers.get("x-demo-token") ?? req.nextUrl.searchParams.get("token");
  }

  if (!token) return null;

  // Find session
  const session = await prisma.guestSession.findUnique({
    where: { token },
    include: {
      academicProfile: true,
    },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  // Find linked user if academicProfile has userId or find user
  let user = null;
  if (session.academicProfile?.userId) {
    user = await prisma.user.findUnique({
      where: { id: session.academicProfile.userId },
      select: { id: true, email: true, name: true, role: true },
    });
  }

  return {
    session,
    user,
    hasCompletedOnboarding: Boolean(session.academicProfile),
  };
}
