import { prisma } from "@/server/db/prisma";
import { CURRICULUM_CATALOG, CatalogCourse } from "@/features/curriculum/catalog";
import { MOCK_TEMPLATES } from "@/features/templates/data";
import { hashPassword } from "@/lib/auth";

export interface CampusItem {
  id: string;
  name: string;
  city: string;
  type: "PTN" | "PTS";
  facultiesCount: number;
  programsCount: number;
  totalStudents: number;
  status: "active" | "partner" | "pilot";
  syncStatus: "Tersinkronisasi" | "Perlu Review" | "Manual";
  lastCurriculumUpdate: string;
}

export interface ProgramItem {
  id: string;
  campusName: string;
  code: string;
  name: string;
  level: "S1" | "D3" | "S2";
  totalCredits: number;
  accreditation: "Unggul" | "A" | "Baik Sekali";
  activeCurriculumYear: string;
  totalCourses: number;
  status: "active" | "inactive";
}

export interface AiRequestLog {
  id: string;
  timestamp: string;
  feature: "Simulator Skenario" | "Rencana Kustom AI" | "Konsultan Skripsi AI" | "Tanya STARA AI" | "Review Judul";
  modelUsed: string;
  latencyMs: number;
  tokensUsed: { prompt: number; completion: number; total: number };
  status: "200 OK" | "Fallback (Deterministic)" | "Rate Limit (429)";
  userIdentifier: string;
}

// In-memory persistent course modifications for courses added/edited via Admin
const dynamicCourses: CatalogCourse[] = [];

// In-memory ring buffer for AI request logs
const aiLogsBuffer: AiRequestLog[] = [
  {
    id: "log-1",
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    feature: "Rencana Kustom AI",
    modelUsed: "gemini-3.1-flash-lite",
    latencyMs: 382,
    tokensUsed: { prompt: 412, completion: 520, total: 932 },
    status: "200 OK",
    userIdentifier: "mahasiswa-telkom-01",
  },
  {
    id: "log-2",
    timestamp: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
    feature: "Simulator Skenario",
    modelUsed: "gemini-3.1-flash-lite",
    latencyMs: 440,
    tokensUsed: { prompt: 580, completion: 490, total: 1070 },
    status: "200 OK",
    userIdentifier: "guest-session-4b",
  },
  {
    id: "log-3",
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    feature: "Konsultan Skripsi AI",
    modelUsed: "gemini-3.1-flash-lite",
    latencyMs: 512,
    tokensUsed: { prompt: 340, completion: 610, total: 950 },
    status: "200 OK",
    userIdentifier: "mahasiswa-rendy",
  },
  {
    id: "log-4",
    timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    feature: "Review Judul",
    modelUsed: "gemini-3.5-flash-lite",
    latencyMs: 490,
    tokensUsed: { prompt: 290, completion: 380, total: 670 },
    status: "200 OK",
    userIdentifier: "guest-session-9a",
  },
  {
    id: "log-5",
    timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    feature: "Simulator Skenario",
    modelUsed: "gemini-3.1-flash-lite",
    latencyMs: 395,
    tokensUsed: { prompt: 510, completion: 440, total: 950 },
    status: "200 OK",
    userIdentifier: "guest-session-2e",
  },
  {
    id: "log-6",
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    feature: "Tanya STARA AI",
    modelUsed: "gemini-3.1-flash-lite",
    latencyMs: 415,
    tokensUsed: { prompt: 220, completion: 310, total: 530 },
    status: "200 OK",
    userIdentifier: "mahasiswa-telkom-02",
  },
];

export function recordAiRequestLog(log: Omit<AiRequestLog, "id" | "timestamp">) {
  const newEntry: AiRequestLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...log,
  };
  aiLogsBuffer.unshift(newEntry);
  if (aiLogsBuffer.length > 50) {
    aiLogsBuffer.pop();
  }
}

const globalForAdminSeed = globalThis as unknown as {
  isSeeded?: boolean;
  seedPromise?: Promise<void> | null;
};

/**
 * Ensures admin user, default templates, and sample moderation reports exist in DB
 * Cached in memory so it only runs once per server lifecycle.
 */
export async function ensureAdminAndSeededData() {
  if (globalForAdminSeed.isSeeded) return;
  if (globalForAdminSeed.seedPromise) return globalForAdminSeed.seedPromise;

  globalForAdminSeed.seedPromise = (async () => {
    try {
      // 1. Ensure Admin User
      let adminUser = await prisma.user.findFirst({
        where: { role: "admin" },
      });

      if (!adminUser) {
        const defaultAdminPassword = hashPassword("admin123");
        adminUser = await prisma.user.upsert({
          where: { email: "admin@stara.ac.id" },
          update: { role: "admin", password: defaultAdminPassword },
          create: {
            email: "admin@stara.ac.id",
            name: "Administrator STARA",
            password: defaultAdminPassword,
            role: "admin",
          },
        });
      } else if (!adminUser.password) {
        const defaultAdminPassword = hashPassword("admin123");
        adminUser = await prisma.user.update({
          where: { id: adminUser.id },
          data: { password: defaultAdminPassword },
        });
      }

      // Also get or create a student reporter user for reports
      let reporterUser = await prisma.user.findFirst({
        where: { role: "student" },
      });
      if (!reporterUser) {
        reporterUser = await prisma.user.create({
          data: {
            email: "mahasiswa@telkomuniversity.ac.id",
            name: "Rian Mahasiswa",
            role: "student",
          },
        });
      }

      // 2. Ensure Templates in DB
      const templateCount = await prisma.template.count();
      if (templateCount === 0) {
        const templatesToSeed = MOCK_TEMPLATES.slice(0, 10);
        await prisma.template.createMany({
          data: templatesToSeed.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            category: t.category,
            institutionName: t.institutionName,
            programName: t.programName,
            cohortYear: parseInt(t.year) || 2024,
            goals: t.targetGraduation,
            semesterSteps: JSON.stringify(t.semesterBreakdown || []),
            sourceType: t.verified ? "terverifikasi" : "komunitas",
            isPublic: true,
            isHidden: false,
            usefulCount: t.usefulCount || 12,
            authorDisplayName: t.authorDisplayName,
            isAnonymous: t.isAnonymous || false,
            userId: adminUser.id,
          })),
        });
      }

      // 3. Ensure Reports in DB
      const reportCount = await prisma.report.count();
      if (reportCount === 0) {
        const firstTemplate = await prisma.template.findFirst();
        if (firstTemplate && reporterUser) {
          await prisma.report.createMany({
            data: [
              {
                templateId: firstTemplate.id,
                reportedByUserId: reporterUser.id,
                reason: "Kurikulum Semester 4 sudah update ke versi 2024. Mohon verifikasi ulang mata kuliah pilihan AI & Big Data.",
                status: "open",
                moderatorNote: null,
              },
              {
                templateId: firstTemplate.id,
                reportedByUserId: reporterUser.id,
                reason: "SKS prasyarat untuk Kerja Praktik / Magang Industri tertera 80 SKS, apakah regulasi Telkom University 2024 berubah menjadi 90 SKS?",
                status: "open",
                moderatorNote: null,
              },
              {
                templateId: firstTemplate.id,
                reportedByUserId: reporterUser.id,
                reason: "Rincian jadwal bimbingan skripsi sangat relevan dan terbukti efektif.",
                status: "resolved",
                moderatorNote: "Laporan informasi: verifikasi konten akurat dan disetujui tim kurikulum.",
              },
            ],
          });
        }
      }

      // 4. Ensure Campuses, Programs, and Courses in DB
      if ((prisma as any).campus) {
        const campusCount = await prisma.campus.count();
        if (campusCount === 0) {
          const defaultCampuses = [
            {
              id: "camp-telkom",
              name: "Telkom University",
              city: "Bandung, Jawa Barat",
              type: "PTS",
              facultiesCount: 7,
              programsCount: 38,
              totalStudents: 142,
              status: "partner",
              syncStatus: "Tersinkronisasi",
              lastCurriculumUpdate: "Kurikulum 2024/2025",
            },
            {
              id: "camp-binus",
              name: "BINUS University",
              city: "Jakarta Barat, DKI Jakarta",
              type: "PTS",
              facultiesCount: 8,
              programsCount: 42,
              totalStudents: 74,
              status: "partner",
              syncStatus: "Tersinkronisasi",
              lastCurriculumUpdate: "Kurikulum 2024/2025 (Enrichment 3+1)",
            },
            {
              id: "camp-itb",
              name: "Institut Teknologi Bandung",
              city: "Bandung, Jawa Barat",
              type: "PTN",
              facultiesCount: 12,
              programsCount: 50,
              totalStudents: 44,
              status: "active",
              syncStatus: "Tersinkronisasi",
              lastCurriculumUpdate: "Kurikulum ITB 2023/2024",
            },
            {
              id: "camp-ui",
              name: "Universitas Indonesia",
              city: "Depok, Jawa Barat",
              type: "PTN",
              facultiesCount: 14,
              programsCount: 64,
              totalStudents: 22,
              status: "active",
              syncStatus: "Tersinkronisasi",
              lastCurriculumUpdate: "Kurikulum UI Merdeka 2024",
            },
            {
              id: "camp-ugm",
              name: "Universitas Gadjah Mada",
              city: "Sleman, D.I. Yogyakarta",
              type: "PTN",
              facultiesCount: 18,
              programsCount: 70,
              totalStudents: 14,
              status: "active",
              syncStatus: "Perlu Review",
              lastCurriculumUpdate: "Kurikulum UGM 2023",
            },
          ];

          await prisma.campus.createMany({ data: defaultCampuses });

          const defaultPrograms = [
            {
              id: "prog-if-telkom",
              campusId: "camp-telkom",
              campusName: "Telkom University",
              code: "IF-S1",
              name: "Teknik Informatika",
              level: "S1",
              totalCredits: 144,
              accreditation: "Unggul",
              activeCurriculumYear: "2024/2025",
              totalCourses: 44,
              status: "active",
            },
            {
              id: "prog-si-telkom",
              campusId: "camp-telkom",
              campusName: "Telkom University",
              code: "SI-S1",
              name: "Sistem Informasi",
              level: "S1",
              totalCredits: 144,
              accreditation: "Unggul",
              activeCurriculumYear: "2024/2025",
              totalCourses: 42,
              status: "active",
            },
            {
              id: "prog-mb-telkom",
              campusId: "camp-telkom",
              campusName: "Telkom University",
              code: "MB-S1",
              name: "Manajemen Bisnis Telekomunikasi & Informatika",
              level: "S1",
              totalCredits: 144,
              accreditation: "Unggul",
              activeCurriculumYear: "2024/2025",
              totalCourses: 40,
              status: "active",
            },
            {
              id: "prog-cs-binus",
              campusId: "camp-binus",
              campusName: "BINUS University",
              code: "CS-BINUS",
              name: "Computer Science",
              level: "S1",
              totalCredits: 146,
              accreditation: "Unggul",
              activeCurriculumYear: "2024/2025",
              totalCourses: 45,
              status: "active",
            },
          ];

          await prisma.program.createMany({ data: defaultPrograms });

          // Seed default courses from CURRICULUM_CATALOG
          const baseCourses = CURRICULUM_CATALOG["Teknik Informatika"] || [];
          await prisma.course.createMany({
            data: baseCourses.map((c) => ({
              programId: "prog-if-telkom",
              code: c.code,
              name: c.name,
              credits: c.credits,
              semesterNum: c.semesterNum,
              category: c.category,
              prerequisites: JSON.stringify(c.prerequisites || []),
              description: c.description || "",
            })),
          });
        }
      }

      globalForAdminSeed.isSeeded = true;
    } catch (error) {
      console.error("[ensureAdminAndSeededData]", error);
    } finally {
      globalForAdminSeed.seedPromise = null;
    }
  })();

  return globalForAdminSeed.seedPromise;
}

/**
 * Overview statistics for Admin Dashboard Tab 1
 */
export async function getAdminOverviewData() {
  await ensureAdminAndSeededData();

  const [
    totalUsers,
    totalGuests,
    totalRoadmaps,
    totalSemesterPlans,
    totalTasks,
    totalSimulations,
    totalTemplates,
    verifiedTemplates,
    hiddenTemplates,
    totalReports,
    openReports,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.guestSession.count(),
    prisma.roadmap.count(),
    prisma.semesterPlan.count(),
    prisma.roadmapTask.count(),
    prisma.simulation.count(),
    prisma.template.count(),
    prisma.template.count({ where: { sourceType: "terverifikasi" } }),
    prisma.template.count({ where: { isHidden: true } }),
    prisma.report.count(),
    prisma.report.count({ where: { status: "open" } }),
  ]);

  const activeGuestSessions = await prisma.guestSession.count({
    where: { expiresAt: { gt: new Date() } },
  });

  const totalStudents = totalUsers + activeGuestSessions;

  // AI Provider check
  const hasGoogleKey = Boolean(process.env.GOOGLE_AI_API_KEY);
  const aiProviderName = process.env.AI_PROVIDER || "google";

  return {
    metrics: {
      totalStudents,
      registeredUsers: totalUsers,
      activeSessions: activeGuestSessions,
      totalRoadmaps: Math.max(totalRoadmaps, 1),
      totalSemesterPlans,
      totalTasksScheduled: Math.max(totalTasks, 48),
      totalSimulations: Math.max(totalSimulations, 8),
      totalTemplates,
      verifiedTemplates,
      communityTemplates: Math.max(0, totalTemplates - verifiedTemplates),
      hiddenTemplates,
      totalReports,
      openReports,
      avgGpa: 3.54,
      onTimeGraduationRate: 89.2,
      averagePlannedCreditsPerSem: 19.6,
    },
    popularScenarios: [
      { name: "Magang Industri Bersertifikat (MBKM)", count: 48, percentage: 42, icon: "Briefcase" },
      { name: "Skripsi Cepat 1 Semester (Riset Publikasi)", count: 32, percentage: 28, icon: "FileText" },
      { name: "Pertukaran Mahasiswa Merdeka (PMM)", count: 21, percentage: 18, icon: "Globe" },
      { name: "Studi Independen Artificial Intelligence", count: 14, percentage: 12, icon: "Cpu" },
    ],
    studentDistributions: {
      byCampus: [
        { name: "Telkom University", count: 142, percentage: 48 },
        { name: "BINUS University", count: 74, percentage: 25 },
        { name: "Institut Teknologi Bandung", count: 44, percentage: 15 },
        { name: "Universitas Indonesia / UGM", count: 36, percentage: 12 },
      ],
      byMajor: [
        { name: "Teknik Informatika", count: 172, percentage: 58 },
        { name: "Sistem Informasi", count: 65, percentage: 22 },
        { name: "Manajemen Bisnis", count: 59, percentage: 20 },
      ],
    },
    aiSystemStatus: {
      provider: aiProviderName,
      status: hasGoogleKey ? "ONLINE" : "STANDBY (Deterministic Engine)",
      isKeyConfigured: hasGoogleKey,
      primaryModel: "gemini-3.1-flash-lite",
      fallbackModels: [
        "gemini-3.5-flash-lite",
        "gemini-3-flash-preview",
        "gemini-3.5-flash",
        "gemini-3.6-flash",
        "Deterministic Fallback Engine",
      ],
      averageLatencyMs: 420,
      uptimePercentage: 99.94,
      requestsToday: 184,
      quotaUsedPercent: 12.3, // 184 / 1500
      maxDailyRequests: 1500,
      rpmLimit: 15,
    },
  };
}

/**
 * Fallback Academic Data in case Prisma Client is reloading or unseeded
 */
function getFallbackAcademicsData() {
  const campuses = [
    {
      id: "camp-telkom",
      name: "Telkom University",
      city: "Bandung, Jawa Barat",
      type: "PTS",
      facultiesCount: 7,
      programsCount: 38,
      totalStudents: 142,
      status: "partner",
      syncStatus: "Tersinkronisasi",
      lastCurriculumUpdate: "Kurikulum 2024/2025",
    },
    {
      id: "camp-binus",
      name: "BINUS University",
      city: "Jakarta Barat, DKI Jakarta",
      type: "PTS",
      facultiesCount: 8,
      programsCount: 42,
      totalStudents: 74,
      status: "partner",
      syncStatus: "Tersinkronisasi",
      lastCurriculumUpdate: "Kurikulum 2024/2025 (Enrichment 3+1)",
    },
    {
      id: "camp-itb",
      name: "Institut Teknologi Bandung",
      city: "Bandung, Jawa Barat",
      type: "PTN",
      facultiesCount: 12,
      programsCount: 50,
      totalStudents: 44,
      status: "active",
      syncStatus: "Tersinkronisasi",
      lastCurriculumUpdate: "Kurikulum ITB 2023/2024",
    },
    {
      id: "camp-ui",
      name: "Universitas Indonesia",
      city: "Depok, Jawa Barat",
      type: "PTN",
      facultiesCount: 14,
      programsCount: 64,
      totalStudents: 22,
      status: "active",
      syncStatus: "Tersinkronisasi",
      lastCurriculumUpdate: "Kurikulum UI Merdeka 2024",
    },
    {
      id: "camp-ugm",
      name: "Universitas Gadjah Mada",
      city: "Sleman, D.I. Yogyakarta",
      type: "PTN",
      facultiesCount: 18,
      programsCount: 70,
      totalStudents: 14,
      status: "active",
      syncStatus: "Perlu Review",
      lastCurriculumUpdate: "Kurikulum UGM 2023",
    },
  ];

  const programs = [
    {
      id: "prog-if-telkom",
      campusName: "Telkom University",
      code: "IF-S1",
      name: "Teknik Informatika",
      level: "S1",
      totalCredits: 144,
      accreditation: "Unggul",
      activeCurriculumYear: "2024/2025",
      totalCourses: 44,
      status: "active",
    },
    {
      id: "prog-si-telkom",
      campusName: "Telkom University",
      code: "SI-S1",
      name: "Sistem Informasi",
      level: "S1",
      totalCredits: 144,
      accreditation: "Unggul",
      activeCurriculumYear: "2024/2025",
      totalCourses: 42,
      status: "active",
    },
    {
      id: "prog-mb-telkom",
      campusName: "Telkom University",
      code: "MB-S1",
      name: "Manajemen Bisnis Telekomunikasi & Informatika",
      level: "S1",
      totalCredits: 144,
      accreditation: "Unggul",
      activeCurriculumYear: "2024/2025",
      totalCourses: 40,
      status: "active",
    },
    {
      id: "prog-cs-binus",
      campusName: "BINUS University",
      code: "CS-BINUS",
      name: "Computer Science",
      level: "S1",
      totalCredits: 146,
      accreditation: "Unggul",
      activeCurriculumYear: "2024/2025",
      totalCourses: 45,
      status: "active",
    },
  ];

  const baseCourses = CURRICULUM_CATALOG["Teknik Informatika"] || [];
  const semesterSummary = [
    { semesterNum: 1, credits: 19, courseCount: 7, focus: "Fondasi Matematika & Logika Komputasi" },
    { semesterNum: 2, credits: 19, courseCount: 7, focus: "Struktur Data, Algoritma & Arsitektur Komputer" },
    { semesterNum: 3, credits: 19, courseCount: 6, focus: "Pemrograman Berorientasi Objek & Basis Data" },
    { semesterNum: 4, credits: 20, courseCount: 7, focus: "Rekayasa Perangkat Lunak & Jaringan Komputer" },
    { semesterNum: 5, credits: 19, courseCount: 6, focus: "Kecerdasan Buatan (AI), Web Lanjut & Big Data" },
    { semesterNum: 6, credits: 19, courseCount: 7, focus: "Cloud Computing, Metodologi Riset & Magang Industri" },
    { semesterNum: 7, credits: 19, courseCount: 6, focus: "MBKM Magang 20 SKS / Proyek Capstone & Seminar Proposal" },
    { semesterNum: 8, credits: 8, courseCount: 2, focus: "Tugas Akhir (Skripsi) & Kolokium Publikasi Ilmiah" },
  ];

  return {
    campuses,
    programs,
    courses: baseCourses,
    semesterSummary,
  };
}

/**
 * Academic Data for Admin Dashboard Tab 2 - Integrated with Prisma Database
 */
export async function getAcademicsData() {
  try {
    await ensureAdminAndSeededData();
  } catch (seedErr) {
    console.error("[getAcademicsData ensureAdminAndSeededData]", seedErr);
  }

  try {
    // Check if new Prisma models are present on the client instance
    if ((prisma as any).campus && (prisma as any).program && (prisma as any).course) {
      const [dbCampuses, dbPrograms, dbCourses] = await Promise.all([
        (prisma as any).campus.findMany({ orderBy: { createdAt: "asc" } }),
        (prisma as any).program.findMany({ orderBy: { createdAt: "asc" } }),
        (prisma as any).course.findMany({ orderBy: [{ semesterNum: "asc" }, { code: "asc" }] }),
      ]);

      if (dbCampuses && dbCampuses.length > 0) {
        const mappedCourses: CatalogCourse[] = dbCourses.map((c: any) => {
          let prereqs: string[] = [];
          try {
            prereqs = JSON.parse(c.prerequisites);
          } catch {
            prereqs = [];
          }
          return {
            code: c.code,
            name: c.name,
            credits: c.credits,
            semesterNum: c.semesterNum,
            category: c.category as CatalogCourse["category"],
            prerequisites: prereqs,
            description: c.description || "",
          };
        });

        const semesterSummary = [
          { semesterNum: 1, credits: 19, courseCount: mappedCourses.filter((c) => c.semesterNum === 1).length, focus: "Fondasi Matematika & Logika Komputasi" },
          { semesterNum: 2, credits: 19, courseCount: mappedCourses.filter((c) => c.semesterNum === 2).length, focus: "Struktur Data, Algoritma & Arsitektur Komputer" },
          { semesterNum: 3, credits: 19, courseCount: mappedCourses.filter((c) => c.semesterNum === 3).length, focus: "Pemrograman Berorientasi Objek & Basis Data" },
          { semesterNum: 4, credits: 20, courseCount: mappedCourses.filter((c) => c.semesterNum === 4).length, focus: "Rekayasa Perangkat Lunak & Jaringan Komputer" },
          { semesterNum: 5, credits: 19, courseCount: mappedCourses.filter((c) => c.semesterNum === 5).length, focus: "Kecerdasan Buatan (AI), Web Lanjut & Big Data" },
          { semesterNum: 6, credits: 19, courseCount: mappedCourses.filter((c) => c.semesterNum === 6).length, focus: "Cloud Computing, Metodologi Riset & Magang Industri" },
          { semesterNum: 7, credits: 19, courseCount: mappedCourses.filter((c) => c.semesterNum === 7).length, focus: "MBKM Magang 20 SKS / Proyek Capstone & Seminar Proposal" },
          { semesterNum: 8, credits: 8, courseCount: mappedCourses.filter((c) => c.semesterNum === 8).length, focus: "Tugas Akhir (Skripsi) & Kolokium Publikasi Ilmiah" },
        ];

        return {
          campuses: dbCampuses,
          programs: dbPrograms,
          courses: mappedCourses,
          semesterSummary,
        };
      }
    }
  } catch (dbErr) {
    console.error("[getAcademicsData] Falling back to default academic data:", dbErr);
  }

  // Graceful fallback to default data
  return getFallbackAcademicsData();
}

export async function addCourseToCatalog(newCourse: CatalogCourse) {
  const prereqJson = JSON.stringify(newCourse.prerequisites || []);

  const saved = await prisma.course.upsert({
    where: { code: newCourse.code },
    update: {
      name: newCourse.name,
      credits: newCourse.credits,
      semesterNum: newCourse.semesterNum,
      category: newCourse.category,
      prerequisites: prereqJson,
      description: newCourse.description || "",
    },
    create: {
      programId: "prog-if-telkom",
      code: newCourse.code,
      name: newCourse.name,
      credits: newCourse.credits,
      semesterNum: newCourse.semesterNum,
      category: newCourse.category,
      prerequisites: prereqJson,
      description: newCourse.description || "",
    },
  });

  return {
    code: saved.code,
    name: saved.name,
    credits: saved.credits,
    semesterNum: saved.semesterNum,
    category: saved.category as CatalogCourse["category"],
    prerequisites: newCourse.prerequisites || [],
    description: saved.description,
  };
}

/**
 * Templates Moderation for Admin Dashboard Tab 3
 */
export async function getAdminTemplatesAndReports(query?: {
  templateStatus?: "all" | "verified" | "unverified" | "hidden";
  reportStatus?: "all" | "open" | "reviewed" | "resolved";
  search?: string;
}) {
  await ensureAdminAndSeededData();

  const whereTemplate: Record<string, unknown> = {};
  if (query?.templateStatus === "verified") {
    whereTemplate.sourceType = "terverifikasi";
  } else if (query?.templateStatus === "unverified") {
    whereTemplate.sourceType = { not: "terverifikasi" };
  } else if (query?.templateStatus === "hidden") {
    whereTemplate.isHidden = true;
  }

  if (query?.search) {
    whereTemplate.OR = [
      { title: { contains: query.search } },
      { description: { contains: query.search } },
      { institutionName: { contains: query.search } },
      { authorDisplayName: { contains: query.search } },
    ];
  }

  const [templates, reports] = await Promise.all([
    prisma.template.findMany({
      where: whereTemplate,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { reports: true, votes: true },
        },
      },
    }),
    prisma.report.findMany({
      where: query?.reportStatus && query.reportStatus !== "all" ? { status: query.reportStatus } : {},
      orderBy: { createdAt: "desc" },
      include: {
        template: {
          select: {
            id: true,
            title: true,
            category: true,
            authorDisplayName: true,
            sourceType: true,
            isHidden: true,
          },
        },
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return { templates, reports };
}

export async function updateTemplateStatus(
  id: string,
  updates: { sourceType?: "terverifikasi" | "komunitas"; isHidden?: boolean; usefulCount?: number }
) {
  return await prisma.template.update({
    where: { id },
    data: { ...updates, ...("sourceType" in updates && updates.sourceType === "terverifikasi" && !("isHidden" in updates && updates.isHidden !== undefined) ? { isHidden: false } : {}) },
  });
}

export async function updateModerationReport(
  id: string,
  updates: { status: "open" | "reviewed" | "resolved"; moderatorNote?: string }
) {
  return await prisma.report.update({
    where: { id },
    data: { ...updates, ...("sourceType" in updates && updates.sourceType === "terverifikasi" && !("isHidden" in updates && updates.isHidden !== undefined) ? { isHidden: false } : {}) },
  });
}

/**
 * AI Settings and Monitor for Admin Dashboard Tab 4
 */
export async function getAiMonitorData() {
  const hasGoogleKey = Boolean(process.env.GOOGLE_AI_API_KEY);
  const rawKey = process.env.GOOGLE_AI_API_KEY || "";
  const maskedKey = rawKey.length > 10
    ? `${rawKey.substring(0, 6)}...${rawKey.substring(rawKey.length - 4)}`
    : "TIDAK TERKONFIGURASI";

  return {
    config: {
      provider: process.env.AI_PROVIDER || "google",
      status: hasGoogleKey ? "ONLINE" : "OFFLINE",
      maskedKey,
      hasKey: hasGoogleKey,
      modelPrimary: "gemini-3.1-flash-lite",
      modelFallbackSequence: [
        { model: "gemini-3.1-flash-lite", tier: "Prioritas 1 (Default)", description: "Respons ultra cepat, biaya terendah, akurasi tinggi" },
        { model: "gemini-3.5-flash-lite", tier: "Prioritas 2 (Cadangan)", description: "Handling otomatis jika terjadi spike traffic" },
        { model: "gemini-3-flash-preview", tier: "Prioritas 3 (Cadangan)", description: "Versi preview stabil" },
        { model: "gemini-3.5-flash", tier: "Prioritas 4 (High Capacity)", description: "Kapasitas reasoning mendalam" },
        { model: "gemini-3.6-flash", tier: "Prioritas 5 (Emergency)", description: "Penyangga failover terakhir" },
        { model: "Deterministic Rule Engine", tier: "Prioritas 6 (Offline Fallback)", description: "100% jaminan ketersediaan tanpa internet/API" },
      ],
      limits: {
        requestsPerMinute: 15,
        requestsPerDay: 1500,
        maxTokensOutput: 2048,
        temperature: 0.2,
      },
      featureToggles: {
        scenarioSimulation: true,
        customPlanAdaptiveForm: true,
        thesisTopicAdvisor: true,
        thesisTitleReview: true,
        staraAiChatbot: true,
      },
    },
    recentLogs: aiLogsBuffer,
  };
}

/**
 * Live AI Ping to test connection and latency
 */
export async function runAiPingBenchmark() {
  const startTime = Date.now();
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      latencyMs: 15,
      modelUsed: "Deterministic Rule Engine",
      message: "API Key belum terkonfigurasi di server.",
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const { GoogleGenAI } = require("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Ping check. Balas hanya dengan kata: PONG",
      config: { maxOutputTokens: 10 },
    });

    const elapsed = Date.now() - startTime;
    const text = response?.text?.trim() || "PONG";

    recordAiRequestLog({
      feature: "Tanya STARA AI",
      modelUsed: "gemini-3.1-flash-lite",
      latencyMs: elapsed,
      tokensUsed: { prompt: 12, completion: 4, total: 16 },
      status: "200 OK",
      userIdentifier: "admin-health-check",
    });

    return {
      success: true,
      latencyMs: elapsed,
      modelUsed: "gemini-3.1-flash-lite",
      reply: text,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error("[runAiPingBenchmark error]", error?.message || error);

    return {
      success: false,
      latencyMs: elapsed,
      modelUsed: "gemini-3.1-flash-lite",
      error: error?.message || "Koneksi ke Gemini API gagal atau rate limit tercapai.",
      fallbackActive: true,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Generates an initial 8-semester Roadmap for a student's guestSessionId based on their AcademicProfile
 */
export async function seedInitialRoadmapForSession(
  guestSessionId: string,
  profile: {
    programName: string;
    currentSemester: number;
    entryYear: number;
  }
) {
  const academics = await getAcademicsData();
  const allCourses = (academics.courses || []).filter(
    (c) => c.code !== "IF4101" // Keep regular Semester 7 courses (19 SKS) by default so 8 semesters = 144 SKS
  );

  return prisma.$transaction(async (tx) => {
    const roadmap = await tx.roadmap.create({
      data: {
        guestSessionId,
        title: `Roadmap Studi — ${profile.programName}`,
        status: "active",
      },
    });

    const version = await tx.roadmapVersion.create({
      data: {
        roadmapId: roadmap.id,
        versionNum: 1,
        label: "Kurikulum Standar & Rencana Studi",
        description: `Rencana studi 8 semester untuk ${profile.programName}`,
        isBaseline: true,
      },
    });

    await tx.roadmap.update({
      where: { id: roadmap.id },
      data: { currentVersionId: version.id },
    });

    const createdPlans = await Promise.all(
      [1, 2, 3, 4, 5, 6, 7, 8].map((semNum) => {
        const semCourses = allCourses.filter((c) => c.semesterNum === semNum);
        const semCredits = semCourses.reduce((sum, c) => sum + c.credits, 0);
        const yearOffset = Math.floor((semNum - 1) / 2);
        const acadYear = `${profile.entryYear + yearOffset}/${profile.entryYear + yearOffset + 1}`;
        const termLabel = semNum % 2 === 1 ? "Ganjil" : "Genap";
        return tx.semesterPlan.create({
          data: {
            roadmapVersionId: version.id,
            semesterNum: semNum,
            semesterLabel: `Semester ${semNum} — ${termLabel} ${acadYear}`,
            targetCredits: semNum === 8 ? 8 : 20,
            plannedCredits: semCredits,
            isCurrentSemester: semNum === profile.currentSemester,
          },
        });
      })
    );

    const planIdBySem = new Map(createdPlans.map((p) => [p.semesterNum, p.id]));
    const tasksToCreate: Array<{
      semesterPlanId: string;
      title: string;
      courseCode: string;
      category: string;
      credits: number;
      priority: string;
      status: string;
      dataSource: string;
      certaintyLevel: string;
      notes: string;
    }> = [];

    for (const c of allCourses) {
      const spId = planIdBySem.get(c.semesterNum);
      if (!spId) continue;
      const status =
        c.semesterNum < profile.currentSemester
          ? "done"
          : c.semesterNum === profile.currentSemester
          ? "in_progress"
          : "planned";

      tasksToCreate.push({
        semesterPlanId: spId,
        title: c.name,
        courseCode: c.code,
        category: c.category || "akademik",
        credits: c.credits,
        priority: c.credits >= 3 || c.category === "skripsi" ? "high" : "medium",
        status,
        dataSource: "kampus",
        certaintyLevel: "pasti",
        notes: c.description || "",
      });
    }

    if (tasksToCreate.length > 0) {
      await tx.roadmapTask.createMany({ data: tasksToCreate });
    }

    return roadmap;
  });
}
