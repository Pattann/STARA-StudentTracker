"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/features/session/context";
import { useRouter } from "next/navigation";
import { GraduationCap, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { GOAL_OPTIONS } from "@/lib/constants";

type Step = 0 | 1 | 2 | 3;

interface FormData {
  institutionName: string;
  programName: string;
  entryYear: string;
  currentSemester: string;
  totalCurriculumCredits: string;
  completedCredits: string;
  gpa: string;
  goals: string;
  interests: string;
  weeklyHours: string;
  takEnabled: boolean;
  takTarget: string;
}

const DEMO_PROFILE: FormData = {
  institutionName: "Universitas Nusantara Maju",
  programName: "Teknik Informatika",
  entryYear: "2022",
  currentSemester: "5",
  totalCurriculumCredits: "144",
  completedCredits: "84",
  gpa: "3.42",
  goals: "balanced",
  interests: "Machine Learning, Pengembangan Web, UI/UX Design",
  weeklyHours: "20",
  takEnabled: true,
  takTarget: "120",
};

export default function OnboardingPage() {
  const { token } = useSession();
  const isDemo = Boolean(token);
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<FormData>(DEMO_PROFILE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { title: "Institusi & Program", subtitle: "Informasi dasar perkuliahanmu" },
    { title: "Progres Akademik", subtitle: "SKS dan nilai saat ini" },
    { title: "Tujuan Studi", subtitle: "Apa yang ingin kamu capai?" },
    { title: "Konfirmasi", subtitle: "Periksa data sebelum memulai" },
  ];

  const updateField = <K extends keyof FormData>(key: K, val: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        institutionName: form.institutionName,
        programName: form.programName,
        entryYear: parseInt(form.entryYear),
        currentSemester: parseInt(form.currentSemester),
        totalCurriculumCredits: parseInt(form.totalCurriculumCredits),
        completedCredits: parseInt(form.completedCredits),
        gpa: parseFloat(form.gpa),
        goals: form.goals,
        interests: form.interests,
        weeklyHours: parseInt(form.weeklyHours),
        takEnabled: form.takEnabled,
        takTarget: parseInt(form.takTarget),
      };

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Gagal menyimpan profil.");
      }

      router.push("/app");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    }
    setSaving(false);
  };

  const canProceed = (): boolean => {
    if (step === 0) return !!(form.institutionName && form.programName && form.entryYear);
    if (step === 1) return !!(form.currentSemester && form.completedCredits && form.totalCurriculumCredits && form.gpa);
    if (step === 2) return !!form.goals;
    return true;
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 540 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--lime)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <GraduationCap size={24} color="#0B0C0E" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>Setup Profil Akademik</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>
            {isDemo ? "Data demo diisi otomatis. Kamu bisa ubah sesuai keinginan." : "Lengkapi profil untuk memulai STARA."}
          </p>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          {steps.map((s, i) => (
            <div
              key={i}
              style={{
                flex: 1, height: 4, borderRadius: 2,
                background: i <= step ? "var(--lime)" : "var(--bg-secondary)",
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>

        <div className="card">
          {/* Step Header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>
              Langkah {step + 1} dari {steps.length}
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{steps[step].title}</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{steps[step].subtitle}</p>
          </div>

          {/* Step 0: Institution */}
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="on-institution">Nama Institusi *</label>
                <input id="on-institution" className="form-input" value={form.institutionName} onChange={(e) => updateField("institutionName", e.target.value)} placeholder="Universitas Nusantara Maju" required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="on-program">Program Studi *</label>
                <input id="on-program" className="form-input" value={form.programName} onChange={(e) => updateField("programName", e.target.value)} placeholder="Teknik Informatika" required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="on-year">Tahun Masuk *</label>
                <input id="on-year" type="number" className="form-input" value={form.entryYear} onChange={(e) => updateField("entryYear", e.target.value)} placeholder="2022" min="2000" max="2030" required />
              </div>
            </div>
          )}

          {/* Step 1: Progress */}
          {step === 1 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="on-semester">Semester Sekarang *</label>
                <input id="on-semester" type="number" className="form-input" value={form.currentSemester} onChange={(e) => updateField("currentSemester", e.target.value)} min="1" max="14" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="on-gpa">IPK *</label>
                <input id="on-gpa" type="number" className="form-input" value={form.gpa} onChange={(e) => updateField("gpa", e.target.value)} placeholder="3.50" min="0" max="4" step="0.01" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="on-total">Total SKS Kurikulum *</label>
                <input id="on-total" type="number" className="form-input" value={form.totalCurriculumCredits} onChange={(e) => updateField("totalCurriculumCredits", e.target.value)} placeholder="144" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="on-done">SKS Sudah Selesai *</label>
                <input id="on-done" type="number" className="form-input" value={form.completedCredits} onChange={(e) => updateField("completedCredits", e.target.value)} placeholder="84" />
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label" htmlFor="on-hours">Jam Belajar/Minggu</label>
                <input id="on-hours" type="number" className="form-input" value={form.weeklyHours} onChange={(e) => updateField("weeklyHours", e.target.value)} placeholder="20" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text-secondary)", cursor: "pointer" }}>
                  <input type="checkbox" checked={form.takEnabled} onChange={(e) => updateField("takEnabled", e.target.checked)} style={{ accentColor: "var(--lime)" }} />
                  Aktifkan pelacakan TAK / Poin Kegiatan
                </label>
                {form.takEnabled && (
                  <div className="form-group" style={{ marginTop: 10 }}>
                    <label className="form-label" htmlFor="on-tak">Target Poin TAK</label>
                    <input id="on-tak" type="number" className="form-input" value={form.takTarget} onChange={(e) => updateField("takTarget", e.target.value)} placeholder="120" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Goals */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {GOAL_OPTIONS.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => updateField("goals", opt.value)}
                  role="radio"
                  aria-checked={form.goals === opt.value}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && updateField("goals", opt.value)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "var(--radius-md)",
                    border: `2px solid ${form.goals === opt.value ? "var(--lime)" : "var(--border)"}`,
                    background: form.goals === opt.value ? "rgba(215,243,106,0.08)" : "var(--bg-elevated)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 2 }}>{opt.label}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{opt.description}</div>
                </div>
              ))}
              <div className="form-group" style={{ marginTop: 8 }}>
                <label className="form-label" htmlFor="on-interests">Bidang Minat (opsional)</label>
                <input id="on-interests" className="form-input" value={form.interests} onChange={(e) => updateField("interests", e.target.value)} placeholder="Machine Learning, Bisnis, Desain..." />
                <span className="form-hint">Digunakan untuk saran topik skripsi dan roadmap</span>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {[
                  { label: "Institusi", value: form.institutionName },
                  { label: "Program Studi", value: form.programName },
                  { label: "Angkatan", value: form.entryYear },
                  { label: "Semester", value: form.currentSemester },
                  { label: "SKS Selesai", value: `${form.completedCredits} / ${form.totalCurriculumCredits} SKS` },
                  { label: "IPK", value: form.gpa },
                  { label: "Tujuan", value: GOAL_OPTIONS.find((o) => o.value === form.goals)?.label ?? form.goals },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "8px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                    <span style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="assumption-notice">
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12 }}>Data ini digunakan untuk menghitung roadmap dan estimasi kelulusan. Kamu bisa ubah kapan saja di Profil.</span>
              </div>
              {error && <div style={{ color: "var(--coral)", fontSize: 13, marginTop: 10 }}>{error}</div>}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => step > 0 && setStep((prev) => (prev - 1) as Step)}
              disabled={step === 0}
            >
              <ChevronLeft size={14} /> Kembali
            </button>
            <button
              className="btn btn-primary"
              onClick={step < 3 ? () => setStep((prev) => (prev + 1) as Step) : handleSubmit}
              disabled={!canProceed() || saving}
            >
              {saving ? "Menyimpan..." : step < 3 ? (
                <> Lanjut <ChevronRight size={14} /> </>
              ) : (
                <> <CheckCircle2 size={14} /> Mulai STARA </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
