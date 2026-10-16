"use client";

import { useSession } from "@/features/session/context";
import { User, GraduationCap, Settings, AlertCircle, RefreshCw } from "lucide-react";

export default function ProfilePage() {
  const { token, resetDemo } = useSession();

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>Profil & Pengaturan</h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Kelola data akademik dan preferensi akunmu.</p>
      </div>

      {/* Profile Header */}
      <div className="card" style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--bg-secondary)", border: "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <User size={28} color="var(--text-muted)" />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>Budi Santoso</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Teknik Informatika • Universitas Nusantara Maju</div>
          {token && <span className="badge badge-lime" style={{ marginTop: 4 }}>Mode Demo</span>}
        </div>
      </div>

      {/* Academic Profile */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <GraduationCap size={18} color="var(--teal)" />
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Profil Akademik</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 14 }}>
          {[
            { label: "Institusi", value: "Universitas Nusantara Maju" },
            { label: "Program Studi", value: "Teknik Informatika" },
            { label: "Angkatan", value: "2022" },
            { label: "Semester Saat Ini", value: "5" },
            { label: "SKS Selesai", value: "84 SKS" },
            { label: "Total SKS Kurikulum", value: "144 SKS" },
            { label: "IPK", value: "3.42" },
            { label: "Goal Studi", value: "Seimbang" },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</div>
              <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{item.value}</div>
            </div>
          ))}
        </div>
        <div className="assumption-notice" style={{ marginTop: 14 }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12 }}>Data profil akademik adalah data demo. Di akun resmi, kamu bisa mengedit semua data ini.</span>
        </div>
      </div>

      {/* Settings */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Settings size={18} color="var(--blue)" />
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Pengaturan</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "TAK / Poin Kegiatan", value: "Aktif (target 120 poin)" },
            { label: "Notifikasi", value: "Mati (demo mode)" },
            { label: "Tampilan di Komunitas", value: "Anonim" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, paddingBottom: 10, borderBottom: "1px solid var(--border-subtle)" }}>
              <span style={{ color: "var(--text-secondary)" }}>{item.label}</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Actions */}
      {token && (
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>Aksi Demo</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14 }}>
            Reset akan mengembalikan semua data demo ke kondisi awal. Perubahan yang kamu buat di sesi ini akan hilang.
          </p>
          <button className="btn btn-danger btn-sm" onClick={resetDemo}>
            <RefreshCw size={14} />
            Reset Data Demo
          </button>
        </div>
      )}
    </div>
  );
}
