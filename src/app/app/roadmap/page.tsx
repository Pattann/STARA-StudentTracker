"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/features/session/context";
import {
  CheckCircle2, Clock, Circle, ChevronDown, ChevronUp, Plus,
  AlertCircle, GitBranch, History, Sparkles, BookOpen, Users,
  Building2, Trash2, ArrowRight, X, Check,
} from "lucide-react";
import { TASK_CATEGORIES, TASK_STATUSES, TEMPLATE_CATEGORIES } from "@/lib/constants";
import { semesterLabel } from "@/lib/utils";
import { MOCK_TEMPLATES, MockTemplate } from "@/features/templates/data";
import Link from "next/link";

type Task = {
  id: string;
  title: string;
  status: string;
  category: string;
  credits: number;
  courseCode?: string;
  notes?: string;
  certaintyLevel: string;
  dataSource?: string;
};

type SemesterPlan = {
  id: string;
  semesterNum: number;
  semesterLabel: string | null;
  targetCredits: number;
  isCurrentSemester: boolean;
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
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [activeView, setActiveView] = useState<"timeline" | "visual">("timeline");
  const [toast, setToast] = useState<string | null>(null);

  // Template Picker Modal in Roadmap
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [pickerSourceTab, setPickerSourceTab] = useState<"komunitas" | "kampus">("komunitas");
  const [selectedTemplateForApply, setSelectedTemplateForApply] = useState<MockTemplate | null>(null);
  const [targetSemesterForApply, setTargetSemesterForApply] = useState<number>(0);
  const [applyMode, setApplyMode] = useState<"merge" | "new_version">("merge");
  const [isApplying, setIsApplying] = useState(false);

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

  const updateTask = async (taskId: string, updates: Record<string, string>) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({ action: "update_task", taskId, updates }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan.");
      showToast("✓ Perubahan disimpan");
      fetchRoadmap();
    } catch {
      showToast("✗ Gagal menyimpan perubahan");
    }
    setEditingTask(null);
  };

  const deleteTask = async (taskId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({ action: "delete_task", taskId }),
      });
      if (!res.ok) throw new Error("Gagal menghapus task.");
      showToast("✓ Task berhasil dihapus");
      setEditingTask(null);
      fetchRoadmap();
    } catch {
      showToast("✗ Gagal menghapus task");
    }
  };

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
      showToast(`✓ ${json.message}`);
      fetchRoadmap();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal beralih versi";
      showToast(`✗ ${msg}`);
    }
  };

  const handleApplyTemplateFromPicker = async () => {
    if (!selectedTemplateForApply || !token) return;
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
          mode: applyMode,
          targetSemesterNum: targetSemesterForApply,
          items: selectedTemplateForApply.items,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menerapkan template");

      showToast(`✓ ${json.message}`);
      setShowTemplatePicker(false);
      setSelectedTemplateForApply(null);
      fetchRoadmap();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal menerapkan template";
      showToast(`✗ ${msg}`);
    } finally {
      setIsApplying(false);
    }
  };

  const openPickerForSemester = (semesterNum: number) => {
    setTargetSemesterForApply(semesterNum);
    setSelectedTemplateForApply(null);
    setShowTemplatePicker(true);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  if (loading)
    return (
      <div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 80, marginBottom: 12 }} />
        ))}
      </div>
    );

  if (error || !data?.roadmap)
    return (
      <div className="error-state">
        <AlertCircle size={28} color="var(--coral)" />
        <p style={{ color: "var(--text-primary)", fontWeight: 600 }}>Roadmap tidak ditemukan</p>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          {error ?? "Silakan mulai onboarding untuk membuat roadmap."}
        </p>
      </div>
    );

  const semesterPlans = data.roadmap.currentVersion?.semesterPlans ?? [];
  const calc = data.calculation;
  const profile = data.profile;

  const templatesToDisplay = MOCK_TEMPLATES.filter((t) => t.sourceType === pickerSourceTab);

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
              Roadmap Saya
            </h1>
            {data.roadmap.currentVersion?.label?.includes("Template") && (
              <span className="badge badge-blue" style={{ fontSize: 11, marginBottom: 4 }}>
                <Sparkles size={11} /> Berbasis Template
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {profile?.programName} • {data.roadmap.currentVersion?.label ?? "Versi Saat Ini"}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* Button to open Template Picker */}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setTargetSemesterForApply(0);
              setSelectedTemplateForApply(null);
              setShowTemplatePicker(true);
            }}
            id="btn-open-template-picker"
            style={{ gap: 6 }}
          >
            <Sparkles size={14} />
            Pasang Template
          </button>

          <div className="tabs">
            <button
              className={`tab ${activeView === "timeline" ? "active" : ""}`}
              onClick={() => setActiveView("timeline")}
            >
              Timeline
            </button>
            <button
              className={`tab ${activeView === "visual" ? "active" : ""}`}
              onClick={() => setActiveView("visual")}
            >
              Peta Visual
            </button>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowHistory(!showHistory)}
            aria-expanded={showHistory}
            style={{ gap: 5 }}
          >
            <History size={14} />
            Riwayat
          </button>
        </div>
      </div>

      {/* Version History */}
      {showHistory && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              Riwayat Versi Roadmap
            </h2>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
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
                    padding: "10px 14px",
                    background: isActive ? "rgba(133,136,255,0.06)" : "var(--bg-secondary)",
                    border: isActive ? "1px solid var(--blue)" : "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                        v{v.versionNum} — {v.label ?? "Tanpa judul"}
                      </span>
                      {v.isBaseline && <span className="badge badge-lime">Baseline</span>}
                      {v.label?.includes("Template") && (
                        <span className="badge badge-blue">Template</span>
                      )}
                      {isActive && <span className="badge badge-teal">Aktif</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      Dibuat pada {new Date(v.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  {!isActive && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => switchVersion(v.id)}
                    >
                      Jadikan Aktif
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {calc && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div className="card card-sm">
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              SKS Selesai
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--lime)" }}>
              {calc.creditsByStatus?.done ?? 0}
            </div>
          </div>
          <div className="card card-sm">
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Sisa SKS
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--teal)" }}>
              {calc.remainingCredits}
            </div>
          </div>
          <div className="card card-sm">
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Estimasi Lulus
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--blue)" }}>
              {calc.estimatedGraduationSemester
                ? `Semester ${calc.estimatedGraduationSemester}`
                : "Perlu data"}
            </div>
            {calc.isProvisional && (
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Estimasi sementara</div>
            )}
          </div>
        </div>
      )}

      {/* Conflicts */}
      {calc?.conflicts && calc.conflicts.length > 0 && (
        <div className="warning-box" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠ Konflik Terdeteksi</div>
          {calc.conflicts.map((c, i) => (
            <div key={i} style={{ fontSize: 13 }}>
              • {c}
            </div>
          ))}
        </div>
      )}

      {/* Timeline View */}
      {activeView === "timeline" && (
        <div className="roadmap-timeline">
          {semesterPlans.map((plan) => (
            <SemesterCard
              key={plan.semesterNum}
              plan={plan}
              profile={profile}
              isExpanded={expandedSemesters.has(plan.semesterNum)}
              onToggle={() => toggleSemester(plan.semesterNum)}
              editingTask={editingTask}
              onEditTask={setEditingTask}
              onSaveTask={updateTask}
              onDeleteTask={deleteTask}
              onOpenTemplate={() => openPickerForSemester(plan.semesterNum)}
            />
          ))}
        </div>
      )}

      {/* Visual Map View */}
      {activeView === "visual" && (
        <VisualMapPlaceholder semesterPlans={semesterPlans} />
      )}

      {/* ── Modal Pasang Template Langsung dari Roadmap ── */}
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
            {/* Header */}
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
              /* Step 2: Konfigurasi Integrasi Template */
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
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color:
                          selectedTemplateForApply.sourceType === "kampus"
                            ? "var(--lime)"
                            : "var(--blue)",
                      }}
                    >
                      {selectedTemplateForApply.sourceType === "kampus" ? "Kampus Resmi" : "Komunitas"}
                    </span>
                    <span style={{ opacity: 0.4 }}>•</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {selectedTemplateForApply.institutionName}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                    {selectedTemplateForApply.title}
                  </h3>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {selectedTemplateForApply.description}
                  </p>
                </div>

                {/* Target Semester */}
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" htmlFor="select-roadmap-target-sem" style={{ fontSize: 12, fontWeight: 700 }}>
                    Alokasikan ke Semester:
                  </label>
                  <select
                    id="select-roadmap-target-sem"
                    className="form-input"
                    value={targetSemesterForApply}
                    onChange={(e) => setTargetSemesterForApply(Number(e.target.value))}
                  >
                    <option value={0}>Sesuai Semester Asli di Template</option>
                    <option value={5}>Semester 5 (Aktif Saat Ini)</option>
                    <option value={6}>Semester 6</option>
                    <option value={7}>Semester 7</option>
                    <option value={8}>Semester 8</option>
                  </select>
                </div>

                <div
                  style={{
                    background: "var(--bg-secondary)",
                    borderRadius: "var(--radius-md)",
                    padding: 12,
                    marginBottom: 20,
                    maxHeight: 130,
                    overflowY: "auto",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>
                    DAFTAR ITEM ({selectedTemplateForApply.items.length})
                  </div>
                  {selectedTemplateForApply.items.map((item, idx) => (
                    <div key={idx} style={{ fontSize: 12, color: "var(--text-primary)", padding: "3px 0" }}>
                      • {item.title} {item.credits > 0 ? `(${item.credits} SKS)` : ""}
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, gap: 8 }}
                    onClick={handleApplyTemplateFromPicker}
                    disabled={isApplying}
                    id="btn-confirm-apply-picker"
                  >
                    {isApplying ? "Memproses..." : <><Check size={16} /> Pasang ke Roadmap Saya</>}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setSelectedTemplateForApply(null)}
                    disabled={isApplying}
                  >
                    Kembali
                  </button>
                </div>
              </div>
            ) : (
              /* Step 1: Browse Templates */
              <div>
                {/* Tabs: Komunitas vs Kampus */}
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <button
                    className={`btn btn-sm ${pickerSourceTab === "komunitas" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setPickerSourceTab("komunitas")}
                    style={{ flex: 1, gap: 6 }}
                  >
                    <Users size={14} /> Komunitas ({MOCK_TEMPLATES.filter((t) => t.sourceType === "komunitas").length})
                  </button>
                  <button
                    className={`btn btn-sm ${pickerSourceTab === "kampus" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setPickerSourceTab("kampus")}
                    style={{ flex: 1, gap: 6 }}
                  >
                    <Building2 size={14} /> Kampus Resmi ({MOCK_TEMPLATES.filter((t) => t.sourceType === "kampus").length})
                  </button>
                </div>

                {targetSemesterForApply > 0 && (
                  <div style={{ fontSize: 12, color: "var(--blue)", marginBottom: 12, fontWeight: 600 }}>
                    🎯 Target penempatan: Semester {targetSemesterForApply}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 380, overflowY: "auto", paddingRight: 4 }}>
                  {templatesToDisplay.map((t) => (
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
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {t.institutionName} • {t.programName}
                          </span>
                          <span className="badge badge-gray" style={{ fontSize: 9, fontWeight: 700 }}>
                            📅 {t.year}
                          </span>
                          {t.verified && (
                            <span className="badge badge-lime" style={{ fontSize: 10 }}>
                              Verified
                            </span>
                          )}
                        </div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
                          {t.title}
                        </h3>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {t.items.length} mata kuliah/kegiatan terstruktur
                        </div>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ flexShrink: 0, gap: 4 }}
                        onClick={() => setSelectedTemplateForApply(t)}
                      >
                        Pilih <ArrowRight size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16, textAlign: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: 14 }}>
                  <Link href="/app/templates" className="btn btn-ghost btn-sm" style={{ color: "var(--blue)" }}>
                    Buka Halaman Jelajahi Template Lengkap →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
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

function SemesterCard({
  plan,
  profile,
  isExpanded,
  onToggle,
  editingTask,
  onEditTask,
  onSaveTask,
  onDeleteTask,
  onOpenTemplate,
}: {
  plan: SemesterPlan;
  profile: { currentSemester: number; entryYear: number } | null;
  isExpanded: boolean;
  onToggle: () => void;
  editingTask: string | null;
  onEditTask: (id: string | null) => void;
  onSaveTask: (id: string, updates: Record<string, string>) => void;
  onDeleteTask: (id: string) => void;
  onOpenTemplate: () => void;
}) {
  const academicTasks = plan.tasks.filter((t) => t.category === "akademik");
  const totalCredits = academicTasks.reduce((sum, t) => sum + t.credits, 0);
  const doneTasks = plan.tasks.filter((t) => t.status === "done").length;
  const label =
    plan.semesterLabel ??
    (profile
      ? semesterLabel(plan.semesterNum, profile.entryYear)
      : `Semester ${plan.semesterNum}`);

  const categoryColors: Record<string, string> = {
    akademik: "var(--blue)",
    tak: "var(--teal)",
    karier: "var(--orange)",
    skripsi: "var(--purple)",
    pribadi: "var(--coral)",
  };

  return (
    <div className={`semester-card ${plan.isCurrentSemester ? "current" : ""}`}>
      <div
        className="semester-card-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onToggle()}
        aria-expanded={isExpanded}
        aria-label={`${label}. ${doneTasks} dari ${plan.tasks.length} task selesai.`}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                {label}
              </span>
              {plan.isCurrentSemester && <span className="badge badge-lime">Aktif</span>}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {totalCredits} SKS akademik • {doneTasks}/{plan.tasks.length} task selesai
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 60 }}>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width:
                    plan.tasks.length > 0 ? `${(doneTasks / plan.tasks.length) * 100}%` : "0%",
                }}
              />
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp size={16} color="var(--text-muted)" />
          ) : (
            <ChevronDown size={16} color="var(--text-muted)" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="semester-card-body">
          <div style={{ paddingTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
            {plan.tasks.map((task) => (
              <div key={task.id}>
                {editingTask === task.id ? (
                  <TaskEditForm
                    task={task}
                    onSave={(updates) => onSaveTask(task.id, updates)}
                    onDelete={() => onDeleteTask(task.id)}
                    onCancel={() => onEditTask(null)}
                  />
                ) : (
                  <div
                    className="task-item"
                    style={{ cursor: "pointer" }}
                    onClick={() => onEditTask(task.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && onEditTask(task.id)}
                    aria-label={`${task.title}, status: ${
                      TASK_STATUSES[task.status as keyof typeof TASK_STATUSES] ?? task.status
                    }`}
                  >
                    <StatusIcon status={task.status} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span
                          className="truncate"
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: task.status === "done" ? "var(--text-muted)" : "var(--text-primary)",
                            textDecoration: task.status === "done" ? "line-through" : "none",
                          }}
                        >
                          {task.title}
                        </span>
                        {task.courseCode && (
                          <span className="badge badge-gray" style={{ fontSize: 10 }}>
                            {task.courseCode}
                          </span>
                        )}
                        {/* Template source provenance badges */}
                        {task.dataSource === "template" && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: "1px 6px",
                              borderRadius: "var(--radius-pill)",
                              background: "rgba(133,136,255,0.12)",
                              color: "var(--blue)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              fontWeight: 600,
                            }}
                          >
                            <Users size={9} /> Komunitas
                          </span>
                        )}
                        {task.dataSource === "kampus" && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: "1px 6px",
                              borderRadius: "var(--radius-pill)",
                              background: "rgba(245,205,71,0.14)",
                              color: "var(--lime)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              fontWeight: 600,
                            }}
                          >
                            <Building2 size={9} /> Kampus
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                      <span
                        className="badge"
                        style={{
                          background: `${categoryColors[task.category]}15`,
                          color: categoryColors[task.category],
                          fontSize: 11,
                        }}
                      >
                        {TASK_CATEGORIES[task.category as keyof typeof TASK_CATEGORIES] ??
                          task.category}
                      </span>
                      {task.credits > 0 && (
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {task.credits} SKS
                        </span>
                      )}
                      {task.certaintyLevel === "belum_diketahui" && (
                        <span title="Data belum dikonfirmasi">
                          <AlertCircle size={13} color="var(--orange)" />
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Quick action: Add from template directly to this semester */}
            <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={onOpenTemplate}
                style={{ fontSize: 12, color: "var(--blue)", gap: 4 }}
              >
                <Plus size={13} />
                Tambah dari Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "done")
    return <CheckCircle2 size={16} color="var(--lime)" aria-label="Selesai" />;
  if (status === "in_progress")
    return <Clock size={16} color="var(--teal)" aria-label="Berjalan" />;
  if (status === "delayed")
    return <AlertCircle size={16} color="var(--orange)" aria-label="Tertunda" />;
  if (status === "cancelled")
    return <Circle size={16} color="var(--coral)" aria-label="Dibatalkan" />;
  return <Circle size={16} color="var(--border)" aria-label="Direncanakan" />;
}

function TaskEditForm({
  task,
  onSave,
  onDelete,
  onCancel,
}: {
  task: Task;
  onSave: (updates: Record<string, string>) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const [status, setStatus] = useState(task.status);
  const [notes, setNotes] = useState(task.notes ?? "");

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        borderRadius: "var(--radius-md)",
        padding: "14px",
        marginBottom: 4,
        border: "1px solid var(--border-active)",
      }}
      role="form"
      aria-label={`Edit task: ${task.title}`}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
          {task.title}
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={onDelete}
          title="Hapus task ini"
          style={{ color: "var(--coral)", padding: 4 }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="form-group" style={{ marginBottom: 10 }}>
        <label className="form-label" htmlFor={`status-${task.id}`}>
          Status
        </label>
        <select
          id={`status-${task.id}`}
          className="form-input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {Object.entries(TASK_STATUSES).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group" style={{ marginBottom: 12 }}>
        <label className="form-label" htmlFor={`notes-${task.id}`}>
          Catatan
        </label>
        <input
          id={`notes-${task.id}`}
          className="form-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tambahkan catatan..."
        />
      </div>

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

function VisualMapPlaceholder({ semesterPlans }: { semesterPlans: SemesterPlan[] }) {
  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <GitBranch size={20} color="var(--lime)" />
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
          Peta Visual Roadmap
        </h2>
      </div>
      <div className="info-box" style={{ marginBottom: 16 }}>
        Peta alur visual semester plans dan keterhubungan mata kuliah.
      </div>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
        {semesterPlans.map((plan) => (
          <div
            key={plan.semesterNum}
            style={{
              minWidth: 200,
              background: plan.isCurrentSemester ? "rgba(215,243,106,0.08)" : "var(--bg-secondary)",
              border: plan.isCurrentSemester ? "1px solid var(--lime)" : "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: 14,
              flexShrink: 0,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 8 }}>
              Semester {plan.semesterNum}
              {plan.isCurrentSemester && (
                <span className="badge badge-lime" style={{ marginLeft: 6, fontSize: 10 }}>
                  Aktif
                </span>
              )}
            </div>
            {plan.tasks.slice(0, 5).map((t) => (
              <div
                key={t.id}
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <StatusIcon status={t.status} />
                <span className="truncate">{t.title}</span>
              </div>
            ))}
            {plan.tasks.length > 5 && (
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                +{plan.tasks.length - 5} lainnya
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
