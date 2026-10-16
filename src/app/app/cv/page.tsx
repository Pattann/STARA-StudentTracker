"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/features/session/context";
import { FileText, Download, AlertCircle } from "lucide-react";
import { parseJsonSafe } from "@/lib/utils";
import { ACHIEVEMENT_CATEGORIES } from "@/lib/constants";

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
  includeInCv: boolean;
};

export default function CVPage() {
  const { token } = useSession();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch("/api/achievements", { headers: { "x-demo-token": token } })
      .then((r) => r.json())
      .then((d: { achievements: Achievement[] }) => { setAchievements(d.achievements ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const cvItems = achievements.filter((a) => a.includeInCv);
  const categoryColors: Record<string, string> = {
    magang: "#ea580c", organisasi: "#0d9488", proyek: "#2563eb",
    lomba: "#65a30d", sertifikasi: "#7c3aed", akademik: "#0d9488",
    relawan: "#dc2626", lainnya: "#6b7280",
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>CV Preview</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Pratinjau CV berbasis prestasi yang kamu catat.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => window.print()} aria-label="Cetak CV">
          <Download size={14} /> Cetak / Unduh PDF
        </button>
      </div>

      <div className="assumption-notice" style={{ marginBottom: 16 }}>
        <AlertCircle size={14} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 12 }}>
          Kelola item CV di halaman <a href="/app/achievements" style={{ color: "var(--lime)" }}>Prestasi</a>. Centang "Di CV" untuk menambahkan item ke sini.
        </span>
      </div>

      {/* Print area */}
      <div id="cv-content" style={{ background: "white", borderRadius: "var(--radius-lg)", padding: 40, color: "#1a1a1a" }}>
        {/* Header */}
        <div style={{ borderBottom: "3px solid #1a1a1a", paddingBottom: 16, marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#1a1a1a", marginBottom: 4 }}>Budi Santoso</h1>
          <div style={{ fontSize: 14, color: "#444", marginBottom: 2 }}>Teknik Informatika • Universitas Nusantara Maju</div>
          <div style={{ fontSize: 13, color: "#666" }}>Angkatan 2022 • Semester 5 • IPK 3.42</div>
        </div>

        {loading ? (
          <p style={{ fontSize: 14, color: "#999" }}>Memuat data...</p>
        ) : cvItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#999" }}>
            <FileText size={32} style={{ margin: "0 auto 12px" }} />
            <p>Belum ada prestasi yang dipilih untuk CV.</p>
            <p style={{ fontSize: 13 }}>Pergi ke halaman Prestasi dan klik tombol "Ke CV" pada item yang ingin ditampilkan.</p>
          </div>
        ) : (
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Pengalaman & Prestasi</h2>
            {cvItems.map((a) => (
              <div key={a.id} style={{ marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid #eee" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>{a.title}</div>
                    {a.role && <div style={{ fontSize: 13, color: "#444", fontStyle: "italic" }}>{a.role}</div>}
                    <div style={{ fontSize: 12, color: categoryColors[a.category] ?? "#888", fontWeight: 600, marginTop: 2 }}>
                      {ACHIEVEMENT_CATEGORIES[a.category as keyof typeof ACHIEVEMENT_CATEGORIES] ?? a.category}
                    </div>
                  </div>
                  {(a.startDate || a.endDate) && (
                    <div style={{ fontSize: 12, color: "#888", textAlign: "right", flexShrink: 0 }}>
                      <div>{a.startDate}</div>
                      {a.endDate && <div>— {a.endDate}</div>}
                    </div>
                  )}
                </div>
                <p style={{ fontSize: 13, color: "#555", marginTop: 6, lineHeight: 1.6 }}>{a.description}</p>
                {a.impact && (
                  <div style={{ fontSize: 12, color: "#333", fontWeight: 600, marginTop: 4 }}>
                    📈 {a.impact}
                  </div>
                )}
                {parseJsonSafe<string[]>(a.skills, []).length > 0 && (
                  <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                    <strong>Skills:</strong> {parseJsonSafe<string[]>(a.skills, []).join(" • ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 20, paddingTop: 12, borderTop: "1px solid #eee", fontSize: 11, color: "#aaa", textAlign: "center" }}>
          Dibuat dengan STARA — Student Tracking and Academic Roadmap Assistant
        </div>
      </div>

      <style>{`@media print { body > *:not(#cv-content) { display: none; } #cv-content { margin: 0; padding: 24px; } }`}</style>
    </div>
  );
}
