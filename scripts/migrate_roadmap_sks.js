const { PrismaClient } = require('../node_modules/@prisma/client');
const prisma = new PrismaClient();

// Inline defaults mirroring src/server/curriculum/defaults.ts
function getDefaultTasksForSemester(semesterNum, programName = "Teknik Informatika", isCurrent = false) {
  const isInf =
    programName.toLowerCase().includes("informatika") ||
    programName.toLowerCase().includes("komputer") ||
    programName.toLowerCase().includes("software") ||
    programName.toLowerCase().includes("sistem informasi");

  const defaultStatus = isCurrent ? "in_progress" : "planned";

  if (isInf) {
    switch (semesterNum) {
      case 1:
        return [
          { title: "Dasar Pemrograman (Python)", category: "akademik", credits: 4, courseCode: "IF1101", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Matematika Diskrit I", category: "akademik", credits: 3, courseCode: "MA1101", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Kalkulus I", category: "akademik", credits: 3, courseCode: "MA1102", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Pengantar Rekayasa & Komputasi", category: "akademik", credits: 2, courseCode: "IF1102", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Bahasa Inggris Akademik", category: "akademik", credits: 2, courseCode: "KU1101", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Tata Tulis Karya Ilmiah & Bahasa Indonesia", category: "akademik", credits: 2, courseCode: "KU1102", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Pendidikan Agama & Etika", category: "akademik", credits: 3, courseCode: "KU1103", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Pengenalan Kehidupan Kampus Mahasiswa Baru (PKKMB)", category: "tak", credits: 0, status: "done", certaintyLevel: "pasti" },
        ]; // Total: 19 SKS
      case 2:
        return [
          { title: "Algoritma & Struktur Data", category: "akademik", credits: 4, courseCode: "IF1201", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Organisasi & Arsitektur Komputer", category: "akademik", credits: 3, courseCode: "IF1202", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Aljabar Linier & Matriks", category: "akademik", credits: 3, courseCode: "MA1201", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Kalkulus II", category: "akademik", credits: 3, courseCode: "MA1202", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Sistem Basis Data Dasar", category: "akademik", credits: 3, courseCode: "IF1203", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Kewirausahaan Dasar", category: "akademik", credits: 2, courseCode: "KU1201", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Literasi TIK & Data", category: "akademik", credits: 1, courseCode: "KU1202", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Partisipasi Organisasi Kemahasiswaan & UKM", category: "tak", credits: 0, status: defaultStatus, certaintyLevel: "pasti" },
        ]; // Total: 19 SKS
      case 3:
        return [
          { title: "Pemrograman Berorientasi Objek (OOP)", category: "akademik", credits: 3, courseCode: "IF2101", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Basis Data & Perancangan Relasional", category: "akademik", credits: 4, courseCode: "IF2102", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Sistem Operasi", category: "akademik", credits: 3, courseCode: "IF2103", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Strategi Algoritma", category: "akademik", credits: 3, courseCode: "IF2104", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Matematika Diskrit II & Teori Graf", category: "akademik", credits: 3, courseCode: "MA2101", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Pemodelan Perangkat Lunak (UML)", category: "akademik", credits: 3, courseCode: "IF2105", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Pengumpulan Poin TAK Ekstrakurikuler (Target 30 Poin)", category: "tak", credits: 0, status: defaultStatus, certaintyLevel: "pasti" },
        ]; // Total: 19 SKS
      case 4:
        return [
          { title: "Rekayasa Perangkat Lunak (RPL)", category: "akademik", credits: 3, courseCode: "IF2201", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Jaringan Komputer & Komunikasi Data", category: "akademik", credits: 3, courseCode: "IF2202", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Probabilitas & Statistika Komputasi", category: "akademik", credits: 3, courseCode: "IF2203", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Interaksi Manusia & Komputer (UI/UX)", category: "akademik", credits: 3, courseCode: "IF2204", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Teori Bahasa & Otomata", category: "akademik", credits: 3, courseCode: "IF2205", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Pemrograman Berorientasi Objek Lanjut", category: "akademik", credits: 3, courseCode: "IF2206", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Pancasila & Kewarganegaraan", category: "akademik", credits: 2, courseCode: "KU2001", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Konsultasi Rencana Studi Dosen Wali", category: "akademik", credits: 0, status: "done", certaintyLevel: "pasti" },
        ]; // Total: 20 SKS
      case 5:
        return [
          { title: "Kecerdasan Buatan & Pembelajaran Mesin", category: "akademik", credits: 4, courseCode: "IF3101", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Pengembangan Aplikasi Web & Cloud", category: "akademik", credits: 3, courseCode: "IF3102", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Keamanan Informasi & Kriptografi", category: "akademik", credits: 3, courseCode: "IF3103", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Basis Data Terdistribusi & Big Data", category: "akademik", credits: 3, courseCode: "IF3104", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Sistem Operasi Lanjut & Virtualisasi", category: "akademik", credits: 3, courseCode: "IF3105", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Analisis & Desain Algoritma Kompleks", category: "akademik", credits: 3, courseCode: "IF3106", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Pengumpulan Poin TAK Ekstrakurikuler (Target 40 Poin)", category: "tak", credits: 0, status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Persiapan Portofolio Magang & Review CV ATS", category: "karier", credits: 0, status: defaultStatus, certaintyLevel: "estimasi" },
        ]; // Total: 19 SKS
      case 6:
        return [
          { title: "Sistem Terdistribusi & Cloud Architecture", category: "akademik", credits: 3, courseCode: "IF3201", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Pra-Tugas Akhir & Metodologi Penelitian", category: "skripsi", credits: 2, courseCode: "IF3202", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Pemrosesan Bahasa Alami (NLP)", category: "akademik", credits: 3, courseCode: "IF3203", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Kerja Praktik / Magang Industri (KP)", category: "karier", credits: 3, courseCode: "IF3204", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Rekayasa Kebutuhan & Kualitas Perangkat Lunak", category: "akademik", credits: 3, courseCode: "IF3205", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Internet of Things (IoT) & Embedded System", category: "akademik", credits: 3, courseCode: "IF3206", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Kapita Selekta Informatika I", category: "akademik", credits: 2, courseCode: "IF3207", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Eksplorasi Topik Skripsi & Calon Pembimbing", category: "skripsi", credits: 0, status: defaultStatus, certaintyLevel: "estimasi" },
        ]; // Total: 19 SKS
      case 7:
        return [
          { title: "Proyek Capstone Rekayasa Terpadu", category: "akademik", credits: 4, courseCode: "IF4101", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Seminar Proposal Tugas Akhir", category: "skripsi", credits: 2, courseCode: "IF4102", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Etika Profesi & Hukum Teknologi", category: "akademik", credits: 2, courseCode: "IF4103", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Tata Kelola TI & Manajemen Proyek", category: "akademik", credits: 3, courseCode: "IF4104", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Peminatan: Cloud Architecture & DevOps", category: "akademik", credits: 3, courseCode: "IF4105", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Peminatan: Computer Vision & AI Terapan", category: "akademik", credits: 3, courseCode: "IF4106", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Technopreneurship & Inovasi Bisnis Digital", category: "akademik", credits: 2, courseCode: "IF4107", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Bimbingan Intensif Draf Proposal Skripsi", category: "skripsi", credits: 0, status: defaultStatus, certaintyLevel: "estimasi" },
        ]; // Total: 19 SKS
      case 8:
        return [
          { title: "Tugas Akhir / Skripsi", category: "skripsi", credits: 6, courseCode: "IF4201", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Kolokium & Publikasi Ilmiah", category: "skripsi", credits: 2, courseCode: "IF4202", status: defaultStatus, certaintyLevel: "pasti" },
          { title: "Bimbingan Rutin & Pengujian Sistem Skripsi", category: "skripsi", credits: 0, status: defaultStatus, certaintyLevel: "estimasi" },
          { title: "Sidang Tugas Akhir & Yudisium Sarjana", category: "skripsi", credits: 0, status: defaultStatus, certaintyLevel: "estimasi" },
        ]; // Total: 8 SKS
      default:
        return [
          { title: `Mata Kuliah Peminatan Lanjut Semester ${semesterNum}`, category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "estimasi" },
          { title: `Pengembangan Kompetensi Profesional ${semesterNum}`, category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "estimasi" },
        ];
    }
  }

  if (semesterNum === 8) {
    return [
      { title: `Tugas Akhir / Skripsi ${programName}`, category: "skripsi", credits: 6, status: defaultStatus, certaintyLevel: "pasti" },
      { title: "Kolokium & Ujian Komprehensif Kelulusan", category: "skripsi", credits: 2, status: defaultStatus, certaintyLevel: "pasti" },
      { title: "Bimbingan Naskah & Sidang Sarjana", category: "skripsi", credits: 0, status: defaultStatus, certaintyLevel: "estimasi" },
    ];
  }

  return [
    { title: `Mata Kuliah Keahlian Inti ${programName} I`, category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti" },
    { title: `Mata Kuliah Keahlian Inti ${programName} II`, category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti" },
    { title: `Mata Kuliah Teori & Analisis Terapan`, category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti" },
    { title: `Metodologi Penelitian & Praktikum Terpadu`, category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti" },
    { title: `Mata Kuliah Peminatan Khusus ${programName}`, category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti" },
    { title: `Praktik Lapangan / Kerja Magang Profesi`, category: "karier", credits: 3, status: defaultStatus, certaintyLevel: "pasti" },
    { title: "Pendidikan Karakter & Etika Profesi", category: "akademik", credits: 2, status: defaultStatus, certaintyLevel: "pasti" },
    { title: "Konsultasi Rencana Studi Dosen Pembimbing", category: "akademik", credits: 0, status: defaultStatus, certaintyLevel: "pasti" },
  ];
}

async function main() {
  const roadmaps = await prisma.roadmap.findMany({
    include: {
      guestSession: { include: { academicProfile: true } },
      versions: {
        include: {
          semesterPlans: {
            include: { tasks: true }
          }
        }
      }
    }
  });

  console.log(`Menemukan ${roadmaps.length} roadmap untuk diperiksa...`);

  for (const r of roadmaps) {
    const profile = r.guestSession?.academicProfile;
    const progName = profile?.programName || "S1 Teknik Informatika";
    const currSem = profile?.currentSemester || 4;

    for (const v of r.versions) {
      console.log(`Memproses Roadmap: ${r.title} (Version: ${v.label})`);

      for (const sp of v.semesterPlans) {
        const currentCredits = sp.tasks.reduce((sum, t) => sum + (t.credits || 0), 0);

        // Jika SKS di bawah 15 pada semester reguler (atau di bawah 8 pada semester 8)
        const isLow = (sp.semesterNum < 8 && currentCredits < 15) || (sp.semesterNum >= 8 && currentCredits < 8);

        if (isLow) {
          console.log(`  Updating Semester ${sp.semesterNum}: SKS lama ${currentCredits} -> Diperbarui ke 18-20 SKS`);

          // Hapus task lama yang tidak lengkap
          await prisma.roadmapTask.deleteMany({
            where: { semesterPlanId: sp.id }
          });

          const isCurrent = sp.semesterNum === currSem;
          const newTasks = getDefaultTasksForSemester(sp.semesterNum, progName, isCurrent);
          const academicCredits = newTasks.reduce((sum, t) => sum + (t.credits || 0), 0);

          await prisma.roadmapTask.createMany({
            data: newTasks.map(t => ({
              semesterPlanId: sp.id,
              title: t.title,
              category: t.category,
              credits: t.credits,
              status: t.status,
              courseCode: t.courseCode || null,
              notes: t.notes || (t.credits > 0 ? "Kurikulum reguler standar" : "Milestone akademik"),
              certaintyLevel: t.certaintyLevel,
            }))
          });

          await prisma.semesterPlan.update({
            where: { id: sp.id },
            data: {
              targetCredits: academicCredits,
              plannedCredits: academicCredits,
              isCurrentSemester: isCurrent,
            }
          });
        } else {
          console.log(`  Semester ${sp.semesterNum}: SKS ${currentCredits} sudah memadai (>= 15 SKS).`);
        }
      }
    }

    // Perbarui inProgressCredits pada AcademicProfile jika ada
    if (profile) {
      const currentPlan = await prisma.semesterPlan.findFirst({
        where: {
          roadmapVersionId: r.currentVersionId || undefined,
          semesterNum: profile.currentSemester,
        },
        include: { tasks: true }
      });

      if (currentPlan) {
        const inProgressSKS = currentPlan.tasks
          .filter(t => t.credits > 0)
          .reduce((sum, t) => sum + t.credits, 0);

        await prisma.academicProfile.update({
          where: { id: profile.id },
          data: { inProgressCredits: inProgressSKS }
        });
        console.log(`  Profile ${profile.id} inProgressCredits updated to ${inProgressSKS} SKS.`);
      }
    }
  }

  console.log("Migrasi SKS selesai dengan sukses!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
