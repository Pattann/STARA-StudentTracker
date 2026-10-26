"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/features/session/context";
import Link from "next/link";
import {
  TrendingUp,
  Map,
  Zap,
  Bell,
  ChevronRight,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Clock,
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
    profile
      ? Math.round((profile.completedCredits / profile.totalCurriculumCredits) * 100)
      : 0;

  const doneTasksCount =
    currentSemesterPlan?.tasks.filter((t) => t.status === "done").length ?? 0;
  const totalTasksCount = currentSemesterPlan?.tasks.length ?? 0;

  return (
    <div>
      {/* Page Title */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
          Selamat datang di STARA 👋
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          {profile
            ? `${profile.programName} • ${profile.institutionName} • Semester ${profile.currentSemester}`
            : "Muat data akademik..."}
        </p>
      </div>

      {/* Provisional Warning */}
      {calc?.isProvisional && (
        <div className="assumption-notice" style={{ marginBottom: 20 }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            Estimasi kelulusan bersifat sementara berdasarkan data yang dimasukkan. Konfirmasi ke kampus untuk akurasi lebih baik.
          </span>
        </div>
      )}

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <StatCard
          label="SKS Selesai"
          value={`${profile?.completedCredits ?? 0} SKS`}
          sub={`dari ${profile?.totalCurriculumCredits ?? 144} SKS kurikulum`}
          accent="var(--amber-deep)"
          progress={progress}
        />
        <StatCard
          label="Sisa SKS"
          value={`${calc?.remainingCredits ?? "--"} SKS`}
          sub="perlu diselesaikan"
          accent="var(--teal)"
        />
        <StatCard
          label="Estimasi Lulus"
          value={
            calc?.estimatedGraduationSemester
              ? `Semester ${calc.estimatedGraduationSemester}`
              : "Perlu data"
          }
          sub={
            calc?.isProvisional
              ? "Estimasi (data belum lengkap)"
              : "Berdasarkan roadmap"
          }
          accent="var(--blue)"
        />
        <StatCard
          label="IPK"
          value={profile?.gpa ? profile.gpa.toFixed(2) : "Belum diisi"}
          sub="Indeks Prestasi Kumulatif"
          accent="var(--purple)"
        />
      </div>

      {/* Current Semester Progress */}
      {currentSemesterPlan && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                Semester {currentSemesterPlan.semesterNum} — Sedang Berjalan
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                {doneTasksCount}/{totalTasksCount} task selesai
              </p>
            </div>
            <Link href="/app/roadmap" className="btn btn-secondary btn-sm">
              Lihat Roadmap
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="progress-track" style={{ marginBottom: 16 }}>
            <div
              className="progress-fill"
              style={{ width: `${totalTasksCount > 0 ? (doneTasksCount / totalTasksCount) * 100 : 0}%` }}
              role="progressbar"
              aria-valuenow={doneTasksCount}
              aria-valuemax={totalTasksCount}
              aria-label="Progress semester saat ini"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 8,
            }}
          >
            {currentSemesterPlan.tasks.slice(0, 6).map((task) => (
              <div key={task.id} className="task-item">
                {task.status === "done" ? (
                  <CheckCircle2 size={16} color="var(--forest-green)" />
                ) : task.status === "in_progress" ? (
                  <Clock size={16} color="var(--teal)" />
                ) : (
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border: "2px solid var(--border)",
                      flexShrink: 0,
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: 13,
                    color: task.status === "done" ? "var(--text-muted)" : "var(--text-primary)",
                    textDecoration: task.status === "done" ? "line-through" : "none",
                  }}
                  className="truncate"
                >
                  {task.title}
                </span>
                {task.credits > 0 && (
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto", flexShrink: 0 }}>
                    {task.credits} SKS
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontWeight: 700, color: "var(--text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 12 }}>
          Aksi Cepat
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {[
            { href: "/app/simulator", icon: Zap, label: "Buat Simulasi", sub: "Evaluasi skenario akademik", color: "var(--amber)" },
            { href: "/app/roadmap", icon: Map, label: "Lihat Roadmap", sub: "Timeline semester", color: "var(--teal)" },
            { href: "/app/templates", icon: BookOpen, label: "Jelajahi Template", sub: "Dari mahasiswa lain", color: "var(--blue)" },
            { href: "/app/reminders", icon: Bell, label: "Pengingat", sub: "Deadline penting", color: "var(--coral)" },
            { href: "/app/thesis", icon: BookOpen, label: "Panduan Skripsi", sub: "Eksplorasi topik", color: "var(--orange)" },
          ].map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <div
                className="card card-sm"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                  transition: "border-color 200ms",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: `${item.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: item.color,
                  }}
                >
                  <item.icon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.sub}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Conflicts warning */}
      {calc?.conflicts && calc.conflicts.length > 0 && (
        <div className="warning-box">
          <div style={{ fontWeight: 700, marginBottom: 8 }}>⚠ Perhatian di Roadmap Kamu</div>
          {calc.conflicts.map((c, i) => (
            <div key={i} style={{ fontSize: 13 }}>• {c}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
  progress,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
  progress?: number;
}) {
  return (
    <div className="stat-card">
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: accent, letterSpacing: "-0.02em" }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{sub}</div>
      {typeof progress === "number" && (
        <div className="progress-track" style={{ marginTop: 4 }}>
          <div
            className="progress-fill"
            style={{ width: `${progress}%`, background: accent }}
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
    <div>
      <div className="skeleton" style={{ height: 32, width: 240, marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 18, width: 320, marginBottom: 28 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton" style={{ height: 100 }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 200 }} />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="error-state">
      <AlertCircle size={32} color="var(--coral)" />
      <p style={{ color: "var(--text-primary)", fontWeight: 600 }}>Gagal memuat dashboard</p>
      <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{message}</p>
    </div>
  );
}
