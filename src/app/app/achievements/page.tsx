"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/features/session/context";
import { ACHIEVEMENT_CATEGORIES } from "@/lib/constants";
import { parseJsonSafe } from "@/lib/utils";
import { Award, Plus, AlertCircle, CheckCircle2, FileText } from "lucide-react";

type Achievement = {
  id: string;
  title: string;
  category: string;
  role?: string | null;
  description: string;
  startDate?: string | null;
  endDate?: string | null;
  impact?: string | null;
  skills: string;
  evidenceUrl?: string | null;
  includeInCv: boolean;
};

type Tab = "list" | "add" | "cv";

export default function AchievementsPage() {
  const { token } = useSession();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("list");
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", category: "magang", role: "", description: "", startDate: "", endDate: "", impact: "", skills: "", evidenceUrl: "", includeInCv: true,
  });

  const fetchAchievements = () => {
    if (!token) return;
    fetch("/api/achievements", { headers: { "x-demo-token": token } })
      .then((r) => r.json())
      .then((d: { achievements: Achievement[] }) => { setAchievements(d.achievements ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchAchievements(); }, [token]);

  const saveAchievement = async () => {
    if (!token || !form.title || !form.description) return;
    setSaving(true);
    const res = await fetch("/api/achievements", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-demo-token": token },
      body: JSON.stringify({ ...form, skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean) }),
    });
    const data = await res.json() as { achievement?: Achievement; error?: string };
    if (data.achievement) {
      setAchievements((prev) => [data.achievement!, ...prev]);
      setForm({ title: "", category: "magang", role: "", description: "", startDate: "", endDate: "", impact: "", skills: "", evidenceUrl: "", includeInCv: true });
      setTab("list");
      setToast("✓ Prestasi disimpan");
      setTimeout(() => setToast(null), 3000);
    }
    setSaving(false);
  };

  const toggleCv = async (id: string, current: boolean) => {
    if (!token) return;
    await fetch("/api/achievements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-demo-token": token },
      body: JSON.stringify({ id, includeInCv: !current }),
    });
    setAchievements((prev) => prev.map((a) => a.id === id ? { ...a, includeInCv: !current } : a));
  };

  const cvItems = achievements.filter((a) => a.includeInCv);
  const categoryColors: Record<string, string> = {
    magang: "var(--orange)", organisasi: "var(--teal)", proyek: "var(--blue)",
    lomba: "var(--amber)", sertifikasi: "var(--purple)", akademik: "var(--teal)",
    relawan: "var(--coral)", lainnya: "var(--text-muted)",
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>Prestasi & CV</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Catat pencapaian akademik dan non-akademik.</p>
        </div>
        <div className="tabs">
          <button className={`tab ${tab === "list" ? "active" : ""}`} onClick={() => setTab("list")}>Daftar</button>
          <button className={`tab ${tab === "add" ? "active" : ""}`} onClick={() => setTab("add")}>+ Tambah</button>
          <button className={`tab ${tab === "cv" ? "active" : ""}`} onClick={() => setTab("cv")}>
            <FileText size={13} /> CV Preview
          </button>
        </div>
      </div>

      {/* List Tab */}
      {tab === "list" && (
        <div>
          {loading ? (
            [1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 100, marginBottom: 12 }} />)
          ) : achievements.length === 0 ? (
            <div className="empty-state">
              <Award size={36} color="var(--text-muted)" />
              <p style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Belum ada prestasi tercatat</p>
              <button className="btn btn-primary btn-sm" onClick={() => setTab("add")}>
                <Plus size={14} /> Tambah Prestasi
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {achievements.map((a) => (
                <div key={a.id} className="achievement-card">
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `${categoryColors[a.category] ?? "var(--text-muted)"}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Award size={20} color={categoryColors[a.category] ?? "var(--text-muted)"} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{a.title}</span>
                      <span className="badge" style={{ background: `${categoryColors[a.category] ?? "var(--text-muted)"}15`, color: categoryColors[a.category] ?? "var(--text-muted)", fontSize: 11 }}>
                        {ACHIEVEMENT_CATEGORIES[a.category as keyof typeof ACHIEVEMENT_CATEGORIES] ?? a.category}
                      </span>
                    </div>
                    {a.role && <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>{a.role}</div>}
                    <p className="line-clamp-2" style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{a.description}</p>
                    {a.impact && <div style={{ fontSize: 12, color: "var(--forest-green)", fontWeight: 600, marginTop: 4 }}>📈 {a.impact}</div>}
                    <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                      {parseJsonSafe<string[]>(a.skills, []).slice(0, 4).map((s) => (
                        <span key={s} className="badge badge-gray" style={{ fontSize: 11 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleCv(a.id, a.includeInCv)}
                    className={`btn btn-sm ${a.includeInCv ? "btn-primary" : "btn-secondary"}`}
                    style={{ flexShrink: 0 }}
                    aria-label={a.includeInCv ? "Hapus dari CV" : "Tambahkan ke CV"}
                    title={a.includeInCv ? "Hapus dari CV" : "Tambahkan ke CV"}
                  >
                    <CheckCircle2 size={14} />
                    {a.includeInCv ? "Di CV" : "Ke CV"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Tab */}
      {tab === "add" && (
        <div className="card" style={{ maxWidth: 600 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>Tambah Prestasi</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="a-title">Judul *</label>
              <input id="a-title" className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Juara 1 Hackathon..." required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="a-cat">Kategori</label>
                <select id="a-cat" className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {Object.entries(ACHIEVEMENT_CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="a-role">Peran (opsional)</label>
                <input id="a-role" className="form-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Lead Developer" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="a-start">Tanggal Mulai</label>
                <input id="a-start" type="date" className="form-input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="a-end">Tanggal Selesai</label>
                <input id="a-end" type="date" className="form-input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="a-desc">Deskripsi *</label>
              <textarea id="a-desc" className="form-input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Jelaskan apa yang kamu lakukan..." style={{ resize: "vertical" }} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="a-impact">Dampak / Hasil (opsional)</label>
              <input id="a-impact" className="form-input" value={form.impact} onChange={(e) => setForm({ ...form, impact: e.target.value })} placeholder="Memenangkan Rp 5.000.000..." />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="a-skills">Skills (pisahkan dengan koma)</label>
              <input id="a-skills" className="form-input" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="React, Node.js, Teamwork" />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" onClick={saveAchievement} disabled={!form.title || !form.description || saving}>
                {saving ? "Menyimpan..." : "Simpan Prestasi"}
              </button>
              <button className="btn btn-secondary" onClick={() => setTab("list")}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* CV Preview Tab */}
      {tab === "cv" && (
        <div>
          <div className="assumption-notice" style={{ marginBottom: 20 }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13 }}>Pratinjau CV sederhana. Gunakan Print Browser (Ctrl+P) untuk menyimpan sebagai PDF.</span>
          </div>
          <div style={{ background: "white", borderRadius: "var(--radius-lg)", padding: 32, maxWidth: 700, color: "#1a1a1a" }} id="cv-preview">
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", marginBottom: 4 }}>Budi Santoso</h1>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>Teknik Informatika • Universitas Nusantara Maju</p>
            <div style={{ borderTop: "2px solid #eee", paddingTop: 16 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#333", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Prestasi & Pengalaman</h2>
              {cvItems.length === 0 ? (
                <p style={{ fontSize: 13, color: "#999" }}>Tidak ada item yang dipilih untuk CV.</p>
              ) : (
                cvItems.map((a) => (
                  <div key={a.id} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{a.title}</div>
                        {a.role && <div style={{ fontSize: 13, color: "#444" }}>{a.role}</div>}
                      </div>
                      {(a.startDate || a.endDate) && (
                        <div style={{ fontSize: 12, color: "#888", flexShrink: 0 }}>
                          {a.startDate} {a.endDate ? `— ${a.endDate}` : ""}
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: "#555", marginTop: 4, lineHeight: 1.5 }}>{a.description}</p>
                    {a.impact && <p style={{ fontSize: 12, color: "#333", fontWeight: 600, marginTop: 4 }}>Dampak: {a.impact}</p>}
                    {parseJsonSafe<string[]>(a.skills, []).length > 0 && (
                      <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                        Skills: {parseJsonSafe<string[]>(a.skills, []).join(", ")}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => window.print()}>
            🖨 Cetak / Simpan PDF
          </button>
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.startsWith("✓") ? "success" : "error"}`}>{toast}</div>
        </div>
      )}
    </div>
  );
}
