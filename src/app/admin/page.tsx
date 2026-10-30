"use client";

import { useState, useEffect, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FileCheck,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  X,
  Building2,
  Info,
  LogOut,
  Menu,
} from "lucide-react";

export type AdminTab = "overview" | "academics" | "templates" | "ai";

const NAV_ITEMS: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Ringkasan Operasional", icon: LayoutDashboard },
  { id: "templates", label: "Moderasi Template", icon: FileCheck },
  { id: "academics", label: "Kurikulum & Akademik", icon: BookOpen },
  { id: "ai", label: "Kinerja & Log AI", icon: Cpu },
];

const TAB_TITLES: Record<AdminTab, { title: string; subtitle: string }> = {
  overview: {
    title: "Ringkasan Operasional",
    subtitle: "Antrian verifikasi template komunitas, kurikulum aktif, dan ringkasan operasional.",
  },
  templates: {
    title: "Moderasi & Verifikasi Template",
    subtitle: "Verifikasi pengajuan template roadmap dari komunitas mahasiswa sebelum ditayangkan resmi.",
  },
  academics: {
    title: "Kurikulum & Data Akademik",
    subtitle: "Kelola perguruan tinggi mitra, program studi, dan distribusi semester kurikulum.",
  },
  ai: {
    title: "Kinerja & Log Sistem AI",
    subtitle: "Konfigurasi model Google Gemini API, pengujian latensi langsung, dan riwayat panggilan.",
  },
};

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = (searchParams.get("tab") as AdminTab) || "overview";

  const [activeTab, setActiveTab] = useState<AdminTab>(currentTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, startTransition] = useTransition();

  // Admin User Info
  const [adminUser, setAdminUser] = useState<{ id?: string; name?: string; email?: string; role?: string } | null>(null);

  // Overview Data
  const [overviewData, setOverviewData] = useState<any>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);

  // Academics Data
  const [academicsData, setAcademicsData] = useState<any>(null);
  const [academicSubTab, setAcademicSubTab] = useState<"kampus" | "prodi" | "kurikulum">("kampus");

  // Templates & Moderation Data
  const [templatesList, setTemplatesList] = useState<any[]>([]);
  const [templateStatusFilter, setTemplateStatusFilter] = useState<string>("all");
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] = useState<any | null>(null);

  // AI Monitor Data
  const [aiData, setAiData] = useState<any>(null);
  const [isPingingAi, setIsPingingAi] = useState(false);
  const [pingResult, setPingResult] = useState<any | null>(null);

  // Global Notification Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const switchTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    startTransition(() => {
      router.replace(`/admin?tab=${tab}`);
    });
  };

  const fetchOverview = async () => {
    try {
      setIsLoadingOverview(true);
      const res = await fetch("/api/admin/overview");
      const data = await res.json();
      if (data.success) {
        setOverviewData(data);
      }
    } catch {
      // handled silently
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
    } catch {
      // handled silently
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch(
        `/api/admin/templates?status=${templateStatusFilter}&q=${encodeURIComponent(templateSearch)}`
      );
      const data = await res.json();
      if (data.success) {
        setTemplatesList(data.templates);
      }
    } catch {
      // handled silently
    }
  };

  const fetchAiMonitor = async () => {
    try {
      const res = await fetch("/api/admin/ai-monitor");
      const data = await res.json();
      if (data.success) {
        setAiData(data);
      }
    } catch {
      // handled silently
    }
  };

  useEffect(() => {
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("stara_user") : null;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("stara_demo_token") || localStorage.getItem("stara_token")
        : null;

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
    fetchAiMonitor();
  }, [router]);

  useEffect(() => {
    fetchTemplates();
  }, [templateStatusFilter, templateSearch]);

  const handleToggleVerifyTemplate = async (templateId: string, currentStatus: string) => {
    const newStatus = currentStatus === "terverifikasi" ? "komunitas" : "terverifikasi";
    try {
      const res = await fetch("/api/admin/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          sourceType: newStatus,
          ...(newStatus === "terverifikasi" ? { isHidden: false } : {}),
        }),
      });
      const result = await res.json();
      if (result.success) {
        showToast(
          newStatus === "terverifikasi"
            ? "Template diverifikasi resmi dan ditayangkan ke publik."
            : "Status verifikasi resmi template dicabut."
        );
        fetchTemplates();
        fetchOverview();
      } else {
        showToast(result.error || "Gagal mengubah status template.", "error");
      }
    } catch {
      showToast("Gagal menghubungi server.", "error");
    }
  };

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
        showToast(
          !currentHidden
            ? "Template disembunyikan dari daftar publik."
            : "Template ditampilkan kembali ke publik."
        );
        fetchTemplates();
        fetchOverview();
      }
    } catch {
      showToast("Gagal memperbarui visibilitas template.", "error");
    }
  };

  const handleRunAiPing = async () => {
    try {
      setIsPingingAi(true);
      setPingResult(null);
      const res = await fetch("/api/admin/ai-monitor/ping", { method: "POST" });
      const data = await res.json();
      setPingResult(data);
      if (data.success) {
        showToast(`Koneksi AI aktif (${data.latencyMs} ms • ${data.modelUsed}).`);
      } else {
        showToast(`Respons fallback aktif (${data.latencyMs} ms).`, "info");
      }
      fetchAiMonitor();
    } catch {
      showToast("Gagal melakukan pengujian koneksi AI.", "error");
    } finally {
      setIsPingingAi(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("stara_demo_token");
    localStorage.removeItem("stara_token");
    localStorage.removeItem("stara_user");
    router.push("/login");
  };

  const unverifiedTemplatesCount =
    overviewData?.metrics?.communityTemplates ??
    templatesList.filter((t) => t.sourceType !== "terverifikasi").length;
  const moderationQueueCount = unverifiedTemplatesCount;

  const adminInitial = adminUser?.name
    ? adminUser.name.trim().charAt(0).toUpperCase()
    : "A";

  return (
    <div className="app-shell">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: "#FFFFFF",
            color: "#0F172A",
            border:
              toastMessage.type === "error"
                ? "1px solid #FECACA"
                : toastMessage.type === "info"
                ? "1px solid #BFDBFE"
                : "1px solid #FDE68A",
            borderLeft:
              toastMessage.type === "error"
                ? "4px solid #DC2626"
                : toastMessage.type === "info"
                ? "4px solid #2563EB"
                : "4px solid #D97706",
            fontWeight: 600,
            fontSize: 13,
            padding: "12px 16px",
            borderRadius: "10px",
            boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.12)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {toastMessage.type === "error" ? (
            <AlertTriangle size={17} color="#DC2626" />
          ) : (
            <CheckCircle2 size={17} color="#D97706" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.4)",
            zIndex: 49,
          }}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ─── SIDEBAR (Matches AppShell.tsx) ─────────────────────────────────────── */}
      <nav
        className={`sidebar ${sidebarOpen ? "open" : ""}`}
        aria-label="Navigasi panel administrator"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <div>
          {/* Brand Header */}
          <div
            className="sidebar-logo"
            style={{
              padding: "18px 18px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <img
              src="/blackstara.svg"
              alt="Logo STARA"
              width={24}
              height={24}
              style={{ width: 24, height: 24, objectFit: "contain", display: "block" }}
            />
            <span
              style={{
                fontWeight: 800,
                fontSize: 16,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              STARA
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: "#92400E",
                background: "#FEF3C7",
                border: "1px solid #FDE68A",
                borderRadius: "6px",
                padding: "1px 6px",
                marginLeft: "auto",
              }}
            >
              Admin
            </span>
          </div>

          {/* Primary Navigation */}
          <div
            className="sidebar-nav"
            role="list"
            style={{
              padding: "14px 10px",
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            {NAV_ITEMS.map((item) => {
              const active = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="listitem"
                  onClick={() => switchTab(item.id)}
                  className={`sidebar-nav-item ${active ? "active" : ""}`}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: 13.5,
                    fontWeight: active ? 600 : 500,
                    color: active ? "var(--text-primary)" : "var(--text-secondary)",
                    background: active ? "#FFFFFF" : "transparent",
                    border: active ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid transparent",
                    boxShadow: active ? "0 1px 4px rgba(0, 0, 0, 0.04)" : "none",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Icon
                    size={16}
                    color={active ? "var(--amber)" : "var(--text-muted)"}
                    aria-hidden="true"
                    style={{ flexShrink: 0 }}
                  />
                  <span style={{ flex: 1 }} className="truncate">
                    {item.label}
                  </span>
                  {item.id === "templates" && moderationQueueCount > 0 && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: "#FEF3C7",
                        color: "#92400E",
                        border: "1px solid #FDE68A",
                        padding: "1px 6px",
                        borderRadius: "999px",
                      }}
                    >
                      {moderationQueueCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Section: Minimalist Profile Card */}
        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 4 }}>
          <div
            style={{
              margin: "4px 10px 10px",
              padding: "8px 10px",
              background: "#FAF9F5",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0, flex: 1 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "#FEF3C7",
                    border: "1px solid #FDE68A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#92400E",
                  }}
                >
                  {adminInitial}
                </div>
                <span
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#16A34A",
                    border: "1.5px solid #FFFFFF",
                  }}
                  title="Sesi Administrator Aktif"
                />
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    lineHeight: 1.2,
                  }}
                >
                  {adminUser?.name || "Administrator STARA"}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginTop: 2,
                  }}
                >
                  {adminUser?.email || "admin@stara.ac.id"}
                </div>
              </div>
            </div>

            <button
              type="button"
              id="btn-admin-logout"
              onClick={handleLogout}
              style={{
                background: "transparent",
                border: "none",
                padding: "5px",
                borderRadius: "6px",
                color: "#64748B",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
              title="Keluar dari akun administrator"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#DC2626";
                e.currentTarget.style.background = "#FEE2E2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#64748B";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </nav>

      {/* ─── MAIN CONTENT AREA ──────────────────────────────────────────────────── */}
      <div className="main-content">
        {/* Topbar (Matches AppShell.tsx) */}
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="btn btn-ghost btn-sm"
              style={{ display: "none" }}
              aria-label="Buka menu navigasi"
            >
              <Menu size={20} />
            </button>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              {TAB_TITLES[activeTab].title}
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontSize: 12,
                color: "#92400E",
                background: "rgba(245, 205, 71, 0.22)",
                border: "1px solid rgba(217, 119, 6, 0.3)",
                borderRadius: "var(--radius-pill)",
                padding: "4px 12px",
                fontWeight: 700,
                letterSpacing: "0.02em",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <ShieldCheck size={13} color="#92400E" />
              Admin Workspace
            </span>

            <button
              type="button"
              onClick={() => {
                fetchOverview();
                fetchAcademics();
                fetchTemplates();
                fetchAiMonitor();
                showToast("Data berhasil diperbarui.");
              }}
              className="btn btn-secondary btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}
            >
              <RefreshCw size={13} />
              <span>Muat Ulang</span>
            </button>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="main-scroll-area">
          <div className="page-area">
            {/* Page Subtitle Banner */}
            <div style={{ marginBottom: 22 }}>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#0F172A",
                  letterSpacing: "-0.02em",
                  marginBottom: 4,
                }}
              >
                {TAB_TITLES[activeTab].title}
              </h2>
              <p style={{ fontSize: 13.5, color: "#475569", margin: 0 }}>
                {TAB_TITLES[activeTab].subtitle}
              </p>
            </div>

            {/* ══════════════════════════════════════════════════════════════════════════
                TAB 1: RINGKASAN OPERASIONAL (Decision-First Hierarchy)
                ══════════════════════════════════════════════════════════════════════════ */}
            {activeTab === "overview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                {/* Primary Decision Panel: Antrian Moderasi & Verifikasi */}
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "14px",
                    padding: "20px 22px",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <div style={{ maxWidth: 640 }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#92400E",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: "#D97706",
                        }}
                      />
                      Prioritas Verifikasi Template Komunitas
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>
                      {unverifiedTemplatesCount} template komunitas menunggu verifikasi resmi
                    </h3>
                    <p style={{ fontSize: 13, color: "#475569", margin: 0, lineHeight: 1.5 }}>
                      Template yang diajukan mahasiswa dari halaman Roadmap masuk ke antrian moderasi sebelum mendapat label Terverifikasi Resmi di galeri publik.
                    </p>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setTemplateStatusFilter("unverified");
                        switchTab("templates");
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ fontWeight: 700 }}
                    >
                      Tinjau Pengajuan Template ({unverifiedTemplatesCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => switchTab("academics")}
                      className="btn btn-secondary btn-sm"
                    >
                      Kelola Katalog Kurikulum
                    </button>
                  </div>
                </div>

                {/* Structured Operational Summary Strip */}
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "14px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  }}
                >
                  {[
                    {
                      label: "Mahasiswa & Sesi Aktif",
                      value: isLoadingOverview ? "..." : overviewData?.metrics?.totalStudents ?? 0,
                      detail: `${overviewData?.metrics?.registeredUsers ?? 0} akun terdaftar, ${overviewData?.metrics?.activeSessions ?? 0} sesi aktif`,
                    },
                    {
                      label: "Roadmap Studi Aktif",
                      value: isLoadingOverview ? "..." : overviewData?.metrics?.totalRoadmaps ?? 0,
                      detail: `Rata-rata ${overviewData?.metrics?.averagePlannedCreditsPerSem ?? 19.6} SKS direncanakan per semester`,
                    },
                    {
                      label: "Template Terverifikasi",
                      value: isLoadingOverview
                        ? "..."
                        : `${overviewData?.metrics?.verifiedTemplates ?? 0} / ${overviewData?.metrics?.totalTemplates ?? 0}`,
                      detail: `${overviewData?.metrics?.hiddenTemplates ?? 0} template disembunyikan / draf pengajuan`,
                    },
                    {
                      label: "Layanan Gemini AI",
                      value: overviewData?.aiSystemStatus?.isKeyConfigured ? "Aktif" : "Fallback",
                      detail: `Model utama: ${overviewData?.aiSystemStatus?.primaryModel || "gemini-3.1-flash-lite"}`,
                    },
                  ].map((item, idx) => (
                    <div
                      key={item.label}
                      style={{
                        padding: "18px 20px",
                        borderRight: idx < 3 ? "1px solid #F1F5F9" : "none",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: "#64748B",
                          textTransform: "uppercase",
                          letterSpacing: "0.03em",
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 800,
                          color: "#0F172A",
                          marginTop: 6,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {item.value}
                      </div>
                      <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                        {item.detail}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Two-Column Breakdown: Sebaran Kampus & Tren Simulasi */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                    gap: 18,
                  }}
                >
                  {/* Sebaran Perguruan Tinggi */}
                  <div
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "14px",
                      padding: "20px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 14,
                      }}
                    >
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>
                          Sebaran Mahasiswa per Institusi Mitra
                        </h3>
                        <p style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                          Proporsi pengguna berdasarkan perguruan tinggi asal
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => switchTab("academics")}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#B45309",
                          cursor: "pointer",
                        }}
                      >
                        Kelola Kampus
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {(overviewData?.studentDistributions?.byCampus || []).map(
                        (camp: any, idx: number) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 12px",
                              borderRadius: "10px",
                              background: "#F8FAFC",
                              border: "1px solid #E2E8F0",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <Building2 size={15} color="#64748B" />
                              <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                                {camp.name}
                              </span>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
                              {camp.count} mhs ({camp.percentage}%)
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Skenario Studi yang Paling Sering Disimulasikan */}
                  <div
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "14px",
                      padding: "20px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 14,
                      }}
                    >
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>
                          Tren Simulasi Skenario Mahasiswa
                        </h3>
                        <p style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                          Skenario akademik yang paling banyak diuji pada fitur What-If
                        </p>
                      </div>
                      <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
                        {overviewData?.metrics?.totalSimulations || 0} simulasi
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {(overviewData?.popularScenarios || []).map((sc: any, idx: number) => (
                        <div key={idx}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: 13,
                              marginBottom: 6,
                            }}
                          >
                            <span style={{ fontWeight: 600, color: "#0F172A" }}>{sc.name}</span>
                            <span style={{ color: "#475569", fontWeight: 700, fontSize: 12 }}>
                              {sc.count} mhs ({sc.percentage}%)
                            </span>
                          </div>
                          <div
                            style={{
                              height: 6,
                              background: "#F1F5F9",
                              borderRadius: "999px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${sc.percentage}%`,
                                background: idx === 0 ? "#D97706" : "#64748B",
                                borderRadius: "999px",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════
                TAB 2: KURIKULUM & DATA AKADEMIK
                ══════════════════════════════════════════════════════════════════════════ */}
            {activeTab === "academics" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {/* Segmented Sub-tab Control */}
                <div
                  style={{
                    display: "inline-flex",
                    flexWrap: "wrap",
                    gap: 4,
                    background: "#F1F5F9",
                    padding: 4,
                    borderRadius: "10px",
                    border: "1px solid #E2E8F0",
                     alignSelf: "flex-start",
                  }}
                >
                  {[
                    { id: "kampus", label: "Perguruan Tinggi Mitra", count: academicsData?.campuses?.length || 5 },
                    { id: "prodi", label: "Program Studi", count: academicsData?.programs?.length || 4 },
                    { id: "kurikulum", label: "Struktur Semester 1-8", count: 8 },
                  ].map((st) => {
                    const active = academicSubTab === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setAcademicSubTab(st.id as any)}
                        style={{
                          background: active ? "#FFFFFF" : "transparent",
                          border: "none",
                          color: active ? "#0F172A" : "#475569",
                          padding: "7px 14px",
                          borderRadius: "7px",
                          fontSize: 12.5,
                          fontWeight: active ? 700 : 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          boxShadow: active ? "0 1px 2px rgba(15, 23, 42, 0.06)" : "none",
                        }}
                      >
                        <span>{st.label}</span>
                        <span
                          style={{
                            fontSize: 11,
                            background: active ? "#FEF3C7" : "#E2E8F0",
                            color: active ? "#92400E" : "#475569",
                            padding: "1px 6px",
                            borderRadius: "999px",
                            fontWeight: 700,
                          }}
                        >
                          {st.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-Tab 1: Kampus Mitra */}
                {academicSubTab === "kampus" && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {(academicsData?.campuses || []).map((campus: any) => (
                      <div
                        key={campus.id}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          borderRadius: "14px",
                          padding: "18px 20px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontSize: 15.5, fontWeight: 800, color: "#0F172A" }}>
                              {campus.name}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                              {campus.city}
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontWeight: 700,
                              background: campus.type === "PTN" ? "#F1F5F9" : "#FEF3C7",
                              color: campus.type === "PTN" ? "#334155" : "#92400E",
                              border: campus.type === "PTN" ? "1px solid #CBD5E1" : "1px solid #FDE68A",
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
                            background: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            padding: "10px 12px",
                            borderRadius: "10px",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 11, color: "#64748B" }}>Mahasiswa Terdata</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                              {campus.totalStudents} mhs
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: "#64748B" }}>Status Kurikulum</div>
                            <div
                              style={{
                                fontSize: 12.5,
                                fontWeight: 700,
                                color: campus.syncStatus === "Tersinkronisasi" ? "#15803D" : "#B45309",
                                marginTop: 2,
                              }}
                            >
                              {campus.syncStatus}
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            color: "#475569",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Info size={13} color="#64748B" />
                          <span>{campus.lastCurriculumUpdate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sub-Tab 2: Program Studi */}
                {academicSubTab === "prodi" && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {(academicsData?.programs || []).map((prog: any) => (
                      <div
                        key={prog.id}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          borderRadius: "14px",
                          padding: "18px 20px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                background: "#F1F5F9",
                                color: "#334155",
                                border: "1px solid #E2E8F0",
                                padding: "2px 7px",
                                borderRadius: "5px",
                              }}
                            >
                              {prog.code} • {prog.level}
                            </span>
                            <div
                              style={{
                                fontSize: 15.5,
                                fontWeight: 800,
                                color: "#0F172A",
                                marginTop: 6,
                              }}
                            >
                              {prog.name}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748B" }}>{prog.campusName}</div>
                          </div>

                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#15803D",
                              background: "#DCFCE7",
                              border: "1px solid #BBF7D0",
                              padding: "2px 8px",
                              borderRadius: "999px",
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
                            background: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            padding: "10px 12px",
                            borderRadius: "10px",
                            fontSize: 12.5,
                          }}
                        >
                          <span style={{ color: "#475569" }}>Beban Lulus Standar</span>
                          <span style={{ fontWeight: 800, color: "#0F172A" }}>
                            {prog.totalCredits} SKS
                          </span>
                        </div>

                        <div style={{ fontSize: 12, color: "#64748B" }}>
                          Kurikulum Aktif: <strong style={{ color: "#334155" }}>{prog.activeCurriculumYear}</strong> ({prog.totalCourses} Mata Kuliah)
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sub-Tab 3: Struktur Semester 1 - 8 */}
                {academicSubTab === "kurikulum" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div
                      style={{
                        background: "#FFFBEB",
                        border: "1px solid #FDE68A",
                        borderRadius: "12px",
                        padding: "12px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        color: "#92400E",
                      }}
                    >
                      <Info size={16} color="#D97706" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 13 }}>
                        Distribusi beban SKS standar program sarjana (144 SKS): Semester 1 sampai 7 memiliki beban reguler <strong>18-20 SKS</strong>, dan Semester 8 dialokasikan <strong>8 SKS</strong> untuk Tugas Akhir & Sidang.
                      </span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: 14,
                      }}
                    >
                      {(academicsData?.semesterSummary || []).map((sem: any) => (
                        <div
                          key={sem.semesterNum}
                          style={{
                            background: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            borderRadius: "12px",
                            padding: "16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                              Semester {sem.semesterNum}
                            </span>
                            <span
                              style={{
                                fontSize: 11.5,
                                fontWeight: 700,
                                background: "#FEF3C7",
                                color: "#92400E",
                                padding: "2px 8px",
                                borderRadius: "999px",
                                border: "1px solid #FDE68A",
                              }}
                            >
                              {sem.credits} SKS
                            </span>
                          </div>
                          <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.45 }}>
                            {sem.focus}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#64748B", marginTop: "auto" }}>
                            {sem.courseCount} mata kuliah terjadwal
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════
                TAB 3: MODERASI & VERIFIKASI TEMPLATE
                ══════════════════════════════════════════════════════════════════════════ */}
            {activeTab === "templates" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 10,
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#FFFFFF",
                        padding: "14px 16px",
                        borderRadius: "12px",
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                        <div style={{ position: "relative", minWidth: 260 }}>
                          <Search
                            size={15}
                            style={{
                              position: "absolute",
                              left: 11,
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: "#64748B",
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Cari judul template, kampus, atau pembuat..."
                            value={templateSearch}
                            onChange={(e) => setTemplateSearch(e.target.value)}
                            className="form-input"
                            style={{ paddingLeft: 34, height: 36, fontSize: 13 }}
                          />
                        </div>

                        <select
                          value={templateStatusFilter}
                          onChange={(e) => setTemplateStatusFilter(e.target.value)}
                          className="form-input"
                          style={{
                            width: "auto",
                            minWidth: 210,
                            height: 36,
                            fontSize: 12.5,
                            fontWeight: 600,
                            padding: "0 38px 0 14px",
                            borderRadius: "10px",
                          }}
                        >
                          <option value="all">Semua Status Template</option>
                          <option value="unverified">Menunggu Verifikasi (Komunitas)</option>
                          <option value="verified">Terverifikasi Resmi</option>
                          <option value="hidden">Disembunyikan / Belum Tayang</option>
                        </select>
                      </div>

                      <div style={{ fontSize: 12.5, color: "#64748B" }}>
                        Menampilkan <strong style={{ color: "#0F172A" }}>{templatesList.length}</strong> template
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
                        gap: 16,
                      }}
                    >
                      {templatesList.map((tpl: any) => {
                        const isVerified = tpl.sourceType === "terverifikasi";
                        const isHidden = Boolean(tpl.isHidden);

                        return (
                          <div
                            key={tpl.id}
                            style={{
                              background: "#FFFFFF",
                              border: isVerified ? "1px solid #BBF7D0" : "1px solid #E2E8F0",
                              borderRadius: "14px",
                              padding: "18px 20px",
                              display: "flex",
                              flexDirection: "column",
                              gap: 12,
                            }}
                          >
                            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  color: "#475569",
                                  background: "#F1F5F9",
                                  border: "1px solid #E2E8F0",
                                  padding: "2px 7px",
                                  borderRadius: "5px",
                                }}
                              >
                                {tpl.category}
                              </span>

                              {isVerified ? (
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#15803D",
                                    background: "#DCFCE7",
                                    border: "1px solid #BBF7D0",
                                    padding: "2px 8px",
                                    borderRadius: "999px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  <ShieldCheck size={12} /> Terverifikasi Resmi
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#92400E",
                                    background: "#FEF3C7",
                                    border: "1px solid #FDE68A",
                                    padding: "2px 8px",
                                    borderRadius: "999px",
                                  }}
                                >
                                  Pengajuan Komunitas
                                </span>
                              )}

                              {isHidden && (
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#B91C1C",
                                    background: "#FEE2E2",
                                    border: "1px solid #FECACA",
                                    padding: "2px 7px",
                                    borderRadius: "5px",
                                  }}
                                >
                                  Belum Tayang
                                </span>
                              )}
                            </div>

                            <div>
                              <h4
                                style={{
                                  fontSize: 15,
                                  fontWeight: 700,
                                  color: "#0F172A",
                                  lineHeight: 1.35,
                                  margin: 0,
                                }}
                              >
                                {tpl.title}
                              </h4>
                              <p
                                style={{
                                  fontSize: 12.5,
                                  color: "#475569",
                                  lineHeight: 1.5,
                                  marginTop: 6,
                                  marginBottom: 0,
                                }}
                              >
                                {tpl.description}
                              </p>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                fontSize: 11.5,
                                color: "#64748B",
                                borderTop: "1px solid #F1F5F9",
                                paddingTop: 10,
                                marginTop: "auto",
                              }}
                            >
                              <span>Pembuat: {tpl.authorDisplayName || "Mahasiswa / Alumni"}</span>
                              <span>{tpl.institutionName || "Telkom University"}</span>
                            </div>

                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                type="button"
                                onClick={() => handleToggleVerifyTemplate(tpl.id, tpl.sourceType)}
                                className={`btn btn-sm ${isVerified ? "btn-secondary" : "btn-primary"}`}
                                style={{ flex: 1, fontSize: 12, fontWeight: 700 }}
                              >
                                {isVerified ? "Cabut Verifikasi" : "Verifikasi & Tayangkan"}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleHideTemplate(tpl.id, isHidden)}
                                className="btn btn-secondary btn-sm"
                                style={{
                                  padding: "0 10px",
                                  color: isHidden ? "#15803D" : "#B91C1C",
                                }}
                                title={isHidden ? "Tampilkan ke publik" : "Sembunyikan dari publik"}
                              >
                                {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedTemplateForPreview(tpl)}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: "0 10px" }}
                                title="Tinjau rincian semester"
                              >
                                <ExternalLink size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════
                TAB 4: KINERJA & LOG SISTEM AI
                ══════════════════════════════════════════════════════════════════════════ */}
            {activeTab === "ai" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                    gap: 18,
                  }}
                >
                  {/* Provider Config Card */}
                  <div
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "14px",
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                          Konfigurasi Layanan Google Gemini
                        </h3>
                        <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                          SDK Resmi @google/genai
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#15803D",
                          background: "#DCFCE7",
                          border: "1px solid #BBF7D0",
                          padding: "3px 10px",
                          borderRadius: "999px",
                        }}
                      >
                        Aktif & Siap
                      </span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        padding: "14px",
                        borderRadius: "10px",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 11, color: "#64748B" }}>Kunci API Server</div>
                        <div
                          style={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            fontFamily: "var(--font-mono)",
                            color: "#0F172A",
                            marginTop: 2,
                          }}
                        >
                          {aiData?.config?.maskedKey || "Terkonfigurasi"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#64748B" }}>Model Utama</div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                          {aiData?.config?.modelPrimary || "gemini-3.1-flash-lite"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#64748B" }}>Batas Laju (RPM)</div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                          15 request / menit
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#64748B" }}>Kuota Harian (RPD)</div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                          1.500 request / hari
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live Ping & Latency Checker Card */}
                  <div
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "14px",
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 14,
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                        Uji Koneksi & Latensi Langsung
                      </h3>
                      <p style={{ fontSize: 12.5, color: "#475569", marginTop: 4, marginBottom: 0 }}>
                        Kirim permintaan verifikasi ke endpoint Google Gemini API untuk memeriksa waktu respons saat ini.
                      </p>
                    </div>

                    {pingResult && (
                      <div
                        style={{
                          padding: "12px",
                          borderRadius: "10px",
                          background: pingResult.success ? "#DCFCE7" : "#FFFBEB",
                          border: pingResult.success ? "1px solid #BBF7D0" : "1px solid #FDE68A",
                          fontSize: 12.5,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontWeight: 700,
                            marginBottom: 4,
                          }}
                        >
                          <span style={{ color: pingResult.success ? "#15803D" : "#92400E" }}>
                            {pingResult.success ? "Koneksi Stabil" : "Fallback Deterministik Aktif"}
                          </span>
                          <span style={{ color: "#0F172A" }}>{pingResult.latencyMs} ms</span>
                        </div>
                        <div style={{ color: "#475569", fontSize: 11.5 }}>
                          Model: {pingResult.modelUsed} • Respons: &ldquo;{pingResult.reply || "OK"}&rdquo;
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleRunAiPing}
                      disabled={isPingingAi}
                      className="btn btn-primary btn-sm"
                      style={{ fontWeight: 700, alignSelf: "flex-start" }}
                    >
                      {isPingingAi ? "Mengukur Latensi..." : "Jalankan Uji Koneksi AI"}
                    </button>
                  </div>
                </div>

                {/* Multi-Model Fallback Sequence */}
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "14px",
                    padding: "20px",
                  }}
                >
                  <div style={{ marginBottom: 14 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                      Urutan Fallback Model Otomatis
                    </h3>
                    <p style={{ fontSize: 12.5, color: "#475569", marginTop: 4, marginBottom: 0 }}>
                      Apabila model utama mencapai batas kuota (HTTP 429/503), sistem beralih secara berurutan ke model cadangan di bawah ini.
                    </p>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                      gap: 12,
                    }}
                  >
                    {(aiData?.config?.modelFallbackSequence || []).map((fb: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          background: idx === 0 ? "#FFFBEB" : "#F8FAFC",
                          border: idx === 0 ? "1px solid #FDE68A" : "1px solid #E2E8F0",
                          borderRadius: "10px",
                          padding: "14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              color: idx === 0 ? "#92400E" : "#64748B",
                            }}
                          >
                            {fb.tier}
                          </span>
                          {idx === 0 && (
                            <span style={{ fontSize: 10.5, color: "#92400E", fontWeight: 700 }}>
                              Utama
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                          {fb.model}
                        </div>
                        <div style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.35 }}>
                          {fb.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Log Request AI */}
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "14px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "16px 20px",
                      borderBottom: "1px solid #E2E8F0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                        Riwayat Panggilan API Terbaru
                      </h3>
                      <p style={{ fontSize: 12, color: "#64748B", marginTop: 2, marginBottom: 0 }}>
                        Catatan waktu respons dan penggunaan token pada fitur AI
                      </p>
                    </div>

                    <span style={{ fontSize: 12, color: "#475569", fontWeight: 700 }}>
                      {aiData?.recentLogs?.length || 0} log tercatat
                    </span>
                  </div>

                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                    <thead>
                      <tr
                        style={{
                          background: "#F8FAFC",
                          borderBottom: "1px solid #E2E8F0",
                          color: "#475569",
                          fontSize: 12,
                        }}
                      >
                        <th style={{ padding: "11px 18px", fontWeight: 700 }}>Waktu</th>
                        <th style={{ padding: "11px 18px", fontWeight: 700 }}>Fitur</th>
                        <th style={{ padding: "11px 18px", fontWeight: 700 }}>Model</th>
                        <th style={{ padding: "11px 18px", fontWeight: 700 }}>Latensi</th>
                        <th style={{ padding: "11px 18px", fontWeight: 700 }}>Token (Input / Output)</th>
                        <th style={{ padding: "11px 18px", fontWeight: 700 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(aiData?.recentLogs || []).map((log: any) => (
                        <tr key={log.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "12px 18px", color: "#64748B", fontSize: 12 }}>
                            {new Date(log.timestamp).toLocaleTimeString("id-ID")}
                          </td>
                          <td style={{ padding: "12px 18px", fontWeight: 600, color: "#0F172A" }}>
                            {log.feature}
                          </td>
                          <td
                            style={{
                              padding: "12px 18px",
                              fontFamily: "var(--font-mono)",
                              fontSize: 12,
                              color: "#334155",
                            }}
                          >
                            {log.modelUsed}
                          </td>
                          <td style={{ padding: "12px 18px", fontWeight: 700, color: "#0F172A" }}>
                            {log.latencyMs} ms
                          </td>
                          <td style={{ padding: "12px 18px", color: "#475569", fontSize: 12 }}>
                            {log.tokensUsed?.prompt || 0} / {log.tokensUsed?.completion || 0} (
                            {log.tokensUsed?.total || 0})
                          </td>
                          <td style={{ padding: "12px 18px" }}>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: log.status.includes("OK") ? "#15803D" : "#92400E",
                                background: log.status.includes("OK") ? "#DCFCE7" : "#FEF3C7",
                                border: log.status.includes("OK")
                                  ? "1px solid #BBF7D0"
                                  : "1px solid #FDE68A",
                                padding: "2px 8px",
                                borderRadius: "999px",
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
      </div>

      {/* ─── MODAL: PREVIEW TEMPLATE ──────────────────────────────────────────────── */}
      {selectedTemplateForPreview && (
        <div
          className="dialog-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setSelectedTemplateForPreview(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "16px",
              width: "100%",
              maxWidth: 600,
              maxHeight: "85vh",
              overflowY: "auto",
              padding: 24,
              boxShadow: "0 20px 25px -5px rgba(15, 23, 42, 0.12)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 14,
              }}
            >
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#92400E", textTransform: "uppercase" }}>
                  {selectedTemplateForPreview.category} • {selectedTemplateForPreview.institutionName}
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginTop: 4 }}>
                  {selectedTemplateForPreview.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTemplateForPreview(null)}
                className="btn btn-ghost btn-sm"
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
              {selectedTemplateForPreview.description}
            </p>

            <div style={{ marginTop: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 10 }}>
                Rincian Langkah Semester
              </h4>

              {(() => {
                try {
                  const steps = JSON.parse(selectedTemplateForPreview.semesterSteps || "[]");
                  if (steps.length === 0) {
                    return (
                      <div style={{ fontSize: 12.5, color: "#64748B" }}>
                        Belum ada rincian langkah semester pada template ini.
                      </div>
                    );
                  }
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {steps.map((st: any, i: number) => (
                        <div
                          key={i}
                          style={{
                            background: "#F8FAFC",
                            padding: "10px 14px",
                            borderRadius: "10px",
                            border: "1px solid #E2E8F0",
                            fontSize: 12.5,
                          }}
                        >
                          <div style={{ fontWeight: 700, color: "#0F172A", marginBottom: 2 }}>
                            {st.title || `Semester ${st.semesterNum || st.semester || i + 1}`}
                          </div>
                          <div style={{ color: "#475569" }}>
                            {st.focus ||
                              st.strategyTip ||
                              (Array.isArray(st.highlights) ? st.highlights.join(", ") : "Strategi kurikulum standar")}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                } catch {
                  return (
                    <div style={{ fontSize: 12.5, color: "#64748B" }}>
                      Format rincian semester tidak dapat dibaca.
                    </div>
                  );
                }
              })()}
            </div>

            <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setSelectedTemplateForPreview(null)}
                className="btn btn-secondary btn-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#FAF9F5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#475569", fontSize: "14px", fontWeight: 600 }}>
              Memuat Panel Administrator...
            </p>
          </div>
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
