"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/features/session/context";
import Link from "next/link";
import {
  TrendingUp,
  Map,
  SlidersHorizontal,
  Bell,
  ChevronRight,
  BookMarked,
  GraduationCap,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Circle,
  Calendar,
  Target,
  Info,
} from "lucide-react";

interface DashboardData {
  profile: {
    institutionName: string;
    programName: string;
    currentSemester: number;
    completedCredits: number;
    totalCurriculumCredits: number;
    gpa: number | null;
    goals: string;
  } | null;
  calculation: {
    remainingCredits: number;
    estimatedGraduationSemester: number | null;
    estimatedSemestersToGraduate: number | null;
    validationStatus: string;
    conflicts: string[];
    isProvisional: boolean;
  } | null;
  roadmap: {
    currentVersion: {
      semesterPlans: Array<{
        semesterNum: number;
        isCurrentSemester: boolean;
        targetCredits: number;
        tasks: Array<{
          id: string;
          title: string;
          status: string;
          category: string;
          credits: number;
        }>;
      }>;
    } | null;
  } | null;
}

export default function DashboardPage() {
  const { token } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/roadmap?token=${token}`, {
      headers: { "x-demo-token": token },
    })
      .then((r) => r.json())
      .then((d: DashboardData) => {
        setData(d);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, [token]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error} />;

  const profile = data?.profile;
  const calc = data?.calculation;
  const currentSemesterPlan = data?.roadmap?.currentVersion?.semesterPlans.find(
    (s) => s.isCurrentSemester
  );

  const progress =
    profile && profile.totalCurriculumCredits > 0
      ? Math.round((profile.completedCredits / profile.totalCurriculumCredits) * 100)
      : 0;

  const doneTasksCount =
    currentSemesterPlan?.tasks.filter((t) => t.status === "done").length ?? 0;
  const totalTasksCount = currentSemesterPlan?.tasks.length ?? 0;

  const quickActions = [
    {
      href: "/app/roadmap",
      icon: Map,
      label: "Roadmap Saya",
      sub: "Distribusi rencana tiap semester",
    },
    {
      href: "/app/simulator",
      icon: SlidersHorizontal,
      label: "Simulasi Skenario",
      sub: "Uji beban SKS & opsi MBKM",
    },
    {
      href: "/app/templates",
      icon: BookMarked,
      label: "Jelajahi Template",
      sub: "Blueprint kurikulum komunitas",
    },
    {
      href: "/app/thesis",
      icon: GraduationCap,
      label: "Panduan Skripsi",
      sub: "Tracker 11 tahap tugas akhir",
    },
    {
      href: "/app/reminders",
      icon: Bell,
      label: "Pengingat & Agenda",
      sub: "Batas KRS, revisi, & sidang",
    },
  ];

  return (
    <div>
      {/* Page Title & Status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
              }}
            >
              Ringkasan Akademik
            </span>
            <span style={{ color: "var(--border)" }}>•</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11.5,
                fontWeight: 600,
                color: "#92400E",
                background: "#FEF3C7",
                border: "1px solid #FDE68A",
                padding: "2px 8px",
                borderRadius: "var(--radius-pill)",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#D97706" }} />
              Semester Aktif
            </span>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", margin: 0 }}>
            Progress Studi Mahasiswa
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 6, marginBottom: 0 }}>
            {profile
              ? `${profile.programName} • ${profile.institutionName} • Semester ${profile.currentSemester}`
              : "Memuat profil akademik..."}
          </p>
        </div>

        {/* Quick Academic Meta Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#FFFFFF",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: "var(--radius-md)",
            padding: "8px 14px",
            fontSize: 12,
            color: "var(--text-secondary)",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
          }}
        >
          <Calendar size={14} color="#64748B" />
          <span>Tahun Akademik Berjalan</span>
        </div>
      </div>

      {/* Provisional Warning */}
      {calc?.isProvisional && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: "var(--radius-md)",
            padding: "10px 14px",
            fontSize: 12.5,
            color: "#92400E",
            marginBottom: 20,
            lineHeight: 1.4,
          }}
        >
          <Info size={15} style={{ flexShrink: 0, color: "#D97706" }} />
          <span>
            Estimasi kelulusan bersifat sementara berdasarkan data rencana studi Anda. Anda dapat memperbarui riwayat SKS di menu Roadmap.
          </span>
        </div>
      )}

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="SKS Selesai"
          value={`${profile?.completedCredits ?? 0} SKS`}
          sub={`${progress}% dari ${profile?.totalCurriculumCredits ?? 144} SKS kurikulum`}
          icon={CheckCircle2}
          progress={progress}
        />
        <StatCard
          label="Sisa SKS"
          value={`${calc?.remainingCredits ?? "--"} SKS`}
          sub="Target pemenuhan syarat kelulusan"
          icon={Target}
        />
        <StatCard
          label="Estimasi Lulus"
          value={
            calc?.estimatedGraduationSemester
              ? `Semester ${calc.estimatedGraduationSemester}`
              : "Perlu Data"
          }
          sub={
            calc?.isProvisional
              ? "Proyeksi kecepatan tempuh"
              : "Tepat waktu sesuai kurikulum"
          }
          icon={Calendar}
        />
        <StatCard
          label="IPK"
          value={
            profile?.currentSemester === 1
              ? "0.00"
              : profile?.gpa !== null && profile?.gpa !== undefined
              ? profile.gpa.toFixed(2)
              : "Belum diisi"
          }
          sub={
            profile?.currentSemester === 1
              ? "Belum terbit (Semester 1)"
              : profile?.gpa && profile.gpa >= 3.5
              ? "Predikat Sangat Memuaskan"
              : profile?.gpa
              ? "Evaluasi Akademik Baik"
              : "Indeks Prestasi Kumulatif"
          }
          icon={TrendingUp}
        />
      </div>

      {/* Current Semester Progress */}
      {currentSemesterPlan && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: "var(--radius-lg)",
            padding: "22px 24px",
            marginBottom: 24,
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.01em" }}>
                  Semester {currentSemesterPlan.semesterNum}
                </h2>
                <span
                  style={{
                    background: "#FEF3C7",
                    color: "#92400E",
                    border: "1px solid #FDE68A",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-pill)",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  Sedang Berjalan
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, margin: "4px 0 0" }}>
                {doneTasksCount} dari {totalTasksCount} aktivitas semester ini telah diselesaikan ({Math.round(totalTasksCount > 0 ? (doneTasksCount / totalTasksCount) * 100 : 0)}%)
              </p>
            </div>

            <Link
              href="/app/roadmap"
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
              }}
            >
              <span>Buka Roadmap Lengkap</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div
            style={{
              height: 6,
              width: "100%",
              background: "#F1F5F9",
              borderRadius: 99,
              overflow: "hidden",
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: `${totalTasksCount > 0 ? (doneTasksCount / totalTasksCount) * 100 : 0}%`,
                height: "100%",
                background: "#D97706",
                borderRadius: 99,
                transition: "width 0.4s ease",
              }}
              role="progressbar"
              aria-valuenow={doneTasksCount}
              aria-valuemax={totalTasksCount}
              aria-label="Progress semester saat ini"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 10,
            }}
          >
            {currentSemesterPlan.tasks.map((task) => {
              const isDone = task.status === "done";
              const isInProgress = task.status === "in_progress";

              return (
                <div
                  key={task.id}
                  style={{
                    background: isDone ? "#FAF9F6" : "#FFFFFF",
                    border: isDone ? "1px solid #E2E8F0" : "1px solid rgba(0, 0, 0, 0.08)",
                    borderRadius: "var(--radius-md)",
                    padding: "11px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                    <div style={{ flexShrink: 0 }}>
                      {isDone ? (
                        <CheckCircle2 size={16} color="#15803D" strokeWidth={2.2} />
                      ) : isInProgress ? (
                        <Clock size={16} color="#D97706" strokeWidth={2.2} />
                      ) : (
                        <Circle size={16} color="#94A3B8" strokeWidth={1.8} />
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: isDone ? 500 : 600,
                        color: isDone ? "var(--text-muted)" : "var(--text-primary)",
                        textDecoration: isDone ? "line-through" : "none",
                        lineHeight: 1.35,
                      }}
                    >
                      {task.title}
                    </span>
                  </div>

                  {task.credits > 0 && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: isDone ? "#64748B" : "#1E293B",
                        background: isDone ? "#F1F5F9" : "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        padding: "2px 7px",
                        borderRadius: "var(--radius-sm)",
                        flexShrink: 0,
                      }}
                    >
                      {task.credits} SKS
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 12 }}>
          <h2
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              margin: 0,
            }}
          >
            Aksi Cepat & Navigasi Modul
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
          }}
        >
          {quickActions.map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  borderRadius: "var(--radius-lg)",
                  padding: "15px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                  height: "100%",
                }}
                className="dashboard-action-card"
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "#FEF3C7",
                    border: "1px solid #FDE68A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: "#B45309",
                    transition: "all 0.18s ease",
                  }}
                  className="dashboard-action-icon"
                >
                  <item.icon size={18} strokeWidth={2.2} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      letterSpacing: "-0.01em",
                      lineHeight: 1.25,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginTop: 3,
                      lineHeight: 1.3,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.sub}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Conflicts warning */}
      {calc?.conflicts && calc.conflicts.length > 0 && (
        <div
          style={{
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: "var(--radius-lg)",
            padding: "16px 20px",
            marginBottom: 24,
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 13.5, color: "#92400E", marginBottom: 8 }}>
            <AlertTriangle size={16} color="#D97706" />
            <span>Catatan Validasi Roadmap</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {calc.conflicts.map((c, i) => (
              <div key={i} style={{ fontSize: 12.5, color: "#78350F", display: "flex", alignItems: "flex-start", gap: 6 }}>
                <span style={{ color: "#D97706" }}>•</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  progress,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  progress?: number;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        borderRadius: "var(--radius-lg)",
        padding: "18px 20px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "all 0.2s ease",
      }}
      className="dashboard-stat-card"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: "var(--text-muted)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#475569",
            flexShrink: 0,
          }}
        >
          <Icon size={16} strokeWidth={2} />
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: "#0F172A",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            marginBottom: 6,
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.3 }}>
          {sub}
        </div>
      </div>

      {typeof progress === "number" && (
        <div
          style={{
            marginTop: 12,
            height: 5,
            width: "100%",
            background: "#F1F5F9",
            borderRadius: 99,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.min(100, Math.max(0, progress))}%`,
              height: "100%",
              background: "#15803D",
              borderRadius: 99,
              transition: "width 0.4s ease",
            }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemax={100}
            aria-label={label}
          />
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div className="skeleton" style={{ height: 16, width: 140, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 28, width: 280, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 16, width: 360 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton" style={{ height: 110, borderRadius: 12 }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 220, borderRadius: 12 }} />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        borderRadius: "var(--radius-lg)",
        padding: "40px 24px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <AlertCircle size={22} color="#DC2626" />
      </div>
      <div>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
          Gagal Memuat Ringkasan Akademik
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>{message}</p>
      </div>
    </div>
  );
}
