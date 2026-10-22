import { NextRequest, NextResponse } from "next/server";
import { resolveAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuthUser(req);
    if (!auth) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: auth.user,
      hasCompletedOnboarding: auth.hasCompletedOnboarding,
    });
  } catch (error) {
    console.error("[API /auth/me]", error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
