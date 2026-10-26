import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { calculateFullRoadmap, validateRoadmapRules } from "@/server/rules-engine";
import { parseJsonSafe } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Session Resolver Helper
// ─────────────────────────────────────────────────────────────────────────────
async function resolveSession(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  let token: string | null = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    token = req.headers.get("x-demo-token") ?? req.nextUrl.searchParams.get("token");
  }

  if (!token) return null;

  const session = await prisma.guestSession.findUnique({
    where: { token },
    include: { academicProfile: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session;
}

// ─────────────────────────────────────────────────────────────────────────────
// SKS Recalculation & Sync Helpers
// ─────────────────────────────────────────────────────────────────────────────
async function syncSemesterPlanCredits(planId: string, tx: typeof prisma | Parameters<Parameters<typeof prisma.$transaction>[0]>[0] = prisma) {
  const tasks = await tx.roadmapTask.findMany({
    where: { semesterPlanId: planId, status: { not: "cancelled" } },
  });

  // CRITICAL RULE: Hanya mata kuliah (COURSE) atau tugas ber-SKS resmi yang dihitung
  const totalPlanned = tasks.reduce((sum, t) => {
    const isAcademic = t.itemType === "COURSE" || t.category === "akademik" || t.credits > 0;
    return sum + (isAcademic ? (Number(t.credits) || 0) : 0);
  }, 0);

  await tx.semesterPlan.update({
    where: { id: planId },
    data: { plannedCredits: totalPlanned },
  });

  return totalPlanned;
}

async function syncProfileAcademicMetrics(sessionId: string, currentVersionId: string, tx: typeof prisma | Parameters<Parameters<typeof prisma.$transaction>[0]>[0] = prisma) {
  const profile = await tx.academicProfile.findUnique({ where: { guestSessionId: sessionId } });
  if (!profile) return;

  const currentVersion = await tx.roadmapVersion.findUnique({
    where: { id: currentVersionId },
    include: { semesterPlans: { include: { tasks: true } } },
  });
  if (!currentVersion) return;

  let completedCredits = 0;
  let inProgressCredits = 0;

  for (const sp of currentVersion.semesterPlans) {
    for (const t of sp.tasks) {
      if (t.status === "cancelled") continue;
      const isCourse = t.itemType === "COURSE" || t.category === "akademik" || t.credits > 0;
      if (!isCourse) continue;

      const credits = Number(t.credits) || 0;
      if (t.status === "done") {
        completedCredits += credits;
      } else if (t.status === "in_progress" || (sp.isCurrentSemester && t.status !== "delayed")) {
        inProgressCredits += credits;
      }
    }
  }

  await tx.academicProfile.update({
    where: { id: profile.id },
    data: {
      completedCredits,
      inProgressCredits,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET: Fetch Active Roadmap, Versions, Profile & Real-Time Calculation
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await resolveSession(req);
  if (!session) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

  try {
    const roadmap = await prisma.roadmap.findFirst({
      where: { guestSessionId: session.id },
      orderBy: { createdAt: "desc" },
    });

    const profile = await prisma.academicProfile.findUnique({
      where: { guestSessionId: session.id },
    });

    if (!roadmap) {
      return NextResponse.json({ roadmap: null, profile, calculation: null });
    }

    const version = roadmap.currentVersionId
      ? await prisma.roadmapVersion.findUnique({
          where: { id: roadmap.currentVersionId },
          include: {
            semesterPlans: {
              include: {
                tasks: {
                  orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
                },
              },
              orderBy: { semesterNum: "asc" },
            },
          },
        })
      : null;

    const versions = await prisma.roadmapVersion.findMany({
      where: { roadmapId: roadmap.id },
      orderBy: { versionNum: "desc" },
      select: {
        id: true,
        versionNum: true,
        label: true,
        description: true,
        isBaseline: true,
        isDraft: true,
        createdAt: true,
      },
    });

    let calculation = null;
    let ruleValidation = null;

    if (version && profile) {
      const calculationInput = {
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
            itemType: t.itemType || "COURSE",
            courseCode: t.courseCode,
            title: t.title,
            prerequisites: parseJsonSafe<string[]>(t.prerequisites, []),
            weeklyHours: t.weeklyHours,
            activityPeriod: t.activityPeriod,
          })),
        })),
      };

      calculation = calculateFullRoadmap(calculationInput);
      ruleValidation = validateRoadmapRules(calculationInput);
    }

    return NextResponse.json({
      roadmap: {
        ...roadmap,
        currentVersion: version,
        versions,
        isDraftMode: Boolean(version?.isDraft),
      },
      profile,
      calculation,
      ruleValidation,
    });
  } catch (error) {
    console.error("[API /roadmap GET]", error);
    return NextResponse.json({ error: "Gagal memuat data roadmap." }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST: Roadmap Actions (CRUD, Move, Drafts, Target, Template)
// ─────────────────────────────────────────────────────────────────────────────
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
      itemType?: "COURSE" | "ACTIVITY" | "MILESTONE";
      title?: string;
      category?: string;
      credits?: number;
      courseCode?: string;
      notes?: string;
      status?: string;
      targetDate?: string;
      activityPeriod?: string;
      weeklyHours?: number;
      prerequisites?: string[];
      isMilestone?: boolean;
      draftLabel?: string;
      items?: Array<{
        title: string;
        category: string;
        credits: number;
        itemType?: "COURSE" | "ACTIVITY" | "MILESTONE";
        courseCode?: string;
        notes?: string;
        targetSemesterNum: number;
        certaintyLevel?: string;
        weeklyHours?: number;
        activityPeriod?: string;
      }>;
    };

    const action = body.action;

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: clear_roadmap
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "clear_roadmap") {
      await prisma.roadmap.deleteMany({ where: { guestSessionId: session.id } });
      return NextResponse.json({ success: true, message: "Roadmap berhasil dikosongkan." });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper to get active roadmap & active version
    // ─────────────────────────────────────────────────────────────────────────
    const roadmap = await prisma.roadmap.findFirst({
      where: { guestSessionId: session.id },
      orderBy: { createdAt: "desc" },
    });

    if (!roadmap || !roadmap.currentVersionId) {
      return NextResponse.json({ error: "Roadmap belum dibuat. Mulai dengan membuat atau memilih template." }, { status: 404 });
    }

    const currentVersionId = roadmap.currentVersionId;

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: add_item (or add_task)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "add_item" || action === "add_task") {
      const {
        semesterNum,
        title,
        category = "akademik",
        credits = 0,
        courseCode,
        notes,
        status = "planned",
        targetDate,
        activityPeriod,
        weeklyHours,
        prerequisites = [],
      } = body;

      const rawItemType = body.itemType ?? (body.isMilestone ? "MILESTONE" : category === "akademik" || credits > 0 ? "COURSE" : "ACTIVITY");
      const itemType = rawItemType.toUpperCase() as "COURSE" | "ACTIVITY" | "MILESTONE";

      if (!title || !title.trim()) {
        return NextResponse.json({ error: "Judul item wajib diisi." }, { status: 400 });
      }
      if (!semesterNum || Number(semesterNum) < 1 || Number(semesterNum) > 14) {
        return NextResponse.json({ error: "Nomor semester tidak valid (1-14)." }, { status: 400 });
      }

      // CRITICAL RULE Kategori Item:
      // COURSE memiliki SKS (1-6).
      // ACTIVITY & MILESTONE default 0 SKS, kecuali ada konversi resmi.
      let finalCredits = 0;
      if (itemType === "COURSE") {
        finalCredits = Math.max(1, Math.min(6, Number(credits) || 3));
      } else if (itemType === "ACTIVITY") {
        finalCredits = Math.max(0, Math.min(20, Number(credits) || 0));
      } else {
        finalCredits = 0; // MILESTONE strictly 0
      }

      // Find or create semester plan
      let plan = await prisma.semesterPlan.findFirst({
        where: { roadmapVersionId: currentVersionId, semesterNum: Number(semesterNum) },
      });

      if (!plan) {
        plan = await prisma.semesterPlan.create({
          data: {
            roadmapVersionId: currentVersionId,
            semesterNum: Number(semesterNum),
            semesterLabel: `Semester ${semesterNum}`,
            targetCredits: 20,
            plannedCredits: 0,
            isCurrentSemester: Number(semesterNum) === (session.academicProfile?.currentSemester ?? 4),
          },
        });
      }

      // Check duplicate course in other semesters
      let duplicateWarning: string | null = null;
      if (itemType === "COURSE" && courseCode && courseCode.trim()) {
        const cleanCode = courseCode.trim().toUpperCase();
        const existing = await prisma.roadmapTask.findFirst({
          where: {
            courseCode: cleanCode,
            status: { notIn: ["delayed", "cancelled"] },
            semesterPlan: { roadmapVersionId: currentVersionId },
          },
          include: { semesterPlan: true },
        });

        if (existing) {
          duplicateWarning = `Catatan: Kode mata kuliah ${cleanCode} sudah ada di Semester ${existing.semesterPlan.semesterNum}.`;
        }
      }

      const newTask = await prisma.$transaction(async (tx) => {
        const created = await tx.roadmapTask.create({
          data: {
            semesterPlanId: plan.id,
            title: title.trim(),
            itemType,
            category,
            credits: finalCredits,
            courseCode: courseCode ? courseCode.trim().toUpperCase() : null,
            notes: notes ? notes.trim() : null,
            status,
            targetDate: targetDate || null,
            activityPeriod: activityPeriod || null,
            weeklyHours: weeklyHours ? Number(weeklyHours) : null,
            prerequisites: JSON.stringify(prerequisites || []),
            dataSource: "mahasiswa",
            certaintyLevel: itemType === "COURSE" ? "pasti" : "estimasi",
          },
        });

        await syncSemesterPlanCredits(plan.id, tx);
        await syncProfileAcademicMetrics(session.id, currentVersionId, tx);
        return created;
      });

      const messageTypeMap = {
        COURSE: "Mata kuliah berhasil ditambahkan ke rencana studi.",
        ACTIVITY: "Kegiatan berhasil ditambahkan.",
        MILESTONE: "Milestone pribadi berhasil ditambahkan (0 SKS).",
      };

      return NextResponse.json({
        success: true,
        message: messageTypeMap[itemType] + (duplicateWarning ? ` ${duplicateWarning}` : ""),
        task: newTask,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: update_item (or update_task)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "update_item" || action === "update_task") {
      if (!body.taskId) {
        return NextResponse.json({ error: "Task ID wajib disertakan." }, { status: 400 });
      }

      const task = await prisma.roadmapTask.findUnique({
        where: { id: body.taskId },
        include: { semesterPlan: true },
      });
      if (!task) return NextResponse.json({ error: "Item tidak ditemukan." }, { status: 404 });

      // Ownership verify
      const plan = await prisma.semesterPlan.findUnique({
        where: { id: task.semesterPlanId },
        include: { roadmapVersion: { include: { roadmap: true } } },
      });
      if (!plan || plan.roadmapVersion.roadmap.guestSessionId !== session.id) {
        return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
      }

      const updates = body.updates || {};
      const safeData: Record<string, unknown> = {};

      if ("title" in updates && typeof updates.title === "string") safeData.title = updates.title.trim();
      if ("courseCode" in updates) safeData.courseCode = updates.courseCode ? String(updates.courseCode).trim().toUpperCase() : null;
      if ("notes" in updates) safeData.notes = updates.notes ? String(updates.notes).trim() : null;
      if ("targetDate" in updates) safeData.targetDate = updates.targetDate || null;
      if ("activityPeriod" in updates) safeData.activityPeriod = updates.activityPeriod || null;
      if ("weeklyHours" in updates) safeData.weeklyHours = updates.weeklyHours ? Number(updates.weeklyHours) : null;
      if ("status" in updates && typeof updates.status === "string") safeData.status = updates.status;
      if ("category" in updates && typeof updates.category === "string") safeData.category = updates.category;
      if ("itemType" in updates && typeof updates.itemType === "string") safeData.itemType = updates.itemType.toUpperCase();
      if ("prerequisites" in updates && Array.isArray(updates.prerequisites)) {
        safeData.prerequisites = JSON.stringify(updates.prerequisites);
      }

      // Credits validation
      const itemType = (safeData.itemType as string) || task.itemType || "COURSE";
      if ("credits" in updates) {
        if (itemType === "COURSE") {
          safeData.credits = Math.max(1, Math.min(6, Number(updates.credits) || 3));
        } else if (itemType === "ACTIVITY") {
          safeData.credits = Math.max(0, Math.min(20, Number(updates.credits) || 0));
        } else {
          safeData.credits = 0; // MILESTONE strictly 0
        }
      }

      const updatedTask = await prisma.$transaction(async (tx) => {
        const u = await tx.roadmapTask.update({
          where: { id: task.id },
          data: safeData,
        });

        await syncSemesterPlanCredits(task.semesterPlanId, tx);
        await syncProfileAcademicMetrics(session.id, currentVersionId, tx);
        return u;
      });

      return NextResponse.json({
        success: true,
        message: "Perubahan item berhasil disimpan.",
        task: updatedTask,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: move_item (or move_task)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "move_item" || action === "move_task") {
      const { taskId, targetSemesterNum } = body;
      if (!taskId || !targetSemesterNum) {
        return NextResponse.json({ error: "Task ID dan semester tujuan wajib diisi." }, { status: 400 });
      }

      const targetSem = Number(targetSemesterNum);
      if (targetSem < 1 || targetSem > 14) {
        return NextResponse.json({ error: "Semester tujuan tidak valid (1-14)." }, { status: 400 });
      }

      const task = await prisma.roadmapTask.findUnique({
        where: { id: taskId },
        include: { semesterPlan: true },
      });
      if (!task) return NextResponse.json({ error: "Item tidak ditemukan." }, { status: 404 });

      // RULE 1: Mata kuliah yang sudah selesai (done) terkunci di semester aslinya
      if (task.status === "done") {
        return NextResponse.json(
          { error: "Mata kuliah yang sudah selesai (Lulus) terkunci di semester aslinya dan tidak dapat dipindahkan dari riwayat akademik." },
          { status: 400 }
        );
      }

      const sourcePlanId = task.semesterPlanId;

      // Find or create destination semester plan
      let destPlan = await prisma.semesterPlan.findFirst({
        where: { roadmapVersionId: currentVersionId, semesterNum: targetSem },
      });

      if (!destPlan) {
        destPlan = await prisma.semesterPlan.create({
          data: {
            roadmapVersionId: currentVersionId,
            semesterNum: targetSem,
            semesterLabel: `Semester ${targetSem}`,
            targetCredits: 20,
            plannedCredits: 0,
            isCurrentSemester: targetSem === (session.academicProfile?.currentSemester ?? 4),
          },
        });
      }

      // RULE 2: Validasi Prasyarat pada Perpindahan
      const taskPrereqs = parseJsonSafe<string[]>(task.prerequisites, []);
      let prereqWarning: string | null = null;

      if (taskPrereqs.length > 0) {
        const allTasksInVersion = await prisma.roadmapTask.findMany({
          where: { semesterPlan: { roadmapVersionId: currentVersionId } },
          include: { semesterPlan: true },
        });

        for (const p of taskPrereqs) {
          const matchedPrereq = allTasksInVersion.find(
            (t) => t.id === p || (t.courseCode && t.courseCode.toUpperCase() === p.toUpperCase())
          );

          if (matchedPrereq && matchedPrereq.semesterPlan.semesterNum >= targetSem) {
            prereqWarning = `Peringatan: "${task.title}" dipindahkan ke Semester ${targetSem}, padahal prasyaratnya (${matchedPrereq.title}) direncanakan di Semester ${matchedPrereq.semesterPlan.semesterNum}.`;
          }
        }
      }

      // RULE 3: Validasi batas beban SKS semester tujuan
      const destCurrentCredits = await syncSemesterPlanCredits(destPlan.id);
      const resultingCredits = destCurrentCredits + (task.credits || 0);
      let loadWarning: string | null = null;
      if (resultingCredits > 24) {
        loadWarning = `Perhatian: Beban Semester ${targetSem} menjadi ${resultingCredits} SKS (melebihi batas reguler 24 SKS).`;
      }

      const movedTask = await prisma.$transaction(async (tx) => {
        const updated = await tx.roadmapTask.update({
          where: { id: task.id },
          data: { semesterPlanId: destPlan.id },
        });

        await syncSemesterPlanCredits(sourcePlanId, tx);
        await syncSemesterPlanCredits(destPlan.id, tx);
        await syncProfileAcademicMetrics(session.id, currentVersionId, tx);
        return updated;
      });

      const feedbackMsg = [
        `"${task.title}" berhasil dipindahkan ke Semester ${targetSem}.`,
        prereqWarning,
        loadWarning,
      ]
        .filter(Boolean)
        .join(" ");

      return NextResponse.json({
        success: true,
        message: feedbackMsg,
        task: movedTask,
        warning: prereqWarning || loadWarning,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: delete_item (or delete_task)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "delete_item" || action === "delete_task") {
      if (!body.taskId) {
        return NextResponse.json({ error: "Task ID wajib disertakan." }, { status: 400 });
      }

      const task = await prisma.roadmapTask.findUnique({ where: { id: body.taskId } });
      if (!task) return NextResponse.json({ error: "Item tidak ditemukan." }, { status: 404 });

      if (task.status === "done") {
        return NextResponse.json(
          { error: "Mata kuliah yang sudah selesai (Lulus) terkunci dan tidak dapat dihapus dari transkrip/riwayat akademik." },
          { status: 400 }
        );
      }

      const planId = task.semesterPlanId;
      await prisma.$transaction(async (tx) => {
        await tx.roadmapTask.delete({ where: { id: body.taskId } });
        await syncSemesterPlanCredits(planId, tx);
        await syncProfileAcademicMetrics(session.id, currentVersionId, tx);
      });

      return NextResponse.json({ success: true, message: `"${task.title}" berhasil dihapus dari roadmap.` });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: create_draft (Drafting Mechanism)
    // Clones current version into an isolated draft so edits don't affect baseline
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "create_draft") {
      const activeVersion = await prisma.roadmapVersion.findUnique({
        where: { id: currentVersionId },
        include: { semesterPlans: { include: { tasks: true } } },
      });
      if (!activeVersion) return NextResponse.json({ error: "Versi aktif tidak ditemukan." }, { status: 404 });

      // Find max version number
      const maxV = await prisma.roadmapVersion.findFirst({
        where: { roadmapId: roadmap.id },
        orderBy: { versionNum: "desc" },
      });
      const nextNum = (maxV?.versionNum ?? 0) + 1;

      const draftVersion = await prisma.$transaction(async (tx) => {
        const nv = await tx.roadmapVersion.create({
          data: {
            roadmapId: roadmap.id,
            versionNum: nextNum,
            label: body.draftLabel || `Draf Rencana Studi v${nextNum}`,
            description: "Draf penyesuaian akademik dalam proses penyuntingan.",
            isDraft: true,
            isBaseline: false,
          },
        });

        for (const sp of activeVersion.semesterPlans) {
          const newPlan = await tx.semesterPlan.create({
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

          for (const t of sp.tasks) {
            await tx.roadmapTask.create({
              data: {
                semesterPlanId: newPlan.id,
                title: t.title,
                description: t.description,
                itemType: t.itemType,
                category: t.category,
                credits: t.credits,
                priority: t.priority,
                status: t.status,
                targetDate: t.targetDate,
                completedDate: t.completedDate,
                courseCode: t.courseCode,
                notes: t.notes,
                activityPeriod: t.activityPeriod,
                weeklyHours: t.weeklyHours,
                dataSource: t.dataSource,
                certaintyLevel: t.certaintyLevel,
                prerequisites: t.prerequisites,
              },
            });
          }
        }

        await tx.roadmap.update({
          where: { id: roadmap.id },
          data: { currentVersionId: nv.id },
        });

        return nv;
      });

      return NextResponse.json({
        success: true,
        message: "Mode draf penyesuaian diaktifkan. Perubahan kamu tidak akan mengubah roadmap utama hingga disimpan.",
        versionId: draftVersion.id,
        isDraft: true,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: save_draft (Finalize Draft)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "save_draft" || action === "commit_draft") {
      const activeVersion = await prisma.roadmapVersion.findUnique({
        where: { id: currentVersionId },
      });
      if (!activeVersion) return NextResponse.json({ error: "Versi aktif tidak ditemukan." }, { status: 404 });

      await prisma.roadmapVersion.update({
        where: { id: activeVersion.id },
        data: {
          isDraft: false,
          label: body.draftLabel || activeVersion.label?.replace("Draf ", "") || `Rencana Studi v${activeVersion.versionNum}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Perubahan roadmap berhasil disimpan secara permanen sebagai versi aktif.",
        versionId: activeVersion.id,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: cancel_draft (Revert Draft)
    // Reverts to baseline / previous stable version without touching active roadmap
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "cancel_draft" || action === "revert_draft") {
      const activeVersion = await prisma.roadmapVersion.findUnique({
        where: { id: currentVersionId },
      });
      if (!activeVersion) return NextResponse.json({ error: "Versi tidak ditemukan." }, { status: 404 });

      if (!activeVersion.isDraft) {
        return NextResponse.json({ error: "Versi saat ini bukan draf, tidak ada perubahan yang perlu dibatalkan." }, { status: 400 });
      }

      // Find previous non-draft version
      const prevVersion = await prisma.roadmapVersion.findFirst({
        where: {
          roadmapId: roadmap.id,
          isDraft: false,
          versionNum: { lt: activeVersion.versionNum },
        },
        orderBy: { versionNum: "desc" },
      });

      if (prevVersion) {
        await prisma.$transaction(async (tx) => {
          await tx.roadmap.update({
            where: { id: roadmap.id },
            data: { currentVersionId: prevVersion.id },
          });
          // Delete the aborted draft
          await tx.roadmapVersion.delete({ where: { id: activeVersion.id } });
        });

        return NextResponse.json({
          success: true,
          message: "Draf penyesuaian dibatalkan. Roadmap kamu dikembalikan ke versi sebelum diedit.",
          revertedToVersionId: prevVersion.id,
        });
      } else {
        // If no prior version, simply un-draft current
        await prisma.roadmapVersion.update({
          where: { id: activeVersion.id },
          data: { isDraft: false },
        });
        return NextResponse.json({ success: true, message: "Draf direset." });
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: update_semester_target
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "update_semester_target") {
      const { semesterNum, targetCredits } = body;
      if (!semesterNum || !targetCredits) {
        return NextResponse.json({ error: "Semester dan target SKS wajib diisi." }, { status: 400 });
      }

      const target = Math.max(12, Math.min(24, Number(targetCredits) || 20));

      let plan = await prisma.semesterPlan.findFirst({
        where: { roadmapVersionId: currentVersionId, semesterNum: Number(semesterNum) },
      });

      if (!plan) {
        plan = await prisma.semesterPlan.create({
          data: {
            roadmapVersionId: currentVersionId,
            semesterNum: Number(semesterNum),
            semesterLabel: `Semester ${semesterNum}`,
            targetCredits: target,
            plannedCredits: 0,
            isCurrentSemester: Number(semesterNum) === (session.academicProfile?.currentSemester ?? 4),
          },
        });
      } else {
        plan = await prisma.semesterPlan.update({
          where: { id: plan.id },
          data: { targetCredits: target },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Target Semester ${semesterNum} diperbarui menjadi ${target} SKS.`,
        plan,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: apply_template
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "apply_template") {
      const {
        templateId,
        templateTitle = "Template Baru",
        templateSource = "komunitas",
        mode = "merge",
        targetSemesterNum,
        items = [],
      } = body;

      const currentVersion = await prisma.roadmapVersion.findUnique({
        where: { id: currentVersionId },
        include: { semesterPlans: { include: { tasks: true } } },
      });
      if (!currentVersion) return NextResponse.json({ error: "Versi aktif tidak ditemukan." }, { status: 404 });

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
                  itemType: t.itemType,
                  category: t.category,
                  credits: t.credits,
                  priority: t.priority,
                  status: t.status,
                  targetDate: t.targetDate,
                  completedDate: t.completedDate,
                  courseCode: t.courseCode,
                  notes: t.notes,
                  activityPeriod: t.activityPeriod,
                  weeklyHours: t.weeklyHours,
                  dataSource: t.dataSource,
                  certaintyLevel: t.certaintyLevel,
                  prerequisites: t.prerequisites,
                },
              });
            }
          }

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
                  plannedCredits: 0,
                  isCurrentSemester: semNum === 5,
                },
              });
              planId = newPlan.id;
              planMap.set(semNum, planId);
            }

            const itemType = item.itemType || (item.category === "akademik" || item.credits > 0 ? "COURSE" : "ACTIVITY");
            const finalCredits = itemType === "COURSE" ? (item.credits || 3) : (item.credits || 0);

            await tx.roadmapTask.create({
              data: {
                semesterPlanId: planId,
                title: item.title,
                itemType,
                category: item.category || "akademik",
                credits: finalCredits,
                courseCode: item.courseCode || null,
                notes: item.notes || `Dari template ${templateTitle}`,
                status: "planned",
                activityPeriod: item.activityPeriod || null,
                weeklyHours: item.weeklyHours || null,
                dataSource: taskSource,
                certaintyLevel: item.certaintyLevel || "estimasi",
              },
            });
          }

          // Recalculate all planned credits
          for (const [, pId] of planMap.entries()) {
            await syncSemesterPlanCredits(pId, tx);
          }

          await tx.roadmap.update({
            where: { id: roadmap.id },
            data: { currentVersionId: nv.id },
          });

          await syncProfileAcademicMetrics(session.id, nv.id, tx);
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
          const touchedPlanIds = new Set<string>();

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
                  plannedCredits: 0,
                  isCurrentSemester: semNum === 5,
                },
              });
              planId = createdPlan.id;
            }

            touchedPlanIds.add(planId);

            const itemType = item.itemType || (item.category === "akademik" || item.credits > 0 ? "COURSE" : "ACTIVITY");
            const finalCredits = itemType === "COURSE" ? (item.credits || 3) : (item.credits || 0);

            await tx.roadmapTask.create({
              data: {
                semesterPlanId: planId,
                title: item.title,
                itemType,
                category: item.category || "akademik",
                credits: finalCredits,
                courseCode: item.courseCode || null,
                notes: item.notes || `Dari template: ${templateTitle}`,
                status: "planned",
                activityPeriod: item.activityPeriod || null,
                weeklyHours: item.weeklyHours || null,
                dataSource: taskSource,
                certaintyLevel: item.certaintyLevel || "estimasi",
              },
            });
          }

          for (const pId of touchedPlanIds) {
            await syncSemesterPlanCredits(pId, tx);
          }
          await syncProfileAcademicMetrics(session.id, currentVersion.id, tx);
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
          message: `${items.length} item dari "${templateTitle}" berhasil digabungkan ke Roadmap kamu.`,
        });
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION: switch_version
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "switch_version" && body.versionId) {
      const targetVersion = await prisma.roadmapVersion.findUnique({
        where: { id: body.versionId },
      });
      if (!targetVersion || targetVersion.roadmapId !== roadmap.id) {
        return NextResponse.json({ error: "Versi tidak valid atau tidak ditemukan." }, { status: 404 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.roadmap.update({
          where: { id: roadmap.id },
          data: { currentVersionId: targetVersion.id },
        });
        await syncProfileAcademicMetrics(session.id, targetVersion.id, tx);
      });

      return NextResponse.json({
        success: true,
        message: `Beralih ke versi v${targetVersion.versionNum} — ${targetVersion.label ?? "Tanpa judul"}`,
      });
    }

    return NextResponse.json({ error: `Aksi '${action}' tidak dikenali.` }, { status: 400 });
  } catch (error) {
    console.error("[API /roadmap POST]", error);
    return NextResponse.json({ error: "Gagal memproses permintaan pada roadmap." }, { status: 500 });
  }
}
