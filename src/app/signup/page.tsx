"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, AlertCircle, Sparkles } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json() as {
        success?: boolean;
        token?: string;
        user?: { id: string; name: string; email: string };
        hasCompletedOnboarding?: boolean;
        redirectUrl?: string;
        error?: string;
      };

      if (!res.ok || !data.token) {
        throw new Error(data.error || "Gagal mendaftar. Periksa kembali informasi Anda.");
      }

      localStorage.setItem("stara_demo_token", data.token);
      if (data.user) {
        localStorage.setItem("stara_user", JSON.stringify(data.user));
      }

      // First time registered user always goes directly to onboarding
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at top, #161D18 0%, #0B0D0C 70%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 16 }}>
            <img
              src="/whitestara.svg"
              alt="Logo STARA"
              width={38}
              height={38}
              style={{ width: 38, height: 38, objectFit: "contain" }}
            />
            <span style={{ fontSize: 24, fontWeight: 900, color: "#F5F5F0", letterSpacing: "-0.02em" }}>
              STARA
            </span>
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#F5F5F0", margin: "0 0 6px" }}>
            Buat Akun Mahasiswa
          </h1>
          <p style={{ fontSize: 14, color: "#A4AAA5", margin: 0 }}>
            Rencanakan kuliah, pantau SKS, dan capai wisuda tepat waktu
          </p>
        </div>

        {/* Card Form */}
        <div
          style={{
            background: "linear-gradient(180deg, rgba(24, 29, 26, 0.9) 0%, rgba(14, 17, 15, 0.95) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.09)",
            borderRadius: 22,
            padding: "32px 28px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            backdropFilter: "blur(20px)",
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "rgba(255, 122, 69, 0.12)",
                  border: "1px solid rgba(255, 122, 69, 0.35)",
                  color: "#FF9E66",
                  padding: "12px 14px",
                  borderRadius: 12,
                  fontSize: 13,
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#D4D9D5", display: "block", marginBottom: 6 }}>
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Misal: Budi Santoso"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "rgba(0,0,0,0.45)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#F5F5F0",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#D4D9D5", display: "block", marginBottom: 6 }}>
                Email Mahasiswa / Kampus
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@student.ac.id"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "rgba(0,0,0,0.45)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#F5F5F0",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#D4D9D5", display: "block", marginBottom: 6 }}>
                Kata Sandi (Minimal 6 Karakter)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "12px 42px 12px 14px",
                    borderRadius: 12,
                    background: "rgba(0,0,0,0.45)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#F5F5F0",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#A4AAA5",
                    cursor: "pointer",
                    padding: 4,
                  }}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(245, 205, 71, 0.08)",
                border: "1px solid rgba(245, 205, 71, 0.2)",
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: 12,
                color: "var(--lime)",
              }}
            >
              <Sparkles size={15} style={{ flexShrink: 0 }} />
              <span>Setelah mendaftar, kamu akan diarahkan ke panduan onboarding STARA.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                background: "var(--lime)",
                color: "#0B0D0C",
                fontWeight: 800,
                fontSize: 14.5,
                padding: "13px",
                borderRadius: "var(--radius-pill)",
                border: "none",
                cursor: loading ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 4px 18px rgba(245, 205, 71, 0.35)",
                transition: "all 0.2s ease",
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      border: "2px solid #0B0D0C",
                      borderTop: "2px solid transparent",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <span>Membuat Akun...</span>
                </>
              ) : (
                <>
                  <span>Daftar & Mulai Onboarding</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div
            style={{
              marginTop: 24,
              paddingTop: 18,
              borderTop: "1px solid rgba(255,255,255,0.07)",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: 13, color: "#A4AAA5" }}>
              Sudah memiliki akun?{" "}
              <Link href="/login" style={{ color: "var(--lime)", fontWeight: 700, textDecoration: "none" }}>
                Masuk di Sini
              </Link>
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
