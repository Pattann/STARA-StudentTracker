import { NextResponse } from "next/server";
import { createDemoSession } from "@/server/demo";

export async function POST() {
  try {
    const token = await createDemoSession();
    return NextResponse.json({ token, success: true });
  } catch (error) {
    console.error("[API /demo/start]", error);
    return NextResponse.json(
      { error: "Gagal memulai sesi demo." },
      { status: 500 }
    );
  }
}
