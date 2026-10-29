"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/features/session/context";
import { TEMPLATE_CATEGORIES } from "@/lib/constants";
import {
  MOCK_TEMPLATES,
  MockTemplate,
  TemplateItem,
} from "@/features/templates/data";
import {
  Search, BookMarked, ThumbsUp, AlertCircle, ChevronRight,
  Users, Building2, SlidersHorizontal, Star, Eye, X,
  CheckCircle2, GraduationCap, Globe, RotateCcw, TrendingUp,
  Bookmark, BookOpen, Briefcase, Layers, FileText, Plus,
  ArrowRight, Check, Award, Compass, HelpCircle,
  FileCheck, Calendar, ShieldCheck, Target, Sparkles,
} from "lucide-react";
import Link from "next/link";

// ─── Filter Options ───────────────────────────────────────────────────────────
const INSTITUTIONS = [
  "Semua Kampus",
  "BINUS University",
  "Telkom University",
  "Institut Teknologi Bandung",
  "Universitas Indonesia",
  "Universitas Gadjah Mada",
  "Universitas Brawijaya",
  "Universitas Diponegoro",
  "Universitas Airlangga",
  "Kemendikbudristek",
];

const MAJORS = [
  "Semua Jurusan",
  "Teknik Informatika",
  "Manajemen",
  "Ilmu Komunikasi",
  "Akuntansi",
  "Teknik Sipil",
  "Farmasi",
  "Semua Prodi Teknik",
  "Semua Program Studi",
];

const YEARS = ["Semua Tahun", "2025", "2024", "2023"];

const categoryIcons: Record<string, React.ReactNode> = {
  semester: <Layers size={13} />,
  tak: <BookOpen size={13} />,
  magang: <Briefcase size={13} />,
  mbkm: <Globe size={13} />,
  skripsi: <FileText size={13} />,
  organisasi: <Users size={13} />,
};

const categoryColors: Record<string, string> = {
  semester: "#2563EB",
  tak: "#0D9488",
  magang: "#D97706",
  mbkm: "#0284C7",
  skripsi: "#E11D48",
  organisasi: "#059669",
};

const taskCategoryBadgeColors: Record<string, string> = {
  akademik: "var(--blue)",
  tak: "var(--teal)",
  karier: "var(--orange)",
  skripsi: "var(--purple)",
  pribadi: "var(--coral)",
};

export default function TemplatesPage() {
  const router = useRouter();
  const { token } = useSession();

  const [sourceTab, setSourceTab] = useState<"komunitas" | "kampus">("komunitas");
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [filterInstitution, setFilterInstitution] = useState("Semua Kampus");
  const [filterMajor, setFilterMajor] = useState("Semua Jurusan");
  const [filterYear, setFilterYear] = useState("Semua Tahun");
  const [filterCategory, setFilterCategory] = useState("");
  const [autoFilteredFromOnboarding, setAutoFilteredFromOnboarding] = useState(false);

  // Onboarding profile connection & generation state
  const [onboardingProfile, setOnboardingProfile] = useState<{
    institutionName?: string;
    programName?: string;
    entryYear?: number | string;
    currentSemester?: number;
    goals?: string;
  } | null>(null);
  const [isGeneratingFromProfile, setIsGeneratingFromProfile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const paramKampus = urlParams.get("kampus");
    const paramJurusan = urlParams.get("jurusan");
    const paramTahun = urlParams.get("tahun");

    let savedProfile: {
      institutionName?: string;
      programName?: string;
      entryYear?: string | number;
      currentSemester?: number;
      goals?: string;
    } | null = null;
    try {
      const raw = localStorage.getItem("stara_onboarding_profile");
      if (raw) {
        savedProfile = JSON.parse(raw);
        setOnboardingProfile(savedProfile);
      }
    } catch {}

    // Fetch database profile if token exists
    if (token) {
      fetch("/api/profile", { headers: { "x-demo-token": token } })
        .then((r) => r.json())
        .then((d) => {
          if (d?.profile) {
            setOnboardingProfile({
              institutionName: d.profile.institutionName,
              programName: d.profile.programName,
              entryYear: d.profile.entryYear,
              currentSemester: d.profile.currentSemester,
              goals: d.profile.goals,
            });
          }
        })
        .catch(() => {});
    }

    const targetKampus = paramKampus || savedProfile?.institutionName;
    const targetJurusan = paramJurusan || savedProfile?.programName;
    const targetTahun = paramTahun;

    if (!savedProfile && (targetKampus || targetJurusan)) {
      setOnboardingProfile({
        institutionName: targetKampus || "",
        programName: targetJurusan || "",
        entryYear: targetTahun ? Number(targetTahun) : 2024,
      });
    }

    let appliedAny = false;

    if (targetKampus) {
      const matchedInst = INSTITUTIONS.find(
        (inst) =>
          inst.toLowerCase() === targetKampus.toLowerCase() ||
          inst.toLowerCase().includes(targetKampus.toLowerCase()) ||
          targetKampus.toLowerCase().includes(inst.toLowerCase())
      );
      setFilterInstitution(matchedInst || targetKampus);
      appliedAny = true;
    }

    if (targetJurusan) {
      const matchedMajor = MAJORS.find(
        (m) =>
          m.toLowerCase() === targetJurusan.toLowerCase() ||
          m.toLowerCase().includes(targetJurusan.toLowerCase()) ||
          targetJurusan.toLowerCase().includes(m.toLowerCase())
      );
      setFilterMajor(matchedMajor || targetJurusan);
      appliedAny = true;
    }

    if (targetTahun && YEARS.includes(targetTahun)) {
      setFilterYear(targetTahun);
      appliedAny = true;
    }

    if (appliedAny) {
      setShowFilter(false);
      setAutoFilteredFromOnboarding(true);
    }
  }, [token]);

  const [previewTemplate, setPreviewTemplate] = useState<MockTemplate | null>(null);
  const [detailTab, setDetailTab] = useState<"matkul" | "strategi" | "syarat" | "faq">("matkul");

  const [selectedTemplateForApply, setSelectedTemplateForApply] = useState<MockTemplate | null>(null);
  const [targetSemester, setTargetSemester] = useState<number>(0); // 0 = otomatis per semester
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccessResult, setApplySuccessResult] = useState<{ message: string; versionId?: string } | null>(null);

  const isAnyTemplateModalOpen = Boolean(previewTemplate || selectedTemplateForApply);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isAnyTemplateModalOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isAnyTemplateModalOpen]);

  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Generate Roadmap Personal dari Profil Onboarding
  const handleGenerateFromProfile = async () => {
    if (!token) {
      showToast("Sesi tidak ditemukan. Silakan refresh halaman.");
      return;
    }

    setIsGeneratingFromProfile(true);
    try {
      const res = await fetch("/api/roadmap/generate-from-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-demo-token": token,
        },
        body: JSON.stringify(onboardingProfile || {}),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat roadmap");

      showToast("Roadmap personal berhasil dibuat dari profil onboarding kamu!");
      router.push("/app/roadmap");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Gagal membuat roadmap");
    } finally {
      setIsGeneratingFromProfile(false);
    }
  };

  const toggleStar = (id: string) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    showToast(starredIds.has(id) ? "Dihapus dari favorit." : "Disimpan ke favorit!");
  };

  const openApplyModal = (template: MockTemplate) => {
    setSelectedTemplateForApply(template);
    setTargetSemester(0);
    setApplySuccessResult(null);
  };

  const handleApplyToRoadmap = async () => {
    if (!selectedTemplateForApply || !token) {
      if (!token) showToast("✗ Sesi tidak ditemukan. Silakan refresh halaman.");
      return;
    }

    setIsApplying(true);
    try {
      const res = await fetch(`/api/roadmap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-demo-token": token,
        },
        body: JSON.stringify({
          action: "apply_template",
          templateId: selectedTemplateForApply.id,
          templateTitle: selectedTemplateForApply.title,
          templateSource: selectedTemplateForApply.sourceType,
          mode: "new_version", // Always clean new version (no merge option)
          targetSemesterNum: targetSemester,
          items: selectedTemplateForApply.items,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menerapkan template");

      setApplySuccessResult({
        message: json.message || "Template berhasil diterapkan ke Roadmap!",
        versionId: json.versionId,
      });
      showToast(json.message || "✓ Template berhasil diterapkan ke Roadmap!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      showToast(`✗ ${msg}`);
    } finally {
      setIsApplying(false);
    }
  };

  const activeFilterCount = [
    filterInstitution !== "Semua Kampus",
    filterMajor !== "Semua Jurusan",
    filterYear !== "Semua Tahun",
    filterCategory !== "",
  ].filter(Boolean).length;

  const resetFilters = () => {
    setFilterInstitution("Semua Kampus");
    setFilterMajor("Semua Jurusan");
    setFilterYear("Semua Tahun");
    setFilterCategory("");
  };

  const availableInstitutions = Array.from(
    new Set([
      ...INSTITUTIONS,
      ...(filterInstitution !== "Semua Kampus" ? [filterInstitution] : []),
      ...MOCK_TEMPLATES.map((t) => t.institutionName),
    ])
  );

  const availableMajors = Array.from(
    new Set([
      ...MAJORS,
      ...(filterMajor !== "Semua Jurusan" ? [filterMajor] : []),
      ...MOCK_TEMPLATES.map((t) => t.programName),
    ])
  );

  const komunitas = MOCK_TEMPLATES.filter((t) => t.sourceType === "komunitas");
  const base = komunitas;

  const filtered = base.filter((t) => {
    const q = search.toLowerCase();
    if (
      q &&
      !t.title.toLowerCase().includes(q) &&
      !t.description.toLowerCase().includes(q) &&
      !t.tags.some((tag) => tag.toLowerCase().includes(q))
    )
      return false;

    if (filterInstitution !== "Semua Kampus") {
      const fi = filterInstitution.toLowerCase();
      const ti = t.institutionName.toLowerCase();
      const matchInst =
        ti === fi ||
        ti.includes(fi) ||
        fi.includes(ti) ||
        t.institutionName === "Kemendikbudristek" ||
        t.institutionName === "Semua PTN";
      if (!matchInst) return false;
    }

    if (filterMajor !== "Semua Jurusan") {
      const fm = filterMajor.toLowerCase();
      const tm = t.programName.toLowerCase();
      const matchMajor =
        tm === fm ||
        tm.includes(fm) ||
        fm.includes(tm) ||
        t.programName === "Semua Program Studi" ||
        t.programName === "Semua Fakultas" ||
        (t.programName === "Semua Prodi Teknik" && fm.includes("teknik"));
      if (!matchMajor) return false;
    }

    if (filterYear !== "Semua Tahun" && t.year !== filterYear) return false;
    if (filterCategory && t.category !== filterCategory) return false;
    return true;
  });

  // Intelligent recommendations if active filter produces 0 results
  const suggestedTemplates = base.filter((t) => {
    if (filterMajor !== "Semua Jurusan") {
      const fm = filterMajor.toLowerCase();
      const tm = t.programName.toLowerCase();
      return (
        tm === fm ||
        tm.includes(fm) ||
        fm.includes(tm) ||
        t.programName === "Semua Program Studi" ||
        t.programName === "Semua Fakultas" ||
        (t.programName === "Semua Prodi Teknik" && fm.includes("teknik"))
      );
    }
    return true;
  });

  return (
    <div>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
            Jelajahi Template
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Temukan blueprint akademik dan alur studi terstruktur dari mahasiswa berprestasi dan kurikulum resmi institusi.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link
            href="/app/roadmap"
            className="btn btn-secondary btn-sm"
            style={{
              gap: 8,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: "var(--radius-md)",
            }}
          >
            <BookMarked size={14} style={{ color: "var(--amber)" }} />
            Ke Roadmap Saya
            <ArrowRight size={13} style={{ color: "var(--text-muted)" }} />
          </Link>
        </div>
      </div>

      {/* ── Search + Filter Bar ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search
            size={15}
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            type="search"
            className="form-input"
            style={{
              paddingLeft: 38,
              height: 40,
              fontSize: 13,
              background: "var(--bg-secondary)",
              borderColor: "var(--border)",
              borderRadius: "var(--radius-md)",
            }}
            placeholder="Cari template, program studi, kata kunci..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cari template"
            id="search-template"
          />
        </div>
        <button
          className={`btn btn-sm ${showFilter ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setShowFilter(!showFilter)}
          id="btn-toggle-filter"
          style={{
            gap: 8,
            height: 40,
            padding: "0 16px",
            borderRadius: "var(--radius-md)",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <SlidersHorizontal size={14} />
          Filter
          {activeFilterCount > 0 && (
            <span
              style={{
                background: showFilter ? "#18181B" : "rgba(245, 205, 71, 0.22)",
                color: showFilter ? "#F5CD47" : "#92400E",
                borderRadius: "var(--radius-pill)",
                fontSize: 11,
                fontWeight: 700,
                padding: "1px 7px",
                border: showFilter ? "none" : "1px solid rgba(217, 119, 6, 0.3)",
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Filter Drawer ── */}
      {showFilter && (
        <div
          className="card"
          style={{
            marginBottom: 20,
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "16px 18px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
              <SlidersHorizontal size={13} style={{ color: "var(--amber)" }} />
              Filter Spesifik
            </div>
            {activeFilterCount > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={resetFilters}
                style={{ fontSize: 12, color: "var(--text-muted)", gap: 6 }}
              >
                <RotateCcw size={12} /> Reset Filter
              </button>
            )}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 14,
            }}
          >
            <div className="form-group">
              <label
                className="form-label"
                htmlFor="filter-kampus"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: "var(--text-secondary)",
                }}
              >
                <Building2 size={13} style={{ color: "var(--text-muted)" }} />
                Kampus / Institusi
              </label>
              <select
                id="filter-kampus"
                className="form-input"
                style={{ fontSize: 13, background: "var(--bg-tertiary)", borderColor: "var(--border)" }}
                value={filterInstitution}
                onChange={(e) => setFilterInstitution(e.target.value)}
              >
                {availableInstitutions.map((inst) => (
                  <option key={inst} value={inst}>
                    {inst}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label
                className="form-label"
                htmlFor="filter-jurusan"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: "var(--text-secondary)",
                }}
              >
                <GraduationCap size={13} style={{ color: "var(--text-muted)" }} />
                Program Studi
              </label>
              <select
                id="filter-jurusan"
                className="form-input"
                style={{ fontSize: 13, background: "var(--bg-tertiary)", borderColor: "var(--border)" }}
                value={filterMajor}
                onChange={(e) => setFilterMajor(e.target.value)}
              >
                {availableMajors.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label
                className="form-label"
                htmlFor="filter-tahun"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: "var(--text-secondary)",
                }}
              >
                <Calendar size={13} style={{ color: "var(--text-muted)" }} />
                Tahun Kurikulum
              </label>
              <select
                id="filter-tahun"
                className="form-input"
                style={{ fontSize: 13, background: "var(--bg-tertiary)", borderColor: "var(--border)" }}
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── Komunitas Mahasiswa Focus Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          padding: "12px 18px",
          background: "#FFFFFF",
          borderRadius: "var(--radius-md)",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.03)",
          marginBottom: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "10px",
              background: "#EEF2FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3730A3",
              flexShrink: 0,
            }}
          >
            <Users size={19} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 14.5, color: "var(--text-primary)" }}>
                Katalog Blueprint Komunitas Mahasiswa
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "1px 8px",
                  borderRadius: "var(--radius-pill)",
                  background: "#EEF2FF",
                  color: "#3730A3",
                  border: "1px solid #C7D2FE",
                }}
              >
                {komunitas.length} Template
              </span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, margin: 0 }}>
              Pengalaman nyata, strategi kelulusan, dan alur adaptif terpercaya dari rekan mahasiswa
            </p>
          </div>
        </div>
      </div>

      {/* ── Category Chips ── */}
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        <button
          onClick={() => setFilterCategory("")}
          style={{
            padding: "6px 14px",
            borderRadius: "var(--radius-pill)",
            fontSize: 12,
            fontWeight: filterCategory === "" ? 700 : 500,
            border:
              filterCategory === ""
                ? "1.5px solid #18181B"
                : "1px solid rgba(0, 0, 0, 0.1)",
            background: "#FFFFFF",
            color:
              filterCategory === "" ? "#18181B" : "var(--text-secondary)",
            boxShadow:
              filterCategory === ""
                ? "0 2px 8px rgba(0, 0, 0, 0.08)"
                : "0 1px 2px rgba(0, 0, 0, 0.02)",
            cursor: "pointer",
            transition: "all var(--transition)",
          }}
        >
          Semua Topik
        </button>
        {Object.entries(TEMPLATE_CATEGORIES).map(([val, label]) => {
          const isSelected = filterCategory === val;
          const color = categoryColors[val] ?? "#2563EB";
          return (
            <button
              key={val}
              onClick={() => setFilterCategory(isSelected ? "" : val)}
              style={{
                padding: "6px 13px",
                borderRadius: "var(--radius-pill)",
                fontSize: 12,
                fontWeight: isSelected ? 700 : 500,
                border: isSelected
                  ? `1.5px solid ${color}`
                  : "1px solid rgba(0, 0, 0, 0.1)",
                background: "#FFFFFF",
                color: isSelected ? color : "var(--text-secondary)",
                boxShadow: isSelected
                  ? `0 2px 8px ${color}22`
                  : "0 1px 2px rgba(0, 0, 0, 0.02)",
                cursor: "pointer",
                transition: "all var(--transition)",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span style={{ color: isSelected ? color : "var(--text-muted)" }}>
                {categoryIcons[val]}
              </span>
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Onboarding / Active Filter Banner ── */}
      {activeFilterCount > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#FFFFFF",
            border: "1px solid rgba(217, 119, 6, 0.28)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
            borderRadius: "var(--radius-md)",
            padding: "10px 14px",
            marginBottom: 16,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-secondary)", fontSize: 13 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "var(--radius-sm)",
                background: "rgba(245, 205, 71, 0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#92400E",
                flexShrink: 0,
              }}
            >
              <Compass size={14} />
            </div>
            <span>
              {autoFilteredFromOnboarding
                ? "Disesuaikan dengan profil studi kamu: "
                : "Filter aktif: "}
              <strong style={{ color: "var(--text-primary)" }}>
                {filterMajor !== "Semua Jurusan" ? filterMajor : "Semua Program Studi"}
              </strong>
              {filterInstitution !== "Semua Kampus" ? (
                <>
                  {" "}di <strong style={{ color: "var(--text-primary)" }}>{filterInstitution}</strong>
                </>
              ) : null}
              {filterYear !== "Semua Tahun" ? ` (${filterYear})` : ""}.
            </span>
          </div>
          <button
            onClick={() => {
              resetFilters();
              setAutoFilteredFromOnboarding(false);
            }}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              gap: 5,
              transition: "all var(--transition)",
            }}
          >
            <RotateCcw size={11} />
            Reset Filter
          </button>
        </div>
      )}

      {/* ── Result count ── */}
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
        Menampilkan{" "}
        <strong style={{ color: "var(--text-primary)" }}>{filtered.length}</strong>{" "}
        template komunitas
        {search && (
          <>
            {" "}untuk &ldquo;
            <strong style={{ color: "var(--text-primary)" }}>{search}</strong>
            &rdquo;
          </>
        )}
        {activeFilterCount > 0 && (
          <>
            {" "}•{" "}
            <button
              style={{
                background: "none",
                border: "none",
                color: "var(--blue)",
                cursor: "pointer",
                fontSize: 13,
                padding: 0,
                textDecoration: "underline",
              }}
              onClick={resetFilters}
            >
              Hapus filter
            </button>
          </>
        )}
      </div>

      {/* ── Template Grid or Intelligent Fallback ── */}
      {filtered.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Onboarding Contrast Generator Option (Always Available) */}
          <div
            style={{
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              padding: "18px 20px",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Compass size={14} style={{ color: "#D97706" }} />
              Opsi Langsung dari Profil Onboarding Kamu:
            </div>
            <div style={{ maxWidth: 360 }}>
              <OnboardingContrastCard
                profile={onboardingProfile}
                isGenerating={isGeneratingFromProfile}
                onGenerate={handleGenerateFromProfile}
              />
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: "24px 20px",
              textAlign: "center",
              background: "var(--bg-secondary)",
              border: "1px dashed var(--border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "var(--bg-tertiary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
                color: "var(--text-muted)",
              }}
            >
              <BookMarked size={20} />
            </div>
            <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
              Belum ada template spesifik untuk kriteria ini
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, maxWidth: 440, margin: "0 auto 16px", lineHeight: 1.5 }}>
              {filterInstitution !== "Semua Kampus"
                ? `Template kurikulum khusus untuk ${filterInstitution} belum tersedia di tab ini. Kamu bisa melihat kurikulum rekomendasi untuk program studi ${filterMajor} dari kampus mitra.`
                : "Coba ubah kata kunci pencarian atau sesuaikan opsi filter."}
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {filterInstitution !== "Semua Kampus" && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setFilterInstitution("Semua Kampus")}
                  style={{ gap: 6 }}
                >
                  <Building2 size={13} />
                  Lihat Semua Kampus
                </button>
              )}
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearch("");
                  resetFilters();
                }}
                style={{ gap: 6 }}
              >
                <RotateCcw size={12} />
                Reset Semua Filter
              </button>
            </div>
          </div>

          {/* Show Suggested Recommendations if any exist */}
          {suggestedTemplates.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                  Rekomendasi Terkait untuk Program Studi {filterMajor !== "Semua Jurusan" ? filterMajor : ""}
                </div>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {suggestedTemplates.length} blueprint tersedia
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: 16,
                }}
              >
                {suggestedTemplates.slice(0, 4).map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    isStarred={starredIds.has(t.id)}
                    onStar={() => toggleStar(t.id)}
                    onPreview={() => {
                      setPreviewTemplate(t);
                      setDetailTab("matkul");
                    }}
                    onApply={() => openApplyModal(t)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {/* 1. Onboarding Generator Contrast Card (Paling Kiri / Slot Pertama) */}
          <OnboardingContrastCard
            profile={onboardingProfile}
            isGenerating={isGeneratingFromProfile}
            onGenerate={handleGenerateFromProfile}
          />

          {/* 2. Template Cards */}
          {filtered.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              isStarred={starredIds.has(t.id)}
              onStar={() => toggleStar(t.id)}
              onPreview={() => {
                setPreviewTemplate(t);
                setDetailTab("matkul");
              }}
              onApply={() => openApplyModal(t)}
            />
          ))}
        </div>
      )}

      {/* ── Detail Modal (Sangat Lengkap & Informatif) ── */}
      {previewTemplate && (
        <div
          className="dialog-overlay"
          onClick={() => setPreviewTemplate(null)}
          onWheel={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={`Detail template ${previewTemplate.title}`}
        >
          <div
            className="dialog"
            style={{ maxWidth: 680, width: "95vw", maxHeight: "92vh", overflowY: "auto", padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 16,
              }}
            >
              <div style={{ flex: 1, paddingRight: 12 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "3px 10px",
                      borderRadius: "var(--radius-pill)",
                      fontSize: 11,
                      fontWeight: 700,
                      background:
                        previewTemplate.sourceType === "kampus"
                          ? "#F0FDF4"
                          : "#EEF2FF",
                      color:
                        previewTemplate.sourceType === "kampus"
                          ? "#15803D"
                          : "#3730A3",
                      border:
                        previewTemplate.sourceType === "kampus"
                          ? "1px solid #BBF7D0"
                          : "1px solid #C7D2FE",
                    }}
                  >
                    {previewTemplate.sourceType === "kampus" ? (
                      <>
                        <Building2 size={10} /> Kampus Resmi
                      </>
                    ) : (
                      <>
                        <Users size={10} /> Komunitas
                      </>
                    )}
                  </span>
                  {previewTemplate.verified && (
                    <span className="badge badge-lime" style={{ fontSize: 11 }}>
                      <CheckCircle2 size={10} /> Terverifikasi Resmi
                    </span>
                  )}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "3px 10px",
                      borderRadius: "var(--radius-pill)",
                      fontSize: 11,
                      fontWeight: 600,
                      background: `${categoryColors[previewTemplate.category] ?? "var(--text-muted)"}18`,
                      color: categoryColors[previewTemplate.category] ?? "var(--text-muted)",
                    }}
                  >
                    {categoryIcons[previewTemplate.category]}
                    {TEMPLATE_CATEGORIES[
                      previewTemplate.category as keyof typeof TEMPLATE_CATEGORIES
                    ] ?? previewTemplate.category}
                  </span>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.35 }}>
                  {previewTemplate.title}
                </h2>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                  {previewTemplate.institutionName} • {previewTemplate.programName}
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setPreviewTemplate(null)}
                style={{ padding: 6, borderRadius: "var(--radius-md)", flexShrink: 0 }}
                aria-label="Tutup modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Description */}
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 18 }}>
              {previewTemplate.description}
            </p>

            {/* Metric Highlights Banner (4 Metrics) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  background: "var(--bg-secondary)",
                  borderRadius: "var(--radius-md)",
                  padding: "10px 12px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Target Capaian
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--amber-deep)", marginTop: 2 }}>
                  {previewTemplate.targetGPA}
                </div>
              </div>

              <div
                style={{
                  background: "var(--bg-secondary)",
                  borderRadius: "var(--radius-md)",
                  padding: "10px 12px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Target Kelulusan
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--blue)", marginTop: 2 }}>
                  {previewTemplate.targetGraduation}
                </div>
              </div>

              <div
                style={{
                  background: "var(--bg-secondary)",
                  borderRadius: "var(--radius-md)",
                  padding: "10px 12px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Beban Rencana
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--teal)", marginTop: 2 }}>
                  {previewTemplate.items.reduce((s, i) => s + i.credits, 0)} SKS ({previewTemplate.items.length} item)
                </div>
              </div>

              <div
                style={{
                  background: "var(--bg-secondary)",
                  borderRadius: "var(--radius-md)",
                  padding: "10px 12px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Aktivitas Pengguna
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                  <ThumbsUp size={13} style={{ color: "var(--blue)" }} />
                  {previewTemplate.usefulCount} terbantu
                </div>
              </div>
            </div>

            {/* Target Audience Note */}
            <div
              style={{
                background: "#EEF2FF",
                borderLeft: "3px solid #4F46E5",
                padding: "10px 14px",
                borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                fontSize: 13,
                color: "var(--text-secondary)",
                marginBottom: 20,
              }}
            >
              <strong style={{ color: "var(--text-primary)" }}>Cocok Untuk: </strong>
              {previewTemplate.targetAudience}
            </div>

            {/* ── Internal Tabs for Complete Details ── */}
            <div
              style={{
                display: "flex",
                gap: 4,
                borderBottom: "1px solid var(--border-subtle)",
                marginBottom: 16,
                overflowX: "auto",
              }}
            >
              {[
                { id: "matkul", label: `Mata Kuliah & Milestone (${previewTemplate.items.length})`, icon: <Layers size={13} /> },
                { id: "strategi", label: "Strategi Sukses", icon: <Compass size={13} /> },
                { id: "syarat", label: "Prasyarat & Berkas", icon: <ShieldCheck size={13} /> },
                { id: "faq", label: `Tanya Jawab (${previewTemplate.faq.length})`, icon: <HelpCircle size={13} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDetailTab(tab.id as any)}
                  style={{
                    padding: "8px 14px",
                    background: "none",
                    border: "none",
                    borderBottom: detailTab === tab.id ? "2px solid var(--lime)" : "2px solid transparent",
                    color: detailTab === tab.id ? "var(--lime)" : "var(--text-muted)",
                    fontWeight: detailTab === tab.id ? 700 : 500,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Tab Content 1: Mata Kuliah & Milestone Terstruktur ── */}
            {detailTab === "matkul" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Semester Breakdown Cards */}
                {previewTemplate.semesterBreakdown.map((sb) => {
                  const semesterItems = previewTemplate.items.filter(
                    (i) => i.targetSemesterNum === sb.semesterNum
                  );
                  return (
                    <div
                      key={sb.semesterNum}
                      style={{
                        background: "var(--bg-secondary)",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-subtle)",
                        padding: 14,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            className="badge badge-teal"
                            style={{ fontSize: 11, fontWeight: 700 }}
                          >
                            Semester {sb.semesterNum}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                            {sb.title}
                          </span>
                        </div>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          Target {sb.targetCredits} SKS
                        </span>
                      </div>

                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10 }}>
                        <strong>Fokus Utama:</strong> {sb.focus}
                      </div>

                      {/* Tips Strategis */}
                      <div
                        style={{
                          background: "var(--bg-tertiary)",
                          padding: "8px 10px",
                          borderRadius: "var(--radius-sm)",
                          fontSize: 12,
                          color: "var(--text-muted)",
                          marginBottom: 10,
                          display: "flex",
                          gap: 6,
                          alignItems: "flex-start",
                        }}
                      >
                        <Award size={13} color="var(--lime)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span><strong>Tips:</strong> {sb.strategyTip}</span>
                      </div>

                      {/* List Items */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {semesterItems.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "7px 10px",
                              background: "var(--bg-primary)",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--border-subtle)",
                              gap: 8,
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }} className="truncate">
                                  {item.title}
                                </span>
                                {item.courseCode && (
                                  <span className="badge badge-gray" style={{ fontSize: 10 }}>
                                    {item.courseCode}
                                  </span>
                                )}
                              </div>
                              {item.notes && (
                                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                                  {item.notes}
                                </div>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                              {item.credits > 0 && (
                                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)" }}>
                                  {item.credits} SKS
                                </span>
                              )}
                              <span
                                className="badge"
                                style={{
                                  background: `${taskCategoryBadgeColors[item.category] ?? "var(--blue)"}15`,
                                  color: taskCategoryBadgeColors[item.category] ?? "var(--blue)",
                                  fontSize: 10,
                                }}
                              >
                                {item.category}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Tab Content 2: Strategi & Kunci Sukses ── */}
            {detailTab === "strategi" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                  Pilar Strategi Keberhasilan Template:
                </div>
                {previewTemplate.keyStrategies.map((strat, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      background: "var(--bg-secondary)",
                      padding: 14,
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: "rgba(245, 205, 71, 0.22)",
                        color: "#92400E",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      {strat}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Tab Content 3: Prasyarat & Berkas ── */}
            {detailTab === "syarat" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                    Prasyarat Akademik yang Wajib Dipenuhi:
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {previewTemplate.prerequisites.map((p, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 13,
                          color: "var(--text-secondary)",
                          background: "var(--bg-secondary)",
                          padding: "10px 12px",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        <CheckCircle2 size={15} color="var(--lime)" style={{ flexShrink: 0 }} />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                    Dokumen &amp; Berkas yang Harus Disiapkan:
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {previewTemplate.requiredDocuments.map((doc, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 13,
                          color: "var(--text-secondary)",
                          background: "var(--bg-secondary)",
                          padding: "10px 12px",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        <FileCheck size={15} color="var(--blue)" style={{ flexShrink: 0 }} />
                        <span>{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab Content 4: FAQ ── */}
            {detailTab === "faq" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {previewTemplate.faq.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "var(--bg-secondary)",
                      padding: 14,
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                      Q: {item.question}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      {item.answer}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Author / Contributor Info Footer */}
            <div
              style={{
                marginTop: 20,
                padding: "12px 14px",
                background: "var(--bg-secondary)",
                borderRadius: "var(--radius-md)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              <div>
                <strong>Dibuat oleh:</strong> {previewTemplate.isAnonymous ? "Anonim" : previewTemplate.authorDisplayName}
                {previewTemplate.authorRole && <span> ({previewTemplate.authorRole})</span>}
              </div>
              <div>
                Diperbarui: {new Date(previewTemplate.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, gap: 8, padding: "11px 18px" }}
                onClick={() => {
                  const t = previewTemplate;
                  setPreviewTemplate(null);
                  openApplyModal(t);
                }}
                id="btn-apply-modal-open"
              >
                <Plus size={16} />
                Pasang Template Ini ke Roadmap
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => toggleStar(previewTemplate.id)}
                title="Simpan ke favorit"
                aria-label="Toggle favorit"
                style={{ padding: "0 14px" }}
              >
                <Star
                  size={16}
                  fill={starredIds.has(previewTemplate.id) ? "var(--yellow)" : "none"}
                  color={starredIds.has(previewTemplate.id) ? "var(--yellow)" : "currentColor"}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Integrasi ke Roadmap Modal (BAGIAN MERGE SUDAH DIHAPUS) ── */}
      {selectedTemplateForApply && (
        <div
          className="dialog-overlay"
          onClick={() => {
            if (!isApplying) setSelectedTemplateForApply(null);
          }}
          onWheel={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={`Integrasi ${selectedTemplateForApply.title} ke Roadmap`}
        >
          <div
            className="dialog"
            style={{ maxWidth: 500, maxHeight: "90vh", overflowY: "auto", padding: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            {applySuccessResult ? (
              /* Success State */
              <div style={{ textAlign: "center", padding: "16px 8px" }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "rgba(22, 163, 74, 0.12)",
                    color: "#15803D",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <Check size={28} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
                  Berhasil Dipasang ke Roadmap!
                </h2>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 24 }}>
                  {applySuccessResult.message}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <Link
                    href="/app/roadmap"
                    className="btn btn-primary"
                    style={{ justifyContent: "center", gap: 8, padding: "12px 20px" }}
                    id="link-go-to-roadmap"
                  >
                    Buka Roadmap Saya Sekarang
                    <ArrowRight size={16} />
                  </Link>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setSelectedTemplateForApply(null);
                      setApplySuccessResult(null);
                    }}
                  >
                    Lanjut Jelajahi Template Lain
                  </button>
                </div>
              </div>
            ) : (
              /* Configuration State (Clean & Direct - No Merge Option) */
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color:
                          selectedTemplateForApply.sourceType === "kampus"
                            ? "var(--lime)"
                            : "var(--blue)",
                      }}
                    >
                      Integrasi ke Roadmap
                    </span>
                    <h2
                      style={{
                        fontSize: 17,
                        fontWeight: 800,
                        color: "var(--text-primary)",
                        marginTop: 4,
                        lineHeight: 1.35,
                      }}
                    >
                      {selectedTemplateForApply.title}
                    </h2>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setSelectedTemplateForApply(null)}
                    style={{ padding: 6 }}
                    disabled={isApplying}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Semester Target Selector */}
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" htmlFor="select-target-semester" style={{ fontSize: 12, fontWeight: 700 }}>
                    Alokasikan ke Semester:
                  </label>
                  <select
                    id="select-target-semester"
                    className="form-input"
                    value={targetSemester}
                    onChange={(e) => setTargetSemester(Number(e.target.value))}
                  >
                    <option value={0}>Sesuai Struktur Asli Template (Otomatis per Semester)</option>
                    <option value={5}>Semester 5 (Semester Aktif Saat Ini)</option>
                    <option value={6}>Semester 6</option>
                    <option value={7}>Semester 7</option>
                    <option value={8}>Semester 8</option>
                  </select>
                </div>

                {/* Info Note on Version Snapshot */}
                <div
                  style={{
                    background: "#EEF2FF",
                    border: "1px solid #C7D2FE",
                    borderRadius: "var(--radius-md)",
                    padding: "10px 12px",
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                    marginBottom: 16,
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-start",
                  }}
                >
                  <ShieldCheck size={16} color="var(--blue)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    Roadmap aktif Anda akan diperbarui menjadi versi baru berbasis template ini. Versi sebelumnya tetap aman tersimpan di riwayat.
                  </div>
                </div>

                {/* Preview of Items to be added */}
                <div
                  style={{
                    background: "var(--bg-secondary)",
                    borderRadius: "var(--radius-md)",
                    padding: 12,
                    marginBottom: 20,
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--text-secondary)",
                      marginBottom: 8,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>Item yang Akan Ditambahkan:</span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {selectedTemplateForApply.items.length} item
                    </span>
                  </div>
                  <div
                    style={{
                      maxHeight: 150,
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {selectedTemplateForApply.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          color: "var(--text-primary)",
                          gap: 6,
                        }}
                      >
                        <span className="truncate">• {item.title}</span>
                        <span style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0 }}>
                          {targetSemester > 0 ? `Sem ${targetSemester}` : `Sem ${item.targetSemesterNum}`}
                          {item.credits > 0 ? ` (${item.credits} SKS)` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom confirmation actions */}
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, gap: 8 }}
                    onClick={handleApplyToRoadmap}
                    disabled={isApplying}
                    id="btn-confirm-apply"
                  >
                    {isApplying ? (
                      "Memproses Pemasangan..."
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Konfirmasi &amp; Pasang ke Roadmap
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setSelectedTemplateForApply(null)}
                    disabled={isApplying}
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.startsWith("✓") ? "success" : "error"}`}>
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Template Card Component ──────────────────────────────────────────────────
function TemplateCard({
  template: t,
  isStarred,
  onStar,
  onPreview,
  onApply,
}: {
  template: MockTemplate;
  isStarred: boolean;
  onStar: () => void;
  onPreview: () => void;
  onApply: () => void;
}) {
  const isKampus = t.sourceType === "kampus";

  return (
    <div
      className="template-card"
      style={{
        background: "var(--bg-card)",
        border: isKampus ? "1px solid rgba(21, 128, 61, 0.22)" : "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 14,
        transition: "border-color var(--transition), transform var(--transition)",
      }}
      id={`template-card-${t.id}`}
    >
      <div>
        {/* Top badges + star */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 9px",
                borderRadius: "var(--radius-pill)",
                fontSize: 11,
                fontWeight: 700,
                background: isKampus ? "#F0FDF4" : "#EEF2FF",
                color: isKampus ? "#15803D" : "#3730A3",
                border: isKampus ? "1px solid #BBF7D0" : "1px solid #C7D2FE",
              }}
            >
              {isKampus ? (
                <>
                  <Building2 size={10} /> Resmi Kampus
                </>
              ) : (
                <>
                  <Users size={10} /> Komunitas
                </>
              )}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 8px",
                borderRadius: "var(--radius-pill)",
                fontSize: 11,
                fontWeight: 600,
                background: `${categoryColors[t.category] ?? "var(--text-muted)"}18`,
                color: categoryColors[t.category] ?? "var(--text-muted)",
              }}
            >
              {categoryIcons[t.category]}
              {TEMPLATE_CATEGORIES[t.category as keyof typeof TEMPLATE_CATEGORIES] ?? t.category}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 7px",
                borderRadius: "var(--radius-pill)",
                fontSize: 10,
                fontWeight: 600,
                background: "var(--bg-tertiary)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <Calendar size={10} />
              {t.year}
            </span>
          </div>

          <button
            onClick={onStar}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: isStarred ? "var(--yellow)" : "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              transition: "transform 0.15s ease",
            }}
            aria-label="Simpan ke favorit"
          >
            <Star size={15} fill={isStarred ? "var(--yellow)" : "none"} />
          </button>
        </div>

        {/* Title & Description */}
        <div style={{ marginBottom: 12 }}>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text-primary)",
              lineHeight: 1.45,
              marginBottom: 6,
            }}
          >
            {t.title}
          </h2>
          <p
            className="line-clamp-2"
            style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}
          >
            {t.description}
          </p>
        </div>

        {/* Author / institution */}
        <div
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {isKampus ? <Building2 size={12} /> : <Users size={12} />}
          <span className="truncate">{t.isAnonymous ? "Anonim" : t.authorDisplayName}</span>
          <span style={{ opacity: 0.3 }}>•</span>
          <span className="truncate">{t.institutionName}</span>
        </div>
      </div>

      {/* Stats + actions */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 12,
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                color: "var(--text-muted)",
              }}
            >
              <ThumbsUp size={11} /> {t.usefulCount}
            </span>
            {t.verified && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 11,
                  color: "#15803D",
                  fontWeight: 700,
                }}
              >
                <CheckCircle2 size={11} /> Terverifikasi
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={onPreview}
              aria-label={`Detail ${t.title}`}
              style={{ gap: 4, padding: "5px 10px", fontSize: 12 }}
            >
              <Eye size={12} />
              Detail
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={onApply}
              aria-label={`Terapkan ${t.title}`}
              style={{ gap: 4, padding: "5px 12px", fontSize: 12 }}
            >
              <Plus size={12} />
              Terapkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding Generator Contrast Card (Paling Kiri / Slot 0 di Grid)
// ─────────────────────────────────────────────────────────────────────────────
function OnboardingContrastCard({
  profile,
  isGenerating,
  onGenerate,
}: {
  profile: {
    institutionName?: string;
    programName?: string;
    entryYear?: number | string;
    currentSemester?: number;
    goals?: string;
  } | null;
  isGenerating: boolean;
  onGenerate: () => void;
}) {
  return (
    <div
      className="template-card onboarding-generator-card"
      style={{
        background: "#FFFFFF",
        border: "1.5px solid #F5CD47",
        borderRadius: "var(--radius-lg)",
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 14,
        boxShadow: "0 8px 24px rgba(245, 205, 71, 0.16), 0 2px 8px rgba(0, 0, 0, 0.04)",
        position: "relative",
        transition: "border-color var(--transition), transform var(--transition), box-shadow var(--transition)",
      }}
      id="onboarding-generator-contrast-card"
    >
      <div>
        {/* Top Badges */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 9px",
                borderRadius: "var(--radius-pill)",
                fontSize: 11,
                fontWeight: 700,
                background: "rgba(245, 205, 71, 0.22)",
                color: "#92400E",
                border: "1px solid rgba(217, 119, 6, 0.3)",
              }}
            >
              <Sparkles size={11} color="#D97706" /> Rekomendasi AI
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 8px",
                borderRadius: "var(--radius-pill)",
                fontSize: 10.5,
                fontWeight: 600,
                background: "rgba(0, 0, 0, 0.04)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              <Compass size={10} /> Profil Onboarding
            </span>
          </div>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: 700,
              color: "#15803D",
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              padding: "2px 8px",
              borderRadius: "var(--radius-pill)",
            }}
          >
            <CheckCircle2 size={11} color="#15803D" /> Terhubung
          </span>
        </div>

        {/* Title & Description */}
        <div style={{ marginBottom: 12 }}>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: "var(--text-primary)",
              lineHeight: 1.4,
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Sparkles size={16} style={{ color: "#D97706", flexShrink: 0 }} />
            Buat Roadmap Otomatis (AI)
          </h2>
          <p
            style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}
          >
            Tidak ingin memilih template satu per satu? Biarkan AI asisten STARA langsung merancang roadmap semester demi semester terarah sesuai data prodi &amp; onboarding kamu.
          </p>
        </div>

        {/* Connected Onboarding Data Box */}
        <div
          style={{
            background: "var(--bg-base)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            padding: "10px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 5,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#92400E",
            }}
          >
            Data Onboarding Terhubung
          </div>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <GraduationCap size={13} style={{ color: "#D97706", flexShrink: 0 }} />
            <span className="truncate">
              {profile?.programName || "Program Studi Mahasiswa"}
            </span>
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Building2 size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <span className="truncate">
              {profile?.institutionName || "Kampus Terdaftar"}
            </span>
            {profile?.entryYear && <span>• Angkatan {profile.entryYear}</span>}
            {profile?.currentSemester && <span>(Sem. {profile.currentSemester})</span>}
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div>
        <div
          style={{
            paddingTop: 12,
            borderTop: "1px solid var(--border)",
          }}
        >
          <button
            className="btn btn-primary"
            onClick={onGenerate}
            disabled={isGenerating}
            style={{
              width: "100%",
              padding: "10px 14px",
              fontSize: 12.5,
              fontWeight: 700,
              gap: 6,
              background: "#F5CD47",
              color: "#18181B",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              borderRadius: "var(--radius-md)",
              boxShadow: "0 2px 10px rgba(245, 205, 71, 0.35)",
              cursor: isGenerating ? "not-allowed" : "pointer",
            }}
            id="btn-generate-onboarding-roadmap"
          >
            <Sparkles size={14} />
            {isGenerating ? "Menyusun Roadmap..." : "Generate Roadmap Sekarang"}
          </button>
        </div>
      </div>
    </div>
  );
}
