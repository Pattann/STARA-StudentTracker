import { NextResponse } from "next/server";
import { runAiPingBenchmark } from "@/server/admin/service";

export async function POST() {
  try {
    const result = await runAiPingBenchmark();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API /admin/ai-monitor/ping POST]", error);
    return NextResponse.json(
      {
        success: false,
        latencyMs: 0,
        error: error?.message || "Gagal melakukan ping ke AI provider.",
      },
      { status: 500 }
    );
  }
}
