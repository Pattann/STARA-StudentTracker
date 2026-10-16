import { NextRequest, NextResponse } from "next/server";
import { resetDemoSession } from "@/server/demo";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { token?: string };
    const token = body.token;
    if (!token) return NextResponse.json({ error: "Token diperlukan." }, { status: 400 });

    const newToken = await resetDemoSession(token);
    return NextResponse.json({ token: newToken, success: true });
  } catch (error) {
    console.error("[API /demo/reset]", error);
    return NextResponse.json({ error: "Gagal mereset demo." }, { status: 500 });
  }
}
