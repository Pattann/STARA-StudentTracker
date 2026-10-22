"use client";

import { useSession } from "@/features/session/context";
import { User, GraduationCap, Settings, LogOut, Sparkles } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { token, user, clearSession } = useSession();

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>Profil & Pengaturan</h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Kelola data akademik dan akun mahasiswa STARA.</p>
      </div>

      {/* Profile Header */}
      <div className="card" style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--bg-secondary)", border: "2px solid var(--lime)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <User size={28} color="var(--lime)" />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{user?.name || "Mahasiswa STARA"}</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{user?.email || "Akun Terverifikasi"}</div>
          <span className="badge badge-lime" style={{ marginTop: 4 }}>Akun Mahasiswa Aktif</span>
        </div>
      </div>

      {/* Academic Profile */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <GraduationCap size={18} color="var(--teal)" />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Profil Akademik</h2>
          </div>
          <Link href="/onboarding" style={{ fontSize: 12, fontWeight: 700, color: "var(--lime)", display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
            <Sparkles size={14} />
            <span>Setup Ulang Onboarding</span>
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 14 }}>
          {[
            { label: "Status Sesi", value: "Terverifikasi" },
            { label: "Akses Fitur", value: "Semua Modul Aktif" },
            { label: "Mode Perencanaan", value: "Roadmap Adaptif" },
            { label: "Pusat Template", value: "Kerjasama & Komunitas" },
          ].map((item) => (
            <div key={item.label} style={{ background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Account Actions */}
      <div className="card">
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>Aksi Akun</h2>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14 }}>
          Keluar dari sesi ini dan kembali ke halaman masuk.
        </p>
        <button
          className="btn btn-sm"
          onClick={clearSession}
          style={{
            background: "rgba(255, 122, 69, 0.12)",
            color: "#FF9E66",
            border: "1px solid rgba(255, 122, 69, 0.3)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <LogOut size={14} />
          <span>Keluar dari Akun</span>
        </button>
      </div>
    </div>
  );
}
