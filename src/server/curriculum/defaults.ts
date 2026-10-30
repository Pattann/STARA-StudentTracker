import "server-only";

export interface DefaultTaskItem {
  title: string;
  category: "akademik" | "tak" | "karier" | "skripsi" | "pribadi";
  credits: number;
  status: "in_progress" | "planned" | "done";
  courseCode?: string;
  notes?: string;
  certaintyLevel: "pasti" | "estimasi" | "terkonfirmasi";
}

/**
 * Menyediakan daftar kelompok mata kuliah kurikulum standar (Wajib / Inti, Pilihan, Prasyarat, Praktikum)
 * bukan nama mata kuliah spesifik, agar fleksibel dan berlaku untuk semua program studi mahasiswa.
 */
export function getDefaultTasksForSemester(
  semesterNum: number,
  _programName = "Program Studi",
  isCurrent = false
): DefaultTaskItem[] {
  const defaultStatus = isCurrent ? "in_progress" : "planned";

  switch (semesterNum) {
    case 1:
      return [
        { title: "Mata Kuliah Wajib / Inti I", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Kurikulum Pokok" },
        { title: "Mata Kuliah Wajib / Inti II", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Kurikulum Pokok" },
        { title: "Mata Kuliah Prasyarat & Fondasi I", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Syarat Matkul Lanjutan" },
        { title: "Mata Kuliah Prasyarat & Fondasi II", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Syarat Matkul Lanjutan" },
        { title: "Praktikum & Tugas Terapan", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Keterampilan Terapan" },
        { title: "Mata Kuliah Umum & Karakter", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Wajib Institusi" },
        { title: "Orientasi Akademik & Perencanaan Studi", category: "akademik", credits: 0, status: isCurrent ? "done" : defaultStatus, certaintyLevel: "pasti", notes: "Milestone Akademik" },
      ]; // Total: 18 SKS

    case 2:
      return [
        { title: "Mata Kuliah Wajib / Inti I", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Kurikulum Pokok" },
        { title: "Mata Kuliah Wajib / Inti II", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Kurikulum Pokok" },
        { title: "Mata Kuliah Wajib / Inti III", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Kurikulum Pokok" },
        { title: "Mata Kuliah Prasyarat & Fondasi", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Syarat Matkul Lanjutan" },
        { title: "Praktikum & Tugas Terapan", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Keterampilan Terapan" },
        { title: "Mata Kuliah Umum & Literasi Digital", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Wajib Institusi" },
        { title: "Evaluasi KHS & Konsultasi Akademik", category: "akademik", credits: 0, status: defaultStatus, certaintyLevel: "pasti", notes: "Milestone Akademik" },
      ]; // Total: 18 SKS

    case 3:
      return [
        { title: "Mata Kuliah Wajib / Inti I", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Kurikulum Pokok" },
        { title: "Mata Kuliah Wajib / Inti II", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Kurikulum Pokok" },
        { title: "Mata Kuliah Wajib / Inti III", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Kurikulum Pokok" },
        { title: "Mata Kuliah Prasyarat Lanjutan", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Syarat Matkul Lanjutan" },
        { title: "Praktikum & Tugas Terapan", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Keterampilan Terapan" },
        { title: "Mata Kuliah Pilihan I", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Peminatan & Elektif Bebas" },
        { title: "Konsultasi Rencana Studi Dosen Wali", category: "akademik", credits: 0, status: defaultStatus, certaintyLevel: "pasti", notes: "Milestone Akademik" },
      ]; // Total: 18 SKS

    case 4:
      return [
        { title: "Mata Kuliah Wajib / Inti I", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Kurikulum Pokok" },
        { title: "Mata Kuliah Wajib / Inti II", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Kurikulum Pokok" },
        { title: "Mata Kuliah Wajib / Inti III", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Kurikulum Pokok" },
        { title: "Mata Kuliah Prasyarat Lanjutan", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Syarat Matkul Lanjutan" },
        { title: "Praktikum & Tugas Terapan", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Keterampilan Terapan" },
        { title: "Mata Kuliah Pilihan II", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Peminatan & Elektif Bebas" },
        { title: "Evaluasi Capaian Tengah Studi & Penentuan Minat", category: "akademik", credits: 0, status: isCurrent ? "done" : defaultStatus, certaintyLevel: "pasti", notes: "Milestone Akademik" },
      ]; // Total: 18 SKS

    case 5:
      return [
        { title: "Mata Kuliah Wajib / Inti Lanjutan I", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Kurikulum Pokok" },
        { title: "Mata Kuliah Wajib / Inti Lanjutan II", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Kurikulum Pokok" },
        { title: "Mata Kuliah Pilihan Peminatan I", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Peminatan & Elektif Bebas" },
        { title: "Mata Kuliah Pilihan Peminatan II", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Peminatan & Elektif Bebas" },
        { title: "Praktikum & Analisis Terapan", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Keterampilan Lanjutan" },
        { title: "Pra-Tugas Akhir & Metodologi Penelitian", category: "skripsi", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Persiapan Skripsi" },
        { title: "Persiapan Portofolio & Eksplorasi Topik Skripsi", category: "skripsi", credits: 0, status: defaultStatus, certaintyLevel: "estimasi", notes: "Milestone Akademik" },
      ]; // Total: 18 SKS

    case 6:
      return [
        { title: "Mata Kuliah Wajib / Inti Lanjutan", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Kurikulum Pokok" },
        { title: "Mata Kuliah Pilihan Peminatan I", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Peminatan & Elektif Bebas" },
        { title: "Mata Kuliah Pilihan Peminatan II", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Peminatan & Elektif Bebas" },
        { title: "Praktik Kerja Lapangan / Magang Industri", category: "karier", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Pengalaman Lapangan" },
        { title: "Pra-Tugas Akhir & Penyusunan Proposal", category: "skripsi", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Persiapan Skripsi" },
        { title: "Pengayaan Keahlian Spesifik", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Peminatan Spesifik" },
        { title: "Konsultasi Penetapan Dosen Pembimbing Skripsi", category: "skripsi", credits: 0, status: defaultStatus, certaintyLevel: "estimasi", notes: "Milestone Akademik" },
      ]; // Total: 18 SKS

    case 7:
      return [
        { title: "Proyek Capstone Terpadu", category: "akademik", credits: 4, status: defaultStatus, certaintyLevel: "pasti", notes: "Kurikulum Pokok" },
        { title: "Mata Kuliah Pilihan Peminatan Lanjut", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Peminatan Lanjut" },
        { title: "Seminar Proposal Tugas Akhir", category: "skripsi", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Ujian Seminar Proposal" },
        { title: "Etika Profesi & Keahlian Terapan", category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Wajib Institusi" },
        { title: "Magang Lanjut / Pengayaan MBKM", category: "karier", credits: 3, status: defaultStatus, certaintyLevel: "pasti", notes: "Pengalaman Profesional" },
        { title: "Bimbingan Intensif Draf Proposal Skripsi", category: "skripsi", credits: 0, status: defaultStatus, certaintyLevel: "estimasi", notes: "Milestone Akademik" },
      ]; // Total: 16 SKS

    case 8:
      return [
        { title: "Tugas Akhir / Skripsi", category: "skripsi", credits: 6, status: defaultStatus, certaintyLevel: "pasti", notes: "Sidang Kelulusan" },
        { title: "Kolokium & Publikasi Ilmiah", category: "skripsi", credits: 2, status: defaultStatus, certaintyLevel: "pasti", notes: "Publikasi Naskah" },
        { title: "Sidang Tugas Akhir & Yudisium Kelulusan", category: "skripsi", credits: 0, status: defaultStatus, certaintyLevel: "estimasi", notes: "Milestone Kelulusan" },
      ]; // Total: 8 SKS

    default:
      return [
        { title: `Mata Kuliah Wajib / Inti Semester ${semesterNum}`, category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "estimasi", notes: "Kurikulum Pokok" },
        { title: `Mata Kuliah Pilihan Semester ${semesterNum}`, category: "akademik", credits: 3, status: defaultStatus, certaintyLevel: "estimasi", notes: "Peminatan" },
        { title: `Evaluasi Kelulusan & Penyelesaian Tugas Akhir`, category: "skripsi", credits: 0, status: defaultStatus, certaintyLevel: "estimasi", notes: "Milestone Akademik" },
      ];
  }
}
