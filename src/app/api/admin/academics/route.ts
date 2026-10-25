import { NextRequest, NextResponse } from "next/server";
import { getAcademicsData, addCourseToCatalog } from "@/server/admin/service";
import { z } from "zod";

const AddCourseSchema = z.object({
  code: z.string().min(2, "Kode MK minimal 2 karakter"),
  name: z.string().min(3, "Nama MK minimal 3 karakter"),
  credits: z.coerce.number().min(1).max(24),
  semesterNum: z.coerce.number().min(1).max(8),
  category: z.enum(["akademik", "tak", "karier", "skripsi", "pribadi"]),
  prerequisites: z.array(z.string()).optional(),
  description: z.string().default(""),
});

export async function GET() {
  try {
    const data = getAcademicsData();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("[API /admin/academics GET]", error);
    return NextResponse.json({ error: "Gagal memuat data akademik." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AddCourseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Input mata kuliah tidak valid." },
        { status: 400 }
      );
    }

    const newCourse = addCourseToCatalog(parsed.data);
    return NextResponse.json({
      success: true,
      message: "Mata kuliah berhasil ditambahkan ke kurikulum.",
      course: newCourse,
    });
  } catch (error) {
    console.error("[API /admin/academics POST]", error);
    return NextResponse.json({ error: "Gagal menyimpan mata kuliah." }, { status: 500 });
  }
}
