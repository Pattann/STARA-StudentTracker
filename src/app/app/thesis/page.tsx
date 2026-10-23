"use client";

import { useState } from "react";
import { useSession } from "@/features/session/context";
import { BookOpen, AlertCircle, Lightbulb, ChevronRight, CheckCircle2 } from "lucide-react";

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

type Result = {
  directions: ThesisDirection[];
  isAiGenerated: boolean;
  fallbackReason?: string;
};

export default function ThesisPage() {
  const { token } = useSession();
  const [step, setStep] = useState<"form" | "result">("form");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    interests: "",
    methods: "",
    dataAvailability: "",
    timeAvailable: "",
    skills: "",
    constraints: "",
    programName: "Teknik Informatika",
  });

  const submit = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/thesis", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({
          interests: form.interests.split(",").map((s) => s.trim()).filter(Boolean),
          methods: form.methods.split(",").map((s) => s.trim()).filter(Boolean),
          dataAvailability: form.dataAvailability,
          timeAvailable: form.timeAvailable,
          skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
          constraints: form.constraints,
          programName: form.programName,
        }),
      });
      const data = await res.json() as Result & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Gagal memproses.");
      setResult(data);
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    }
    setLoading(false);
  };

  const feasibilityColors = { tinggi: "var(--lime)", sedang: "var(--teal)", perlu_validasi: "var(--orange)" };
  const feasibilityLabels = { tinggi: "Kelayakan Tinggi", sedang: "Kelayakan Sedang", perlu_validasi: "Perlu Validasi" };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>Panduan Skripsi</h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Eksplorasi topik penelitian berdasarkan minat dan kondisi akademikmu.</p>
      </div>

      <div className="assumption-notice" style={{ marginBottom: 20 }}>
        <AlertCircle size={16} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13 }}>
          Output ini adalah panduan eksplorasi, bukan topik skripsi resmi. Konfirmasi ke dosen pembimbing sebelum mengajukan proposal.
        </span>
      </div>

      {step === "form" && (
        <div className="card" style={{ maxWidth: 600 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>Isi Kuesioner Singkat</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="th-prodi">Program Studi</label>
              <input id="th-prodi" className="form-input" value={form.programName} onChange={(e) => setForm({ ...form, programName: e.target.value })} placeholder="Teknik Informatika" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="th-interests">Bidang Minat * (pisahkan koma)</label>
              <input id="th-interests" className="form-input" value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} placeholder="Machine Learning, Pendidikan, UI/UX" required />
              <span className="form-hint">Contoh: Machine Learning, Sistem Informasi, Kesehatan Digital</span>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="th-methods">Metode Penelitian yang Diketahui (opsional)</label>
              <input id="th-methods" className="form-input" value={form.methods} onChange={(e) => setForm({ ...form, methods: e.target.value })} placeholder="Kualitatif, Survei, Eksperimen" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="th-data">Ketersediaan Data</label>
              <select id="th-data" className="form-input" value={form.dataAvailability} onChange={(e) => setForm({ ...form, dataAvailability: e.target.value })}>
                <option value="">Pilih...</option>
                <option value="Data primer tersedia melalui survei/wawancara">Data primer (survei/wawancara)</option>
                <option value="Dataset publik atau open-source">Dataset publik / open-source</option>
                <option value="Data dari institusi/perusahaan (perlu izin)">Data institusi (perlu izin)</option>
                <option value="Belum ada data, perlu dikumpulkan">Belum ada, perlu dikumpulkan</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="th-time">Waktu Tersedia untuk Skripsi</label>
              <select id="th-time" className="form-input" value={form.timeAvailable} onChange={(e) => setForm({ ...form, timeAvailable: e.target.value })}>
                <option value="">Pilih...</option>
                <option value="Kurang dari 1 semester">Kurang dari 1 semester</option>
                <option value="1 semester">1 semester</option>
                <option value="2 semester">2 semester</option>
                <option value="Lebih dari 2 semester">Lebih dari 2 semester</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="th-skills">Skills / Tools yang Dikuasai (opsional)</label>
              <input id="th-skills" className="form-input" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Python, SPSS, Figma, R" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="th-constraints">Kendala atau Batasan (opsional)</label>
              <input id="th-constraints" className="form-input" value={form.constraints} onChange={(e) => setForm({ ...form, constraints: e.target.value })} placeholder="Tidak bisa ke lapangan jauh, budget terbatas..." />
            </div>

            {error && (
              <div className="error-state">
                <AlertCircle size={16} color="var(--coral)" />
                <span style={{ fontSize: 13 }}>{error}</span>
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={submit}
              disabled={loading || !form.interests || !form.dataAvailability || !form.timeAvailable}
            >
              {loading ? "Menganalisis..." : (
                <>
                  <Lightbulb size={16} />
                  Dapatkan Arahan Topik
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {step === "result" && result && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setStep("form"); setResult(null); }}>
              ← Isi Ulang
            </button>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
              Arahan Topik Skripsi
            </h2>
          </div>

          {!result.isAiGenerated && (
            <div className="assumption-notice" style={{ marginBottom: 16 }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13 }}>{result.fallbackReason ?? "Arahan berbasis template otomatis."}</span>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {result.directions.map((d, i) => (
              <div key={i} className="card">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(245, 205, 71, 0.22)", border: "1px solid rgba(217, 119, 6, 0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#92400E" }}>{i + 1}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{d.topicArea}</div>
                    <span className="badge" style={{ background: `${feasibilityColors[d.feasibility]}15`, color: feasibilityColors[d.feasibility], fontSize: 11 }}>
                      {feasibilityLabels[d.feasibility]}
                    </span>
                  </div>
                </div>

                <div className="info-box" style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Contoh Pertanyaan Penelitian</div>
                  <div style={{ fontSize: 13 }}>{d.exampleQuestion}</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Metode</div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{d.possibleMethod}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Data yang Dibutuhkan</div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{d.dataRequired}</div>
                  </div>
                </div>

                {d.mainRisks.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: "var(--coral)", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Risiko</div>
                    {d.mainRisks.map((r, ri) => <div key={ri} style={{ fontSize: 13, color: "var(--text-secondary)" }}>• {r}</div>)}
                  </div>
                )}

                {d.firstSteps.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: "var(--amber-deep)", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Langkah Awal</div>
                    {d.firstSteps.map((s, si) => (
                      <div key={si} style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", gap: 6 }}>
                        <CheckCircle2 size={13} color="var(--forest-green)" style={{ flexShrink: 0, marginTop: 2 }} />
                        {s}
                      </div>
                    ))}
                  </div>
                )}

                {d.questionsForSupervisor.length > 0 && (
                  <div className="assumption-notice">
                    <BookOpen size={14} style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>Tanyakan ke Dosen Pembimbing:</div>
                      {d.questionsForSupervisor.map((q, qi) => (
                        <div key={qi} style={{ fontSize: 12 }}>• {q}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
