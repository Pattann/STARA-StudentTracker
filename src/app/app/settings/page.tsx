"use client";

import { Settings, Bell, Eye, Trash2 } from "lucide-react";

export default function SettingsPage() {
  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>Pengaturan</h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Atur privasi, notifikasi, dan preferensi tampilan.</p>
      </div>

      {[
        {
          icon: Bell, color: "var(--lime)", title: "Notifikasi",
          items: [
            { label: "Pengingat deadline", value: "Aktif" },
            { label: "Notifikasi email", value: "Mati" },
          ],
        },
        {
          icon: Eye, color: "var(--teal)", title: "Privasi",
          items: [
            { label: "Tampilan nama di komunitas", value: "Anonim" },
            { label: "Template saya terlihat publik", value: "Tidak" },
          ],
        },
        {
          icon: Settings, color: "var(--blue)", title: "Tampilan",
          items: [
            { label: "Bahasa", value: "Bahasa Indonesia" },
            { label: "Format tanggal", value: "dd MMM yyyy (id-ID)" },
          ],
        },
      ].map((section) => (
        <div key={section.title} className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <section.icon size={18} color={section.color} />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{section.title}</h2>
          </div>
          {section.items.map((item) => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
              <span style={{ color: "var(--text-secondary)" }}>{item.label}</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{item.value}</span>
            </div>
          ))}
        </div>
      ))}

      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Trash2 size={18} color="var(--coral)" />
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Data & Privasi</h2>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14 }}>
          Di mode demo, data tersimpan di server dengan session token. Data akan dihapus otomatis setelah 24 jam.
        </p>
        <button className="btn btn-danger btn-sm" disabled>
          Hapus Semua Data Saya
        </button>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
          Fitur hapus data hanya tersedia untuk akun terdaftar.
        </p>
      </div>
    </div>
  );
}
