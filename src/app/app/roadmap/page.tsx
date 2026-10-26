"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "@/features/session/context";
import {
  CheckCircle2,
  Clock,
  Circle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertCircle,
  GitBranch,
  History,
  LayoutTemplate,
  BookOpen,
  BookMarked,
  Sparkles,
  Users,
  Building2,
  Trash2,
  ArrowRight,
  X,
  Check,
  Lock,
  SlidersHorizontal,
  Calendar,
  Briefcase,
  GraduationCap,
  RotateCcw,
  FileText,
  Target,
  Eye,
  Edit3,
  Search,
  ExternalLink,
  Layers,
  Compass,
  AlertTriangle,
  PauseCircle,
  Columns2,
  CheckCheck,
  FileEdit,
  ShieldAlert,
  ShieldCheck,
  MoreHorizontal,
  Info,
} from "lucide-react";
import { TASK_CATEGORIES, TASK_STATUSES, TEMPLATE_CATEGORIES } from "@/lib/constants";
import { semesterLabel } from "@/lib/utils";
import { MOCK_TEMPLATES, MockTemplate } from "@/features/templates/data";
import { CURRICULUM_CATALOG, MILESTONE_TEMPLATES, CatalogCourse } from "@/features/curriculum/catalog";
import Link from "next/link";

type Task = {
  id: string;
  title: string;
  status: string; // "planned" | "in_progress" | "done" | "delayed" | "cancelled"
  category: string;
  itemType?: "COURSE" | "ACTIVITY" | "MILESTONE";
  credits: number;
  courseCode?: string;
  notes?: string;
  activityPeriod?: string;
  weeklyHours?: number;
  prerequisites?: string[];
  certaintyLevel: string;
  dataSource?: string;
  targetDate?: string;
};

type SemesterPlan = {
  id: string;
  semesterNum: number;
  semesterLabel: string | null;
  targetCredits: number;
  plannedCredits: number;
  isCurrentSemester: boolean;
  notes?: string;
  tasks: Task[];
};

type ValidationIssue = {
  type: "error" | "warning" | "info";
  code: string;
  message: string;
  semesterNum?: number;
  taskId?: string;
  courseCode?: string;
};

type RoadmapData = {
  roadmap: {
    id: string;
    title: string;
    isDraftMode?: boolean;
    currentVersion: {
      id: string;
      versionNum: number;
      label: string | null;
      isDraft?: boolean;
      semesterPlans: SemesterPlan[];
    } | null;
    versions: Array<{
      id: string;
      versionNum: number;
      label: string | null;
      isDraft?: boolean;
      createdAt: string;
      isBaseline: boolean;
    }>;
  } | null;
  profile: {
    institutionName: string;
    programName: string;
    currentSemester: number;
    entryYear: number;
    totalCurriculumCredits: number;
    completedCredits: number;
    inProgressCredits?: number;
    goals: string;
  } | null;
  calculation: {
    remainingCredits: number;
    estimatedGraduationSemester: number | null;
    isProvisional: boolean;
    conflicts: string[];
    issues?: ValidationIssue[];
    validationStatus?: "valid" | "warning" | "error";
    creditsByStatus: Record<string, number>;
  } | null;
  ruleValidation?: {
    issues: ValidationIssue[];
    conflicts: string[];
    validationStatus: "valid" | "warning" | "error";
  } | null;
};

const ACTIVITY_CATEGORY_PRESETS: Record<
  "organisasi" | "kompetisi" | "sertifikasi" | "proyek" | "pengabdian",
  Array<{ title: string; category: string; defaultHours: number; period: string; notes: string }>
> = {
  organisasi: [
    { title: "Badan Eksekutif Mahasiswa (BEM)", category: "organisasi", defaultHours: 12, period: "1 Periode", notes: "Pengembangan kepemimpinan, advokasi kemahasiswaan, dan tata kelola program kerja." },
    { title: "Himpunan Mahasiswa Program Studi (HMPS)", category: "organisasi", defaultHours: 10, period: "1 Periode", notes: "Koordinasi kegiatan akademik prodi, mentoring angkatan, dan jejaring alumni." },
    { title: "Ketua / Koordinator Divisi Kepanitiaan Event", category: "organisasi", defaultHours: 8, period: "3-4 Bulan", notes: "Manajemen tim lintas divisi, perumusan anggaran, dan eksekusi acara kampus." },
    { title: "Unit Kegiatan Mahasiswa (UKM) Minat & Bakat", category: "organisasi", defaultHours: 6, period: "1 Semester", notes: "Pengembangan bakat seni, olahraga, atau penalaran ilmiah terstruktur." },
  ],
  kompetisi: [
    { title: "Program Kreativitas Mahasiswa (PKM Kemendikbud)", category: "kompetisi", defaultHours: 14, period: "3 Bulan Intensif", notes: "Penyusunan proposal riset/karsa cipta dan pendanaan kompetitif nasional." },
    { title: "Kompetisi Hackathon & Inovasi Digital", category: "kompetisi", defaultHours: 16, period: "1-2 Bulan", notes: "Pengembangan prototipe solusi berbasis perangkat lunak dalam batasan waktu lomba." },
    { title: "Lomba Karya Tulis Ilmiah (LKTI) Nasional", category: "kompetisi", defaultHours: 8, period: "2 Bulan", notes: "Penulisan artikel ilmiah berbasis studi pustaka dan metodologi terapan." },
    { title: "Business Case Competition / Debat Ilmiah", category: "kompetisi", defaultHours: 10, period: "1-2 Bulan", notes: "Penyelesaian studi kasus bisnis nyata dan presentasi di hadapan juri ahli." },
  ],
  sertifikasi: [
    { title: "Sertifikasi Cloud Computing (AWS / GCP / Azure)", category: "sertifikasi", defaultHours: 8, period: "2 Bulan", notes: "Pemahaman infrastruktur komputasi awan dan simulasi ujian sertifikasi global." },
    { title: "Sertifikasi Profesi Teknologi (BNSP / Scrum / Cisco)", category: "sertifikasi", defaultHours: 10, period: "1-2 Bulan", notes: "Uji kompetensi teknis terstandar dan sertifikat lisensi industri." },
    { title: "Tes Kemahiran Bahasa Asing (TOEFL / IELTS)", category: "sertifikasi", defaultHours: 6, period: "2-3 Bulan", notes: "Persiapan skor kemampuan bahasa Inggris untuk syarat yudisium dan karier." },
  ],
  proyek: [
    { title: "Pengembangan Aplikasi Portofolio Fullstack", category: "proyek", defaultHours: 12, period: "1 Semester", notes: "Membangun produk web atau mobile mandiri yang siap dipamerkan ke industri." },
    { title: "Kontributor Proyek Open Source Software", category: "proyek", defaultHours: 8, period: "Fleksibel", notes: "Pengiriman pull request, code review, dan kolaborasi di repositori komunitas." },
    { title: "Proyek Riset Laboratorium & Asisten Dosen", category: "proyek", defaultHours: 14, period: "1 Semester", notes: "Pendampingan riset dosen dan pemeliharaan modul praktikum jurusan." },
  ],
  pengabdian: [
    { title: "Kuliah Kerja Nyata (KKN) Tematik", category: "pengabdian", defaultHours: 20, period: "1-2 Bulan", notes: "Penerapan keilmuan langsung dan pemberdayaan masyarakat desa mitra." },
    { title: "Relawan Pengajar & Literasi Digital Komunitas", category: "pengabdian", defaultHours: 6, period: "1 Semester", notes: "Kegiatan sukarelawan edukasi, lingkungan, atau bantuan sosial kemanusiaan." },
    { title: "Program Pengabdian Bina Desa Mandiri", category: "pengabdian", defaultHours: 8, period: "3 Bulan", notes: "Inisiasi program berkelanjutan bersama komunitas lokal non-profit." },
  ],
};

const MILESTONE_CATEGORY_PRESETS: Record<
  "krs" | "dosen_wali" | "persiapan_magang" | "target_akademik",
  Array<{ title: string; category: string; notes: string; targetHint: string }>
> = {
  krs: [
    { title: "Pengisian & Finalisasi KRS Online", category: "krs", notes: "Pilih kelas sesuai kuota dan sesuaikan beban SKS sebelum batas penutupan KRS.", targetHint: "Minggu ke-1 Kuliah" },
    { title: "Masa Revisi / Batal Tambah KRS", category: "krs", notes: "Penyesuaian jadwal kuliah yang bertabrakan atau penambahan kelas cadangan.", targetHint: "Minggu ke-2 Kuliah" },
    { title: "Validasi Registrasi & Pembayaran UKT", category: "krs", notes: "Penyelesaian administrasi keuangan semester untuk aktivasi status akademik.", targetHint: "Sebelum Pengisian KRS" },
  ],
  dosen_wali: [
    { title: "Bimbingan Rencana Akademik Awal Semester", category: "dosen_wali", notes: "Konsultasi pengambilan mata kuliah dan persetujuan tanda tangan digital KRS oleh DPA.", targetHint: "Awal Semester" },
    { title: "Evaluasi Tengah Semester (Pasca UTS)", category: "dosen_wali", notes: "Review capaian nilai tengah semester dan antisipasi mata kuliah kritis.", targetHint: "Minggu ke-8 Kuliah" },
    { title: "Persetujuan Beban SKS Khusus / Dispensasi", category: "dosen_wali", notes: "Pengajuan dispensasi beban di atas 20 SKS dengan pertimbangan IPK memadai.", targetHint: "Sebelum Finalisasi KRS" },
  ],
  persiapan_magang: [
    { title: "Penyusunan CV ATS & Portofolio Karya", category: "persiapan_magang", notes: "Review resume ringkas, tautan portofolio GitHub/Figma, dan studi kasus proyek.", targetHint: "Bulan ke-2 Semester" },
    { title: "Pendaftaran Program MBKM / Magang Industri", category: "persiapan_magang", notes: "Pengunggahan berkas rekomendasi jurusan dan pendaftaran mitra resmi kampus.", targetHint: "Bulan ke-3 Semester" },
    { title: "Simulasi Wawancara & Uji Teknis Industri", category: "persiapan_magang", notes: "Latihan interview perilaku dan uji studi kasus teknis bersama mentor.", targetHint: "Bulan ke-4 Semester" },
  ],
  target_akademik: [
    { title: "Target IPK Semester Ini >= 3.50", category: "target_akademik", notes: "Menjaga ritme belajar konsisten pada seluruh mata kuliah berbobot tinggi.", targetHint: "Akhir Semester" },
    { title: "Eksplorasi Topik & Calon Pembimbing Skripsi", category: "target_akademik", notes: "Menentukan arah topik penelitian dan konsultasi draf awal proposal skripsi.", targetHint: "Semester 6 atau 7" },
    { title: "Penyusunan Draf Bab 1–3 Tugas Akhir", category: "target_akademik", notes: "Menuntaskan latar belakang masalah, kajian pustaka, dan metodologi riset.", targetHint: "Sebelum Ujian Sempro" },
  ],
};

export default function RoadmapPage() {
  const { token } = useSession();
  const [data, setData] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSemesters, setExpandedSemesters] = useState<Set<number>>(new Set([5]));
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // View Switcher: "visual" (Roadmap Visual) vs "timeline" (Timeline List) vs "split" (Keduanya Berdampingan)
  const [activeView, setActiveView] = useState<"visual" | "timeline" | "split">("visual");

  // Mode Switcher: Mode 1: "view" (Lihat Roadmap) vs Mode 2: "edit" (Sesuaikan Roadmap)
  const [activeMode, setActiveMode] = useState<"view" | "edit">("view");

  // Secondary Menu Dropdown (Template, Riwayat, Kosongkan)
  const [showSecondaryMenu, setShowSecondaryMenu] = useState(false);

  // Panel Validasi Akademik: Toggle Detail
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  // Mode 1: Status Filter
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal: Tambah Item (COURSE, ACTIVITY, MILESTONE)
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [addItemSemester, setAddItemSemester] = useState<number>(5);
  const [itemModalTab, setItemModalTab] = useState<"COURSE" | "ACTIVITY" | "MILESTONE">("COURSE");
  const [courseModalTab, setCourseModalTab] = useState<"katalog" | "kustom">("katalog");
  const [courseGroup, setCourseGroup] = useState<"wajib" | "pilihan" | "pengulangan" | "prasyarat" | "kustom">("wajib");
  const [customizingCardKey, setCustomizingCardKey] = useState<string | null>(null);
  const [customItemTitle, setCustomItemTitle] = useState<string>("");
  const [customItemCredits, setCustomItemCredits] = useState<number>(3);
  const [activityCategoryTab, setActivityCategoryTab] = useState<"organisasi" | "kompetisi" | "sertifikasi" | "proyek" | "pengabdian">("organisasi");
  const [milestoneCategoryTab, setMilestoneCategoryTab] = useState<"krs" | "dosen_wali" | "persiapan_magang" | "target_akademik">("krs");
  const [showCustomActivity, setShowCustomActivity] = useState(false);
  const [showCustomMilestone, setShowCustomMilestone] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [customCourseForm, setCustomCourseForm] = useState({
    title: "",
    courseCode: "",
    credits: 3,
    category: "akademik",
    notes: "",
    prerequisitesText: "",
  });
  const [customActivityForm, setCustomActivityForm] = useState({
    title: "",
    category: "organisasi",
    activityPeriod: "",
    weeklyHours: 10,
    hasConversion: false,
    credits: 0,
    notes: "",
  });
  const [customMilestoneForm, setCustomMilestoneForm] = useState({
    title: "",
    category: "krs",
    targetDate: "",
    notes: "",
  });

  // Backward compatibility modal toggles
  const showAddCourseModal = false;
  const setShowAddCourseModal = (val: boolean) => {
    if (val) {
      setItemModalTab("COURSE");
      setShowAddItemModal(true);
    } else {
      setShowAddItemModal(false);
    }
  };
  const addCourseSemester = addItemSemester;
  const setAddCourseSemester = (sem: number) => setAddItemSemester(sem);

  const showAddMilestoneModal = false;
  const setShowAddMilestoneModal = (val: boolean) => {
    if (val) {
      setItemModalTab("MILESTONE");
      setShowAddItemModal(true);
    } else {
      setShowAddItemModal(false);
    }
  };
  const addMilestoneSemester = addItemSemester;
  const setAddMilestoneSemester = (sem: number) => setAddItemSemester(sem);

  const openAddItemModal = (semNum: number, tab: "COURSE" | "ACTIVITY" | "MILESTONE" = "COURSE") => {
    setAddItemSemester(semNum);
    setItemModalTab(tab);
    setShowAddItemModal(true);
  };

  // Template Picker Modal
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [pickerSourceTab, setPickerSourceTab] = useState<"komunitas" | "kampus">("komunitas");
  const [selectedTemplateForApply, setSelectedTemplateForApply] = useState<MockTemplate | null>(null);
  const [targetSemesterForApply, setTargetSemesterForApply] = useState<number>(0);
  const [applyMode, setApplyMode] = useState<"merge" | "new_version">("merge");
  const [isApplying, setIsApplying] = useState(false);
  const [isGeneratingFromProfile, setIsGeneratingFromProfile] = useState(false);

  const handleGenerateFromProfile = async () => {
    if (!token) return;
    setIsGeneratingFromProfile(true);
    try {
      const res = await fetch("/api/roadmap/generate-from-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat roadmap");
      showToast("Roadmap personal berhasil dibuat dari profil onboarding kamu!", "success");
      fetchRoadmap();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Gagal membuat roadmap", "error");
    } finally {
      setIsGeneratingFromProfile(false);
    }
  };

  const handleClearRoadmap = async () => {
    if (!token) return;
    if (!window.confirm("Apakah kamu yakin ingin mengosongkan Roadmap Saya? Kamu bisa men-generate ulang atau memilih template baru kapan saja.")) return;
    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({ action: "clear_roadmap" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengosongkan roadmap");
      showToast("Roadmap berhasil dikosongkan.", "success");
      fetchRoadmap();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Gagal mengosongkan roadmap", "error");
    }
  };

  const fetchRoadmap = () => {
    if (!token) return;
    setLoading(true);
    fetch(`/api/roadmap`, { headers: { "x-demo-token": token } })
      .then((r) => r.json())
      .then((d: RoadmapData) => {
        setData(d);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRoadmap();
  }, [token]);

  const toggleSemester = (num: number) => {
    setExpandedSemesters((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const expandAll = () => {
    if (!data?.roadmap?.currentVersion?.semesterPlans) return;
    const all = new Set(data.roadmap.currentVersion.semesterPlans.map((p) => p.semesterNum));
    setExpandedSemesters(all);
  };

  const collapseAll = () => {
    setExpandedSemesters(new Set());
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Kemampuan A: Update Task / Status
  const handleUpdateTask = async (taskId: string, updates: Record<string, unknown>) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({ action: "update_task", taskId, updates }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan perubahan.");
      showToast("Perubahan disimpan", "success");
      fetchRoadmap();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Gagal menyimpan perubahan", "error");
    }
    setEditingTaskId(null);
  };

  // Kemampuan A: Pindah Semester (Locked if done)
  const handleMoveTask = async (taskId: string, targetSemesterNum: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({ action: "move_task", taskId, targetSemesterNum }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memindahkan mata kuliah.");
      showToast(json.message, "success");
      setExpandedSemesters((prev) => new Set([...prev, targetSemesterNum]));
      fetchRoadmap();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Gagal memindahkan", "error");
    }
  };

  // Kemampuan A: Hapus Mata Kuliah / Task (Locked if done)
  const handleDeleteTask = async (taskId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({ action: "delete_task", taskId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus.");
      showToast(json.message, "success");
      setEditingTaskId(null);
      fetchRoadmap();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Gagal menghapus", "error");
    }
  };

  // Draft & Edit Mode Management Actions
  const handleStartEditAndDraft = async () => {
    if (!token) return;
    setActiveMode("edit");
    if (!data?.roadmap?.isDraftMode) {
      try {
        const res = await fetch("/api/roadmap", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-demo-token": token },
          body: JSON.stringify({ action: "create_draft" }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Gagal membuat draf rencana");
        showToast("Mode penyesuaian draf aktif. Perubahan belum mengubah roadmap tersimpan.", "success");
        fetchRoadmap();
      } catch (e: unknown) {
        showToast(e instanceof Error ? e.message : "Gagal membuat draf", "error");
      }
    }
  };

  const handleSaveDraft = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({ action: "save_draft" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan draf");
      showToast(json.message || "Perubahan roadmap berhasil disimpan sebagai versi aktif!", "success");
      setActiveMode("view");
      fetchRoadmap();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Gagal menyimpan draf", "error");
    }
  };

  const handleCancelDraft = async (skipConfirm = false) => {
    if (!token) return;
    if (!skipConfirm && !window.confirm("Batalkan perubahan? Seluruh perubahan pada draf ini akan dibuang dan roadmap akan kembali ke versi aktif.")) return;
    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({ action: "cancel_draft" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membatalkan draf");
      showToast(json.message || "Perubahan draf dibatalkan.", "success");
      setActiveMode("view");
      fetchRoadmap();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Gagal membatalkan draf", "error");
    }
  };

  // Unified Item Creation Handler (COURSE, ACTIVITY, MILESTONE)
  const handleAddItem = async (params: {
    semesterNum: number;
    itemType: "COURSE" | "ACTIVITY" | "MILESTONE";
    title: string;
    category?: string;
    credits?: number;
    courseCode?: string;
    notes?: string;
    targetDate?: string;
    activityPeriod?: string;
    weeklyHours?: number;
    prerequisites?: string[];
  }) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({
          action: "add_item",
          ...params,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menambahkan item.");
      showToast(json.message, "success");
      setShowAddItemModal(false);
      setExpandedSemesters((prev) => new Set([...prev, params.semesterNum]));
      fetchRoadmap();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Gagal menambahkan item", "error");
    }
  };

  // Backward-compatible course & milestone adders
  const handleAddCourse = async (course: {
    title: string;
    courseCode?: string;
    credits: number;
    category?: string;
    notes?: string;
  }) => {
    await handleAddItem({
      semesterNum: addItemSemester,
      itemType: "COURSE",
      title: course.title,
      courseCode: course.courseCode,
      credits: course.credits,
      category: course.category || "akademik",
      notes: course.notes,
    });
  };

  // Kemampuan B: Update Target Beban SKS Semester
  const handleUpdateSemesterTarget = async (semesterNum: number, targetCredits: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({ action: "update_semester_target", semesterNum, targetCredits }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memperbarui target semester.");
      showToast(json.message, "success");
      fetchRoadmap();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Gagal mengubah target", "error");
    }
  };

  // Kemampuan C: Tambah Milestone Pribadi (Non-SKS)
  const handleAddMilestone = async (milestone: {
    title: string;
    category: string;
    notes?: string;
    targetDate?: string;
  }) => {
    await handleAddItem({
      semesterNum: addItemSemester,
      itemType: "MILESTONE",
      title: milestone.title,
      category: milestone.category,
      credits: 0,
      notes: milestone.notes,
      targetDate: milestone.targetDate,
    });
  };

  // Switch Roadmap Version
  const switchVersion = async (versionId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({ action: "switch_version", versionId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal beralih versi.");
      showToast(json.message, "success");
      fetchRoadmap();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Gagal beralih versi", "error");
    }
  };

  // Apply Template from Picker
  const handleApplyTemplateFromPicker = async () => {
    if (!selectedTemplateForApply || !token) return;
    setIsApplying(true);
    try {
      const res = await fetch(`/api/roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({
          action: "apply_template",
          templateId: selectedTemplateForApply.id,
          templateTitle: selectedTemplateForApply.title,
          templateSource: selectedTemplateForApply.sourceType,
          mode: applyMode,
          targetSemesterNum: targetSemesterForApply,
          items: selectedTemplateForApply.items,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menerapkan template");

      showToast(json.message, "success");
      setShowTemplatePicker(false);
      setSelectedTemplateForApply(null);
      fetchRoadmap();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Gagal menerapkan template", "error");
    } finally {
      setIsApplying(false);
    }
  };

  if (loading) {
    return (
      <div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 90, marginBottom: 14, borderRadius: 14 }} />
        ))}
      </div>
    );
  }

  if (error && !data?.profile) {
    return (
      <div className="error-state">
        <AlertCircle size={32} color="var(--coral)" />
        <h2 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 18, marginTop: 8 }}>
          Gagal Memuat Roadmap
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 440, margin: "6px auto 16px" }}>
          {error}
        </p>
        <button onClick={fetchRoadmap} className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
          <RotateCcw size={13} /> Coba Lagi
        </button>
      </div>
    );
  }

  const currentPlans = data?.roadmap?.currentVersion?.semesterPlans ?? [];

  if (!data?.roadmap || !data.roadmap.currentVersion || currentPlans.length === 0) {
    return (
      <div style={{ maxWidth: 740, margin: "36px auto", padding: "0 16px" }}>
        <div
          className="card"
          style={{
            padding: "48px 36px",
            background: "#FFFFFF",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.02)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(245, 205, 71, 0.22)",
              border: "1px solid rgba(217, 119, 6, 0.28)",
              color: "#92400E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 18,
              boxShadow: "0 4px 14px rgba(245, 205, 71, 0.2)",
            }}
          >
            <BookMarked size={30} strokeWidth={2.2} />
          </div>

          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              background: "rgba(245, 205, 71, 0.22)",
              color: "#92400E",
              border: "1px solid rgba(217, 119, 6, 0.3)",
              padding: "4px 12px",
              borderRadius: "var(--radius-pill)",
              marginBottom: 14,
              letterSpacing: "0.02em",
            }}
          >
            Roadmap Belum Dipilih
          </span>

          <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 10, letterSpacing: "-0.02em" }}>
            Roadmap Akademik Kamu Masih Kosong
          </h2>

          <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 520, lineHeight: 1.6, marginBottom: 28 }}>
            Kamu belum memilih template kurikulum atau membuat roadmap studi. Kamu dapat langsung men-generate blueprint otomatis berdasarkan profil onboarding kamu, atau menjelajahi katalog template.
          </p>

          {data?.profile && (
            <div
              style={{
                width: "100%",
                maxWidth: 520,
                background: "var(--bg-base)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border)",
                padding: "16px 20px",
                marginBottom: 28,
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                  Profil Onboarding Terhubung
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", marginTop: 4 }}>
                  {data.profile.programName}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2 }}>
                  {data.profile.institutionName} • Angkatan {data.profile.entryYear} (Semester {data.profile.currentSemester})
                </div>
              </div>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "#15803D",
                  background: "rgba(22, 163, 74, 0.12)",
                  border: "1px solid rgba(22, 163, 74, 0.25)",
                  padding: "5px 12px",
                  borderRadius: "var(--radius-pill)",
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <CheckCircle2 size={12} />
                Siap Digenerate
              </span>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              className="btn btn-primary"
              onClick={handleGenerateFromProfile}
              disabled={isGeneratingFromProfile}
              style={{
                gap: 8,
                padding: "12px 24px",
                fontSize: 13.5,
                fontWeight: 700,
                background: "#F5CD47",
                color: "#18181B",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                boxShadow: "0 2px 10px rgba(245, 205, 71, 0.35)",
              }}
              id="btn-generate-empty-roadmap"
            >
              <Plus size={16} strokeWidth={2.5} />
              {isGeneratingFromProfile ? "Merancang Roadmap..." : "Generate Roadmap dari Profil Onboarding"}
            </button>
            <Link
              href="/app/templates"
              className="btn btn-secondary"
              style={{
                gap: 8,
                padding: "12px 22px",
                fontSize: 13.5,
                fontWeight: 600,
                background: "#FFFFFF",
                color: "var(--text-primary)",
                border: "1px solid rgba(0, 0, 0, 0.12)",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
              }}
              id="link-explore-templates"
            >
              <LayoutTemplate size={16} />
              Jelajahi Template
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const semesterPlans = data.roadmap.currentVersion?.semesterPlans ?? [];
  const calc = data.calculation;
  const profile = data.profile;

  // Determine user's major catalog or default
  const majorKey = profile?.programName?.includes("Manajemen") ? "Manajemen" : "Teknik Informatika";
  const catalogList = CURRICULUM_CATALOG[majorKey] ?? CURRICULUM_CATALOG["Teknik Informatika"];

  // 1. Kelompok Mata Kuliah (Wajib/Inti, Pilihan, Pengulangan, Prasyarat)
  const coursesInGroup = catalogList.filter((c) => {
    if (courseGroup === "wajib") {
      return (
        c.semesterNum === addItemSemester ||
        (c.category === "akademik" && (!c.prerequisites || c.prerequisites.length === 0) && Math.abs(c.semesterNum - addItemSemester) <= 1)
      );
    }
    if (courseGroup === "pilihan") {
      return (
        c.category === "tak" ||
        c.category === "karier" ||
        c.code.includes("3103") ||
        c.code.includes("3104") ||
        c.code.includes("3204") ||
        c.code.includes("4101") ||
        c.code.includes("4202") ||
        (c.semesterNum >= 5 && c.credits <= 3 && !c.name.includes("Tugas Akhir"))
      );
    }
    if (courseGroup === "pengulangan") {
      return addItemSemester > 1 ? c.semesterNum < addItemSemester : c.semesterNum === 1;
    }
    if (courseGroup === "prasyarat") {
      return (
        (c.prerequisites && c.prerequisites.length > 0) ||
        catalogList.some((other) => other.prerequisites?.includes(c.code))
      );
    }
    return true;
  });

  const filteredCatalog = coursesInGroup.filter((c) => {
    const q = catalogSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    );
  });

  const countWajib = catalogList.filter((c) => c.semesterNum === addItemSemester || (c.category === "akademik" && (!c.prerequisites || c.prerequisites.length === 0) && Math.abs(c.semesterNum - addItemSemester) <= 1)).length;
  const countPilihan = catalogList.filter((c) => c.category === "tak" || c.category === "karier" || c.code.includes("3103") || c.code.includes("3104") || c.code.includes("3204") || c.code.includes("4101") || c.code.includes("4202") || (c.semesterNum >= 5 && c.credits <= 3 && !c.name.includes("Tugas Akhir"))).length;
  const countPengulangan = catalogList.filter((c) => (addItemSemester > 1 ? c.semesterNum < addItemSemester : c.semesterNum === 1)).length;
  const countPrasyarat = catalogList.filter((c) => (c.prerequisites && c.prerequisites.length > 0) || catalogList.some((other) => other.prerequisites?.includes(c.code))).length;

  // Calculate comprehensive metrics
  const totalCurriculum = profile?.totalCurriculumCredits ?? 144;
  const completedCredits = calc?.creditsByStatus?.done ?? profile?.completedCredits ?? 0;
  const inProgressCredits = calc?.creditsByStatus?.in_progress ?? 0;
  const plannedCredits = calc?.creditsByStatus?.planned ?? 0;
  const remainingCredits = Math.max(0, totalCurriculum - completedCredits - inProgressCredits);

  // Count milestones vs courses
  const allTasks = semesterPlans.flatMap((p) => p.tasks);
  const totalCourses = allTasks.filter((t) => t.credits > 0).length;
  const totalMilestones = allTasks.filter((t) => t.credits === 0).length;
  const retakeCount = allTasks.filter((t) => t.status === "delayed" || t.status === "cancelled").length;

  // Validation issues grouping (Errors, Warnings, Unverified)
  const validationIssues = data.ruleValidation?.issues ?? calc?.issues ?? [];
  const errorIssues = validationIssues.filter((i) => i.type === "error");
  const warningIssues = validationIssues.filter((i) => i.type === "warning");
  const unverifiedIssues = validationIssues.filter((i) => i.type === "info" || i.code === "MISSING_DATA");
  const totalIssuesCount = validationIssues.length;
  const hasErrors = errorIssues.length > 0;
  const hasWarnings = warningIssues.length > 0;

  const isEditOrDraft = data.roadmap.isDraftMode || activeMode === "edit";

  return (
    <div>
      {/* ── Page Header & Dua Aksi Utama ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", margin: 0 }}>
              Roadmap Akademik
            </h1>
            <span className="badge badge-gray" style={{ fontSize: 10 }}>
              v{data.roadmap.currentVersion?.versionNum ?? 1}
            </span>
            {data.roadmap.isDraftMode && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: "rgba(245, 158, 11, 0.15)",
                  color: "#B45309",
                  border: "1px solid rgba(245, 158, 11, 0.35)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-sm)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <FileEdit size={10} /> Draf Aktif
              </span>
            )}
            {data.roadmap.currentVersion?.label?.includes("Template") && (
              <span className="badge badge-blue" style={{ fontSize: 10 }}>
                Template
              </span>
            )}
          </div>
          <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "4px 0 0" }}>
            {profile?.institutionName} • {profile?.programName} • Angkatan {profile?.entryYear}
          </p>
        </div>

        {/* Action Group: Dua Aksi Utama & Menu Sekunder */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", position: "relative" }}>
          {isEditOrDraft ? (
            <>
              {/* Tombol Simpan Perubahan */}
              <button
                onClick={handleSaveDraft}
                className="btn btn-primary btn-sm"
                style={{ gap: 6, fontSize: 12.5, fontWeight: 700 }}
                id="btn-save-draft"
                title="Terapkan seluruh perubahan ke roadmap aktif"
              >
                <Check size={14} />
                <span>Simpan Perubahan</span>
              </button>

              {/* Tombol Batalkan */}
              <button
                onClick={() => handleCancelDraft(false)}
                className="btn btn-secondary btn-sm"
                style={{ gap: 6, fontSize: 12.5 }}
                id="btn-cancel-draft"
                title="Batalkan perubahan dan kembali ke roadmap tersimpan"
              >
                <RotateCcw size={13} />
                <span>Batalkan</span>
              </button>
            </>
          ) : (
            /* Aksi Utama 1: Sesuaikan Roadmap */
            <button
              onClick={handleStartEditAndDraft}
              className="btn btn-primary btn-sm"
              style={{ gap: 6, fontSize: 12.5, fontWeight: 700 }}
              id="btn-adjust-roadmap"
              title="Mulai penyesuaian susunan roadmap secara aman dalam draf"
            >
              <SlidersHorizontal size={13} />
              <span>Sesuaikan Roadmap</span>
            </button>
          )}

          {/* Aksi Utama 2: Simulasi What-If */}
          <Link
            href="/app/simulator"
            className="btn btn-secondary btn-sm"
            style={{ gap: 6, fontSize: 12.5, fontWeight: 600 }}
            id="btn-link-what-if"
            title="Coba skenario magang, cuti, atau percepatan tanpa mengubah roadmap utama"
          >
            <Compass size={13} color="#475569" />
            <span>Simulasi What-If</span>
          </Link>

          {/* Menu Sekunder (Dropdown: Template, Riwayat, Kosongkan) */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowSecondaryMenu(!showSecondaryMenu)}
              className="btn btn-ghost btn-sm"
              style={{
                padding: "6px 9px",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
              }}
              id="btn-secondary-menu"
              aria-expanded={showSecondaryMenu}
              title="Opsi Tambahan (Template, Riwayat, Kosongkan)"
            >
              <MoreHorizontal size={16} />
            </button>

            {showSecondaryMenu && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 40 }}
                  onClick={() => setShowSecondaryMenu(false)}
                />
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 6px)",
                    width: 215,
                    background: "#FFFFFF",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "0 10px 28px rgba(0,0,0,0.12)",
                    zIndex: 50,
                    padding: 5,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <button
                    onClick={() => {
                      setShowSecondaryMenu(false);
                      setTargetSemesterForApply(0);
                      setSelectedTemplateForApply(null);
                      setShowTemplatePicker(true);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 10px",
                      fontSize: 12.5,
                      fontWeight: 600,
                      background: "transparent",
                      border: "none",
                      color: "var(--text-primary)",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                    }}
                  >
                    <LayoutTemplate size={14} color="var(--blue)" />
                    <span>Jelajahi Template</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowSecondaryMenu(false);
                      setShowHistory(!showHistory);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 10px",
                      fontSize: 12.5,
                      fontWeight: 600,
                      background: "transparent",
                      border: "none",
                      color: "var(--text-primary)",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                    }}
                  >
                    <History size={14} />
                    <span>Riwayat Versi Roadmap</span>
                  </button>

                  <div style={{ height: 1, background: "var(--border-subtle)", margin: "3px 0" }} />

                  <button
                    onClick={() => {
                      setShowSecondaryMenu(false);
                      handleClearRoadmap();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 10px",
                      fontSize: 12.5,
                      fontWeight: 600,
                      background: "transparent",
                      border: "none",
                      color: "var(--coral)",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Kosongkan Roadmap</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mode Draf Rencana Aktif Banner (Minimalist & Responsive) ── */}
      {isEditOrDraft && (
        <div
          style={{
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "var(--radius-md)",
            padding: "10px 16px",
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FileEdit size={16} color="#D97706" />
            <div>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)" }}>
                Mode Penyesuaian Draf Aktif:
              </span>{" "}
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Kamu dapat menambah item, mengedit beban SKS, atau memindahkan semester. Roadmap tersimpan tidak akan berubah hingga kamu menyimpan.
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => handleCancelDraft(false)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: 11.5, gap: 5 }}
            >
              <RotateCcw size={12} />
              Batalkan
            </button>
            <button
              onClick={handleSaveDraft}
              className="btn btn-primary btn-sm"
              style={{ fontSize: 11.5, gap: 5, fontWeight: 700 }}
            >
              <Check size={12} />
              Simpan Perubahan
            </button>
          </div>
        </div>
      )}

      {/* ── Version History Drawer (Conditional) ── */}
      {showHistory && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Riwayat Versi Roadmap
            </h2>
            <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
              Klik versi untuk beralih aktif
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.roadmap.versions.map((v) => {
              const isActive = v.id === data.roadmap?.currentVersion?.id;
              return (
                <div
                  key={v.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 12px",
                    background: isActive ? "rgba(133,136,255,0.06)" : "var(--bg-secondary)",
                    border: isActive ? "1px solid var(--blue)" : "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>
                        v{v.versionNum} : {v.label ?? "Tanpa judul"}
                      </span>
                      {v.isBaseline && <span className="badge badge-lime">Baseline</span>}
                      {v.label?.includes("Template") && <span className="badge badge-blue">Template</span>}
                      {isActive && <span className="badge badge-teal">Aktif</span>}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
                      Dibuat pada {new Date(v.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  {!isActive && (
                    <button className="btn btn-secondary btn-sm" onClick={() => switchVersion(v.id)}>
                      Jadikan Aktif
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Ringkasan SKS Akademik (Lulus, Sedang Ditempuh, Direncanakan, Sisa) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 12,
          marginBottom: 14,
        }}
      >
        {/* 1. SKS Lulus */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "12px 14px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              SKS Lulus
            </span>
            <span style={{ fontSize: 11, color: completedCredits > 0 ? "#15803D" : "var(--text-muted)", fontWeight: 700 }}>
              {Math.round((completedCredits / totalCurriculum) * 100)}%
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#18181B", lineHeight: 1.2 }}>
            {completedCredits} <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>/ {totalCurriculum} SKS</span>
          </div>
          <div className="progress-track" style={{ height: 4, marginTop: 8 }}>
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(100, (completedCredits / totalCurriculum) * 100)}%`,
                background: "#15803D",
              }}
            />
          </div>
        </div>

        {/* 2. Sedang Ditempuh */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "12px 14px",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
            Sedang Ditempuh
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#18181B", lineHeight: 1.2 }}>
            {inProgressCredits} <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>SKS</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
            Semester {profile?.currentSemester ?? 1} Berjalan
          </div>
        </div>

        {/* 3. Direncanakan */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "12px 14px",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
            Direncanakan
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#18181B", lineHeight: 1.2 }}>
            {plannedCredits} <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>SKS</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
            {totalCourses} Matkul • {totalMilestones} Milestone
          </div>
        </div>

        {/* 4. Sisa Beban Target */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "12px 14px",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
            Sisa Beban
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
            {remainingCredits} <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>SKS</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
            Target: <strong>Sem {calc?.estimatedGraduationSemester || 8}</strong>
          </div>
        </div>
      </div>

      {/* ── Indikator Validasi Akademik (Ringkas & Collapsible Detail) ── */}
      <div
        style={{
          background: "#FFFFFF",
          border: hasErrors
            ? "1px solid #FECACA"
            : "1px solid var(--border)",
          borderRadius: "12px",
          padding: "10px 16px",
          marginBottom: 16,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
            {hasErrors ? (
              <AlertCircle size={16} color="#DC2626" />
            ) : hasWarnings ? (
              <AlertTriangle size={16} color="#D97706" />
            ) : (
              <ShieldCheck size={16} color="#16A34A" />
            )}
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
              Validasi Aturan Akademik:
            </span>

            {/* Badges */}
            {hasErrors && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: "#FEE2E2",
                  color: "#991B1B",
                  border: "1px solid #FCA5A5",
                  padding: "2px 8px",
                  borderRadius: "20px",
                }}
              >
                {errorIssues.length} Kesalahan
              </span>
            )}

            {hasWarnings && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: "#FEF3C7",
                  color: "#92400E",
                  border: "1px solid #FCD34D",
                  padding: "2px 8px",
                  borderRadius: "20px",
                }}
              >
                {warningIssues.length} Peringatan
              </span>
            )}

            {unverifiedIssues.length > 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  background: "#EEF2FF",
                  color: "#4338CA",
                  border: "1px solid #C7D2FE",
                  padding: "2px 8px",
                  borderRadius: "20px",
                }}
              >
                {unverifiedIssues.length} Aturan Belum Terverifikasi
              </span>
            )}

            {totalIssuesCount === 0 && (
              <span style={{ fontSize: 12.5, color: "#15803D", fontWeight: 600 }}>
                Semua rencana memenuhi regulasi (maksimal 24 SKS & prasyarat runtut).
              </span>
            )}
          </div>

          {/* Toggle Details Button */}
          <button
            onClick={() => setShowValidationDetails(!showValidationDetails)}
            className="btn btn-ghost btn-sm"
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              gap: 4,
              padding: "4px 9px",
              color: "#475569",
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "6px",
            }}
          >
            <span>{showValidationDetails ? "Tutup Detail" : "Lihat Detail"}</span>
            {showValidationDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* Collapsible Details Drawer */}
        {showValidationDetails && (
          <div
            style={{
              borderTop: "1px dashed rgba(0,0,0,0.12)",
              paddingTop: 10,
              marginTop: 2,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {/* 1. Kesalahan */}
            {errorIssues.length > 0 && (
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#991B1B", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
                  <AlertCircle size={13} /> Kesalahan (Wajib Diperbaiki):
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {errorIssues.map((iss, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: 12,
                        color: "#991B1B",
                        background: "#FFFFFF",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid #FCA5A5",
                      }}
                    >
                      {iss.semesterNum ? `[Sem ${iss.semesterNum}] ` : ""}{iss.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Peringatan */}
            {warningIssues.length > 0 && (
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#92400E", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
                  <AlertTriangle size={13} /> Peringatan (Perlu Perhatian):
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {warningIssues.map((iss, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: 12,
                        color: "#92400E",
                        background: "#FFFFFF",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid #FDE68A",
                      }}
                    >
                      {iss.semesterNum ? `[Sem ${iss.semesterNum}] ` : ""}{iss.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Aturan Belum Terverifikasi / Disclaimer */}
            <div
              style={{
                fontSize: 11.5,
                color: "#475569",
                background: "#FFFFFF",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "flex-start",
                gap: 7,
                lineHeight: 1.5,
              }}
            >
              <Info size={14} style={{ flexShrink: 0, marginTop: 1, color: "#4F46E5" }} />
              <span>
                <strong>Transparansi Aturan:</strong> Batas beban SKS semester (maks. 24 SKS nasional) dan dependensi prasyarat dihitung berdasarkan regulasi akademik nasional & kurikulum program studi terdaftar.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Minimalist Segmented View Switcher & Helper ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            background: "#EAE6DF",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: "var(--radius-pill)",
            padding: "4px",
            gap: 3,
          }}
        >
          <button
            onClick={() => setActiveView("visual")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: "var(--radius-pill)",
              fontSize: 12,
              fontWeight: activeView === "visual" ? 700 : 600,
              border: "none",
              cursor: "pointer",
              background: activeView === "visual" ? "#FFFFFF" : "transparent",
              color: activeView === "visual" ? "#0F172A" : "#64748B",
              boxShadow: activeView === "visual" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
            id="tab-view-visual"
          >
            <GitBranch size={13} color={activeView === "visual" ? "#0F172A" : "#64748B"} />
            <span>Peta Alur Visual</span>
          </button>

          <button
            onClick={() => setActiveView("timeline")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: "var(--radius-pill)",
              fontSize: 12,
              fontWeight: activeView === "timeline" ? 700 : 600,
              border: "none",
              cursor: "pointer",
              background: activeView === "timeline" ? "#FFFFFF" : "transparent",
              color: activeView === "timeline" ? "#0F172A" : "#64748B",
              boxShadow: activeView === "timeline" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
            id="tab-view-timeline"
          >
            <Calendar size={13} color={activeView === "timeline" ? "#0F172A" : "#64748B"} />
            <span>Daftar Semester</span>
          </button>

          <button
            onClick={() => setActiveView("split")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: "var(--radius-pill)",
              fontSize: 12,
              fontWeight: activeView === "split" ? 700 : 600,
              border: "none",
              cursor: "pointer",
              background: activeView === "split" ? "#FFFFFF" : "transparent",
              color: activeView === "split" ? "#0F172A" : "#64748B",
              boxShadow: activeView === "split" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
            id="tab-view-split"
          >
            <Columns2 size={13} color={activeView === "split" ? "#0F172A" : "#64748B"} />
            <span>Berdampingan</span>
          </button>
        </div>

        {/* Mode Indicator */}
        {activeMode === "edit" ? (
          <div style={{ fontSize: 12, color: "#92400E", display: "flex", alignItems: "center", gap: 7, fontWeight: 600, background: "#FEF3C7", padding: "5px 12px", borderRadius: "var(--radius-pill)", border: "1px solid #FCD34D" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#D97706" }} />
            <span>Mode penyesuaian aktif: klik matkul atau tombol tambah untuk mengubah susunan</span>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "#64748B" }}>
            {activeView === "visual" && "Geser horizontal untuk melihat alur 8 semester"}
          </div>
        )}
      </div>

      {/* ── VIEW 1: TIMELINE VIEW ── */}
      {activeView === "timeline" && (
        <div>
          {/* Status Filter Bar & Sole Expand/Collapse Control */}
          {activeMode === "view" && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 11.5, color: "var(--text-muted)", marginRight: 4, fontWeight: 600 }}>Filter Status:</span>
                {[
                  { id: "all", label: "Semua Item" },
                  { id: "done", label: `Selesai (${completedCredits} SKS)` },
                  { id: "in_progress", label: "Sedang Berjalan" },
                  { id: "planned", label: "Direncanakan" },
                  { id: "delayed", label: `Perlu Diulang ${retakeCount > 0 ? `(${retakeCount})` : ""}` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: 11.5,
                      fontWeight: 600,
                      border: statusFilter === f.id ? "1px solid #18181B" : "1px solid var(--border)",
                      background: statusFilter === f.id ? "#18181B" : "#FFFFFF",
                      color: statusFilter === f.id ? "#FFFFFF" : "var(--text-secondary)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      boxShadow: statusFilter === f.id ? "0 1px 3px rgba(0, 0, 0, 0.12)" : "none",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={expandAll} style={{ fontSize: 11.5, padding: "4px 8px" }}>
                  Buka Semua
                </button>
                <button className="btn btn-ghost btn-sm" onClick={collapseAll} style={{ fontSize: 11.5, padding: "4px 8px" }}>
                  Tutup Semua
                </button>
              </div>
            </div>
          )}

          {/* Timeline List of Semester Cards */}
          <div className="roadmap-timeline" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {semesterPlans.map((plan) => {
              const displayTasks = plan.tasks.filter((t) => {
                if (activeMode === "edit" || statusFilter === "all") return true;
                return t.status === statusFilter;
              });

              return (
                <SemesterCardItem
                  key={plan.semesterNum}
                  plan={plan}
                  displayTasks={displayTasks}
                  profile={profile}
                  mode={activeMode}
                  isExpanded={expandedSemesters.has(plan.semesterNum)}
                  onToggle={() => toggleSemester(plan.semesterNum)}
                  editingTaskId={editingTaskId}
                  onEditTaskId={setEditingTaskId}
                  onUpdateTask={handleUpdateTask}
                  onMoveTask={handleMoveTask}
                  onDeleteTask={handleDeleteTask}
                  onUpdateTarget={handleUpdateSemesterTarget}
                  onOpenAddItem={(tab) => openAddItemModal(plan.semesterNum, tab)}
                  onOpenAddCourse={() => {
                    setAddCourseSemester(plan.semesterNum);
                    setShowAddCourseModal(true);
                  }}
                  onOpenAddMilestone={() => {
                    setAddMilestoneSemester(plan.semesterNum);
                    setShowAddMilestoneModal(true);
                  }}
                  onOpenTemplate={() => {
                    setTargetSemesterForApply(plan.semesterNum);
                    setSelectedTemplateForApply(null);
                    setShowTemplatePicker(true);
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ── VIEW 2: INTERACTIVE VISUAL ROADMAP VIEW (Seamlessly Connected to Timeline) ── */}
      {activeView === "visual" && (
        <InteractiveVisualRoadmap
          semesterPlans={semesterPlans}
          profile={profile}
          mode={activeMode}
          editingTaskId={editingTaskId}
          onEditTaskId={setEditingTaskId}
          onUpdateTask={handleUpdateTask}
          onMoveTask={handleMoveTask}
          onDeleteTask={handleDeleteTask}
          onOpenAddItem={(semNum, tab) => openAddItemModal(semNum, tab)}
          onOpenAddCourse={(semNum) => {
            setAddCourseSemester(semNum);
            setShowAddCourseModal(true);
          }}
          onOpenAddMilestone={(semNum) => {
            setAddMilestoneSemester(semNum);
            setShowAddMilestoneModal(true);
          }}
          onUpdateTarget={handleUpdateSemesterTarget}
        />
      )}

      {/* ── VIEW 3: SPLIT / BERDAMPINGAN VIEW ── */}
      {activeView === "split" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))",
            gap: 20,
            alignItems: "start",
          }}
        >
          {/* Column 1: Timeline View */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FileText size={15} color="var(--text-secondary)" />
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  Daftar Semester
                </h2>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={expandAll} style={{ fontSize: 11, padding: "2px 8px" }}>
                  Buka Semua
                </button>
                <button className="btn btn-ghost btn-sm" onClick={collapseAll} style={{ fontSize: 11, padding: "2px 8px" }}>
                  Tutup Semua
                </button>
              </div>
            </div>

            <div className="roadmap-timeline" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {semesterPlans.map((plan) => (
                <SemesterCardItem
                  key={plan.semesterNum}
                  plan={plan}
                  displayTasks={plan.tasks}
                  profile={profile}
                  mode={activeMode}
                  isExpanded={expandedSemesters.has(plan.semesterNum)}
                  onToggle={() => toggleSemester(plan.semesterNum)}
                  editingTaskId={editingTaskId}
                  onEditTaskId={setEditingTaskId}
                  onUpdateTask={handleUpdateTask}
                  onMoveTask={handleMoveTask}
                  onDeleteTask={handleDeleteTask}
                  onUpdateTarget={handleUpdateSemesterTarget}
                  onOpenAddItem={(tab) => openAddItemModal(plan.semesterNum, tab)}
                  onOpenAddCourse={() => {
                    setAddCourseSemester(plan.semesterNum);
                    setShowAddCourseModal(true);
                  }}
                  onOpenAddMilestone={() => {
                    setAddMilestoneSemester(plan.semesterNum);
                    setShowAddMilestoneModal(true);
                  }}
                  onOpenTemplate={() => {
                    setTargetSemesterForApply(plan.semesterNum);
                    setSelectedTemplateForApply(null);
                    setShowTemplatePicker(true);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Column 2: Visual Roadmap Canvas */}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <GitBranch size={15} color="var(--text-secondary)" />
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  Peta Alur Visual
                </h2>
              </div>
            </div>

              <InteractiveVisualRoadmap
                semesterPlans={semesterPlans}
                profile={profile}
                mode={activeMode}
                editingTaskId={editingTaskId}
                onEditTaskId={setEditingTaskId}
                onUpdateTask={handleUpdateTask}
                onMoveTask={handleMoveTask}
                onDeleteTask={handleDeleteTask}
                onOpenAddItem={(semNum, tab) => openAddItemModal(semNum, tab)}
                onOpenAddCourse={(semNum) => {
                  setAddCourseSemester(semNum);
                  setShowAddCourseModal(true);
                }}
                onOpenAddMilestone={(semNum) => {
                  setAddMilestoneSemester(semNum);
                  setShowAddMilestoneModal(true);
                }}
                onUpdateTarget={handleUpdateSemesterTarget}
              />
            </div>
          </div>
        )}

      {/* ── Modal: Tambah Item Roadmap (COURSE, ACTIVITY, MILESTONE) ── */}
      {showAddItemModal && (
        <div
          className="dialog-overlay"
          onClick={() => setShowAddItemModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="dialog"
            style={{ maxWidth: 720, maxHeight: "90vh", overflowY: "auto", padding: "24px 26px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 19, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                  Tambah Item ke Semester {addItemSemester}
                </h2>
                <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.4 }}>
                  Kelola mata kuliah kurikulum, kegiatan di luar perkuliahan, atau target milestone akademik penting.
                </p>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowAddItemModal(false)}
                style={{ padding: 6, borderRadius: "var(--radius-sm)" }}
                aria-label="Tutup modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* 3 Main Category Tabs */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 6,
                background: "rgba(0, 0, 0, 0.04)",
                padding: 4,
                borderRadius: "var(--radius-md)",
                marginBottom: 16,
              }}
            >
              <button
                onClick={() => setItemModalTab("COURSE")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "9px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  transition: "all 0.15s ease",
                  background: itemModalTab === "COURSE" ? "#FFFFFF" : "transparent",
                  color: itemModalTab === "COURSE" ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow: itemModalTab === "COURSE" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                }}
              >
                <BookOpen size={15} color={itemModalTab === "COURSE" ? "var(--amber-deep)" : "var(--text-muted)"} />
                <span>Mata Kuliah</span>
              </button>

              <button
                onClick={() => setItemModalTab("ACTIVITY")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "9px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  transition: "all 0.15s ease",
                  background: itemModalTab === "ACTIVITY" ? "#FFFFFF" : "transparent",
                  color: itemModalTab === "ACTIVITY" ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow: itemModalTab === "ACTIVITY" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                }}
              >
                <Briefcase size={15} color={itemModalTab === "ACTIVITY" ? "var(--blue)" : "var(--text-muted)"} />
                <span>Kegiatan Mahasiswa</span>
              </button>

              <button
                onClick={() => setItemModalTab("MILESTONE")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "9px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  transition: "all 0.15s ease",
                  background: itemModalTab === "MILESTONE" ? "#FFFFFF" : "transparent",
                  color: itemModalTab === "MILESTONE" ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow: itemModalTab === "MILESTONE" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                }}
              >
                <Target size={15} color={itemModalTab === "MILESTONE" ? "var(--teal)" : "var(--text-muted)"} />
                <span>Milestone &amp; Target</span>
              </button>
            </div>

            {/* ═════════════════════════════════════════════════════════════════════ */}
            {/* TAB 1: MATA KULIAH (COURSE) */}
            {/* ═════════════════════════════════════════════════════════════════════ */}
            {itemModalTab === "COURSE" && (
              <div>
                {/* Guidance Banner */}
                <div
                  style={{
                    background: "rgba(245, 205, 71, 0.12)",
                    border: "1px solid rgba(217, 119, 6, 0.25)",
                    borderRadius: "var(--radius-md)",
                    padding: "10px 14px",
                    marginBottom: 16,
                    fontSize: 12.5,
                    color: "#92400E",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Info size={15} style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Pilih kelompok mata kuliah</strong>, bukan langsung mencari setiap mata kuliah.
                  </span>
                </div>

                {/* 4 CARDS: Wajib / Inti, Pilihan, Pengulangan, Prasyarat */}
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {[
                    {
                      key: "wajib",
                      title: "Wajib / Inti",
                      desc: "Mata kuliah kurikulum pokok yang wajib diselesaikan untuk pemenuhan syarat kelulusan program studi.",
                      tag: "3 SKS • Kurikulum Pokok",
                      defaultCredits: 3,
                      category: "wajib",
                      defaultTitle: "Mata Kuliah Wajib / Inti",
                      icon: <BookOpen size={20} color="#D97706" />,
                      iconBg: "rgba(245, 158, 11, 0.14)",
                    },
                    {
                      key: "pilihan",
                      title: "Pilihan",
                      desc: "Mata kuliah peminatan, elektif bebas, atau pengayaan keahlian spesifik program studi.",
                      tag: "3 SKS • Peminatan & Elektif",
                      defaultCredits: 3,
                      category: "pilihan",
                      defaultTitle: "Mata Kuliah Pilihan",
                      icon: <Layers size={20} color="#2563EB" />,
                      iconBg: "rgba(59, 130, 246, 0.14)",
                    },
                    {
                      key: "pengulangan",
                      title: "Pengulangan",
                      desc: "Mengulang mata kuliah untuk perbaikan indeks prestasi atau pemenuhan batas minimal kelulusan.",
                      tag: "3 SKS • Perbaikan Nilai",
                      defaultCredits: 3,
                      category: "pengulangan",
                      defaultTitle: "Pengulangan Mata Kuliah",
                      icon: <RotateCcw size={20} color="#EA580C" />,
                      iconBg: "rgba(234, 88, 12, 0.14)",
                    },
                    {
                      key: "prasyarat",
                      title: "Prasyarat",
                      desc: "Mata kuliah fondasi yang menjadi syarat wajib sebelum mengambil mata kuliah lanjutan berantai.",
                      tag: "3 SKS • Syarat Matkul Lanjutan",
                      defaultCredits: 3,
                      category: "prasyarat",
                      defaultTitle: "Mata Kuliah Prasyarat",
                      icon: <GitBranch size={20} color="#059669" />,
                      iconBg: "rgba(16, 185, 129, 0.14)",
                    },
                  ].map((card) => {
                    const isCustomizing = customizingCardKey === card.key;
                    return (
                      <div
                        key={card.key}
                        style={{
                          background: "#FFFFFF",
                          border: isCustomizing ? "1.5px solid var(--amber-deep)" : "1px solid var(--border-subtle)",
                          borderRadius: "var(--radius-md)",
                          padding: "14px 16px",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                          {/* Left Icon + Text */}
                          <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                width: 42,
                                height: 42,
                                borderRadius: 10,
                                background: card.iconBg,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {card.icon}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                                <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                                  {card.title}
                                </h3>
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    color: "var(--text-secondary)",
                                    background: "rgba(0,0,0,0.05)",
                                    padding: "2px 7px",
                                    borderRadius: 6,
                                  }}
                                >
                                  {card.tag}
                                </span>
                              </div>
                              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                                {card.desc}
                              </p>
                            </div>
                          </div>

                          {/* Right Action Buttons */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                if (isCustomizing) {
                                  setCustomizingCardKey(null);
                                } else {
                                  setCustomizingCardKey(card.key);
                                  setCustomItemTitle(card.defaultTitle);
                                  setCustomItemCredits(card.defaultCredits);
                                }
                              }}
                              style={{ fontSize: 11.5, padding: "6px 10px", color: "var(--text-secondary)" }}
                            >
                              {isCustomizing ? "Batal" : "Kustom Nama"}
                            </button>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() =>
                                handleAddItem({
                                  semesterNum: addItemSemester,
                                  itemType: "COURSE",
                                  title: card.defaultTitle,
                                  category: card.category,
                                  credits: card.defaultCredits,
                                })
                              }
                              style={{ gap: 4, fontSize: 12, padding: "6px 14px", fontWeight: 700 }}
                            >
                              <Plus size={13} /> Pasang
                            </button>
                          </div>
                        </div>

                        {/* Inline Customization Form */}
                        {isCustomizing && (
                          <div
                            style={{
                              marginTop: 12,
                              paddingTop: 12,
                              borderTop: "1px dashed var(--border)",
                              display: "flex",
                              gap: 10,
                              alignItems: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 200 }}>
                              <input
                                type="text"
                                className="form-input"
                                placeholder={`Nama mata kuliah spesifik (misal: ${card.title} - Basis Data)`}
                                value={customItemTitle}
                                onChange={(e) => setCustomItemTitle(e.target.value)}
                                style={{ fontSize: 12.5, padding: "7px 10px", width: "100%" }}
                              />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>SKS:</span>
                              <input
                                type="number"
                                className="form-input"
                                min={1}
                                max={6}
                                value={customItemCredits}
                                onChange={(e) => setCustomItemCredits(parseInt(e.target.value) || 3)}
                                style={{ width: 62, fontSize: 12.5, padding: "7px 8px", textAlign: "center" }}
                              />
                            </div>
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={!customItemTitle.trim()}
                              onClick={() => {
                                handleAddItem({
                                  semesterNum: addItemSemester,
                                  itemType: "COURSE",
                                  title: customItemTitle.trim(),
                                  category: card.category,
                                  credits: customItemCredits,
                                });
                                setCustomizingCardKey(null);
                              }}
                              style={{ fontSize: 12, padding: "7px 14px" }}
                            >
                              Simpan ke Sem {addItemSemester}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════════ */}
            {/* TAB 2: KEGIATAN MAHASISWA (ACTIVITY) */}
            {/* ═════════════════════════════════════════════════════════════════════ */}
            {itemModalTab === "ACTIVITY" && (
              <div>
                {/* Guidance Banner */}
                <div
                  style={{
                    background: "rgba(59, 130, 246, 0.08)",
                    border: "1px solid rgba(59, 130, 246, 0.25)",
                    borderRadius: "var(--radius-md)",
                    padding: "10px 14px",
                    marginBottom: 16,
                    fontSize: 12.5,
                    color: "#1E40AF",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Info size={15} style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Untuk kegiatan di luar perkuliahan.</strong> Secara default bernilai 0 SKS agar beban akademik murni.
                  </span>
                </div>

                {/* 5 CARDS: Organisasi, Kompetisi, Sertifikasi, Proyek / Portofolio, Pengabdian */}
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {[
                    {
                      key: "organisasi",
                      title: "Organisasi",
                      desc: "Kepengurusan BEM, himpunan mahasiswa (HMJ), unit kegiatan mahasiswa (UKM), atau kepanitiaan.",
                      tag: "0 SKS • Kepemimpinan & Soft Skill",
                      category: "organisasi",
                      defaultTitle: "Kegiatan Organisasi Kampus",
                      icon: <Users size={20} color="#2563EB" />,
                      iconBg: "rgba(59, 130, 246, 0.14)",
                    },
                    {
                      key: "kompetisi",
                      title: "Kompetisi",
                      desc: "Partisipasi perlombaan akademik dan inovasi (PKM, Gemastik, Hackathon, LKTI, atau lomba minat).",
                      tag: "0 SKS • Prestasi & Lomba",
                      category: "kompetisi",
                      defaultTitle: "Kompetisi & Lomba Mahasiswa",
                      icon: <Target size={20} color="#D97706" />,
                      iconBg: "rgba(245, 158, 11, 0.14)",
                    },
                    {
                      key: "sertifikasi",
                      title: "Sertifikasi",
                      desc: "Ujian sertifikasi keahlian profesional industri, lisensi profesi terstandarisasi, atau uji kemahiran bahasa.",
                      tag: "0 SKS • Lisensi & Standar Industri",
                      category: "sertifikasi",
                      defaultTitle: "Sertifikasi Kompetensi Profesional",
                      icon: <CheckCircle2 size={20} color="#15803D" />,
                      iconBg: "rgba(22, 163, 74, 0.14)",
                    },
                    {
                      key: "proyek",
                      title: "Proyek / Portofolio",
                      desc: "Pengerjaan produk aplikasi mandiri, riset laboratorium, capstone project, atau karya portofolio karier.",
                      tag: "0 SKS • Karya Nyata Portofolio",
                      category: "proyek",
                      defaultTitle: "Proyek & Portofolio Mahasiswa",
                      icon: <Briefcase size={20} color="#7C3AED" />,
                      iconBg: "rgba(124, 58, 237, 0.14)",
                    },
                    {
                      key: "pengabdian",
                      title: "Pengabdian",
                      desc: "Kuliah Kerja Nyata (KKN), bakti sosial kemasyarakatan, kampus mengajar, atau program kerelawanan.",
                      tag: "0 SKS • Dampak Sosial & KKN",
                      category: "pengabdian",
                      defaultTitle: "Pengabdian Masyarakat / KKN",
                      icon: <Building2 size={20} color="#DC2626" />,
                      iconBg: "rgba(220, 38, 38, 0.14)",
                    },
                  ].map((card) => {
                    const isCustomizing = customizingCardKey === card.key;
                    return (
                      <div
                        key={card.key}
                        style={{
                          background: "#FFFFFF",
                          border: isCustomizing ? "1.5px solid var(--blue)" : "1px solid var(--border-subtle)",
                          borderRadius: "var(--radius-md)",
                          padding: "14px 16px",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                          {/* Left Icon + Text */}
                          <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                width: 42,
                                height: 42,
                                borderRadius: 10,
                                background: card.iconBg,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {card.icon}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                                <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                                  {card.title}
                                </h3>
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    color: "var(--text-secondary)",
                                    background: "rgba(0,0,0,0.05)",
                                    padding: "2px 7px",
                                    borderRadius: 6,
                                  }}
                                >
                                  {card.tag}
                                </span>
                              </div>
                              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                                {card.desc}
                              </p>
                            </div>
                          </div>

                          {/* Right Action Buttons */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                if (isCustomizing) {
                                  setCustomizingCardKey(null);
                                } else {
                                  setCustomizingCardKey(card.key);
                                  setCustomItemTitle(card.defaultTitle);
                                }
                              }}
                              style={{ fontSize: 11.5, padding: "6px 10px", color: "var(--text-secondary)" }}
                            >
                              {isCustomizing ? "Batal" : "Kustom Nama"}
                            </button>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() =>
                                handleAddItem({
                                  semesterNum: addItemSemester,
                                  itemType: "ACTIVITY",
                                  title: card.defaultTitle,
                                  category: card.category,
                                  credits: 0,
                                })
                              }
                              style={{ gap: 4, fontSize: 12, padding: "6px 14px", fontWeight: 700 }}
                            >
                              <Plus size={13} /> Pasang
                            </button>
                          </div>
                        </div>

                        {/* Inline Customization Form */}
                        {isCustomizing && (
                          <div
                            style={{
                              marginTop: 12,
                              paddingTop: 12,
                              borderTop: "1px dashed var(--border)",
                              display: "flex",
                              gap: 10,
                              alignItems: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 220 }}>
                              <input
                                type="text"
                                className="form-input"
                                placeholder={`Nama program kegiatan (misal: ${card.title} - Divisi Litbang)`}
                                value={customItemTitle}
                                onChange={(e) => setCustomItemTitle(e.target.value)}
                                style={{ fontSize: 12.5, padding: "7px 10px", width: "100%" }}
                              />
                            </div>
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={!customItemTitle.trim()}
                              onClick={() => {
                                handleAddItem({
                                  semesterNum: addItemSemester,
                                  itemType: "ACTIVITY",
                                  title: customItemTitle.trim(),
                                  category: card.category,
                                  credits: 0,
                                });
                                setCustomizingCardKey(null);
                              }}
                              style={{ fontSize: 12, padding: "7px 14px" }}
                            >
                              Simpan ke Sem {addItemSemester}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════════ */}
            {/* TAB 3: MILESTONE & TARGET (MILESTONE) */}
            {/* ═════════════════════════════════════════════════════════════════════ */}
            {itemModalTab === "MILESTONE" && (
              <div>
                {/* Guidance Banner */}
                <div
                  style={{
                    background: "rgba(13, 148, 136, 0.08)",
                    border: "1px solid rgba(13, 148, 136, 0.25)",
                    borderRadius: "var(--radius-md)",
                    padding: "10px 14px",
                    marginBottom: 16,
                    fontSize: 12.5,
                    color: "#0F766E",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Info size={15} style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Untuk pencapaian atau tenggat penting.</strong> Pantau tenggat rencana studi, bimbingan dosen wali, persiapan magang, dan target akademik.
                  </span>
                </div>

                {/* 4 CARDS: KRS, Konsultasi Dosen Wali, Persiapan Magang, Target Akademik */}
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {[
                    {
                      key: "krs",
                      title: "KRS",
                      desc: "Pengisian Kartu Rencana Studi semester, validasi akademik, dan penyesuaian jadwal kuliah.",
                      tag: "0 SKS • Tenggat Rencana Studi",
                      category: "krs",
                      defaultTitle: "Pengisian & Validasi KRS",
                      icon: <FileText size={20} color="#D97706" />,
                      iconBg: "rgba(245, 158, 11, 0.14)",
                    },
                    {
                      key: "dosen_wali",
                      title: "Konsultasi dosen wali",
                      desc: "Bimbingan akademik semesteran, evaluasi indeks prestasi, dan konsultasi progres kelulusan.",
                      tag: "0 SKS • Bimbingan Akademik Wajib",
                      category: "dosen_wali",
                      defaultTitle: "Konsultasi Dosen Wali",
                      icon: <GraduationCap size={20} color="#2563EB" />,
                      iconBg: "rgba(59, 130, 246, 0.14)",
                    },
                    {
                      key: "persiapan_magang",
                      title: "Persiapan magang",
                      desc: "Penyusunan berkas magang, portofolio industri, seleksi mitra perusahaan, atau program MBKM.",
                      tag: "0 SKS • Karier & Industri",
                      category: "persiapan_magang",
                      defaultTitle: "Persiapan Magang & MBKM",
                      icon: <Briefcase size={20} color="#0F766E" />,
                      iconBg: "rgba(13, 148, 136, 0.14)",
                    },
                    {
                      key: "target_akademik",
                      title: "Target akademik",
                      desc: "Target pencapaian IPK semester, kelulusan ujian kompetensi, atau target penyusunan skripsi.",
                      tag: "0 SKS • Sasaran Pribadi",
                      category: "target_akademik",
                      defaultTitle: "Target Akademik Semester",
                      icon: <Target size={20} color="#15803D" />,
                      iconBg: "rgba(22, 163, 74, 0.14)",
                    },
                  ].map((card) => {
                    const isCustomizing = customizingCardKey === card.key;
                    return (
                      <div
                        key={card.key}
                        style={{
                          background: "#FFFFFF",
                          border: isCustomizing ? "1.5px solid var(--teal)" : "1px solid var(--border-subtle)",
                          borderRadius: "var(--radius-md)",
                          padding: "14px 16px",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                          {/* Left Icon + Text */}
                          <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                width: 42,
                                height: 42,
                                borderRadius: 10,
                                background: card.iconBg,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {card.icon}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                                <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                                  {card.title}
                                </h3>
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    color: "var(--text-secondary)",
                                    background: "rgba(0,0,0,0.05)",
                                    padding: "2px 7px",
                                    borderRadius: 6,
                                  }}
                                >
                                  {card.tag}
                                </span>
                              </div>
                              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                                {card.desc}
                              </p>
                            </div>
                          </div>

                          {/* Right Action Buttons */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                if (isCustomizing) {
                                  setCustomizingCardKey(null);
                                } else {
                                  setCustomizingCardKey(card.key);
                                  setCustomItemTitle(card.defaultTitle);
                                }
                              }}
                              style={{ fontSize: 11.5, padding: "6px 10px", color: "var(--text-secondary)" }}
                            >
                              {isCustomizing ? "Batal" : "Kustom Nama"}
                            </button>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() =>
                                handleAddItem({
                                  semesterNum: addItemSemester,
                                  itemType: "MILESTONE",
                                  title: card.defaultTitle,
                                  category: card.category,
                                  credits: 0,
                                })
                              }
                              style={{ gap: 4, fontSize: 12, padding: "6px 14px", fontWeight: 700 }}
                            >
                              <Plus size={13} /> Pasang
                            </button>
                          </div>
                        </div>

                        {/* Inline Customization Form */}
                        {isCustomizing && (
                          <div
                            style={{
                              marginTop: 12,
                              paddingTop: 12,
                              borderTop: "1px dashed var(--border)",
                              display: "flex",
                              gap: 10,
                              alignItems: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 220 }}>
                              <input
                                type="text"
                                className="form-input"
                                placeholder={`Judul target spesifik (misal: ${card.title} - Target IPK 3.75)`}
                                value={customItemTitle}
                                onChange={(e) => setCustomItemTitle(e.target.value)}
                                style={{ fontSize: 12.5, padding: "7px 10px", width: "100%" }}
                              />
                            </div>
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={!customItemTitle.trim()}
                              onClick={() => {
                                handleAddItem({
                                  semesterNum: addItemSemester,
                                  itemType: "MILESTONE",
                                  title: customItemTitle.trim(),
                                  category: card.category,
                                  credits: 0,
                                });
                                setCustomizingCardKey(null);
                              }}
                              style={{ fontSize: 12, padding: "7px 14px" }}
                            >
                              Simpan ke Sem {addItemSemester}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
</div>
        </div>
      )}

      {/* ── Modal: Pasang Template Blueprint ── */}
      {showTemplatePicker && (
        <div
          className="dialog-overlay"
          onClick={() => {
            if (!isApplying) setShowTemplatePicker(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="dialog"
            style={{ maxWidth: 640, maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>
                  Pasang Template ke Roadmap
                </h2>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                  Pilih blueprint mata kuliah atau milestone dari Komunitas &amp; Kampus Resmi.
                </p>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowTemplatePicker(false)}
                disabled={isApplying}
                style={{ padding: 6 }}
              >
                <X size={16} />
              </button>
            </div>

            {selectedTemplateForApply ? (
              <div>
                <div
                  style={{
                    background: "var(--bg-secondary)",
                    padding: 14,
                    borderRadius: "var(--radius-md)",
                    marginBottom: 16,
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                    {selectedTemplateForApply.title}
                  </h3>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {selectedTemplateForApply.description}
                  </p>
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Mode Penggabungan</label>
                  <select
                    className="form-input"
                    value={applyMode}
                    onChange={(e) => setApplyMode(e.target.value as "merge" | "new_version")}
                  >
                    <option value="merge">Gabungkan ke versi saat ini (Merge)</option>
                    <option value="new_version">Buat versi baru (New Version)</option>
                  </select>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setSelectedTemplateForApply(null)}>
                    Kembali
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={handleApplyTemplateFromPicker} disabled={isApplying}>
                    {isApplying ? "Menerapkan..." : "Konfirmasi & Pasang"}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <button
                    className={`btn btn-sm ${pickerSourceTab === "komunitas" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setPickerSourceTab("komunitas")}
                  >
                    Komunitas ({MOCK_TEMPLATES.filter((t) => t.sourceType === "komunitas").length})
                  </button>
                  <button
                    className={`btn btn-sm ${pickerSourceTab === "kampus" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setPickerSourceTab("kampus")}
                  >
                    Resmi Kampus ({MOCK_TEMPLATES.filter((t) => t.sourceType === "kampus").length})
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 380, overflowY: "auto" }}>
                  {MOCK_TEMPLATES.filter((t) => t.sourceType === pickerSourceTab).map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: "12px 14px",
                        background: "var(--bg-secondary)",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-subtle)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {t.institutionName} • {t.programName}
                          </span>
                          <span className="badge badge-gray" style={{ fontSize: 9 }}>
                            Angkatan {t.year}
                          </span>
                        </div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>
                          {t.title}
                        </div>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => setSelectedTemplateForApply(t)}>
                        Pilih <ArrowRight size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Toast Notification ── */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            {toast.type === "success" ? <CheckCircle2 size={15} color="var(--lime)" /> : <AlertCircle size={15} color="var(--coral)" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Semester Card Component (Timeline View)
// ─────────────────────────────────────────────────────────────────────────────
function SemesterCardItem({
  plan,
  displayTasks,
  profile,
  mode,
  isExpanded,
  onToggle,
  editingTaskId,
  onEditTaskId,
  onUpdateTask,
  onMoveTask,
  onDeleteTask,
  onUpdateTarget,
  onOpenAddCourse,
  onOpenAddMilestone,
  onOpenAddItem,
  onOpenTemplate,
}: {
  plan: SemesterPlan;
  displayTasks: Task[];
  profile: { currentSemester: number; entryYear: number } | null;
  mode: "view" | "edit";
  isExpanded: boolean;
  onToggle: () => void;
  editingTaskId: string | null;
  onEditTaskId: (id: string | null) => void;
  onUpdateTask: (id: string, updates: Record<string, unknown>) => void;
  onMoveTask: (id: string, targetSemesterNum: number) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTarget: (semesterNum: number, targetCredits: number) => void;
  onOpenAddCourse: () => void;
  onOpenAddMilestone: () => void;
  onOpenAddItem?: (tab?: "COURSE" | "ACTIVITY" | "MILESTONE") => void;
  onOpenTemplate: () => void;
}) {
  const [targetCreditsInput, setTargetCreditsInput] = useState<number>(plan.targetCredits || 20);

  // Separation: Academic SKS courses vs Milestones (Non-SKS)
  const academicTasks = plan.tasks.filter((t) => t.credits > 0);
  const milestoneTasks = plan.tasks.filter((t) => t.credits === 0);

  const academicCredits = academicTasks.reduce((sum, t) => sum + t.credits, 0);
  const doneCount = plan.tasks.filter((t) => t.status === "done").length;

  const rawLabel =
    plan.semesterLabel ??
    (profile ? semesterLabel(plan.semesterNum, profile.entryYear) : `Semester ${plan.semesterNum}`);
  const label = rawLabel.replace(/—/g, "•");

  // Validasi Beban Kuliah per Semester
  const maxLimit = 24;
  const minNormalLimit = 12;
  const isOverMax = academicCredits > maxLimit;
  const isOverTarget = academicCredits > (plan.targetCredits || 20);
  const isTooLight = plan.semesterNum < 8 && academicCredits < minNormalLimit && academicCredits > 0;
  const isOptimal = academicCredits >= 18 && academicCredits <= 22;

  return (
    <div
      className={`semester-card ${plan.isCurrentSemester ? "current" : ""}`}
      style={{
        background: "#FFFFFF",
        borderRadius: "16px",
        border: isOverMax
          ? "1.5px solid #EF4444"
          : plan.isCurrentSemester
          ? "1.5px solid #E5D5BA"
          : "1px solid #E2E8F0",
        boxShadow: plan.isCurrentSemester
          ? "0 4px 18px rgba(245, 205, 71, 0.16), 0 1px 3px rgba(0,0,0,0.03)"
          : "0 1px 3px rgba(0,0,0,0.03)",
        overflow: "hidden",
        transition: "all 0.15s ease",
      }}
    >
      {/* Semester Header */}
      <div
        className="semester-card-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onToggle()}
        aria-expanded={isExpanded}
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
                {label}
              </span>
              {plan.isCurrentSemester && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#18181B",
                    background: "#F4EFE6",
                    border: "1px solid #E7DFD3",
                    padding: "2px 9px",
                    borderRadius: "20px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#D97706" }} />
                  Semester Berjalan
                </span>
              )}
              {academicCredits === 0 && (
                <span className="badge badge-gray" style={{ fontSize: 10, padding: "2px 7px" }}>Belum ada matkul</span>
              )}
            </div>

            {/* Load summary & milestones summary */}
            <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 5, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ color: isOverMax ? "#DC2626" : "#0F172A", fontWeight: 700 }}>
                {academicCredits} SKS Akademik
              </span>
              <span style={{ color: "#CBD5E1" }}>•</span>
              <span>Target: {plan.targetCredits || 20} SKS</span>
              {milestoneTasks.length > 0 && (
                <>
                  <span style={{ color: "#CBD5E1" }}>•</span>
                  <span style={{ color: "#475569", fontWeight: 600, background: "#F1F5F9", border: "1px solid #E2E8F0", padding: "1px 7px", borderRadius: "10px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Target size={11} color="#64748B" /> {milestoneTasks.length} Milestone
                  </span>
                </>
              )}
              <span style={{ color: "#CBD5E1" }}>•</span>
              <span>{doneCount}/{plan.tasks.length} Selesai</span>
            </div>
          </div>
        </div>

        {/* Right side status indicator & Chevron */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Load Badges */}
          {isOverMax && (
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: "#991B1B",
                background: "#FEE2E2",
                border: "1px solid #FCA5A5",
                padding: "4px 10px",
                borderRadius: "20px",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <AlertTriangle size={12} /> Beban Tinggi • &gt; 24 SKS
            </span>
          )}
          {!isOverMax && isTooLight && (
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: "#64748B",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                padding: "3px 9px",
                borderRadius: "20px",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
              title="Total beban semester saat ini di bawah 12 SKS"
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#94A3B8" }} />
              Beban Ringan • {academicCredits} SKS
            </span>
          )}
          {!isOverMax && !isTooLight && isOptimal && (
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: "#15803D",
                background: "#DCFCE7",
                border: "1px solid #86EFAC",
                padding: "4px 10px",
                borderRadius: "20px",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Check size={12} strokeWidth={2.5} /> Beban Ideal
            </span>
          )}

          <div style={{ color: "#64748B", display: "flex", alignItems: "center", padding: 2 }}>
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>

      {/* Semester Body (Accordion Content) */}
      {isExpanded && (
        <div className="semester-card-body" style={{ padding: "16px 20px 20px", borderTop: "1px solid #E2E8F0" }}>
          {/* Alert Box if Overloaded or Too Light */}
          {isOverMax && (
            <div
              style={{
                background: "#FEE2E2",
                border: "1px solid #FCA5A5",
                borderRadius: "10px",
                padding: "11px 15px",
                marginBottom: 14,
                fontSize: 12.5,
                color: "#991B1B",
                lineHeight: 1.5,
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <AlertTriangle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ color: "#991B1B" }}>Peringatan Beban Kuliah:</strong> Semester ini memiliki beban <strong>{academicCredits} SKS</strong> yang melebihi batas reguler nasional (24 SKS).
              </div>
            </div>
          )}

          {!isOverMax && isOverTarget && (
            <div
              style={{
                background: "#FFEDD5",
                border: "1px solid #FDBA74",
                borderRadius: "10px",
                padding: "9px 13px",
                marginBottom: 14,
                fontSize: 12.5,
                color: "#9A3412",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AlertCircle size={15} color="#EA580C" />
              <div>
                <strong>Perhatian:</strong> Beban saat ini ({academicCredits} SKS) melebihi target semester yang kamu tetapkan ({plan.targetCredits} SKS).
              </div>
            </div>
          )}

          {!isOverMax && isTooLight && (
            <div
              style={{
                background: "#FEF9C3",
                border: "1px solid #FDE047",
                borderRadius: "10px",
                padding: "11px 15px",
                marginBottom: 14,
                fontSize: 12.5,
                color: "#78350F",
                lineHeight: 1.5,
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <AlertCircle size={16} color="#B45309" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ color: "#78350F" }}>Catatan Beban Semester:</strong> Beban semester ini ({academicCredits} SKS) tergolong ringan (&lt; 12 SKS). Pertimbangkan mengambil mata kuliah pilihan lebih awal agar masa studi tetap seimbang dan selesai tepat waktu.
              </div>
            </div>
          )}

          {/* Target SKS Semester Control (in Mode 2 Edit) */}
          {mode === "edit" && (
            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "10px",
                padding: "8px 14px",
                marginBottom: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <SlidersHorizontal size={14} color="#475569" />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1E293B" }}>
                  Target Beban SKS Semester:
                </span>
                <select
                  className="form-input"
                  style={{ width: "auto", fontSize: 12, padding: "4px 10px", borderRadius: "6px", background: "#FFFFFF", border: "1px solid #CBD5E1", fontWeight: 600, color: "#0F172A" }}
                  value={targetCreditsInput}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 20;
                    setTargetCreditsInput(val);
                    onUpdateTarget(plan.semesterNum, val);
                  }}
                >
                  {[12, 14, 16, 18, 20, 22, 24].map((sks) => (
                    <option key={sks} value={sks}>
                      {sks} SKS
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span style={{ color: "#64748B", fontWeight: 500 }}>Beban Semester:</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: isOverMax ? "#DC2626" : isOptimal ? "#15803D" : "#0F172A",
                    background: "#FFFFFF",
                    border: "1px solid #CBD5E1",
                    padding: "2px 8px",
                    borderRadius: "6px",
                  }}
                >
                  {academicCredits} / {targetCreditsInput} SKS
                </span>
              </div>
            </div>
          )}

          {/* List of Tasks (Courses, Activities, Milestones) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {displayTasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 16px", color: "#64748B", fontSize: 13, background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: "10px" }}>
                <p style={{ margin: "0 0 10px" }}>Belum ada rencana mata kuliah, kegiatan, atau milestone di semester ini.</p>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => (onOpenAddItem ? onOpenAddItem("COURSE") : onOpenAddCourse())}
                  style={{ fontSize: 12, gap: 5, padding: "5px 12px" }}
                >
                  <Plus size={13} /> Tambah Item
                </button>
              </div>
            ) : (
              displayTasks.map((task) => {
                const isMilestone = task.credits === 0;
                const isCompleted = task.status === "done";
                const isNeedsRepeat = task.status === "delayed";

                return (
                  <div key={task.id}>
                    {editingTaskId === task.id ? (
                      /* Task Edit Form */
                      <TaskRowEditForm
                        task={task}
                        currentSemesterNum={plan.semesterNum}
                        onSave={(updates) => onUpdateTask(task.id, updates)}
                        onMove={(targetSem) => onMoveTask(task.id, targetSem)}
                        onDelete={() => onDeleteTask(task.id)}
                        onCancel={() => onEditTaskId(null)}
                      />
                    ) : (
                      /* Task Row Display */
                      <div
                        className="task-item"
                        style={{
                          background: "#FFFFFF",
                          border: isCompleted
                            ? "1px solid #E2E8F0"
                            : isNeedsRepeat
                            ? "1px solid #FECDD3"
                            : isMilestone
                            ? "1px solid #CCFBF1"
                            : "1px solid #E2E8F0",
                          borderRadius: "10px",
                          padding: "12px 16px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          transition: "all 0.15s ease",
                          cursor: mode === "edit" ? "pointer" : "default",
                        }}
                        onClick={() => {
                          if (mode === "edit") onEditTaskId(task.id);
                        }}
                      >
                        {/* Status Icon */}
                        <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                          <TaskStatusBadge status={task.status} />
                        </div>

                        {/* Title, Code, & Badges */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                            <span
                              style={{
                                fontSize: 13.5,
                                fontWeight: 600,
                                color: isCompleted ? "#64748B" : "#0F172A",
                                // no strike-through for completed courses
                              }}
                            >
                              {task.title}
                            </span>

                            {task.courseCode && (
                              <span
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  fontFamily: "monospace",
                                  color: "#334155",
                                  background: "#F1F5F9",
                                  border: "1px solid #E2E8F0",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                }}
                              >
                                {task.courseCode}
                              </span>
                            )}

                            {/* Item Type: ACTIVITY Badge */}
                            {task.itemType === "ACTIVITY" && (
                              <span
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 600,
                                  background: "#EEF2FF",
                                  border: "1px solid #C7D2FE",
                                  color: "#4338CA",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <Briefcase size={10} />
                                <span>Kegiatan: {task.category}</span>
                                {task.weeklyHours ? <span>• {task.weeklyHours} jam/mgg</span> : null}
                              </span>
                            )}

                            {/* Item Type: MILESTONE Badge */}
                            {(task.itemType === "MILESTONE" || isMilestone) && (
                              <span
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 600,
                                  background: "#CCFBF1",
                                  border: "1px solid #99F6E4",
                                  color: "#0F766E",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <Target size={10} /> Milestone Non-SKS
                              </span>
                            )}

                            {/* Completed Course Locked Badge */}
                            {isCompleted && (
                              <span
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  background: "#DCFCE7",
                                  border: "1px solid #86EFAC",
                                  color: "#15803D",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                                title="Mata kuliah yang sudah selesai tidak boleh berpindah semester."
                              >
                                <Lock size={9} /> Lulus di Sem {plan.semesterNum}
                              </span>
                            )}

                            {/* Perlu Diulang Badge */}
                            {isNeedsRepeat && (
                              <span
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  background: "#FEE2E2",
                                  border: "1px solid #FCA5A5",
                                  color: "#991B1B",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                              >
                                <AlertCircle size={9} /> Perlu Diulang
                              </span>
                            )}
                          </div>

                          {task.notes && (
                            <p style={{ fontSize: 11.5, color: "#64748B", margin: "3px 0 0" }}>
                              {task.notes}
                            </p>
                          )}
                        </div>

                        {/* Credits & Action */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: isMilestone ? "#0F766E" : "#0F172A",
                              background: "#F8FAFC",
                              border: "1px solid #E2E8F0",
                              padding: "3px 8px",
                              borderRadius: "6px",
                            }}
                          >
                            {task.credits > 0 ? `${task.credits} SKS` : "0 SKS"}
                          </span>

                          {mode === "edit" && (
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{
                                width: 28,
                                height: 28,
                                padding: 0,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "6px",
                                color: "#475569",
                                background: "#F8FAFC",
                                border: "1px solid #E2E8F0",
                                transition: "all 0.15s ease",
                                flexShrink: 0,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTaskId(task.id);
                              }}
                              title="Edit item"
                              aria-label="Edit item"
                            >
                              <Edit3 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions of Semester Card */}
          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: "1px solid #E2E8F0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <Link
              href={`/app/simulator?semester=${plan.semesterNum}`}
              style={{
                fontSize: 12,
                color: "#92400E",
                background: "#FEF3C7",
                border: "1px solid #FDE68A",
                padding: "5px 12px",
                borderRadius: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                textDecoration: "none",
                fontWeight: 700,
                transition: "all 0.15s ease",
              }}
            >
              <Compass size={14} color="#D97706" />
              Uji di Simulator
            </Link>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={onOpenTemplate}
                style={{
                  fontSize: 12,
                  color: "#334155",
                  fontWeight: 600,
                  border: "1px solid #CBD5E1",
                  borderRadius: "8px",
                  padding: "5px 12px",
                  background: "#FFFFFF",
                  gap: 5,
                }}
              >
                <Plus size={12} /> Dari Template
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => (onOpenAddItem ? onOpenAddItem("COURSE") : onOpenAddCourse())}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "5px 14px",
                  borderRadius: "8px",
                  gap: 5,
                }}
              >
                <Plus size={12} /> Tambah Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Interactive Visual Roadmap Component (Winding Road Highway & Pop-Ups)
// ─────────────────────────────────────────────────────────────────────────────
function InteractiveVisualRoadmap({
  semesterPlans,
  profile,
  mode,
  editingTaskId,
  onEditTaskId,
  onUpdateTask,
  onMoveTask,
  onDeleteTask,
  onOpenAddItem,
  onOpenAddCourse,
  onOpenAddMilestone,
  onUpdateTarget,
}: {
  semesterPlans: SemesterPlan[];
  profile: { currentSemester: number; entryYear: number } | null;
  mode: "view" | "edit";
  editingTaskId: string | null;
  onEditTaskId: (id: string | null) => void;
  onUpdateTask: (id: string, updates: Record<string, unknown>) => void;
  onMoveTask: (id: string, targetSemesterNum: number) => void;
  onDeleteTask: (id: string) => void;
  onOpenAddItem?: (semNum: number, tab?: "COURSE" | "ACTIVITY" | "MILESTONE") => void;
  onOpenAddCourse: (semNum: number) => void;
  onOpenAddMilestone: (semNum: number) => void;
  onUpdateTarget: (semesterNum: number, targetCredits: number) => void;
}) {
  const currentSemester = profile?.currentSemester ?? 4;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedSemesterModal, setSelectedSemesterModal] = useState<number | null>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const offset = direction === "left" ? -380 : 380;
    scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  const scrollToSemester = (semNum: number) => {
    const el = document.getElementById(`road-node-${semNum}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  };

  // Sort plans chronologically by semester number
  const sortedPlans = [...semesterPlans].sort((a, b) => a.semesterNum - b.semesterNum);

  // Geometry calculations for winding serpentine highway
  const stepX = 330;
  const startPad = 190;
  const canvasWidth = Math.max(1400, (sortedPlans.length - 1) * stepX + startPad * 2 + 180);
  const canvasHeight = 700;

  const points = sortedPlans.map((plan, i) => {
    // Alternating curve: even index dips lower (y=450, callout ABOVE), odd index rises higher (y=240, callout BELOW)
    const isAbove = i % 2 === 0;
    return {
      plan,
      index: i,
      isAbove,
      x: startPad + i * stepX,
      y: isAbove ? 450 : 240,
    };
  });

  // Generate smooth winding cubic bezier road path
  let roadPath = "";
  if (points.length > 0) {
    const startX = points[0].x - 120;
    const startY = points[0].y;
    roadPath = `M ${startX} ${startY} `;
    roadPath += `C ${startX + 60} ${startY}, ${points[0].x - 60} ${points[0].y}, ${points[0].x} ${points[0].y} `;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const dx = curr.x - prev.x;
      // Smooth horizontal tangents at peaks and dips create fluid highway curves
      roadPath += `C ${prev.x + dx * 0.5} ${prev.y}, ${curr.x - dx * 0.5} ${curr.y}, ${curr.x} ${curr.y} `;
    }

    const last = points[points.length - 1];
    const endX = last.x + 140;
    const endY = last.y;
    roadPath += `C ${last.x + 70} ${last.y}, ${endX - 70} ${endY}, ${endX} ${endY}`;
  }

  return (
    <div className="card" style={{ padding: "20px", background: "var(--bg-card)", overflow: "hidden" }}>
      <style>{`
        @keyframes roadBeaconPing {
          0% { transform: scale(1); opacity: 0.9; }
          70% { transform: scale(1.65); opacity: 0; }
          100% { transform: scale(1.65); opacity: 0; }
        }
        .road-callout-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(245, 205, 71, 0.22) !important;
        }
      `}</style>

      {/* Visual Roadmap Header & Legend */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 12,
          paddingBottom: 12,
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-sm)",
              background: "rgba(245, 205, 71, 0.22)",
              border: "1px solid rgba(217, 119, 6, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#92400E",
            }}
          >
            <GitBranch size={16} />
          </div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Alur Perjalanan Studi
            </h2>
            <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: "2px 0 0" }}>
              Klik titik semester atau kartu untuk melihat dan mengatur mata kuliah
            </p>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", fontSize: 11.5 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontWeight: 500 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#15803D" }} /> Selesai / Lulus
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontWeight: 500 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#D97706" }} /> Berjalan
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontWeight: 500 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4F46E5" }} /> Rencana
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontWeight: 500 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E11D48" }} /> Perlu Diulang
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontWeight: 500 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0D9488" }} /> Milestone Non-SKS
          </span>
        </div>
      </div>

      {/* Quick Navigation Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600, marginRight: 2 }}>
            Pilih Semester:
          </span>
          {sortedPlans.map((p) => {
            const isCurrent = p.semesterNum === currentSemester;
            return (
              <button
                key={p.semesterNum}
                onClick={() => scrollToSemester(p.semesterNum)}
                style={{
                  fontSize: 11.5,
                  fontWeight: isCurrent ? 700 : 600,
                  padding: "4px 10px",
                  borderRadius: "var(--radius-sm)",
                  border: isCurrent ? "1.5px solid #D97706" : "1px solid rgba(0, 0, 0, 0.08)",
                  background: isCurrent ? "rgba(245, 205, 71, 0.25)" : "#FFFFFF",
                  color: isCurrent ? "#92400E" : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: isCurrent ? "0 1px 4px rgba(245, 205, 71, 0.25)" : "0 1px 2px rgba(0, 0, 0, 0.02)",
                }}
              >
                Sem {p.semesterNum}{isCurrent ? " • Aktif" : ""}
              </button>
            );
          })}
        </div>

        {/* Scroll Left / Right Controls */}
        <div style={{ display: "flex", gap: 4 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => scroll("left")}
            style={{ padding: "4px 8px", fontSize: 11 }}
            title="Geser ke kiri"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => scroll("right")}
            style={{ padding: "4px 8px", fontSize: 11 }}
            title="Geser ke kanan"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* ── Serpentine Highway Road Canvas (Scrollable) ── */}
      <div
        ref={scrollContainerRef}
        style={{
          width: "100%",
          overflowX: "auto",
          overflowY: "hidden",
          borderRadius: "var(--radius-lg)",
          background: "radial-gradient(ellipse at 50% 50%, #F8F9FA 0%, #ECEEF2 100%)",
          border: "1px solid #D8DCE2",
          boxShadow: "inset 0 1px 8px rgba(0, 0, 0, 0.04)",
          padding: "20px 10px",
          scrollBehavior: "smooth",
          position: "relative",
        }}
      >
        <div style={{ position: "relative", width: canvasWidth, height: canvasHeight }}>
          {/* SVG Road and Topographical Contours Layer */}
          <svg
            width={canvasWidth}
            height={canvasHeight}
            style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
          >
            <defs>
              <linearGradient id="roadGlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(245, 205, 71, 0.1)" />
                <stop offset="50%" stopColor="rgba(117, 189, 165, 0.15)" />
                <stop offset="100%" stopColor="rgba(133, 136, 255, 0.1)" />
              </linearGradient>
            </defs>

            {/* Background Topographical Contour Lines (Subtle on soft white) */}
            <path
              d={`M 0,160 Q ${canvasWidth * 0.25},100 ${canvasWidth * 0.5},170 T ${canvasWidth},130`}
              fill="none"
              stroke="rgba(0, 0, 0, 0.04)"
              strokeWidth="1.5"
            />
            <path
              d={`M 0,360 Q ${canvasWidth * 0.3},400 ${canvasWidth * 0.6},330 T ${canvasWidth},380`}
              fill="none"
              stroke="rgba(117, 189, 165, 0.18)"
              strokeWidth="1.5"
            />
            <path
              d={`M 0,560 Q ${canvasWidth * 0.2},620 ${canvasWidth * 0.55},540 T ${canvasWidth},590`}
              fill="none"
              stroke="rgba(0, 0, 0, 0.04)"
              strokeWidth="1.5"
            />

            {/* Road Layers */}
            {roadPath && (
              <>
                {/* 1. Road Outer Shadow (Soft elevation shadow on soft white) */}
                <path d={roadPath} fill="none" stroke="rgba(0, 0, 0, 0.12)" strokeWidth="64" strokeLinecap="round" />
                {/* 2. Road Shoulder / Border */}
                <path d={roadPath} fill="none" stroke="#CBD5E1" strokeWidth="52" strokeLinecap="round" />
                {/* 3. Asphalt Surface */}
                <path d={roadPath} fill="none" stroke="#222825" strokeWidth="46" strokeLinecap="round" />
                {/* 4. Inner Asphalt Texture */}
                <path d={roadPath} fill="none" stroke="#2B322E" strokeWidth="40" strokeLinecap="round" />
                {/* 5. Center Lane Dashed Divider (Lime STARA Gold) */}
                <path
                  d={roadPath}
                  fill="none"
                  stroke="#F5CD47"
                  strokeWidth="3.5"
                  strokeDasharray="14 12"
                  strokeLinecap="round"
                  opacity="1"
                />
              </>
            )}
          </svg>

          {/* Start Banner on Road */}
          {points.length > 0 && (
            <div
              style={{
                position: "absolute",
                left: points[0].x - 130,
                top: points[0].y - 18,
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                borderRadius: "var(--radius-pill)",
                padding: "4px 12px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "#475569",
                fontSize: 11,
                fontWeight: 700,
                whiteSpace: "nowrap",
                zIndex: 15,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <Compass size={12} color="#64748B" />
              <span>Awal Studi</span>
            </div>
          )}

          {/* Finish Line Banner on Road */}
          {points.length > 0 && (
            <div
              style={{
                position: "absolute",
                left: points[points.length - 1].x + 40,
                top: points[points.length - 1].y - 20,
                background: "#FFFFFF",
                border: "1px solid rgba(245, 205, 71, 0.7)",
                borderRadius: "var(--radius-pill)",
                padding: "6px 14px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "#856000",
                fontSize: 12,
                fontWeight: 700,
                boxShadow: "0 4px 14px rgba(245, 205, 71, 0.18), 0 2px 6px rgba(0,0,0,0.04)",
                whiteSpace: "nowrap",
                zIndex: 15,
              }}
            >
              <GraduationCap size={16} color="#856000" />
              <span>Target Kelulusan Tepat Waktu</span>
            </div>
          )}

          {/* Checkpoints & Pop-Up Speech-Bubble Callouts */}
          {points.map((pt) => {
            const academicTasks = pt.plan.tasks.filter((t) => t.credits > 0);
            const academicCredits = academicTasks.reduce((sum, t) => sum + t.credits, 0);
            const isCurrent = pt.plan.isCurrentSemester || pt.plan.semesterNum === currentSemester;
            const isPast = pt.plan.semesterNum < currentSemester;
            const isOverMax = academicCredits > 24;
            const isTooLight = pt.plan.semesterNum < 8 && academicCredits < 12 && academicCredits > 0;

            return (
              <div key={pt.plan.semesterNum}>
                {/* ── Checkpoint Node on the Road ── */}
                <div
                  id={`road-node-${pt.plan.semesterNum}`}
                  onClick={() => setSelectedSemesterModal(pt.plan.semesterNum)}
                  style={{
                    position: "absolute",
                    left: pt.x - 22,
                    top: pt.y - 22,
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    cursor: "pointer",
                    zIndex: 25,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.2s ease",
                  }}
                  title={`Klik untuk melihat rincian Semester ${pt.plan.semesterNum}`}
                >
                  {/* Pulsing Beacon Ring for Current Semester */}
                  {isCurrent && (
                    <div
                      style={{
                        position: "absolute",
                        inset: -6,
                        borderRadius: "50%",
                        border: "2px solid var(--lime)",
                        animation: "roadBeaconPing 2s cubic-bezier(0, 0, 0.2, 1) infinite",
                        pointerEvents: "none",
                      }}
                    />
                  )}

                  <div
                    style={{
                      position: "relative",
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: isCurrent
                        ? "var(--lime)"
                        : isPast
                        ? "#15803D"
                        : "#1E2320",
                      border: isCurrent
                        ? "3px solid #FFFFFF"
                        : isPast
                        ? "2px solid #86EFAC"
                        : "2px solid #52525B",
                      color: isCurrent ? "#18181B" : "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: 14,
                      boxShadow: isCurrent
                        ? "0 0 20px rgba(245, 205, 71, 0.6)"
                        : isPast
                        ? "0 0 12px rgba(21, 128, 61, 0.35)"
                        : "0 4px 12px rgba(0,0,0,0.4)",
                    }}
                  >
                    {String(pt.plan.semesterNum).padStart(2, "0")}
                    {isPast && (
                      <span
                        style={{
                          position: "absolute",
                          top: -3,
                          right: -3,
                          width: 15,
                          height: 15,
                          borderRadius: "50%",
                          background: "#FFFFFF",
                          color: "#15803D",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                        }}
                      >
                        <Check size={9} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Pop-Up Speech-Bubble Callout Card ── */}
                <div
                  className="road-callout-card"
                  style={{
                    position: "absolute",
                    left: pt.x - 140,
                    ...(pt.isAbove
                      ? { bottom: canvasHeight - (pt.y - 32) }
                      : { top: pt.y + 32 }),
                    width: 280,
                    zIndex: 20,
                    transition: "transform 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      background: "#FFFFFF",
                      borderRadius: "var(--radius-lg)",
                      border: isCurrent
                        ? "2px solid #F5CD47"
                        : isOverMax
                        ? "1.5px solid var(--coral)"
                        : "1px solid rgba(0, 0, 0, 0.09)",
                      padding: "14px 16px",
                      boxShadow: isCurrent
                        ? "0 14px 36px rgba(245, 205, 71, 0.25), 0 4px 14px rgba(28, 25, 23, 0.08)"
                        : "0 10px 28px rgba(28, 25, 23, 0.08), 0 2px 6px rgba(28, 25, 23, 0.04)",
                      position: "relative",
                    }}
                  >
                    {/* Speech Bubble Pointer Triangle Matching Card Border */}
                    {pt.isAbove ? (
                      <svg
                        width="24"
                        height="12"
                        viewBox="0 0 24 12"
                        style={{
                          position: "absolute",
                          bottom: -11,
                          left: "50%",
                          transform: "translateX(-50%)",
                          pointerEvents: "none",
                        }}
                      >
                        <polygon
                          points="0,0 24,0 12,11"
                          fill="#FFFFFF"
                          stroke={isCurrent ? "#F5CD47" : isOverMax ? "var(--coral)" : "rgba(0, 0, 0, 0.12)"}
                          strokeWidth="1.5"
                        />
                        <rect x="1" y="-1" width="22" height="2" fill="#FFFFFF" />
                      </svg>
                    ) : (
                      <svg
                        width="24"
                        height="12"
                        viewBox="0 0 24 12"
                        style={{
                          position: "absolute",
                          top: -11,
                          left: "50%",
                          transform: "translateX(-50%)",
                          pointerEvents: "none",
                        }}
                      >
                        <polygon
                          points="12,1 24,12 0,12"
                          fill="#FFFFFF"
                          stroke={isCurrent ? "#F5CD47" : isOverMax ? "var(--coral)" : "rgba(0, 0, 0, 0.12)"}
                          strokeWidth="1.5"
                        />
                        <rect x="1" y="11" width="22" height="2" fill="#FFFFFF" />
                      </svg>
                    )}

                    {/* Pop-up Header with Color Accent Dot */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            background: isCurrent
                              ? "var(--lime)"
                              : isPast
                              ? "#DCFCE7"
                              : isOverMax
                              ? "#FEE2E2"
                              : "#F4F4F5",
                            border: isCurrent
                              ? "2px solid #D97706"
                              : isPast
                              ? "1.5px solid #16A34A"
                              : isOverMax
                              ? "1.5px solid var(--coral)"
                              : "1.5px solid #E4E4E7",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: isCurrent
                              ? "#78350F"
                              : isPast
                              ? "#15803D"
                              : isOverMax
                              ? "#BE123C"
                              : "#3F3F46",
                            fontSize: 12.5,
                            fontWeight: 900,
                            flexShrink: 0,
                            boxShadow: isCurrent ? "0 2px 8px rgba(245, 205, 71, 0.45)" : "none",
                          }}
                        >
                          {pt.plan.semesterNum}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-primary)" }}>
                              Semester {pt.plan.semesterNum}
                            </span>
                            {isCurrent && (
                              <span className="badge badge-lime" style={{ fontSize: 9.5, fontWeight: 700 }}>
                                Berjalan
                              </span>
                            )}
                            {isPast && (
                              <span className="badge badge-teal" style={{ fontSize: 9.5, fontWeight: 700 }}>
                                Lulus
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 10.5, color: "var(--text-secondary)", marginTop: 1, fontWeight: 500 }}>
                            {pt.plan.semesterLabel ?? (profile ? semesterLabel(pt.plan.semesterNum, profile.entryYear) : `Tahun Ke-${Math.ceil(pt.plan.semesterNum / 2)}`)}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: isOverMax ? "var(--coral)" : isCurrent ? "#92400E" : "#18181B" }}>
                          {academicCredits} SKS
                        </span>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500 }}>
                          Target {pt.plan.targetCredits || 20}
                        </div>
                      </div>
                    </div>

                    {/* Load warnings */}
                    {isOverMax && (
                      <div style={{ fontSize: 11, color: "#BE123C", background: "#FFF1F2", border: "1px solid #FFE4E6", borderRadius: 6, padding: "3px 8px", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                        <AlertTriangle size={12} /> Beban Padat (&gt;24 SKS)
                      </div>
                    )}
                    {!isOverMax && isTooLight && (
                      <div style={{ fontSize: 11, color: "#9A3412", background: "#FFF7ED", border: "1px solid #FFEDD5", borderRadius: 6, padding: "3px 8px", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                        <AlertCircle size={12} /> Beban Ringan (&lt;12 SKS)
                      </div>
                    )}

                    {/* Courses Preview (Max 3 items) */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                      {pt.plan.tasks.slice(0, 3).map((task) => {
                        const isMilestone = task.credits === 0;
                        const isCompleted = task.status === "done";
                        const isNeedsRepeat = task.status === "delayed";

                        return (
                          <div
                            key={task.id}
                            onClick={(e) => {
                              if (mode === "edit") {
                                e.stopPropagation();
                                onEditTaskId(task.id);
                              }
                            }}
                            style={{
                              padding: "6px 9px",
                              background: isCompleted
                                ? "#F0FDF4"
                                : isNeedsRepeat
                                ? "#FFF1F2"
                                : isMilestone
                                ? "#F0FDFA"
                                : "#FAF9F5",
                              borderRadius: "var(--radius-sm)",
                              border: isCompleted
                                ? "1px solid #BBF7D0"
                                : isNeedsRepeat
                                ? "1px solid #FECDD3"
                                : isMilestone
                                ? "1px dashed #99F6E4"
                                : "1px solid rgba(0, 0, 0, 0.07)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 6,
                              fontSize: 11.5,
                              cursor: mode === "edit" ? "pointer" : "default",
                              transition: "background 0.15s ease",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
                              <TaskStatusBadge status={task.status} />
                              <span
                                style={{
                                  color: isCompleted ? "var(--text-muted)" : "var(--text-primary)",
                                  textDecoration: isCompleted ? "line-through" : "none",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  fontWeight: isCompleted ? 400 : 500,
                                }}
                                title={task.title}
                              >
                                {task.title}
                              </span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                              {isCompleted && <Lock size={10} color="#15803D" />}
                              <span style={{ fontSize: 10, fontWeight: 700, color: task.itemType === "ACTIVITY" ? "#3B82F6" : isMilestone ? "#0D9488" : isCompleted ? "#15803D" : "var(--text-secondary)" }}>
                                {task.itemType === "ACTIVITY" ? (task.credits > 0 ? `${task.credits} SKS` : "Kegiatan") : isMilestone ? "0 SKS" : `${task.credits} SKS`}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {pt.plan.tasks.length > 3 && (
                        <div style={{ fontSize: 10.5, color: "var(--text-muted)", textAlign: "center", fontWeight: 500 }}>
                          +{pt.plan.tasks.length - 3} item lainnya
                        </div>
                      )}
                    </div>

                    {/* Pop-up Card Footer Actions */}
                    <div style={{ display: "flex", gap: 6, alignItems: "center", borderTop: "1px solid rgba(0, 0, 0, 0.07)", paddingTop: 9 }}>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{
                          flex: 1,
                          fontSize: 11.5,
                          padding: "6px 10px",
                          fontWeight: 700,
                          background: "var(--lime)",
                          color: "#18181B",
                          border: "1px solid rgba(0, 0, 0, 0.08)",
                          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                        }}
                        onClick={() => setSelectedSemesterModal(pt.plan.semesterNum)}
                      >
                        {mode === "edit" ? "Sesuaikan Semester" : "Rincian Semester"}
                      </button>

                      {mode === "edit" && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: 11, padding: "5px 8px" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenAddItem) {
                              onOpenAddItem(pt.plan.semesterNum, "COURSE");
                            } else {
                              onOpenAddCourse(pt.plan.semesterNum);
                            }
                          }}
                          title="Tambah Item (Mata Kuliah, Kegiatan, Milestone)"
                        >
                          <Plus size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Interactive Semester Detail Modal (Pop up semester dll) ── */}
      {selectedSemesterModal !== null && (
        <SemesterInspectorModal
          plan={sortedPlans.find((p) => p.semesterNum === selectedSemesterModal)!}
          profile={profile}
          mode={mode}
          editingTaskId={editingTaskId}
          onEditTaskId={onEditTaskId}
          onUpdateTask={onUpdateTask}
          onMoveTask={onMoveTask}
          onDeleteTask={onDeleteTask}
          onOpenAddItem={(tab) => {
            if (onOpenAddItem) {
              onOpenAddItem(selectedSemesterModal, tab);
            } else {
              onOpenAddCourse(selectedSemesterModal);
            }
          }}
          onOpenAddCourse={() => onOpenAddCourse(selectedSemesterModal)}
          onOpenAddMilestone={() => onOpenAddMilestone(selectedSemesterModal)}
          onUpdateTarget={onUpdateTarget}
          onClose={() => setSelectedSemesterModal(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Semester Inspector Modal (Pop-Up Detail & Penyesuaian Semester)
// ─────────────────────────────────────────────────────────────────────────────
function SemesterInspectorModal({
  plan,
  profile,
  mode,
  editingTaskId,
  onEditTaskId,
  onUpdateTask,
  onMoveTask,
  onDeleteTask,
  onOpenAddCourse,
  onOpenAddMilestone,
  onOpenAddItem,
  onUpdateTarget,
  onClose,
}: {
  plan: SemesterPlan;
  profile: { currentSemester: number; entryYear: number } | null;
  mode: "view" | "edit";
  editingTaskId: string | null;
  onEditTaskId: (id: string | null) => void;
  onUpdateTask: (id: string, updates: Record<string, unknown>) => void;
  onMoveTask: (id: string, targetSemesterNum: number) => void;
  onDeleteTask: (id: string) => void;
  onOpenAddCourse: () => void;
  onOpenAddMilestone: () => void;
  onOpenAddItem?: (tab?: "COURSE" | "ACTIVITY" | "MILESTONE") => void;
  onUpdateTarget: (semesterNum: number, targetCredits: number) => void;
  onClose: () => void;
}) {
  const [targetCreditsInput, setTargetCreditsInput] = useState<number>(plan.targetCredits || 20);

  const academicTasks = plan.tasks.filter((t) => t.credits > 0);
  const milestoneTasks = plan.tasks.filter((t) => t.credits === 0);
  const academicCredits = academicTasks.reduce((sum, t) => sum + t.credits, 0);

  const isCurrent = plan.isCurrentSemester || plan.semesterNum === (profile?.currentSemester ?? 4);
  const isOverMax = academicCredits > 24;
  const isTooLight = plan.semesterNum < 8 && academicCredits < 12 && academicCredits > 0;

  return (
    <div className="dialog-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="dialog"
        style={{ maxWidth: 660, maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                Semester {plan.semesterNum}
              </h2>
              {isCurrent && <span className="badge badge-lime">Semester Berjalan</span>}
              {plan.semesterNum < (profile?.currentSemester ?? 4) && <span className="badge badge-teal">Telah Lulus</span>}
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2 }}>
              {plan.semesterLabel ?? (profile ? semesterLabel(plan.semesterNum, profile.entryYear) : `Tahun Ke-${Math.ceil(plan.semesterNum / 2)}`)}
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: 6 }}>
            <X size={16} />
          </button>
        </div>

        {/* SKS Summary & Target Controls */}
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "12px 16px",
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Beban Kuliah Akademik
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: isOverMax ? "var(--coral)" : "#18181B" }}>
              {academicCredits} <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>/ Target {plan.targetCredits || 20} SKS</span>
            </div>
          </div>

          {mode === "edit" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Target SKS:</span>
              <select
                className="form-input"
                style={{ width: "auto", fontSize: 12, padding: "3px 8px" }}
                value={targetCreditsInput}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 20;
                  setTargetCreditsInput(val);
                  onUpdateTarget(plan.semesterNum, val);
                }}
              >
                {[12, 14, 16, 18, 20, 22, 24].map((sks) => (
                  <option key={sks} value={sks}>
                    {sks} SKS
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {academicTasks.length} mata kuliah • {milestoneTasks.length} milestone pribadi
            </div>
          )}
        </div>

        {/* Load Warnings */}
        {isOverMax && (
          <div
            style={{
              background: "#FFF1F2",
              border: "1px solid #FFE4E6",
              borderRadius: "var(--radius-md)",
              padding: "10px 14px",
              marginBottom: 14,
              fontSize: 12,
              color: "#9F1239",
              lineHeight: 1.5,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <AlertTriangle size={15} color="#E11D48" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Peringatan Beban Kuliah:</strong> Semester ini memiliki beban <strong>{academicCredits} SKS</strong> yang melebihi batas reguler nasional (24 SKS).
            </div>
          </div>
        )}
        {!isOverMax && isTooLight && (
          <div
            style={{
              background: "#FFF7ED",
              border: "1px solid #FFEDD5",
              borderRadius: "var(--radius-md)",
              padding: "10px 14px",
              marginBottom: 14,
              fontSize: 12,
              color: "#9A3412",
              lineHeight: 1.5,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <AlertCircle size={15} color="#EA580C" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Catatan Beban Semester:</strong> Beban semester ini ({academicCredits} SKS) tergolong ringan (&lt; 12 SKS).
            </div>
          </div>
        )}

        {/* Tambah Item Button */}
        <div style={{ marginBottom: 14 }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => (onOpenAddItem ? onOpenAddItem("COURSE") : onOpenAddCourse())}
            style={{ width: "100%", gap: 6, justifyContent: "center", padding: "8px 14px", fontWeight: 700 }}
            id="btn-inspector-add-item"
          >
            <Plus size={14} /> Tambah Item (Mata Kuliah, Kegiatan, Milestone)
          </button>
        </div>

        {/* Courses & Milestones List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Daftar Mata Kuliah &amp; Milestone ({plan.tasks.length})
          </div>

          {plan.tasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 12px", color: "var(--text-muted)", fontSize: 12.5 }}>
              Belum ada mata kuliah atau milestone di semester ini.
            </div>
          ) : (
            plan.tasks.map((task) => {
              const isMilestone = task.credits === 0;
              const isCompleted = task.status === "done";
              const isNeedsRepeat = task.status === "delayed";

              return (
                <div key={task.id}>
                  {editingTaskId === task.id ? (
                    <TaskRowEditForm
                      task={task}
                      currentSemesterNum={plan.semesterNum}
                      onSave={(updates) => onUpdateTask(task.id, updates)}
                      onMove={(targetSem) => onMoveTask(task.id, targetSem)}
                      onDelete={() => onDeleteTask(task.id)}
                      onCancel={() => onEditTaskId(null)}
                    />
                  ) : (
                    <div
                      className="task-item"
                      style={{
                        background: isCompleted
                          ? "#F0FDF4"
                          : isNeedsRepeat
                          ? "#FFF1F2"
                          : isMilestone
                          ? "#F0FDFA"
                          : "#FAF9F5",
                        border: isCompleted
                          ? "1px solid #BBF7D0"
                          : isNeedsRepeat
                          ? "1px solid #FECDD3"
                          : isMilestone
                          ? "1px dashed #99F6E4"
                          : "1px solid rgba(0, 0, 0, 0.07)",
                      }}
                    >
                      <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                        <TaskStatusBadge status={task.status} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: isCompleted ? "var(--text-muted)" : "var(--text-primary)",
                              textDecoration: isCompleted ? "line-through" : "none",
                            }}
                          >
                            {task.title}
                          </span>

                          {task.courseCode && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                fontFamily: "monospace",
                                color: "var(--text-secondary)",
                                background: "rgba(255, 255, 255, 0.05)",
                                border: "1px solid var(--border-subtle)",
                                padding: "1px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              {task.courseCode}
                            </span>
                          )}

                            {/* Item Type: ACTIVITY Badge */}
                            {task.itemType === "ACTIVITY" && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 600,
                                  background: "rgba(133, 136, 255, 0.1)",
                                  border: "1px solid rgba(133, 136, 255, 0.25)",
                                  color: "var(--blue)",
                                  padding: "1px 6px",
                                  borderRadius: "var(--radius-sm)",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <Briefcase size={10} />
                                <span>Kegiatan: {task.category}</span>
                                {task.weeklyHours ? <span>• {task.weeklyHours} jam/mgg</span> : null}
                              </span>
                            )}

                            {/* Item Type: MILESTONE Badge */}
                            {task.itemType === "MILESTONE" && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 600,
                                  background: "rgba(117, 189, 165, 0.08)",
                                  border: "1px solid rgba(117, 189, 165, 0.2)",
                                  color: "var(--teal)",
                                  padding: "1px 6px",
                                  borderRadius: "var(--radius-sm)",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <Target size={10} />
                                <span>Milestone Non-SKS</span>
                                {task.targetDate ? <span>• {task.targetDate}</span> : null}
                              </span>
                            )}

                            {/* Legacy Milestone Non-SKS badge */}
                            {(!task.itemType || task.itemType === "COURSE") && isMilestone && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 600,
                                  background: "rgba(117, 189, 165, 0.08)",
                                  border: "1px solid rgba(117, 189, 165, 0.2)",
                                  color: "var(--teal)",
                                  padding: "1px 6px",
                                  borderRadius: "var(--radius-sm)",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <Target size={10} /> Milestone Non-SKS
                              </span>
                            )}

                          {isCompleted && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                background: "rgba(22, 163, 74, 0.12)",
                                border: "1px solid rgba(22, 163, 74, 0.25)",
                                color: "#15803D",
                                padding: "1px 6px",
                                borderRadius: "var(--radius-sm)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              <Lock size={9} /> Lulus di Sem {plan.semesterNum}
                            </span>
                          )}

                          {isNeedsRepeat && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                background: "rgba(255, 126, 138, 0.08)",
                                border: "1px solid rgba(255, 126, 138, 0.2)",
                                color: "var(--coral)",
                                padding: "1px 6px",
                                borderRadius: "var(--radius-sm)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              <AlertCircle size={9} /> Perlu Diulang
                            </span>
                          )}
                        </div>

                        {task.notes && (
                          <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: "3px 0 0" }}>
                            {task.notes}
                          </p>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: isMilestone ? "var(--teal)" : "var(--text-primary)" }}>
                          {isMilestone ? "0 SKS" : `${task.credits} SKS`}
                        </span>

                        {mode === "edit" && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{
                              width: 28,
                              height: 28,
                              padding: 0,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "6px",
                              color: "#475569",
                              background: "#F8FAFC",
                              border: "1px solid #E2E8F0",
                              transition: "all 0.15s ease",
                              flexShrink: 0,
                            }}
                            onClick={() => onEditTaskId(task.id)}
                            title="Edit item"
                            aria-label="Edit item"
                          >
                            <Edit3 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: 12, flexWrap: "wrap", gap: 8 }}>
          <Link
            href={`/app/simulator?semester=${plan.semesterNum}`}
            style={{
              fontSize: 12,
              color: "var(--amber-deep)",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            <Compass size={13} color="var(--amber)" />
            Uji Alternatif Semester Ini di Simulator
          </Link>

          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Task Row Edit Form (Kemampuan A: Ubah Status, Pindah Semester, Hapus)
// ─────────────────────────────────────────────────────────────────────────────
function TaskRowEditForm({
  task,
  currentSemesterNum,
  onSave,
  onMove,
  onDelete,
  onCancel,
}: {
  task: Task;
  currentSemesterNum: number;
  onSave: (updates: Record<string, unknown>) => void;
  onMove: (targetSemesterNum: number) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [status, setStatus] = useState(task.status);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [targetSem, setTargetSem] = useState<number>(currentSemesterNum);
  const [courseCode, setCourseCode] = useState(task.courseCode ?? "");
  const [credits, setCredits] = useState<number>(task.credits ?? 0);
  const [activityPeriod, setActivityPeriod] = useState(task.activityPeriod ?? "");
  const [weeklyHours, setWeeklyHours] = useState<number | undefined>(task.weeklyHours);
  const [targetDate, setTargetDate] = useState(task.targetDate ?? "");

  const isCompleted = task.status === "done";
  const itemType = task.itemType ?? (task.credits === 0 ? "MILESTONE" : "COURSE");

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        borderRadius: "var(--radius-md)",
        padding: "16px",
        marginBottom: 6,
        border: "1px solid var(--blue)",
      }}
      role="form"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ flex: 1, marginRight: 12 }}>
          <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>
            Judul Item
          </label>
          <input
            type="text"
            className="form-input"
            style={{ fontSize: 13, fontWeight: 700 }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>
            Tipe: <strong>{itemType}</strong> • Semester {currentSemesterNum}
          </div>
        </div>

        {/* Delete button (Disabled if done) */}
        {!isCompleted && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={onDelete}
            title="Hapus item ini"
            style={{ color: "var(--coral)", padding: 6 }}
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        {/* Status Dropdown */}
        <div className="form-group">
          <label className="form-label" style={{ fontSize: 11 }}>
            Status Capaian
          </label>
          <select
            className="form-input"
            style={{ fontSize: 12 }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="planned">Direncanakan</option>
            <option value="in_progress">Sedang Berjalan</option>
            <option value="done">Selesai (Lulus)</option>
            <option value="delayed">Perlu Diulang</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>

        {/* Pindahkan ke Semester (Locked if completed) */}
        <div className="form-group">
          <label className="form-label" style={{ fontSize: 11 }}>
            Pindahkan ke Semester (1–14)
          </label>
          {isCompleted ? (
            <div
              style={{
                fontSize: 11.5,
                color: "var(--text-muted)",
                background: "rgba(255, 255, 255, 0.04)",
                padding: "8px 10px",
                borderRadius: "var(--radius-sm)",
                border: "1px dashed var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Lock size={12} color="var(--lime)" />
              <span>Terkunci di Sem {currentSemesterNum} (Mata kuliah lulus tidak dapat dipindah)</span>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              <select
                className="form-input"
                style={{ fontSize: 12 }}
                value={targetSem}
                onChange={(e) => setTargetSem(parseInt(e.target.value) || currentSemesterNum)}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((s) => (
                  <option key={s} value={s}>
                    Semester {s} {s === currentSemesterNum ? "(Saat Ini)" : ""}
                  </option>
                ))}
              </select>
              {targetSem !== currentSemesterNum && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onMove(targetSem)}
                  style={{ flexShrink: 0, fontSize: 11 }}
                >
                  Pindah
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Item-specific fields */}
      {itemType === "COURSE" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: 11 }}>
              Kode Mata Kuliah
            </label>
            <input
              type="text"
              className="form-input"
              style={{ fontSize: 12 }}
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="Misal: IF2101"
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: 11 }}>
              Beban SKS (1–6)
            </label>
            <select
              className="form-input"
              style={{ fontSize: 12 }}
              value={credits}
              onChange={(e) => setCredits(parseInt(e.target.value) || 1)}
            >
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <option key={s} value={s}>
                  {s} SKS
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {itemType === "ACTIVITY" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: 11 }}>
              Periode / Durasi
            </label>
            <input
              type="text"
              className="form-input"
              style={{ fontSize: 12 }}
              value={activityPeriod}
              onChange={(e) => setActivityPeriod(e.target.value)}
              placeholder="Misal: Semester Ganjil 2026"
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: 11 }}>
              Beban Waktu (Jam / Minggu)
            </label>
            <input
              type="number"
              className="form-input"
              style={{ fontSize: 12 }}
              value={weeklyHours ?? ""}
              onChange={(e) => setWeeklyHours(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Misal: 20"
            />
          </div>
        </div>
      )}

      {itemType === "MILESTONE" && (
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label" style={{ fontSize: 11 }}>
            Target Waktu / Tanggal
          </label>
          <input
            type="text"
            className="form-input"
            style={{ fontSize: 12 }}
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            placeholder="Misal: November 2026"
          />
        </div>
      )}

      {/* Notes */}
      <div className="form-group" style={{ marginBottom: 14 }}>
        <label className="form-label" style={{ fontSize: 11 }}>
          Catatan / Rencana
        </label>
        <input
          type="text"
          className="form-input"
          style={{ fontSize: 12 }}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Catatan persiapan atau target capaian..."
        />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn btn-primary btn-sm"
          onClick={() =>
            onSave({
              title,
              status,
              notes,
              courseCode: itemType === "COURSE" ? courseCode : undefined,
              credits: itemType === "COURSE" ? credits : (task.credits ?? 0),
              activityPeriod: itemType === "ACTIVITY" ? activityPeriod : undefined,
              weeklyHours: itemType === "ACTIVITY" ? weeklyHours : undefined,
              targetDate: itemType === "MILESTONE" ? targetDate : undefined,
            })
          }
        >
          Simpan Perubahan
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>
          Batal
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Task Status Icon Helper
// ─────────────────────────────────────────────────────────────────────────────
function TaskStatusBadge({ status }: { status: string }) {
  if (status === "done") {
    return (
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "#DCFCE7",
          border: "1px solid #86EFAC",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#15803D",
          flexShrink: 0,
        }}
        title="Status: Selesai (Lulus)"
      >
        <Check size={12} strokeWidth={2.8} />
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "#CCFBF1",
          border: "1px solid #99F6E4",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#0F766E",
          flexShrink: 0,
        }}
        title="Status: Sedang Berjalan"
      >
        <Clock size={12} strokeWidth={2.5} />
      </span>
    );
  }
  if (status === "delayed") {
    return (
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "#FEE2E2",
          border: "1px solid #FCA5A5",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#991B1B",
          flexShrink: 0,
        }}
        title="Status: Perlu Diulang"
      >
        <AlertCircle size={12} strokeWidth={2.5} />
      </span>
    );
  }
  return (
    <span
      style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: "#F8FAFC",
        border: "1px solid #CBD5E1",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#64748B",
        flexShrink: 0,
      }}
      title="Status: Direncanakan"
    >
      <Circle size={7} fill="#94A3B8" stroke="none" />
    </span>
  );
}
