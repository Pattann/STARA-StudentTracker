export const DEMO_TOKEN_KEY = "stara_demo_token";
export const DEMO_EXPIRY_HOURS = 24;

export const SCENARIO_TYPES = {
  magang: "Magang",
  mbkm: "MBKM / Program di Luar Prodi",
  advanced_course: "Mata Kuliah Tingkat Atas",
  exchange: "Pertukaran Mahasiswa",
  cuti: "Cuti Akademik",
} as const;

export type ScenarioType = keyof typeof SCENARIO_TYPES;

export const TASK_CATEGORIES = {
  akademik: "Akademik",
  tak: "TAK / Kegiatan",
  karier: "Karier",
  skripsi: "Skripsi / TA",
  pribadi: "Pribadi",
} as const;

export const TASK_STATUSES = {
  planned: "Direncanakan",
  in_progress: "Sedang Berjalan",
  done: "Selesai",
  delayed: "Tertunda",
  cancelled: "Dibatalkan",
} as const;

export const GOAL_OPTIONS = [
  {
    value: "fast",
    label: "Lulus Secepat Mungkin",
    description: "Fokus penuh pada akademik, selesaikan SKS sesuai jadwal minimal.",
  },
  {
    value: "balanced",
    label: "Seimbang",
    description: "Kombinasi akademik, pengalaman kerja, dan kegiatan mahasiswa.",
  },
  {
    value: "active",
    label: "Aktif di Luar Kuliah",
    description: "Magang, organisasi, dan lomba menjadi prioritas utama.",
  },
  {
    value: "relaxed",
    label: "Ritme Santai dengan Rencana Jelas",
    description: "Tidak terburu-buru, tapi tetap punya target kelulusan yang jelas.",
  },
] as const;

export const TEMPLATE_CATEGORIES = {
  semester: "Roadmap Semester",
  tak: "Perencanaan TAK",
  magang: "Persiapan Magang",
  mbkm: "MBKM / Pertukaran",
  skripsi: "Perencanaan Skripsi",
  organisasi: "Organisasi & Akademik",
} as const;

export const REMINDER_CATEGORIES = {
  akademik: "Deadline Akademik",
  krs: "KRS / Registrasi",
  mbkm: "MBKM / Magang",
  skripsi: "Milestone Skripsi",
  yudisium: "Yudisium / Wisuda",
  pribadi: "Tujuan Pribadi",
} as const;

export const DEFAULT_CREDITS_PER_SEMESTER = {
  fast: 24,
  balanced: 20,
  active: 18,
  relaxed: 16,
} as const;
