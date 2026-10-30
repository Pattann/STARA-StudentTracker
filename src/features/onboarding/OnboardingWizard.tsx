"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Building2,
  Zap,
  Clock,
  Compass,
  ArrowRight,
  Info,
  Lock,
} from "lucide-react";
import { getCompletedCreditsBounds } from "@/lib/academic-rules";

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
}

const EMPTY_FORM: OnboardingForm = {
  institutionName: "",
  facultyName: "",
  programName: "",
  educationLevel: "S1",
  entryYear: "",
  currentSemester: "",
  totalCurriculumCredits: "144",
  completedCredits: "",
  gpa: "",
  goals: "balanced",
  interests: "",
  weeklyHours: "20",
};

const DEFAULT_FORM: OnboardingForm = {
  institutionName: "Telkom University",
  facultyName: "Fakultas Informatika",
  programName: "S1 Teknik Informatika",
  educationLevel: "S1",
  entryYear: "2023",
  currentSemester: "4",
  totalCurriculumCredits: "144",
  completedCredits: "60",
  gpa: "3.72",
  goals: "balanced",
  interests: "Artificial Intelligence, Full-Stack Web Development, UI/UX",
  weeklyHours: "24",
};

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<OnboardingForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    router.prefetch("/app");
  }, [router]);

  const isFirstSemester = form.currentSemester === "1";

  useEffect(() => {
    if (form.currentSemester === "1" && (form.completedCredits !== "0" || form.gpa !== "0.00")) {
      setForm((prev) => ({
        ...prev,
        completedCredits: "0",
        gpa: "0.00",
      }));
    }
  }, [form.currentSemester, form.completedCredits, form.gpa]);

  const steps = [
    { title: "Identitas Akademik", desc: "Data perguruan tinggi dan program studimu" },
    { title: "Progres & SKS", desc: "Riwayat perolehan SKS dan capaian IPK" },
    { title: "Target & Gaya Studi", desc: "Preferensi ritme kelulusan yang kamu inginkan" },
    { title: "Review & Generate", desc: "Pratinjau roadmap cerdas sebelum memulai" },
  ];

  const update = <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectSemester = (semNum: number) => {
    setError(null);
    if (semNum === 1) {
      setForm((prev) => ({
        ...prev,
        currentSemester: "1",
        completedCredits: "0",
        gpa: "0.00",
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        currentSemester: semNum.toString(),
        completedCredits: prev.currentSemester === "1" ? "" : prev.completedCredits,
        gpa: prev.currentSemester === "1" ? "" : prev.gpa,
      }));
    }
  };

  // Calculations
  const hasSelectedSemester = form.currentSemester !== "";
  const totalSKS = parseInt(form.totalCurriculumCredits, 10) || 144;
  const currentSem = parseInt(form.currentSemester, 10) || 1;
  const sksBounds = getCompletedCreditsBounds(currentSem, totalSKS);
  const parsedTypedSks =
    form.completedCredits.trim() === "" ? null : parseInt(form.completedCredits, 10);
  const isSksOutOfRange =
    hasSelectedSemester &&
    !isFirstSemester &&
    parsedTypedSks !== null &&
    (Number.isNaN(parsedTypedSks) || parsedTypedSks < sksBounds.min || parsedTypedSks > sksBounds.max);
  const completedSKS = isFirstSemester ? 0 : Math.max(0, parsedTypedSks || 0);
  const remainingSKS = Math.max(0, totalSKS - completedSKS);
  const baseTargetSem = form.goals === "fast" ? 7 : 8;
  const targetGradSem =
    currentSem >= baseTargetSem
      ? remainingSKS <= 20
        ? currentSem
        : currentSem + 1
      : baseTargetSem;
  const remainingSemesters = Math.max(1, targetGradSem - currentSem + 1);
  const rawAvgSKS = Math.round(remainingSKS / remainingSemesters);
  const avgSKSPerSem =
    remainingSKS === 0
      ? 0
      : Math.min(24, remainingSKS < 12 ? remainingSKS : Math.max(12, rawAvgSKS));
  const progressPercent = Math.min(100, Math.round((completedSKS / Math.max(1, totalSKS)) * 100));

  const handleFillDemo = () => {
    setError(null);
    setForm(DEFAULT_FORM);
  };

  const validateStep = (s: Step): string | null => {
    if (s === 0) {
      if (!form.institutionName.trim()) return "Isi nama kampus terlebih dahulu ya.";
      if (!form.programName.trim()) return "Isi program studi terlebih dahulu ya.";
      if (!form.entryYear.trim()) return "Isi tahun angkatan terlebih dahulu ya.";
    }
    if (s === 1) {
      if (!form.currentSemester) return "Pilih semester aktifmu saat ini terlebih dahulu.";
      if (!form.totalCurriculumCredits) return "Isi total SKS kurikulum prodimu (umumnya 144).";
      const totalNum = parseInt(form.totalCurriculumCredits, 10);
      if (Number.isNaN(totalNum) || totalNum < 80 || totalNum > 200) {
        return "Total SKS kurikulum harus berada di rentang 80 hingga 200 SKS.";
      }
      if (!isFirstSemester) {
        const semNum = parseInt(form.currentSemester, 10);
        const bounds = getCompletedCreditsBounds(semNum, totalNum);
        if (form.completedCredits.trim() === "") {
          return `SKS tuntas wajib diisi untuk Semester ${semNum} (minimal ${bounds.min} SKS dan maksimal ${bounds.max} SKS).`;
        }
        const compNum = parseInt(form.completedCredits, 10);
        if (Number.isNaN(compNum) || compNum < bounds.min || compNum > bounds.max) {
          return `Untuk Semester ${semNum}, SKS tuntas harus diisi minimal ${bounds.min} SKS dan maksimal ${bounds.max} SKS (17-24 SKS per semester lulus).`;
        }
        if (form.gpa.trim() === "") return "Isi IPK kumulatif terakhirmu.";
        const gpaNum = parseFloat(form.gpa);
        if (Number.isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4.0) {
          return "IPK harus berada di rentang 0.00 hingga 4.00 (maksimal 4.00).";
        }
      }
    }
    return null;
  };

  const handleNext = () => {
    const problem = validateStep(step);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    if (step < 3) {
      setStep((prev) => (prev + 1) as Step);
    }
  };

  const handlePrev = () => {
    setError(null);
    if (step > 0) {
      setStep((prev) => (prev - 1) as Step);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const existingToken = typeof window !== "undefined" ? localStorage.getItem("stara_demo_token") : null;

      const semNum = parseInt(form.currentSemester, 10) || 1;
      const totalCreditsNum = parseInt(form.totalCurriculumCredits, 10) || 144;
      const parsedCompleted = parseInt(form.completedCredits, 10);
      const parsedGpa = parseFloat(form.gpa);

      const payload = {
        institutionName: form.institutionName,
        facultyName: form.facultyName,
        programName: form.programName,
        educationLevel: form.educationLevel,
        entryYear: parseInt(form.entryYear, 10) || 2025,
        currentSemester: semNum,
        totalCurriculumCredits: totalCreditsNum,
        completedCredits:
          semNum === 1
            ? 0
            : Number.isNaN(parsedCompleted)
              ? 0
              : Math.min(totalCreditsNum, Math.max(0, parsedCompleted)),
        gpa:
          semNum === 1
            ? 0
            : Number.isNaN(parsedGpa)
              ? 0
              : Math.min(4.0, Math.max(0.0, parsedGpa)),
        goals: form.goals,
        interests: form.interests,
        weeklyHours: parseInt(form.weeklyHours, 10) || 20,
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
      if (typeof window !== "undefined") {
        window.location.href = "/app?welcome=1";
      } else {
        router.push("/app?welcome=1");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base, #FAF9F5)",
        color: "#0F172A",
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
          marginBottom: 32,
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img
            src="/blackstara.svg"
            alt="Logo STARA"
            width={28}
            height={28}
            style={{ width: 28, height: 28, objectFit: "contain", display: "block" }}
          />
          <span style={{ fontSize: 18, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.02em" }}>
            STARA
          </span>
        </Link>

        <button
          type="button"
          onClick={handleFillDemo}
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#92400E",
            background: "#FEF3C7",
            border: "1px solid #FCD34D",
            borderRadius: "var(--radius-pill)",
            padding: "6px 14px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            transition: "all 0.15s ease",
          }}
        >
          <Sparkles size={13} color="#D97706" />
          <span>Isi Data Contoh</span>
        </button>
      </div>

      {/* Main Container */}
      <div style={{ width: "100%", maxWidth: 720 }}>
        {/* Step Progress Bar */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            {steps.map((s, idx) => {
              const isActive = idx === step;
              const isDone = idx < step;
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    opacity: isActive ? 1 : isDone ? 0.95 : 0.45,
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: isDone
                        ? "#D97706"
                        : isActive
                          ? "#0F172A"
                          : "#F1F5F9",
                      color: isDone || isActive ? "#FFFFFF" : "#64748B",
                      border: `1.5px solid ${isDone ? "#B45309" : isActive ? "#0F172A" : "#CBD5E1"}`,
                      fontSize: 12,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: isDone
                        ? "0 2px 6px rgba(217, 119, 6, 0.3)"
                        : isActive
                          ? "0 2px 8px rgba(15, 23, 42, 0.12)"
                          : "none",
                    }}
                  >
                    {isDone ? <CheckCircle2 size={15} strokeWidth={2.5} /> : idx + 1}
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: isActive ? "#0F172A" : isDone ? "#92400E" : "#64748B",
                      display: isActive ? "inline" : "none",
                    }}
                    className="step-label"
                  >
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ width: "100%", height: 6, background: "#E2E8F0", borderRadius: 99, overflow: "hidden" }}>
            <div
              style={{
                width: `${((step + 1) / steps.length) * 100}%`,
                height: "100%",
                background: "#D97706",
                borderRadius: 99,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Card Content */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: 20,
            padding: "34px 30px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02)",
          }}
        >
          {/* Header of Step */}
          <div style={{ marginBottom: 26 }}>
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: "#92400E",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Langkah {step + 1} dari {steps.length} · Sekitar 2 Menit
            </div>
            <h1 style={{ fontSize: 23, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>
              {steps[step].title}
            </h1>
            <p style={{ fontSize: 13.5, color: "#64748B", marginTop: 4, margin: "4px 0 0", lineHeight: 1.4 }}>
              {steps[step].desc}
            </p>
          </div>

          {/* ================= STEP 0: Identitas Akademik ================= */}
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", display: "block", marginBottom: 7 }}>
                  Nama Kampus / Perguruan Tinggi <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.institutionName}
                  onChange={(e) => update("institutionName", e.target.value)}
                  placeholder="Misal: Telkom University, Universitas Indonesia, ITB..."
                  className="form-input"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: 10,
                    background: "#FFFFFF",
                    border: "1px solid #CBD5E1",
                    color: "#0F172A",
                    fontSize: 13.5,
                    boxSizing: "border-box",
                  }}
                  required
                />
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {["Telkom University", "Universitas Indonesia", "Institut Teknologi Bandung", "UGM", "BINUS"].map((camp) => (
                    <button
                      key={camp}
                      type="button"
                      onClick={() => update("institutionName", camp)}
                      style={{
                        background: form.institutionName === camp ? "#FEF3C7" : "#F8FAFC",
                        border: `1px solid ${form.institutionName === camp ? "#FCD34D" : "#E2E8F0"}`,
                        color: form.institutionName === camp ? "#92400E" : "#475569",
                        borderRadius: "var(--radius-pill)",
                        padding: "4px 11px",
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {camp}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", display: "block", marginBottom: 7 }}>
                    Program Studi (Prodi) <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={form.programName}
                    onChange={(e) => update("programName", e.target.value)}
                    placeholder="Misal: Teknik Informatika"
                    className="form-input"
                    style={{
                      width: "100%",
                      padding: "11px 38px 11px 14px",
                      borderRadius: 10,
                      background: "#FFFFFF",
                      border: "1px solid #CBD5E1",
                      color: "#0F172A",
                      fontSize: 13.5,
                      boxSizing: "border-box",
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", display: "block", marginBottom: 7 }}>
                    Fakultas (Opsional)
                  </label>
                  <input
                    type="text"
                    value={form.facultyName}
                    onChange={(e) => update("facultyName", e.target.value)}
                    placeholder="Misal: Fakultas Informatika"
                    className="form-input"
                    style={{
                      width: "100%",
                      padding: "11px 38px 11px 14px",
                      borderRadius: 10,
                      background: "#FFFFFF",
                      border: "1px solid #CBD5E1",
                      color: "#0F172A",
                      fontSize: 13.5,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", display: "block", marginBottom: 7 }}>
                    Jenjang Studi
                  </label>
                  <select
                    value={form.educationLevel}
                    onChange={(e) => update("educationLevel", e.target.value)}
                    className="form-input"
                    style={{
                      width: "100%",
                      padding: "11px 38px 11px 14px",
                      borderRadius: 10,
                      background: "#FFFFFF",
                      border: "1px solid #CBD5E1",
                      color: "#0F172A",
                      fontSize: 13.5,
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="S1">S1 (Sarjana)</option>
                    <option value="D4">D4 (Sarjana Terapan)</option>
                    <option value="D3">D3 (Diploma)</option>
                    <option value="S2">S2 (Magister)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", display: "block", marginBottom: 7 }}>
                    Tahun Angkatan <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={form.entryYear}
                    onChange={(e) => update("entryYear", e.target.value)}
                    placeholder="2023"
                    className="form-input"
                    style={{
                      width: "100%",
                      padding: "11px 38px 11px 14px",
                      borderRadius: 10,
                      background: "#FFFFFF",
                      border: "1px solid #CBD5E1",
                      color: "#0F172A",
                      fontSize: 13.5,
                      boxSizing: "border-box",
                    }}
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
                <label style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", display: "block", marginBottom: 8 }}>
                  Semester Aktif Saat Ini <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <div className="onboarding-semester-grid">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => {
                    const isSelected = form.currentSemester === s.toString();
                    return (
                      <button
                        key={s}
                        type="button"
                        data-selected={isSelected}
                        className="onboarding-sem-btn"
                        onClick={() => handleSelectSemester(s)}
                        style={{
                          minHeight: 44,
                          padding: "10px 0",
                          borderRadius: 10,
                          background: isSelected ? "#D97706" : "#F8FAFC",
                          color: isSelected ? "#FFFFFF" : "#334155",
                          fontWeight: 800,
                          fontSize: 14,
                          lineHeight: 1,
                          fontVariantNumeric: "tabular-nums",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: `1.5px solid ${isSelected ? "#B45309" : "#E2E8F0"}`,
                          cursor: "pointer",
                          boxShadow: isSelected ? "0 2px 8px rgba(217, 119, 6, 0.35)" : "none",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SKS & Progress Card */}
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 14,
                  padding: "18px 20px",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 6 }}>
                      <label htmlFor="onboarding-completed-sks" style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", display: "block" }}>
                        SKS Tuntas Hingga Kini <span style={{ color: "#DC2626" }}>*</span>
                      </label>
                      {isFirstSemester ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: "#334155",
                            background: "#E2E8F0",
                            padding: "2px 8px",
                            borderRadius: 99,
                          }}
                        >
                          <Lock size={10} strokeWidth={2.5} />
                          <span>Terkunci</span>
                        </span>
                      ) : hasSelectedSemester ? (
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: isSksOutOfRange ? "#B91C1C" : "#92400E",
                            background: isSksOutOfRange ? "#FEE2E2" : "#FEF3C7",
                            border: `1px solid ${isSksOutOfRange ? "#FCA5A5" : "#FDE68A"}`,
                            padding: "2px 8px",
                            borderRadius: 99,
                          }}
                        >
                          {sksBounds.min} - {sksBounds.max} SKS
                        </span>
                      ) : null}
                    </div>
                    <div style={{ position: "relative" }}>
                      <input
                        id="onboarding-completed-sks"
                        type={isFirstSemester || !hasSelectedSemester ? "text" : "number"}
                        inputMode="numeric"
                        value={isFirstSemester ? "0" : form.completedCredits}
                        disabled={isFirstSemester || !hasSelectedSemester}
                        readOnly={isFirstSemester || !hasSelectedSemester}
                        onChange={(e) => {
                          if (isFirstSemester || !hasSelectedSemester) return;
                          setError(null);
                          const digitsOnly = e.target.value.replace(/[^\d]/g, "").slice(0, 3);
                          update("completedCredits", digitsOnly);
                        }}
                        placeholder={
                          !hasSelectedSemester
                            ? "Pilih semester terlebih dahulu"
                            : `${sksBounds.min} - ${sksBounds.max}`
                        }
                        className="form-input"
                        style={{
                          width: "100%",
                          padding: isFirstSemester ? "10px 36px 10px 14px" : "10px 14px",
                          borderRadius: 10,
                          background:
                            isFirstSemester || !hasSelectedSemester
                              ? "#F1F5F9"
                              : isSksOutOfRange
                                ? "#FEF2F2"
                                : "#FFFFFF",
                          border: isSksOutOfRange ? "1.5px solid #DC2626" : "1px solid #CBD5E1",
                          color: isFirstSemester || !hasSelectedSemester ? "#475569" : "#0F172A",
                          fontSize: 16,
                          fontWeight: 800,
                          boxSizing: "border-box",
                          cursor: isFirstSemester || !hasSelectedSemester ? "not-allowed" : "text",
                        }}
                        min={sksBounds.min}
                        max={sksBounds.max}
                        required={!isFirstSemester}
                      />
                      {isFirstSemester && (
                        <Lock
                          size={15}
                          color="#475569"
                          style={{
                            position: "absolute",
                            right: 12,
                            top: "50%",
                            transform: "translateY(-50%)",
                            pointerEvents: "none",
                          }}
                        />
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: isSksOutOfRange
                          ? "#B91C1C"
                          : hasSelectedSemester && !isFirstSemester && parsedTypedSks !== null
                            ? "#15803D"
                            : "#475569",
                        fontWeight: isSksOutOfRange ? 700 : 500,
                        display: "block",
                        marginTop: 4,
                        lineHeight: 1.35,
                      }}
                    >
                      {!hasSelectedSemester
                        ? "Pilih semester aktif di atas terlebih dahulu untuk menentukan rentang SKS."
                        : isFirstSemester
                          ? "Terkunci otomatis 0 SKS karena kamu baru memulai Semester 1."
                          : isSksOutOfRange
                            ? `Harus di rentang ${sksBounds.min} - ${sksBounds.max} SKS untuk Semester ${currentSem} (17-24 SKS/semester).`
                            : parsedTypedSks !== null
                              ? `Sesuai rentang Semester ${currentSem} (${sksBounds.min} - ${sksBounds.max} SKS).`
                              : `Wajib diisi minimal ${sksBounds.min} dan maksimal ${sksBounds.max} SKS (${sksBounds.completedSemesters} semester lulus).`}
                    </span>
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <label htmlFor="onboarding-total-sks" style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", display: "block" }}>
                        Total SKS Kurikulum Prodi <span style={{ color: "#DC2626" }}>*</span>
                      </label>
                    </div>
                    <input
                      id="onboarding-total-sks"
                      type="number"
                      value={form.totalCurriculumCredits}
                      onChange={(e) => update("totalCurriculumCredits", e.target.value)}
                      placeholder="144"
                      className="form-input"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: "#FFFFFF",
                        border: "1px solid #CBD5E1",
                        color: "#0F172A",
                        fontSize: 16,
                        fontWeight: 800,
                        boxSizing: "border-box",
                      }}
                      min={100}
                      max={200}
                    />
                    <span style={{ fontSize: 11, color: "#64748B", display: "block", marginTop: 4 }}>
                      Standar 144 SKS untuk S1. Cek buku panduan prodi.
                    </span>
                  </div>
                </div>

                {/* Real-time Progress Bar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                      Pencapaian Kurikulum
                    </span>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: "#B45309" }}>
                      {progressPercent}% <span style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>({completedSKS} dari {totalSKS} SKS)</span>
                    </span>
                  </div>
                  <div style={{ width: "100%", height: 7, background: "#E2E8F0", borderRadius: 99, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${progressPercent}%`,
                        height: "100%",
                        background: "#D97706",
                        borderRadius: 99,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* IPK Kumulatif (Single focused clean input, TAK completely removed) */}
              <div style={{ maxWidth: 360 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                  <label htmlFor="onboarding-gpa" style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>
                    IPK Kumulatif Terakhir <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  {isFirstSemester ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: "#334155",
                        background: "#E2E8F0",
                        padding: "2px 8px",
                        borderRadius: 99,
                      }}
                    >
                      <Lock size={10} strokeWidth={2.5} />
                      <span>Terkunci</span>
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B" }}>
                      Maks. 4.00
                    </span>
                  )}
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    id="onboarding-gpa"
                    type={isFirstSemester || !hasSelectedSemester ? "text" : "number"}
                    step="0.01"
                    min="0.00"
                    max="4.00"
                    value={isFirstSemester ? "0.00" : form.gpa}
                    disabled={isFirstSemester || !hasSelectedSemester}
                    readOnly={isFirstSemester || !hasSelectedSemester}
                    onChange={(e) => {
                      if (isFirstSemester || !hasSelectedSemester) return;
                      setError(null);
                      const rawVal = e.target.value.replace(",", ".");
                      if (rawVal === "") {
                        update("gpa", "");
                        return;
                      }
                      const parsed = parseFloat(rawVal);
                      if (!isNaN(parsed) && parsed > 4.0) {
                        update("gpa", "4.00");
                      } else if (!isNaN(parsed) && parsed < 0) {
                        update("gpa", "0.00");
                      } else {
                        update("gpa", rawVal);
                      }
                    }}
                    onBlur={(e) => {
                      if (isFirstSemester || !hasSelectedSemester) return;
                      const parsed = parseFloat(e.target.value);
                      if (!isNaN(parsed)) {
                        const clamped = Math.min(4.0, Math.max(0.0, parsed));
                        update("gpa", clamped.toFixed(2));
                      }
                    }}
                    placeholder={!hasSelectedSemester ? "Pilih semester terlebih dahulu" : "3.50"}
                    className="form-input"
                    style={{
                      width: "100%",
                      padding: isFirstSemester ? "11px 36px 11px 14px" : "11px 14px",
                      borderRadius: 10,
                      background: isFirstSemester || !hasSelectedSemester ? "#F1F5F9" : "#FFFFFF",
                      border: "1px solid #CBD5E1",
                      color: isFirstSemester || !hasSelectedSemester ? "#475569" : "#0F172A",
                      fontSize: 15,
                      fontWeight: 800,
                      boxSizing: "border-box",
                      cursor: isFirstSemester || !hasSelectedSemester ? "not-allowed" : "text",
                    }}
                  />
                  {isFirstSemester && (
                    <Lock
                      size={15}
                      color="#475569"
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
                  {!hasSelectedSemester
                    ? "Pilih semester aktif di atas terlebih dahulu."
                    : isFirstSemester
                      ? "Terkunci otomatis 0.00 karena nilai KHS belum terbit di Semester 1."
                      : "Skala standar perguruan tinggi (0.00 - 4.00)"}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: Target & Gaya Studi ================= */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", display: "block", marginBottom: 12 }}>
                  Pilih Ritme & Gaya Studi yang Paling Cocok:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    {
                      id: "fast",
                      title: "Lulus Cepat (3.5 Tahun)",
                      sub: "7 Semester • Akselerasi",
                      desc: "Maksimalkan beban SKS 22-24 per semester dan ambil semester pendek.",
                      icon: <Zap size={18} color="#D97706" />,
                      iconBg: "#FEF3C7",
                    },
                    {
                      id: "balanced",
                      title: "Seimbang & Teratur (4 Tahun)",
                      sub: "8 Semester • Standar Ideal",
                      desc: "Beban 18-20 SKS per semester dengan ritme belajar stabil tanpa stres berlebih.",
                      icon: <Clock size={18} color="#D97706" />,
                      iconBg: "#FEF3C7",
                    },
                    {
                      id: "active",
                      title: "Fokus MBKM & Magang",
                      sub: "8 Semester • Portofolio Kuat",
                      desc: "Alokasikan 1 semester penuh untuk magang industri atau program pertukaran.",
                      icon: <Building2 size={18} color="#7C3AED" />,
                      iconBg: "#F3E8FF",
                    },
                    {
                      id: "relaxed",
                      title: "Fleksibel & Terkendali",
                      sub: "Adaptif • Ritme Tenang",
                      desc: "Prioritaskan pemahaman mendalam dan keseimbangan kehidupan kampus.",
                      icon: <Compass size={18} color="#0284C7" />,
                      iconBg: "#E0F2FE",
                    },
                  ].map((item) => {
                    const isSelected = form.goals === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => update("goals", item.id as OnboardingForm["goals"])}
                        style={{
                          background: isSelected ? "#FFFBEB" : "#FFFFFF",
                          border: `1.5px solid ${isSelected ? "#D97706" : "#E2E8F0"}`,
                          borderRadius: 14,
                          padding: "16px 16px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          boxShadow: isSelected ? "0 4px 16px rgba(217, 119, 6, 0.12)" : "0 1px 3px rgba(0,0,0,0.02)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                background: item.iconBg,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {item.icon}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>{item.title}</span>
                          </div>
                          {isSelected && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#D97706" }} />}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: isSelected ? "#B45309" : "#64748B", marginBottom: 4 }}>{item.sub}</div>
                        <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.45, margin: 0 }}>{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Minat & Skripsi */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", display: "block", marginBottom: 7 }}>
                  Bidang Minat & Eksplorasi Skripsi
                </label>
                <input
                  type="text"
                  value={form.interests}
                  onChange={(e) => update("interests", e.target.value)}
                  placeholder="Misal: Machine Learning, Cybersecurity, UI/UX Design..."
                  className="form-input"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: 10,
                    background: "#FFFFFF",
                    border: "1px solid #CBD5E1",
                    color: "#0F172A",
                    fontSize: 13.5,
                    boxSizing: "border-box",
                  }}
                />
                <span style={{ fontSize: 11, color: "#64748B", display: "block", marginTop: 4 }}>
                  Digunakan untuk rekomendasi topik tugas akhir dan modul Simulasi Skenario.
                </span>
              </div>
            </div>
          )}

          {/* ================= STEP 3: Review & Generate ================= */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Summary Highlight Box */}
              <div
                style={{
                  background: "#FFFBEB",
                  border: "1.5px solid #FDE68A",
                  borderRadius: 16,
                  padding: "20px 18px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Sparkles size={16} color="#D97706" />
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#92400E", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Hasil Kalkulasi AI STARA
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "center" }}>
                  <div style={{ background: "#FFFFFF", padding: "12px 10px", borderRadius: 10, border: "1px solid #FDE68A" }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#D97706" }}>
                      Sem {targetGradSem}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginTop: 2 }}>Target Kelulusan</div>
                  </div>

                  <div style={{ background: "#FFFFFF", padding: "12px 10px", borderRadius: 10, border: "1px solid #FDE68A" }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A" }}>
                      {remainingSKS} SKS
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginTop: 2 }}>Sisa Beban Studi</div>
                  </div>

                  <div style={{ background: "#FFFFFF", padding: "12px 10px", borderRadius: 10, border: "1px solid #FDE68A" }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A" }}>
                      ~{avgSKSPerSem} SKS
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginTop: 2 }}>Rata-rata/Semester</div>
                  </div>
                </div>
              </div>

              {/* Data Review Rows */}
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 14,
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {[
                  { label: "Kampus & Prodi", value: `${form.programName} • ${form.institutionName}` },
                  { label: "Angkatan / Posisi", value: `Angkatan ${form.entryYear} • Semester ${form.currentSemester}` },
                  {
                    label: "Capaian Akademik",
                    value: isFirstSemester
                      ? `0 / ${form.totalCurriculumCredits} SKS (IPK 0.00)`
                      : `${form.completedCredits} / ${form.totalCurriculumCredits} SKS (IPK ${form.gpa})`,
                  },
                  {
                    label: "Gaya Rencana",
                    value:
                      form.goals === "fast"
                        ? "Lulus Cepat (3.5 Thn)"
                        : form.goals === "active"
                          ? "Fokus MBKM"
                          : form.goals === "relaxed"
                            ? "Fleksibel & Terkendali"
                            : "Seimbang (4 Thn)",
                  },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                    <span style={{ color: "#64748B" }}>{row.label}</span>
                    <span style={{ fontWeight: 700, color: "#0F172A" }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Assumption Note */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  background: "#FFFBEB",
                  border: "1px solid #FDE68A",
                  padding: "12px 14px",
                  borderRadius: 12,
                  fontSize: 12.5,
                  color: "#92400E",
                  lineHeight: 1.4,
                }}
              >
                <Info size={15} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  STARA akan membuat baseline roadmap lengkap dari Semester {form.currentSemester} hingga kelulusan. Kamu bisa merevisi target, menyimulasikan magang MBKM, dan menyesuaikan SKS kapan pun.
                </span>
              </div>

              {error && (
                <div style={{ color: "#991B1B", fontSize: 13, background: "#FEF2F2", padding: "10px 14px", borderRadius: 10, border: "1px solid #FCA5A5" }}>
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Validation error (steps 1-3) */}
          {error && step < 3 && (
            <div
              role="alert"
              style={{
                marginTop: 20,
                color: "#991B1B",
                fontSize: 13,
                fontWeight: 600,
                background: "#FEF2F2",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #FCA5A5",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Navigation Controls */}
          <div
            style={{
              marginTop: 28,
              paddingTop: 18,
              borderTop: "1px solid #E2E8F0",
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
                color: step === 0 ? "#CBD5E1" : "#475569",
                cursor: step === 0 ? "not-allowed" : "pointer",
                padding: "9px 14px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <ChevronLeft size={16} />
              <span>Kembali</span>
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-gold-primary"
                style={{
                  background: "#D97706",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: 13.5,
                  padding: "10px 22px",
                  borderRadius: "var(--radius-pill)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 10px rgba(217, 119, 6, 0.35)",
                  transition: "all 0.15s ease",
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
                className="btn-gold-primary"
                style={{
                  background: "#D97706",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: 13.5,
                  padding: "11px 26px",
                  borderRadius: "var(--radius-pill)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: "none",
                  cursor: submitting ? "wait" : "pointer",
                  boxShadow: "0 2px 12px rgba(217, 119, 6, 0.35)",
                  transition: "all 0.15s ease",
                }}
              >
                {submitting ? (
                  <>
                    <span
                      style={{
                        width: 15,
                        height: 15,
                        border: "2px solid #FFFFFF",
                        borderTop: "2px solid transparent",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    <span>Menyiapkan Roadmap & Dashboard...</span>
                  </>
                ) : (
                  <>
                    <span>Buat Roadmap Saya</span>
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
        .onboarding-semester-grid {
          display: grid;
          grid-template-columns: repeat(10, minmax(0, 1fr));
          gap: 7px;
        }
        @media (max-width: 559px) {
          .onboarding-semester-grid {
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 8px;
          }
        }
        .onboarding-sem-btn:hover:not([data-selected="true"]) {
          background-color: #F1F5F9 !important;
          border-color: #CBD5E1 !important;
        }
        .btn-gold-primary:hover:not(:disabled) {
          background-color: #B45309 !important;
          box-shadow: 0 4px 14px rgba(217, 119, 6, 0.45) !important;
        }
      `}</style>
    </div>
  );
}
