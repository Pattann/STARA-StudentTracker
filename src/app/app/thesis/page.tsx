"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@/features/session/context";
import {
  BookOpen, AlertCircle, Lightbulb, ChevronRight, CheckCircle2,
  Sparkles, MessageSquare, Send, Bot, User, Copy, Check, Target,
  FileCheck, HelpCircle, ArrowRight, RotateCcw, ListChecks
} from "lucide-react";

type ThesisDirection = {
  topicArea: string;
  exampleQuestion: string;
  whyItFits: string;
  possibleMethod: string;
  dataRequired: string;
  feasibility: "tinggi" | "sedang" | "perlu_validasi";
  mainRisks: string[];
  firstSteps: string[];
  questionsForSupervisor: string[];
};

type ExplorationResult = {
  directions: ThesisDirection[];
  isAiGenerated: boolean;
  fallbackReason?: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
};

type TitleReviewResult = {
  originalTitle: string;
  score: number;
  verdict: "sangat_baik" | "cukup_baik" | "perlu_penyempurnaan";
  strengths: string[];
  weaknesses: string[];
  improvedTitles: string[];
  suggestedMethods: string[];
  defenseQuestions: string[];
  isAiGenerated: boolean;
  fallbackReason?: string;
};

type StudentProfile = {
  programName?: string;
  institutionName?: string;
  educationLevel?: string;
  currentSemester?: number;
  gpa?: number;
  interests?: string[];
};

export default function ThesisPage() {
  const { token } = useSession();

  // Tab State
  const [activeTab, setActiveTab] = useState<"explore" | "chat" | "review" | "timeline">("explore");

  // Profile State
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  // Tab 1: Exploration Form State
  const [form, setForm] = useState({
    programName: "Teknik Informatika",
    interests: "",
    methods: "",
    dataAvailability: "Dataset publik atau open-source",
    timeAvailable: "1 semester",
    skills: "",
    constraints: "",
  });
  const [exploreLoading, setExploreLoading] = useState(false);
  const [exploreResult, setExploreResult] = useState<ExplorationResult | null>(null);
  const [exploreError, setExploreError] = useState<string | null>(null);
  const [copiedTitle, setCopiedTitle] = useState<string | null>(null);

  // Tab 2: Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [topicContext, setTopicContext] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Tab 3: Title Review State
  const [reviewInput, setReviewInput] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState<TitleReviewResult | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Fetch academic profile for auto-prefill
  useEffect(() => {
    if (!token) return;
    fetch("/api/thesis", { headers: { "x-demo-token": token } })
      .then((res) => res.json())
      .then((data: { profile: StudentProfile | null }) => {
        if (data.profile) {
          setProfile(data.profile);
          setForm((prev) => ({
            ...prev,
            programName: data.profile?.programName || prev.programName,
            interests: data.profile?.interests && data.profile.interests.length > 0
              ? data.profile.interests.join(", ")
              : prev.interests,
          }));
        }
      })
      .catch((err) => console.warn("[Thesis Page] Failed to fetch profile:", err));
  }, [token]);

  useEffect(() => {
    if (activeTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  // Handle Explore Form Submit
  const handleExploreSubmit = async () => {
    if (!token) return;
    setExploreLoading(true);
    setExploreError(null);
    try {
      const res = await fetch("/api/thesis", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({
          interests: form.interests.split(",").map((s) => s.trim()).filter(Boolean),
          methods: form.methods ? form.methods.split(",").map((s) => s.trim()).filter(Boolean) : [],
          dataAvailability: form.dataAvailability,
          timeAvailable: form.timeAvailable,
          skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
          constraints: form.constraints,
          programName: form.programName,
        }),
      });
      const data = (await res.json()) as ExplorationResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Gagal memproses rekomendasi.");
      setExploreResult(data);
    } catch (e) {
      setExploreError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    }
    setExploreLoading(false);
  };

  // Handle Chat Message Send
  const handleSendChat = async (overrideMessage?: string) => {
    const msg = (overrideMessage ?? chatInput).trim();
    if (!msg || chatLoading || !token) return;
    if (!overrideMessage) setChatInput("");

    const newHistory: ChatMessage[] = [...chatMessages, { role: "user", content: msg }];
    setChatMessages([...newHistory, { role: "assistant", content: "", isLoading: true }]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/thesis/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({
          message: msg,
          chatHistory: newHistory.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          topicContext: topicContext || undefined,
          programName: form.programName,
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      const reply = data.reply || "Maaf, tidak dapat memproses pertanyaan ini saat ini.";
      setChatMessages([...newHistory, { role: "assistant", content: reply }]);
    } catch {
      setChatMessages([...newHistory, { role: "assistant", content: "Terjadi gangguan jaringan. Silakan coba lagi." }]);
    }
    setChatLoading(false);
  };

  // Handle Title Review
  const handleReviewSubmit = async () => {
    if (!token || !reviewInput.trim()) return;
    setReviewLoading(true);
    setReviewError(null);
    try {
      const res = await fetch("/api/thesis/review", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({
          titleOrDraft: reviewInput.trim(),
          programName: form.programName,
          interests: form.interests,
        }),
      });
      const data = (await res.json()) as TitleReviewResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Gagal mengevaluasi judul.");
      setReviewResult(data);
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    }
    setReviewLoading(false);
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTitle(text);
    setTimeout(() => setCopiedTitle(null), 2500);
  };

  // Switch to chat with prefilled topic
  const consultTopicInChat = (topic: string) => {
    setTopicContext(topic);
    setActiveTab("chat");
    if (chatMessages.length === 0) {
      handleSendChat(`Halo STARA AI, saya tertarik dengan topik penelitian "${topic}". Tolong bantu saya merumuskan batasan masalah dan langkah awal pengerjaannya.`);
    }
  };

  const feasibilityStyles = {
    tinggi: { bg: "#DCFCE7", text: "#15803D", border: "#86EFAC", label: "Kelayakan Tinggi" },
    sedang: { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D", label: "Kelayakan Sedang" },
    perlu_validasi: { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5", label: "Perlu Validasi" },
  };

  return (
    <div>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", margin: 0 }}>
            Panduan Skripsi & Tugas Akhir
          </h1>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "#FEF3C7",
              color: "#92400E",
              border: "1px solid #FCD34D",
              padding: "2px 8px",
              borderRadius: "var(--radius-pill)",
            }}
          >
            <Sparkles size={11} color="#92400E" /> AI Powered
          </span>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
          Eksplorasi ide penelitian, bimbingan AI interaktif, dan evaluasi judul berbasis kurikulum akademik.
        </p>
      </div>

      {/* ── Profile Context Notice ── */}
      {profile && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#FFFFFF",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "10px 16px",
            marginBottom: 18,
            fontSize: 12.5,
            color: "var(--text-secondary)",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "#FEF3C7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Target size={13} color="#92400E" />
            </div>
            <span>
              Profil Terhubung: <strong style={{ color: "var(--text-primary)" }}>{profile.programName}</strong> ({profile.institutionName || "Kampus"}) • Semester {profile.currentSemester ?? 4}
            </span>
          </div>
          {profile.interests && profile.interests.length > 0 && (
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              <span style={{ color: "var(--text-muted)", fontSize: 11 }}>Fokus:</span>
              {profile.interests.slice(0, 3).map((item, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: "var(--radius-pill)",
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border)",
                    fontWeight: 500,
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Navigation Tabs (STARA Segmented Control) ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 20,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            background: "#EAE6DF",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: "var(--radius-pill)",
            padding: "4px",
            gap: 4,
          }}
        >
          <button
            onClick={() => setActiveTab("explore")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 16px",
              borderRadius: "var(--radius-pill)",
              fontSize: 12.5,
              fontWeight: activeTab === "explore" ? 700 : 500,
              border: "none",
              cursor: "pointer",
              background: activeTab === "explore" ? "#FFFFFF" : "transparent",
              color: activeTab === "explore" ? "#0F172A" : "#64748B",
              boxShadow: activeTab === "explore" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
            id="tab-thesis-explore"
          >
            <Lightbulb size={14} color={activeTab === "explore" ? "#D97706" : "#64748B"} />
            <span>Eksplorasi Topik AI</span>
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 16px",
              borderRadius: "var(--radius-pill)",
              fontSize: 12.5,
              fontWeight: activeTab === "chat" ? 700 : 500,
              border: "none",
              cursor: "pointer",
              background: activeTab === "chat" ? "#FFFFFF" : "transparent",
              color: activeTab === "chat" ? "#0F172A" : "#64748B",
              boxShadow: activeTab === "chat" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
            id="tab-thesis-chat"
          >
            <MessageSquare size={14} color={activeTab === "chat" ? "#D97706" : "#64748B"} />
            <span>Tanya Konsultan Skripsi AI</span>
            {topicContext && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: "#FEF3C7",
                  color: "#92400E",
                  padding: "1px 6px",
                  borderRadius: "var(--radius-pill)",
                }}
              >
                Aktif
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("review")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 16px",
              borderRadius: "var(--radius-pill)",
              fontSize: 12.5,
              fontWeight: activeTab === "review" ? 700 : 500,
              border: "none",
              cursor: "pointer",
              background: activeTab === "review" ? "#FFFFFF" : "transparent",
              color: activeTab === "review" ? "#0F172A" : "#64748B",
              boxShadow: activeTab === "review" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
            id="tab-thesis-review"
          >
            <FileCheck size={14} color={activeTab === "review" ? "#D97706" : "#64748B"} />
            <span>Reviewer Judul & Topik</span>
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 16px",
              borderRadius: "var(--radius-pill)",
              fontSize: 12.5,
              fontWeight: activeTab === "timeline" ? 700 : 500,
              border: "none",
              cursor: "pointer",
              background: activeTab === "timeline" ? "#FFFFFF" : "transparent",
              color: activeTab === "timeline" ? "#0F172A" : "#64748B",
              boxShadow: activeTab === "timeline" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
            id="tab-thesis-timeline"
          >
            <ListChecks size={14} color={activeTab === "timeline" ? "#D97706" : "#64748B"} />
            <span>Alur 6 Tahap Skripsi</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB 1: EKSPLORASI TOPIK AI
      ══════════════════════════════════════════════════════ */}
      {activeTab === "explore" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: exploreResult ? "380px 1fr" : "1fr", gap: 20 }}>
            {/* Form Panel */}
            <div className="card" style={{ maxWidth: exploreResult ? "100%" : 680 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={16} color="#D97706" />
                  Kuesioner Minat & Kesiapan Riset
                </h2>
                {exploreResult && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setExploreResult(null)} style={{ fontSize: 11 }}>
                    Reset Hasil
                  </button>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="th-prodi">Program Studi</label>
                  <input
                    id="th-prodi"
                    className="form-input"
                    value={form.programName}
                    onChange={(e) => setForm({ ...form, programName: e.target.value })}
                    placeholder="Teknik Informatika"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="th-interests">
                    Bidang Minat Riset * <span style={{ color: "#92400E", fontSize: 11 }}>(pisahkan koma)</span>
                  </label>
                  <input
                    id="th-interests"
                    className="form-input"
                    value={form.interests}
                    onChange={(e) => setForm({ ...form, interests: e.target.value })}
                    placeholder="Contoh: Machine Learning, Cloud Computing, Cyber Security"
                    required
                  />
                  {/* Quick Interest Chips */}
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
                    {["Machine Learning", "Pengembangan Web", "Keamanan Siber", "Internet of Things", "UI/UX", "Data Science"].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          const current = form.interests ? form.interests.split(",").map(s => s.trim()).filter(Boolean) : [];
                          if (!current.includes(item)) {
                            setForm({ ...form, interests: [...current, item].join(", ") });
                          }
                        }}
                        style={{
                          fontSize: 10.5,
                          padding: "3px 8px",
                          borderRadius: 12,
                          background: "#F4EFE6",
                          border: "1px solid rgba(0, 0, 0, 0.08)",
                          color: "var(--text-secondary)",
                          cursor: "pointer",
                        }}
                      >
                        + {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="th-methods">Metode Penelitian yang Diminati / Dikuasai (opsional)</label>
                  <input
                    id="th-methods"
                    className="form-input"
                    value={form.methods}
                    onChange={(e) => setForm({ ...form, methods: e.target.value })}
                    placeholder="Eksperimen, Scrum, Algoritma Klasifikasi, Kualitatif"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="th-data">Ketersediaan Data & Akses Penelitian</label>
                  <select
                    id="th-data"
                    className="form-input"
                    value={form.dataAvailability}
                    onChange={(e) => setForm({ ...form, dataAvailability: e.target.value })}
                  >
                    <option value="Dataset publik atau open-source">Dataset publik / open-source (Kaggle, Satu Data, UCI)</option>
                    <option value="Data primer melalui survei/wawancara">Data primer (kuesioner, wawancara, observasi)</option>
                    <option value="Data dari institusi/perusahaan (perlu izin)">Data institusi / perusahaan mitra (perlu izin)</option>
                    <option value="Belum ada data, perlu dikumpulkan dari nol">Belum ada, perlu crawling / pengumpulan mandiri</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="th-time">Target Waktu Pengerjaan Skripsi</label>
                  <select
                    id="th-time"
                    className="form-input"
                    value={form.timeAvailable}
                    onChange={(e) => setForm({ ...form, timeAvailable: e.target.value })}
                  >
                    <option value="1 semester">1 semester (Akselerasi 4–6 bulan)</option>
                    <option value="2 semester">2 semester (Standar reguler TA 1 & TA 2)</option>
                    <option value="Kurang dari 1 semester">Mendesak (&lt; 4 bulan untuk kejar wisuda)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="th-skills">Skills & Bahasa Pemrograman / Tools yang Dikuasai</label>
                  <input
                    id="th-skills"
                    className="form-input"
                    value={form.skills}
                    onChange={(e) => setForm({ ...form, skills: e.target.value })}
                    placeholder="Python, PyTorch, React, SQL, Figma, Docker"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="th-constraints">Batasan atau Kendala Spesifik (opsional)</label>
                  <input
                    id="th-constraints"
                    className="form-input"
                    value={form.constraints}
                    onChange={(e) => setForm({ ...form, constraints: e.target.value })}
                    placeholder="Contoh: Tidak bisa penelitian lapangan jauh, minim biaya server"
                  />
                </div>

                {exploreError && (
                  <div className="error-state">
                    <AlertCircle size={15} color="var(--coral)" />
                    <span style={{ fontSize: 12.5 }}>{exploreError}</span>
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  onClick={handleExploreSubmit}
                  disabled={exploreLoading || !form.interests.trim()}
                  style={{ gap: 6, justifyContent: "center" }}
                  id="btn-generate-thesis-topics"
                >
                  {exploreLoading ? (
                    <>
                      <RotateCcw size={15} style={{ animation: "spin 1s linear infinite" }} />
                      <span>STARA AI Menyusun Arah Topik Riset...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Rancang Rekomendasi Topik dengan AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results Panel */}
            {exploreResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                    <Lightbulb size={17} color="#D97706" />
                    Rekomendasi Arah Penelitian untuk Anda
                  </h2>
                  <span className="badge badge-teal" style={{ fontSize: 11 }}>
                    {exploreResult.directions.length} Alternatif Dihasilkan
                  </span>
                </div>

                {exploreResult.directions.map((d, i) => (
                  <div key={i} className="card" style={{ border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FEF3C7", border: "1px solid #FCD34D", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#92400E" }}>{i + 1}</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 15.5, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>
                            {d.topicArea}
                          </div>
                          <span
                            style={{
                              background: feasibilityStyles[d.feasibility].bg,
                              color: feasibilityStyles[d.feasibility].text,
                              border: `1px solid ${feasibilityStyles[d.feasibility].border}`,
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "var(--radius-pill)",
                              marginTop: 4,
                              display: "inline-block",
                            }}
                          >
                            {feasibilityStyles[d.feasibility].label}
                          </span>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => copyToClipboard(d.topicArea)}
                          title="Salin judul ini"
                          style={{ fontSize: 11.5, gap: 4 }}
                        >
                          {copiedTitle === d.topicArea ? <Check size={12} color="#15803D" /> : <Copy size={12} />}
                          <span>{copiedTitle === d.topicArea ? "Tersalin" : "Salin"}</span>
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => consultTopicInChat(d.topicArea)}
                          title="Konsultasikan topik ini ke AI"
                          style={{ fontSize: 11.5, gap: 4 }}
                        >
                          <MessageSquare size={12} />
                          <span>Bahas di Chat</span>
                        </button>
                      </div>
                    </div>

                    <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 12 }}>
                      <strong style={{ color: "var(--text-primary)" }}>Alasan Kecocokan:</strong> {d.whyItFits}
                    </p>

                    <div className="info-box" style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--blue)", marginBottom: 4, textTransform: "uppercase" }}>
                        Contoh Rumusan Masalah / Pertanyaan Penelitian:
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-primary)", fontStyle: "italic" }}>
                        &quot;{d.exampleQuestion}&quot;
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                      <div style={{ background: "var(--surface-hover)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                        <div style={{ fontSize: 10.5, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 2 }}>Metode yang Disarankan</div>
                        <div style={{ fontSize: 12.5, color: "var(--text-primary)", fontWeight: 600 }}>{d.possibleMethod}</div>
                      </div>
                      <div style={{ background: "var(--surface-hover)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                        <div style={{ fontSize: 10.5, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 2 }}>Kebutuhan Data</div>
                        <div style={{ fontSize: 12.5, color: "var(--text-primary)", fontWeight: 600 }}>{d.dataRequired}</div>
                      </div>
                    </div>

                    {d.mainRisks.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: "var(--coral)", textTransform: "uppercase", fontWeight: 700, marginBottom: 3 }}>
                          Risiko yang Perlu Diantisipasi:
                        </div>
                        {d.mainRisks.map((r, ri) => (
                          <div key={ri} style={{ fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 2 }}>• {r}</div>
                        ))}
                      </div>
                    )}

                    {d.firstSteps.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: "#92400E", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>
                          Langkah Awal yang Bisa Dilakukan:
                        </div>
                        {d.firstSteps.map((s, si) => (
                          <div key={si} style={{ fontSize: 12.5, color: "var(--text-secondary)", display: "flex", gap: 6, marginBottom: 3 }}>
                            <CheckCircle2 size={13} color="#15803D" style={{ flexShrink: 0, marginTop: 2 }} />
                            <span>{s}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {d.questionsForSupervisor.length > 0 && (
                      <div className="assumption-notice">
                        <BookOpen size={13} style={{ flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 11.5, marginBottom: 3 }}>Pertanyaan untuk Calon Dosen Pembimbing:</div>
                          {d.questionsForSupervisor.map((q, qi) => (
                            <div key={qi} style={{ fontSize: 12, marginBottom: 2 }}>• {q}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 2: TANYA KONSULTAN SKRIPSI AI
      ══════════════════════════════════════════════════════ */}
      {activeTab === "chat" && (
        <div className="card" style={{ maxWidth: 840, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#FEF3C7", border: "1px solid #FCD34D", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bot size={17} color="#92400E" />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  STARA Thesis AI Consultant
                </h2>
                <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                  Spesialis Metodologi, Rumusan Masalah, dan Strategi Bimbingan Skripsi
                </span>
              </div>
            </div>

            {topicContext && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="badge badge-blue" style={{ fontSize: 11 }}>
                  Topik: {topicContext.length > 30 ? topicContext.slice(0, 30) + "..." : topicContext}
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setTopicContext("")}
                  style={{ fontSize: 11, padding: "2px 6px" }}
                  title="Hapus fokus topik"
                >
                  Hapus
                </button>
              </div>
            )}
          </div>

          {/* Chat Messages Container */}
          <div
            style={{
              background: "var(--surface-hover)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              padding: 14,
              minHeight: 280,
              maxHeight: 440,
              overflowY: "auto",
              marginBottom: 14,
            }}
          >
            {chatMessages.length === 0 && (
              <div style={{ textAlign: "center", padding: "36px 16px", color: "var(--text-muted)" }}>
                <Bot size={36} color="#92400E" style={{ margin: "0 auto 10px", display: "block", opacity: 0.6 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                  Ada yang ingin kamu diskusikan tentang skripsimu?
                </div>
                <p style={{ fontSize: 12.5, maxWidth: 480, margin: "0 auto", lineHeight: 1.5 }}>
                  Tanyakan apa saja seputar cara merumuskan judul, struktur BAB 1, pemilihan metode, tips bimbingan, atau persiapan sidang sempro.
                </p>
              </div>
            )}

            {chatMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  marginBottom: 14,
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: msg.role === "user" ? "#0F172A" : "#FEF3C7",
                    border: msg.role === "user" ? "1px solid #0F172A" : "1px solid #FCD34D",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {msg.role === "user" ? <User size={14} color="#FFFFFF" /> : <Bot size={14} color="#92400E" />}
                </div>

                <div
                  style={{
                    background: msg.role === "user" ? "#0F172A" : "#FFFFFF",
                    border: msg.role === "user" ? "none" : "1px solid var(--border)",
                    borderRadius: msg.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                    padding: "9px 13px",
                    fontSize: 13,
                    color: msg.role === "user" ? "#FFFFFF" : "var(--text-primary)",
                    lineHeight: 1.6,
                    maxWidth: "82%",
                    whiteSpace: "pre-wrap",
                    boxShadow: msg.role === "user" ? "0 2px 6px rgba(15,23,42,0.12)" : "0 1px 3px rgba(0,0,0,0.03)",
                  }}
                >
                  {msg.isLoading ? (
                    <span style={{ opacity: 0.6, display: "flex", alignItems: "center", gap: 6 }}>
                      <RotateCcw size={12} style={{ animation: "spin 1s linear infinite" }} /> STARA AI sedang menganalisis naskah...
                    </span>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>
              💡 Pertanyaan Cepat Populer:
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                "Bantu buatkan 3 ide judul dari bidang minat saya",
                "Bagaimana struktur latar belakang BAB 1 yang meyakinkan penguji?",
                "Metode apa yang cocok jika data saya berupa dataset teks?",
                "Pertanyaan apa saja yang sering diajukan saat Sidang Sempro?",
                "Tips bimbingan pertama kali ke calon dosen pembimbing",
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendChat(chip)}
                  disabled={chatLoading}
                  style={{
                    fontSize: 11.5,
                    padding: "4px 10px",
                    borderRadius: 16,
                    background: "#FFFFFF",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#FCD34D";
                    e.currentTarget.style.color = "#92400E";
                    e.currentTarget.style.background = "#FEF3C7";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                    e.currentTarget.style.background = "#FFFFFF";
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, fontSize: 13 }}
              placeholder="Tulis pertanyaan skripsi, judul, atau rumusan masalahmu..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendChat()}
              disabled={chatLoading}
              maxLength={1000}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleSendChat()}
              disabled={!chatInput.trim() || chatLoading}
              style={{ flexShrink: 0, gap: 4 }}
            >
              <Send size={14} />
              <span>{chatLoading ? "..." : "Kirim"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 3: REVIEWER JUDUL & TOPIK AI
      ══════════════════════════════════════════════════════ */}
      {activeTab === "review" && (
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div className="card" style={{ marginBottom: 18 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <FileCheck size={18} color="#D97706" />
              Uji Kelayakan Judul & Draf Topik Skripsi
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14 }}>
              Ketikkan draf judul skripsi atau ide kasar yang ingin kamu ajukan. AI akan mengevaluasi ketajaman, potensi celah yang dicecar penguji sempro, dan memberikan alternatif redaksi judul yang lebih formal.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="review-title-input">Draf Judul / Ide Penelitian</label>
                <textarea
                  id="review-title-input"
                  className="form-input"
                  rows={3}
                  style={{ fontSize: 13.5, resize: "vertical" }}
                  placeholder="Contoh: Penerapan Algoritma Convolutional Neural Network untuk Klasifikasi Penyakit Daun Padi Berdasarkan Citra Digital"
                  value={reviewInput}
                  onChange={(e) => setReviewInput(e.target.value)}
                />
              </div>

              {reviewError && (
                <div className="error-state">
                  <AlertCircle size={15} color="var(--coral)" />
                  <span style={{ fontSize: 12.5 }}>{reviewError}</span>
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={handleReviewSubmit}
                disabled={reviewLoading || !reviewInput.trim()}
                style={{ gap: 6, alignSelf: "flex-start" }}
                id="btn-run-title-review"
              >
                {reviewLoading ? (
                  <>
                    <RotateCcw size={15} style={{ animation: "spin 1s linear infinite" }} />
                    <span>AI Sedang Menganalisis Judul & Menilai Celah Sempro...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Uji Kelayakan Judul dengan AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Review Results */}
          {reviewResult && (
            <div className="card" style={{ border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Hasil Evaluasi Draf Judul:</span>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontStyle: "italic" }}>
                    &quot;{reviewResult.originalTitle}&quot;
                  </div>
                </div>

                {/* Score Badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 16px",
                    borderRadius: "var(--radius-md)",
                    background: reviewResult.score >= 80 ? "#DCFCE7" : "#FEF3C7",
                    border: reviewResult.score >= 80 ? "1px solid #86EFAC" : "1px solid #FCD34D",
                  }}
                >
                  <span style={{ fontSize: 24, fontWeight: 800, color: reviewResult.score >= 80 ? "#15803D" : "#92400E" }}>
                    {reviewResult.score}
                  </span>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Skor Kelayakan</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: reviewResult.score >= 80 ? "#15803D" : "#92400E" }}>
                      {reviewResult.verdict === "sangat_baik" ? "Sangat Siap Diajukan" : reviewResult.verdict === "cukup_baik" ? "Cukup Baik" : "Perlu Disempurnakan"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "var(--radius-sm)", padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#15803D", textTransform: "uppercase", marginBottom: 6 }}>
                    Kelebihan Judul:
                  </div>
                  {reviewResult.strengths.map((s, i) => (
                    <div key={i} style={{ fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 4 }}>• {s}</div>
                  ))}
                </div>

                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "var(--radius-sm)", padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", textTransform: "uppercase", marginBottom: 6 }}>
                    Potensi Titik Lemah (Celah Sempro):
                  </div>
                  {reviewResult.weaknesses.map((w, i) => (
                    <div key={i} style={{ fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 4 }}>• {w}</div>
                  ))}
                </div>
              </div>

              {/* Suggested Alternative Titles */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={14} color="#D97706" />
                  Rekomendasi Alternatif Redaksi Judul yang Lebih Tajam:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {reviewResult.improvedTitles.map((alt, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#F8FAFC",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                        padding: "9px 12px",
                        gap: 10,
                      }}
                    >
                      <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>
                        {i + 1}. {alt}
                      </span>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => copyToClipboard(alt)}
                        style={{ fontSize: 11, flexShrink: 0, gap: 4 }}
                      >
                        {copiedTitle === alt ? <Check size={12} color="#15803D" /> : <Copy size={12} />}
                        <span>{copiedTitle === alt ? "Tersalin" : "Salin"}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Defense Questions */}
              {reviewResult.defenseQuestions.length > 0 && (
                <div className="assumption-notice">
                  <HelpCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>
                      Prediksi Pertanyaan Penguji saat Sidang Sempro untuk Topik Ini:
                    </div>
                    {reviewResult.defenseQuestions.map((q, i) => (
                      <div key={i} style={{ fontSize: 12.5, marginBottom: 2 }}>
                        {i + 1}. {q}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 4: ALUR 6 TAHAP SKRIPSI
      ══════════════════════════════════════════════════════ */}
      {activeTab === "timeline" && (
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Blueprint Roadmap 6 Tahapan Tugas Akhir / Skripsi
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
              Alur resmi pengerjaan skripsi dari eksplorasi awal hingga sidang sarjana dan yudisium.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              {
                step: 1,
                title: "Pra-Tugas Akhir & Penggalian Masalah",
                sem: "Semester 6",
                focus: "Studi literatur awal, identifikasi masalah industri/lapangan, dan penentuan Kelompok Keahlian (KK).",
                deliverables: "Draf 1 halaman ide riset, daftar 5 jurnal referensi utama (IEEE/Scopus/Sinta 2).",
                tip: "Pilih topik yang linear dengan minat kariermu atau proyek magang agar data mudah didapat.",
              },
              {
                step: 2,
                title: "Penyusunan Proposal (BAB 1–3) & Persetujuan Pembimbing",
                sem: "Semester 7 Awal",
                focus: "Menyusun Latar Belakang Masalah yang tajam, Tinjauan Pustaka, Kerangka Berpikir, dan Desain Metodologi Penelitian.",
                deliverables: "Draf Proposal Naskah BAB 1, 2, dan 3 yang ditandatangani Dosen Pembimbing.",
                tip: "Pertegas kebaruan (novelty) dan metrik pengujian keberhasilan sejak awal.",
              },
              {
                step: 3,
                title: "Seminar Proposal (Sempro) & Kolokium",
                sem: "Semester 7 Tengah",
                focus: "Presentasi kelayakan penelitian di hadapan dewan dosen penguji proposal.",
                deliverables: "Berita Acara Sempro, Lembar Revisi Penguji, dan Surat Tugas Pembimbingan Resmi.",
                tip: "Jangan panik saat dikritik penguji; catat seluruh masukan dan tunjukkan komitmen perbaikan.",
              },
              {
                step: 4,
                title: "Pengumpulan Data, Eksperimen & Pengembangan Produk",
                sem: "Semester 7 Akhir / Liburan",
                focus: "Eksekusi penelitian: pembuatan program, pengujian algoritma, pengumpulan dataset, atau survei lapangan.",
                deliverables: "Logbook aktivitas bimbingan rutin, dataset mentah, dan repositori kode riset (GitHub).",
                tip: "Lakukan bimbingan minimal 2 minggu sekali agar dosen pembimbing selalu memantau progres.",
              },
              {
                step: 5,
                title: "Penyusunan Naskah Lengkap (BAB 4–5) & Uji Coba Sistem",
                sem: "Semester 8 Awal",
                focus: "Analisis hasil pengujian, pembahasan temuan, penyimpulan, serta penulisan artikel publikasi ilmiah.",
                deliverables: "Naskah lengkap BAB 1 s/d 5, surat bebas plagiarisme Turnitin (maks. 20-25%), dan draf artikel jurnal.",
                tip: "BAB 4 adalah jantung skripsi: pastikan analisis hasil menjawab langsung rumusan masalah di BAB 1.",
              },
              {
                step: 6,
                title: "Sidang Sarjana (Tugas Akhir) & Yudisium",
                sem: "Semester 8 Akhir",
                focus: "Ujian komprehensif penutup masa studi dan demonstrasi aplikasi/hasil karya di depan dewan penguji.",
                deliverables: "Form nilai sidang, naskah jilid akhir bertanda tangan penguji, bebas pustaka, dan pendaftaran wisuda.",
                tip: "Latihan simulasi presentasi slide 15 menit dan kuasai justifikasi parameter penelitianmu.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="card"
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                  borderLeft: "4px solid #D97706",
                  border: "1px solid var(--border)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "#FEF3C7",
                    border: "1px solid #FCD34D",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 14,
                    color: "#92400E",
                    flexShrink: 0,
                  }}
                >
                  {item.step}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                      {item.title}
                    </div>
                    <span className="badge badge-teal" style={{ fontSize: 10 }}>{item.sem}</span>
                  </div>

                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, margin: "4px 0 8px" }}>
                    {item.focus}
                  </p>

                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
                    <strong style={{ color: "var(--text-primary)" }}>Output Wajib:</strong> {item.deliverables}
                  </div>

                  <div style={{ fontSize: 12, color: "#92400E", background: "#FFFBEB", border: "1px solid #FDE68A", padding: "6px 10px", borderRadius: "var(--radius-sm)", display: "flex", gap: 6 }}>
                    <span>💡 <strong>Tips:</strong> {item.tip}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
