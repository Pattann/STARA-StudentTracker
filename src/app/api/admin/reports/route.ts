import { NextRequest, NextResponse } from "next/server";
import { getAdminTemplatesAndReports, updateModerationReport } from "@/server/admin/service";
import { z } from "zod";

const UpdateReportSchema = z.object({
  reportId: z.string().min(1),
  status: z.enum(["open", "reviewed", "resolved"]),
  moderatorNote: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const reportStatus = (searchParams.get("status") || "all") as "all" | "open" | "reviewed" | "resolved";

    const data = await getAdminTemplatesAndReports({ reportStatus });
    return NextResponse.json({ success: true, reports: data.reports });
  } catch (error) {
    console.error("[API /admin/reports GET]", error);
    return NextResponse.json({ error: "Gagal memuat laporan moderasi." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = UpdateReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data resolusi laporan tidak valid." },
        { status: 400 }
      );
    }

    const { reportId, status, moderatorNote } = parsed.data;
    const updated = await updateModerationReport(reportId, { status, moderatorNote });

    return NextResponse.json({
      success: true,
      message: "Status laporan berhasil diperbarui.",
      report: updated,
    });
  } catch (error) {
    console.error("[API /admin/reports PATCH]", error);
    return NextResponse.json({ error: "Gagal memperbarui status laporan." }, { status: 500 });
  }
}
