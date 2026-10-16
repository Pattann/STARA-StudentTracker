"use client";

import Link from "next/link";
import { Star } from "lucide-react";

export default function LoginPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--lime)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <Star size={24} color="#0B0C0E" fill="#0B0C0E" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>Masuk ke STARA</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>
            Belum punya akun? <Link href="/signup" style={{ color: "var(--lime)" }}>Daftar</Link>
          </p>
        </div>

        {/* Form Card */}
        <div className="card">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input id="email" type="email" className="form-input" placeholder="mahasiswa@email.com" disabled />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Kata Sandi</label>
              <input id="password" type="password" className="form-input" placeholder="••••••••" disabled />
            </div>
            <button className="btn btn-primary" disabled style={{ opacity: 0.7 }}>
              Masuk (Fitur Demo Belum Tersedia)
            </button>
          </div>
          <div className="divider" />
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>Ingin coba tanpa daftar?</p>
            <Link href="/demo" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
              Coba Mode Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
