import { NextRequest, NextResponse } from "next/server";
import { getAdminTemplatesAndReports, updateTemplateStatus } from "@/server/admin/service";
import { z } from "zod";

const UpdateTemplateSchema = z.object({
  templateId: z.string().min(1),
  sourceType: z.enum(["terverifikasi", "komunitas"]).optional(),
  isHidden: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const templateStatus = (searchParams.get("status") || "all") as "all" | "verified" | "unverified" | "hidden";
    const search = searchParams.get("q") || undefined;

    const data = await getAdminTemplatesAndReports({ templateStatus, search });
    return NextResponse.json({ success: true, templates: data.templates });
  } catch (error) {
    console.error("[API /admin/templates GET]", error);
    return NextResponse.json({ error: "Gagal memuat template." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = UpdateTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data perubahan tidak valid." },
        { status: 400 }
      );
    }

    const { templateId, ...updates } = parsed.data;
    const updated = await updateTemplateStatus(templateId, updates);

    return NextResponse.json({
      success: true,
      message: "Status template berhasil diperbarui.",
      template: updated,
    });
  } catch (error) {
    console.error("[API /admin/templates PATCH]", error);
    return NextResponse.json({ error: "Gagal memperbarui status template." }, { status: 500 });
  }
}
