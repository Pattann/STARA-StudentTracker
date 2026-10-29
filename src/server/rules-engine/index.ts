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
  prerequisites?: string[];
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

export function calculateFullRoadmap(input: RoadmapInput): RoadmapCalculation {
  const { totalCurriculumCredits, completedCredits, inProgressCredits, currentSemester, goals, semesterPlans } = input;

  const creditsByStatus: Record<string, number> = {
    done: completedCredits,
    in_progress: inProgressCredits,
    planned: 0,
    delayed: 0,
    cancelled: 0,
  };

  const creditsByCategory: Record<string, number> = {};
  const semesterLoads: Array<{ semesterNum: number; credits: number; tasks: number }> = [];
  const conflicts: string[] = [];

  for (const sp of semesterPlans) {
    let semCredits = 0;
    let semTasks = sp.tasks.length;

    for (const task of sp.tasks) {
      if (task.status !== "cancelled") {
        // Count credits from planned/in_progress tasks
        if (task.status === "planned" || task.status === "delayed") {
          creditsByStatus[task.status] = (creditsByStatus[task.status] ?? 0) + task.credits;
        }
        semCredits += task.credits;

        creditsByCategory[task.category] = (creditsByCategory[task.category] ?? 0) + task.credits;
      }
    }

    semesterLoads.push({ semesterNum: sp.semesterNum, credits: semCredits, tasks: semTasks });

    // Validate load
    const maxNormal = 24;
    if (semCredits > maxNormal && sp.semesterNum >= currentSemester) {
      conflicts.push(`Semester ${sp.semesterNum}: beban ${semCredits} SKS melebihi batas normal (${maxNormal} SKS).`);
    }
  }

  // Calculate remaining
  const plannedFutureCredits = semesterPlans
    .filter((sp) => sp.semesterNum > currentSemester)
    .reduce((sum, sp) => sum + sp.tasks.filter((t) => t.status !== "cancelled").reduce((s, t) => s + t.credits, 0), 0);

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

  // Provisional if plans don't fully cover remaining
  const isProvisional = plannedFutureCredits < remainingCredits;

  let validationStatus: "valid" | "warning" | "error" = "valid";
  if (conflicts.length > 0) validationStatus = "warning";
  if (estimatedGraduationSemester && estimatedGraduationSemester > MAX_NORMAL_SEMESTER) {
    conflicts.push(`Estimasi kelulusan di semester ${estimatedGraduationSemester} melebihi batas normal S1 (${MAX_NORMAL_SEMESTER} semester).`);
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
