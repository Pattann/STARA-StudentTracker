import { NextResponse } from "next/server";
import { getAdminOverviewData } from "@/server/admin/service";

export async function GET() {
  try {
    const data = await getAdminOverviewData();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("[API /admin/overview]", error);
    return NextResponse.json({ error: "Gagal memuat data ringkasan admin." }, { status: 500 });
  }
}
