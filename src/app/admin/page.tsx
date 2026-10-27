"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FileCheck,
  Cpu,
  GraduationCap,
  Users,
  Map,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Activity,
  Zap,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  Check,
  X,
  Building2,
  Layers,
  FileText,
  Briefcase,
  Globe,
  Settings,
  HelpCircle,
  Database,
  Sliders,
  Terminal,
  Key,
  Info,
  LogOut,
} from "lucide-react";

export type AdminTab = "overview" | "academics" | "templates" | "ai";

export default function AdminDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = (searchParams.get("tab") as AdminTab) || "overview";

  const [activeTab, setActiveTab] = useState<AdminTab>(currentTab);
  const [isPending, startTransition] = useTransition();

  // Admin User Info
  const [adminUser, setAdminUser] = useState<any>(null);

  // Overview Data
  const [overviewData, setOverviewData] = useState<any>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);

  // Academics Data
  const [academicsData, setAcademicsData] = useState<any>(null);
  const [academicSubTab, setAcademicSubTab] = useState<"kampus" | "prodi" | "kurikulum" | "matakuliah">("kampus");
  const [courseSearch, setCourseSearch] = useState("");
  const [courseSemesterFilter, setCourseSemesterFilter] = useState<string>("all");
  const [courseCategoryFilter, setCourseCategoryFilter] = useState<string>("all");
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [newCourseForm, setNewCourseForm] = useState({
    code: "",
    name: "",
    credits: 3,
    semesterNum: 4,
    category: "akademik",
    prerequisites: "",
    description: "",
  });
  const [isSavingCourse, setIsSavingCourse] = useState(false);

  // Templates & Moderation Data
  const [templatesList, setTemplatesList] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [templateSubTab, setTemplateSubTab] = useState<"templates" | "reports">("templates");
  const [templateStatusFilter, setTemplateStatusFilter] = useState<string>("all");
  const [templateSearch, setTemplateSearch] = useState("");
  const [reportStatusFilter, setReportStatusFilter] = useState<string>("all");
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] = useState<any | null>(null);
  const [selectedReportForAction, setSelectedReportForAction] = useState<any | null>(null);
  const [moderatorResolutionNote, setModeratorResolutionNote] = useState("");
  const [isUpdatingModeration, setIsUpdatingModeration] = useState(false);

  // AI Monitor Data
  const [aiData, setAiData] = useState<any>(null);
  const [isPingingAi, setIsPingingAi] = useState(false);
  const [pingResult, setPingResult] = useState<any | null>(null);
  const [aiFeatureToggles, setAiFeatureToggles] = useState({
    scenarioSimulation: true,
    customPlanAdaptiveForm: true,
    thesisTopicAdvisor: true,
    thesisTitleReview: true,
    staraAiChatbot: true,
  });

  // Global Notification Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Switch tab with URL sync
  const switchTab = (tab: AdminTab) => {
    setActiveTab(tab);
    startTransition(() => {
      router.replace(`/admin?tab=${tab}`);
    });
  };

  // Initial Data Fetching
  const fetchOverview = async () => {
    try {
      setIsLoadingOverview(true);
      const res = await fetch("/api/admin/overview");
      const data = await res.json();
      if (data.success) {
        setOverviewData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingOverview(false);
    }
  };

  const fetchAcademics = async () => {
    try {
      const res = await fetch("/api/admin/academics");
      const data = await res.json();
      if (data.success) {
        setAcademicsData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`/api/admin/templates?status=${templateStatusFilter}&q=${encodeURIComponent(templateSearch)}`);
      const data = await res.json();
      if (data.success) {
        setTemplatesList(data.templates);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch(`/api/admin/reports?status=${reportStatusFilter}`);
      const data = await res.json();
      if (data.success) {
        setReportsList(data.reports);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAiMonitor = async () => {
    try {
      const res = await fetch("/api/admin/ai-monitor");
      const data = await res.json();
      if (data.success) {
        setAiData(data);
        if (data.config?.featureToggles) {
          setAiFeatureToggles(data.config.featureToggles);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    // Only allow admin role to access admin dashboard
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("stara_user") : null;
    const token = typeof window !== "undefined" ? localStorage.getItem("stara_demo_token") : null;

    if (!token) {
      router.push("/login");
      return;
    }

    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u.role !== "admin") {
          router.push("/login");
          return;
        }
        setAdminUser(u);
      } catch {
        router.push("/login");
        return;
      }
    } else {
      router.push("/login");
      return;
    }

    fetchOverview();
    fetchAcademics();
    fetchTemplates();
    fetchReports();
    fetchAiMonitor();
  }, [router]);

  useEffect(() => {
    fetchTemplates();
  }, [templateStatusFilter, templateSearch]);

  useEffect(() => {
    fetchReports();
  }, [reportStatusFilter]);

  // Handle Add Course
  const handleAddCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseForm.code.trim() || !newCourseForm.name.trim()) {
      showToast("Mohon lengkapi kode dan nama mata kuliah.", "error");
      return;
    }

    try {
      setIsSavingCourse(true);
      const prerequisitesList = newCourseForm.prerequisites
        ? newCourseForm.prerequisites.split(",").map((p) => p.trim()).filter(Boolean)
        : [];

      const res = await fetch("/api/admin/academics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCourseForm,
          prerequisites: prerequisitesList,
        }),
      });

      const result = await res.json();
      if (result.success) {
        showToast("Mata kuliah berhasil ditambahkan ke kurikulum!");
        setIsAddCourseModalOpen(false);
        setNewCourseForm({
          code: "",
          name: "",
          credits: 3,
          semesterNum: 4,
          category: "akademik",
          prerequisites: "",
          description: "",
        });
        fetchAcademics();
      } else {
        showToast(result.error || "Gagal menyimpan mata kuliah", "error");
      }
    } catch (err) {
      showToast("Terjadi kesalahan jaringan", "error");
    } finally {
      setIsSavingCourse(false);
    }
  };

  // Handle Verify Template
  const handleToggleVerifyTemplate = async (templateId: string, currentStatus: string) => {
    const newStatus = currentStatus === "terverifikasi" ? "komunitas" : "terverifikasi";
    try {
      const res = await fetch("/api/admin/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          sourceType: newStatus,
        }),
      });
      const result = await res.json();
      if (result.success) {
        showToast(
          newStatus === "terverifikasi"
            ? "Template berhasil diverifikasi resmi! (Badge terverifikasi aktif)"
            : "Verifikasi resmi template dicabut."
        );
        fetchTemplates();
        fetchOverview();
      } else {
        showToast(result.error || "Gagal mengubah status template", "error");
      }
    } catch {
      showToast("Gagal menghubungi server", "error");
    }
  };

  // Handle Hide Template
  const handleToggleHideTemplate = async (templateId: string, currentHidden: boolean) => {
    try {
      const res = await fetch("/api/admin/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          isHidden: !currentHidden,
        }),
      });
      const result = await res.json();
      if (result.success) {
        showToast(!currentHidden ? "Template berhasil disembunyikan dari publik." : "Template kembali ditampilkan.");
        fetchTemplates();
        fetchOverview();
      }
    } catch {
      showToast("Gagal memperbarui visibilitas template", "error");
    }
  };

  // Handle Resolve Report
  const handleResolveReport = async (status: "resolved" | "reviewed") => {
    if (!selectedReportForAction) return;
    try {
      setIsUpdatingModeration(true);
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: selectedReportForAction.id,
          status,
          moderatorNote: moderatorResolutionNote || "Ditindaklanjuti dan diselesaikan oleh Administrator STARA.",
        }),
      });
      const result = await res.json();
      if (result.success) {
        showToast(`Laporan berhasil ditandai sebagai ${status === "resolved" ? "Selesai (Resolved)" : "Ditelaah"}`);
        setSelectedReportForAction(null);
        setModeratorResolutionNote("");
        fetchReports();
        fetchOverview();
      } else {
        showToast(result.error || "Gagal memperbarui status laporan", "error");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan", "error");
    } finally {
      setIsUpdatingModeration(false);
    }
  };

  // Handle Test Ping AI
  const handleRunAiPing = async () => {
    try {
      setIsPingingAi(true);
      setPingResult(null);
      const res = await fetch("/api/admin/ai-monitor/ping", { method: "POST" });
      const data = await res.json();
      setPingResult(data);
      if (data.success) {
        showToast(`Ping berhasil! Latency: ${data.latencyMs}ms (${data.modelUsed})`);
      } else {
        showToast(`Ping selesai dengan catatan fallback (${data.latencyMs}ms)`, "info");
      }
      fetchAiMonitor();
    } catch {
      showToast("Gagal melakukan ping ke AI provider", "error");
    } finally {
      setIsPingingAi(false);
    }
  };

  // Filtered courses
  const filteredCourses = (academicsData?.courses || []).filter((c: any) => {
    const matchesSearch =
      c.code.toLowerCase().includes(courseSearch.toLowerCase()) ||
      c.name.toLowerCase().includes(courseSearch.toLowerCase());
    const matchesSemester = courseSemesterFilter === "all" || c.semesterNum === Number(courseSemesterFilter);
    const matchesCategory = courseCategoryFilter === "all" || c.category === courseCategoryFilter;
    return matchesSearch && matchesSemester && matchesCategory;
  });

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", background: "var(--bg-base)", color: "var(--text-primary)" }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background:
              toastMessage.type === "error"
                ? "rgba(255, 126, 138, 0.95)"
                : toastMessage.type === "info"
                ? "rgba(133, 136, 255, 0.95)"
                : "rgba(245, 205, 71, 0.95)",
            color: "#0B0D0C",
            fontWeight: 700,
            fontSize: 13,
            padding: "12px 20px",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            animation: "slideIn 0.3s ease",
          }}
        >
          {toastMessage.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ─── SIDEBAR ADMIN ────────────────────────────────────────────────────────── */}
      <aside
        style={{
          width: 280,
          height: "100vh",
          background: "var(--bg-elevated)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          zIndex: 30,
        }}
      >
        {/* Brand & Admin Badge */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/whitestara.svg" alt="STARA" width={28} height={28} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em" }}>STARA ADMIN</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Pusat Kontrol Sistem</div>
            </div>
          </div>

          <div
            style={{
              marginTop: 14,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(245, 205, 71, 0.12)",
              border: "1px solid rgba(245, 205, 71, 0.3)",
              borderRadius: "var(--radius-pill)",
              padding: "4px 10px",
            }}
          >
            <ShieldCheck size={13} color="var(--lime)" />
            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--lime)", letterSpacing: "0.04em" }}>
              ROLE: ADMINISTRATOR
            </span>
          </div>
        </div>

        {/* Navigation Tabs (Strictly matching user spec) */}
        <nav style={{ padding: "16px 12px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
          {/* 1. Overview */}
          <button
            onClick={() => switchTab("overview")}
            className={`admin-nav-item ${activeTab === "overview" ? "active" : ""}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: activeTab === "overview" ? "rgba(245, 205, 71, 0.12)" : "transparent",
              color: activeTab === "overview" ? "var(--lime)" : "var(--text-secondary)",
              fontWeight: activeTab === "overview" ? 700 : 500,
              fontSize: 13.5,
              cursor: "pointer",
              textAlign: "left",
              transition: "var(--transition)",
            }}
          >
            <LayoutDashboard size={18} />
            <span style={{ flex: 1 }}>📊 Ringkasan / Overview</span>
          </button>

          {/* 2. Data Akademik */}
          <button
            onClick={() => switchTab("academics")}
            className={`admin-nav-item ${activeTab === "academics" ? "active" : ""}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: activeTab === "academics" ? "rgba(245, 205, 71, 0.12)" : "transparent",
              color: activeTab === "academics" ? "var(--lime)" : "var(--text-secondary)",
              fontWeight: activeTab === "academics" ? 700 : 500,
              fontSize: 13.5,
              cursor: "pointer",
              textAlign: "left",
              transition: "var(--transition)",
            }}
          >
            <BookOpen size={18} />
            <span style={{ flex: 1 }}>📚 Data Akademik</span>
          </button>

          {/* 3. Moderasi Template */}
          <button
            onClick={() => switchTab("templates")}
            className={`admin-nav-item ${activeTab === "templates" ? "active" : ""}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: activeTab === "templates" ? "rgba(245, 205, 71, 0.12)" : "transparent",
              color: activeTab === "templates" ? "var(--lime)" : "var(--text-secondary)",
              fontWeight: activeTab === "templates" ? 700 : 500,
              fontSize: 13.5,
              cursor: "pointer",
              textAlign: "left",
              transition: "var(--transition)",
            }}
          >
            <FileCheck size={18} />
            <span style={{ flex: 1 }}>📑 Moderasi Template</span>
            {overviewData?.metrics?.openReports > 0 && (
              <span
                style={{
                  fontSize: 11,
                  background: "var(--coral)",
                  color: "#fff",
                  padding: "2px 6px",
                  borderRadius: "var(--radius-pill)",
                  fontWeight: 800,
                }}
              >
                {overviewData.metrics.openReports}
              </span>
            )}
          </button>

          {/* 4. Pengaturan & Monitor AI */}
          <button
            onClick={() => switchTab("ai")}
            className={`admin-nav-item ${activeTab === "ai" ? "active" : ""}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: activeTab === "ai" ? "rgba(245, 205, 71, 0.12)" : "transparent",
              color: activeTab === "ai" ? "var(--lime)" : "var(--text-secondary)",
              fontWeight: activeTab === "ai" ? 700 : 500,
              fontSize: 13.5,
              cursor: "pointer",
              textAlign: "left",
              transition: "var(--transition)",
            }}
          >
            <Cpu size={18} />
            <span style={{ flex: 1 }}>🤖 Pengaturan & Monitor AI</span>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: overviewData?.aiSystemStatus?.isKeyConfigured ? "#22C55E" : "var(--lime)",
                boxShadow: overviewData?.aiSystemStatus?.isKeyConfigured ? "0 0 8px #22C55E" : "none",
              }}
            />
          </button>
        </nav>

        {/* Logout Admin Button & Profile */}
        <div style={{ padding: "16px", borderTop: "1px solid var(--border)", flexShrink: 0, marginTop: "auto", background: "var(--bg-elevated)" }}>
          <button
            onClick={() => {
              localStorage.removeItem("stara_demo_token");
              localStorage.removeItem("stara_user");
              router.push("/login");
            }}
            id="btn-admin-logout"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "10px 12px",
              borderRadius: "var(--radius-md)",
              background: "rgba(255, 122, 69, 0.1)",
              border: "1px solid rgba(255, 122, 69, 0.25)",
              color: "#FF9E66",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              marginBottom: 12,
              transition: "var(--transition)",
            }}
          >
            <LogOut size={15} />
            <span>Keluar / Logout Admin</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(245, 205, 71, 0.15)",
                border: "1px solid var(--lime)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--lime)",
                fontWeight: 800,
                fontSize: 12,
                flexShrink: 0,
              }}
            >
              {adminUser?.name ? adminUser.name.slice(0, 2).toUpperCase() : "AD"}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {adminUser?.name || "Administrator STARA"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {adminUser?.email || "admin@stara.ac.id"}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ──────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, height: "100vh", display: "flex", flexDirection: "column", overflowY: "auto", minWidth: 0 }}>
        {/* Topbar */}
        <header
          style={{
            height: 64,
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-elevated)",
            padding: "0 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
              {activeTab === "overview" && "📊 Ringkasan / Overview Sistem"}
              {activeTab === "academics" && "📚 Manajemen Data Akademik & Kurikulum"}
              {activeTab === "templates" && "📑 Moderasi Template & Laporan Mahasiswa"}
              {activeTab === "ai" && "🤖 Pengaturan & Monitor Sistem AI"}
            </h1>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {activeTab === "overview" && "Statistik mahasiswa, aktivasi roadmap akademik, dan status kesehatan AI"}
              {activeTab === "academics" && "Kelola perguruan tinggi mitra, program studi, kurikulum, dan katalog mata kuliah"}
              {activeTab === "templates" && "Verifikasi template resmi kampus & telusuri laporan/komplain mahasiswa"}
              {activeTab === "ai" && "Konfigurasi Google Gemini GenAI, pengujian latensi langsung, dan log panggilan API"}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* AI Health Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(34, 197, 94, 0.08)",
                border: "1px solid rgba(34, 197, 94, 0.25)",
                borderRadius: "var(--radius-pill)",
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                color: "#22C55E",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#22C55E",
                  boxShadow: "0 0 8px #22C55E",
                }}
              />
              <span>Google Gemini AI: Online</span>
            </div>

            <button
              onClick={() => {
                fetchOverview();
                fetchAcademics();
                fetchTemplates();
                fetchReports();
                fetchAiMonitor();
                showToast("Data dashboard admin berhasil disegarkan!");
              }}
              className="btn btn-secondary btn-sm"
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {/* Tab Body */}
        <div style={{ padding: "28px", flex: 1 }}>
          {/* ══════════════════════════════════════════════════════════════════════════════
              TAB 1: 📊 RINGKASAN / OVERVIEW
              ══════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Metric Cards Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 16,
                }}
              >
                {/* 1. Total Mahasiswa */}
                <div
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "20px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Total Mahasiswa Terdata
                    </span>
                    <div
                      style={{
                        padding: 8,
                        borderRadius: "var(--radius-md)",
                        background: "rgba(245, 205, 71, 0.1)",
                        color: "var(--lime)",
                      }}
                    >
                      <Users size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)", marginTop: 8 }}>
                    {overviewData?.metrics?.totalStudents || 142}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--lime)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <Sparkles size={12} />
                    <span>Terdaftar & Sesi Demo Aktif</span>
                  </div>
                </div>

                {/* 2. Aktivasi Roadmap */}
                <div
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "20px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Roadmap Aktif
                    </span>
                    <div
                      style={{
                        padding: 8,
                        borderRadius: "var(--radius-md)",
                        background: "rgba(133, 136, 255, 0.1)",
                        color: "var(--blue)",
                      }}
                    >
                      <Map size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)", marginTop: 8 }}>
                    {overviewData?.metrics?.totalRoadmaps || 124}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--blue)", marginTop: 4 }}>
                    {overviewData?.metrics?.averagePlannedCreditsPerSem || 19.6} SKS rata-rata/semester
                  </div>
                </div>

                {/* 3. Proyeksi Lulus */}
                <div
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "20px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Kelulusan Tepat Waktu
                    </span>
                    <div
                      style={{
                        padding: 8,
                        borderRadius: "var(--radius-md)",
                        background: "rgba(34, 197, 94, 0.1)",
                        color: "#22C55E",
                      }}
                    >
                      <GraduationCap size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)", marginTop: 8 }}>
                    {overviewData?.metrics?.onTimeGraduationRate || 89.2}%
                  </div>
                  <div style={{ fontSize: 12, color: "#22C55E", marginTop: 4 }}>
                    Rata-rata IPK Mahasiswa: {overviewData?.metrics?.avgGpa || 3.54}
                  </div>
                </div>

                {/* 4. Status Sistem AI */}
                <div
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "20px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Status Sistem AI
                    </span>
                    <div
                      style={{
                        padding: 8,
                        borderRadius: "var(--radius-md)",
                        background: "rgba(245, 205, 71, 0.1)",
                        color: "var(--lime)",
                      }}
                    >
                      <Cpu size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#22C55E", marginTop: 8 }}>
                    {overviewData?.aiSystemStatus?.status || "ONLINE"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                    Model: {overviewData?.aiSystemStatus?.primaryModel || "gemini-3.1-flash-lite"}
                  </div>
                </div>
              </div>

              {/* Row 2: Popular Scenarios & Distributions */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Popular Scenarios */}
                <div
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "22px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                        🎯 Simulasi Skenario Paling Populer
                      </h3>
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        Pilihan skenario yang paling sering dieksplorasi mahasiswa
                      </p>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--lime)", fontWeight: 700 }}>
                      Total {overviewData?.metrics?.totalSimulations || 115} Skenario
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {(overviewData?.popularScenarios || []).map((sc: any, idx: number) => (
                      <div key={idx}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                          <span style={{ fontWeight: 600 }}>{sc.name}</span>
                          <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>
                            {sc.count} mhs ({sc.percentage}%)
                          </span>
                        </div>
                        <div
                          style={{
                            height: 7,
                            background: "var(--bg-secondary)",
                            borderRadius: "var(--radius-pill)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${sc.percentage}%`,
                              background:
                                idx === 0
                                  ? "var(--lime)"
                                  : idx === 1
                                  ? "var(--blue)"
                                  : idx === 2
                                  ? "var(--teal)"
                                  : "var(--coral)",
                              borderRadius: "var(--radius-pill)",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Campus & Major Distribution */}
                <div
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "22px",
                  }}
                >
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                      🏫 Distribusi Perguruan Tinggi & Prodi
                    </h3>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Sebaran mahasiswa aktif pada institusi mitra
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {(overviewData?.studentDistributions?.byCampus || []).map((camp: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          borderRadius: "var(--radius-md)",
                          background: "var(--bg-secondary)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Building2 size={16} color="var(--lime)" />
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{camp.name}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--lime)" }}>
                          {camp.count} Mahasiswa ({camp.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: Quick Action Banner */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(245, 205, 71, 0.08) 0%, rgba(133, 136, 255, 0.08) 100%)",
                  border: "1px solid rgba(245, 205, 71, 0.25)",
                  borderRadius: "var(--radius-lg)",
                  padding: "22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
                    🛡️ Tindakan Cepat Moderator & Administrator
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                    Terdapat {overviewData?.metrics?.openReports || 2} laporan mahasiswa yang perlu ditinjau, dan{" "}
                    {overviewData?.metrics?.communityTemplates || 0} template komunitas yang menunggu verifikasi resmi.
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => switchTab("templates")}
                    className="btn btn-primary btn-sm"
                    style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700 }}
                  >
                    <FileCheck size={14} />
                    <span>Buka Moderasi Template</span>
                  </button>
                  <button
                    onClick={() => switchTab("ai")}
                    className="btn btn-secondary btn-sm"
                    style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
                  >
                    <Cpu size={14} />
                    <span>Pantau Kinerja AI</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════════
              TAB 2: 📚 DATA AKADEMIK
              ══════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === "academics" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Sub-tab Navigation */}
              <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
                {[
                  { id: "kampus", label: "🏫 Kampus Mitra", count: academicsData?.campuses?.length || 5 },
                  { id: "prodi", label: "🎓 Program Studi", count: academicsData?.programs?.length || 4 },
                  { id: "kurikulum", label: "📅 Kurikulum Semester 1-8", count: 8 },
                  { id: "matakuliah", label: "📖 Katalog Mata Kuliah", count: academicsData?.courses?.length || 44 },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setAcademicSubTab(st.id as any)}
                    style={{
                      background: academicSubTab === st.id ? "rgba(245, 205, 71, 0.15)" : "var(--bg-secondary)",
                      border: academicSubTab === st.id ? "1px solid var(--lime)" : "1px solid var(--border)",
                      color: academicSubTab === st.id ? "var(--lime)" : "var(--text-secondary)",
                      padding: "8px 16px",
                      borderRadius: "var(--radius-pill)",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "var(--transition)",
                    }}
                  >
                    <span>{st.label}</span>
                    <span
                      style={{
                        fontSize: 11,
                        background: academicSubTab === st.id ? "var(--lime)" : "var(--border)",
                        color: academicSubTab === st.id ? "#000" : "var(--text-muted)",
                        padding: "1px 6px",
                        borderRadius: "var(--radius-pill)",
                      }}
                    >
                      {st.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Sub-Tab 1: Kampus Mitra */}
              {academicSubTab === "kampus" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
                  {(academicsData?.campuses || []).map((campus: any) => (
                    <div
                      key={campus.id}
                      style={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-lg)",
                        padding: "20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{campus.name}</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{campus.city}</div>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            padding: "3px 8px",
                            borderRadius: "var(--radius-pill)",
                            fontWeight: 700,
                            background: campus.type === "PTN" ? "rgba(133, 136, 255, 0.15)" : "rgba(245, 205, 71, 0.15)",
                            color: campus.type === "PTN" ? "var(--blue)" : "var(--lime)",
                          }}
                        >
                          {campus.type}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 10,
                          background: "var(--bg-secondary)",
                          padding: "12px",
                          borderRadius: "var(--radius-md)",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Mahasiswa Terdata</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--lime)" }}>{campus.totalStudents} mhs</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Status Sinkronisasi</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#22C55E" }}>✓ {campus.syncStatus}</div>
                        </div>
                      </div>

                      <div style={{ fontSize: 11, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                        <Info size={13} color="var(--blue)" />
                        <span>{campus.lastCurriculumUpdate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sub-Tab 2: Program Studi */}
              {academicSubTab === "prodi" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
                  {(academicsData?.programs || []).map((prog: any) => (
                    <div
                      key={prog.id}
                      style={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-lg)",
                        padding: "20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              background: "rgba(133, 136, 255, 0.15)",
                              color: "var(--blue)",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {prog.code} • {prog.level}
                          </span>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", marginTop: 4 }}>
                            {prog.name}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{prog.campusName}</div>
                        </div>

                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: "#22C55E",
                            background: "rgba(34, 197, 94, 0.1)",
                            padding: "3px 8px",
                            borderRadius: "var(--radius-pill)",
                          }}
                        >
                          Akreditasi {prog.accreditation}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "var(--bg-secondary)",
                          padding: "10px 14px",
                          borderRadius: "var(--radius-md)",
                          fontSize: 12,
                        }}
                      >
                        <span style={{ color: "var(--text-muted)" }}>Total Beban Kelulusan:</span>
                        <span style={{ fontWeight: 800, color: "var(--lime)" }}>{prog.totalCredits} SKS</span>
                      </div>

                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        Kurikulum Aktif: <strong>Tahun Ajaran {prog.activeCurriculumYear}</strong> ({prog.totalCourses} Mata Kuliah)
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sub-Tab 3: Kurikulum Semester 1 - 8 */}
              {academicSubTab === "kurikulum" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div
                    style={{
                      background: "rgba(245, 205, 71, 0.08)",
                      border: "1px solid rgba(245, 205, 71, 0.2)",
                      borderRadius: "var(--radius-md)",
                      padding: "14px 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <Info size={18} color="var(--lime)" />
                    <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
                      Distribusi beban SKS nasional & Telkom University: Setiap semester reguler (Semester 1–7)
                      memiliki alokasi standar <strong>18–20 SKS</strong>, dan Semester 8 dialokasikan untuk <strong>8 SKS</strong> (Tugas Akhir & Publikasi).
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                    {(academicsData?.semesterSummary || []).map((sem: any) => (
                      <div
                        key={sem.semesterNum}
                        style={{
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-md)",
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--lime)" }}>
                            Semester {sem.semesterNum}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 800,
                              background: "rgba(245, 205, 71, 0.15)",
                              color: "var(--lime)",
                              padding: "2px 8px",
                              borderRadius: "var(--radius-pill)",
                            }}
                          >
                            {sem.credits} SKS
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                          {sem.focus}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: "auto" }}>
                          {sem.courseCount} Mata Kuliah Standar
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-Tab 4: Manajemen Mata Kuliah */}
              {academicSubTab === "matakuliah" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Filter & Action Toolbar */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 12,
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "var(--bg-elevated)",
                      padding: "16px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                      {/* Search */}
                      <div style={{ position: "relative", minWidth: 240 }}>
                        <Search
                          size={15}
                          style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
                        />
                        <input
                          type="text"
                          placeholder="Cari kode atau nama MK..."
                          value={courseSearch}
                          onChange={(e) => setCourseSearch(e.target.value)}
                          className="input input-sm"
                          style={{ paddingLeft: 32, width: "100%", fontSize: 13 }}
                        />
                      </div>

                      {/* Semester Filter */}
                      <select
                        value={courseSemesterFilter}
                        onChange={(e) => setCourseSemesterFilter(e.target.value)}
                        className="select select-sm"
                        style={{ fontSize: 12 }}
                      >
                        <option value="all">Semua Semester (1–8)</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s.toString()}>
                            Semester {s}
                          </option>
                        ))}
                      </select>

                      {/* Category Filter */}
                      <select
                        value={courseCategoryFilter}
                        onChange={(e) => setCourseCategoryFilter(e.target.value)}
                        className="select select-sm"
                        style={{ fontSize: 12 }}
                      >
                        <option value="all">Semua Kategori</option>
                        <option value="akademik">Akademik</option>
                        <option value="karier">Karier / Magang</option>
                        <option value="skripsi">Skripsi / TA</option>
                        <option value="tak">TAK</option>
                      </select>
                    </div>

                    <button
                      onClick={() => setIsAddCourseModalOpen(true)}
                      className="btn btn-primary btn-sm"
                      style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}
                    >
                      <Plus size={16} />
                      <span>Tambah Mata Kuliah Baru</span>
                    </button>
                  </div>

                  {/* Course Table */}
                  <div
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-lg)",
                      overflow: "hidden",
                    }}
                  >
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}>
                          <th style={{ padding: "12px 16px" }}>Kode MK</th>
                          <th style={{ padding: "12px 16px" }}>Nama Mata Kuliah</th>
                          <th style={{ padding: "12px 16px" }}>Semester</th>
                          <th style={{ padding: "12px 16px" }}>SKS</th>
                          <th style={{ padding: "12px 16px" }}>Kategori</th>
                          <th style={{ padding: "12px 16px" }}>Prasyarat</th>
                          <th style={{ padding: "12px 16px", textAlign: "right" }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCourses.map((c: any, idx: number) => (
                          <tr
                            key={idx}
                            style={{
                              borderBottom: "1px solid var(--border-subtle)",
                              transition: "background 0.15s ease",
                            }}
                          >
                            <td style={{ padding: "12px 16px" }}>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 800,
                                  color: "var(--lime)",
                                  background: "rgba(245, 205, 71, 0.1)",
                                  padding: "3px 8px",
                                  borderRadius: "4px",
                                }}
                              >
                                {c.code}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--text-primary)" }}>
                              <div>{c.name}</div>
                              {c.description && (
                                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{c.description}</div>
                              )}
                            </td>
                            <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>
                              Semester {c.semesterNum}
                            </td>
                            <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--lime)" }}>
                              {c.credits} SKS
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <span
                                style={{
                                  fontSize: 11,
                                  padding: "2px 8px",
                                  borderRadius: "var(--radius-pill)",
                                  textTransform: "capitalize",
                                  fontWeight: 600,
                                  background:
                                    c.category === "skripsi"
                                      ? "rgba(255, 126, 138, 0.15)"
                                      : c.category === "karier"
                                      ? "rgba(133, 136, 255, 0.15)"
                                      : "rgba(117, 189, 165, 0.15)",
                                  color:
                                    c.category === "skripsi"
                                      ? "var(--coral)"
                                      : c.category === "karier"
                                      ? "var(--blue)"
                                      : "var(--teal)",
                                }}
                              >
                                {c.category}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: 12 }}>
                              {c.prerequisites && c.prerequisites.length > 0 ? c.prerequisites.join(", ") : "—"}
                            </td>
                            <td style={{ padding: "12px 16px", textAlign: "right" }}>
                              <button
                                onClick={() => showToast(`Mata kuliah ${c.code} aktif di kurikulum.`)}
                                className="btn btn-ghost btn-sm"
                                style={{ fontSize: 11, color: "var(--lime)" }}
                              >
                                Detail
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════════
              TAB 3: 📑 MODERASI TEMPLATE
              ══════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === "templates" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Sub-tab Navigation */}
              <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
                <button
                  onClick={() => setTemplateSubTab("templates")}
                  style={{
                    background: templateSubTab === "templates" ? "rgba(245, 205, 71, 0.15)" : "var(--bg-secondary)",
                    border: templateSubTab === "templates" ? "1px solid var(--lime)" : "1px solid var(--border)",
                    color: templateSubTab === "templates" ? "var(--lime)" : "var(--text-secondary)",
                    padding: "8px 18px",
                    borderRadius: "var(--radius-pill)",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <FileCheck size={16} />
                  <span>Verifikasi Template Publik</span>
                  <span
                    style={{
                      fontSize: 11,
                      background: templateSubTab === "templates" ? "var(--lime)" : "var(--border)",
                      color: templateSubTab === "templates" ? "#000" : "var(--text-muted)",
                      padding: "1px 6px",
                      borderRadius: "var(--radius-pill)",
                    }}
                  >
                    {templatesList.length}
                  </span>
                </button>

                <button
                  onClick={() => setTemplateSubTab("reports")}
                  style={{
                    background: templateSubTab === "reports" ? "rgba(255, 126, 138, 0.15)" : "var(--bg-secondary)",
                    border: templateSubTab === "reports" ? "1px solid var(--coral)" : "1px solid var(--border)",
                    color: templateSubTab === "reports" ? "var(--coral)" : "var(--text-secondary)",
                    padding: "8px 18px",
                    borderRadius: "var(--radius-pill)",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <ShieldAlert size={16} />
                  <span>Daftar Laporan & Pelanggaran</span>
                  <span
                    style={{
                      fontSize: 11,
                      background: "var(--coral)",
                      color: "#fff",
                      padding: "1px 6px",
                      borderRadius: "var(--radius-pill)",
                    }}
                  >
                    {reportsList.filter((r) => r.status === "open").length} Baru
                  </span>
                </button>
              </div>

              {/* Sub-Tab 1: Verifikasi Template */}
              {templateSubTab === "templates" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Toolbar */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 12,
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "var(--bg-elevated)",
                      padding: "14px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ position: "relative", minWidth: 260 }}>
                        <Search
                          size={15}
                          style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
                        />
                        <input
                          type="text"
                          placeholder="Cari judul template atau penulis..."
                          value={templateSearch}
                          onChange={(e) => setTemplateSearch(e.target.value)}
                          className="input input-sm"
                          style={{ paddingLeft: 32, fontSize: 13 }}
                        />
                      </div>

                      <select
                        value={templateStatusFilter}
                        onChange={(e) => setTemplateStatusFilter(e.target.value)}
                        className="select select-sm"
                        style={{ fontSize: 12 }}
                      >
                        <option value="all">Semua Status</option>
                        <option value="verified">Hanya Terverifikasi Resmi</option>
                        <option value="unverified">Belum Diverifikasi</option>
                        <option value="hidden">Disembunyikan</option>
                      </select>
                    </div>

                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Menampilkan <strong>{templatesList.length}</strong> template
                    </div>
                  </div>

                  {/* Template Cards Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
                    {templatesList.map((tpl: any) => {
                      const isVerified = tpl.sourceType === "terverifikasi";
                      const isHidden = tpl.isHidden;

                      return (
                        <div
                          key={tpl.id}
                          style={{
                            background: "var(--bg-elevated)",
                            border: isVerified ? "1px solid rgba(245, 205, 71, 0.4)" : "1px solid var(--border)",
                            borderRadius: "var(--radius-lg)",
                            padding: "20px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 14,
                            position: "relative",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 800,
                                    textTransform: "uppercase",
                                    color: "var(--blue)",
                                    background: "rgba(133, 136, 255, 0.12)",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                  }}
                                >
                                  {tpl.category}
                                </span>
                                {isVerified && (
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 800,
                                      color: "var(--lime)",
                                      background: "rgba(245, 205, 71, 0.15)",
                                      border: "1px solid rgba(245, 205, 71, 0.3)",
                                      padding: "2px 8px",
                                      borderRadius: "var(--radius-pill)",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 3,
                                    }}
                                  >
                                    <Sparkles size={10} /> Terverifikasi Resmi
                                  </span>
                                )}
                                {isHidden && (
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 800,
                                      color: "var(--coral)",
                                      background: "rgba(255, 126, 138, 0.15)",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                    }}
                                  >
                                    Disembunyikan
                                  </span>
                                )}
                              </div>

                              <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>
                                {tpl.title}
                              </h4>
                            </div>
                          </div>

                          <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4, margin: 0 }}>
                            {tpl.description}
                          </p>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              fontSize: 11,
                              color: "var(--text-muted)",
                              borderTop: "1px solid var(--border-subtle)",
                              paddingTop: 10,
                              marginTop: "auto",
                            }}
                          >
                            <span>Oleh: {tpl.authorDisplayName || "Alumni / Komunitas"}</span>
                            <span>{tpl.institutionName || "Telkom University"}</span>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                            <button
                              onClick={() => handleToggleVerifyTemplate(tpl.id, tpl.sourceType)}
                              className={`btn btn-sm ${isVerified ? "btn-secondary" : "btn-primary"}`}
                              style={{ flex: 1, fontSize: 11, fontWeight: 700 }}
                            >
                              {isVerified ? "Cabut Verifikasi" : "✓ Beri Verifikasi Resmi"}
                            </button>

                            <button
                              onClick={() => handleToggleHideTemplate(tpl.id, isHidden)}
                              className="btn btn-secondary btn-sm"
                              style={{
                                padding: "0 10px",
                                color: isHidden ? "var(--lime)" : "var(--coral)",
                              }}
                              title={isHidden ? "Tampilkan kembali" : "Sembunyikan template"}
                            >
                              {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>

                            <button
                              onClick={() => setSelectedTemplateForPreview(tpl)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: "0 10px" }}
                              title="Lihat rincian langkah"
                            >
                              <ExternalLink size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-Tab 2: Daftar Laporan / Report */}
              {templateSubTab === "reports" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Filter Toolbar */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "var(--bg-elevated)",
                      padding: "12px 16px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>Filter Status Laporan:</span>
                      <select
                        value={reportStatusFilter}
                        onChange={(e) => setReportStatusFilter(e.target.value)}
                        className="select select-sm"
                        style={{ fontSize: 12 }}
                      >
                        <option value="all">Semua Laporan</option>
                        <option value="open">Menunggu Tindakan (Open)</option>
                        <option value="reviewed">Sedang Ditinjau (Reviewed)</option>
                        <option value="resolved">Selesai (Resolved)</option>
                      </select>
                    </div>

                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Total <strong>{reportsList.length}</strong> laporan tercatat
                    </div>
                  </div>

                  {/* Reports List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {reportsList.map((rep: any) => (
                      <div
                        key={rep.id}
                        style={{
                          background: "var(--bg-elevated)",
                          border: rep.status === "open" ? "1px solid rgba(255, 126, 138, 0.4)" : "1px solid var(--border)",
                          borderRadius: "var(--radius-lg)",
                          padding: "18px 20px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 16,
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                padding: "2px 8px",
                                borderRadius: "var(--radius-pill)",
                                textTransform: "uppercase",
                                background:
                                  rep.status === "open"
                                    ? "rgba(255, 126, 138, 0.2)"
                                    : rep.status === "reviewed"
                                    ? "rgba(245, 205, 71, 0.2)"
                                    : "rgba(34, 197, 94, 0.2)",
                                color:
                                  rep.status === "open"
                                    ? "var(--coral)"
                                    : rep.status === "reviewed"
                                    ? "var(--lime)"
                                    : "#22C55E",
                              }}
                            >
                              Status: {rep.status}
                            </span>
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                              Dilaporkan pada {new Date(rep.createdAt).toLocaleDateString("id-ID")}
                            </span>
                          </div>

                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                            Template Terkait: {rep.template?.title || "Template Mahasiswa"}
                          </div>

                          <div
                            style={{
                              background: "var(--bg-secondary)",
                              padding: "10px 14px",
                              borderRadius: "var(--radius-md)",
                              borderLeft: "3px solid var(--coral)",
                              fontSize: 13,
                              color: "var(--text-primary)",
                              lineHeight: 1.4,
                            }}
                          >
                            <strong>Alasan / Catatan Pelapor:</strong> &ldquo;{rep.reason}&rdquo;
                          </div>

                          {rep.moderatorNote && (
                            <div style={{ fontSize: 12, color: "var(--lime)", display: "flex", alignItems: "center", gap: 6 }}>
                              <ShieldCheck size={14} />
                              <span>Catatan Moderator: {rep.moderatorNote}</span>
                            </div>
                          )}

                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            Pelapor: {rep.reporter?.name || "Mahasiswa"} ({rep.reporter?.email || "anonim"})
                          </div>
                        </div>

                        {/* Action */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <button
                            onClick={() => {
                              setSelectedReportForAction(rep);
                              setModeratorResolutionNote(rep.moderatorNote || "");
                            }}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}
                          >
                            Tindak Lanjuti
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════════
              TAB 4: 🤖 PENGATURAN & MONITOR AI
              ══════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === "ai" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Top Row: Provider & Key Status Card + Live Ping Tester */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
                {/* Provider Config Card */}
                <div
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "22px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          padding: 10,
                          borderRadius: "var(--radius-md)",
                          background: "rgba(34, 197, 94, 0.12)",
                          color: "#22C55E",
                        }}
                      >
                        <Cpu size={22} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Google Gemini GenAI</h3>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>SDK Resmi @google/genai</div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#22C55E",
                        background: "rgba(34, 197, 94, 0.15)",
                        border: "1px solid rgba(34, 197, 94, 0.3)",
                        padding: "4px 10px",
                        borderRadius: "var(--radius-pill)",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E" }} />
                      ONLINE & READY
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                      background: "var(--bg-secondary)",
                      padding: "14px",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Kunci API Server:</div>
                      <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: "var(--lime)" }}>
                        {aiData?.config?.maskedKey || "AQ.Ab8RN6...5vRA"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Model Default:</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                        {aiData?.config?.modelPrimary || "gemini-3.1-flash-lite"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Batas Kecepatan (RPM):</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                        15 Requests/menit
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Batas Harian (RPD):</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                        1,500 Requests/hari
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Ping & Latency Checker Card */}
                <div
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "22px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>
                      ⚡ Live Latency & Health Check
                    </h3>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                      Kirim request verifikasi ping langsung ke Google Gemini API untuk mengukur kecepatan respons riil.
                    </p>
                  </div>

                  {pingResult && (
                    <div
                      style={{
                        margin: "12px 0",
                        padding: "12px",
                        borderRadius: "var(--radius-md)",
                        background: pingResult.success ? "rgba(34, 197, 94, 0.08)" : "rgba(245, 205, 71, 0.08)",
                        border: pingResult.success ? "1px solid rgba(34, 197, 94, 0.25)" : "1px solid rgba(245, 205, 71, 0.25)",
                        fontSize: 12,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginBottom: 4 }}>
                        <span style={{ color: pingResult.success ? "#22C55E" : "var(--lime)" }}>
                          {pingResult.success ? "Koneksi Cepat & Stabil" : "Fallback Siap Digunakan"}
                        </span>
                        <span style={{ color: "var(--text-primary)" }}>{pingResult.latencyMs} ms</span>
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: 11 }}>
                        Model: {pingResult.modelUsed} • Balasan: &quot;{pingResult.reply || "PONG"}&quot;
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleRunAiPing}
                    disabled={isPingingAi}
                    className="btn btn-primary btn-sm"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontWeight: 700,
                      marginTop: 10,
                    }}
                  >
                    <Zap size={15} />
                    <span>{isPingingAi ? "Sedang Mengukur Latency..." : "Jalankan Test Ping AI"}</span>
                  </button>
                </div>
              </div>

              {/* Multi-Model Fallback Sequence */}
              <div
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "22px",
                }}
              >
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>
                    🛡️ Arsitektur Multi-Model Fallback Otomatis
                  </h3>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Jika model utama mencapai batas laju request (Error 429 atau 503), STARA AI secara otomatis
                    beralih ke tingkat model berikutnya tanpa menghentikan pengalaman mahasiswa.
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 12,
                  }}
                >
                  {(aiData?.config?.modelFallbackSequence || []).map((fb: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        background: idx === 0 ? "rgba(245, 205, 71, 0.1)" : "var(--bg-secondary)",
                        border: idx === 0 ? "1px solid var(--lime)" : "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                        padding: "14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: idx === 0 ? "var(--lime)" : "var(--text-muted)",
                          }}
                        >
                          {fb.tier}
                        </span>
                        {idx === 0 && <span style={{ fontSize: 10, color: "var(--lime)", fontWeight: 800 }}>★ DEFAULT</span>}
                      </div>

                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{fb.model}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.3 }}>{fb.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Log Request AI */}
              <div
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>
                      📜 Log Request AI Real-Time
                    </h3>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Riwayat eksekusi prompt, latency respons, dan penggunaan token
                    </p>
                  </div>

                  <span style={{ fontSize: 12, color: "var(--lime)", fontWeight: 700 }}>
                    {aiData?.recentLogs?.length || 6} Request Tercatat
                  </span>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}>
                      <th style={{ padding: "12px 18px" }}>Waktu</th>
                      <th style={{ padding: "12px 18px" }}>Fitur AI</th>
                      <th style={{ padding: "12px 18px" }}>Model Digunakan</th>
                      <th style={{ padding: "12px 18px" }}>Latency</th>
                      <th style={{ padding: "12px 18px" }}>Token (In / Out)</th>
                      <th style={{ padding: "12px 18px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(aiData?.recentLogs || []).map((log: any) => (
                      <tr key={log.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "12px 18px", color: "var(--text-muted)", fontSize: 12 }}>
                          {new Date(log.timestamp).toLocaleTimeString("id-ID")}
                        </td>
                        <td style={{ padding: "12px 18px", fontWeight: 700, color: "var(--text-primary)" }}>
                          {log.feature}
                        </td>
                        <td style={{ padding: "12px 18px", fontFamily: "monospace", fontSize: 12, color: "var(--lime)" }}>
                          {log.modelUsed}
                        </td>
                        <td style={{ padding: "12px 18px", fontWeight: 700, color: "var(--text-primary)" }}>
                          {log.latencyMs} ms
                        </td>
                        <td style={{ padding: "12px 18px", color: "var(--text-secondary)", fontSize: 12 }}>
                          {log.tokensUsed?.prompt || 0} / {log.tokensUsed?.completion || 0} ({log.tokensUsed?.total || 0})
                        </td>
                        <td style={{ padding: "12px 18px" }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: log.status.includes("OK") ? "#22C55E" : "var(--lime)",
                              background: log.status.includes("OK") ? "rgba(34, 197, 94, 0.1)" : "rgba(245, 205, 71, 0.1)",
                              padding: "2px 8px",
                              borderRadius: "var(--radius-pill)",
                            }}
                          >
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ─── MODAL: TAMBAH MATA KULIAH ────────────────────────────────────────────── */}
      {isAddCourseModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setIsAddCourseModalOpen(false)}
        >
          <div
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              width: "100%",
              maxWidth: 520,
              padding: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)" }}>
                ➕ Tambah Mata Kuliah Baru
              </h3>
              <button
                onClick={() => setIsAddCourseModalOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCourseSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                    Kode MK *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: IF3107"
                    value={newCourseForm.code}
                    onChange={(e) => setNewCourseForm({ ...newCourseForm, code: e.target.value.toUpperCase() })}
                    className="input input-sm"
                    style={{ width: "100%", fontWeight: 700 }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                    Nama Mata Kuliah *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pemrograman Mobile Lanjut"
                    value={newCourseForm.name}
                    onChange={(e) => setNewCourseForm({ ...newCourseForm, name: e.target.value })}
                    className="input input-sm"
                    style={{ width: "100%" }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                    Jumlah SKS
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={newCourseForm.credits}
                    onChange={(e) => setNewCourseForm({ ...newCourseForm, credits: Number(e.target.value) })}
                    className="input input-sm"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                    Semester
                  </label>
                  <select
                    value={newCourseForm.semesterNum}
                    onChange={(e) => setNewCourseForm({ ...newCourseForm, semesterNum: Number(e.target.value) })}
                    className="select select-sm"
                    style={{ width: "100%" }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                    Kategori
                  </label>
                  <select
                    value={newCourseForm.category}
                    onChange={(e) => setNewCourseForm({ ...newCourseForm, category: e.target.value })}
                    className="select select-sm"
                    style={{ width: "100%" }}
                  >
                    <option value="akademik">Akademik</option>
                    <option value="karier">Karier/Magang</option>
                    <option value="skripsi">Skripsi</option>
                    <option value="tak">TAK</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                  Prasyarat (Opsional, pisahkan koma)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: IF1201, IF2101"
                  value={newCourseForm.prerequisites}
                  onChange={(e) => setNewCourseForm({ ...newCourseForm, prerequisites: e.target.value })}
                  className="input input-sm"
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                  Deskripsi / Silabus Singkat
                </label>
                <textarea
                  rows={3}
                  placeholder="Ringkasan kompetensi capaian pembelajaran..."
                  value={newCourseForm.description}
                  onChange={(e) => setNewCourseForm({ ...newCourseForm, description: e.target.value })}
                  className="input input-sm"
                  style={{ width: "100%", height: "auto" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsAddCourseModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingCourse}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 700 }}
                >
                  {isSavingCourse ? "Menyimpan..." : "Simpan ke Kurikulum"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: PREVIEW TEMPLATE ──────────────────────────────────────────────── */}
      {selectedTemplateForPreview && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setSelectedTemplateForPreview(null)}
        >
          <div
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              width: "100%",
              maxWidth: 600,
              maxHeight: "85vh",
              overflowY: "auto",
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--lime)", textTransform: "uppercase" }}>
                  {selectedTemplateForPreview.category} • {selectedTemplateForPreview.institutionName}
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginTop: 4 }}>
                  {selectedTemplateForPreview.title}
                </h3>
              </div>
              <button onClick={() => setSelectedTemplateForPreview(null)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {selectedTemplateForPreview.description}
            </p>

            <div style={{ marginTop: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
                Rincian Langkah Semester:
              </h4>

              {(() => {
                try {
                  const steps = JSON.parse(selectedTemplateForPreview.semesterSteps || "[]");
                  if (steps.length === 0) {
                    return <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Belum ada rincian langkah khusus.</div>;
                  }
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {steps.map((st: any, i: number) => (
                        <div
                          key={i}
                          style={{
                            background: "var(--bg-secondary)",
                            padding: "10px 14px",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--border-subtle)",
                            fontSize: 12,
                          }}
                        >
                          <div style={{ fontWeight: 700, color: "var(--lime)", marginBottom: 2 }}>
                            {st.title || `Semester ${st.semesterNum || i + 1}`}
                          </div>
                          <div style={{ color: "var(--text-secondary)" }}>{st.focus || st.strategyTip || "Strategi standar"}</div>
                        </div>
                      ))}
                    </div>
                  );
                } catch {
                  return <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Format data tidak valid.</div>;
                }
              })()}
            </div>

            <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setSelectedTemplateForPreview(null)} className="btn btn-secondary btn-sm">
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: TINDAK LANJUTI LAPORAN ────────────────────────────────────────── */}
      {selectedReportForAction && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setSelectedReportForAction(null)}
        >
          <div
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              width: "100%",
              maxWidth: 520,
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
                🛡️ Resolusi Laporan Pengguna
              </h3>
              <button onClick={() => setSelectedReportForAction(null)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                background: "var(--bg-secondary)",
                padding: "12px",
                borderRadius: "var(--radius-md)",
                fontSize: 12,
                color: "var(--text-secondary)",
                marginBottom: 16,
              }}
            >
              <strong>Keluhan:</strong> &ldquo;{selectedReportForAction.reason}&rdquo;
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                Catatan Tindakan Moderator
              </label>
              <textarea
                rows={3}
                placeholder="Misal: Sudah disesuaikan dengan kurikulum 2024 / Isi template valid..."
                value={moderatorResolutionNote}
                onChange={(e) => setModeratorResolutionNote(e.target.value)}
                className="input input-sm"
                style={{ width: "100%", height: "auto" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => setSelectedReportForAction(null)}
                className="btn btn-secondary btn-sm"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isUpdatingModeration}
                onClick={() => handleResolveReport("reviewed")}
                className="btn btn-secondary btn-sm"
                style={{ color: "var(--lime)" }}
              >
                Tandai Ditinjau
              </button>
              <button
                type="button"
                disabled={isUpdatingModeration}
                onClick={() => handleResolveReport("resolved")}
                className="btn btn-primary btn-sm"
                style={{ fontWeight: 700 }}
              >
                Tandai Selesai (Resolved)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
