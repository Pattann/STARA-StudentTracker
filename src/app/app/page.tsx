"use client";

import { useEffect, useState } from "react";
import { useSession, getCachedRoadmap, setCachedRoadmap } from "@/features/session/context";
import Link from "next/link";
import {
  TrendingUp,
  Map,
  Zap,
  Bell,
  ChevronRight,
  BookOpen,
  Award,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  GraduationCap,
} from "lucide-react";

const FLOW_STORAGE_KEY = "stara_flow_done";

const FLOW_STEPS = [
  {
    id: "onboarding",
    title: "Lengkapi data akademik",
    desc: "Kampus, semester, dan SKS-mu. Dipakai untuk menghitung roadmap.",
    href: "/onboarding",
    cta: "Isi data",
  },
  {
    id: "roadmap",
    title: "Lihat roadmap kuliahmu",
    desc: "Rencana per semester sampai lulus. Kamu bisa mengubahnya kapan saja.",
    href: "/app/roadmap",
    cta: "Buka roadmap",
  },
  {
    id: "simulator",
    title: "Coba simulasi \"bagaimana jika\"",
    desc: "Misalnya ambil magang atau tambah SKS, lalu lihat dampaknya ke jadwal lulus.",
    href: "/app/simulator",
    cta: "Coba simulasi",
  },
  {
    id: "thesis",
    title: "Siapkan skripsi",
    desc: "Lacak 11 tahap skripsi dan tanya AI soal langkah berikutnya.",
    href: "/app/thesis",
    cta: "Buka panduan",
  },
] as const;

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
  const [data, setData] = useState<DashboardData | null>(() => getCachedRoadmap<DashboardData>(token));
  const [loading, setLoading] = useState<boolean>(() => !getCachedRoadmap<DashboardData>(token));
  const [error, setError] = useState<string | null>(null);
  const [visited, setVisited] = useState<string[]>([]);
  const [justOnboarded, setJustOnboarded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FLOW_STORAGE_KEY);
      if (raw) setVisited(JSON.parse(raw) as string[]);
    } catch {
      setVisited([]);
    }
    if (new URLSearchParams(window.location.search).get("welcome") === "1") {
      setJustOnboarded(true);
    }
  }, []);

  const markVisited = (id: string) => {
    setVisited((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  useEffect(() => {
    if (!token) return;
    const cached = getCachedRoadmap<DashboardData>(token);
    if (cached) {
      setData(cached);
      setLoading(false);
    }
    fetch(`/api/roadmap?token=${token}`, {
      headers: { "x-demo-token": token },
    })
      .then((r) => r.json())
      .then((d: DashboardData) => {
        setData(d);
        setCachedRoadmap(token, d);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (!cached) setError(e.message);
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

  // Guided flow: onboarding counts as done once the profile exists
  const isStepDone = (id: string) =>
    (id === "onboarding" && Boolean(profile)) || visited.includes(id);
  const flowDoneCount = FLOW_STEPS.filter((s) => isStepDone(s.id)).length;
  const nextStep = FLOW_STEPS.find((s) => !isStepDone(s.id));

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

      {/* Welcome after onboarding */}
      {justOnboarded && (
        <div
          role="status"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(34,197,94,0.10)",
            border: "1px solid rgba(34,197,94,0.35)",
            color: "var(--text-primary)",
            padding: "12px 16px",
            borderRadius: 12,
            fontSize: 13.5,
            marginBottom: 20,
          }}
        >
          <CheckCircle2 size={18} color="#16A34A" style={{ flexShrink: 0 }} />
          <span>
            <strong>Data akademikmu tersimpan.</strong> Roadmap sudah dibuat. Ikuti langkah di bawah untuk mulai.
          </span>
        </div>
      )}

      {/* Guided Flow: Mulai di sini */}
      {flowDoneCount < FLOW_STEPS.length && (
        <div className="card" style={{ marginBottom: 24, borderColor: "var(--amber)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
              <Sparkles size={17} color="var(--amber-deep)" />
              Mulai di sini
            </h2>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>
              {flowDoneCount} dari {FLOW_STEPS.length} langkah selesai
            </span>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 14px" }}>
            Ikuti urutan ini supaya STARA bisa memberi rencana dan saran yang sesuai untukmu.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FLOW_STEPS.map((s, i) => {
              const done = isStepDone(s.id);
              const isNext = nextStep?.id === s.id;
              return (
                <Link
                  key={s.id}
                  href={s.href}
                  onClick={() => markVisited(s.id)}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: `1.5px solid ${isNext ? "var(--amber)" : "var(--border)"}`,
                      background: isNext ? "rgba(245,205,71,0.12)" : "transparent",
                      opacity: done ? 0.65 : 1,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 800,
                        background: done ? "#16A34A" : isNext ? "var(--amber)" : "var(--bg-secondary)",
                        color: done || isNext ? "#fff" : "var(--text-muted)",
                      }}
                    >
                      {done ? <CheckCircle2 size={16} /> : i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", textDecoration: done ? "line-through" : "none" }}>
                        {s.title}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{s.desc}</div>
                    </div>
                    {isNext && (
                      <span className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
                        {s.cta}
                        <ChevronRight size={14} />
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
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
          value={`${
            calc?.remainingCredits ??
            (profile
              ? Math.max(0, profile.totalCurriculumCredits - profile.completedCredits)
              : "--")
          } SKS`}
          sub="perlu diselesaikan"
          accent="var(--teal)"
        />
        <StatCard
          label="Estimasi Lulus"
          value={
            calc?.estimatedGraduationSemester
              ? `Semester ${calc.estimatedGraduationSemester}`
              : profile
              ? `Semester ${profile.goals === "fast" ? Math.max(profile.currentSemester, 7) : Math.max(profile.currentSemester, 8)}`
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
        <h2 style={{ fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 12 }}>
          Semua Fitur
        </h2>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "0 0 12px" }}>
          Pintasan ke fitur STARA. Fitur utama ada di baris pertama.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {[
            { href: "/app/roadmap", flow: "roadmap", icon: Map, label: "Roadmap Saya", sub: "Rencana kuliah per semester sampai lulus", color: "var(--teal)", main: true },
            { href: "/app/simulator", flow: "simulator", icon: Zap, label: "Simulasi \"Bagaimana Jika\"", sub: "Lihat dampak magang atau ubah SKS ke jadwal lulus", color: "var(--amber)", main: true },
            { href: "/app/thesis", flow: "thesis", icon: GraduationCap, label: "Panduan Skripsi", sub: "Lacak 11 tahap skripsi + tanya AI", color: "var(--orange)", main: true },
            { href: "/app/templates", flow: "", icon: BookOpen, label: "Jelajahi Template", sub: "Contoh roadmap dari mahasiswa lain", color: "var(--blue)", main: false },
            { href: "/app/reminders", flow: "", icon: Bell, label: "Pengingat", sub: "Deadline KRS, proposal, dll", color: "var(--coral)", main: false },
            { href: "/app/achievements", flow: "", icon: Award, label: "Prestasi & CV", sub: "Catat kegiatan untuk CV dan poin TAK", color: "var(--purple)", main: false },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ textDecoration: "none" }}
              onClick={() => item.flow && markVisited(item.flow)}
            >
              <div
                className="card card-sm"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                  transition: "border-color 200ms",
                  borderColor: item.main ? item.color : undefined,
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
