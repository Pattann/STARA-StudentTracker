"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Building2,
  BookOpen,
  Award,
  Zap,
  Clock,
  Compass,
  ArrowRight,
} from "lucide-react";

type Step = 0 | 1 | 2 | 3;

interface OnboardingForm {
  institutionName: string;
  facultyName: string;
  programName: string;
  educationLevel: string;
  entryYear: string;
  currentSemester: string;
  totalCurriculumCredits: string;
  completedCredits: string;
  gpa: string;
  goals: "fast" | "balanced" | "active" | "relaxed";
  interests: string;
  weeklyHours: string;
  takEnabled: boolean;
  takTarget: string;
}

const DEFAULT_FORM: OnboardingForm = {
  institutionName: "Telkom University",
  facultyName: "Fakultas Informatika",
  programName: "S1 Teknik Informatika",
  educationLevel: "S1",
  entryYear: "2023",
  currentSemester: "4",
  totalCurriculumCredits: "144",
  completedCredits: "74",
  gpa: "3.72",
  goals: "balanced",
  interests: "Artificial Intelligence, Full-Stack Web Development, UI/UX",
  weeklyHours: "24",
  takEnabled: true,
  takTarget: "120",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<OnboardingForm>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { title: "Identitas Akademik", desc: "Data perguruan tinggi dan program studimu" },
    { title: "Progres & SKS", desc: "Riwayat perolehan SKS dan capaian IPK" },
    { title: "Target & Gaya Studi", desc: "Preferensi ritme kelulusan yang kamu inginkan" },
    { title: "Review & Generate", desc: "Pratinjau roadmap cerdas sebelum memulai" },
  ];

  const update = <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Calculations
  const totalSKS = parseInt(form.totalCurriculumCredits) || 144;
  const completedSKS = parseInt(form.completedCredits) || 0;
  const remainingSKS = Math.max(0, totalSKS - completedSKS);
  const currentSem = parseInt(form.currentSemester) || 1;
  const targetGradSem = form.goals === "fast" ? Math.max(currentSem, 7) : Math.max(currentSem, 8);
  const remainingSemesters = Math.max(1, targetGradSem - currentSem + 1);
  const avgSKSPerSem = Math.min(24, Math.max(12, Math.round(remainingSKS / remainingSemesters)));
  const progressPercent = Math.min(100, Math.round((completedSKS / totalSKS) * 100));

  const handleFillDemo = () => {
    setForm(DEFAULT_FORM);
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((prev) => (prev + 1) as Step);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep((prev) => (prev - 1) as Step);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const existingToken = typeof window !== "undefined" ? localStorage.getItem("stara_demo_token") : null;

      const payload = {
        institutionName: form.institutionName,
        facultyName: form.facultyName,
        programName: form.programName,
        educationLevel: form.educationLevel,
        entryYear: parseInt(form.entryYear) || 2023,
        currentSemester: parseInt(form.currentSemester) || 4,
        totalCurriculumCredits: parseInt(form.totalCurriculumCredits) || 144,
        completedCredits: parseInt(form.completedCredits) || 74,
        gpa: parseFloat(form.gpa) || 3.5,
        goals: form.goals,
        interests: form.interests,
        weeklyHours: parseInt(form.weeklyHours) || 20,
        takEnabled: form.takEnabled,
        takTarget: parseInt(form.takTarget) || 120,
        token: existingToken || undefined,
      };

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { success?: boolean; token?: string; error?: string };

      if (!res.ok || !data.token) {
        throw new Error(data.error || "Gagal membuat sesi onboarding.");
      }

      localStorage.setItem("stara_demo_token", data.token);
      localStorage.setItem(
        "stara_onboarding_profile",
        JSON.stringify({
          institutionName: form.institutionName,
          programName: form.programName,
          entryYear: form.entryYear,
        })
      );
      const queryParams = new URLSearchParams({
        kampus: form.institutionName,
        jurusan: form.programName,
        tahun: form.entryYear,
      });
      router.push(`/app/templates?${queryParams.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at top, #161D18 0%, #0B0D0C 70%)",
        color: "#F5F5F0",
        padding: "32px 20px 60px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Top Header */}
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 36,
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img
            src="/whitestara.svg"
            alt="Logo STARA"
            width={32}
            height={32}
            style={{ width: 32, height: 32, objectFit: "contain" }}
          />
          <span style={{ fontSize: 20, fontWeight: 900, color: "#F5F5F0", letterSpacing: "-0.02em" }}>
            STARA
          </span>
        </Link>

        <button
          onClick={handleFillDemo}
          className="btn btn-ghost btn-sm"
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--lime)",
            background: "rgba(245, 205, 71, 0.08)",
            border: "1px solid rgba(245, 205, 71, 0.25)",
            borderRadius: "var(--radius-pill)",
            padding: "6px 14px",
            cursor: "pointer",
          }}
        >
          ✦ Isi Data Contoh
        </button>
      </div>

      {/* Main Container */}
      <div style={{ width: "100%", maxWidth: 720 }}>
        {/* Step Progress Bar */}
        <div style={{ marginBottom: 30 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            {steps.map((s, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  opacity: idx === step ? 1 : idx < step ? 0.8 : 0.4,
                  transition: "opacity 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: idx <= step ? "var(--lime)" : "rgba(255,255,255,0.08)",
                    color: idx <= step ? "#0B0D0C" : "#A4AAA5",
                    fontSize: 12,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: idx === step ? "0 0 12px rgba(245,205,71,0.6)" : "none",
                  }}
                >
                  {idx < step ? "✓" : idx + 1}
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: idx === step ? "#F5F5F0" : "#A4AAA5",
                    display: idx === step ? "inline" : "none",
                  }}
                  className="step-label"
                >
                  {s.title}
                </span>
              </div>
            ))}
          </div>

          <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
            <div
              style={{
                width: `${((step + 1) / steps.length) * 100}%`,
                height: "100%",
                background: "linear-gradient(90deg, #E5BB35 0%, #F5CD47 100%)",
                borderRadius: 2,
                transition: "width 0.3s ease",
                boxShadow: "0 0 10px rgba(245,205,71,0.6)",
              }}
            />
          </div>
        </div>

        {/* Card Content */}
        <div
          style={{
            background: "linear-gradient(180deg, rgba(22, 27, 24, 0.9) 0%, rgba(13, 16, 14, 0.95) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 24,
            padding: "36px 32px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Header of Step */}
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--lime)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Langkah {step + 1} dari {steps.length}
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#F5F5F0", margin: 0, letterSpacing: "-0.02em" }}>
              {steps[step].title}
            </h1>
            <p style={{ fontSize: 14, color: "#A4AAA5", marginTop: 4, margin: "4px 0 0" }}>
              {steps[step].desc}
            </p>
          </div>

          {/* ================= STEP 0: Identitas Akademik ================= */}
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#D4D9D5", display: "block", marginBottom: 8 }}>
                  Nama Kampus / Perguruan Tinggi <span style={{ color: "var(--lime)" }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.institutionName}
                  onChange={(e) => update("institutionName", e.target.value)}
                  placeholder="Misal: Telkom University, Universitas Indonesia, ITB..."
                  className="form-input"
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F5F0", fontSize: 14 }}
                  required
                />
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {["Telkom University", "Universitas Indonesia", "Institut Teknologi Bandung", "UGM", "BINUS"].map((camp) => (
                    <button
                      key={camp}
                      type="button"
                      onClick={() => update("institutionName", camp)}
                      style={{
                        background: form.institutionName === camp ? "rgba(245,205,71,0.15)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${form.institutionName === camp ? "var(--lime)" : "rgba(255,255,255,0.08)"}`,
                        color: form.institutionName === camp ? "var(--lime)" : "#A4AAA5",
                        borderRadius: "var(--radius-pill)",
                        padding: "4px 10px",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {camp}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#D4D9D5", display: "block", marginBottom: 8 }}>
                    Program Studi (Prodi) <span style={{ color: "var(--lime)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={form.programName}
                    onChange={(e) => update("programName", e.target.value)}
                    placeholder="Misal: Teknik Informatika"
                    className="form-input"
                    style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F5F0", fontSize: 14 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#D4D9D5", display: "block", marginBottom: 8 }}>
                    Fakultas (Opsional)
                  </label>
                  <input
                    type="text"
                    value={form.facultyName}
                    onChange={(e) => update("facultyName", e.target.value)}
                    placeholder="Misal: Fakultas Informatika"
                    className="form-input"
                    style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F5F0", fontSize: 14 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#D4D9D5", display: "block", marginBottom: 8 }}>
                    Jenjang Studi
                  </label>
                  <select
                    value={form.educationLevel}
                    onChange={(e) => update("educationLevel", e.target.value)}
                    className="form-input"
                    style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F5F0", fontSize: 14 }}
                  >
                    <option value="S1">S1 — Sarjana</option>
                    <option value="D4">D4 — Sarjana Terapan</option>
                    <option value="D3">D3 — Diploma</option>
                    <option value="S2">S2 — Magister</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#D4D9D5", display: "block", marginBottom: 8 }}>
                    Tahun Angkatan <span style={{ color: "var(--lime)" }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={form.entryYear}
                    onChange={(e) => update("entryYear", e.target.value)}
                    placeholder="2023"
                    className="form-input"
                    style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F5F0", fontSize: 14 }}
                    min={2015}
                    max={2030}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 1: Progres & Beban SKS ================= */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Semester Selector */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#D4D9D5", display: "block", marginBottom: 8 }}>
                  Semester Aktif Saat Ini <span style={{ color: "var(--lime)" }}>*</span>
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 8 }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => update("currentSemester", s.toString())}
                      style={{
                        padding: "12px 0",
                        borderRadius: 10,
                        background: form.currentSemester === s.toString() ? "var(--lime)" : "rgba(255,255,255,0.04)",
                        color: form.currentSemester === s.toString() ? "#0B0D0C" : "#F5F5F0",
                        fontWeight: 800,
                        fontSize: 14,
                        border: `1.5px solid ${form.currentSemester === s.toString() ? "var(--lime)" : "rgba(255,255,255,0.08)"}`,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* SKS & Progress Card */}
              <div
                style={{
                  background: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "20px",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: "#A4AAA5", display: "block", marginBottom: 6 }}>
                      SKS Tuntas Hingga Kini <span style={{ color: "var(--lime)" }}>*</span>
                    </label>
                    <input
                      type="number"
                      value={form.completedCredits}
                      onChange={(e) => update("completedCredits", e.target.value)}
                      placeholder="74"
                      className="form-input"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F5F0", fontSize: 16, fontWeight: 800 }}
                      min={0}
                      max={200}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: "#A4AAA5", display: "block", marginBottom: 6 }}>
                      Total SKS Kurikulum Prodi <span style={{ color: "var(--lime)" }}>*</span>
                    </label>
                    <input
                      type="number"
                      value={form.totalCurriculumCredits}
                      onChange={(e) => update("totalCurriculumCredits", e.target.value)}
                      placeholder="144"
                      className="form-input"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F5F0", fontSize: 16, fontWeight: 800 }}
                      min={100}
                      max={200}
                    />
                  </div>
                </div>

                {/* Real-time Progress Bar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#D4D9D5" }}>
                      Pencapaian Kurikulum
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: "var(--lime)" }}>
                      {progressPercent}% <span style={{ fontSize: 11, color: "#A4AAA5", fontWeight: 600 }}>({completedSKS} dari {totalSKS} SKS)</span>
                    </span>
                  </div>
                  <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${progressPercent}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #E5BB35 0%, #F5CD47 100%)",
                        borderRadius: 4,
                        boxShadow: "0 0 10px rgba(245,205,71,0.6)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* IPK & TAK */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#D4D9D5", display: "block", marginBottom: 8 }}>
                    IPK Kumulatif Terakhir <span style={{ color: "var(--lime)" }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.gpa}
                    onChange={(e) => update("gpa", e.target.value)}
                    placeholder="3.50"
                    className="form-input"
                    style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F5F0", fontSize: 15, fontWeight: 700 }}
                    min={0}
                    max={4}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#D4D9D5", display: "block", marginBottom: 8 }}>
                    Pelacakan Poin TAK / SKPI
                  </label>
                  <div
                    onClick={() => update("takEnabled", !form.takEnabled)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "11px 16px",
                      borderRadius: 12,
                      background: form.takEnabled ? "rgba(117,189,165,0.12)" : "rgba(0,0,0,0.4)",
                      border: `1px solid ${form.takEnabled ? "rgba(117,189,165,0.35)" : "rgba(255,255,255,0.1)"}`,
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: form.takEnabled ? "#75BDA5" : "#A4AAA5" }}>
                      {form.takEnabled ? "Aktifkan Pelacakan TAK" : "Nonaktifkan TAK"}
                    </span>
                    <input
                      type="checkbox"
                      checked={form.takEnabled}
                      onChange={() => {}}
                      style={{ accentColor: "var(--lime)", cursor: "pointer" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: Target & Gaya Studi ================= */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#D4D9D5", display: "block", marginBottom: 12 }}>
                  Pilih Ritme & Gaya Studi yang Paling Cocok:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    {
                      id: "fast",
                      title: "Lulus Cepat (3.5 Tahun)",
                      sub: "7 Semester • Akselerasi",
                      desc: "Maksimalkan beban SKS 22–24 per semester dan ambil semester antara/pendek.",
                      icon: <Zap size={18} color="var(--lime)" />,
                      accent: "var(--lime)",
                    },
                    {
                      id: "balanced",
                      title: "Seimbang & Teratur (4 Tahun)",
                      sub: "8 Semester • Standar Ideal",
                      desc: "Beban 18–20 SKS per semester dengan ritme belajar stabil tanpa stres berlebih.",
                      icon: <Clock size={18} color="#75BDA5" />,
                      accent: "#75BDA5",
                    },
                    {
                      id: "active",
                      title: "Fokus MBKM & Magang",
                      sub: "8 Semester • Portofolio Kuat",
                      desc: "Alokasikan 1 semester penuh untuk magang industri atau program pertukaran.",
                      icon: <Building2 size={18} color="#B288FF" />,
                      accent: "#B288FF",
                    },
                    {
                      id: "relaxed",
                      title: "Fleksibel & Terkendali",
                      sub: "Adaptif • Ritme Tenang",
                      desc: "Prioritaskan pemahaman mendalam dan keseimbangan kehidupan kampus.",
                      icon: <Compass size={18} color="#FF9E66" />,
                      accent: "#FF9E66",
                    },
                  ].map((item) => {
                    const isSelected = form.goals === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => update("goals", item.id as any)}
                        style={{
                          background: isSelected ? "rgba(245,205,71,0.08)" : "rgba(0,0,0,0.3)",
                          border: `1.5px solid ${isSelected ? item.accent : "rgba(255,255,255,0.08)"}`,
                          borderRadius: 16,
                          padding: "18px 16px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          boxShadow: isSelected ? `0 8px 24px ${item.accent}20` : "none",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                background: "rgba(255,255,255,0.06)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {item.icon}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 800, color: "#F5F5F0" }}>{item.title}</span>
                          </div>
                          {isSelected && <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.accent }} />}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: item.accent, marginBottom: 4 }}>{item.sub}</div>
                        <p style={{ fontSize: 12, color: "#A4AAA5", lineHeight: 1.45, margin: 0 }}>{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Minat & Skripsi */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#D4D9D5", display: "block", marginBottom: 8 }}>
                  Bidang Minat & Eksplorasi Skripsi
                </label>
                <input
                  type="text"
                  value={form.interests}
                  onChange={(e) => update("interests", e.target.value)}
                  placeholder="Misal: Machine Learning, Cybersecurity, UI/UX Design..."
                  className="form-input"
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F5F0", fontSize: 14 }}
                />
                <span style={{ fontSize: 11, color: "#A4AAA5", display: "block", marginTop: 4 }}>
                  Digunakan untuk rekomendasi topik tugas akhir dan modul What-If Simulator.
                </span>
              </div>
            </div>
          )}

          {/* ================= STEP 3: Review & Generate ================= */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Summary Highlight Box */}
              <div
                style={{
                  background: "linear-gradient(180deg, rgba(245,205,71,0.1) 0%, rgba(245,205,71,0.03) 100%)",
                  border: "1.5px solid rgba(245,205,71,0.35)",
                  borderRadius: 18,
                  padding: "22px 20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Sparkles size={18} color="var(--lime)" />
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--lime)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Hasil Kalkulasi AI STARA
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "center" }}>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px 10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "var(--lime)" }}>
                      Sem {targetGradSem}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#D4D9D5", marginTop: 2 }}>Target Kelulusan</div>
                  </div>

                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px 10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#75BDA5" }}>
                      {remainingSKS} SKS
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#D4D9D5", marginTop: 2 }}>Sisa Beban Studi</div>
                  </div>

                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px 10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#F5F5F0" }}>
                      ~{avgSKSPerSem} SKS
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#D4D9D5", marginTop: 2 }}>Rata-rata/Semester</div>
                  </div>
                </div>
              </div>

              {/* Data Review Rows */}
              <div
                style={{
                  background: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 16,
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {[
                  { label: "Kampus & Prodi", value: `${form.programName} • ${form.institutionName}` },
                  { label: "Angkatan / Posisi", value: `Angkatan ${form.entryYear} • Semester ${form.currentSemester}` },
                  { label: "Capaian Akademik", value: `${form.completedCredits} / ${form.totalCurriculumCredits} SKS (IPK ${form.gpa})` },
                  { label: "Gaya Rencana", value: form.goals === "fast" ? "Lulus Cepat (3.5 Thn)" : form.goals === "active" ? "Fokus MBKM" : "Seimbang (4 Thn)" },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                    <span style={{ color: "#A4AAA5" }}>{row.label}</span>
                    <span style={{ fontWeight: 700, color: "#F5F5F0" }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Assumption Note */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  background: "rgba(117,189,165,0.08)",
                  border: "1px solid rgba(117,189,165,0.25)",
                  padding: "12px 14px",
                  borderRadius: 12,
                  fontSize: 12.5,
                  color: "#D4D9D5",
                }}
              >
                <AlertCircle size={16} color="#75BDA5" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  STARA akan membuat baseline roadmap lengkap dari Semester {form.currentSemester} hingga kelulusan. Kamu bisa merevisi target, menyimulasikan magang MBKM, dan menyesuaikan SKS kapan pun.
                </span>
              </div>

              {error && (
                <div style={{ color: "#FF7A45", fontSize: 13, background: "rgba(255,122,69,0.1)", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,122,69,0.3)" }}>
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          <div
            style={{
              marginTop: 32,
              paddingTop: 20,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={handlePrev}
              disabled={step === 0}
              className="btn btn-ghost"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: step === 0 ? "rgba(255,255,255,0.2)" : "#A4AAA5",
                cursor: step === 0 ? "not-allowed" : "pointer",
                padding: "10px 16px",
                borderRadius: 10,
              }}
            >
              <ChevronLeft size={16} />
              <span>Kembali</span>
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn btn-primary"
                style={{
                  background: "var(--lime)",
                  color: "#0B0D0C",
                  fontWeight: 800,
                  fontSize: 14,
                  padding: "12px 24px",
                  borderRadius: "var(--radius-pill)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(245, 205, 71, 0.35)",
                }}
              >
                <span>Lanjutkan</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="btn btn-primary"
                style={{
                  background: "var(--lime)",
                  color: "#0B0D0C",
                  fontWeight: 800,
                  fontSize: 14,
                  padding: "12px 28px",
                  borderRadius: "var(--radius-pill)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: "none",
                  cursor: submitting ? "wait" : "pointer",
                  boxShadow: "0 4px 20px rgba(245, 205, 71, 0.45)",
                }}
              >
                {submitting ? (
                  <>
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        border: "2px solid #0B0D0C",
                        borderTop: "2px solid transparent",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    <span>Membuat Roadmap...</span>
                  </>
                ) : (
                  <>
                    <span>Simpan Profil & Buka Jelajahi Template</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
