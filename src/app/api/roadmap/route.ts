import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { calculateFullRoadmap } from "@/server/rules-engine";
import { parseJsonSafe } from "@/lib/utils";

async function resolveSession(req: NextRequest) {
  const token = req.headers.get("x-demo-token") ?? req.nextUrl.searchParams.get("token");
  if (!token) return null;
  const session = await prisma.guestSession.findUnique({ where: { token } });
  if (!session || session.expiresAt < new Date()) return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

  try {
    const roadmap = await prisma.roadmap.findFirst({
      where: { guestSessionId: session.id },
      orderBy: { createdAt: "desc" },
    });

    if (!roadmap) {
      const profile = await prisma.academicProfile.findUnique({
        where: { guestSessionId: session.id },
      });
      return NextResponse.json({ roadmap: null, profile });
    }

    const version = roadmap.currentVersionId
      ? await prisma.roadmapVersion.findUnique({
          where: { id: roadmap.currentVersionId },
          include: {
            semesterPlans: {
              include: { tasks: { orderBy: { createdAt: "asc" } } },
              orderBy: { semesterNum: "asc" },
            },
          },
        })
      : null;

    const profile = await prisma.academicProfile.findUnique({
      where: { guestSessionId: session.id },
    });

    const versions = await prisma.roadmapVersion.findMany({
      where: { roadmapId: roadmap.id },
      orderBy: { versionNum: "desc" },
      select: { id: true, versionNum: true, label: true, createdAt: true, isBaseline: true },
    });

    // Calculate using rules engine
    let calculation = null;
    if (version && profile) {
      calculation = calculateFullRoadmap({
        totalCurriculumCredits: profile.totalCurriculumCredits,
        completedCredits: profile.completedCredits,
        inProgressCredits: profile.inProgressCredits,
        currentSemester: profile.currentSemester,
        goals: profile.goals,
        semesterPlans: version.semesterPlans.map((sp) => ({
          semesterNum: sp.semesterNum,
          targetCredits: sp.targetCredits,
          plannedCredits: sp.plannedCredits,
          tasks: sp.tasks.map((t) => ({
            id: t.id,
            credits: t.credits,
            status: t.status,
            category: t.category,
            prerequisites: parseJsonSafe<string[]>(t.prerequisites, []),
          })),
        })),
      });
    }

    return NextResponse.json({
      roadmap: {
        ...roadmap,
        currentVersion: version,
        versions,
      },
      profile,
      calculation,
    });
  } catch (error) {
    console.error("[API /roadmap GET]", error);
    return NextResponse.json({ error: "Gagal memuat roadmap." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

  try {
    const body = (await req.json()) as {
      action?: string;
      taskId?: string;
      updates?: Record<string, unknown>;
      versionId?: string;
      templateId?: string;
      templateTitle?: string;
      templateSource?: "komunitas" | "kampus";
      mode?: "merge" | "new_version";
      targetSemesterNum?: number;
      semesterNum?: number;
      targetCredits?: number;
      title?: string;
      category?: string;
      credits?: number;
      courseCode?: string;
      notes?: string;
      status?: string;
      isMilestone?: boolean;
      items?: Array<{
        title: string;
        category: string;
        credits: number;
        courseCode?: string;
        notes?: string;
        targetSemesterNum: number;
        certaintyLevel?: string;
      }>;
    };

    if (body.action === "clear_roadmap") {
      await prisma.roadmap.deleteMany({ where: { guestSessionId: session.id } });
      return NextResponse.json({ success: true, message: "Roadmap berhasil dikosongkan." });
    }

    if (body.action === "update_task" && body.taskId) {
      const task = await prisma.roadmapTask.findUnique({ where: { id: body.taskId } });
      if (!task) return NextResponse.json({ error: "Task tidak ditemukan." }, { status: 404 });

      // Verify ownership
      const plan = await prisma.semesterPlan.findUnique({ where: { id: task.semesterPlanId } });
      if (!plan) return NextResponse.json({ error: "Plan tidak ditemukan." }, { status: 404 });
      const version = await prisma.roadmapVersion.findUnique({ where: { id: plan.roadmapVersionId } });
      if (!version) return NextResponse.json({ error: "Version tidak ditemukan." }, { status: 404 });
      const roadmap = await prisma.roadmap.findUnique({ where: { id: version.roadmapId } });
      if (!roadmap || roadmap.guestSessionId !== session.id) {
        return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
      }

      const allowed = ["status", "notes", "targetDate", "credits", "title", "courseCode", "category"] as const;
      const safeUpdates: Record<string, unknown> = {};
      for (const key of allowed) {
        if (body.updates && key in body.updates) {
          safeUpdates[key] = body.updates[key];
        }
      }

      const updated = await prisma.roadmapTask.update({
        where: { id: body.taskId },
        data: safeUpdates,
      });

      return NextResponse.json({ task: updated });
    }

    if (body.action === "add_task") {
      const {
        semesterNum,
        title,
        category = "akademik",
        credits = 0,
        courseCode,
        notes,
        status = "planned",
        isMilestone = false,
      } = body;

      if (!title || !semesterNum) {
        return NextResponse.json({ error: "Judul dan semester wajib diisi." }, { status: 400 });
      }

      const roadmap = await prisma.roadmap.findFirst({
        where: { guestSessionId: session.id },
        orderBy: { createdAt: "desc" },
      });
      if (!roadmap || !roadmap.currentVersionId) {
        return NextResponse.json({ error: "Roadmap tidak ditemukan." }, { status: 404 });
      }

      let plan = await prisma.semesterPlan.findFirst({
        where: {
          roadmapVersionId: roadmap.currentVersionId,
          semesterNum: Number(semesterNum),
        },
      });

      if (!plan) {
        plan = await prisma.semesterPlan.create({
          data: {
            roadmapVersionId: roadmap.currentVersionId,
            semesterNum: Number(semesterNum),
            semesterLabel: `Semester ${semesterNum}`,
            targetCredits: 20,
            plannedCredits: isMilestone ? 0 : Number(credits) || 0,
            isCurrentSemester: Number(semesterNum) === 5,
          },
        });
      }

      // CRITICAL RULE: Item non-SKS tidak boleh ikut menambah total SKS akademik
      const finalCredits = isMilestone || (category !== "akademik" && category !== "skripsi" && credits === 0) ? 0 : Number(credits) || 0;

      const newTask = await prisma.roadmapTask.create({
        data: {
          semesterPlanId: plan.id,
          title,
          category,
          credits: finalCredits,
          courseCode: courseCode || null,
          notes: notes || null,
          status,
          dataSource: "mahasiswa",
          certaintyLevel: "pasti",
        },
      });

      return NextResponse.json({
        success: true,
        message: isMilestone ? "Milestone pribadi berhasil ditambahkan (0 SKS)." : "Mata kuliah berhasil ditambahkan ke roadmap.",
        task: newTask,
      });
    }

    if (body.action === "move_task" && body.taskId && body.targetSemesterNum) {
      const task = await prisma.roadmapTask.findUnique({
        where: { id: body.taskId },
        include: { semesterPlan: true },
      });
      if (!task) return NextResponse.json({ error: "Item tidak ditemukan." }, { status: 404 });

      // CRITICAL RULE: Mata kuliah yang sudah selesai tidak boleh berpindah semester
      if (task.status === "done") {
        return NextResponse.json(
          { error: "Mata kuliah yang sudah selesai (Lulus) terkunci di semester aslinya dan tidak dapat dipindahkan." },
          { status: 400 }
        );
      }

      const roadmap = await prisma.roadmap.findFirst({
        where: { guestSessionId: session.id },
        orderBy: { createdAt: "desc" },
      });
      if (!roadmap || !roadmap.currentVersionId) {
        return NextResponse.json({ error: "Roadmap tidak ditemukan." }, { status: 404 });
      }

      let destPlan = await prisma.semesterPlan.findFirst({
        where: {
          roadmapVersionId: roadmap.currentVersionId,
          semesterNum: Number(body.targetSemesterNum),
        },
      });

      if (!destPlan) {
        destPlan = await prisma.semesterPlan.create({
          data: {
            roadmapVersionId: roadmap.currentVersionId,
            semesterNum: Number(body.targetSemesterNum),
            semesterLabel: `Semester ${body.targetSemesterNum}`,
            targetCredits: 20,
            plannedCredits: task.credits,
            isCurrentSemester: Number(body.targetSemesterNum) === 5,
          },
        });
      }

      const updated = await prisma.roadmapTask.update({
        where: { id: task.id },
        data: { semesterPlanId: destPlan.id },
      });

      return NextResponse.json({
        success: true,
        message: `"${task.title}" berhasil dipindahkan ke Semester ${body.targetSemesterNum}.`,
        task: updated,
      });
    }

    if (body.action === "update_semester_target" && body.semesterNum && body.targetCredits) {
      const roadmap = await prisma.roadmap.findFirst({
        where: { guestSessionId: session.id },
        orderBy: { createdAt: "desc" },
      });
      if (!roadmap || !roadmap.currentVersionId) {
        return NextResponse.json({ error: "Roadmap tidak ditemukan." }, { status: 404 });
      }

      let plan = await prisma.semesterPlan.findFirst({
        where: {
          roadmapVersionId: roadmap.currentVersionId,
          semesterNum: Number(body.semesterNum),
        },
      });

      if (!plan) {
        plan = await prisma.semesterPlan.create({
          data: {
            roadmapVersionId: roadmap.currentVersionId,
            semesterNum: Number(body.semesterNum),
            semesterLabel: `Semester ${body.semesterNum}`,
            targetCredits: Number(body.targetCredits) || 20,
            plannedCredits: 0,
            isCurrentSemester: Number(body.semesterNum) === 5,
          },
        });
      } else {
        plan = await prisma.semesterPlan.update({
          where: { id: plan.id },
          data: { targetCredits: Number(body.targetCredits) || 20 },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Target beban Semester ${body.semesterNum} diperbarui menjadi ${body.targetCredits} SKS.`,
        plan,
      });
    }

    if (body.action === "apply_template") {
      const {
        templateId,
        templateTitle = "Template Baru",
        templateSource = "komunitas",
        mode = "merge",
        targetSemesterNum,
        items = [],
      } = body;

      const roadmap = await prisma.roadmap.findFirst({
        where: { guestSessionId: session.id },
        orderBy: { createdAt: "desc" },
      });
      if (!roadmap) {
        return NextResponse.json({ error: "Roadmap tidak ditemukan." }, { status: 404 });
      }

      const currentVersion = roadmap.currentVersionId
        ? await prisma.roadmapVersion.findUnique({
            where: { id: roadmap.currentVersionId },
            include: { semesterPlans: { include: { tasks: true } } },
          })
        : null;

      if (!currentVersion) {
        return NextResponse.json({ error: "Versi aktif roadmap tidak ditemukan." }, { status: 404 });
      }

      const taskSource = templateSource === "kampus" ? "kampus" : "template";

      if (mode === "new_version") {
        const maxVersion = await prisma.roadmapVersion.findFirst({
          where: { roadmapId: roadmap.id },
          orderBy: { versionNum: "desc" },
        });
        const nextVersionNum = (maxVersion?.versionNum ?? 0) + 1;

        const newVersion = await prisma.$transaction(async (tx) => {
          const nv = await tx.roadmapVersion.create({
            data: {
              roadmapId: roadmap.id,
              versionNum: nextVersionNum,
              label: `Template: ${templateTitle}`,
              description: `Diterapkan dari ${templateSource === "kampus" ? "Resmi Kampus" : "Komunitas"}`,
            },
          });

          const planMap = new Map<number, string>();
          for (const sp of currentVersion.semesterPlans) {
            const clonedPlan = await tx.semesterPlan.create({
              data: {
                roadmapVersionId: nv.id,
                semesterNum: sp.semesterNum,
                semesterLabel: sp.semesterLabel,
                targetCredits: sp.targetCredits,
                plannedCredits: sp.plannedCredits,
                isCurrentSemester: sp.isCurrentSemester,
                notes: sp.notes,
              },
            });
            planMap.set(sp.semesterNum, clonedPlan.id);

            for (const t of sp.tasks) {
              await tx.roadmapTask.create({
                data: {
                  semesterPlanId: clonedPlan.id,
                  title: t.title,
                  description: t.description,
                  category: t.category,
                  credits: t.credits,
                  priority: t.priority,
                  status: t.status,
                  targetDate: t.targetDate,
                  completedDate: t.completedDate,
                  courseCode: t.courseCode,
                  notes: t.notes,
                  dataSource: t.dataSource,
                  certaintyLevel: t.certaintyLevel,
                  prerequisites: t.prerequisites,
                },
              });
            }
          }

          // Add items from the template
          for (const item of items) {
            const semNum =
              targetSemesterNum && targetSemesterNum > 0
                ? targetSemesterNum
                : item.targetSemesterNum || 5;

            let planId = planMap.get(semNum);
            if (!planId) {
              const newPlan = await tx.semesterPlan.create({
                data: {
                  roadmapVersionId: nv.id,
                  semesterNum: semNum,
                  semesterLabel: `Semester ${semNum}`,
                  targetCredits: 20,
                  plannedCredits: item.credits || 0,
                  isCurrentSemester: semNum === 5,
                },
              });
              planId = newPlan.id;
              planMap.set(semNum, planId);
            }

            await tx.roadmapTask.create({
              data: {
                semesterPlanId: planId,
                title: item.title,
                category: item.category || "akademik",
                credits: item.credits || 0,
                courseCode: item.courseCode || null,
                notes: item.notes || `Dari template ${templateTitle}`,
                status: "planned",
                dataSource: taskSource,
                certaintyLevel: item.certaintyLevel || "estimasi",
              },
            });
          }

          await tx.roadmap.update({
            where: { id: roadmap.id },
            data: { currentVersionId: nv.id },
          });

          return nv;
        });

        if (templateId) {
          try {
            await prisma.templateClone.create({
              data: { sourceTemplateId: templateId, guestSessionId: session.id },
            });
          } catch {}
        }

        return NextResponse.json({
          success: true,
          message: `Berhasil membuat versi baru v${nextVersionNum} dari template "${templateTitle}".`,
          versionId: newVersion.id,
        });
      } else {
        // Mode merge into current version
        await prisma.$transaction(async (tx) => {
          for (const item of items) {
            const semNum =
              targetSemesterNum && targetSemesterNum > 0
                ? targetSemesterNum
                : item.targetSemesterNum || 5;

            let existingPlan = currentVersion.semesterPlans.find((sp) => sp.semesterNum === semNum);
            let planId = existingPlan?.id;

            if (!planId) {
              const createdPlan = await tx.semesterPlan.create({
                data: {
                  roadmapVersionId: currentVersion.id,
                  semesterNum: semNum,
                  semesterLabel: `Semester ${semNum}`,
                  targetCredits: 20,
                  plannedCredits: item.credits || 0,
                  isCurrentSemester: semNum === 5,
                },
              });
              planId = createdPlan.id;
            }

            await tx.roadmapTask.create({
              data: {
                semesterPlanId: planId,
                title: item.title,
                category: item.category || "akademik",
                credits: item.credits || 0,
                courseCode: item.courseCode || null,
                notes: item.notes || `Dari template: ${templateTitle}`,
                status: "planned",
                dataSource: taskSource,
                certaintyLevel: item.certaintyLevel || "estimasi",
              },
            });
          }
        });

        if (templateId) {
          try {
            await prisma.templateClone.create({
              data: { sourceTemplateId: templateId, guestSessionId: session.id },
            });
          } catch {}
        }

        return NextResponse.json({
          success: true,
          message: `${items.length} tugas/mata kuliah dari "${templateTitle}" berhasil digabungkan ke Roadmap kamu.`,
        });
      }
    }

    if (body.action === "switch_version" && body.versionId) {
      const roadmap = await prisma.roadmap.findFirst({
        where: { guestSessionId: session.id },
      });
      if (!roadmap) return NextResponse.json({ error: "Roadmap tidak ditemukan." }, { status: 404 });

      const version = await prisma.roadmapVersion.findUnique({
        where: { id: body.versionId },
      });
      if (!version || version.roadmapId !== roadmap.id) {
        return NextResponse.json({ error: "Versi tidak valid." }, { status: 404 });
      }

      await prisma.roadmap.update({
        where: { id: roadmap.id },
        data: { currentVersionId: version.id },
      });

      return NextResponse.json({
        success: true,
        message: `Beralih ke versi v${version.versionNum} — ${version.label ?? "Tanpa judul"}`,
      });
    }

    if (body.action === "delete_task" && body.taskId) {
      const task = await prisma.roadmapTask.findUnique({ where: { id: body.taskId } });
      if (!task) return NextResponse.json({ error: "Task tidak ditemukan." }, { status: 404 });
      if (task.status === "done") {
        return NextResponse.json(
          { error: "Mata kuliah yang sudah selesai (Lulus) terkunci dan tidak dapat dihapus dari riwayat akademik." },
          { status: 400 }
        );
      }
      await prisma.roadmapTask.delete({ where: { id: body.taskId } });
      return NextResponse.json({ success: true, message: "Item berhasil dihapus." });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (error) {
    console.error("[API /roadmap POST]", error);
    return NextResponse.json({ error: "Gagal memproses permintaan." }, { status: 500 });
  }
}
