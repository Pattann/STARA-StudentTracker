"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/features/session/context";
import { SCENARIO_TYPES } from "@/lib/constants";
import {
  Zap,
  AlertCircle,
  CheckCircle2,
  History,
  Play,
  ArrowRight,
  Briefcase,
  Layers,
  TrendingUp,
  Globe,
  PauseCircle,
  ShieldCheck,
  Check,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  Info,
} from "lucide-react";

type ScenarioType = keyof typeof SCENARIO_TYPES;

interface SimulationResult {
  simulation: { id: string; scenarioType: string; title: string; status: string };
  baseline: {
    remainingCredits: number;
    estimatedGraduationSemester: number | null;
    isProvisional: boolean;
    creditsByStatus: Record<string, number>;
    conflicts: string[];
  };
  scenario: {
    remainingCredits: number;
    estimatedGraduationSemester: number | null;
    isProvisional: boolean;
    creditsByStatus: Record<string, number>;
    conflicts: string[];
  };
  diff: {
    semesterDelta: number | null;
    creditsDelta: number;
    benefits: string[];
    risks: string[];
    unknowns: string[];
    additionalConflicts: string[];
  };
  explanation: {
    summary: string;
    benefits: string[];
    tradeoffs: string[];
    risks: string[];
    assumptions: string[];
    recommendedNextSteps: string[];
    questionsForCampus: string[];
    isAiGenerated: boolean;
    fallbackReason?: string;
  };
}

const SCENARIO_METADATA: Record<
  ScenarioType,
  {
    label: string;
    tag: string;
    desc: string;
    icon: typeof Briefcase;
    badgeBg: string;
    badgeColor: string;
    impactPill: string;
    highlight: string;
    typicalSemester: string;
  }
> = {
  magang: {
    label: "Magang Industri",
    tag: "Karier & Industri",
    desc: "Simulasikan konversi SKS magang, potensi pergeseran mata kuliah wajib reguler, dan estimasi waktu kelulusan.",
    icon: Briefcase,
    badgeBg: "rgba(217, 119, 6, 0.12)",
    badgeColor: "#B45309",
    impactPill: "Konversi s.d. 20 SKS",
    highlight: "Sesuai untuk Semester 5, 6, atau 7",
    typicalSemester: "Semester 6",
  },
  mbkm: {
    label: "MBKM & Studi Independen",
    tag: "Program Luar Prodi",
    desc: "Evaluasi pembelajaran di luar program studi dengan penyetaraan capaian kurikulum aktif di kampus.",
    icon: Layers,
    badgeBg: "rgba(245, 205, 71, 0.22)",
    badgeColor: "#92400E",
    impactPill: "Alih Kredit s.d. 20 SKS",
    highlight: "Pengembangan Keahlian Lintas Disiplin",
    typicalSemester: "Semester 5 atau 6",
  },
  advanced_course: {
    label: "Mata Kuliah Tingkat Atas",
    tag: "Akselerasi Studi",
    desc: "Ambil mata kuliah semester atas lebih awal untuk mempercepat pemenuhan syarat kelulusan total 144 SKS.",
    icon: TrendingUp,
    badgeBg: "rgba(30, 58, 138, 0.10)",
    badgeColor: "#1E3A8A",
    impactPill: "Potensi Lulus Semester 7",
    highlight: "Syarat IPK dan Prasyarat Wajib",
    typicalSemester: "Semester 4–6",
  },
  exchange: {
    label: "Pertukaran Mahasiswa",
    tag: "Global & Nasional",
    desc: "Rencanakan 1 atau 2 semester studi di kampus mitra dengan kalkulasi transfer mata kuliah sepadan.",
    icon: Globe,
    badgeBg: "rgba(21, 128, 61, 0.10)",
    badgeColor: "#15803D",
    impactPill: "Transfer Kredit Mata Kuliah",
    highlight: "Validasi Silabus Antar-Kampus",
    typicalSemester: "Semester 5–7",
  },
  cuti: {
    label: "Cuti Akademik",
    tag: "Penyesuaian Jadwal",
    desc: "Rencanakan jeda studi resmi sementara tanpa kehilangan status kemahasiswaan dan atur ulang target wisuda.",
    icon: PauseCircle,
    badgeBg: "rgba(113, 113, 122, 0.14)",
    badgeColor: "#3F3F46",
    impactPill: "Jeda 1–2 Semester",
    highlight: "Perlindungan Masa Studi Maksimal",
    typicalSemester: "Sesuai Kebutuhan",
  },
};

export default function SimulatorPage() {
  const { token } = useSession();
  const [step, setStep] = useState<"select" | "configure" | "result">("select");
  const [selectedType, setSelectedType] = useState<ScenarioType | null>(null);
  const [params, setParams] = useState<Record<string, string | number | boolean>>({
    startSemester: 6,
    durationSemesters: 1,
    conversionStatus: "belum_diketahui",
    creditsToConvert: 20,
    conflictsWithRegular: false,
  });
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pastSimulations, setPastSimulations] = useState<
    Array<{ id: string; title: string; scenarioType: string; status: string; createdAt: string }>
  >([]);
  const [showHistory, setShowHistory] = useState(false);
  const [applyConfirm, setApplyConfirm] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch("/api/simulator", { headers: { "x-demo-token": token } })
      .then((r) => r.json())
      .then((d: { simulations: typeof pastSimulations }) => setPastSimulations(d.simulations ?? []))
      .catch(() => {});

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const scenario = urlParams.get("scenario") as ScenarioType | null;
      const sem = urlParams.get("semester");
      if (scenario && SCENARIO_TYPES[scenario]) {
        setSelectedType(scenario);
        if (sem) {
          setParams((prev) => ({ ...prev, startSemester: parseInt(sem) || 6 }));
        }
        setStep("configure");
      }
    }
  }, [token]);

  const runSimulation = async () => {
    if (!token || !selectedType) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        type: selectedType,
        startSemester: params.startSemester ?? 6,
        durationSemesters: params.durationSemesters ?? 1,
        creditsToConvert: params.creditsToConvert ? Number(params.creditsToConvert) : undefined,
        conversionStatus: params.conversionStatus ?? "belum_diketahui",
        conflictsWithRegular: Boolean(params.conflictsWithRegular),
        title: `Simulasi ${SCENARIO_METADATA[selectedType]?.label ?? SCENARIO_TYPES[selectedType]}`,
      };
      const res = await fetch("/api/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as SimulationResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Gagal menjalankan simulasi.");
      setResult(data);
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    }
    setLoading(false);
  };

  const applyScenario = async () => {
    if (!token || !result?.simulation?.id) return;
    setApplyLoading(true);
    try {
      const res = await fetch(`/api/simulator/${result.simulation.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({ action: "apply" }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Gagal menerapkan skenario.");
      setApplySuccess(true);
      setApplyConfirm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menerapkan.");
    }
    setApplyLoading(false);
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }}>
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(245, 205, 71, 0.22)",
                border: "1px solid rgba(217, 119, 6, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SlidersHorizontal size={17} color="#B45309" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#18181B", margin: 0, letterSpacing: "-0.02em" }}>
              Simulasi Skenario Akademik
            </h1>
          </div>
          <p style={{ fontSize: 13.5, color: "#52525B", margin: 0 }}>
            Uji dampak magang, MBKM, percepatan SKS, atau cuti studi terhadap jadwal kelulusan sebelum mengambil keputusan resmi.
          </p>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setShowHistory(!showHistory)}
          aria-expanded={showHistory}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "8px 14px",
            borderRadius: "var(--radius-pill)",
            fontSize: 12.5,
            fontWeight: 700,
            background: showHistory ? "#FAF9F5" : "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.10)",
          }}
        >
          <History size={14} color="#52525B" />
          <span>Riwayat Simulasi</span>
          {pastSimulations.length > 0 && (
            <span
              style={{
                background: "rgba(217, 119, 6, 0.12)",
                color: "#B45309",
                fontSize: 11,
                fontWeight: 800,
                padding: "1px 7px",
                borderRadius: "var(--radius-pill)",
              }}
            >
              {pastSimulations.length}
            </span>
          )}
        </button>
      </div>

      {/* Stepper Navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 24,
          padding: "8px 12px",
          background: "#FFFFFF",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          borderRadius: 12,
          flexWrap: "wrap",
        }}
      >
        {[
          { id: "select", num: 1, label: "1. Pilih Skenario" },
          { id: "configure", num: 2, label: "2. Atur Parameter" },
          { id: "result", num: 3, label: "3. Hasil & Rekomendasi" },
        ].map((s, idx) => {
          const isCurrent = step === s.id;
          const isPast =
            (s.id === "select" && (step === "configure" || step === "result")) ||
            (s.id === "configure" && step === "result");

          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={() => {
                  if (isPast) {
                    setStep(s.id as "select" | "configure" | "result");
                  }
                }}
                disabled={!isPast && !isCurrent}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 14px",
                  borderRadius: "var(--radius-pill)",
                  fontSize: 12.5,
                  fontWeight: 700,
                  background: isCurrent ? "#F5CD47" : isPast ? "#FAF9F5" : "transparent",
                  color: isCurrent ? "#18181B" : isPast ? "#15803D" : "#71717A",
                  border: isCurrent
                    ? "1.5px solid #E5BB35"
                    : isPast
                    ? "1px solid rgba(21, 128, 61, 0.22)"
                    : "1px solid transparent",
                  cursor: isPast ? "pointer" : "default",
                  boxShadow: isCurrent ? "0 2px 8px rgba(245, 205, 71, 0.25)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: isCurrent ? "#18181B" : isPast ? "#15803D" : "rgba(0,0,0,0.08)",
                    color: isCurrent ? "#FFFFFF" : isPast ? "#FFFFFF" : "#71717A",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  {isPast ? <Check size={11} strokeWidth={3} /> : s.num}
                </span>
                <span>{s.label}</span>
              </button>
              {idx < 2 && <span style={{ color: "#D4D4D8", fontSize: 13 }}>→</span>}
            </div>
          );
        })}
      </div>

      {/* History Drawer / Panel */}
      {showHistory && (
        <div
          className="card"
          style={{
            marginBottom: 24,
            border: "1px solid rgba(217, 119, 6, 0.25)",
            background: "#FAF9F5",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#18181B", margin: 0 }}>
              Riwayat Simulasi Skenario
            </h2>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowHistory(false)}
              style={{ fontSize: 12, color: "#71717A" }}
            >
              Tutup
            </button>
          </div>
          {pastSimulations.length === 0 ? (
            <div style={{ padding: "16px 0", textAlign: "center", color: "#71717A", fontSize: 13.5 }}>
              Belum ada riwayat simulasi yang tersimpan. Mulai dengan memilih skenario di bawah.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pastSimulations.map((sim) => (
                <div
                  key={sim.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 14px",
                    background: "#FFFFFF",
                    borderRadius: 10,
                    border: "1px solid rgba(0, 0, 0, 0.06)",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#18181B" }}>{sim.title}</div>
                    <div style={{ fontSize: 12, color: "#71717A", marginTop: 2 }}>
                      Dibuat pada {new Date(sim.createdAt).toLocaleDateString("id-ID", { dateStyle: "long" })}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "4px 10px",
                      borderRadius: "var(--radius-pill)",
                      background: sim.status === "applied" ? "rgba(21, 128, 61, 0.12)" : "rgba(0, 0, 0, 0.06)",
                      color: sim.status === "applied" ? "#15803D" : "#52525B",
                      border:
                        sim.status === "applied"
                          ? "1px solid rgba(21, 128, 61, 0.20)"
                          : "1px solid rgba(0, 0, 0, 0.08)",
                    }}
                  >
                    {sim.status === "applied" ? "Telah Diterapkan" : "Tersimpan"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 1: SELECT SCENARIO */}
      {step === "select" && (
        <div>
          {/* Reassuring Notice without em-dash */}
          <div
            style={{
              background: "#FEFCE8",
              border: "1px solid rgba(245, 205, 71, 0.45)",
              borderRadius: 12,
              padding: "12px 16px",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <ShieldCheck size={18} color="#B45309" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 13, color: "#78350F", lineHeight: 1.5 }}>
              <strong style={{ fontWeight: 700 }}>Estimasi Proyeksi Akademik:</strong> Simulasi mengkalkulasi skenario
              berdasarkan data roadmap aktifmu. Hasil merupakan alat bantu evaluasi dan rekomendasi, bukan surat
              keputusan resmi dari fakultas atau program studi.
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#18181B", margin: 0 }}>
              Pilih Jenis Skenario yang Ingin Diuji
            </h2>
            <p style={{ fontSize: 13, color: "#71717A", margin: "4px 0 0" }}>
              Pilih salah satu kartu untuk menguji dampaknya pada beban SKS dan waktu kelulusanmu.
            </p>
          </div>

          {/* Clean 5-Card Responsive Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {(Object.entries(SCENARIO_METADATA) as [ScenarioType, (typeof SCENARIO_METADATA)[ScenarioType]][]).map(
              ([type, meta]) => {
                const IconComponent = meta.icon;
                const isSelected = selectedType === type;

                return (
                  <div
                    key={type}
                    onClick={() => setSelectedType(type)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedType(type)}
                    style={{
                      background: isSelected ? "#FEFCE8" : "#FFFFFF",
                      border: isSelected ? "2px solid #D97706" : "1px solid rgba(0, 0, 0, 0.08)",
                      borderRadius: 14,
                      padding: "20px 18px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "all 0.18s cubic-bezier(0.2, 0, 0.2, 1)",
                      boxShadow: isSelected
                        ? "0 12px 28px -4px rgba(217, 119, 6, 0.16), 0 4px 10px rgba(28, 25, 23, 0.04)"
                        : "0 2px 8px rgba(28, 25, 23, 0.03)",
                      transform: isSelected ? "translateY(-2px)" : "none",
                    }}
                  >
                    <div>
                      {/* Top Row: Icon + Category Badge + Selected Check */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 14,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 10,
                              background: meta.badgeBg,
                              border: `1px solid ${meta.badgeColor}30`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <IconComponent size={20} color={meta.badgeColor} />
                          </div>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: meta.badgeColor,
                              background: meta.badgeBg,
                              padding: "3px 8px",
                              borderRadius: 6,
                              letterSpacing: "0.03em",
                            }}
                          >
                            {meta.tag}
                          </span>
                        </div>

                        {isSelected && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: "#D97706",
                              background: "rgba(217, 119, 6, 0.15)",
                              border: "1px solid rgba(217, 119, 6, 0.3)",
                              padding: "3px 8px",
                              borderRadius: "var(--radius-pill)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Check size={12} strokeWidth={3} />
                            Dipilih
                          </span>
                        )}
                      </div>

                      {/* Title & Desc */}
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: "#18181B",
                          marginBottom: 6,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {meta.label}
                      </div>
                      <p style={{ fontSize: 13, color: "#52525B", lineHeight: 1.55, margin: "0 0 16px" }}>
                        {meta.desc}
                      </p>
                    </div>

                    {/* Card Footer: Metadata Chips */}
                    <div
                      style={{
                        borderTop: "1px solid rgba(0, 0, 0, 0.06)",
                        paddingTop: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#18181B",
                          background: "#FAF9F5",
                          border: "1px solid rgba(0,0,0,0.06)",
                          padding: "2px 8px",
                          borderRadius: 6,
                        }}
                      >
                        {meta.impactPill}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#71717A" }}>
                        {meta.typicalSemester}
                      </span>
                    </div>
                  </div>
                );
              }
            )}
          </div>

          {/* Bottom Action Card */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 22px",
              background: "#FFFFFF",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              borderRadius: 14,
              boxShadow: "0 4px 16px rgba(28, 25, 23, 0.04)",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#18181B" }}>
                {selectedType ? (
                  <>
                    Skenario Dipilih:{" "}
                    <strong style={{ color: "#B45309" }}>{SCENARIO_METADATA[selectedType].label}</strong>
                  </>
                ) : (
                  "Pilih salah satu kartu skenario di atas untuk melanjutkan"
                )}
              </div>
              <div style={{ fontSize: 12.5, color: "#71717A", marginTop: 2 }}>
                Langkah berikutnya: tentukan semester pelaksanaan dan estimasi konversi SKS.
              </div>
            </div>

            <button
              className="btn btn-primary"
              disabled={!selectedType}
              onClick={() => setStep("configure")}
              style={{
                padding: "10px 24px",
                fontSize: 13.5,
                fontWeight: 700,
                opacity: selectedType ? 1 : 0.5,
                cursor: selectedType ? "pointer" : "not-allowed",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>Lanjutkan Konfigurasi</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CONFIGURE PARAMETERS */}
      {step === "configure" && selectedType && (
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          {/* Chosen Scenario Summary Banner */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 18px",
              background: "#FFFFFF",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              borderRadius: 14,
              marginBottom: 20,
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {(() => {
                const MetaIcon = SCENARIO_METADATA[selectedType].icon;
                return (
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: SCENARIO_METADATA[selectedType].badgeBg,
                      border: `1px solid ${SCENARIO_METADATA[selectedType].badgeColor}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MetaIcon size={20} color={SCENARIO_METADATA[selectedType].badgeColor} />
                  </div>
                );
              })()}
              <div>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: SCENARIO_METADATA[selectedType].badgeColor,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {SCENARIO_METADATA[selectedType].tag}
                </span>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#18181B" }}>
                  {SCENARIO_METADATA[selectedType].label}
                </div>
              </div>
            </div>

            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setStep("select")}
              style={{ fontSize: 12.5, color: "#71717A" }}
            >
              Ganti Skenario
            </button>
          </div>

          {/* Configuration Form Card */}
          <div
            className="card"
            style={{
              padding: "26px 24px",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              marginBottom: 20,
              background: "#FFFFFF",
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#18181B", marginBottom: 18 }}>
              Atur Rincian Pelaksanaan
            </h2>

            <ScenarioForm type={selectedType} params={params} onChange={setParams} />
          </div>

          {error && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                background: "rgba(225, 29, 72, 0.08)",
                border: "1px solid rgba(225, 29, 72, 0.25)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <AlertCircle size={18} color="var(--coral)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "var(--coral)", fontWeight: 600 }}>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStep("select")}
              style={{ padding: "10px 18px", fontSize: 13.5, fontWeight: 700 }}
            >
              ← Kembali
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={runSimulation}
              disabled={loading}
              style={{
                padding: "10px 24px",
                fontSize: 13.5,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      border: "2px solid #18181B",
                      borderTopColor: "transparent",
                      display: "inline-block",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <span>Mengkalkulasi Proyeksi...</span>
                </>
              ) : (
                <>
                  <Play size={16} fill="#18181B" />
                  <span>Jalankan Simulasi</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SIMULATION RESULT */}
      {step === "result" && result && (
        <div>
          {/* Result Header Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setStep("configure");
                }}
                style={{ fontSize: 12.5 }}
              >
                ← Ubah Parameter
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setStep("select");
                  setResult(null);
                  setApplySuccess(false);
                }}
                style={{ fontSize: 12.5, color: "#71717A" }}
              >
                Pilih Skenario Lain
              </button>
            </div>

            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#15803D",
                background: "rgba(21, 128, 61, 0.10)",
                border: "1px solid rgba(21, 128, 61, 0.20)",
                padding: "4px 12px",
                borderRadius: "var(--radius-pill)",
              }}
            >
              Simulasi Selesai Dihitung
            </span>
          </div>

          {/* AI / Rule-based Transparency Notice */}
          {result.explanation && (
            <div
              style={{
                background: "#FAF9F5",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                borderRadius: 12,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
                fontSize: 12.5,
                color: "#52525B",
              }}
            >
              <Info size={15} color="#71717A" style={{ flexShrink: 0 }} />
              <span>
                {result.explanation.isAiGenerated
                  ? "Analisis dampak disusun menggunakan evaluasi aturan kurikulum terstruktur."
                  : (result.explanation.fallbackReason ?? "Hasil perbandingan dihitung otomatis berdasarkan data kurikulum.")}
              </span>
            </div>
          )}

          {/* Comparison Cards: Baseline vs Scenario */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {/* Baseline Card */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(0, 0, 0, 0.09)",
                borderRadius: 14,
                padding: "22px 20px",
                boxShadow: "0 2px 8px rgba(28, 25, 23, 0.03)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#71717A",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Roadmap Normal Saat Ini (Baseline)
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#18181B", lineHeight: 1.1, marginBottom: 4 }}>
                {result.baseline.estimatedGraduationSemester
                  ? `Semester ${result.baseline.estimatedGraduationSemester}`
                  : "Belum Ditetapkan"}
              </div>
              <div style={{ fontSize: 13, color: "#71717A", marginBottom: 16 }}>Estimasi target wisuda reguler</div>
              <div
                style={{
                  padding: "10px 12px",
                  background: "#FAF9F5",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#27272A",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Sisa Beban SKS:</span>
                <strong>{result.baseline.remainingCredits} SKS</strong>
              </div>
            </div>

            {/* Scenario Card */}
            <div
              style={{
                background: "#FEFCE8",
                border: "2px solid #F5CD47",
                borderRadius: 14,
                padding: "22px 20px",
                boxShadow: "0 10px 24px -4px rgba(245, 205, 71, 0.20)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#92400E",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Proyeksi Dengan {selectedType ? SCENARIO_METADATA[selectedType].label : "Skenario"}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: "var(--radius-pill)",
                    background:
                      result.diff.semesterDelta && result.diff.semesterDelta > 0
                        ? "rgba(217, 119, 6, 0.15)"
                        : "rgba(21, 128, 61, 0.12)",
                    color:
                      result.diff.semesterDelta && result.diff.semesterDelta > 0 ? "#B45309" : "#15803D",
                  }}
                >
                  {result.diff.semesterDelta !== null && result.diff.semesterDelta > 0
                    ? `+${result.diff.semesterDelta} Semester`
                    : "Lulus Tepat Waktu"}
                </span>
              </div>

              <div style={{ fontSize: 32, fontWeight: 900, color: "#18181B", lineHeight: 1.1, marginBottom: 4 }}>
                {result.scenario.estimatedGraduationSemester
                  ? `Semester ${result.scenario.estimatedGraduationSemester}`
                  : "Belum Ditetapkan"}
              </div>
              <div style={{ fontSize: 13, color: "#78350F", marginBottom: 16 }}>
                {result.diff.semesterDelta !== null && result.diff.semesterDelta > 0
                  ? "Ada potensi penyesuaian jadwal kelulusan"
                  : "Jadwal kelulusan tetap terjaga sesuai target normal"}
              </div>
              <div
                style={{
                  padding: "10px 12px",
                  background: "#FFFFFF",
                  border: "1px solid rgba(245, 205, 71, 0.4)",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#27272A",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Sisa Beban SKS:</span>
                <strong>
                  {result.scenario.remainingCredits} SKS{" "}
                  {result.diff.creditsDelta !== 0 && (
                    <span style={{ fontSize: 11.5, color: "#15803D", fontWeight: 700 }}>
                      ({result.diff.creditsDelta > 0 ? `+${result.diff.creditsDelta}` : result.diff.creditsDelta} SKS)
                    </span>
                  )}
                </strong>
              </div>
            </div>
          </div>

          {/* Detailed Explanation Accordions / Cards */}
          <div
            className="card"
            style={{
              padding: "24px 22px",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              marginBottom: 20,
              background: "#FFFFFF",
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#18181B", marginBottom: 8 }}>
              Ringkasan Evaluasi Dampak
            </h3>
            <p style={{ fontSize: 14, color: "#3F3F46", lineHeight: 1.6, marginBottom: 20 }}>
              {result.explanation?.summary}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {/* Benefits Column */}
              {result.explanation?.benefits?.length > 0 && (
                <div
                  style={{
                    background: "rgba(21, 128, 61, 0.04)",
                    border: "1px solid rgba(21, 128, 61, 0.16)",
                    borderRadius: 12,
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#15803D",
                      marginBottom: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <CheckCircle2 size={15} color="#15803D" />
                    Manfaat & Keuntungan
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {result.explanation.benefits.map((b, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: 13,
                          color: "#27272A",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          lineHeight: 1.45,
                        }}
                      >
                        <span style={{ color: "#15803D", fontWeight: 700 }}>•</span>
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risks / Tradeoffs Column */}
              {result.explanation?.risks?.length > 0 && (
                <div
                  style={{
                    background: "rgba(217, 119, 6, 0.05)",
                    border: "1px solid rgba(217, 119, 6, 0.20)",
                    borderRadius: 12,
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#B45309",
                      marginBottom: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <AlertCircle size={15} color="#B45309" />
                    Konsekuensi & Perhatian
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {result.explanation.risks.map((r, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: 13,
                          color: "#27272A",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          lineHeight: 1.45,
                        }}
                      >
                        <span style={{ color: "#B45309", fontWeight: 700 }}>•</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Questions to Ask Campus / PA */}
            {result.explanation?.questionsForCampus?.length > 0 && (
              <div
                style={{
                  marginTop: 20,
                  background: "#FAF9F5",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  borderRadius: 12,
                  padding: "16px 18px",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: "#18181B", marginBottom: 8 }}>
                  Poin Diskusi untuk Dosen Pembimbing Akademik (PA):
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {result.explanation.questionsForCampus.map((q, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 13,
                        color: "#52525B",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <span style={{ color: "#D97706", fontWeight: 700 }}>✓</span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Apply to Roadmap Section */}
          {!applySuccess && (
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(0, 0, 0, 0.09)",
                borderRadius: 14,
                padding: "22px 20px",
                boxShadow: "0 4px 16px rgba(28, 25, 23, 0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#18181B", margin: "0 0 4px" }}>
                    Terapkan Skenario Ini ke Roadmap Saya?
                  </h3>
                  <p style={{ fontSize: 13, color: "#52525B", margin: 0, maxWidth: 640 }}>
                    Menerapkan skenario akan membuat versi roadmap baru dengan jadwal yang sudah disesuaikan.
                    Roadmap versimu sebelumnya tetap tersimpan di riwayat versi dan dapat dikembalikan sewaktu-waktu.
                  </p>
                </div>

                {!applyConfirm ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => setApplyConfirm(true)}
                    style={{
                      padding: "10px 22px",
                      fontSize: 13.5,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    <Zap size={16} fill="#18181B" />
                    <span>Terapkan ke Roadmap</span>
                  </button>
                ) : (
                  <div
                    style={{
                      background: "#FEFCE8",
                      border: "1.5px solid #F5CD47",
                      borderRadius: 10,
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      width: "100%",
                    }}
                  >
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: "#78350F" }}>
                      Konfirmasi Pembuatan Versi Roadmap Baru
                    </div>
                    <p style={{ fontSize: 13, color: "#78350F", margin: 0 }}>
                      Apakah kamu yakin ingin menerapkan skenario ini? Versi roadmap aktifmu akan diperbarui.
                    </p>
                    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={applyScenario}
                        disabled={applyLoading}
                        style={{ padding: "8px 18px", fontWeight: 700 }}
                      >
                        {applyLoading ? "Menerapkan..." : "Ya, Terapkan Sekarang"}
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setApplyConfirm(false)}
                        style={{ padding: "8px 14px", fontWeight: 600 }}
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {applySuccess && (
            <div
              style={{
                background: "rgba(21, 128, 61, 0.08)",
                border: "1.5px solid rgba(21, 128, 61, 0.3)",
                borderRadius: 14,
                padding: "20px 22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <CheckCircle2 size={28} color="#15803D" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#15803D" }}>
                    Skenario Berhasil Diterapkan ke Roadmap!
                  </div>
                  <div style={{ fontSize: 13, color: "#27272A", marginTop: 2 }}>
                    Versi roadmap baru telah aktif. Versi sebelumnya tersimpan aman di riwayat versimu.
                  </div>
                </div>
              </div>

              <Link
                href="/app/roadmap"
                className="btn btn-primary"
                style={{
                  padding: "9px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  textDecoration: "none",
                }}
              >
                <span>Lihat Roadmap Aktif</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScenarioForm({
  type,
  params,
  onChange,
}: {
  type: ScenarioType;
  params: Record<string, string | number | boolean>;
  onChange: (p: Record<string, string | number | boolean>) => void;
}) {
  const update = (key: string, value: string | number | boolean) => {
    onChange({ ...params, [key]: value });
  };

  const startSem = Number(params.startSemester ?? 6);
  const duration = Number(params.durationSemesters ?? 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Semester Mulai */}
      <div className="form-group">
        <label className="form-label" style={{ fontWeight: 700, fontSize: 13.5, color: "#18181B", marginBottom: 8, display: "block" }}>
          Semester Mulai Pelaksanaan
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          {[4, 5, 6, 7, 8].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => update("startSemester", s)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-pill)",
                fontSize: 12.5,
                fontWeight: 700,
                background: startSem === s ? "#F5CD47" : "#FAF9F5",
                color: startSem === s ? "#18181B" : "#52525B",
                border: startSem === s ? "1.5px solid #E5BB35" : "1px solid rgba(0, 0, 0, 0.08)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Semester {s}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: "#71717A" }}>
          Tentukan pada semester berapa kegiatan atau skenario ini dijadwalkan berlangsung.
        </span>
      </div>

      {/* Durasi */}
      <div className="form-group">
        <label className="form-label" style={{ fontWeight: 700, fontSize: 13.5, color: "#18181B", marginBottom: 8, display: "block" }}>
          Durasi Pelaksanaan
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { value: 1, label: "1 Semester (~6 Bulan)" },
            { value: 2, label: "2 Semester (~1 Tahun)" },
          ].map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => update("durationSemesters", d.value)}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                background: duration === d.value ? "#FEFCE8" : "#FAF9F5",
                color: duration === d.value ? "#92400E" : "#52525B",
                border: duration === d.value ? "1.5px solid #F5CD47" : "1px solid rgba(0, 0, 0, 0.08)",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.15s ease",
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Konversi SKS (Untuk Magang, MBKM, Pertukaran) */}
      {(type === "magang" || type === "mbkm" || type === "exchange") && (
        <>
          <div className="form-group">
            <label className="form-label" htmlFor="creditsToConvert" style={{ fontWeight: 700, fontSize: 13.5, color: "#18181B", marginBottom: 8, display: "block" }}>
              Estimasi SKS yang Dikonversi
            </label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              {[10, 16, 20].map((sks) => (
                <button
                  key={sks}
                  type="button"
                  onClick={() => update("creditsToConvert", sks)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    background: Number(params.creditsToConvert) === sks ? "#FEFCE8" : "#FAF9F5",
                    color: Number(params.creditsToConvert) === sks ? "#92400E" : "#52525B",
                    border: Number(params.creditsToConvert) === sks ? "1px solid #F5CD47" : "1px solid rgba(0, 0, 0, 0.08)",
                    cursor: "pointer",
                  }}
                >
                  +{sks} SKS
                </button>
              ))}
            </div>
            <input
              id="creditsToConvert"
              type="number"
              className="form-input"
              min={0}
              max={40}
              value={String(params.creditsToConvert ?? 20)}
              onChange={(e) => update("creditsToConvert", parseInt(e.target.value) || 0)}
              placeholder="Jumlah SKS konversi"
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 8,
                border: "1px solid rgba(0, 0, 0, 0.12)",
                fontSize: 14,
              }}
            />
            <span style={{ fontSize: 12, color: "#71717A", marginTop: 4, display: "block" }}>
              Sesuai standar Kampus Merdeka, program magang penuh umumnya diakui hingga maksimal 20 SKS per semester.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="conversionStatus" style={{ fontWeight: 700, fontSize: 13.5, color: "#18181B", marginBottom: 6, display: "block" }}>
              Status Konfirmasi dari Program Studi
            </label>
            <select
              id="conversionStatus"
              className="form-input"
              value={String(params.conversionStatus ?? "belum_diketahui")}
              onChange={(e) => update("conversionStatus", e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 8,
                border: "1px solid rgba(0, 0, 0, 0.12)",
                fontSize: 13.5,
              }}
            >
              <option value="dikonfirmasi">Sudah dikonfirmasi Dosen PA / Kaprodi</option>
              <option value="belum_diketahui">Belum dikonfirmasi (Masih tahap estimasi)</option>
              <option value="tidak_ada">Tanpa konversi SKS (Non-akademik murni)</option>
            </select>
          </div>

          <div
            style={{
              padding: "12px 14px",
              background: "#FAF9F5",
              borderRadius: 10,
              border: "1px solid rgba(0, 0, 0, 0.07)",
            }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", margin: 0 }}>
              <input
                type="checkbox"
                checked={Boolean(params.conflictsWithRegular)}
                onChange={(e) => update("conflictsWithRegular", e.target.checked)}
                style={{ width: 17, height: 17, accentColor: "#D97706" }}
              />
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "#18181B" }}>
                Ada potensi bentrok jadwal dengan kuliah reguler di kampus
              </span>
            </label>
          </div>
        </>
      )}

      {/* Reassurance Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          background: "#FEFCE8",
          borderRadius: 8,
          border: "1px solid rgba(245, 205, 71, 0.35)",
        }}
      >
        <ShieldCheck size={16} color="#B45309" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "#78350F" }}>
          Roadmap asli kamu tidak akan diubah sebelum kamu mengonfirmasi di hasil akhir simulasi.
        </span>
      </div>
    </div>
  );
}
