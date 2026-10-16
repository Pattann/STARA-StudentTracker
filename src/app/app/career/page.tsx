"use client";

import { useSession } from "@/features/session/context";
import { Compass, ArrowRight, Briefcase, GraduationCap, Rocket, Compass as CompassIcon } from "lucide-react";
import { useState } from "react";

const directions = [
  {
    value: "kerja",
    label: "Langsung Bekerja",
    icon: Briefcase,
    color: "var(--lime)",
    desc: "Terjun ke dunia profesional setelah lulus.",
    steps: ["Perbarui CV dan portofolio", "Aktif di LinkedIn dan job portal", "Ikuti interview preparation", "Daftar ke perusahaan target", "Bangun jaringan profesional"],
  },
  {
    value: "s2",
    label: "Lanjut S2 / S3",
    icon: GraduationCap,
    color: "var(--blue)",
    desc: "Melanjutkan studi ke jenjang yang lebih tinggi.",
    steps: ["Identifikasi program S2 yang relevan", "Pelajari syarat masuk dan beasiswa", "Siapkan TPA / TOEFL / IELTS", "Hubungi calon supervisor", "Siapkan research proposal"],
  },
  {
    value: "wirausaha",
    label: "Berwirausaha",
    icon: Rocket,
    color: "var(--coral)",
    desc: "Membangun bisnis atau startup sendiri.",
    steps: ["Identifikasi masalah yang ingin dipecahkan", "Validasi ide dengan calon pengguna", "Buat MVP sederhana", "Ikuti program inkubator atau akselerator", "Cari mentor bisnis"],
  },
  {
    value: "eksplorasi",
    label: "Eksplorasi Dulu",
    icon: CompassIcon,
    color: "var(--teal)",
    desc: "Masih mempertimbangkan berbagai opsi.",
    steps: ["Ikuti workshop atau kursus singkat di berbagai bidang", "Coba freelance project untuk test minat", "Lakukan career assessment", "Bicarakan dengan mentor atau alumni", "Beri waktu untuk refleksi"],
  },
];

export default function CareerPage() {
  const [selected, setSelected] = useState<string | null>(null);

  const selectedDir = directions.find((d) => d.value === selected);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>Rencana Setelah Lulus</h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Eksplorasi arah setelah kelulusan dan rencanakan langkah awal.</p>
      </div>

      <div className="assumption-notice" style={{ marginBottom: 20 }}>
        <Compass size={16} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13 }}>
          Ini bukan tes psikometri. Gunakan sebagai refleksi dan titik awal eksplorasi—bukan keputusan final.
        </span>
      </div>

      {!selected ? (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
            Apa arahmu setelah lulus?
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
            {directions.map((d) => (
              <div
                key={d.value}
                className="scenario-card"
                onClick={() => setSelected(d.value)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setSelected(d.value)}
                aria-label={d.label}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${d.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <d.icon size={20} color={d.color} />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{d.label}</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{d.desc}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 12, color: "var(--text-muted)", fontSize: 12 }}>
                  Lihat rencana aksi <ArrowRight size={12} />
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12 }}>
            💡 Kamu bisa memilih lebih dari satu arah. Eksplorasi tidak terbatas!
          </p>
        </div>
      ) : selectedDir && (
        <div>
          <button className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }} onClick={() => setSelected(null)}>
            ← Pilih Ulang
          </button>
          <div className="card" style={{ maxWidth: 600 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${selectedDir.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <selectedDir.icon size={24} color={selectedDir.color} />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>{selectedDir.label}</h2>
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{selectedDir.desc}</p>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                Rencana Aksi
              </div>
              {selectedDir.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: `${selectedDir.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: selectedDir.color }}>{i + 1}</span>
                  </div>
                  <span style={{ fontSize: 14, color: "var(--text-secondary)", paddingTop: 2 }}>{step}</span>
                </div>
              ))}
            </div>
            <div className="info-box" style={{ marginTop: 16 }}>
              Kamu bisa mengeksplorasi beberapa arah sekaligus. Pilih sesuai nilai dan situasimu saat ini.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
