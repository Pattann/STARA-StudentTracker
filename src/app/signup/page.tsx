"use client";

import Link from "next/link";
import { Star } from "lucide-react";

export default function SignupPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--lime)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <Star size={24} color="#0B0C0E" fill="#0B0C0E" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>Buat Akun STARA</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>
            Sudah punya akun? <Link href="/login" style={{ color: "var(--lime)" }}>Masuk</Link>
          </p>
        </div>

        <div className="card">
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
            {["Nama Lengkap", "Email", "Kata Sandi"].map((label) => (
              <div key={label} className="form-group">
                <label className="form-label" htmlFor={label.toLowerCase().replace(/\s/g, "-")}>{label}</label>
                <input id={label.toLowerCase().replace(/\s/g, "-")} type={label === "Kata Sandi" ? "password" : label === "Email" ? "email" : "text"} className="form-input" placeholder="..." disabled />
              </div>
            ))}
            <button className="btn btn-primary" disabled style={{ opacity: 0.7 }}>
              Daftar (Fitur Demo Belum Tersedia)
            </button>
          </div>
          <div className="divider" />
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>Coba dulu tanpa daftar</p>
            <Link href="/demo" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
              Masuk ke Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
