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
  credits: number;
  courseCode?: string;
  notes?: string;
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

type RoadmapData = {
  roadmap: {
    id: string;
    title: string;
    currentVersion: {
      id: string;
      versionNum: number;
      label: string | null;
      semesterPlans: SemesterPlan[];
    } | null;
    versions: Array<{ id: string; versionNum: number; label: string | null; createdAt: string; isBaseline: boolean }>;
  } | null;
  profile: {
    institutionName: string;
    programName: string;
    currentSemester: number;
    entryYear: number;
    totalCurriculumCredits: number;
    completedCredits: number;
    goals: string;
  } | null;
  calculation: {
    remainingCredits: number;
    estimatedGraduationSemester: number | null;
    isProvisional: boolean;
    conflicts: string[];
    creditsByStatus: Record<string, number>;
  } | null;
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

  // Mode 1: Status Filter
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal: Tambah Mata Kuliah (Kemampuan A)
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [addCourseSemester, setAddCourseSemester] = useState<number>(5);
  const [courseModalTab, setCourseModalTab] = useState<"katalog" | "kustom">("katalog");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [customCourseForm, setCustomCourseForm] = useState({
    title: "",
    courseCode: "",
    credits: 3,
    category: "akademik",
    notes: "",
  });

  // Modal: Tambah Milestone Pribadi (Kemampuan C - Non-SKS)
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [addMilestoneSemester, setAddMilestoneSemester] = useState<number>(5);
  const [customMilestoneForm, setCustomMilestoneForm] = useState({
    title: "",
    category: "karier",
    notes: "",
  });

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

  // Kemampuan A: Tambah Mata Kuliah dari Katalog / Kustom
  const handleAddCourse = async (course: {
    title: string;
    courseCode?: string;
    credits: number;
    category?: string;
    notes?: string;
  }) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({
          action: "add_task",
          semesterNum: addCourseSemester,
          title: course.title,
          courseCode: course.courseCode,
          credits: course.credits,
          category: course.category || "akademik",
          notes: course.notes,
          status: "planned",
          isMilestone: false,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menambahkan mata kuliah.");
      showToast(json.message, "success");
      setShowAddCourseModal(false);
      setExpandedSemesters((prev) => new Set([...prev, addCourseSemester]));
      fetchRoadmap();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Gagal menambahkan", "error");
    }
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
  }) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({
          action: "add_task",
          semesterNum: addMilestoneSemester,
          title: milestone.title,
          category: milestone.category,
          credits: 0, // MUST BE 0 SKS
          notes: milestone.notes,
          status: "planned",
          isMilestone: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menambahkan milestone.");
      showToast(json.message, "success");
      setShowAddMilestoneModal(false);
      setExpandedSemesters((prev) => new Set([...prev, addMilestoneSemester]));
      fetchRoadmap();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Gagal menambahkan milestone", "error");
    }
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

  const filteredCatalog = catalogList.filter((c) => {
    const q = catalogSearch.toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    );
  });

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

  return (
    <div>
      {/* ── Page Header & Actions ── */}
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

        {/* Action Group */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* Toggle Sesuaikan Susunan (subtle, quiet toggle without noisy banners) */}
          <button
            onClick={() => setActiveMode(activeMode === "edit" ? "view" : "edit")}
            className={activeMode === "edit" ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
            style={{ gap: 6, fontSize: 12 }}
            id="btn-toggle-edit-mode"
            title={activeMode === "edit" ? "Selesai Penyesuaian" : "Atur Beban SKS & Urutan"}
          >
            <SlidersHorizontal size={13} />
            <span>{activeMode === "edit" ? "Selesai Mengatur" : "Sesuaikan Susunan"}</span>
          </button>

          {/* Add Course */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setAddCourseSemester(profile?.currentSemester ?? 4);
              setShowAddCourseModal(true);
            }}
            style={{ gap: 5, fontSize: 12 }}
            id="btn-add-course-top"
          >
            <Plus size={13} />
            Mata Kuliah
          </button>

          {/* Template Picker */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setTargetSemesterForApply(0);
              setSelectedTemplateForApply(null);
              setShowTemplatePicker(true);
            }}
            id="btn-open-template-picker"
            style={{ gap: 5, fontSize: 12 }}
          >
            <LayoutTemplate size={13} />
            Template
          </button>

          {/* Version History Toggle */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowHistory(!showHistory)}
            aria-expanded={showHistory}
            style={{ gap: 5, fontSize: 12 }}
            id="btn-toggle-history"
          >
            <History size={13} />
            Riwayat
          </button>

          {/* Clear / Reset Roadmap */}
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleClearRoadmap}
            style={{ gap: 5, fontSize: 12, color: "var(--text-muted)" }}
            id="btn-clear-roadmap"
            title="Kosongkan roadmap saat ini"
          >
            <Trash2 size={13} />
            Kosongkan
          </button>
        </div>
      </div>

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

      {/* ── Consolidated Academic Progress & What-If Summary Strip ── */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "12px 18px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 10.5, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
              SKS Lulus
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#92400E", lineHeight: 1.2 }}>
              {completedCredits} <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>/ {totalCurriculum} SKS</span>
            </div>
          </div>

          <div style={{ width: 110 }}>
            <div className="progress-track" style={{ height: 5 }}>
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, (completedCredits / totalCurriculum) * 100)}%`,
                  background: "var(--amber)",
                }}
              />
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>
              {Math.round((completedCredits / totalCurriculum) * 100)}% Selesai
            </div>
          </div>

          <div style={{ height: 26, width: 1, background: "var(--border-subtle)" }} />

          <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span>
              <strong style={{ color: "var(--text-primary)" }}>{inProgressCredits} SKS</strong> Ditempuh
            </span>
            <span style={{ color: "var(--border)" }}>•</span>
            <span>
              <strong style={{ color: "var(--text-primary)" }}>{remainingCredits} SKS</strong> Sisa Beban
            </span>
            <span style={{ color: "var(--border)" }}>•</span>
            <span>
              Target: <strong style={{ color: "var(--text-primary)" }}>Sem {calc?.estimatedGraduationSemester || 8}</strong>
            </span>
            {totalMilestones > 0 && (
              <>
                <span style={{ color: "var(--border)" }}>•</span>
                <span style={{ color: "var(--teal)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Target size={11} /> {totalMilestones} Milestone Non-SKS
                </span>
              </>
            )}
          </div>
        </div>

        {/* What-If Scenario Link */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            href="/app/simulator"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 11.5, gap: 6, padding: "5px 12px" }}
            title="Coba skenario magang, cuti, atau percepatan tanpa mengubah roadmap utama"
          >
            <Compass size={13} color="var(--lime)" />
            <span>Simulasi What-If</span>
          </Link>
        </div>
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
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "3px",
            gap: 2,
          }}
        >
          <button
            onClick={() => setActiveView("visual")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 14px",
              borderRadius: "var(--radius-sm)",
              fontSize: 12,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              background: activeView === "visual" ? "rgba(255, 255, 255, 0.09)" : "transparent",
              color: activeView === "visual" ? "var(--text-primary)" : "var(--text-muted)",
              transition: "all 0.15s ease",
            }}
            id="tab-view-visual"
          >
            <GitBranch size={13} color={activeView === "visual" ? "var(--lime)" : "var(--text-muted)"} />
            <span>Peta Alur Visual</span>
          </button>

          <button
            onClick={() => setActiveView("timeline")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 14px",
              borderRadius: "var(--radius-sm)",
              fontSize: 12,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              background: activeView === "timeline" ? "rgba(255, 255, 255, 0.09)" : "transparent",
              color: activeView === "timeline" ? "var(--text-primary)" : "var(--text-muted)",
              transition: "all 0.15s ease",
            }}
            id="tab-view-timeline"
          >
            <Calendar size={13} color={activeView === "timeline" ? "var(--lime)" : "var(--text-muted)"} />
            <span>Daftar Semester</span>
          </button>

          <button
            onClick={() => setActiveView("split")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 14px",
              borderRadius: "var(--radius-sm)",
              fontSize: 12,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              background: activeView === "split" ? "rgba(255, 255, 255, 0.09)" : "transparent",
              color: activeView === "split" ? "var(--text-primary)" : "var(--text-muted)",
              transition: "all 0.15s ease",
            }}
            id="tab-view-split"
          >
            <Columns2 size={13} color={activeView === "split" ? "var(--amber)" : "var(--text-muted)"} />
            <span>Berdampingan</span>
          </button>
        </div>

        {/* Quiet Mode Indicator */}
        {activeMode === "edit" ? (
          <div style={{ fontSize: 11.5, color: "var(--amber-deep)", display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--amber)" }} />
            <span>Mode penyesuaian susunan aktif: klik matkul atau tombol tambah untuk mengubah</span>
          </div>
        ) : (
          <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
            {activeView === "visual" && "Geser horizontal untuk melihat 8 semester"}
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
                      border: statusFilter === f.id ? "1px solid rgba(217, 119, 6, 0.4)" : "1px solid var(--border)",
                      background: statusFilter === f.id ? "rgba(245, 205, 71, 0.22)" : "#FFFFFF",
                      color: statusFilter === f.id ? "#92400E" : "var(--text-secondary)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      boxShadow: statusFilter === f.id ? "0 1px 4px rgba(245, 205, 71, 0.2)" : "none",
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

      {/* ── Modal: Kemampuan A (Tambah Mata Kuliah) ── */}
      {showAddCourseModal && (
        <div
          className="dialog-overlay"
          onClick={() => setShowAddCourseModal(false)}
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
                  Tambah Mata Kuliah ke Semester {addCourseSemester}
                </h2>
                <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2 }}>
                  Pilih dari katalog kurikulum program studi atau masukkan mata kuliah kustom.
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddCourseModal(false)} style={{ padding: 6 }}>
                <X size={16} />
              </button>
            </div>

            {/* Tabs: Katalog vs Kustom */}
            <div className="tabs" style={{ marginBottom: 16 }}>
              <button
                className={`tab ${courseModalTab === "katalog" ? "active" : ""}`}
                onClick={() => setCourseModalTab("katalog")}
              >
                <BookOpen size={13} />
                Katalog Kurikulum ({majorKey})
              </button>
              <button
                className={`tab ${courseModalTab === "kustom" ? "active" : ""}`}
                onClick={() => setCourseModalTab("kustom")}
              >
                <Plus size={13} />
                Input Kustom
              </button>
            </div>

            {courseModalTab === "katalog" ? (
              <div>
                {/* Search in Catalog */}
                <div style={{ position: "relative", marginBottom: 14 }}>
                  <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Cari nama matkul, kode (misal: IF1201), atau deskripsi..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    style={{ paddingLeft: 34, fontSize: 13 }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 380, overflowY: "auto", paddingRight: 4 }}>
                  {filteredCatalog.map((course) => (
                    <div
                      key={course.code}
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
                          <span className="badge badge-gray" style={{ fontSize: 10, fontWeight: 700 }}>
                            {course.code}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--amber-deep)", fontWeight: 700 }}>
                            {course.credits} SKS
                          </span>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            • Bawaan Sem {course.semesterNum}
                          </span>
                        </div>
                        <h4 style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                          {course.name}
                        </h4>
                        <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: "3px 0 0", lineHeight: 1.4 }}>
                          {course.description}
                        </p>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() =>
                          handleAddCourse({
                            title: course.name,
                            courseCode: course.code,
                            credits: course.credits,
                            category: course.category,
                            notes: `Dari katalog ${majorKey} (${course.code})`,
                          })
                        }
                        style={{ flexShrink: 0, gap: 4 }}
                      >
                        <Plus size={13} /> Pasang
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Custom Course Form */
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>
                    Nama Mata Kuliah <span style={{ color: "var(--coral)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Pemrograman Mobile Lanjut"
                    value={customCourseForm.title}
                    onChange={(e) => setCustomCourseForm((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>
                      Kode Mata Kuliah
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: IF3205"
                      value={customCourseForm.courseCode}
                      onChange={(e) => setCustomCourseForm((p) => ({ ...p, courseCode: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>
                      Jumlah SKS (1–6)
                    </label>
                    <select
                      className="form-input"
                      value={customCourseForm.credits}
                      onChange={(e) => setCustomCourseForm((p) => ({ ...p, credits: parseInt(e.target.value) || 3 }))}
                    >
                      {[1, 2, 3, 4, 5, 6].map((sks) => (
                        <option key={sks} value={sks}>
                          {sks} SKS
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>
                    Catatan Tambahan
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Matkul elektif peminatan Cloud Engineering"
                    value={customCourseForm.notes}
                    onChange={(e) => setCustomCourseForm((p) => ({ ...p, notes: e.target.value }))}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowAddCourseModal(false)}>
                    Batal
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!customCourseForm.title.trim()}
                    onClick={() =>
                      handleAddCourse({
                        title: customCourseForm.title,
                        courseCode: customCourseForm.courseCode || undefined,
                        credits: customCourseForm.credits,
                        category: customCourseForm.category,
                        notes: customCourseForm.notes,
                      })
                    }
                  >
                    Tambahkan ke Semester {addCourseSemester}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Kemampuan C (Tambah Milestone Pribadi - 0 SKS) ── */}
      {showAddMilestoneModal && (
        <div
          className="dialog-overlay"
          onClick={() => setShowAddMilestoneModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="dialog"
            style={{ maxWidth: 620, maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>
                    Tambah Milestone Pribadi
                  </h2>
                  <span className="badge badge-teal" style={{ fontSize: 10 }}>Non-SKS (0 SKS)</span>
                </div>
                <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2 }}>
                  Tambahkan target magang, sertifikasi, organisasi, lomba, atau bimbingan skripsi ke Semester {addMilestoneSemester}. Item non-SKS <strong>tidak menambah total SKS akademik</strong>.
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddMilestoneModal(false)} style={{ padding: 6 }}>
                <X size={16} />
              </button>
            </div>

            {/* Quick Templates for Milestones */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>
                Pilihan Template Cepat
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {MILESTONE_TEMPLATES.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                      padding: "10px 12px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "border-color 0.2s",
                    }}
                    onClick={() =>
                      handleAddMilestone({
                        title: m.title,
                        category: m.category,
                        notes: m.notes,
                      })
                    }
                  >
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>
                        {m.title}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.3 }}>
                        {m.notes}
                      </div>
                    </div>
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4, color: "var(--amber-deep)", fontSize: 11, fontWeight: 700 }}>
                      <Plus size={11} /> Pasang (0 SKS)
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Milestone Form */}
            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase" }}>
                Atau Masukkan Milestone Kustom
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>
                    Judul Milestone / Kegiatan <span style={{ color: "var(--coral)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Mengikuti Google Solution Challenge 2025"
                    value={customMilestoneForm.title}
                    onChange={(e) => setCustomMilestoneForm((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>
                      Kategori Milestone
                    </label>
                    <select
                      className="form-input"
                      value={customMilestoneForm.category}
                      onChange={(e) => setCustomMilestoneForm((p) => ({ ...p, category: e.target.value }))}
                    >
                      <option value="karier">Karier & Magang</option>
                      <option value="tak">TAK / Organisasi</option>
                      <option value="skripsi">Persiapan Skripsi</option>
                      <option value="pribadi">Portofolio & Lomba</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>
                      Bobot SKS Akademik
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value="0 SKS (Non-Akademik)"
                      disabled
                      style={{ opacity: 0.7 }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>
                    Catatan Rencana
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Target submission proposal sebelum tanggal 15"
                    value={customMilestoneForm.notes}
                    onChange={(e) => setCustomMilestoneForm((p) => ({ ...p, notes: e.target.value }))}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowAddMilestoneModal(false)}>
                    Batal
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!customMilestoneForm.title.trim()}
                    onClick={() => handleAddMilestone(customMilestoneForm)}
                  >
                    Simpan Milestone ke Semester {addMilestoneSemester}
                  </button>
                </div>
              </div>
            </div>
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

  // Kemampuan B: Validasi Beban Kuliah per Semester
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
        border: isOverMax
          ? "1px solid var(--coral)"
          : plan.isCurrentSemester
          ? "1px solid rgba(245, 205, 71, 0.4)"
          : undefined,
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
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                {label}
              </span>
              {plan.isCurrentSemester && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#92400E",
                    background: "rgba(245, 205, 71, 0.22)",
                    border: "1px solid rgba(217, 119, 6, 0.3)",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-sm)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#D97706" }} />
                  Semester Berjalan
                </span>
              )}
              {academicCredits === 0 && (
                <span className="badge badge-gray" style={{ fontSize: 10 }}>Belum ada matkul</span>
              )}
            </div>

            {/* Load summary & milestones summary */}
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ color: isOverMax ? "var(--coral)" : "var(--text-secondary)", fontWeight: 600 }}>
                {academicCredits} SKS Akademik
              </span>
              <span style={{ color: "rgba(255, 255, 255, 0.15)" }}>•</span>
              <span>Target: {plan.targetCredits || 20} SKS</span>
              {milestoneTasks.length > 0 && (
                <>
                  <span style={{ color: "rgba(255, 255, 255, 0.15)" }}>•</span>
                  <span style={{ color: "var(--teal)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Target size={11} /> {milestoneTasks.length} Milestone Non-SKS
                  </span>
                </>
              )}
              <span style={{ color: "rgba(255, 255, 255, 0.15)" }}>•</span>
              <span>{doneCount}/{plan.tasks.length} Selesai</span>
            </div>
          </div>
        </div>

        {/* Right side status indicator & Chevron */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Load Warning Badges (Kemampuan B) */}
          {isOverMax && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--coral)",
                background: "rgba(255, 126, 138, 0.08)",
                border: "1px solid rgba(255, 126, 138, 0.25)",
                padding: "3px 8px",
                borderRadius: "var(--radius-sm)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <AlertTriangle size={12} /> Beban Tinggi (&gt;24 SKS)
            </span>
          )}
          {!isOverMax && isTooLight && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--orange)",
                background: "rgba(255, 158, 102, 0.08)",
                border: "1px solid rgba(255, 158, 102, 0.25)",
                padding: "3px 8px",
                borderRadius: "var(--radius-sm)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <AlertCircle size={12} /> Beban Ringan (&lt;12 SKS)
            </span>
          )}
          {!isOverMax && !isTooLight && isOptimal && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#15803D",
                background: "rgba(22, 163, 74, 0.12)",
                border: "1px solid rgba(22, 163, 74, 0.25)",
                padding: "3px 8px",
                borderRadius: "var(--radius-sm)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Check size={12} /> Beban Ideal
            </span>
          )}

          <div style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", padding: 2 }}>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {/* Semester Body (Accordion Content) */}
      {isExpanded && (
        <div className="semester-card-body">
          {/* Kemampuan B: Alert Box if Overloaded or Too Light */}
          {isOverMax && (
            <div
              style={{
                background: "rgba(255, 126, 138, 0.06)",
                border: "1px solid rgba(255, 126, 138, 0.22)",
                borderRadius: "var(--radius-md)",
                padding: "10px 14px",
                margin: "4px 0 14px",
                fontSize: 12,
                color: "#FFA8B2",
                lineHeight: 1.5,
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <AlertTriangle size={15} color="var(--coral)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Peringatan Beban Kuliah:</strong> Semester ini memiliki beban <strong>{academicCredits} SKS</strong> yang melebihi batas reguler nasional (24 SKS). Beban di atas 24 SKS hanya diperbolehkan dengan IPK minimal 3.00 dan persetujuan khusus Dosen Pembimbing Akademik.
              </div>
            </div>
          )}

          {!isOverMax && isOverTarget && (
            <div
              style={{
                background: "rgba(255, 158, 102, 0.06)",
                border: "1px solid rgba(255, 158, 102, 0.22)",
                borderRadius: "var(--radius-md)",
                padding: "8px 12px",
                margin: "4px 0 14px",
                fontSize: 12,
                color: "#FFAC7A",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AlertCircle size={14} color="var(--orange)" />
              <div>
                <strong>Perhatian:</strong> Beban saat ini ({academicCredits} SKS) melebihi target semester yang kamu tetapkan ({plan.targetCredits} SKS).
              </div>
            </div>
          )}

          {!isOverMax && isTooLight && (
            <div
              style={{
                background: "rgba(245, 205, 71, 0.05)",
                border: "1px solid rgba(245, 205, 71, 0.18)",
                borderRadius: "var(--radius-md)",
                padding: "10px 14px",
                margin: "4px 0 14px",
                fontSize: 12,
                color: "#E8D992",
                lineHeight: 1.5,
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <AlertCircle size={15} color="var(--lime)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Catatan Beban Semester:</strong> Beban semester ini ({academicCredits} SKS) tergolong ringan (&lt; 12 SKS). Pertimbangkan mengambil mata kuliah pilihan lebih awal agar masa studi tetap seimbang dan selesai tepat waktu.
              </div>
            </div>
          )}

          {/* Kemampuan B Control: Set Target Beban SKS Semester (in Mode 2) */}
          {mode === "edit" && (
            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "10px 14px",
                marginBottom: 14,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <SlidersHorizontal size={14} color="var(--lime)" />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)" }}>
                  Target Beban SKS Semester:
                </span>
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

              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={onOpenAddCourse}
                  style={{ fontSize: 11.5, gap: 4 }}
                >
                  <Plus size={12} /> Tambah Matkul
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={onOpenAddMilestone}
                  style={{ fontSize: 11.5, gap: 4 }}
                >
                  <Target size={12} color="var(--teal)" /> + Milestone Non-SKS
                </button>
              </div>
            </div>
          )}

          {/* List of Tasks (Courses & Milestones) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {displayTasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 12px", color: "var(--text-muted)", fontSize: 13 }}>
                Belum ada rencana mata kuliah atau milestone di semester ini.
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
                          background: isCompleted
                            ? "rgba(255, 255, 255, 0.015)"
                            : isNeedsRepeat
                            ? "rgba(255, 126, 138, 0.03)"
                            : isMilestone
                            ? "rgba(117, 189, 165, 0.03)"
                            : "rgba(255, 255, 255, 0.02)",
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

                        {/* Title, Code, & Notes */}
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

                            {/* Milestone Non-SKS badge */}
                            {isMilestone && (
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

                            {/* Completed Course Locked Badge (CRITICAL RULE A) */}
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
                                title="Mata kuliah yang sudah selesai tidak boleh berpindah semester."
                              >
                                <Lock size={9} /> Lulus di Sem {plan.semesterNum}
                              </span>
                            )}

                            {/* Perlu Diulang Badge */}
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

                        {/* Credits & Category */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                          {task.credits > 0 ? (
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-primary)" }}>
                              {task.credits} SKS
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>0 SKS</span>
                          )}

                          {mode === "edit" && (
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ padding: "3px 8px", fontSize: 11, color: "var(--blue)" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTaskId(task.id);
                              }}
                            >
                              Sesuaikan
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
              paddingTop: 10,
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {/* Kemampuan D: Direct Scenario What-If Link for this semester */}
            <Link
              href={`/app/simulator?semester=${plan.semesterNum}`}
              style={{
                fontSize: 11.5,
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

            <button
              className="btn btn-ghost btn-sm"
              onClick={onOpenTemplate}
              style={{ fontSize: 11.5, color: "var(--blue)", gap: 4 }}
            >
              <Plus size={13} /> Tambah dari Template
            </button>
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
          transform: translateY(-3px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.26), 0 0 18px rgba(245, 205, 71, 0.25) !important;
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
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 11 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--text-secondary)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--lime)" }} /> Lulus
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--text-secondary)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--teal)" }} /> Berjalan
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--text-secondary)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--blue)" }} /> Rencana
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--text-secondary)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--coral)" }} /> Perlu Diulang
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--text-secondary)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--orange)" }} /> Milestone Non-SKS
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
          <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 500, marginRight: 2 }}>
            Pilih Semester:
          </span>
          {sortedPlans.map((p) => {
            const isCurrent = p.semesterNum === currentSemester;
            return (
              <button
                key={p.semesterNum}
                onClick={() => scrollToSemester(p.semesterNum)}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "3px 9px",
                  borderRadius: "var(--radius-sm)",
                  border: isCurrent ? "1px solid var(--lime)" : "1px solid var(--border-subtle)",
                  background: isCurrent ? "rgba(245, 205, 71, 0.12)" : "rgba(255, 255, 255, 0.03)",
                  color: isCurrent ? "var(--lime)" : "var(--text-muted)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
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
                        ? "rgba(117, 189, 165, 0.25)"
                        : "rgba(22, 27, 24, 0.95)",
                      border: isCurrent
                        ? "3px solid #FFFFFF"
                        : isPast
                        ? "2px solid var(--teal)"
                        : "2px solid rgba(133, 136, 255, 0.6)",
                      color: isCurrent ? "#0C0D12" : isPast ? "var(--teal)" : "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: 14,
                      boxShadow: isCurrent
                        ? "0 0 20px rgba(245, 205, 71, 0.6)"
                        : isPast
                        ? "0 0 10px rgba(117, 189, 165, 0.3)"
                        : "0 4px 12px rgba(0,0,0,0.5)",
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
                          background: "var(--teal)",
                          color: "#0c0d12",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
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
                      background: "rgba(20, 25, 22, 0.96)",
                      backdropFilter: "blur(16px)",
                      border: isCurrent
                        ? "2px solid var(--lime)"
                        : isOverMax
                        ? "1px solid var(--coral)"
                        : "1px solid rgba(255, 255, 255, 0.14)",
                      borderRadius: "var(--radius-lg)",
                      padding: "13px 15px",
                      boxShadow: isCurrent
                        ? "0 14px 36px rgba(0,0,0,0.24), 0 0 16px rgba(245, 205, 71, 0.25)"
                        : "0 10px 28px rgba(0,0,0,0.16)",
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
                          fill="rgba(20, 25, 22, 0.96)"
                          stroke={isCurrent ? "var(--lime)" : isOverMax ? "var(--coral)" : "rgba(255, 255, 255, 0.16)"}
                          strokeWidth="1.5"
                        />
                        <rect x="1" y="-1" width="22" height="2" fill="rgba(20, 25, 22, 0.96)" />
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
                          fill="rgba(20, 25, 22, 0.96)"
                          stroke={isCurrent ? "var(--lime)" : isOverMax ? "var(--coral)" : "rgba(255, 255, 255, 0.16)"}
                          strokeWidth="1.5"
                        />
                        <rect x="1" y="11" width="22" height="2" fill="rgba(20, 25, 22, 0.96)" />
                      </svg>
                    )}

                    {/* Pop-up Header with Color Accent Dot */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: isCurrent
                              ? "var(--lime)"
                              : isPast
                              ? "var(--teal)"
                              : isOverMax
                              ? "var(--coral)"
                              : "var(--blue)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: isCurrent ? "#0c0d12" : "#FFFFFF",
                            fontSize: 12,
                            fontWeight: 900,
                            flexShrink: 0,
                            boxShadow: isCurrent ? "0 0 10px rgba(245, 205, 71, 0.4)" : "none",
                          }}
                        >
                          {pt.plan.semesterNum}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>
                              Semester {pt.plan.semesterNum}
                            </span>
                            {isCurrent && (
                              <span className="badge badge-lime" style={{ fontSize: 9 }}>
                                Berjalan
                              </span>
                            )}
                            {isPast && (
                              <span className="badge badge-teal" style={{ fontSize: 9 }}>
                                Lulus
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 1 }}>
                            {pt.plan.semesterLabel ?? (profile ? semesterLabel(pt.plan.semesterNum, profile.entryYear) : `Tahun Ke-${Math.ceil(pt.plan.semesterNum / 2)}`)}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: isOverMax ? "var(--coral)" : "var(--lime)" }}>
                          {academicCredits} SKS
                        </span>
                        <div style={{ fontSize: 9.5, color: "var(--text-muted)" }}>
                          Target {pt.plan.targetCredits || 20}
                        </div>
                      </div>
                    </div>

                    {/* Load warnings */}
                    {isOverMax && (
                      <div style={{ fontSize: 10.5, color: "var(--coral)", fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                        <AlertTriangle size={11} /> Beban Padat (&gt;24 SKS)
                      </div>
                    )}
                    {!isOverMax && isTooLight && (
                      <div style={{ fontSize: 10.5, color: "var(--orange)", fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                        <AlertCircle size={11} /> Beban Ringan (&lt;12 SKS)
                      </div>
                    )}

                    {/* Courses Preview (Max 3 items) */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 }}>
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
                              padding: "5px 8px",
                              background: isCompleted
                                ? "rgba(255, 255, 255, 0.02)"
                                : isNeedsRepeat
                                ? "rgba(255, 126, 138, 0.06)"
                                : isMilestone
                                ? "rgba(117, 189, 165, 0.06)"
                                : "rgba(255, 255, 255, 0.04)",
                              borderRadius: "var(--radius-sm)",
                              border: isCompleted
                                ? "1px solid rgba(245, 205, 71, 0.2)"
                                : isMilestone
                                ? "1px dashed rgba(117, 189, 165, 0.3)"
                                : "1px solid var(--border-subtle)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 6,
                              fontSize: 11.5,
                              cursor: mode === "edit" ? "pointer" : "default",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0, flex: 1 }}>
                              <TaskStatusBadge status={task.status} />
                              <span
                                style={{
                                  color: isCompleted ? "var(--text-muted)" : "var(--text-primary)",
                                  textDecoration: isCompleted ? "line-through" : "none",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  fontWeight: 500,
                                }}
                                title={task.title}
                              >
                                {task.title}
                              </span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                              {isCompleted && <Lock size={9} color="var(--lime)" />}
                              <span style={{ fontSize: 10, fontWeight: 700, color: isMilestone ? "var(--teal)" : "var(--text-muted)" }}>
                                {isMilestone ? "0 SKS" : `${task.credits} SKS`}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {pt.plan.tasks.length > 3 && (
                        <div style={{ fontSize: 10.5, color: "var(--text-muted)", textAlign: "center", fontStyle: "italic" }}>
                          +{pt.plan.tasks.length - 3} item lainnya
                        </div>
                      )}
                    </div>

                    {/* Pop-up Card Footer Actions */}
                    <div style={{ display: "flex", gap: 6, alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: 8 }}>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, fontSize: 11, padding: "4px 8px" }}
                        onClick={() => setSelectedSemesterModal(pt.plan.semesterNum)}
                      >
                        {mode === "edit" ? "Sesuaikan Semester" : "Rincian Semester"}
                      </button>

                      {mode === "edit" && (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: 11, padding: "4px 7px" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenAddCourse(pt.plan.semesterNum);
                            }}
                            title="Tambah Mata Kuliah"
                          >
                            <Plus size={11} />
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: 11, padding: "4px 7px", color: "var(--teal)" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenAddMilestone(pt.plan.semesterNum);
                            }}
                            title="Tambah Milestone Non-SKS"
                          >
                            <Target size={11} />
                          </button>
                        </>
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
            <div style={{ fontSize: 20, fontWeight: 800, color: isOverMax ? "var(--coral)" : "var(--lime)" }}>
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
              background: "rgba(255, 126, 138, 0.06)",
              border: "1px solid rgba(255, 126, 138, 0.22)",
              borderRadius: "var(--radius-md)",
              padding: "10px 14px",
              marginBottom: 14,
              fontSize: 12,
              color: "#FFA8B2",
              lineHeight: 1.5,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <AlertTriangle size={15} color="var(--coral)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Peringatan Beban Kuliah:</strong> Semester ini memiliki beban <strong>{academicCredits} SKS</strong> yang melebihi batas reguler nasional (24 SKS).
            </div>
          </div>
        )}
        {!isOverMax && isTooLight && (
          <div
            style={{
              background: "rgba(245, 205, 71, 0.05)",
              border: "1px solid rgba(245, 205, 71, 0.18)",
              borderRadius: "var(--radius-md)",
              padding: "10px 14px",
              marginBottom: 14,
              fontSize: 12,
              color: "#E8D992",
              lineHeight: 1.5,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <AlertCircle size={15} color="var(--lime)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Catatan Beban Semester:</strong> Beban semester ini ({academicCredits} SKS) tergolong ringan (&lt; 12 SKS).
            </div>
          </div>
        )}

        {/* Mode 2 Add Buttons */}
        {mode === "edit" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button className="btn btn-primary btn-sm" onClick={onOpenAddCourse} style={{ flex: 1, gap: 5 }}>
              <Plus size={13} /> Tambah Mata Kuliah
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onOpenAddMilestone} style={{ flex: 1, gap: 5 }}>
              <Target size={13} color="var(--teal)" /> + Milestone Non-SKS
            </button>
          </div>
        )}

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
                          ? "rgba(255, 255, 255, 0.015)"
                          : isNeedsRepeat
                          ? "rgba(255, 126, 138, 0.03)"
                          : isMilestone
                          ? "rgba(117, 189, 165, 0.03)"
                          : "rgba(255, 255, 255, 0.02)",
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

                          {isMilestone && (
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
                            style={{ padding: "4px 8px", fontSize: 11, color: "var(--blue)" }}
                            onClick={() => onEditTaskId(task.id)}
                          >
                            Sesuaikan
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
  const [status, setStatus] = useState(task.status);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [targetSem, setTargetSem] = useState<number>(currentSemesterNum);

  const isCompleted = task.status === "done";
  const isMilestone = task.credits === 0;

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
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
            {task.title} {task.courseCode ? `(${task.courseCode})` : ""}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
            {isMilestone ? "Milestone Pribadi (0 SKS)" : `${task.credits} SKS Akademik`} • Semester {currentSemesterNum}
          </div>
        </div>

        {/* Delete button (Disabled if done) */}
        {!isCompleted && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={onDelete}
            title="Hapus mata kuliah/milestone ini"
            style={{ color: "var(--coral)", padding: 4 }}
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

        {/* Kemampuan A: Ubah Semester Rencana (Locked if completed) */}
        <div className="form-group">
          <label className="form-label" style={{ fontSize: 11 }}>
            Pindahkan ke Semester
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
              <span>Terkunci di Sem {currentSemesterNum} (Mata kuliah yang sudah selesai tidak boleh berpindah semester)</span>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              <select
                className="form-input"
                style={{ fontSize: 12 }}
                value={targetSem}
                onChange={(e) => setTargetSem(parseInt(e.target.value) || currentSemesterNum)}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
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

      {/* Notes */}
      <div className="form-group" style={{ marginBottom: 14 }}>
        <label className="form-label" style={{ fontSize: 11 }}>
          Catatan Pribadi / Target
        </label>
        <input
          type="text"
          className="form-input"
          style={{ fontSize: 12 }}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Misal: Ambil kelas praktikum sesi pagi..."
        />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onSave({ status, notes })}
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
  if (status === "done") return <CheckCircle2 size={16} color="var(--lime)" />;
  if (status === "in_progress") return <Clock size={16} color="var(--teal)" />;
  if (status === "delayed") return <AlertCircle size={16} color="var(--coral)" />;
  if (status === "cancelled") return <Circle size={16} color="var(--text-muted)" />;
  return <Circle size={16} color="var(--blue)" />;
}
