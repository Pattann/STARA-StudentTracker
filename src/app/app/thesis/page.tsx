"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@/features/session/context";
import {
  THESIS_REQUIRED_MESSAGE,
  getThesisDraftIssues,
  hasAnyThesisInput,
  isThesisFieldRequired,
  sanitizeThesisFields,
  validateThesisField,
  validateThesisStage,
} from "@/lib/thesis-validation";
import {
  BookOpen, AlertCircle, Lightbulb, ChevronRight, CheckCircle2,
  Sparkles, MessageSquare, Send, Bot, User, Copy, Check, Target,
  FileCheck, HelpCircle, ArrowRight, RotateCcw, ListChecks,
  Lock, Unlock, Save, ChevronDown, ChevronUp, ExternalLink,
  GraduationCap, Award, FileText, CheckCheck, Clock, CheckCircle
} from "lucide-react";

type ThesisDirection = {
  topicArea: string;
  exampleQuestion: string;
  whyItFits: string;
  possibleMethod: string;
  dataRequired: string;
  feasibility: "tinggi" | "sedang" | "perlu_validasi";
  mainRisks: string[];
  firstSteps: string[];
  questionsForSupervisor: string[];
};

type ExplorationResult = {
  directions: ThesisDirection[];
  isAiGenerated: boolean;
  fallbackReason?: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
};

type TitleReviewResult = {
  originalTitle: string;
  score: number;
  verdict: "sangat_baik" | "cukup_baik" | "perlu_penyempurnaan";
  strengths: string[];
  weaknesses: string[];
  improvedTitles: string[];
  suggestedMethods: string[];
  defenseQuestions: string[];
  isAiGenerated: boolean;
  fallbackReason?: string;
};

type StudentProfile = {
  programName?: string;
  institutionName?: string;
  educationLevel?: string;
  currentSemester?: number;
  gpa?: number;
  interests?: string[];
};

type StageStatus = "belum_dimulai" | "proses_bimbingan" | "revisi_dospem" | "acc_dospem";

type StageFieldConfig = {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "number" | "url";
  placeholder?: string;
  helper?: string;
  required?: boolean;
};

type ThesisStage = {
  id: number;
  stageName: string;
  title: string;
  semesterTag: string;
  shortDesc: string;
  deliverables: string;
  guideTip: string;
  isCompleted: boolean;
  status: StageStatus;
  completedAt?: string | null;
  fields: Record<string, string>;
  fieldConfigs: StageFieldConfig[];
};

const DEFAULT_11_STAGES: ThesisStage[] = [
  {
    id: 1,
    stageName: "Penentuan Topik & Pengajuan Judul",
    title: "1. Penentuan Topik & Pengajuan Judul",
    semesterTag: "Semester 6 / Awal 7",
    shortDesc: "Eksplorasi ide riset, studi kelayakan, verifikasi orisinalitas, dan pengajuan ke program studi hingga diterbitkan SK Dosen Pembimbing resmi.",
    deliverables: "Judul skripsi disetujui prodi, formulir pengajuan judul resmi, penetapan SK Dosen Pembimbing (Dospem 1 & 2).",
    guideTip: "Pilih topik yang memiliki akses data realistis dan linear dengan minat keahlianmu. Manfaatkan tab Eksplorasi Topik AI di atas.",
    isCompleted: false,
    status: "belum_dimulai",
    fields: {},
    fieldConfigs: [
      { key: "approvedTitle", label: "Judul Skripsi yang Diajukan / Di-ACC", type: "text", required: true, placeholder: "Contoh: Penerapan Algoritma Graph Neural Network untuk Deteksi Penipuan Finansial" },
      { key: "supervisor1", label: "Dosen Pembimbing 1 (Utama)", type: "text", required: true, placeholder: "Nama lengkap beserta gelar akademik pembimbing 1" },
      { key: "supervisor2", label: "Dosen Pembimbing 2 (Pendamping)", type: "text", placeholder: "Nama lengkap beserta gelar akademik pembimbing 2 (jika ada)" },
      { key: "notes", label: "Catatan & Syarat Calon Dosen Pembimbing", type: "textarea", placeholder: "Catatan perbaikan redaksi judul, arahan fokus, atau syarat awal dospem..." },
    ],
  },
  {
    id: 2,
    stageName: "Rumusan Masalah & Research Gap",
    title: "2. Rumusan Masalah & Research Gap",
    semesterTag: "Semester 7 Awal",
    shortDesc: "Menemukan celah penelitian (research gap) dari riset-riset terdahulu dan merumuskan pertanyaan penelitian (problem statements) yang tajam.",
    deliverables: "Tabel telaah research gap, rumusan masalah berbentuk pertanyaan riset, batasan masalah, dan tujuan penelitian yang terukur.",
    guideTip: "Pastikan masalah yang diangkat adalah problem nyata (empiris atau teoritis), bukan sekadar membuat aplikasi tanpa urgensi penelitian ilmiah.",
    isCompleted: false,
    status: "belum_dimulai",
    fields: {},
    fieldConfigs: [
      { key: "researchGap", label: "Celah Riset (Research Gap) yang Diisi", type: "textarea", required: true, placeholder: "Keterbatasan/kelemahan riset sebelumnya yang akan diselesaikan pada penelitian ini..." },
      { key: "problemStatements", label: "Rumusan Masalah Utama (Pertanyaan Penelitian)", type: "textarea", required: true, placeholder: "1. Bagaimana rancangan arsitektur... \n2. Seberapa besar peningkatan performa..." },
      { key: "researchScope", label: "Batasan Masalah & Asumsi Riset", type: "text", placeholder: "Contoh: Dataset terbatas pada transaksi perbankan ritel Indonesia tahun 2024" },
      { key: "notes", label: "Catatan Dospem Terkait Rumusan Masalah", type: "textarea", placeholder: "Masukan dosen pembimbing terhadap ketajaman dan kelayakan masalah..." },
    ],
  },
  {
    id: 3,
    stageName: "Studi Literatur & State-of-the-Art",
    title: "3. Studi Literatur & State-of-the-Art",
    semesterTag: "Semester 7 Awal",
    shortDesc: "Mengumpulkan dan membedah jurnal acuan terkini (5 tahun terakhir bereputasi Sinta/Scopus/IEEE) serta menyusun matriks literatur.",
    deliverables: "Daftar 5-10 paper acuan utama, ringkasan state-of-the-art, matriks komparasi metode terdahulu, dan akun reference manager (Mendeley/Zotero).",
    guideTip: "Gunakan reference manager sejak hari pertama. Buat tabel perbandingan: Nama Peneliti, Metode, Dataset, Hasil, dan Kelemahan.",
    isCompleted: false,
    status: "belum_dimulai",
    fields: {},
    fieldConfigs: [
      { key: "primaryReferences", label: "Daftar 3-5 Paper Referensi Utama (Jurnal/Konferensi)", type: "textarea", required: true, placeholder: "1. Pratama et al. (2024) - GNN Fraud Detection (IEEE Access)\n2. ..." },
      { key: "theoreticalFramework", label: "Teori / Model Konseptual Utama yang Digunakan", type: "text", required: true, placeholder: "Contoh: Graph Convolutional Network, Teori Kriminologi Finansial" },
      { key: "notes", label: "Catatan Pembimbing Terkait Kelengkapan Pustaka", type: "textarea", placeholder: "Arahan dospem mengenai jurnal kunci yang wajib disitasi..." },
    ],
  },
  {
    id: 4,
    stageName: "Penyusunan BAB 1 (Pendahuluan)",
    title: "4. Penyusunan BAB 1 (Pendahuluan)",
    semesterTag: "Semester 7 Pertengahan",
    shortDesc: "Menulis Latar Belakang Masalah dengan struktur piramida terbalik, Rumusan Masalah, Tujuan Penelitian, Manfaat, dan Sistematika.",
    deliverables: "Draf lengkap BAB 1 yang disetujui dospem, didukung data/statistik empiris pada paragraf pembuka.",
    guideTip: "Paragraf 1-2: Fenomena umum & data statistik. Paragraf 3-4: Celah metode sebelumnya. Paragraf 5: Solusi yang kamu tawarkan.",
    isCompleted: false,
    status: "belum_dimulai",
    fields: {},
    fieldConfigs: [
      { key: "documentLink", label: "Tautan Naskah Dokumen BAB 1 (Google Drive / Docs)", type: "url", required: true, placeholder: "https://docs.google.com/document/d/..." },
      { key: "bgSummary", label: "Intisari Latar Belakang (Mengapa Riset Ini Sangat Mendesak)", type: "textarea", required: true, placeholder: "Ringkasan urgensi masalah dan alasan pemilihan solusi metode..." },
      { key: "supervisorNotes", label: "Catatan & Masukan Revisi Dospem BAB 1", type: "textarea", placeholder: "Catatan perbaikan paragraf latar belakang, tujuan riset, atau sistematika..." },
    ],
  },
  {
    id: 5,
    stageName: "Penyusunan BAB 2 (Tinjauan Pustaka)",
    title: "5. Penyusunan BAB 2 (Tinjauan Pustaka & Landasan Teori)",
    semesterTag: "Semester 7 Pertengahan",
    shortDesc: "Menulis telaah teori komprehensif, penelitian terdahulu, kerangka berpikir penelitian, dan hipotesis/model konseptual.",
    deliverables: "Draf BAB 2 lengkap dengan format sitasi baku (IEEE/APA) dan bagan alur kerangka berpikir.",
    guideTip: "Hindari menyalin buku definisi mentah-mentah. Hubungkan setiap teori dengan masalah spesifik yang kamu teliti.",
    isCompleted: false,
    status: "belum_dimulai",
    fields: {},
    fieldConfigs: [
      { key: "documentLink", label: "Tautan Naskah Dokumen BAB 2 (Google Drive / Docs)", type: "url", required: true, placeholder: "https://docs.google.com/document/d/..." },
      { key: "keyTheories", label: "Teori Kunci & Bagan Kerangka Pemikiran", type: "textarea", required: true, placeholder: "Ringkasan teori pendukung dan alur logika kerangka berpikir penelitian..." },
      { key: "supervisorNotes", label: "Catatan & Masukan Revisi Dospem BAB 2", type: "textarea", placeholder: "Revisi dospem terkait relevansi teori dan kelengkapan tinjauan pustaka..." },
    ],
  },
  {
    id: 6,
    stageName: "Penyusunan BAB 3 (Metodologi Penelitian)",
    title: "6. Penyusunan BAB 3 (Metodologi Penelitian & Desain)",
    semesterTag: "Semester 7 Menjelang Sempro",
    shortDesc: "Merancang metodologi ilmiah, flowchart alur penelitian, arsitektur sistem/algoritma, teknik pengumpulan & praproses data, serta metrik evaluasi.",
    deliverables: "Draf BAB 3 lengkap, diagram alur penelitian, rancangan dataset, dan rumus metrik pengujian performa.",
    guideTip: "BAB 3 harus ditulis sangat detail dan terstruktur agar peneliti lain dapat mereplikasi penelitianmu dengan hasil yang konsisten.",
    isCompleted: false,
    status: "belum_dimulai",
    fields: {},
    fieldConfigs: [
      { key: "documentLink", label: "Tautan Naskah Dokumen BAB 3 (Google Drive / Docs)", type: "url", required: true, placeholder: "https://docs.google.com/document/d/..." },
      { key: "methodDetails", label: "Metode, Arsitektur & Metrik Pengujian yang Digunakan", type: "textarea", required: true, placeholder: "Metode: GCN + Attention. Metrik: Accuracy, Precision, Recall, F1-Score, AUC-ROC..." },
      { key: "supervisorNotes", label: "Catatan & Masukan Revisi Dospem BAB 3", type: "textarea", placeholder: "Validasi dosen pembimbing atas rancangan instrumen/metode penelitian..." },
    ],
  },
  {
    id: 7,
    stageName: "Seminar Proposal (Sempro) & Revisi",
    title: "7. Seminar Proposal (Sempro) & Revisi Penguji",
    semesterTag: "Semester 7 Akhir",
    shortDesc: "Mempresentasikan kelayakan proposal riset (BAB 1–3) di hadapan dewan penguji dan menuntaskan revisi penguji hingga di-ACC.",
    deliverables: "Berita Acara Sempro, slide presentasi (10-15 slide), lembar perbaikan revisi bertanda tangan dewan penguji, dan izin lanjut penelitian.",
    guideTip: "Fokus presentasi sempro ada pada urgensi masalah dan ketepatan metode. Dengarkan kritik penguji dengan tenang dan catat semuanya.",
    isCompleted: false,
    status: "belum_dimulai",
    fields: {},
    fieldConfigs: [
      { key: "semproDate", label: "Tanggal Pelaksanaan Sempro", type: "date", required: true },
      { key: "examiners", label: "Nama Dewan Penguji Sempro", type: "text", required: true, placeholder: "Contoh: Dr. Budi, M.T. & Dr. Siti, M.Kom" },
      { key: "revisionNotes", label: "Rangkuman Catatan & Revisi Dewan Penguji Sempro", type: "textarea", placeholder: "Poin revisi penguji: tambahkan baseline komparasi, perjelas teknik sampling..." },
      { key: "semproDocLink", label: "Tautan Berita Acara / Lembar Pengesahan Sempro", type: "url", placeholder: "https://drive.google.com/file/d/..." },
    ],
  },
  {
    id: 8,
    stageName: "Pengumpulan Data, Eksperimen & Implementasi",
    title: "8. Pengumpulan Data, Eksperimen & Implementasi Sistem",
    semesterTag: "Semester 7 Liburan / Semester 8 Awal",
    shortDesc: "Eksekusi teknis penelitian: pengumpulan dataset, praproses data, implementasi koding sistem/model, dan pengujian eksperimental berulang.",
    deliverables: "Dataset riset bersih, repositori kode (GitHub/GitLab), logbook bimbingan rutin (minimal 8-10 pertemuan resmi), dan log eksperimen.",
    guideTip: "Bimbinganlah minimal 2 minggu sekali. Tunjukkan log hasil eksperimen atau demo software secara berkala kepada pembimbing.",
    isCompleted: false,
    status: "belum_dimulai",
    fields: {},
    fieldConfigs: [
      { key: "repoLink", label: "Tautan Repositori Kode / Dataset (GitHub / GitLab / Drive)", type: "url", required: true, placeholder: "https://github.com/username/thesis-research" },
      { key: "progressNotes", label: "Ringkasan Hasil Eksperimen Sementara & Kendala Teknis", type: "textarea", required: true, placeholder: "Progres koding: model telah di-training 50 epoch, akurasi mencapai 91.4%..." },
      { key: "supervisorNotes", label: "Catatan Bimbingan Rutin & Arahan Pembimbing", type: "textarea", placeholder: "Arahan pembimbing: coba lakukan tuning hyperparameter learning rate..." },
    ],
  },
  {
    id: 9,
    stageName: "Penyusunan BAB 4 (Hasil & Pembahasan)",
    title: "9. Penyusunan BAB 4 (Hasil Penelitian & Pembahasan)",
    semesterTag: "Semester 8 Pertengahan",
    shortDesc: "Menyajikan hasil analisis pengujian, grafik performa, komparasi dengan baseline, dan pembahasan mendalam menjawab rumusan masalah.",
    deliverables: "Draf BAB 4 lengkap dengan grafik, tabel komparasi performa, analisis sebab-akibat, dan implikasi teoritis/praktis.",
    guideTip: "BAB 4 adalah inti skripsi. Jangan cuma menyajikan angka grafik; jelaskan MENGAPA angka itu tercapai dan apa artinya bagi pemecahan masalah.",
    isCompleted: false,
    status: "belum_dimulai",
    fields: {},
    fieldConfigs: [
      { key: "documentLink", label: "Tautan Naskah Dokumen BAB 4 (Google Drive / Docs)", type: "url", required: true, placeholder: "https://docs.google.com/document/d/..." },
      { key: "keyFindings", label: "Temuan Kunci yang Menjawab Rumusan Masalah BAB 1", type: "textarea", required: true, placeholder: "Model GNN berhasil meningkatkan F1-Score sebesar 7.2% dibanding baseline Random Forest..." },
      { key: "supervisorNotes", label: "Catatan & Masukan Revisi Dospem BAB 4", type: "textarea", placeholder: "Revisi dospem: perdalam analisis perbandingan pada tabel 4.2..." },
    ],
  },
  {
    id: 10,
    stageName: "Penyusunan BAB 5 & Uji Turnitin",
    title: "10. Penyusunan BAB 5 (Kesimpulan & Saran) & Uji Turnitin",
    semesterTag: "Semester 8 Menjelang Sidang",
    shortDesc: "Menulis kesimpulan konkret, rekomendasi riset masa depan, draf artikel jurnal ilmiah, dan pengecekan bebas plagiarisme Turnitin.",
    deliverables: "Naskah lengkap BAB 1–5 ACC Sidang, sertifikat lolos Turnitin (maks similarity 20-25%), dan draf artikel publikasi ilmiah.",
    guideTip: "Kesimpulan harus menjawab butir rumusan masalah satu per satu secara presisi. Lakukan parafrase mandiri untuk menurunkan similarity.",
    isCompleted: false,
    status: "belum_dimulai",
    fields: {},
    fieldConfigs: [
      { key: "turnitinScore", label: "Skor Plagiarisme Turnitin (%)", type: "text", required: true, placeholder: "Contoh: 14% (Maksimal batas kampus: <= 20%)" },
      { key: "documentLink", label: "Tautan Naskah Lengkap BAB 1–5 (ACC Dospem Maju Sidang)", type: "url", required: true, placeholder: "https://docs.google.com/document/d/..." },
      { key: "articleDraftLink", label: "Tautan Draf Artikel Jurnal / Publikasi Ilmiah", type: "url", placeholder: "https://docs.google.com/document/d/..." },
      { key: "supervisorNotes", label: "Pernyataan ACC Pembimbing untuk Mendaftar Sidang Sarjana", type: "textarea", placeholder: "Pernyataan resmi dospem bahwa naskah telah memenuhi syarat kelayakan ujian sidang..." },
    ],
  },
  {
    id: 11,
    stageName: "Sidang Sarjana (Tugas Akhir) & Yudisium",
    title: "11. Sidang Sarjana (Sidang Meja Hijau) & Yudisium",
    semesterTag: "Semester 8 Akhir",
    shortDesc: "Ujian komprehensif penutup studi di hadapan dewan penguji skripsi, demo aplikasi, penuntasan revisi final, jilid akhir hardcover, dan yudisium kelulusan.",
    deliverables: "Lembar pengesahan dewan penguji, naskah jilid final hardcover, upload repositori perpustakaan, bebas pustaka, dan surat keterangan lulus (SKL).",
    guideTip: "Kuasai materi presentasi 15 menit dan demonstrasi sistem. Berpakaian rapi, hadir 1 jam sebelum jadwal, dan tetap percaya diri.",
    isCompleted: false,
    status: "belum_dimulai",
    fields: {},
    fieldConfigs: [
      { key: "defenseDate", label: "Tanggal Pelaksanaan Sidang Sarjana", type: "date", required: true },
      { key: "defenseExaminers", label: "Dewan Penguji Sidang Sarjana", type: "text", required: true, placeholder: "Ketua Penguji: Dr. ..., Anggota Penguji: Dr. ..." },
      { key: "defenseScore", label: "Nilai Akhir / Predikat Kelulusan", type: "text", required: true, placeholder: "Contoh: Nilai A (89.0) / Lulus dengan Pujian (Cumlaude)" },
      { key: "finalRepoLink", label: "Tautan Naskah Final / Repositori Perpustakaan Kampus", type: "url", placeholder: "https://openlibrary.kampus.ac.id/..." },
      { key: "notes", label: "Catatan Kelulusan & Rencana Pasca-Lulus", type: "textarea", placeholder: "Revisi penguji yang telah di-ACC, rencana karier atau studi lanjut..." },
    ],
  },
];


function getStageLabels(stage: ThesisStage): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const cfg of stage.fieldConfigs) labels[cfg.key] = cfg.label;
  return labels;
}

/** Semua isian yang harus diperbaiki sebelum tahap boleh disimpan sebagai selesai. */
function getStageIssues(stage: ThesisStage) {
  return validateThesisStage(stage.id, stage.fields ?? {}, getStageLabels(stage));
}

/** Isian yang sudah diketik namun belum valid (kolom wajib kosong tidak dihitung). */
function getStageDraftIssues(stage: ThesisStage) {
  return getThesisDraftIssues(stage.id, stage.fields ?? {}, getStageLabels(stage));
}

function describeIssues(issues: { label: string; message: string }[]): string {
  return issues
    .slice(0, 3)
    .map((issue) => `${issue.label}: ${issue.message}`)
    .join(" | ");
}

function getMissingRequiredFields(stage: ThesisStage): string[] {
  return getStageIssues(stage).map((issue) => `${issue.label} (${issue.message})`);
}

function isStageFormFilled(stage: ThesisStage): boolean {
  return getStageIssues(stage).length === 0;
}

/**
 * Menjaga aturan berurutan: tahap hanya boleh berstatus ACC jika formulirnya valid
 * dan tahap sebelumnya juga ACC. Tahap yang melanggar diturunkan ke "proses_bimbingan".
 */
function normalizeAccChain(list: ThesisStage[]): ThesisStage[] {
  let chainOk = true;
  return list.map((stage) => {
    if (stage.status === "acc_dospem") {
      if (!chainOk || getStageIssues(stage).length > 0) {
        chainOk = false;
        return { ...stage, status: "proses_bimbingan" as StageStatus, isCompleted: false, completedAt: null };
      }
      return stage;
    }
    chainOk = false;
    return stage;
  });
}

function mergeSavedStages(defaults: ThesisStage[], savedStages: any[]): ThesisStage[] {
  if (!Array.isArray(savedStages) || savedStages.length === 0) return defaults;
  const merged = defaults.map((def) => {
    const found = savedStages.find((s) => s.id === def.id);
    if (!found) return def;
    return {
      ...def,
      status: (found.status as StageStatus) || def.status,
      isCompleted: Boolean(found.isCompleted ?? (found.status === "acc_dospem")),
      completedAt: found.completedAt || def.completedAt,
      fields: {
        ...def.fields,
        ...(found.fields || {}),
      },
    };
  });
  return normalizeAccChain(merged);
}

export default function ThesisPage() {
  const { token } = useSession();

  // Tab State
  const [activeTab, setActiveTab] = useState<"explore" | "chat" | "review" | "timeline">("timeline");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam && ["explore", "chat", "review", "timeline"].includes(tabParam)) {
        setActiveTab(tabParam as "explore" | "chat" | "review" | "timeline");
      }
    }
  }, []);

  const changeTab = (tab: "explore" | "chat" | "review" | "timeline") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState(null, "", url.toString());
    }
  };

  // Profile State
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  // Tab 1: Exploration Form State
  const [form, setForm] = useState({
    programName: "Teknik Informatika",
    interests: "",
    methods: "",
    dataAvailability: "Dataset publik atau open-source",
    timeAvailable: "1 semester",
    skills: "",
    constraints: "",
  });
  const [exploreLoading, setExploreLoading] = useState(false);
  const [exploreResult, setExploreResult] = useState<ExplorationResult | null>(null);
  const [exploreError, setExploreError] = useState<string | null>(null);
  const [copiedTitle, setCopiedTitle] = useState<string | null>(null);

  // Tab 2: Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [topicContext, setTopicContext] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Tab 3: Title Review State
  const [reviewInput, setReviewInput] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState<TitleReviewResult | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Tab 4: 11 Stages State
  const [stages, setStages] = useState<ThesisStage[]>(DEFAULT_11_STAGES);
  const [expandedStageId, setExpandedStageId] = useState<number | null>(1);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [dependencyAlert, setDependencyAlert] = useState<string | null>(null);
  const [formErrorStageId, setFormErrorStageId] = useState<number | null>(null);

  // Fetch academic profile for auto-prefill
  useEffect(() => {
    if (!token) return;
    fetch("/api/thesis", { headers: { "x-demo-token": token } })
      .then((res) => res.json())
      .then((data: { profile: StudentProfile | null }) => {
        if (data.profile) {
          setProfile(data.profile);
          const pName = data.profile?.programName || "Teknik Informatika";
          const isIndustri = /industri|manajemen|logistik/i.test(pName);
          const defaultInterests = isIndustri
            ? "Optimasi Rantai Pasok, Pengendalian Kualitas, Ergonomi & Sistem Kerja"
            : "Machine Learning, Pengembangan Web, Analisis Data";
          setForm((prev) => ({
            ...prev,
            programName: pName,
            interests:
              data.profile?.interests && data.profile.interests.length > 0
                ? data.profile.interests.join(", ")
                : prev.interests || defaultInterests,
          }));
        }
      })
      .catch(() => {});
  }, [token]);

  // Load saved 11 stages progress from localStorage and server
  useEffect(() => {
    try {
      const local = localStorage.getItem("stara_thesis_11_stages");
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed.stages)) {
          setStages((prev) => mergeSavedStages(prev, parsed.stages));
          if (parsed.activeStageNumber) {
            setExpandedStageId(parsed.activeStageNumber);
          }
        }
      }
    } catch {
      // ignore local storage parse errors
    }

    if (!token) return;
    fetch("/api/thesis/progress", { headers: { "x-demo-token": token } })
      .then((res) => res.json())
      .then((data) => {
        if (data?.progress?.stages && Array.isArray(data.progress.stages)) {
          setStages((prev) => mergeSavedStages(prev, data.progress.stages));
          if (data.progress.activeStageNumber) {
            setExpandedStageId(data.progress.activeStageNumber);
          }
        }
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (activeTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  // Sequential Stage Unlock Logic
  const isStageUnlocked = (index: number, stagesList: ThesisStage[]): boolean => {
    if (index === 0) return true;
    return stagesList[index - 1].status === "acc_dospem";
  };

  // Helper to save stages progress with strict validation
  const saveStagesProgress = async (updatedStages?: ThesisStage[]) => {
    const dataToSave = updatedStages || stages;

    // 1. Validasi isian yang sedang diketik pada setiap tahap (tolak ketikan asal / gibberish)
    for (const s of dataToSave) {
      const draftIssues = getStageDraftIssues(s);
      if (draftIssues.length > 0) {
        setDependencyAlert(`⚠️ Tahap ${s.id} (${s.stageName}) belum valid: ${describeIssues(draftIssues)}. Perbaiki isian sebelum menyimpan.`);
        setExpandedStageId(s.id);
        setFormErrorStageId(s.id);
        setTimeout(() => setDependencyAlert(null), 8000);
        return false;
      }
    }

    // 2. Validasi tahap yang berstatus ACC: semua kolom wajib harus terisi dan valid
    for (const s of dataToSave) {
      if (s.status === "acc_dospem") {
        const stageIssues = getStageIssues(s);
        if (stageIssues.length > 0) {
          setDependencyAlert(`⚠️ Tahap ${s.id} (${s.stageName}) tidak memenuhi syarat ACC: ${describeIssues(stageIssues)}. Lengkapi kolom wajib dengan benar.`);
          setExpandedStageId(s.id);
          setFormErrorStageId(s.id);
          setTimeout(() => setDependencyAlert(null), 8000);
          return false;
        }
      }
    }

    setIsSavingProgress(true);
    setSaveSuccessMsg(null);

    const completedStages = dataToSave.filter((s) => s.status === "acc_dospem");
    const activeStage = dataToSave.find((s) => s.status !== "acc_dospem") || dataToSave[dataToSave.length - 1];

    const rawTitle = dataToSave[0]?.fields?.approvedTitle || "";
    const isTitleValid = rawTitle.trim().length >= 20 && validateThesisField("approvedTitle", rawTitle) === null;
    const approvedTitleVal = isTitleValid ? rawTitle.trim() : "";

    const rawSup1 = dataToSave[0]?.fields?.supervisor1 || "";
    const sup1 = validateThesisField("supervisor1", rawSup1) === null ? rawSup1.trim() : "";

    const rawSup2 = dataToSave[0]?.fields?.supervisor2 || "";
    const sup2 = validateThesisField("supervisor2", rawSup2) === null ? rawSup2.trim() : "";

    // 1. LocalStorage
    try {
      localStorage.setItem("stara_thesis_11_stages", JSON.stringify({
        stages: dataToSave,
        approvedTitle: approvedTitleVal,
        supervisor1: sup1,
        supervisor2: sup2,
        completedCount: completedStages.length,
        activeStageNumber: activeStage.id,
        savedAt: new Date().toISOString(),
      }));
    } catch {
      // ignore storage quota errors
    }

    // 2. Server API
    if (token) {
      try {
        const res = await fetch("/api/thesis/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-demo-token": token },
          body: JSON.stringify({
            stages: dataToSave.map((s) => ({
              id: s.id,
              title: s.title,
              isCompleted: s.isCompleted,
              status: s.status,
              completedAt: s.completedAt,
              fields: s.fields,
            })),
            approvedTitle: approvedTitleVal,
            supervisor1: sup1,
            supervisor2: sup2,
            completedCount: completedStages.length,
            activeStageNumber: activeStage.id,
          }),
        });

        if (res.ok) {
          setLastSavedTime(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
          setSaveSuccessMsg("Progres 11 Tahapan tersimpan & disinkronkan ke STARA AI.");
          setTimeout(() => setSaveSuccessMsg(null), 3500);
        } else {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error || "Gagal menyinkronkan progres ke server.";
          setDependencyAlert(`⚠️ ${errMsg}`);
          setTimeout(() => setDependencyAlert(null), 7000);
        }
      } catch {
        // network failure handled silently
      }
    }
    setIsSavingProgress(false);
    return true;
  };

  // Change status of a stage with strict form validation
  const handleStageStatusChange = (stageId: number, newStatus: StageStatus) => {
    const stageIndex = stages.findIndex((s) => s.id === stageId);
    if (stageIndex === -1) return;

    if (!isStageUnlocked(stageIndex, stages)) {
      setDependencyAlert(`⚠️ Tahap ${stageId} masih terkunci! Selesaikan dan dapatkan ACC Dospem pada Tahap ${stageId - 1} (${stages[stageIndex - 1].stageName}) terlebih dahulu.`);
      setTimeout(() => setDependencyAlert(null), 6000);
      return;
    }

    const stage = stages[stageIndex];
    const isAcc = newStatus === "acc_dospem";

    // Trigger validation: If trying to mark ACC / Selesai but form has issues
    if (isAcc) {
      const issues = getStageIssues(stage);
      if (issues.length > 0) {
        setDependencyAlert(`⚠️ Tidak dapat menandai ACC Dospem! Formulir Tahap ${stage.id} belum memenuhi syarat: ${describeIssues(issues)}. Harap lengkapi isian dengan benar.`);
        setExpandedStageId(stage.id);
        setFormErrorStageId(stage.id);
        setTimeout(() => setDependencyAlert(null), 8000);
        return;
      }
    }

    const updated = [...stages];

    // If reverting from ACC to an unapproved state, adjust subsequent stages
    if (updated[stageIndex].status === "acc_dospem" && !isAcc) {
      let affectedCount = 0;
      for (let i = stageIndex + 1; i < updated.length; i++) {
        if (updated[i].status === "acc_dospem" || updated[i].isCompleted) {
          updated[i] = {
            ...updated[i],
            status: "proses_bimbingan",
            isCompleted: false,
            completedAt: null,
          };
          affectedCount++;
        }
      }
      if (affectedCount > 0) {
        setDependencyAlert(`ℹ️ Status ${affectedCount} tahapan berikutnya disesuaikan menjadi 'Sedang Bimbingan' demi menjaga konsistensi alur berurutan skripsi.`);
        setTimeout(() => setDependencyAlert(null), 6000);
      }
    }

    updated[stageIndex] = {
      ...updated[stageIndex],
      status: newStatus,
      isCompleted: isAcc,
      completedAt: isAcc ? (updated[stageIndex].completedAt || new Date().toISOString()) : null,
    };

    setStages(updated);
    saveStagesProgress(updated);
    setFormErrorStageId(null);

    // Auto expand next stage if this one just became ACC
    if (isAcc && stageIndex + 1 < updated.length) {
      setExpandedStageId(updated[stageIndex + 1].id);
    }
  };

  // Toggle checkbox with strict guard: Cannot check if form has issues!
  const handleToggleStageCheckbox = (stageId: number, checked: boolean) => {
    const stageIndex = stages.findIndex((s) => s.id === stageId);
    if (stageIndex === -1) return;
    const stage = stages[stageIndex];

    if (!isStageUnlocked(stageIndex, stages)) {
      setDependencyAlert(`⚠️ Tahap ${stageId} masih terkunci! Selesaikan dan dapatkan ACC Dospem pada Tahap ${stageId - 1} (${stages[stageIndex - 1].stageName}) terlebih dahulu.`);
      setTimeout(() => setDependencyAlert(null), 6000);
      return;
    }

    if (checked) {
      const issues = getStageIssues(stage);
      if (issues.length > 0) {
        setDependencyAlert(`⚠️ Tidak dapat menceklis selesai Tahap ${stage.id}! ${describeIssues(issues)}. Harap lengkapi formulir dengan data yang valid terlebih dahulu.`);
        setExpandedStageId(stage.id);
        setFormErrorStageId(stage.id);
        setTimeout(() => setDependencyAlert(null), 8000);
        return;
      }
    }
    setFormErrorStageId(null);
    handleStageStatusChange(stageId, checked ? "acc_dospem" : "proses_bimbingan");
  };

  // Save current stage form with trigger: Cannot save if draft has invalid input
  const handleSaveCurrentStage = (stageId: number) => {
    const stage = stages.find((s) => s.id === stageId);
    if (!stage) return;
    const draftIssues = getStageDraftIssues(stage);
    if (draftIssues.length > 0) {
      setDependencyAlert(`⚠️ Isian Tahap ${stage.id} (${stage.stageName}) belum valid: ${describeIssues(draftIssues)}. Perbaiki isian terlebih dahulu.`);
      setFormErrorStageId(stage.id);
      setTimeout(() => setDependencyAlert(null), 8000);
      return;
    }
    setFormErrorStageId(null);
    saveStagesProgress();
  };

  // Complete current stage and advance to next stage with trigger validation
  const handleCompleteAndAdvance = (stage: ThesisStage) => {
    const issues = getStageIssues(stage);
    if (issues.length > 0) {
      setDependencyAlert(`⚠️ Tidak dapat beralih ke tahap berikutnya! Formulir Tahap ${stage.id} (${stage.stageName}) belum memenuhi syarat: ${describeIssues(issues)}. Harap perbaiki dan lengkapi terlebih dahulu.`);
      setExpandedStageId(stage.id);
      setFormErrorStageId(stage.id);
      setTimeout(() => setDependencyAlert(null), 8000);
      return;
    }
    setFormErrorStageId(null);
    handleStageStatusChange(stage.id, "acc_dospem");
  };

  // Accordion toggle guarded for locked stages
  const handleToggleExpandStage = (targetStage: ThesisStage, idx: number) => {
    const unlocked = isStageUnlocked(idx, stages);
    if (!unlocked) {
      const prevStage = stages[idx - 1];
      const prevMissing = getMissingRequiredFields(prevStage);
      if (prevMissing.length > 0) {
        setDependencyAlert(`⚠️ Tahap ${targetStage.id} masih terkunci! Anda harus mengisi formulir dan menyelesaikan Tahap ${targetStage.id - 1} (${prevStage.stageName}) terlebih dahulu.`);
      } else {
        setDependencyAlert(`⚠️ Tahap ${targetStage.id} masih terkunci! Tandai selesai atau dapatkan ACC Dospem pada Tahap ${targetStage.id - 1} terlebih dahulu.`);
      }
      setTimeout(() => setDependencyAlert(null), 6000);
      return;
    }
    setExpandedStageId(expandedStageId === targetStage.id ? null : targetStage.id);
  };

  // Field change
  const handleStageFieldChange = (stageId: number, fieldKey: string, value: string) => {
    setStages((prev) =>
      prev.map((s) => {
        if (s.id !== stageId) return s;
        return {
          ...s,
          fields: {
            ...s.fields,
            [fieldKey]: value,
          },
        };
      })
    );
  };

  // Handle Explore Form Submit
  const handleExploreSubmit = async () => {
    if (!token) return;
    setExploreLoading(true);
    setExploreError(null);
    try {
      const res = await fetch("/api/thesis", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({
          interests: form.interests.split(",").map((s) => s.trim()).filter(Boolean),
          methods: form.methods ? form.methods.split(",").map((s) => s.trim()).filter(Boolean) : [],
          dataAvailability: form.dataAvailability,
          timeAvailable: form.timeAvailable,
          skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
          constraints: form.constraints,
          programName: form.programName,
        }),
      });
      const data = (await res.json()) as ExplorationResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Gagal memproses rekomendasi.");
      setExploreResult(data);
    } catch (e) {
      setExploreError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    }
    setExploreLoading(false);
  };

  // Handle Chat Message Send (Now enriched with 11-stage thesisProgress)
  const handleSendChat = async (overrideMessage?: string) => {
    const msg = (overrideMessage ?? chatInput).trim();
    if (!msg || chatLoading || !token) return;
    if (!overrideMessage) setChatInput("");

    const newHistory: ChatMessage[] = [...chatMessages, { role: "user", content: msg }];
    setChatMessages([...newHistory, { role: "assistant", content: "", isLoading: true }]);
    setChatLoading(true);

    const completedStagesList = stages.filter((s) => s.status === "acc_dospem");
    const activeStage = stages.find((s) => s.status !== "acc_dospem") || stages[stages.length - 1];
    const nextStage = stages.find((s, idx) => idx > stages.indexOf(activeStage));
    const approvedTitleVal = stages[0]?.fields?.approvedTitle || (form.interests ? `Riset terkait ${form.interests}` : undefined);

    const thesisProgressPayload = {
      completedStagesCount: completedStagesList.length,
      totalStages: 11,
      currentActiveStageNumber: activeStage.id,
      currentActiveStageTitle: activeStage.stageName,
      nextStageTitle: nextStage?.stageName,
      approvedTitle: approvedTitleVal,
      completedStageTitles: completedStagesList.map((s) => s.stageName),
      notesOrArtifacts: activeStage.fields,
    };

    try {
      const res = await fetch("/api/thesis/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({
          message: msg,
          chatHistory: newHistory.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          topicContext: topicContext || undefined,
          programName: form.programName,
          thesisProgress: thesisProgressPayload,
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      const reply = data.reply || "Maaf, tidak dapat memproses pertanyaan ini saat ini.";
      setChatMessages([...newHistory, { role: "assistant", content: reply }]);
    } catch {
      setChatMessages([...newHistory, { role: "assistant", content: "Terjadi gangguan jaringan. Silakan coba lagi." }]);
    }
    setChatLoading(false);
  };

  // Consult stage in chat
  const consultStageInChat = (stage: ThesisStage) => {
    const activeTitle = stages[0]?.fields?.approvedTitle || "penelitian saya";
    let promptText = "";
    switch (stage.id) {
      case 1:
        promptText = `Halo STARA AI, saya sedang di ${stage.title}. Judul yang saya ajukan: "${stages[0]?.fields?.approvedTitle || '(belum ditentukan)'}". Bagaimana tips mematangkan ide judul ini dan cara komunikasi yang baik ke calon dosen pembimbing?`;
        break;
      case 2:
        promptText = `Halo STARA AI, saya sedang merumuskan masalah dan mencari research gap untuk judul "${activeTitle}". Tolong pandu saya menyusun batasan masalah dan pertanyaan penelitian yang berbobot ilmiah.`;
        break;
      case 3:
        promptText = `Halo STARA AI, saya sedang menyusun studi literatur & state-of-the-art untuk judul "${activeTitle}". Bagaimana kriteria jurnal bereputasi yang baik (Sinta/Scopus) dan cara menyusun matriks telaah pustaka?`;
        break;
      case 4:
        promptText = `Halo STARA AI, saya sedang menyusun naskah BAB 1 Pendahuluan untuk judul "${activeTitle}". Tolong berikan kerangka paragraf latar belakang dengan struktur piramida terbalik dan checklist kelayakannya.`;
        break;
      case 5:
        promptText = `Halo STARA AI, saya sedang menulis BAB 2 Landasan Teori & Tinjauan Pustaka untuk judul "${activeTitle}". Bagaimana cara mengaitkan teori dengan variabel riset tanpa terkesan sekadar copy-paste definisi?`;
        break;
      case 6:
        promptText = `Halo STARA AI, saya sedang menyusun BAB 3 Metodologi Penelitian untuk judul "${activeTitle}". Tolong jelaskan bagaimana menyusun diagram alur penelitian dan metrik evaluasi yang dapat dipertanggungjawabkan di hadapan penguji.`;
        break;
      case 7:
        promptText = `Halo STARA AI, saya sedang mempersiapkan diri untuk Seminar Proposal (Sempro). Pertanyaan kritis apa saja yang paling sering diajukan dewan penguji sempro dan bagaimana strategi menjawabnya dengan percaya diri?`;
        break;
      case 8:
        promptText = `Halo STARA AI, saya sedang di tahap eksperimen, koding, dan pengumpulan data untuk judul "${activeTitle}". Bagaimana tips mengelola logbook bimbingan dan mendokumentasikan hasil pengujian secara sistematis?`;
        break;
      case 9:
        promptText = `Halo STARA AI, saya sedang menyusun BAB 4 Hasil & Pembahasan untuk judul "${activeTitle}". Bagaimana cara menganalisis temuan data agar benar-benar menjawab rumusan masalah di BAB 1 dan bukan hanya menampilkan grafik?`;
        break;
      case 10:
        promptText = `Halo STARA AI, saya sedang menyelesaikan BAB 5 dan uji Turnitin untuk skripsi "${activeTitle}". Bagaimana tips parafrase ilmiah untuk menurunkan similarity index tanpa merusak substansi akademik?`;
        break;
      case 11:
        promptText = `Halo STARA AI, saya akan menghadapi Sidang Sarjana (Sidang Meja Hijau) untuk skripsi "${activeTitle}". Tolong berikan simulasi tanya-jawab komprehensif dan tips presentasi 15 menit di hadapan dewan penguji.`;
        break;
      default:
        promptText = `Halo STARA AI, saya butuh panduan untuk ${stage.title} pada skripsi saya dengan judul "${activeTitle}".`;
    }

    changeTab("chat");
    handleSendChat(promptText);
  };

  // Handle Title Review
  const handleReviewSubmit = async () => {
    if (!token || !reviewInput.trim()) return;
    setReviewLoading(true);
    setReviewError(null);
    try {
      const res = await fetch("/api/thesis/review", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({
          titleOrDraft: reviewInput.trim(),
          programName: form.programName,
          interests: form.interests,
        }),
      });
      const data = (await res.json()) as TitleReviewResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Gagal mengevaluasi judul.");
      setReviewResult(data);
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    }
    setReviewLoading(false);
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTitle(text);
    setTimeout(() => setCopiedTitle(null), 2500);
  };

  // Adopt a title directly into Stage 1 of the 11-Stage Tracker
  const adoptTitleIntoTracker = (title: string) => {
    const updated = stages.map((s) => {
      if (s.id !== 1) return s;
      return {
        ...s,
        status: s.status === "belum_dimulai" ? ("proses_bimbingan" as StageStatus) : s.status,
        fields: {
          ...s.fields,
          approvedTitle: title,
        },
      };
    });
    setStages(updated);
    setTopicContext(title);
    setExpandedStageId(1);
    saveStagesProgress(updated);
    setSaveSuccessMsg(`✓ Judul "${title.slice(0, 50)}..." berhasil diterapkan ke Tahap 1 Tracker Skripsi!`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Send a title directly to Reviewer Judul & Topik AI
  const sendTitleToReview = (title: string) => {
    setReviewInput(title);
    changeTab("review");
  };

  // Render formatted markdown text in AI chat bubbles
  const renderFormattedThesisText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <div
          key={lineIdx}
          style={{
            marginBottom: line.trim() === "" ? 6 : 3,
            paddingLeft: /^(\d+\.|•|-|\*)\s/.test(line.trim()) ? 6 : 0,
          }}
        >
          {parts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={pIdx} style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </div>
      );
    });
  };

  // Switch to chat with prefilled topic
  const consultTopicInChat = (topic: string) => {
    setTopicContext(topic);
    changeTab("chat");
    handleSendChat(
      `Halo STARA AI, saya tertarik dengan judul/topik penelitian "${topic}". Tolong bantu saya menyusun: 1) Celah riset (research gap), 2) 3 butir rumusan masalah, dan 3) Kerangka awal BAB 1.`
    );
  };

  // Reset 11 stages confirmation
  const handleResetTracker = () => {
    if (confirm("Apakah Anda yakin ingin mengatur ulang tracker 11 tahapan skripsi ke kondisi awal? Seluruh checklist dan catatan akan dikosongkan.")) {
      setStages(DEFAULT_11_STAGES);
      setExpandedStageId(1);
      saveStagesProgress(DEFAULT_11_STAGES);
    }
  };

  const feasibilityColors = { tinggi: "var(--lime)", sedang: "var(--teal)", perlu_validasi: "var(--orange)" };
  const feasibilityLabels = { tinggi: "Kelayakan Tinggi", sedang: "Kelayakan Sedang", perlu_validasi: "Perlu Validasi" };

  const completedStagesCount = stages.filter((s) => s.status === "acc_dospem").length;
  const currentActiveStage = stages.find((s) => s.status !== "acc_dospem") || stages[stages.length - 1];
  const progressPercentage = Math.round((completedStagesCount / 11) * 100);

  const isIndustriProdi = /industri|manajemen|logistik/i.test(form.programName);
  const quickInterestChips = isIndustriProdi
    ? ["Optimasi Rantai Pasok", "Pengendalian Kualitas (Six Sigma)", "Ergonomi & K3", "Sistem Produksi Lean", "Simulasi Sistem Industri", "Riset Operasi & Logistik"]
    : ["Machine Learning", "Pengembangan Web", "Keamanan Siber", "Internet of Things", "UI/UX & HCI", "Data Science & Analitik"];

  return (
    <div>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", margin: 0 }}>
            Panduan Skripsi & Tugas Akhir
          </h1>
          <span className="badge badge-lime" style={{ fontSize: 10.5, display: "flex", alignItems: "center", gap: 4 }}>
            <Sparkles size={11} /> STARA Thesis AI
          </span>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
          Asisten AI terpadu untuk mencari ide judul, menguji kelayakan Sempro, berkonsultasi penulisan BAB 1–5, dan memantau 11 tahapan skripsi.
        </p>
      </div>

      {/* ── Global Notification Toast if Title Adopted ── */}
      {saveSuccessMsg && activeTab !== "timeline" && (
        <div
          style={{
            marginBottom: 14,
            padding: "10px 14px",
            background: "rgba(215,243,106,0.16)",
            border: "1px solid var(--lime)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            color: "var(--text-primary)",
            fontSize: 12.5,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle size={15} color="var(--lime)" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => changeTab("timeline")} style={{ fontSize: 11.5 }}>
            Lihat di Tracker →
          </button>
        </div>
      )}

      {/* ── Profile Context Notice ── */}
      {profile && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(133,136,255,0.06)",
            border: "1px solid rgba(133,136,255,0.25)",
            borderRadius: "var(--radius-md)",
            padding: "8px 14px",
            marginBottom: 16,
            fontSize: 12.5,
            color: "var(--text-secondary)",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Target size={14} color="var(--blue)" />
            <span>
              Profil Akademik Aktif: <strong style={{ color: "var(--text-primary)" }}>{profile.programName}</strong> ({profile.institutionName || "Kampus"}) • Semester {profile.currentSemester ?? 4}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ color: "var(--text-muted)" }}>Posisi Skripsi:</span>
            <span className="badge badge-lime" style={{ fontSize: 10.5 }}>
              Tahap {currentActiveStage.id}/11: {currentActiveStage.stageName}
            </span>
          </div>
        </div>
      )}

      {/* ── 4-Step Interactive AI Hub Cards (Makes Thesis Guide Super Clear) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(215px, 1fr))",
          gap: 10,
          marginBottom: 20,
        }}
      >
        {[
          {
            id: "explore" as const,
            step: "Fitur AI 1",
            title: "Eksplorasi Topik & Judul AI",
            desc: "Belum punya judul? AI merancang 3 ide topik, rumusan masalah, & metode sesuai prodimu.",
            icon: Lightbulb,
            badge: "Cari Ide",
          },
          {
            id: "review" as const,
            step: "Fitur AI 2",
            title: "Reviewer Kelayakan Judul",
            desc: "Uji draf judulmu (Skor 0–100), deteksi celah sidang Sempro, & dapatkan variasi judul ilmiah.",
            icon: FileCheck,
            badge: "Uji Judul",
          },
          {
            id: "chat" as const,
            step: "Fitur AI 3",
            title: "Konsultan Skripsi AI 24/7",
            desc: "Tanya jawab penyusunan BAB 1–5, pencarian jurnal, metodologi, hingga simulasi tanya-jawab sidang.",
            icon: MessageSquare,
            badge: topicContext ? "Topik Aktif" : "Diskusi AI",
          },
          {
            id: "timeline" as const,
            step: "Tracker Progres",
            title: "Tracker 11 Tahapan Skripsi",
            desc: "Simpan judul ACC, catat revisi dospem dari pengajuan judul hingga yudisium kelulusan.",
            icon: ListChecks,
            badge: `${completedStagesCount}/11 Selesai`,
          },
        ].map((item) => {
          const IconComp = item.icon;
          const isSelected = activeTab === item.id;
          return (
            <div
              key={item.id}
              id={`tab-thesis-${item.id}`}
              role="button"
              tabIndex={0}
              onClick={() => changeTab(item.id)}
              onKeyDown={(e) => e.key === "Enter" && changeTab(item.id)}
              style={{
                background: isSelected ? "rgba(215,243,106,0.12)" : "var(--surface-card)",
                border: isSelected ? "2px solid var(--lime)" : "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "12px 14px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 6,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: isSelected ? "var(--lime)" : "var(--text-muted)", textTransform: "uppercase" }}>
                    {item.step}
                  </span>
                  <span className={`badge ${isSelected ? "badge-lime" : "badge-gray"}`} style={{ fontSize: 9.5 }}>
                    {item.badge}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                  <IconComp size={15} color={isSelected ? "var(--lime)" : "var(--text-primary)"} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>
                    {item.title}
                  </span>
                </div>
                <p style={{ fontSize: 11.5, color: "var(--text-secondary)", margin: 0, lineHeight: 1.45 }}>
                  {item.desc}
                </p>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: isSelected ? "var(--lime)" : "var(--teal)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                {isSelected ? "● Sedang Dibuka" : "Buka Fitur Ini →"}
              </div>
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB 1: EKSPLORASI TOPIK AI
      ══════════════════════════════════════════════════════ */}
      {activeTab === "explore" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: exploreResult ? "380px 1fr" : "1fr", gap: 20 }}>
            {/* Form Panel */}
            <div className="card" style={{ maxWidth: exploreResult ? "100%" : 680 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h2 style={{ fontSize: 15.5, fontWeight: 700, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={16} color="var(--lime)" />
                  Generator Ide Topik & Judul Skripsi AI
                </h2>
                {exploreResult && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setExploreResult(null)} style={{ fontSize: 11 }}>
                    Reset Hasil
                  </button>
                )}
              </div>
              <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "0 0 14px 0", lineHeight: 1.5 }}>
                Sesuaikan minat dan ketersediaan datamu di bawah ini, lalu klik tombol <strong>Rancang Rekomendasi Topik dengan AI</strong>.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="th-prodi">Program Studi</label>
                  <input
                    id="th-prodi"
                    className="form-input"
                    value={form.programName}
                    onChange={(e) => setForm({ ...form, programName: e.target.value })}
                    placeholder="Contoh: Teknik Industri / Teknik Informatika"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="th-interests">
                    Bidang Minat Riset * <span style={{ color: "var(--lime)", fontSize: 11 }}>(klik chip di bawah atau ketik bebas)</span>
                  </label>
                  <input
                    id="th-interests"
                    className="form-input"
                    value={form.interests}
                    onChange={(e) => setForm({ ...form, interests: e.target.value })}
                    placeholder="Contoh: Optimasi Rantai Pasok, Machine Learning, Pengendalian Kualitas"
                    required
                  />
                  {/* Quick Interest Chips */}
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
                    {quickInterestChips.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          const current = form.interests ? form.interests.split(",").map((s) => s.trim()).filter(Boolean) : [];
                          if (!current.includes(item)) {
                            setForm({ ...form, interests: [...current, item].join(", ") });
                          }
                        }}
                        style={{
                          fontSize: 10.5,
                          padding: "3px 8px",
                          borderRadius: 12,
                          background: "var(--surface-hover)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-secondary)",
                          cursor: "pointer",
                        }}
                      >
                        + {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="th-methods">Metode Penelitian yang Diminati / Dikuasai (opsional)</label>
                  <input
                    id="th-methods"
                    className="form-input"
                    value={form.methods}
                    onChange={(e) => setForm({ ...form, methods: e.target.value })}
                    placeholder={isIndustriProdi ? "Six Sigma, AHP, Linear Programming, Simulasi Monte Carlo" : "Eksperimen, Klasifikasi ML, Scrum, Studi Kasus"}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="th-data">Ketersediaan Data & Akses Penelitian</label>
                  <select
                    id="th-data"
                    className="form-input"
                    value={form.dataAvailability}
                    onChange={(e) => setForm({ ...form, dataAvailability: e.target.value })}
                  >
                    <option value="Dataset publik atau open-source">Dataset publik / open-source (Kaggle, Satu Data, BPS, UCI)</option>
                    <option value="Data primer melalui survei/wawancara">Data primer (kuesioner, wawancara, observasi lapangan)</option>
                    <option value="Data dari institusi/perusahaan (perlu izin)">Data institusi / perusahaan tempat magang</option>
                    <option value="Belum ada data, perlu dikumpulkan dari nol">Belum ada, perlu pengumpulan data dari awal</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="th-time">Target Waktu Pengerjaan Skripsi</label>
                  <select
                    id="th-time"
                    className="form-input"
                    value={form.timeAvailable}
                    onChange={(e) => setForm({ ...form, timeAvailable: e.target.value })}
                  >
                    <option value="1 semester">1 semester (Akselerasi 4–6 bulan)</option>
                    <option value="2 semester">2 semester (Standar reguler TA 1 & TA 2)</option>
                    <option value="Kurang dari 1 semester">Mendesak (&lt; 4 bulan untuk kejar wisuda)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="th-skills">Skills / Software / Tools yang Dikuasai (opsional)</label>
                  <input
                    id="th-skills"
                    className="form-input"
                    value={form.skills}
                    onChange={(e) => setForm({ ...form, skills: e.target.value })}
                    placeholder={isIndustriProdi ? "Excel Solver, Arena Simulation, SPSS, Python, Minitab" : "Python, PyTorch, React, SQL, Figma, Docker"}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="th-constraints">Batasan atau Kendala Spesifik (opsional)</label>
                  <input
                    id="th-constraints"
                    className="form-input"
                    value={form.constraints}
                    onChange={(e) => setForm({ ...form, constraints: e.target.value })}
                    placeholder="Contoh: Tidak bisa penelitian lapangan jauh, ingin fokus studi kasus perusahaan"
                  />
                </div>

                {exploreError && (
                  <div className="error-state">
                    <AlertCircle size={15} color="var(--coral)" />
                    <span style={{ fontSize: 12.5 }}>{exploreError}</span>
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  onClick={handleExploreSubmit}
                  disabled={exploreLoading || !form.interests.trim()}
                  style={{ gap: 6, justifyContent: "center" }}
                  id="btn-generate-thesis-topics"
                >
                  {exploreLoading ? (
                    <>
                      <RotateCcw size={15} style={{ animation: "spin 1s linear infinite" }} />
                      <span>STARA AI Menyusun 3 Rekomendasi Topik Riset...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Rancang Rekomendasi Topik dengan AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results Panel */}
            {exploreResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                    <Lightbulb size={17} color="var(--lime)" />
                    Rekomendasi Judul & Arah Penelitian ({form.programName})
                  </h2>
                  <span className="badge badge-lime" style={{ fontSize: 11 }}>
                    <Sparkles size={11} /> {exploreResult.directions.length} Rekomendasi AI
                  </span>
                </div>

                {exploreResult.directions.map((d, i) => (
                  <div key={i} className="card" style={{ border: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 240 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FEF3C7", border: "1px solid rgba(215,243,106,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--lime)" }}>{i + 1}</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 15.5, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.35 }}>
                            {d.topicArea}
                          </div>
                          <span className="badge" style={{ background: `${feasibilityColors[d.feasibility]}18`, color: feasibilityColors[d.feasibility], fontSize: 10.5, marginTop: 5 }}>
                            {feasibilityLabels[d.feasibility]}
                          </span>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => adoptTitleIntoTracker(d.topicArea)}
                          title="Simpan judul ini ke Tahap 1 Tracker Skripsi"
                          style={{ fontSize: 11.5, gap: 4 }}
                        >
                          <Check size={12} />
                          <span>Pakai ke Tracker</span>
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => sendTitleToReview(d.topicArea)}
                          title="Uji skor kelayakan judul ini"
                          style={{ fontSize: 11.5, gap: 4 }}
                        >
                          <FileCheck size={12} />
                          <span>Uji Kelayakan</span>
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => consultTopicInChat(d.topicArea)}
                          title="Konsultasikan topik ini ke AI"
                          style={{ fontSize: 11.5, gap: 4 }}
                        >
                          <MessageSquare size={12} />
                          <span>Bahas di Chat AI</span>
                        </button>
                      </div>
                    </div>

                    <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 12 }}>
                      <strong style={{ color: "var(--text-primary)" }}>Alasan Kecocokan:</strong> {d.whyItFits}
                    </p>

                    <div className="info-box" style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--blue)", marginBottom: 4, textTransform: "uppercase" }}>
                        Contoh Rumusan Masalah / Pertanyaan Penelitian:
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-primary)", fontStyle: "italic" }}>
                        &quot;{d.exampleQuestion}&quot;
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                      <div style={{ background: "var(--surface-hover)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                        <div style={{ fontSize: 10.5, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 2 }}>Metode yang Disarankan</div>
                        <div style={{ fontSize: 12.5, color: "var(--text-primary)", fontWeight: 600 }}>{d.possibleMethod}</div>
                      </div>
                      <div style={{ background: "var(--surface-hover)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                        <div style={{ fontSize: 10.5, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 2 }}>Kebutuhan Data</div>
                        <div style={{ fontSize: 12.5, color: "var(--text-primary)", fontWeight: 600 }}>{d.dataRequired}</div>
                      </div>
                    </div>

                    {d.mainRisks.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: "var(--coral)", textTransform: "uppercase", fontWeight: 700, marginBottom: 3 }}>
                          Risiko yang Perlu Diantisipasi:
                        </div>
                        {d.mainRisks.map((r, ri) => (
                          <div key={ri} style={{ fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 2 }}>• {r}</div>
                        ))}
                      </div>
                    )}

                    {d.firstSteps.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: "#92400E", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>
                          Langkah Awal yang Bisa Dilakukan Minggu Ini:
                        </div>
                        {d.firstSteps.map((s, si) => (
                          <div key={si} style={{ fontSize: 12.5, color: "var(--text-secondary)", display: "flex", gap: 6, marginBottom: 3 }}>
                            <CheckCircle2 size={13} color="var(--lime)" style={{ flexShrink: 0, marginTop: 2 }} />
                            <span>{s}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {d.questionsForSupervisor.length > 0 && (
                      <div className="assumption-notice">
                        <BookOpen size={13} style={{ flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 11.5, marginBottom: 3 }}>Pertanyaan untuk Calon Dosen Pembimbing:</div>
                          {d.questionsForSupervisor.map((q, qi) => (
                            <div key={qi} style={{ fontSize: 12, marginBottom: 2 }}>• {q}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 2: TANYA KONSULTAN SKRIPSI AI (Stage-Aware)
      ══════════════════════════════════════════════════════ */}
      {activeTab === "chat" && (
        <div className="card" style={{ maxWidth: 860, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(215,243,106,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bot size={18} color="var(--lime)" />
              </div>
              <div>
                <h2 style={{ fontSize: 15.5, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  STARA Thesis AI Consultant
                </h2>
                <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                  Pendamping Metodologi, Penulisan BAB 1–5, dan Persiapan Sidang ({form.programName})
                </span>
              </div>
            </div>

            {topicContext && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="badge badge-blue" style={{ fontSize: 11 }}>
                  Fokus Topik: {topicContext.length > 35 ? topicContext.slice(0, 35) + "..." : topicContext}
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setTopicContext("")}
                  style={{ fontSize: 11, padding: "2px 6px" }}
                  title="Hapus fokus topik"
                >
                  Hapus
                </button>
              </div>
            )}
          </div>

          {/* Live Thesis Progress Status Card in Chat */}
          <div
            style={{
              background: "rgba(215,243,106,0.06)",
              border: "1px solid rgba(215,243,106,0.3)",
              borderRadius: "var(--radius-md)",
              padding: "12px 16px",
              marginBottom: 14,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--lime)", color: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 }}>
                  {currentActiveStage.id}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                    Tahap Aktif Saat Ini: <span style={{ color: "var(--lime)" }}>Tahap {currentActiveStage.id} — {currentActiveStage.stageName}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
                    {stages[0]?.fields?.approvedTitle ? (
                      <>Judul di Tracker: <strong>&quot;{stages[0].fields.approvedTitle}&quot;</strong></>
                    ) : (
                      <>Belum ada judul di Tahap 1 — kamu bisa mencari judul di tab <strong>Eksplorasi Topik AI</strong></>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => changeTab("explore")}
                  style={{ fontSize: 11, padding: "4px 8px", gap: 4 }}
                >
                  <Lightbulb size={12} />
                  Cari Ide Judul
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => changeTab("timeline")}
                  style={{ fontSize: 11, padding: "4px 8px", gap: 4 }}
                >
                  <ListChecks size={12} />
                  Buka Tracker 11 Tahap
                </button>
              </div>
            </div>
          </div>

          {/* Chat Messages Container */}
          <div
            style={{
              background: "var(--surface-hover)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              padding: 16,
              minHeight: 300,
              maxHeight: 460,
              overflowY: "auto",
              marginBottom: 14,
            }}
          >
            {chatMessages.length === 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginBottom: 14,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "var(--surface-card)",
                    border: "1px solid var(--border-subtle)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Bot size={14} color="var(--lime)" />
                </div>
                <div
                  style={{
                    background: "var(--surface-card)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "4px 12px 12px 12px",
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "var(--text-primary)",
                    lineHeight: 1.6,
                    maxWidth: "85%",
                  }}
                >
                  {renderFormattedThesisText(
                    `Halo! Saya **STARA Thesis AI Consultant** untuk program studi **${form.programName}**.\n\n` +
                      `Saat ini progres skripsimu berada di **Tahap ${currentActiveStage.id}: ${currentActiveStage.stageName}**${
                        stages[0]?.fields?.approvedTitle ? ` dengan judul **"${stages[0].fields.approvedTitle}"**` : ""
                      }.\n\n` +
                      `Kamu bisa langsung memilih salah satu tombol pertanyaan cepat di bawah atau mengetikkan pertanyaan seputar:\n` +
                      `• Ide judul & cara mencari *Research Gap* dari jurnal\n` +
                      `• Panduan penulisan **BAB 1 sampai BAB 5**\n` +
                      `• Pemilihan metode penelitian & metrik evaluasi\n` +
                      `• Simulasi pertanyaan dosen penguji saat **Sidang Sempro / Sidang Akhir**`
                  )}
                </div>
              </div>
            )}

            {chatMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  marginBottom: 14,
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: msg.role === "user" ? "var(--lime)" : "var(--surface-card)",
                    border: "1px solid var(--border-subtle)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {msg.role === "user" ? <User size={14} color="var(--bg-primary)" /> : <Bot size={14} color="var(--lime)" />}
                </div>

                <div
                  style={{
                    background: msg.role === "user" ? "rgba(124, 230, 168, 0.14)" : "var(--surface-card)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: msg.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "var(--text-primary)",
                    lineHeight: 1.6,
                    maxWidth: "84%",
                  }}
                >
                  {msg.isLoading ? (
                    <span style={{ opacity: 0.7, display: "flex", alignItems: "center", gap: 6 }}>
                      <RotateCcw size={12} style={{ animation: "spin 1s linear infinite" }} /> STARA Thesis AI sedang menyusun penjelasan lengkap...
                    </span>
                  ) : (
                    renderFormattedThesisText(msg.content)
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Dynamic Quick Prompts based on active stage */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>
              💡 Pertanyaan Cepat Sesuai Tahap ({currentActiveStage.stageName}):
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(currentActiveStage.id === 1
                ? [
                    `Buatkan 3 ide judul skripsi spesifik untuk prodi ${form.programName}`,
                    "Bagaimana cara menemukan research gap dari 5 jurnal acuan?",
                    "Bagaimana struktur latar belakang BAB 1 piramida terbalik yang baik?",
                    "Pertanyaan apa yang paling sering ditanyakan penguji saat Sempro?",
                  ]
                : currentActiveStage.id === 2
                ? [
                    "Bagaimana cara menemukan research gap yang tajam dari jurnal acuan?",
                    "Bantu buatkan 3 butir rumusan masalah penelitian yang terukur",
                    "Batasan masalah apa saja yang wajar untuk level skripsi S1?",
                  ]
                : currentActiveStage.id === 3
                ? [
                    "Cara mencari paper Q1/Q2 di Scopus & Sinta yang relevan",
                    "Contoh matriks telaah literatur perbandingan 5 jurnal terdahulu",
                    "Bagaimana mengutip jurnal acuan dengan format IEEE/APA?",
                  ]
                : currentActiveStage.id === 4
                ? [
                    "Bagaimana struktur latar belakang BAB 1 piramida terbalik yang meyakinkan penguji?",
                    "Checklist kelayakan draf BAB 1 sebelum dikirim ke dosen pembimbing",
                    "Cara merumuskan manfaat teoritis dan praktis di BAB 1",
                  ]
                : currentActiveStage.id === 5
                ? [
                    "Cara menyusun BAB 2 tanpa sekadar menyalin definisi teori",
                    "Bagaimana membuat bagan alur kerangka berpikir penelitian?",
                    "Berapa jumlah sitasi minimal yang ideal untuk BAB 2?",
                  ]
                : currentActiveStage.id === 6
                ? [
                    "Cara merancang diagram alur metodologi penelitian yang sistematis",
                    "Bagaimana menentukan metrik evaluasi pengujian yang objektif?",
                    "Rancangan dataset dan teknik sampling yang dapat dipertanggungjawabkan",
                  ]
                : currentActiveStage.id === 7
                ? [
                    "Pertanyaan apa saja yang paling sering dicecar penguji saat Sidang Sempro?",
                    "Tips membuat slide presentasi Sempro 10-12 slide dalam 15 menit",
                    "Bagaimana merespons masukan dan kritik tajam dosen penguji Sempro?",
                  ]
                : [
                    "Cara menyusun pembahasan BAB 4 yang benar-benar menjawab rumusan masalah BAB 1",
                    "Tips parafrase ilmiah untuk menurunkan similarity Turnitin di bawah 20%",
                    "Simulasi pertanyaan tersulit dewan penguji Sidang Sarjana",
                  ]
              ).map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendChat(chip)}
                  disabled={chatLoading}
                  style={{
                    fontSize: 11.5,
                    padding: "5px 11px",
                    borderRadius: 16,
                    background: "var(--surface-hover)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, fontSize: 13 }}
              placeholder="Tulis pertanyaan skripsi, judul, metodologi, atau rumusan masalahmu..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendChat()}
              disabled={chatLoading}
              maxLength={1000}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleSendChat()}
              disabled={!chatInput.trim() || chatLoading}
              style={{ flexShrink: 0, gap: 4, padding: "8px 16px" }}
            >
              <Send size={14} />
              <span>{chatLoading ? "..." : "Kirim"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 3: REVIEWER JUDUL & TOPIK AI
      ══════════════════════════════════════════════════════ */}
      {activeTab === "review" && (
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div className="card" style={{ marginBottom: 18 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <FileCheck size={18} color="var(--lime)" />
              Uji Kelayakan Judul & Deteksi Celah Sidang Sempro
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.5 }}>
              Ketikkan draf judul skripsi atau ide topik yang ingin kamu ajukan. STARA AI akan menilai skor kesiapan (0–100), mendeteksi kelemahan yang rawan dicecar penguji Sempro, dan menyusun alternatif judul yang lebih tajam.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                  <label className="form-label" htmlFor="review-title-input" style={{ margin: 0 }}>
                    Draf Judul / Ide Penelitian ({form.programName})
                  </label>
                  {stages[0]?.fields?.approvedTitle && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setReviewInput(stages[0].fields.approvedTitle)}
                      style={{ fontSize: 11, padding: "2px 8px", color: "var(--lime)" }}
                    >
                      Gunakan Judul dari Tracker Tahap 1
                    </button>
                  )}
                </div>
                <textarea
                  id="review-title-input"
                  className="form-input"
                  rows={3}
                  style={{ fontSize: 13.5, resize: "vertical" }}
                  placeholder={
                    isIndustriProdi
                      ? "Contoh: Optimasi Rute Distribusi Logistik Menggunakan Algoritma Genetika untuk Meminimalkan Biaya Transportasi pada PT XYZ"
                      : "Contoh: Penerapan Algoritma Convolutional Neural Network untuk Klasifikasi Penyakit Daun Padi Berdasarkan Citra Digital"
                  }
                  value={reviewInput}
                  onChange={(e) => setReviewInput(e.target.value)}
                />
                {/* Quick Sample Titles */}
                <div style={{ marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginRight: 6 }}>Contoh cepat:</span>
                  {(isIndustriProdi
                    ? [
                        "Analisis Pengendalian Kualitas Produk Menggunakan Metode Six Sigma (DMAIC) dan FMEA untuk Menurunkan Tingkat Kecacatan Produksi",
                        "Optimasi Perencanaan Persediaan Bahan Baku Menggunakan Metode Economic Order Quantity (EOQ) Probabilistik dan Simulasi Monte Carlo",
                      ]
                    : [
                        "Analisis Sentimen Ulasan Pengguna Aplikasi Layanan Publik Menggunakan Metode IndoBERT dan Support Vector Machine",
                        "Perancangan Sistem Deteksi Anomali Transaksi Keuangan Menggunakan Algoritma Isolation Forest dan Random Forest",
                      ]
                  ).map((sample, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => setReviewInput(sample)}
                      style={{
                        fontSize: 11,
                        padding: "3px 9px",
                        borderRadius: 12,
                        background: "var(--surface-hover)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                        marginRight: 6,
                        marginBottom: 4,
                      }}
                    >
                      Contoh {sIdx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {reviewError && (
                <div className="error-state">
                  <AlertCircle size={15} color="var(--coral)" />
                  <span style={{ fontSize: 12.5 }}>{reviewError}</span>
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={handleReviewSubmit}
                disabled={reviewLoading || !reviewInput.trim()}
                style={{ gap: 6, alignSelf: "flex-start" }}
                id="btn-run-title-review"
              >
                {reviewLoading ? (
                  <>
                    <RotateCcw size={15} style={{ animation: "spin 1s linear infinite" }} />
                    <span>STARA AI Sedang Menganalisis Judul & Menilai Celah Sempro...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Uji Kelayakan Judul dengan AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Review Results */}
          {reviewResult && (
            <div className="card" style={{ border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Hasil Evaluasi Draf Judul:</span>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontStyle: "italic", marginTop: 2 }}>
                    &quot;{reviewResult.originalTitle}&quot;
                  </div>
                </div>

                {/* Score Badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    borderRadius: "var(--radius-md)",
                    background: reviewResult.score >= 80 ? "rgba(215,243,106,0.15)" : "rgba(255,184,77,0.15)",
                    border: reviewResult.score >= 80 ? "1px solid var(--lime)" : "1px solid var(--orange)",
                  }}
                >
                  <span style={{ fontSize: 22, fontWeight: 800, color: reviewResult.score >= 80 ? "var(--lime)" : "var(--orange)" }}>
                    {reviewResult.score}
                  </span>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Skor Kelayakan</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: reviewResult.score >= 80 ? "var(--lime)" : "var(--orange)" }}>
                      {reviewResult.verdict === "sangat_baik" ? "Sangat Siap Diajukan" : reviewResult.verdict === "cukup_baik" ? "Cukup Baik" : "Perlu Disempurnakan"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 16 }}>
                <div style={{ background: "rgba(124, 230, 168, 0.06)", border: "1px solid rgba(124, 230, 168, 0.25)", borderRadius: "var(--radius-sm)", padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E", textTransform: "uppercase", marginBottom: 6 }}>
                    ✓ Kelebihan Judul:
                  </div>
                  {reviewResult.strengths.map((s, i) => (
                    <div key={i} style={{ fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 5, lineHeight: 1.5 }}>• {s}</div>
                  ))}
                </div>

                <div style={{ background: "rgba(255, 107, 107, 0.06)", border: "1px solid rgba(255, 107, 107, 0.25)", borderRadius: "var(--radius-sm)", padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--coral)", textTransform: "uppercase", marginBottom: 6 }}>
                    ⚠ Potensi Titik Lemah (Celah Sempro):
                  </div>
                  {reviewResult.weaknesses.map((w, i) => (
                    <div key={i} style={{ fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 5, lineHeight: 1.5 }}>• {w}</div>
                  ))}
                </div>
              </div>

              {/* Suggested Methods */}
              {reviewResult.suggestedMethods && reviewResult.suggestedMethods.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                    Metode / Pendekatan yang Direkomendasikan AI:
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {reviewResult.suggestedMethods.map((m, mi) => (
                      <span key={mi} className="badge badge-teal" style={{ fontSize: 11.5, padding: "4px 10px" }}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Alternative Titles */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={14} color="var(--lime)" />
                  Rekomendasi Redaksi Judul Ilmiah yang Lebih Tajam:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {reviewResult.improvedTitles.map((alt, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "var(--surface-hover)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        padding: "10px 12px",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600, flex: 1, minWidth: 220 }}>
                        {i + 1}. {alt}
                      </span>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => adoptTitleIntoTracker(alt)}
                          style={{ fontSize: 11, gap: 4 }}
                          title="Simpan judul ini ke Tahap 1 Tracker Skripsi"
                        >
                          <Check size={12} />
                          <span>Pakai ke Tracker</span>
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => consultTopicInChat(alt)}
                          style={{ fontSize: 11, gap: 4 }}
                        >
                          <MessageSquare size={12} />
                          <span>Bahas di Chat</span>
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => copyToClipboard(alt)}
                          style={{ fontSize: 11, gap: 4 }}
                        >
                          {copiedTitle === alt ? <Check size={12} color="var(--lime)" /> : <Copy size={12} />}
                          <span>{copiedTitle === alt ? "Tersalin" : "Salin"}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Defense Questions */}
              {reviewResult.defenseQuestions.length > 0 && (
                <div className="assumption-notice">
                  <HelpCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>
                      Prediksi Pertanyaan Penguji saat Sidang Sempro untuk Topik Ini:
                    </div>
                    {reviewResult.defenseQuestions.map((q, i) => (
                      <div key={i} style={{ fontSize: 12.5, marginBottom: 4, lineHeight: 1.5 }}>
                        {i + 1}. {q}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 4: 11 TAHAPAN & TRACKER SKRIPSI INTERAKTIF
      ══════════════════════════════════════════════════════ */}
      {activeTab === "timeline" && (
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          {/* Tracker Overview Header Card */}
          <div
            className="card"
            style={{
              marginBottom: 18,
              background: "linear-gradient(135deg, rgba(215,243,106,0.08) 0%, rgba(133,136,255,0.06) 100%)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <GraduationCap size={20} color="var(--lime)" />
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                    Tracker 11 Tahapan Tugas Akhir / Skripsi
                  </h2>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
                  Kelola setiap milestone skripsi, catat masukan dosen pembimbing, simpan tautan dokumen, dan sinkronkan dengan AI Consultant.
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => saveStagesProgress()}
                  disabled={isSavingProgress}
                  style={{ gap: 6, fontSize: 12 }}
                  id="btn-save-thesis-progress"
                >
                  <Save size={13} />
                  <span>{isSavingProgress ? "Menyimpan..." : "Simpan Progres"}</span>
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleResetTracker}
                  style={{ fontSize: 11.5, color: "var(--text-muted)" }}
                  title="Atur ulang tahapan"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Approved / Draft Title Banner (Hanya muncul jika judul valid & bermakna) */}
            {(() => {
              const rawTitle = stages[0]?.fields?.approvedTitle;
              const isStage1Acc = stages[0]?.status === "acc_dospem";
              const isValidTitle =
                Boolean(rawTitle && rawTitle.trim().length >= 20 && validateThesisField("approvedTitle", rawTitle) === null);
              if (!isValidTitle) return null;

              return (
                <div
                  style={{
                    background: "var(--surface-card)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    padding: "9px 12px",
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    fontSize: 12.5,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Award size={15} color="var(--lime)" style={{ flexShrink: 0 }} />
                    <div>
                      <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
                        {isStage1Acc ? "Judul Skripsi Disetujui (ACC):" : "Draf Pengajuan Judul:"}
                      </span>
                      <strong style={{ color: "var(--text-primary)", display: "block" }}>
                        &quot;{rawTitle}&quot;
                      </strong>
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setExpandedStageId(1);
                    }}
                    style={{ fontSize: 11, flexShrink: 0 }}
                  >
                    Ubah
                  </button>
                </div>
              );
            })()}

            {/* Progress Bar & Badges */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                  Progres Keseluruhan: <strong style={{ color: "#15803D" }}>{completedStagesCount} dari 11 Tahapan Selesai</strong>
                </span>
                <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>{progressPercentage}% Selesai</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: "var(--surface-hover)", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${progressPercentage}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, var(--teal) 0%, var(--lime) 100%)",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>

              {lastSavedTime && (
                <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <Clock size={11} />
                  <span>Terakhir disimpan: {lastSavedTime} WIB</span>
                </div>
              )}
            </div>
          </div>

          {/* How-to guide */}
          <div
            className="card"
            style={{ marginBottom: 14, padding: "14px 16px" }}
            id="thesis-howto"
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", marginBottom: 10 }}>
              Cara memakai tracker ini
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
              {[
                { n: 1, t: "Kerjakan bersama dosen", d: "Isi catatan, judul, atau tautan dokumen di tahap yang sedang aktif." },
                { n: 2, t: "Centang jika sudah ACC", d: "Centang hanya setelah dosen pembimbing menyetujui tahap itu. Tahap berikutnya langsung terbuka." },
                { n: 3, t: "Tanya AI untuk langkah lanjut", d: "AI membaca progresmu, jadi sarannya sesuai tahap yang sedang kamu kerjakan." },
              ].map((s) => (
                <div key={s.n} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "var(--lime)",
                      color: "#0B0D0C",
                      fontWeight: 800,
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {s.n}
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)" }}>{s.t}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.5 }}>{s.d}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 10 }}>
              Tracker ini hanya mencatat progres dan memberi saran. Keputusan tetap ada di dosen pembimbing.
            </div>
          </div>

          {/* Current stage callout */}
          {completedStagesCount < stages.length && (
            <div
              role="status"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                background: "#FEF3C7",
                border: "1px solid #FCD34D",
                borderRadius: "var(--radius-md)",
                padding: "10px 14px",
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 13, color: "var(--text-primary)" }}>
                <span style={{ color: "var(--text-muted)", fontSize: 11.5, display: "block" }}>Kamu sedang di</span>
                <strong>
                  Tahap {currentActiveStage.id} dari {stages.length}: {currentActiveStage.stageName}
                </strong>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setExpandedStageId(currentActiveStage.id);
                  setTimeout(() => {
                    document.getElementById(`stage-card-${currentActiveStage.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 50);
                }}
                style={{ fontSize: 12 }}
              >
                Kerjakan tahap ini
              </button>
            </div>
          )}

          {/* Dependency Notice Feedback */}
          {dependencyAlert && (
            <div
              className="error-state"
              style={{
                marginBottom: 14,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                animation: "fadeIn 0.2s ease",
              }}
            >
              <AlertCircle size={16} color="var(--coral)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12.5 }}>{dependencyAlert}</span>
            </div>
          )}

          {/* Save Success Notice */}
          {saveSuccessMsg && (
            <div
              style={{
                marginBottom: 14,
                padding: "9px 14px",
                background: "rgba(215,243,106,0.15)",
                border: "1px solid var(--lime)",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "var(--text-primary)",
                fontSize: 12.5,
              }}
            >
              <CheckCircle size={15} color="var(--lime)" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* 11 Stages List Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {stages.map((stage, idx) => {
              const unlocked = isStageUnlocked(idx, stages);
              const isAcc = stage.status === "acc_dospem";
              const isExpanded = expandedStageId === stage.id;
              const isCurrent = stage.id === currentActiveStage.id && !isAcc;
              const isFilled = isStageFormFilled(stage);
              const hasFormError = formErrorStageId === stage.id;

              return (
                <div
                  key={stage.id}
                  id={`stage-card-${stage.id}`}
                  className="card"
                  style={{
                    border: isAcc
                      ? "1px solid rgba(215,243,106,0.4)"
                      : isCurrent
                      ? "2px solid var(--lime)"
                      : "1px solid var(--border-subtle)",
                    background: isAcc
                      ? "rgba(215,243,106,0.02)"
                      : !unlocked
                      ? "rgba(0,0,0,0.02)"
                      : "var(--surface-card)",
                    opacity: !unlocked ? 0.72 : 1,
                    transition: "all 0.2s ease",
                  }}
                >
                  {/* Top Bar of Stage */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Left: Checkbox + Number + Title */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 260 }}>
                      {/* Checkbox with lock & validation prevention */}
                      <div
                        onClick={(e) => {
                          if (!unlocked) {
                            e.preventDefault();
                            setDependencyAlert(`⚠️ Tahap ${stage.id} masih terkunci! Selesaikan Tahap ${stage.id - 1} terlebih dahulu.`);
                            setTimeout(() => setDependencyAlert(null), 5000);
                          } else if (!isAcc && !isFilled) {
                            e.preventDefault();
                            const issues = getStageIssues(stage);
                            setDependencyAlert(`⚠️ Tidak dapat menceklis selesai Tahap ${stage.id}! ${describeIssues(issues)}. Lengkapi formulir dengan isian yang valid terlebih dahulu.`);
                            setExpandedStageId(stage.id);
                            setFormErrorStageId(stage.id);
                            setTimeout(() => setDependencyAlert(null), 8000);
                          }
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          cursor: !unlocked ? "not-allowed" : (!isAcc && !isFilled) ? "not-allowed" : "pointer",
                        }}
                        title={
                          !unlocked
                            ? "Selesaikan tahapan sebelumnya terlebih dahulu"
                            : !isFilled && !isAcc
                            ? "Isi formulir dan catatan tahap ini dengan data valid terlebih dahulu untuk dapat menceklis"
                            : isAcc
                            ? "Batalkan status ACC"
                            : "Tandai ACC Dospem & Selesai"
                        }
                      >
                        <input
                          type="checkbox"
                          checked={isAcc}
                          disabled={!unlocked || (!isAcc && !isFilled)}
                          onChange={(e) => handleToggleStageCheckbox(stage.id, e.target.checked)}
                          style={{
                            width: 18,
                            height: 18,
                            cursor: (!unlocked || (!isAcc && !isFilled)) ? "not-allowed" : "pointer",
                            accentColor: "var(--lime)",
                            opacity: (!unlocked || (!isAcc && !isFilled)) ? 0.55 : 1,
                          }}
                        />
                      </div>

                      {/* Stage Number Badge */}
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: isAcc
                            ? "var(--lime)"
                            : isCurrent
                            ? "rgba(215,243,106,0.2)"
                            : !unlocked
                            ? "var(--surface-hover)"
                            : "rgba(133,136,255,0.15)",
                          border: isAcc
                            ? "1px solid var(--lime)"
                            : isCurrent
                            ? "2px solid var(--lime)"
                            : "1px solid var(--border-subtle)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: 12.5,
                          color: isAcc
                            ? "var(--bg-primary)"
                            : isCurrent
                            ? "var(--lime)"
                            : !unlocked
                            ? "var(--text-muted)"
                            : "var(--blue)",
                          flexShrink: 0,
                        }}
                      >
                        {isAcc ? <Check size={16} strokeWidth={3} /> : !unlocked ? <Lock size={13} /> : stage.id}
                      </div>

                      {/* Title & Tag */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: 14.5,
                              fontWeight: 700,
                              color: !unlocked ? "var(--text-secondary)" : "var(--text-primary)",
                            }}
                          >
                            {stage.title}
                          </span>
                          <span className="badge badge-teal" style={{ fontSize: 9.5 }}>{stage.semesterTag}</span>
                          {isCurrent && (
                            <span className="badge badge-lime" style={{ fontSize: 9.5 }}>
                              Tahap Aktif
                            </span>
                          )}
                          {!unlocked && (
                            <span className="badge badge-gray" style={{ fontSize: 9.5, display: "flex", alignItems: "center", gap: 3 }}>
                              <Lock size={10} /> Terkunci
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Status Dropdown & Accordion Button */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <select
                        className="form-input"
                        value={stage.status}
                        disabled={!unlocked}
                        onChange={(e) => handleStageStatusChange(stage.id, e.target.value as StageStatus)}
                        style={{
                          fontSize: 11.5,
                          padding: "5px 34px 5px 10px",
                          height: "auto",
                          cursor: unlocked ? "pointer" : "not-allowed",
                          borderColor: isAcc ? "var(--lime)" : "var(--border-subtle)",
                          fontWeight: 600,
                          minWidth: 155,
                        }}
                      >
                        <option value="belum_dimulai">⚪ Belum Dimulai</option>
                        <option value="proses_bimbingan">🔵 Proses Bimbingan</option>
                        <option value="revisi_dospem">🟠 Revisi Dospem</option>
                        <option value="acc_dospem" disabled={!isFilled && !isAcc}>🟢 ACC Dospem / Selesai {!isFilled && !isAcc ? "(Form Belum Diisi)" : ""}</option>
                      </select>

                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleToggleExpandStage(stage, idx)}
                        style={{ fontSize: 11, padding: "4px 8px", gap: 4 }}
                        title="Buka / Tutup Form & Masukan Dospem"
                      >
                        <span>{isExpanded ? "Tutup" : "Detail & Dokumen"}</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Stage Summary Line */}
                  <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "8px 0 0", lineHeight: 1.5, paddingLeft: 38 }}>
                    {stage.shortDesc}
                  </p>

                  {/* Accordion Content (Fields + Deliverables + Tips) */}
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: 14,
                        paddingTop: 14,
                        borderTop: "1px solid var(--border-subtle)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      {/* Deliverables & Tip Box */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div style={{ background: "var(--surface-hover)", padding: "10px 12px", borderRadius: "var(--radius-sm)" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3, display: "flex", alignItems: "center", gap: 5 }}>
                            <FileText size={13} color="var(--blue)" /> Output Wajib:
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.4 }}>
                            {stage.deliverables}
                          </div>
                        </div>

                        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", padding: "10px 12px", borderRadius: "var(--radius-sm)" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E", textTransform: "uppercase", marginBottom: 3, display: "flex", alignItems: "center", gap: 5 }}>
                            <Lightbulb size={13} color="#D97706" /> Tips Sukses:
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                            {stage.guideTip}
                          </div>
                        </div>
                      </div>

                      {/* Interactive Fields Form */}
                      <div
                        style={{
                          background: "var(--surface-hover)",
                          padding: 14,
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-subtle)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                          <Sparkles size={13} color="var(--lime)" />
                          Form Isian & Catatan Masukan Dosen Pembimbing ({stage.stageName}):
                        </div>

                        {stage.fieldConfigs.map((f) => {
                          const val = stage.fields[f.key] || "";
                          const rawError = val.trim() ? validateThesisField(f.key, val) : null;
                          const emptyRequiredError =
                            hasFormError && f.required && !val.trim() ? THESIS_REQUIRED_MESSAGE : null;
                          const fieldError = rawError || emptyRequiredError;
                          const isInvalid = Boolean(fieldError);

                          return (
                            <div key={f.key} className="form-group" style={{ margin: 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                <label className="form-label" style={{ fontSize: 12, margin: 0, color: isInvalid ? "var(--coral)" : "var(--text-secondary)" }}>
                                  {f.label} {f.required && <span style={{ color: "var(--coral)", fontWeight: 700 }} title="Wajib diisi">*</span>}
                                </label>
                                {f.type === "url" && val.startsWith("http") && !rawError && (
                                  <a
                                    href={val}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ fontSize: 11, color: "var(--blue)", display: "flex", alignItems: "center", gap: 3, textDecoration: "none" }}
                                  >
                                    <ExternalLink size={11} /> Buka Tautan
                                  </a>
                                )}
                              </div>

                              {f.type === "textarea" ? (
                                <textarea
                                  className="form-input"
                                  rows={2}
                                  value={val}
                                  disabled={!unlocked}
                                  placeholder={f.placeholder}
                                  onChange={(e) => {
                                    handleStageFieldChange(stage.id, f.key, e.target.value);
                                    if (formErrorStageId === stage.id) setFormErrorStageId(null);
                                  }}
                                  style={{
                                    fontSize: 12.5,
                                    resize: "vertical",
                                    borderColor: isInvalid ? "var(--coral)" : undefined,
                                    background: isInvalid ? "rgba(239, 68, 68, 0.05)" : undefined,
                                  }}
                                />
                              ) : (
                                <input
                                  type={f.type === "url" ? "url" : f.type === "date" ? "date" : "text"}
                                  className="form-input"
                                  value={val}
                                  disabled={!unlocked}
                                  placeholder={f.placeholder}
                                  onChange={(e) => {
                                    handleStageFieldChange(stage.id, f.key, e.target.value);
                                    if (formErrorStageId === stage.id) setFormErrorStageId(null);
                                  }}
                                  style={{
                                    fontSize: 12.5,
                                    borderColor: isInvalid ? "var(--coral)" : undefined,
                                    background: isInvalid ? "rgba(239, 68, 68, 0.05)" : undefined,
                                  }}
                                />
                              )}
                              {fieldError && (
                                <div style={{ fontSize: 11, color: "var(--coral)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                                  <AlertCircle size={12} style={{ flexShrink: 0 }} />
                                  <span>{fieldError}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Action Buttons in Stage Footer */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, paddingTop: 4 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => consultStageInChat(stage)}
                          style={{ fontSize: 11.5, gap: 5 }}
                        >
                          <MessageSquare size={13} color="var(--lime)" />
                          <span>💬 Bahas Tahap Ini dengan AI Konsultan</span>
                        </button>

                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleSaveCurrentStage(stage.id)}
                            disabled={isSavingProgress}
                            style={{ fontSize: 11.5, gap: 5 }}
                            title="Simpan perubahan formulir tahap ini"
                          >
                            <Save size={13} />
                            <span>Simpan Isian Tahap Ini</span>
                          </button>

                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleCompleteAndAdvance(stage)}
                            disabled={isSavingProgress}
                            style={{
                              fontSize: 11.5,
                              gap: 5,
                              background: isAcc ? "#15803D" : undefined,
                              borderColor: isAcc ? "#15803D" : undefined,
                            }}
                            title="Validasi formulir, tandai ACC Dospem, dan lanjut ke tahap berikutnya"
                          >
                            {isAcc ? (
                              <>
                                <CheckCircle2 size={13} />
                                <span>Tahap Sudah Selesai (ACC)</span>
                              </>
                            ) : (
                              <>
                                <span>{stage.id === 11 ? "Selesaikan Seluruh Skripsi 🎉" : "Selesai & Lanjut ke Tahap Berikutnya →"}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
