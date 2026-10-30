"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sparkles, MessageSquare, Send, Bot, User, Lightbulb, RefreshCw,
  AlertCircle, ChevronRight, Copy, Check, ArrowRight,
  Clock, Calendar, ShieldAlert, Edit3, CheckCircle2, BookmarkPlus
} from "lucide-react";

interface FormField {
  id: string;
  label: string;
  type: "text" | "select" | "number" | "textarea";
  defaultValue: string;
  options?: string[];
  helperText?: string;
  required?: boolean;
}

interface GeneratedForm {
  categoryBadge: string;
  detectedGoal: string;
  briefExplanation: string;
  fields: FormField[];
  isAiGenerated: boolean;
}

interface AlternativeOption {
  title: string;
  description: string;
  benefit?: string;
}

interface SimulationResult {
  overallVerdict: "aman" | "perlu_perhatian" | "berisiko_tinggi";
  verdictTitle: string;
  academicImpactSummary: string;
  estimatedHoursPerWeek: string;
  impactOnGraduation: string;
  keyRisks: string[];
  mitigationStrategies?: string[];
  actionSteps?: {
    phase: string;
    steps: string[];
  }[];
  suggestedAlternatives: AlternativeOption[];
  questionsForAcademicAdvisor?: string[];
  simulationId?: string;
  isAiGenerated: boolean;
}

function renderFormattedText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <div
        key={lineIdx}
        style={{
          marginBottom: line.trim() === "" ? 6 : 3,
          paddingLeft: /^(\d+\.|•|-|\*)\s/.test(line.trim()) ? 6 : 0,
        }}
      >
        {parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={pIdx} style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={pIdx}>{part}</span>;
        })}
      </div>
    );
  });
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
}

const QUICK_PROMPTS = [
  {
    label: "Lomba Data Analyst",
    fullText: "Saya ingin mengikuti lomba data analyst tingkat nasional semester depan sambil tetap kuliah.",
  },
  {
    label: "Pengabdian Masyarakat Liburan",
    fullText: "Saya ingin ikut pengabdian masyarakat selama liburan.",
  },
  {
    label: "Magang Part-time",
    fullText: "Saya ingin magang part-time di startup teknologi semester 6 sambil ambil 12 SKS.",
  },
];

export default function CustomAIPlan({
  token,
  onBack,
}: {
  token: string | null;
  onBack: () => void;
}) {
  // Step State: "input" -> "form" -> "result"
  const [step, setStep] = useState<"input" | "form" | "result">("input");

  // User free text input
  const [userPrompt, setUserPrompt] = useState(
    "Saya ingin mengikuti lomba data analyst tingkat nasional semester depan sambil tetap kuliah."
  );

  // Form Generation State
  const [formGenerating, setFormGenerating] = useState(false);
  const [generatedForm, setGeneratedForm] = useState<GeneratedForm | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Simulation State
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  // Apply to Roadmap State
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Alternatives State & Refresh
  const [alternativesList, setAlternativesList] = useState<AlternativeOption[]>([]);
  const [refreshingAlt, setRefreshingAlt] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step === "result") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, step]);

  // Step 1 -> Step 2: Generate Form based on user prompt
  const handleGenerateForm = async (overridePrompt?: string) => {
    const promptToUse = (overridePrompt ?? userPrompt).trim();
    if (!token || !promptToUse || formGenerating) return;

    setFormGenerating(true);
    setFormError(null);

    try {
      const res = await fetch("/api/simulator/custom/generate-form", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({ userPrompt: promptToUse }),
      });

      const data = (await res.json()) as GeneratedForm & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Gagal menyusun formulir.");

      setGeneratedForm(data);

      const initialValues: Record<string, string> = {};
      data.fields.forEach((f) => {
        initialValues[f.id] = f.defaultValue || "";
      });
      setFormValues(initialValues);
      setStep("form");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setFormGenerating(false);
    }
  };

  // Step 2 -> Step 3: Run Simulation with filled dynamic form values
  const handleSimulate = async () => {
    if (!token || !generatedForm || simulating) return;

    setSimulating(true);
    setSimulationError(null);
    setApplied(false);
    setApplyError(null);

    try {
      const res = await fetch("/api/simulator/custom/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({
          userPrompt,
          categoryBadge: generatedForm.categoryBadge,
          detectedGoal: generatedForm.detectedGoal,
          formData: formValues,
        }),
      });

      const data = (await res.json()) as SimulationResult & { error?: string; simulationId?: string };
      if (!res.ok) throw new Error(data.error ?? "Gagal menjalankan simulasi.");

      setSimulationResult(data);
      if (data.simulationId) {
        setSimulationId(data.simulationId);
      }
      if (data.suggestedAlternatives && data.suggestedAlternatives.length > 0) {
        setAlternativesList(data.suggestedAlternatives);
      }
      setStep("result");

      if (chatMessages.length === 0) {
        setChatMessages([
          {
            role: "assistant",
            content: `Halo! Saya sudah menganalisis rencanamu: **"${generatedForm.detectedGoal}"** (${generatedForm.categoryBadge}). Status evaluasi: **${data.verdictTitle}**.\n\nKamu bisa bertanya lebih lanjut tentang manajemen jadwal atau rekomendasi penyesuaian di sini.`,
          },
        ]);
      }
    } catch (err) {
      setSimulationError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSimulating(false);
    }
  };

  // Apply custom simulation to active roadmap
  const handleApplyToRoadmap = async () => {
    if (!token || !simulationId || applying) return;
    setApplying(true);
    setApplyError(null);

    try {
      const res = await fetch(`/api/simulator/${simulationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({ action: "apply" }),
      });

      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Gagal menerapkan rencana ke roadmap.");

      setApplied(true);
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "Terjadi kesalahan saat menerapkan ke roadmap.");
    } finally {
      setApplying(false);
    }
  };

  // Refresh AI Alternatives
  const handleRefreshAlternatives = async () => {
    if (!token || refreshingAlt) return;
    setRefreshingAlt(true);

    try {
      const res = await fetch(
        `/api/simulator/custom/alternatives?goal=${encodeURIComponent(userPrompt)}&t=${Date.now()}`,
        {
          headers: { "x-demo-token": token },
        }
      );

      const data = (await res.json()) as {
        alternatives?: {
          title: string;
          description: string;
          tradeoff?: string;
          suggestedAction?: string;
        }[];
        error?: string;
      };

      if (res.ok && data.alternatives && data.alternatives.length > 0) {
        setAlternativesList(
          data.alternatives.map((a) => ({
            title: a.title,
            description: a.description,
            benefit: a.suggestedAction || a.tradeoff || "Alternatif terstruktur dari STARA AI",
          }))
        );
      }
    } catch (err) {
      // handled silently
    } finally {
      setRefreshingAlt(false);
    }
  };

  // Chat in Result view
  const handleSendChat = async (overrideMessage?: string) => {
    const msg = (overrideMessage ?? chatInput).trim();
    if (!token || !msg || chatLoading) return;
    if (!overrideMessage) setChatInput("");

    const newHistory = [...chatMessages, { role: "user" as const, content: msg }];
    setChatMessages([...newHistory, { role: "assistant" as const, content: "", isLoading: true }]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/simulator/custom/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({
          message: msg,
          chatHistory: newHistory.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          planContext: generatedForm && simulationResult
            ? {
                userPrompt,
                categoryBadge: generatedForm.categoryBadge,
                detectedGoal: generatedForm.detectedGoal,
                formData: formValues,
                verdictTitle: simulationResult.verdictTitle,
                impactSummary: simulationResult.academicImpactSummary,
              }
            : undefined,
        }),
      });

      const data = (await res.json()) as { reply?: string; error?: string };
      setChatMessages([
        ...newHistory,
        { role: "assistant", content: data.reply || "Maaf, tidak dapat memproses jawaban saat ini." },
      ]);
    } catch {
      setChatMessages([...newHistory, { role: "assistant", content: "Terjadi gangguan jaringan. Silakan coba lagi." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const copyResultSummary = () => {
    if (!simulationResult || !generatedForm) return;
    const text = `[Rencana Kustom STARA AI]
Rencana: ${userPrompt}
Status: ${simulationResult.verdictTitle}
Beban Waktu: ${simulationResult.estimatedHoursPerWeek}
Dampak Kelulusan: ${simulationResult.impactOnGraduation}
Ringkasan: ${simulationResult.academicImpactSummary}`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div>
      {/* ── Top Bar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ gap: 6, fontSize: 13 }}>
          ← Kembali ke Pilih Skenario
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className={`badge ${step === "input" ? "badge-lime" : "badge-gray"}`} style={{ fontSize: 11 }}>
            1. Rencana
          </span>
          <ChevronRight size={12} color="var(--text-muted)" />
          <span className={`badge ${step === "form" ? "badge-lime" : "badge-gray"}`} style={{ fontSize: 11 }}>
            2. Parameter
          </span>
          <ChevronRight size={12} color="var(--text-muted)" />
          <span className={`badge ${step === "result" ? "badge-lime" : "badge-gray"}`} style={{ fontSize: 11 }}>
            3. Analisis & AI
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          STAGE 1: INPUT RENCANA BEBAS (Bersih, Ramping, & Lega)
      ══════════════════════════════════════════════════════ */}
      {step === "input" && (
        <div className="card" style={{ maxWidth: 680, margin: "0 auto", padding: "26px 30px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Sparkles size={18} color="var(--lime)" />
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.01em" }}>
              Rencana Kustom dengan AI
            </h2>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 18, lineHeight: 1.5 }}>
            Ceritakan rencanamu. STARA membantu menyusun dan menganalisisnya.
          </p>

          {/* Textarea Input */}
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 8,
              }}
            >
              Ceritakan kegiatan atau rencana yang ingin kamu lakukan
            </label>
            <textarea
              className="form-input"
              rows={4}
              style={{
                width: "100%",
                fontSize: 13.5,
                lineHeight: 1.6,
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                resize: "vertical",
              }}
              placeholder="Contoh: Saya ingin mengikuti lomba data analyst tingkat nasional semester depan sambil tetap kuliah."
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              disabled={formGenerating}
              maxLength={600}
            />
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 6 }}>
              Tidak perlu memilih kategori terlebih dahulu. Jelaskan saja tujuanmu dengan bahasa sendiri.
            </div>
          </div>

          {/* Compact Horizontal Quick Chips */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 6 }}>
              Contoh cepat:
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {QUICK_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setUserPrompt(p.fullText)}
                  disabled={formGenerating}
                  style={{
                    background: userPrompt === p.fullText ? "rgba(124, 230, 168, 0.12)" : "var(--surface-hover)",
                    border: `1px solid ${userPrompt === p.fullText ? "var(--lime)" : "var(--border-subtle)"}`,
                    borderRadius: 20,
                    padding: "5px 12px",
                    fontSize: 11.5,
                    color: userPrompt === p.fullText ? "var(--lime)" : "var(--text-secondary)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {formError && (
            <div
              style={{
                background: "rgba(255, 107, 107, 0.1)",
                border: "1px solid var(--coral)",
                borderRadius: 8,
                padding: "10px 14px",
                color: "var(--coral)",
                fontSize: 12.5,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AlertCircle size={15} />
              {formError}
            </div>
          )}

          {/* Primary Action Button */}
          <button
            className="btn btn-primary"
            onClick={() => handleGenerateForm()}
            disabled={!userPrompt.trim() || formGenerating}
            style={{
              width: "100%",
              padding: "12px 18px",
              fontSize: 14,
              fontWeight: 700,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
            }}
            id="btn-bantu-susun-rencana"
          >
            {formGenerating ? (
              <>
                <RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} />
                AI sedang menyusun formulir...
              </>
            ) : (
              <>
                <Sparkles size={15} />
                Bantu Susun Rencana
              </>
            )}
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STAGE 2: FORMULIR ADAPTIF (Ringkas & Proporsional)
      ══════════════════════════════════════════════════════ */}
      {step === "form" && generatedForm && (
        <div style={{ maxWidth: 740, margin: "0 auto" }}>
          {/* Header Recap */}
          <div
            className="card"
            style={{
              marginBottom: 16,
              padding: "14px 18px",
              background: "rgba(124, 230, 168, 0.04)",
              border: "1px solid rgba(124, 230, 168, 0.2)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 240 }}>
              <span className="badge badge-lime" style={{ fontSize: 10.5, marginBottom: 4 }}>
                {generatedForm.categoryBadge}
              </span>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Input: <strong style={{ color: "var(--text-primary)" }}>&ldquo;{userPrompt}&rdquo;</strong>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setStep("input")}
              style={{ fontSize: 11.5, gap: 4 }}
            >
              <Edit3 size={12} />
              Ubah Teks
            </button>
          </div>

          {/* Form Fields Card */}
          <div className="card" style={{ padding: "22px 26px" }}>
            <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 16px 0" }}>
              Parameter Rencana yang Terdeteksi
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {generatedForm.fields.map((field) => (
                <div key={field.id} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)" }}>
                    {field.label}
                  </label>

                  {field.type === "select" && field.options && field.options.length > 0 ? (
                    <select
                      className="form-input"
                      style={{ fontSize: 13, padding: "8px 12px", width: "100%" }}
                      value={formValues[field.id] ?? field.defaultValue}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                      }
                    >
                      {field.options.map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      className="form-input"
                      rows={2}
                      style={{ fontSize: 13, padding: "8px 12px", width: "100%" }}
                      value={formValues[field.id] ?? field.defaultValue}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                      }
                    />
                  ) : (
                    <input
                      type={field.type === "number" ? "number" : "text"}
                      className="form-input"
                      style={{ fontSize: 13, padding: "8px 12px", width: "100%" }}
                      value={formValues[field.id] ?? field.defaultValue}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                      }
                      placeholder={field.defaultValue}
                    />
                  )}

                  {field.helperText && (
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {field.helperText}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {simulationError && (
              <div
                style={{
                  background: "rgba(255, 107, 107, 0.1)",
                  border: "1px solid var(--coral)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  color: "var(--coral)",
                  fontSize: 12.5,
                  marginTop: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertCircle size={15} />
                {simulationError}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button
                className="btn btn-primary"
                onClick={handleSimulate}
                disabled={simulating}
                style={{
                  flex: 1,
                  padding: "12px 18px",
                  fontSize: 13.5,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
                id="btn-simulasikan-rencana-kustom"
              >
                {simulating ? (
                  <>
                    <RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} />
                    Menganalisis simulasi...
                  </>
                ) : (
                  <>
                    <ArrowRight size={15} />
                    Simulasikan Rencana Ini
                  </>
                )}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setStep("input")}
                disabled={simulating}
                style={{ fontSize: 13 }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STAGE 3: HASIL SIMULASI (Rapi, Terstruktur, Bisa Terapkan ke Roadmap)
      ══════════════════════════════════════════════════════ */}
      {step === "result" && simulationResult && generatedForm && (
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          {/* Applied Success Banner */}
          {applied && (
            <div
              style={{
                background: "rgba(124, 230, 168, 0.08)",
                border: "1px solid var(--lime)",
                borderRadius: "var(--radius-md)",
                padding: "14px 18px",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle2 size={20} color="var(--lime)" />
                <div>
                  <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 13.5 }}>
                    Rencana Berhasil Diterapkan ke Roadmap!
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    Kegiatan ini telah ditambahkan ke rencana semester pada roadmap aktifmu.
                  </div>
                </div>
              </div>
              <a
                href="/app/roadmap"
                className="btn btn-sm btn-primary"
                style={{ fontSize: 12, gap: 6, textDecoration: "none" }}
              >
                Lihat di Roadmap Saya →
              </a>
            </div>
          )}

          {applyError && (
            <div
              style={{
                background: "rgba(255, 107, 107, 0.1)",
                border: "1px solid var(--coral)",
                borderRadius: 8,
                padding: "10px 14px",
                color: "var(--coral)",
                fontSize: 12.5,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AlertCircle size={15} />
              {applyError}
            </div>
          )}

          {/* 1. Ringkasan Status & Evaluasi (Tertata Rapi) */}
          <div
            className="card"
            style={{
              marginBottom: 16,
              borderLeft: `4px solid ${
                simulationResult.overallVerdict === "aman"
                  ? "var(--lime)"
                  : simulationResult.overallVerdict === "perlu_perhatian"
                  ? "var(--orange)"
                  : "var(--coral)"
              }`,
              padding: "20px 24px",
            }}
          >
            {/* Header Status & Action Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 10,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span
                    className={`badge ${
                      simulationResult.overallVerdict === "aman"
                        ? "badge-lime"
                        : simulationResult.overallVerdict === "perlu_perhatian"
                        ? "badge-orange"
                        : "badge-coral"
                    }`}
                    style={{ fontSize: 10.5 }}
                  >
                    {simulationResult.overallVerdict === "aman"
                      ? "Aman / Realistis"
                      : simulationResult.overallVerdict === "perlu_perhatian"
                      ? "Perlu Penyesuaian"
                      : "Risiko Tinggi"}
                  </span>
                  <span className="badge badge-gray" style={{ fontSize: 10.5 }}>
                    {generatedForm.categoryBadge}
                  </span>
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                  {simulationResult.verdictTitle}
                </h2>
              </div>

              {/* Action Buttons: Terapkan ke Roadmap, Salin, Edit */}
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                {applied ? (
                  <span className="badge badge-lime" style={{ fontSize: 11, gap: 4, padding: "5px 10px" }}>
                    <Check size={12} /> Sudah di Roadmap
                  </span>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleApplyToRoadmap}
                    disabled={applying || !simulationId}
                    style={{ gap: 5, fontSize: 12, fontWeight: 600 }}
                    id="btn-apply-custom-plan"
                  >
                    {applying ? (
                      <>
                        <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} />
                        Menerapkan...
                      </>
                    ) : (
                      <>
                        <BookmarkPlus size={13} />
                        Terapkan ke Roadmap
                      </>
                    )}
                  </button>
                )}

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={copyResultSummary}
                  style={{ gap: 4, fontSize: 11.5 }}
                >
                  {copiedSummary ? <Check size={12} color="var(--lime)" /> : <Copy size={12} />}
                  {copiedSummary ? "Tersalin" : "Salin"}
                </button>

                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setStep("form")}
                  style={{ fontSize: 11.5 }}
                >
                  Edit Form
                </button>
              </div>
            </div>

            <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 16px 0" }}>
              {simulationResult.academicImpactSummary}
            </p>

            {/* 2 Metrik Utama Sederhana */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  background: "var(--surface-hover)",
                  borderRadius: 8,
                  padding: "12px 16px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                  <Clock size={13} color="var(--teal)" />
                  Estimasi Beban Waktu
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                  {simulationResult.estimatedHoursPerWeek}
                </div>
              </div>

              <div
                style={{
                  background: "var(--surface-hover)",
                  borderRadius: 8,
                  padding: "12px 16px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                  <Calendar size={13} color="var(--lime)" />
                  Dampak ke Kelulusan
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                  {simulationResult.impactOnGraduation}
                </div>
              </div>
            </div>

            {/* Risiko & Mitigasi Side-by-Side */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: 14 }}>
              {simulationResult.keyRisks && simulationResult.keyRisks.length > 0 && (
                <div
                  style={{
                    background: "rgba(255, 179, 71, 0.06)",
                    padding: "12px 14px",
                    borderRadius: 8,
                    border: "1px solid rgba(255, 179, 71, 0.25)",
                  }}
                >
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--orange)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8, textTransform: "uppercase" }}>
                    <ShieldAlert size={14} color="var(--orange)" />
                    Risiko yang Perlu Diantisipasi
                  </div>
                  {simulationResult.keyRisks.map((r, ri) => (
                    <div key={ri} style={{ fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 5, lineHeight: 1.5, display: "flex", gap: 6 }}>
                      <span style={{ color: "var(--orange)", fontWeight: 700 }}>•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}

              {simulationResult.mitigationStrategies && simulationResult.mitigationStrategies.length > 0 && (
                <div
                  style={{
                    background: "rgba(124, 230, 168, 0.06)",
                    padding: "12px 14px",
                    borderRadius: 8,
                    border: "1px solid rgba(124, 230, 168, 0.25)",
                  }}
                >
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--lime)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8, textTransform: "uppercase" }}>
                    <CheckCircle2 size={14} color="var(--lime)" />
                    Strategi Mitigasi AI
                  </div>
                  {simulationResult.mitigationStrategies.map((m, mi) => (
                    <div key={mi} style={{ fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 5, lineHeight: 1.5, display: "flex", gap: 6 }}>
                      <span style={{ color: "var(--lime)", fontWeight: 700 }}>✓</span>
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tahapan Aksi (Pra-Kegiatan, Pelaksanaan, Pasca-Kegiatan) */}
            {simulationResult.actionSteps && simulationResult.actionSteps.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                  Langkah Eksekusi yang Disarankan STARA AI:
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
                  {simulationResult.actionSteps.map((stepGroup, sIdx) => (
                    <div
                      key={sIdx}
                      style={{
                        background: "var(--surface-hover)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 8,
                        padding: "10px 12px",
                      }}
                    >
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--teal)", marginBottom: 6 }}>
                        {sIdx + 1}. {stepGroup.phase}
                      </div>
                      {stepGroup.steps.map((st, stIdx) => (
                        <div key={stIdx} style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, lineHeight: 1.45 }}>
                          • {st}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pertanyaan untuk Dosen Wali */}
            {simulationResult.questionsForAcademicAdvisor && simulationResult.questionsForAcademicAdvisor.length > 0 && (
              <div className="info-box" style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  Pertanyaan Kunci untuk Dosen Wali / Kemahasiswaan:
                </div>
                {simulationResult.questionsForAcademicAdvisor.map((q, qi) => (
                  <div key={qi} style={{ fontSize: 12.5, marginBottom: 3 }}>• {q}</div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Rekomendasi Alternatif AI (Bisa Di-refresh Secara Live!) */}
          <div className="card" style={{ padding: "18px 22px", marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Lightbulb size={16} color="var(--lime)" />
                  <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                    Rekomendasi Strategi & Alternatif AI
                  </h3>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
                  Opsi taktis agar rencana ini makin optimal tanpa membebani SKS kuliahmu
                </div>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={handleRefreshAlternatives}
                disabled={refreshingAlt}
                style={{ gap: 5, fontSize: 11.5, padding: "5px 10px" }}
                id="btn-refresh-alternatives"
                title="Muat variasi rekomendasi alternatif baru dari AI"
              >
                <RefreshCw
                  size={12}
                  style={{ animation: refreshingAlt ? "spin 1s linear infinite" : undefined }}
                />
                {refreshingAlt ? "Memperbarui..." : "Cari Opsi Lain (AI)"}
              </button>
            </div>

            {alternativesList.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "10px 0" }}>
                Tidak ada alternatif yang tersedia. Klik tombol Cari Opsi Lain di atas untuk memuat.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
                {alternativesList.slice(0, 3).map((alt, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "var(--surface-hover)",
                      borderRadius: 8,
                      padding: "14px 16px",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--text-primary)", marginBottom: 5 }}>
                        {alt.title}
                      </div>
                      <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: 0, lineHeight: 1.55 }}>
                        {alt.description}
                      </p>
                      {alt.benefit && (
                        <div style={{ fontSize: 12, color: "var(--lime)", marginTop: 8, fontWeight: 600 }}>
                          → {alt.benefit}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() =>
                        handleSendChat(
                          `Bagaimana langkah konkret menerapkan strategi "${alt.title}" (${alt.description}) untuk rencana saya?`
                        )
                      }
                      disabled={chatLoading}
                      style={{ alignSelf: "flex-start", fontSize: 11.5, padding: "4px 8px", gap: 5, color: "var(--teal)" }}
                    >
                      <MessageSquare size={12} />
                      Diskusikan Strategi Ini di Chat AI
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Tanya STARA AI (Konteks Rencana Terhubung Langsung) */}
          <div className="card" style={{ padding: "18px 22px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(215,243,106,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bot size={15} color="var(--lime)" />
                </div>
                <div>
                  <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                    Tanya STARA AI — Konsultan Rencana Studi
                  </h3>
                  <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                    Tanyakan pembagian waktu, strategi menjaga IPK, atau klaim poin TAK/SKPI untuk rencana ini
                  </div>
                </div>
              </div>
              <span className="badge badge-lime" style={{ fontSize: 10.5 }}>
                <Sparkles size={11} /> Konteks Rencana Aktif
              </span>
            </div>

            {/* Chat Box */}
            <div
              style={{
                background: "var(--surface-hover)",
                borderRadius: 10,
                padding: 14,
                minHeight: 220,
                maxHeight: 420,
                overflowY: "auto",
                marginBottom: 12,
                border: "1px solid var(--border-subtle)",
              }}
            >
              {chatMessages.map((msg, i) => (
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
                    }}
                  >
                    {msg.isLoading ? (
                      <span style={{ opacity: 0.7, display: "flex", alignItems: "center", gap: 6 }}>
                        <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} />
                        STARA AI sedang menyusun jawaban lengkap...
                      </span>
                    ) : (
                      renderFormattedText(msg.content)
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Consultation Chips */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>
                💡 Pertanyaan Cepat:
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  "Bagaimana cara membagi waktu mingguan agar tugas kuliah aman?",
                  "Apa saja persiapan yang harus saya mulai minggu ini?",
                  "Bagaimana cara mengklaim kegiatan ini ke poin TAK/SKPI?",
                  "Apakah perlu mengajukan izin ke dosen wali?",
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendChat(suggestion)}
                    disabled={chatLoading}
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
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Row */}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: 1, fontSize: 13, padding: "9px 12px" }}
                placeholder="Tanyakan hal spesifik tentang rencana ini (misal: jadwal latihan, strategi juara, SKS)..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendChat()}
                disabled={chatLoading}
                maxLength={600}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleSendChat()}
                disabled={!chatInput.trim() || chatLoading}
                style={{ flexShrink: 0, gap: 5, fontSize: 12.5, padding: "9px 16px" }}
              >
                <Send size={13} />
                Kirim
              </button>
            </div>
          </div>

          {/* Action to restart */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setStep("input");
                setGeneratedForm(null);
                setSimulationResult(null);
                setChatMessages([]);
                setApplied(false);
              }}
              style={{ gap: 6, fontSize: 12, color: "var(--text-muted)" }}
            >
              <RefreshCw size={13} />
              Rancang Rencana Baru Lainnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
