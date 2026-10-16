import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { token?: string };
    const token = body.token;
    if (!token) return NextResponse.json({ valid: false });

    const session = await prisma.guestSession.findUnique({ where: { token } });
    const valid = !!session && session.expiresAt > new Date();
    return NextResponse.json({ valid });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
