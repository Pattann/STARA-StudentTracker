"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/features/session/context";
import { SCENARIO_TYPES } from "@/lib/constants";
import CustomAIPlan from "./CustomAIPlan";
import {
  Zap, AlertCircle, CheckCircle2, History, Play, ArrowRight, Sparkles, RefreshCw,
  Lightbulb, MessageSquare, Bot, User, Send, Briefcase, Compass, TrendingUp, Globe,
  CalendarClock, Check
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

const CUSTOM_PLAN_TITLE = "Rencana Kustom dengan AI";

interface ScenarioCardItem {
  id: ScenarioType | "custom";
  title: string;
  badge?: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}

const ALL_SCENARIOS: ScenarioCardItem[] = [
  {
    id: "magang",
    title: "Magang",
    description: "Simulasikan dampak magang terhadap jadwal kuliah dan SKS.",
    icon: Briefcase,
  },
  {
    id: "mbkm",
    title: "MBKM / Program di Luar Prodi",
    description: "Evaluasi program MBKM atau belajar di luar prodi.",
    icon: Compass,
  },
  {
    id: "advanced_course",
    title: "Mata Kuliah Tingkat Atas",
    description: "Ambil mata kuliah tingkat atas lebih awal dari jadwal normal.",
    icon: TrendingUp,
  },
  {
    id: "exchange",
    title: "Pertukaran Mahasiswa",
    description: "Ikuti program pertukaran mahasiswa ke kampus lain.",
    icon: Globe,
  },
  {
    id: "cuti",
    title: "Cuti Akademik",
    description: "Rencanakan cuti akademik dan dampaknya terhadap kelulusan.",
    icon: CalendarClock,
  },
  {
    id: "custom",
    title: "Rencana Kustom dengan AI",
    badge: "AI Interaktif",
    description: "Susun rencana studi sendiri bersama AI melalui tanya jawab bebas dan rekomendasi alternatif.",
    icon: Sparkles,
  },
];

export default function SimulatorPage() {
  const { token } = useSession();
  const [step, setStep] = useState<"select" | "configure" | "result" | "custom">("select");
  const [selectedType, setSelectedType] = useState<ScenarioType | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType | "custom" | null>(null);
  const [customSelected, setCustomSelected] = useState(false);
  const [params, setParams] = useState<Record<string, string | number | boolean>>({});
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Mengkalkulasi SKS...");
  const [error, setError] = useState<string | null>(null);
  const [pastSimulations, setPastSimulations] = useState<Array<{ id: string; title: string; scenarioType: string; status: string; createdAt: string }>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [applyConfirm, setApplyConfirm] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  // AI Alternatives & Chat for Jalur 1 (Standard Scenarios)
  const [stdAlternatives, setStdAlternatives] = useState<Array<{ title: string; description: string; tradeoff?: string; suggestedAction?: string }>>([]);
  const [stdAltLoading, setStdAltLoading] = useState(false);
  const [stdChatMessages, setStdChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string; isLoading?: boolean }>>([]);
  const [stdChatInput, setStdChatInput] = useState("");
  const [stdChatLoading, setStdChatLoading] = useState(false);

  const loadStandardAlternatives = async (simId: string) => {
    if (!token || !simId || stdAltLoading) return;
    setStdAltLoading(true);
    try {
      const res = await fetch(`/api/simulator/${simId}/alternatives`, {
        headers: { "x-demo-token": token },
      });
      const data = await res.json() as { alternatives?: typeof stdAlternatives };
      if (res.ok && data.alternatives) {
        setStdAlternatives(data.alternatives);
      }
    } catch {
      // ignore
    } finally {
      setStdAltLoading(false);
    }
  };

  const handleSendStdChat = async (overrideMessage?: string) => {
    const msg = (overrideMessage ?? stdChatInput).trim();
    if (!token || !result?.simulation?.id || !msg || stdChatLoading) return;
    if (!overrideMessage) setStdChatInput("");

    const nextHistory = [...stdChatMessages, { role: "user" as const, content: msg }];
    setStdChatMessages([...nextHistory, { role: "assistant" as const, content: "", isLoading: true }]);
    setStdChatLoading(true);

    try {
      const res = await fetch(`/api/simulator/${result.simulation.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({
          message: msg,
          chatHistory: nextHistory.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json() as { reply?: string };
      setStdChatMessages([
        ...nextHistory,
        { role: "assistant", content: data.reply || "Maaf, tidak dapat memproses pertanyaan saat ini." },
      ]);
    } catch {
      setStdChatMessages([
        ...nextHistory,
        { role: "assistant", content: "Terjadi gangguan jaringan. Silakan coba lagi." },
      ]);
    } finally {
      setStdChatLoading(false);
    }
  };

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
        setSelectedScenario(scenario);
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
    setLoadingStatus("Mengkalkulasi SKS & semester...");
    setError(null);

    const timer1 = setTimeout(() => setLoadingStatus("STARA AI menganalisis risiko & dampak..."), 1200);
    const timer2 = setTimeout(() => setLoadingStatus("Menyusun rekomendasi langkah akademis..."), 2800);

    try {
      const payload = {
        type: selectedType,
        startSemester: params.startSemester ?? 6,
        durationSemesters: params.durationSemesters ?? 1,
        creditsToConvert: params.creditsToConvert ?? undefined,
        conversionStatus: params.conversionStatus ?? "belum_diketahui",
        conflictsWithRegular: params.conflictsWithRegular ?? false,
        title: `Simulasi ${SCENARIO_TYPES[selectedType]}`,
      };
      const res = await fetch("/api/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify(payload),
      });
      clearTimeout(timer1);
      clearTimeout(timer2);
      const data = await res.json() as SimulationResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Gagal menjalankan simulasi.");
      setResult(data);
      setStep("result");
      setStdChatMessages([
        {
          role: "assistant",
          content: `Halo! Saya sudah menganalisis skenario **${data.simulation.title}**. ${data.explanation?.summary || ""}\n\nSilakan tanyakan strategi konversi SKS, pembagian beban kuliah, atau hal yang perlu dikonfirmasi ke dosen wali di bawah ini!`,
        },
      ]);
      if (data.simulation?.id) {
        loadStandardAlternatives(data.simulation.id);
      }
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
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Gagal menerapkan skenario.");
      setApplySuccess(true);
      setApplyConfirm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menerapkan.");
    }
    setApplyLoading(false);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
            Simulasi Skenario
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Evaluasi dampak keputusan akademik sebelum diterapkan — dianalisis oleh AI.
          </p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setShowHistory(!showHistory)}
          aria-expanded={showHistory}
        >
          <History size={14} />
          Riwayat Simulasi
        </button>
      </div>

      {/* Past Simulations */}
      {showHistory && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
            Riwayat Simulasi
          </h2>
          {pastSimulations.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Belum ada simulasi tersimpan.</p>
          ) : (
            pastSimulations.map((sim) => (
              <div key={sim.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{sim.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(sim.createdAt).toLocaleDateString("id-ID")}</div>
                </div>
                <span className={`badge ${sim.status === "applied" ? "badge-lime" : "badge-gray"}`}>
                  {sim.status === "applied" ? "Diterapkan" : "Tersimpan"}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Step: Select Scenario */}
      {step === "select" && (
        <div>
          <div className="assumption-notice" style={{ marginBottom: 20 }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Simulasi hanya mencoba &quot;bagaimana jika&quot;. Roadmapmu <strong>tidak berubah</strong> sampai kamu menekan Terapkan. Hasilnya estimasi, bukan keputusan resmi kampus.
            </span>
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
            Pilih Skenario Akademik
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 16px" }}>
            Pilih salah satu skenario perkuliahan yang ingin kamu evaluasi, atau susun rencana kustom bebas bersama STARA AI.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {ALL_SCENARIOS.map((item) => {
              const isSelected = selectedScenario === item.id;
              const IconComp = item.icon;

              return (
                <div
                  key={item.id}
                  className={`scenario-card ${isSelected ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedScenario(item.id);
                    if (item.id === "custom") {
                      setSelectedType(null);
                      setCustomSelected(true);
                    } else {
                      setSelectedType(item.id);
                      setCustomSelected(false);
                    }
                  }}
                  onDoubleClick={() => {
                    setSelectedScenario(item.id);
                    if (item.id === "custom") {
                      setSelectedType(null);
                      setCustomSelected(true);
                      setStep("custom");
                    } else {
                      setSelectedType(item.id);
                      setCustomSelected(false);
                      setStep("configure");
                    }
                  }}
                  role="radio"
                  tabIndex={0}
                  aria-checked={isSelected}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setSelectedScenario(item.id);
                      if (item.id === "custom") {
                        setSelectedType(null);
                        setCustomSelected(true);
                        setStep("custom");
                      } else {
                        setSelectedType(item.id);
                        setCustomSelected(false);
                        setStep("configure");
                      }
                    }
                  }}
                  style={{
                    background: isSelected ? "#FFFDF9" : "#FFFFFF",
                    border: isSelected ? "2px solid #D97706" : "1px solid #E2E8F0",
                    borderRadius: 14,
                    padding: "18px 20px",
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                    boxShadow: isSelected
                      ? "0 6px 20px rgba(217, 119, 6, 0.12)"
                      : "0 1px 3px rgba(0, 0, 0, 0.02)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: 144,
                    position: "relative",
                  }}
                >
                  <div>
                    {/* Top: Minimalist Icon Box + Check/Radio Indicator */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: isSelected ? "#FEF3C7" : "#F8FAFC",
                          border: isSelected ? "1px solid #FCD34D" : "1px solid #E2E8F0",
                          transition: "all 0.18s ease",
                        }}
                      >
                        <IconComp
                          size={19}
                          color={isSelected ? "#B45309" : "#475569"}
                          strokeWidth={isSelected ? 2.3 : 2}
                        />
                      </div>

                      {isSelected ? (
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: "#D97706",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 6px rgba(217, 119, 6, 0.3)",
                          }}
                        >
                          <Check size={12} color="#FFFFFF" strokeWidth={3} />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            border: "1.5px solid #CBD5E1",
                            background: "#FFFFFF",
                          }}
                        />
                      )}
                    </div>

                    {/* Title & Optional AI Badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: 14.5,
                          fontWeight: 700,
                          color: isSelected ? "#92400E" : "var(--text-primary)",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {item.title}
                      </span>
                      {item.badge && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "1.5px 7px",
                            borderRadius: 6,
                            background: isSelected ? "rgba(217, 119, 6, 0.2)" : "rgba(217, 119, 6, 0.1)",
                            color: "#B45309",
                            border: "1px solid rgba(217, 119, 6, 0.25)",
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p
                      style={{
                        fontSize: 12.5,
                        color: "var(--text-secondary)",
                        lineHeight: 1.45,
                        margin: 0,
                      }}
                    >
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unified Bottom Action */}
          <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 14 }}>
            <button
              className="btn btn-primary"
              disabled={!selectedScenario}
              onClick={() => {
                if (selectedScenario === "custom") {
                  setStep("custom");
                } else if (selectedScenario) {
                  setSelectedType(selectedScenario);
                  setStep("configure");
                }
              }}
              style={{
                padding: "9px 22px",
                fontSize: 13,
                fontWeight: 700,
                gap: 7,
                borderRadius: 9,
                background: selectedScenario ? "#D97706" : "#E2E8F0",
                borderColor: selectedScenario ? "#B45309" : "#CBD5E1",
                color: selectedScenario ? "#FFFFFF" : "#94A3B8",
                boxShadow: selectedScenario ? "0 4px 12px rgba(217, 119, 6, 0.28)" : "none",
                cursor: selectedScenario ? "pointer" : "not-allowed",
                transition: "all 0.18s ease",
              }}
            >
              <span>{selectedScenario === "custom" ? "Mulai Rencana AI" : "Lanjutkan"}</span>
              <ArrowRight size={15} />
            </button>
            {!selectedScenario && (
              <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                Pilih salah satu skenario untuk melanjutkan
              </span>
            )}
          </div>
        </div>
      )}

      {/* Step: Rencana Kustom dengan AI */}
      {step === "custom" && (
        <CustomAIPlan token={token} onBack={() => setStep("select")} />
      )}

      {/* Step: Configure Parameters */}
      {step === "configure" && selectedType && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setStep("select")}>← Kembali</button>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
              Konfigurasi: {SCENARIO_TYPES[selectedType]}
            </h2>
          </div>

          <div className="card" style={{ maxWidth: 560, marginBottom: 20 }}>
            <ScenarioForm type={selectedType} params={params} onChange={setParams} />
          </div>

          {error && (
            <div className="error-state" style={{ marginBottom: 16 }}>
              <AlertCircle size={20} color="var(--coral)" />
              <span style={{ fontSize: 14 }}>{error}</span>
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={runSimulation}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
                <span>{loadingStatus}</span>
              </>
            ) : (
              <>
                <Play size={16} />
                Jalankan Simulasi
              </>
            )}
          </button>
        </div>
      )}

      {/* Step: Result */}
      {step === "result" && result && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setStep("select"); setResult(null); setApplySuccess(false); }}>
              ← Simulasi Baru
            </button>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
              Hasil Simulasi: {result.simulation.title}
            </h2>
          </div>

          {/* AI Notice */}
          {result.explanation && (
            <div className="assumption-notice" style={{ marginBottom: 20, background: result.explanation.isAiGenerated ? "rgba(124, 230, 168, 0.08)" : undefined, borderColor: result.explanation.isAiGenerated ? "rgba(124, 230, 168, 0.3)" : undefined }}>
              {result.explanation.isAiGenerated ? <Sparkles size={16} style={{ flexShrink: 0, color: "var(--lime)" }} /> : <AlertCircle size={16} style={{ flexShrink: 0 }} />}
              <span style={{ fontSize: 13, color: result.explanation.isAiGenerated ? "var(--lime)" : undefined }}>
                {result.explanation.isAiGenerated
                  ? "✨ Analisis mendalam ini dipersonalisasi oleh STARA AI (Google Gemini)."
                  : (result.explanation.fallbackReason ?? "Penjelasan otomatis berbasis aturan.")}
              </span>
            </div>
          )}

          {/* Plain-language verdict */}
          {(() => {
            const delta = result.diff.semesterDelta ?? 0;
            const sksDiff = result.scenario.remainingCredits - result.baseline.remainingCredits;
            const riskCount =
              (result.explanation?.risks?.length ?? 0) + (result.diff?.additionalConflicts?.length ?? 0);
            const tone = delta > 0 ? "var(--coral)" : delta < 0 ? "#16A34A" : "var(--amber-deep)";
            const headline =
              delta > 0
                ? `Kamu akan lulus mundur ${delta} semester`
                : delta < 0
                ? `Kamu bisa lulus ${Math.abs(delta)} semester lebih cepat`
                : "Jadwal lulusmu tidak berubah";
            const sksLine =
              sksDiff === 0
                ? "Sisa SKS sama seperti rencana sekarang."
                : sksDiff > 0
                ? `Sisa SKS bertambah ${sksDiff} dibanding rencana sekarang.`
                : `Sisa SKS berkurang ${Math.abs(sksDiff)} dibanding rencana sekarang.`;
            return (
              <div
                className="card"
                style={{ marginBottom: 20, borderLeft: `4px solid ${tone}` }}
                id="simulation-verdict"
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                  Kesimpulan singkat
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: tone, marginBottom: 6 }}>{headline}</div>
                <div style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {sksLine}{" "}
                  {riskCount > 0
                    ? `Ada ${riskCount} hal yang perlu kamu waspadai (lihat di bawah).`
                    : "Tidak ada risiko besar yang terdeteksi."}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                  Cara membaca: kartu kiri adalah rencanamu sekarang, kartu kanan adalah hasilnya jika skenario ini dijalankan.
                  Suka dengan hasilnya? Klik &quot;Terapkan ke Roadmap Saya&quot; di bagian bawah.
                </div>
              </div>
            );
          })()}

          {/* Comparison */}
          <div className="comparison-grid" style={{ marginBottom: 20 }}>
            <div className="comparison-panel baseline">
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Rencana Sekarang
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
                {result.baseline.estimatedGraduationSemester
                  ? `Semester ${result.baseline.estimatedGraduationSemester}`
                  : "Belum ada data"}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>Estimasi kelulusan</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                Sisa SKS: <strong style={{ color: "var(--text-primary)" }}>{result.baseline.remainingCredits}</strong>
              </div>
            </div>
            <div className="comparison-panel scenario">
              <div style={{ fontWeight: 700, fontSize: 14, color: "#D97706", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Jika Kamu Memilih: {selectedType && SCENARIO_TYPES[selectedType]}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
                {result.scenario.estimatedGraduationSemester
                  ? `Semester ${result.scenario.estimatedGraduationSemester}`
                  : "Belum ada data"}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
                Estimasi kelulusan
                {result.diff.semesterDelta !== null && result.diff.semesterDelta !== 0 && (
                  <span style={{ marginLeft: 8, color: result.diff.semesterDelta > 0 ? "var(--coral)" : "var(--lime)", fontWeight: 700 }}>
                    {result.diff.semesterDelta > 0 ? `+${result.diff.semesterDelta} semester` : `${result.diff.semesterDelta} semester`}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                Sisa SKS: <strong style={{ color: "var(--text-primary)" }}>{result.scenario.remainingCredits}</strong>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
              Ringkasan Analisis AI
            </h3>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
              {result.explanation?.summary}
            </p>

            {result.explanation?.benefits?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--lime)", marginBottom: 6, textTransform: "uppercase" }}>Keuntungan</div>
                {result.explanation.benefits.map((b, i) => (
                  <div key={i} style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", gap: 6, marginBottom: 4 }}>
                    <CheckCircle2 size={14} color="var(--lime)" style={{ flexShrink: 0, marginTop: 2 }} />
                    {b}
                  </div>
                ))}
              </div>
            )}

            {result.explanation?.risks?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--coral)", marginBottom: 6, textTransform: "uppercase" }}>Yang Perlu Diwaspadai</div>
                {result.explanation.risks.map((r, i) => (
                  <div key={i} style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", gap: 6, marginBottom: 4 }}>
                    <AlertCircle size={14} color="var(--coral)" style={{ flexShrink: 0, marginTop: 2 }} />
                    {r}
                  </div>
                ))}
                {result.explanation?.tradeoffs?.map((t, i) => (
                  <div key={`t-${i}`} style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", gap: 6, marginBottom: 4 }}>
                    <AlertCircle size={14} color="var(--orange)" style={{ flexShrink: 0, marginTop: 2 }} />
                    {t}
                  </div>
                ))}
              </div>
            )}

            {result.diff?.unknowns && result.diff.unknowns.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--orange)", marginBottom: 6, textTransform: "uppercase" }}>Yang Perlu Dikonfirmasi</div>
                {result.diff.unknowns.map((u, i) => (
                  <div key={i} style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", gap: 6, marginBottom: 4 }}>
                    <AlertCircle size={14} color="var(--orange)" style={{ flexShrink: 0, marginTop: 2 }} />
                    {u}
                  </div>
                ))}
              </div>
            )}

            {result.explanation?.questionsForCampus?.length > 0 && (
              <div className="info-box" style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Pertanyaan untuk Kampus / Dosen Wali:</div>
                {result.explanation.questionsForCampus.map((q, i) => (
                  <div key={i} style={{ fontSize: 13, marginBottom: 4 }}>• {q}</div>
                ))}
              </div>
            )}

            {result.explanation?.recommendedNextSteps?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>Langkah Selanjutnya</div>
                {result.explanation.recommendedNextSteps.map((s, i) => (
                  <div key={i} style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", gap: 6, marginBottom: 4 }}>
                    <span style={{ color: "var(--text-muted)" }}>{i + 1}.</span>
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rekomendasi Alternatif AI */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Lightbulb size={16} color="var(--lime)" />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  Rekomendasi Strategi & Alternatif AI
                </h3>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => result.simulation?.id && loadStandardAlternatives(result.simulation.id)}
                disabled={stdAltLoading}
                style={{ fontSize: 11.5, gap: 5 }}
              >
                <RefreshCw size={12} style={{ animation: stdAltLoading ? "spin 1s linear infinite" : undefined }} />
                {stdAltLoading ? "Memuat..." : "Cari Opsi Lain (AI)"}
              </button>
            </div>
            {stdAlternatives.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {stdAltLoading ? "STARA AI sedang menyusun skenario alternatif..." : "Klik Cari Opsi Lain untuk memuat strategi alternatif."}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
                {stdAlternatives.slice(0, 3).map((alt, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "var(--surface-hover)",
                      borderRadius: 8,
                      padding: "12px 14px",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--text-primary)", marginBottom: 4 }}>
                        {alt.title}
                      </div>
                      <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                        {alt.description}
                      </p>
                      {(alt.suggestedAction || alt.tradeoff) && (
                        <div style={{ fontSize: 12, color: "var(--lime)", marginTop: 8, fontWeight: 600 }}>
                          → {alt.suggestedAction || alt.tradeoff}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleSendStdChat(`Bagaimana langkah menerapkan opsi "${alt.title}" untuk kondisi saya?`)}
                      disabled={stdChatLoading}
                      style={{ alignSelf: "flex-start", fontSize: 11.5, padding: "4px 8px", gap: 5, color: "var(--teal)" }}
                    >
                      <MessageSquare size={12} />
                      Diskusikan Opsi Ini di Chat AI
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tanya STARA AI */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <MessageSquare size={16} color="var(--lime)" />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  Tanya STARA AI — Konsultasi Skenario Ini
                </h3>
              </div>
              <span className="badge badge-lime" style={{ fontSize: 10.5 }}>
                <Sparkles size={11} /> Konteks Skenario Aktif
              </span>
            </div>

            <div
              style={{
                background: "var(--surface-hover)",
                borderRadius: 10,
                padding: 14,
                minHeight: 180,
                maxHeight: 380,
                overflowY: "auto",
                marginBottom: 12,
                border: "1px solid var(--border-subtle)",
              }}
            >
              {stdChatMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    marginBottom: 12,
                    flexDirection: msg.role === "user" ? "row-reverse" : "row",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: msg.role === "user" ? "var(--lime)" : "var(--surface-card)",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {msg.role === "user" ? <User size={13} color="var(--bg-primary)" /> : <Bot size={14} color="var(--lime)" />}
                  </div>
                  <div
                    style={{
                      background: msg.role === "user" ? "rgba(124, 230, 168, 0.14)" : "var(--surface-card)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: msg.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                      padding: "10px 14px",
                      fontSize: 13,
                      color: "var(--text-primary)",
                      lineHeight: 1.6,
                      maxWidth: "84%",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {msg.isLoading ? "STARA AI sedang menyusun jawaban lengkap..." : msg.content}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {[
                "Bagaimana cara agar skenario ini tidak menunda kelulusan saya?",
                "Apa saja syarat konversi SKS yang harus saya tanyakan ke Kaprodi?",
                "Bagaimana mengatur mata kuliah wajib di semester terdampak?",
              ].map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendStdChat(q)}
                  disabled={stdChatLoading}
                  style={{
                    fontSize: 11.5,
                    padding: "5px 11px",
                    borderRadius: 14,
                    background: "var(--surface-card)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: 1, fontSize: 13 }}
                placeholder="Tanyakan hal spesifik tentang hasil simulasi skenario ini..."
                value={stdChatInput}
                onChange={(e) => setStdChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendStdChat()}
                disabled={stdChatLoading}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleSendStdChat()}
                disabled={!stdChatInput.trim() || stdChatLoading}
                style={{ gap: 5 }}
              >
                <Send size={13} />
                Kirim
              </button>
            </div>
          </div>

          {/* Apply Section */}
          {!applySuccess && (
            <div className="card">
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                Terapkan Skenario ke Roadmap
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
                Menerapkan skenario akan membuat versi roadmap baru. Versi sebelumnya tetap tersimpan di riwayat.
              </p>
              {!applyConfirm ? (
                <button className="btn btn-primary" onClick={() => setApplyConfirm(true)}>
                  <Zap size={16} />
                  Terapkan ke Roadmap Saya
                </button>
              ) : (
                <div className="warning-box" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ fontWeight: 700 }}>⚠ Konfirmasi Penerapan Skenario</div>
                  <p style={{ fontSize: 13 }}>
                    Versi roadmap baru akan dibuat berdasarkan skenario ini. Roadmap lama tetap tersimpan.
                    Apakah kamu yakin?
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={applyScenario} disabled={applyLoading}>
                      {applyLoading ? "Memproses..." : "Ya, Terapkan"}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setApplyConfirm(false)}>
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {applySuccess && (
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle2 size={24} color="var(--lime)" />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                    Skenario Berhasil Diterapkan!
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    Roadmap telah diperbarui. Versi lama tersimpan di riwayat.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const CUSTOM_PLAN_DESC = "Susun rencana studi sendiri bersama AI — tanya jawab bebas dan rekomendasi alternatif.";

const scenarioDescriptions: Record<ScenarioType, string> = {
  magang: "Simulasikan dampak magang terhadap jadwal kuliah dan SKS.",
  mbkm: "Evaluasi program MBKM atau belajar di luar prodi.",
  advanced_course: "Ambil mata kuliah tingkat atas lebih awal dari jadwal normal.",
  exchange: "Ikuti program pertukaran mahasiswa ke kampus lain.",
  cuti: "Rencanakan cuti akademik dan dampaknya terhadap kelulusan.",
};

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="form-group">
        <label className="form-label" htmlFor="startSemester">Semester Mulai</label>
        <select
          id="startSemester"
          className="form-input"
          value={String(params.startSemester ?? 6)}
          onChange={(e) => update("startSemester", parseInt(e.target.value))}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="durationSemesters">Durasi (Semester)</label>
        <select
          id="durationSemesters"
          className="form-input"
          value={String(params.durationSemesters ?? 1)}
          onChange={(e) => update("durationSemesters", parseInt(e.target.value))}
        >
          {[1, 2, 3, 4].map((d) => (
            <option key={d} value={d}>{d} semester</option>
          ))}
        </select>
      </div>

      {(type === "magang" || type === "mbkm" || type === "exchange") && (
        <>
          <div className="form-group">
            <label className="form-label" htmlFor="creditsToConvert">SKS yang Diklaim Dikonversi (opsional)</label>
            <input
              id="creditsToConvert"
              type="number"
              className="form-input"
              min={0}
              max={40}
              value={String(params.creditsToConvert ?? "")}
              onChange={(e) => update("creditsToConvert", parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="conversionStatus">Status Konversi SKS</label>
            <select
              id="conversionStatus"
              className="form-input"
              value={String(params.conversionStatus ?? "belum_diketahui")}
              onChange={(e) => update("conversionStatus", e.target.value)}
            >
              <option value="dikonfirmasi">Sudah dikonfirmasi prodi</option>
              <option value="belum_diketahui">Belum dikonfirmasi</option>
              <option value="tidak_ada">Tidak ada konversi</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={Boolean(params.conflictsWithRegular)}
                onChange={(e) => update("conflictsWithRegular", e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "var(--lime)" }}
              />
              <span className="form-label" style={{ margin: 0 }}>
                Berbenturan dengan kuliah reguler
              </span>
            </label>
          </div>
        </>
      )}

      <div className="assumption-notice">
        <AlertCircle size={14} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 12 }}>
          Hasil simulasi adalah estimasi berdasarkan data yang tersedia. Konfirmasi ke kampus sebelum mengambil keputusan.
        </span>
      </div>
    </div>
  );
}
