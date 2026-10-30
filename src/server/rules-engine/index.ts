/**
 * Rules Engine for STARA
 * Pure TypeScript — no side-effects, no database access, no imports from server modules.
 * All functions are deterministic given the same input.
 */

export interface SemesterPlanInput {
  semesterNum: number;
  targetCredits: number;
  plannedCredits: number;
  tasks: TaskInput[];
}

export interface TaskInput {
  id: string;
  credits: number;
  status: string; // "planned" | "in_progress" | "done" | "delayed" | "cancelled"
  category: string;
  itemType?: string; // "COURSE" | "ACTIVITY" | "MILESTONE"
  courseCode?: string | null;
  title?: string;
  prerequisites?: string[];
  weeklyHours?: number | null;
  activityPeriod?: string | null;
}

export interface ValidationIssue {
  type: "error" | "warning" | "info";
  code: "PREREQUISITE_CONFLICT" | "CREDIT_OVERLOAD" | "CREDIT_UNDERLOAD" | "DUPLICATE_COURSE" | "LOCKED_ITEM" | "STUDY_LIMIT" | "MISSING_DATA";
  message: string;
  semesterNum?: number;
  taskId?: string;
  courseCode?: string;
}

export interface RoadmapInput {
  totalCurriculumCredits: number;
  completedCredits: number;
  inProgressCredits: number;
  currentSemester: number;
  goals: string; // "fast" | "balanced" | "active" | "relaxed"
  semesterPlans: SemesterPlanInput[];
}

export interface RoadmapCalculation {
  totalCredits: number;
  completedCredits: number;
  inProgressCredits: number;
  remainingCredits: number;
  estimatedGraduationSemester: number | null;
  estimatedSemestersToGraduate: number | null;
  creditsByStatus: Record<string, number>;
  creditsByCategory: Record<string, number>;
  validationStatus: "valid" | "warning" | "error";
  conflicts: string[];
  issues: ValidationIssue[];
  isProvisional: boolean;
  semesterLoads: Array<{ semesterNum: number; credits: number; tasks: number }>;
}

export interface ScenarioParams {
  type: string;
  startSemester: number;
  durationSemesters: number;
  creditsToConvert?: number;
  conversionStatus?: string;
  conflictsWithRegular?: boolean;
}

export interface RoadmapDiff {
  semesterDelta: number | null;
  creditsDelta: number;
  benefits: string[];
  risks: string[];
  unknowns: string[];
  additionalConflicts: string[];
}

const DEFAULT_CREDITS_BY_GOAL: Record<string, number> = {
  fast: 24,
  balanced: 20,
  active: 18,
  relaxed: 16,
};

const MAX_NORMAL_SEMESTER = 14;

export function validateRoadmapRules(input: RoadmapInput): {
  issues: ValidationIssue[];
  conflicts: string[];
  validationStatus: "valid" | "warning" | "error";
} {
  const issues: ValidationIssue[] = [];
  const conflicts: string[] = [];

  if (!input || !Array.isArray(input.semesterPlans)) {
    return { issues, conflicts, validationStatus: "valid" };
  }

  const taskMap = new Map<string, { task: TaskInput; semesterNum: number }>();
  const courseCodeMap = new Map<string, Array<{ task: TaskInput; semesterNum: number }>>();

  for (const sp of input.semesterPlans) {
    if (!sp || !Array.isArray(sp.tasks)) continue;
    const semNum = Number(sp.semesterNum) || 1;
    for (const t of sp.tasks) {
      if (!t || t.status === "cancelled") continue;
      taskMap.set(t.id, { task: t, semesterNum: semNum });

      if (t.courseCode && typeof t.courseCode === "string" && t.courseCode.trim() !== "") {
        const code = t.courseCode.trim().toUpperCase();
        const list = courseCodeMap.get(code) ?? [];
        list.push({ task: t, semesterNum: semNum });
        courseCodeMap.set(code, list);
      }
    }
  }

  // 1. Detect Duplicate Courses
  for (const [code, occurrences] of courseCodeMap.entries()) {
    if (occurrences.length > 1) {
      const nonDelayed = occurrences.filter((o) => o.task.status !== "delayed");
      if (nonDelayed.length > 1) {
        const semList = occurrences.map((o) => `Semester ${o.semesterNum}`).join(" dan ");
        const msg = `Mata kuliah "${code}" terdaftar ganda di ${semList}.`;
        conflicts.push(msg);
        issues.push({
          type: "warning",
          code: "DUPLICATE_COURSE",
          message: msg,
          courseCode: code,
        });
      }
    }
  }

  // 2. Validate Prerequisites
  for (const sp of input.semesterPlans) {
    if (!sp || !Array.isArray(sp.tasks)) continue;
    const semNum = Number(sp.semesterNum) || 1;
    for (const task of sp.tasks) {
      if (!task || task.status === "cancelled" || task.status === "done") continue;

      const rawPrereqs = task.prerequisites;
      const prereqs = Array.isArray(rawPrereqs)
        ? rawPrereqs.filter((p): p is string => typeof p === "string" && p.trim().length > 0)
        : typeof rawPrereqs === "string" && (rawPrereqs as string).trim().length > 0
        ? [(rawPrereqs as string).trim()]
        : [];

      for (const p of prereqs) {
        const pKey = p.trim();

        let prereqEntry = taskMap.get(pKey);
        if (!prereqEntry) {
          const listByCode = courseCodeMap.get(pKey.toUpperCase());
          if (listByCode && listByCode.length > 0) {
            prereqEntry = listByCode[0];
          }
        }

        if (prereqEntry) {
          if (prereqEntry.semesterNum >= semNum) {
            const prereqName = (typeof prereqEntry.task.courseCode === "string" ? prereqEntry.task.courseCode : null) || prereqEntry.task.title || pKey;
            const taskName = (typeof task.courseCode === "string" ? task.courseCode : null) || task.title || task.id;
            const msg = `Prasyarat "${prereqName}" (Semester ${prereqEntry.semesterNum}) harus diselesaikan sebelum mengambil "${taskName}" (Semester ${semNum}).`;
            conflicts.push(msg);
            issues.push({
              type: "error",
              code: "PREREQUISITE_CONFLICT",
              message: msg,
              semesterNum: semNum,
              taskId: task.id,
              courseCode: typeof task.courseCode === "string" ? task.courseCode : undefined,
            });
          } else if (prereqEntry.task.status === "delayed") {
            const prereqName = (typeof prereqEntry.task.courseCode === "string" ? prereqEntry.task.courseCode : null) || prereqEntry.task.title || pKey;
            const taskName = (typeof task.courseCode === "string" ? task.courseCode : null) || task.title || task.id;
            const msg = `Prasyarat "${prereqName}" untuk "${taskName}" berstatus 'Perlu Diulang' di Semester ${prereqEntry.semesterNum}.`;
            conflicts.push(msg);
            issues.push({
              type: "warning",
              code: "PREREQUISITE_CONFLICT",
              message: msg,
              semesterNum: semNum,
              taskId: task.id,
            });
          }
        } else {
          const taskName = (typeof task.courseCode === "string" ? task.courseCode : null) || task.title || task.id;
          issues.push({
            type: "info",
            code: "MISSING_DATA",
            message: `Mata kuliah "${taskName}" memiliki prasyarat "${pKey}" yang belum terdata di roadmap. Pastikan prasyarat sudah diambil atau konfirmasi ke akademik prodi.`,
            semesterNum: semNum,
            taskId: task.id,
          });
        }
      }
    }
  }

  // 3. Validate Semester Load Limits (National standard: 24 SKS max)
  for (const sp of input.semesterPlans) {
    if (!sp || !Array.isArray(sp.tasks)) continue;
    const semNum = Number(sp.semesterNum) || 1;
    const academicCredits = sp.tasks
      .filter((t) => t && t.status !== "cancelled" && (t.itemType === "COURSE" || t.category === "akademik" || (Number(t.credits) || 0) > 0))
      .reduce((sum, t) => sum + (Number(t.credits) || 0), 0);

    if (academicCredits > 24) {
      const msg = `Semester ${semNum}: beban ${academicCredits} SKS melebihi batas reguler nasional (24 SKS).`;
      conflicts.push(msg);
      issues.push({
        type: "error",
        code: "CREDIT_OVERLOAD",
        message: msg,
        semesterNum: semNum,
      });
    } else if (sp.targetCredits && academicCredits > Number(sp.targetCredits)) {
      const msg = `Semester ${semNum}: beban ${academicCredits} SKS melebihi target semester (${sp.targetCredits} SKS).`;
      issues.push({
        type: "warning",
        code: "CREDIT_OVERLOAD",
        message: msg,
        semesterNum: semNum,
      });
    }

    const currentSem = Number(input.currentSemester) || 1;
    if (semNum < 8 && academicCredits > 0 && academicCredits < 12 && semNum >= currentSem) {
      const msg = `Semester ${semNum}: beban ${academicCredits} SKS tergolong ringan (< 12 SKS). Rekomendasi beban normal adalah 18-20 SKS per semester.`;
      issues.push({
        type: "warning",
        code: "CREDIT_UNDERLOAD",
        message: msg,
        semesterNum: semNum,
      });
    }
  }

  let validationStatus: "valid" | "warning" | "error" = "valid";
  if (issues.some((i) => i.type === "error")) {
    validationStatus = "error";
  } else if (issues.some((i) => i.type === "warning")) {
    validationStatus = "warning";
  }

  return { issues, conflicts, validationStatus };
}

export function calculateFullRoadmap(input: RoadmapInput): RoadmapCalculation {
  if (!input) {
    return {
      totalCredits: 144,
      completedCredits: 0,
      inProgressCredits: 0,
      remainingCredits: 144,
      estimatedGraduationSemester: 8,
      estimatedSemestersToGraduate: 8,
      creditsByStatus: { done: 0, in_progress: 0, planned: 0, delayed: 0, cancelled: 0 },
      creditsByCategory: {},
      validationStatus: "valid",
      conflicts: [],
      issues: [],
      isProvisional: false,
      semesterLoads: [],
    };
  }

  const totalCurriculumCredits = Math.max(1, Number(input.totalCurriculumCredits) || 144);
  const completedCredits = Math.max(0, Number(input.completedCredits) || 0);
  const inProgressCredits = Math.max(0, Number(input.inProgressCredits) || 0);
  const currentSemester = Math.max(1, Number(input.currentSemester) || 1);
  const goals = input.goals || "balanced";
  const semesterPlans = Array.isArray(input.semesterPlans) ? input.semesterPlans : [];

  const creditsByStatus: Record<string, number> = {
    done: completedCredits,
    in_progress: inProgressCredits,
    planned: 0,
    delayed: 0,
    cancelled: 0,
  };

  const creditsByCategory: Record<string, number> = {};
  const semesterLoads: Array<{ semesterNum: number; credits: number; tasks: number }> = [];

  for (const sp of semesterPlans) {
    if (!sp || !Array.isArray(sp.tasks)) continue;
    const semNum = Number(sp.semesterNum) || 1;
    let semCredits = 0;
    let semTasks = sp.tasks.length;

    for (const task of sp.tasks) {
      if (!task || task.status === "cancelled") continue;

      const isAcademicCredited = task.itemType === "COURSE" || task.category === "akademik" || (Number(task.credits) || 0) > 0;
      const effectiveCredits = isAcademicCredited ? (Number(task.credits) || 0) : 0;

      const statusKey = task.status || "planned";
      if (statusKey === "planned" || statusKey === "delayed") {
        creditsByStatus[statusKey] = (creditsByStatus[statusKey] ?? 0) + effectiveCredits;
      }
      semCredits += effectiveCredits;

      const catKey = task.category || "akademik";
      creditsByCategory[catKey] = (creditsByCategory[catKey] ?? 0) + effectiveCredits;
    }

    semesterLoads.push({ semesterNum: semNum, credits: semCredits, tasks: semTasks });
  }

  // Run comprehensive rules validation safely
  let ruleCheck: { issues: ValidationIssue[]; conflicts: string[]; validationStatus: "valid" | "warning" | "error" } = {
    issues: [],
    conflicts: [],
    validationStatus: "valid",
  };
  try {
    ruleCheck = validateRoadmapRules(input);
  } catch (err) {
    console.warn("[validateRoadmapRules inside calculateFullRoadmap error]", err);
  }

  const conflicts = [...ruleCheck.conflicts];
  const issues = [...ruleCheck.issues];

  // Calculate remaining credits
  const plannedFutureCredits = semesterPlans
    .filter((sp) => sp && Number(sp.semesterNum) > currentSemester && Array.isArray(sp.tasks))
    .reduce((sum, sp) => sum + sp.tasks.filter((t) => t && t.status !== "cancelled").reduce((s, t) => s + (Number(t.credits) || 0), 0), 0);

  const remainingCredits = Math.max(0, totalCurriculumCredits - completedCredits);

  // Estimate graduation
  const avgCreditsPerSem = DEFAULT_CREDITS_BY_GOAL[goals] ?? 20;
  let estimatedSemestersToGraduate: number | null = null;
  let estimatedGraduationSemester: number | null = null;

  if (remainingCredits > 0) {
    const effectiveAvg = Math.max(avgCreditsPerSem, 12);
    estimatedSemestersToGraduate = Math.ceil(remainingCredits / effectiveAvg);
    estimatedGraduationSemester = currentSemester + estimatedSemestersToGraduate;
  } else {
    estimatedSemestersToGraduate = 0;
    estimatedGraduationSemester = currentSemester;
  }

  const isProvisional = plannedFutureCredits < remainingCredits;

  let validationStatus = ruleCheck.validationStatus;
  if (estimatedGraduationSemester && estimatedGraduationSemester > MAX_NORMAL_SEMESTER) {
    const studyLimitMsg = `Estimasi kelulusan di semester ${estimatedGraduationSemester} melebihi batas normal S1 (${MAX_NORMAL_SEMESTER} semester).`;
    conflicts.push(studyLimitMsg);
    issues.push({
      type: "error",
      code: "STUDY_LIMIT",
      message: studyLimitMsg,
    });
    validationStatus = "error";
  }

  return {
    totalCredits: totalCurriculumCredits,
    completedCredits,
    inProgressCredits,
    remainingCredits,
    estimatedGraduationSemester,
    estimatedSemestersToGraduate,
    creditsByStatus,
    creditsByCategory,
    validationStatus,
    conflicts,
    issues,
    isProvisional,
    semesterLoads,
  };
}

export function applyScenarioToDraftRoadmap(
  base: RoadmapInput,
  params: ScenarioParams
): RoadmapInput {
  const draft: RoadmapInput = JSON.parse(JSON.stringify(base)) as RoadmapInput;

  if (params.type === "cuti") {
    // Shift all future semesters back by durationSemesters
    draft.semesterPlans = draft.semesterPlans.map((sp) => {
      if (sp.semesterNum >= params.startSemester) {
        return { ...sp, semesterNum: sp.semesterNum + params.durationSemesters };
      }
      return sp;
    });
  }

  if (params.type === "magang" || params.type === "mbkm" || params.type === "exchange") {
    const convertedCredits = params.creditsToConvert ?? 0;
    const isConfirmed = params.conversionStatus === "dikonfirmasi";

    if (params.conflictsWithRegular) {
      // Remove or reduce academic credits in affected semesters
      draft.semesterPlans = draft.semesterPlans.map((sp) => {
        if (sp.semesterNum >= params.startSemester && sp.semesterNum < params.startSemester + params.durationSemesters) {
          const newTasks = sp.tasks.map((t) => {
            if (t.category === "akademik") return { ...t, status: "cancelled" };
            return t;
          });
          // Add magang task
          newTasks.push({
            id: `scenario-magang-${sp.semesterNum}`,
            credits: isConfirmed ? Math.floor(convertedCredits / params.durationSemesters) : 0,
            status: "planned",
            category: "karier",
            prerequisites: [],
          });
          return { ...sp, tasks: newTasks };
        }
        return sp;
      });

      // If confirmed credits, adjust completed
      if (isConfirmed && convertedCredits > 0) {
        draft.completedCredits = Math.min(
          draft.totalCurriculumCredits,
          draft.completedCredits + convertedCredits
        );
      }
    }
  }

  if (params.type === "advanced_course") {
    // Add extra credits to target semester
    const targetSem = draft.semesterPlans.find((sp) => sp.semesterNum === params.startSemester);
    if (targetSem) {
      targetSem.tasks.push({
        id: `scenario-adv-${params.startSemester}`,
        credits: 3,
        status: "planned",
        category: "akademik",
      });
    }
  }

  return draft;
}

export function compareRoadmaps(
  baseline: RoadmapCalculation,
  scenario: RoadmapCalculation,
  params: ScenarioParams
): RoadmapDiff {
  const semesterDelta =
    baseline.estimatedGraduationSemester !== null && scenario.estimatedGraduationSemester !== null
      ? scenario.estimatedGraduationSemester - baseline.estimatedGraduationSemester
      : null;

  const creditsDelta = scenario.remainingCredits - baseline.remainingCredits;

  const benefits: string[] = [];
  const risks: string[] = [...scenario.conflicts.filter((c) => !baseline.conflicts.includes(c))];
  const unknowns: string[] = [];
  const additionalConflicts: string[] = risks;

  if (params.type === "magang" || params.type === "mbkm" || params.type === "exchange") {
    benefits.push("Mendapatkan pengalaman kerja nyata di luar kampus.");
    benefits.push("Meningkatkan nilai di CV dan jaringan profesional.");
    if (params.conversionStatus !== "dikonfirmasi") {
      unknowns.push("Berapa SKS yang akan dikonversi belum dikonfirmasi prodi.");
    }
    if (params.conflictsWithRegular) {
      risks.push("Beban kuliah reguler semester tersebut perlu disesuaikan.");
    }
    if (semesterDelta !== null && semesterDelta > 0) {
      risks.push(`Estimasi kelulusan mundur ${semesterDelta} semester.`);
    }
  }

  if (params.type === "cuti") {
    risks.push(`Masa studi mundur ${params.durationSemesters} semester.`);
    unknowns.push("Pastikan cuti akademik tidak melanggar batas maksimum studi institusi.");
    benefits.push("Waktu untuk istirahat atau menyelesaikan urusan di luar akademik.");
  }

  if (params.type === "advanced_course") {
    benefits.push("Mempercepat penguasaan materi tingkat atas.");
    risks.push("Beban SKS semester tersebut meningkat. Pastikan tidak melebihi kapasitas.");
  }

  return {
    semesterDelta,
    creditsDelta,
    benefits,
    risks,
    unknowns,
    additionalConflicts,
  };
}

export function generateRuleBasedTradeoffs(
  scenarioType: string,
  diff: RoadmapDiff
): {
  summary: string;
  benefits: string[];
  tradeoffs: string[];
  risks: string[];
  assumptions: string[];
  unknowns: string[];
  recommendedNextSteps: string[];
  questionsForCampus: string[];
  isAiGenerated: boolean;
} {
  const semChange = diff.semesterDelta;

  const summaryMap: Record<string, string> = {
    magang: `Skenario magang ${semChange && semChange > 0 ? `memundurkan estimasi kelulusan ${semChange} semester` : "tidak mengubah estimasi kelulusan secara signifikan"}. Keputusan ini memberikan pengalaman profesional tetapi perlu koordinasi dengan prodi untuk konversi SKS.`,
    mbkm: `Skenario MBKM memberikan fleksibilitas belajar di luar prodi. Dampak ke kelulusan tergantung kebijakan konversi institusi.`,
    advanced_course: `Mengambil mata kuliah tingkat atas lebih awal dapat mempercepat penguasaan kompetensi, namun perlu perhatikan prasyarat.`,
    exchange: `Program pertukaran mahasiswa memberi pengalaman internasional. Konfirmasi ke prodi untuk konversi kredit.`,
    cuti: `Cuti akademik memundurkan masa studi ${diff.semesterDelta ?? "beberapa"} semester. Pastikan syarat dan prosedur cuti sudah dipahami.`,
  };

  const stepsMap: Record<string, string[]> = {
    magang: ["Konsultasi ke dosen wali tentang rencana magang.", "Konfirmasi kebijakan konversi SKS ke prodi.", "Siapkan surat rekomendasi dan dokumen pendukung.", "Daftar ke program magang yang relevan."],
    mbkm: ["Pelajari program MBKM yang tersedia.", "Konfirmasi kuota dan syarat dari kampus.", "Diskusikan rencana dengan dosen pembimbing.", "Siapkan rencana belajar alternatif."],
    advanced_course: ["Cek prasyarat mata kuliah yang ingin diambil.", "Konsultasi ke dosen pengampu untuk izin masuk kelas.", "Perhatikan kapasitas beban SKS semester tersebut."],
    exchange: ["Cari program pertukaran yang sesuai bidang studi.", "Siapkan berkas seleksi (transkrip, essay, rekomendasi).", "Konfirmasi mekanisme konversi kredit ke prodi."],
    cuti: ["Ajukan permohonan cuti ke akademik kampus.", "Pastikan cuti tidak melanggar batas studi maksimum.", "Rencanakan kegiatan produktif selama cuti."],
  };

  const questionsMap: Record<string, string[]> = {
    magang: ["Berapa SKS maksimum yang bisa dikonversi dari magang?", "Apakah ada formulir pengajuan konversi resmi?", "Apakah magang ini bisa menggantikan Kerja Praktik?"],
    mbkm: ["Program MBKM apa yang direkognisi prodi kami?", "Apakah nilai MBKM masuk ke transkrip akademik?"],
    advanced_course: ["Apakah mahasiswa semester ini diizinkan mengambil mata kuliah semester atas?", "Apakah ada prasyarat yang perlu dipenuhi?"],
    exchange: ["Program pertukaran mana yang diakui secara kredit?", "Bagaimana mekanisme konversi nilai dari kampus lain?"],
    cuti: ["Apakah cuti menghentikan atau menghitung masa studi?", "Apa saja dokumen yang diperlukan untuk pengajuan cuti?"],
  };

  return {
    summary: summaryMap[scenarioType] ?? `Skenario ${scenarioType} telah dihitung. Periksa perbandingan di bawah untuk detail.`,
    benefits: diff.benefits,
    tradeoffs: [],
    risks: diff.risks,
    assumptions: [
      "Perhitungan menggunakan data roadmap yang kamu masukkan.",
      "Aturan konversi SKS mengikuti kebijakan umum—bisa berbeda per institusi.",
      semChange !== null && semChange > 0
        ? `Estimasi kelulusan dihitung mundur ${semChange} semester dari baseline.`
        : "Estimasi kelulusan tidak berubah secara signifikan.",
    ].filter(Boolean) as string[],
    unknowns: diff.unknowns,
    recommendedNextSteps: stepsMap[scenarioType] ?? ["Diskusikan skenario ini dengan dosen wali."],
    questionsForCampus: questionsMap[scenarioType] ?? [],
    isAiGenerated: false,
  };
}
