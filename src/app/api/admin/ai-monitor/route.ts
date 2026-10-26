import { NextResponse } from "next/server";
import { getAiMonitorData } from "@/server/admin/service";

export async function GET() {
  try {
    const data = await getAiMonitorData();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("[API /admin/ai-monitor GET]", error);
    return NextResponse.json({ error: "Gagal memuat status AI monitor." }, { status: 500 });
  }
}
