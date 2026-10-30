import "server-only";
import { prisma } from "@/server/db/prisma";
import { parseJsonSafe } from "@/lib/utils";

export type DemoContext = {
  guestSessionId: string;
};

export async function getOrCreateDemoSession(token: string): Promise<DemoContext | null> {
  const session = await prisma.guestSession.findUnique({
    where: { token },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return { guestSessionId: session.id };
}

export async function createDemoSession(): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const session = await prisma.guestSession.create({
    data: { token, expiresAt },
  });

  await seedDemoData(session.id);

  return token;
}

export async function resetDemoSession(token: string): Promise<string> {
  const session = await prisma.guestSession.findUnique({ where: { token } });
  if (session) {
    await prisma.guestSession.delete({ where: { id: session.id } });
  }
  return createDemoSession();
}

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function seedDemoData(guestSessionId: string) {
  // Academic Profile
  await prisma.academicProfile.create({
    data: {
      guestSessionId,
      institutionName: "Universitas Nusantara Maju",
      facultyName: "Fakultas Ilmu Komputer",
      programName: "Teknik Informatika",
      educationLevel: "S1",
      entryYear: 2022,
      currentSemester: 5,
      totalCurriculumCredits: 144,
      completedCredits: 84,
      inProgressCredits: 18,
      gpa: 3.42,
      goals: "balanced",
      interests: JSON.stringify(["magang", "lomba", "penelitian"]),
      takEnabled: false,
      takTarget: null,
      weeklyHours: 30,
    },
  });

  // Roadmap
  const roadmap = await prisma.roadmap.create({
    data: {
      guestSessionId,
      title: "Roadmap Demo — Budi Santoso",
      status: "active",
    },
  });

  // Roadmap Version
  const version = await prisma.roadmapVersion.create({
    data: {
      roadmapId: roadmap.id,
      versionNum: 1,
      label: "Roadmap Awal",
      isBaseline: true,
    },
  });

  await prisma.roadmap.update({
    where: { id: roadmap.id },
    data: { currentVersionId: version.id },
  });

  // Semester Plans (current + future)
  const semesters = [
    { num: 5, isCurrent: true, targetCredits: 20, tasks: demoSemester5Tasks() },
    { num: 6, isCurrent: false, targetCredits: 20, tasks: demoSemester6Tasks() },
    { num: 7, isCurrent: false, targetCredits: 18, tasks: demoSemester7Tasks() },
    { num: 8, isCurrent: false, targetCredits: 12, tasks: demoSemester8Tasks() },
  ];

  for (const sem of semesters) {
    const plan = await prisma.semesterPlan.create({
      data: {
        roadmapVersionId: version.id,
        semesterNum: sem.num,
        isCurrentSemester: sem.isCurrent,
        targetCredits: sem.targetCredits,
        plannedCredits: sem.targetCredits,
        semesterLabel:
          sem.num === 5
            ? "Semester 5 — Ganjil 2024/2025"
            : sem.num === 6
            ? "Semester 6 — Genap 2024/2025"
            : sem.num === 7
            ? "Semester 7 — Ganjil 2025/2026"
            : "Semester 8 — Genap 2025/2026",
      },
    });

    for (const task of sem.tasks) {
      await prisma.roadmapTask.create({
        data: { semesterPlanId: plan.id, ...task },
      });
    }
  }

  // Simulations
  await prisma.simulation.create({
    data: {
      guestSessionId,
      roadmapId: roadmap.id,
      baselineVersionId: version.id,
      scenarioType: "magang",
      title: "Simulasi Magang Semester 6",
      parameters: JSON.stringify({
        type: "magang",
        startSemester: 6,
        durationSemesters: 1,
        creditsToConvert: 20,
        conversionStatus: "belum_diketahui",
        conflictsWithRegular: true,
      }),
      status: "calculated",
    },
  });

  // Reminders
  const reminderData = [
    {
      title: "Pengumpulan KRS Semester 6",
      category: "krs",
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      isOfficial: false,
      notes: "Pastikan sudah konsultasi dengan dosen wali.",
    },
    {
      title: "Deadline Pendaftaran Magang BUMN",
      category: "mbkm",
      deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      isOfficial: false,
      notes: "Siapkan CV dan surat motivasi.",
    },
    {
      title: "Sidang Proposal Skripsi (target)",
      category: "skripsi",
      deadline: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      isOfficial: false,
      notes: "Estimasi pribadi, konfirmasi ke prodi.",
    },
  ];

  for (const r of reminderData) {
    await prisma.reminder.create({ data: { guestSessionId, ...r } });
  }

  // Check-ins
  await prisma.checkIn.create({
    data: {
      guestSessionId,
      type: "start_semester",
      semesterNum: 5,
      answers: JSON.stringify({
        sksRealistic: true,
        scheduleCurrent: true,
        mainPriority: "Menyelesaikan proyek akhir mata kuliah basis data.",
        workloadAdjust: false,
      }),
    },
  });
}

function demoSemester5Tasks() {
  return [
    { title: "Basis Data Lanjut", category: "akademik", credits: 3, status: "in_progress", courseCode: "IF3201", certaintyLevel: "pasti" },
    { title: "Pemrograman Web", category: "akademik", credits: 3, status: "in_progress", courseCode: "IF3202", certaintyLevel: "pasti" },
    { title: "Kecerdasan Buatan", category: "akademik", credits: 3, status: "in_progress", courseCode: "IF3203", certaintyLevel: "pasti" },
    { title: "Rekayasa Perangkat Lunak", category: "akademik", credits: 3, status: "in_progress", courseCode: "IF3204", certaintyLevel: "pasti" },
    { title: "Statistika untuk Komputasi", category: "akademik", credits: 3, status: "in_progress", courseCode: "IF3205", certaintyLevel: "pasti" },
    { title: "Seminar Program Studi", category: "akademik", credits: 1, status: "in_progress", courseCode: "IF3206", certaintyLevel: "pasti" },
    { title: "Anggota Himpunan Mahasiswa TI", category: "tak", credits: 0, status: "in_progress", certaintyLevel: "pasti" },
    { title: "Ikut Hacktothon Internal", category: "karier", credits: 0, status: "planned", certaintyLevel: "estimasi" },
  ];
}

function demoSemester6Tasks() {
  return [
    { title: "Keamanan Sistem Informasi", category: "akademik", credits: 3, status: "planned", courseCode: "IF3301", certaintyLevel: "estimasi" },
    { title: "Komputasi Awan", category: "akademik", credits: 3, status: "planned", courseCode: "IF3302", certaintyLevel: "estimasi" },
    { title: "Pengolahan Citra Digital", category: "akademik", credits: 3, status: "planned", courseCode: "IF3303", certaintyLevel: "estimasi" },
    { title: "Analisis dan Desain Sistem", category: "akademik", credits: 3, status: "planned", courseCode: "IF3304", certaintyLevel: "estimasi" },
    { title: "Metodologi Penelitian", category: "akademik", credits: 3, status: "planned", courseCode: "IF3305", certaintyLevel: "pasti" },
    { title: "Mata Kuliah Pilihan I", category: "akademik", credits: 3, status: "planned", certaintyLevel: "estimasi" },
    { title: "Daftar dan Ikuti Program Magang", category: "karier", credits: 0, status: "planned", certaintyLevel: "estimasi" },
    { title: "Eksplorasi Topik Skripsi", category: "skripsi", credits: 0, status: "planned", certaintyLevel: "estimasi" },
  ];
}

function demoSemester7Tasks() {
  return [
    { title: "Mata Kuliah Pilihan II", category: "akademik", credits: 3, status: "planned", certaintyLevel: "estimasi" },
    { title: "Mata Kuliah Pilihan III", category: "akademik", credits: 3, status: "planned", certaintyLevel: "estimasi" },
    { title: "Kerja Praktik", category: "akademik", credits: 3, status: "planned", certaintyLevel: "estimasi" },
    { title: "Proposal Skripsi", category: "skripsi", credits: 0, status: "planned", certaintyLevel: "estimasi" },
    { title: "Pengumpulan Data Penelitian", category: "skripsi", credits: 0, status: "planned", certaintyLevel: "estimasi" },
    { title: "Ujian Kompetensi Internasional (target)", category: "karier", credits: 0, status: "planned", certaintyLevel: "belum_diketahui" },
  ];
}

function demoSemester8Tasks() {
  return [
    { title: "Skripsi", category: "akademik", credits: 6, status: "planned", courseCode: "IF4001", certaintyLevel: "estimasi" },
    { title: "Bimbingan Skripsi", category: "skripsi", credits: 0, status: "planned", certaintyLevel: "estimasi" },
    { title: "Sidang Skripsi", category: "skripsi", credits: 0, status: "planned", certaintyLevel: "estimasi" },
    { title: "Revisi dan Pengumpulan Akhir", category: "skripsi", credits: 0, status: "planned", certaintyLevel: "estimasi" },
    { title: "Persiapan Karier Pasca Lulus", category: "karier", credits: 0, status: "planned", certaintyLevel: "estimasi" },
  ];
}
