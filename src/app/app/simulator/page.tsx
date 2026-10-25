"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/features/session/context";
import { SCENARIO_TYPES } from "@/lib/constants";
import CustomAIPlan from "./CustomAIPlan";
import {
  Zap, AlertCircle, CheckCircle2, History, Play, ArrowRight, Sparkles, RefreshCw
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

export default function SimulatorPage() {
  const { token } = useSession();
  const [step, setStep] = useState<"select" | "configure" | "result" | "custom">("select");
  const [selectedType, setSelectedType] = useState<ScenarioType | null>(null);
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
              Simulasi menggunakan data roadmapmu. Hasil adalah estimasi berdasarkan data yang tersedia—bukan keputusan resmi kampus.
            </span>
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
            Pilih Jenis Skenario
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
            {(Object.entries(SCENARIO_TYPES) as [ScenarioType, string][]).map(([type, label]) => (
              <div
                key={type}
                className={`scenario-card ${selectedType === type ? "selected" : ""}`}
                onClick={() => { setSelectedType(type); setCustomSelected(false); }}
                role="radio"
                tabIndex={0}
                aria-checked={selectedType === type}
                onKeyDown={(e) => e.key === "Enter" && (setSelectedType(type), setCustomSelected(false))}
              >
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 4 }}>
                  {label}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {scenarioDescriptions[type]}
                </div>
              </div>
            ))}
            <div
              className={`scenario-card ${customSelected ? "selected" : ""}`}
              onClick={() => { setCustomSelected(true); setSelectedType(null); setStep("custom"); }}
              role="radio"
              tabIndex={0}
              aria-checked={customSelected}
              id="scenario-card-custom-ai"
              onKeyDown={(e) => e.key === "Enter" && (setCustomSelected(true), setSelectedType(null), setStep("custom"))}
            >
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={14} color="var(--lime)" />
                {CUSTOM_PLAN_TITLE}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {CUSTOM_PLAN_DESC}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <button
              className="btn btn-primary"
              disabled={!selectedType && !customSelected}
              onClick={() => setStep(customSelected ? "custom" : "configure")}
            >
              Lanjutkan
              <ArrowRight size={16} />
            </button>
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

          {/* Comparison */}
          <div className="comparison-grid" style={{ marginBottom: 20 }}>
            <div className="comparison-panel baseline">
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Roadmap Saat Ini (Baseline)
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
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--lime)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Skenario: {selectedType && SCENARIO_TYPES[selectedType]}
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
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--lime)", marginBottom: 6, textTransform: "uppercase" }}>Manfaat</div>
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
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--coral)", marginBottom: 6, textTransform: "uppercase" }}>Risiko & Trade-off</div>
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
