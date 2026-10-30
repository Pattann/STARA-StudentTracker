"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, AlertCircle, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    router.prefetch("/app");
    router.prefetch("/admin");
    router.prefetch("/onboarding");
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        token?: string;
        user?: { id: string; name: string; email: string; role?: string };
        hasCompletedOnboarding?: boolean;
        redirectUrl?: string;
        error?: string;
      };

      if (!res.ok || !data.token) {
        throw new Error(data.error || "Gagal masuk. Periksa kembali email/username dan kata sandi.");
      }

      localStorage.setItem("stara_demo_token", data.token);
      if (data.user) {
        localStorage.setItem("stara_user", JSON.stringify(data.user));
      }

      // Automatically routes to /admin if admin, or /app if student
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else if (data.user?.role === "admin") {
        router.push("/admin");
      } else {
        router.push(data.hasCompletedOnboarding ? "/app" : "/onboarding");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat masuk.");
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setDemoLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/demo/start", { method: "POST" });
      const data = (await res.json()) as { token: string };
      if (!res.ok || !data.token) throw new Error("Gagal memulai sesi demo.");

      localStorage.setItem("stara_demo_token", data.token);
      localStorage.setItem(
        "stara_user",
        JSON.stringify({
          id: "demo-student",
          name: "Mahasiswa STARA",
          email: "mahasiswa@student.stara.ac.id",
          role: "student",
        })
      );
      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memulai demo.");
      setDemoLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base, #FAF9F5)",
        color: "#0F172A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 430 }}>
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              marginBottom: 14,
            }}
          >
            <img
              src="/blackstara.svg"
              alt="Logo STARA"
              width={34}
              height={34}
              style={{ width: 34, height: 34, objectFit: "contain", display: "block" }}
            />
            <span
              style={{
                fontSize: 23,
                fontWeight: 900,
                color: "#0F172A",
                letterSpacing: "-0.02em",
              }}
            >
              STARA
            </span>
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Masuk ke STARA
          </h1>
          <p style={{ fontSize: 13.5, color: "#64748B", margin: "0 auto", maxWidth: 350, lineHeight: 1.55 }}>
            STARA membantu mahasiswa merencanakan kuliah sampai lulus: roadmap per semester, simulasi &quot;bagaimana jika&quot;, dan panduan skripsi.
          </p>
        </div>

        {/* Card Form */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: 20,
            padding: "32px 28px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)",
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {error && (
              <div
                role="alert"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "#FEF2F2",
                  border: "1px solid #FCA5A5",
                  color: "#991B1B",
                  padding: "11px 14px",
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="input-user-identifier"
                style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", display: "block", marginBottom: 6 }}
              >
                Email atau Username
              </label>
              <input
                type="text"
                required
                id="input-user-identifier"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com atau username"
                className="form-input"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: 10,
                  background: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  color: "#0F172A",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="input-user-password"
                style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", display: "block", marginBottom: 6 }}
              >
                Kata Sandi
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  id="input-user-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                  style={{
                    width: "100%",
                    padding: "11px 42px 11px 14px",
                    borderRadius: 10,
                    background: "#FFFFFF",
                    border: "1px solid #CBD5E1",
                    color: "#0F172A",
                    fontSize: 14,
                    boxSizing: "border-box",
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
                    color: "#64748B",
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || demoLoading}
              id="btn-login-submit"
              className="btn-login-gold"
              style={{
                marginTop: 4,
                background: "#D97706",
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: 14,
                padding: "12px 18px",
                borderRadius: "var(--radius-pill)",
                border: "none",
                cursor: loading ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 2px 10px rgba(217, 119, 6, 0.3)",
                transition: "all 0.15s ease",
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      border: "2px solid #FFFFFF",
                      borderTop: "2px solid transparent",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <span>Memeriksa Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke STARA</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Button for Students */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
              <span style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600 }}>atau, belum mau daftar?</span>
              <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
            </div>
            <button
              type="button"
              id="btn-quick-demo-student"
              className="btn-demo-outline"
              onClick={handleQuickDemo}
              disabled={loading || demoLoading}
              style={{
                width: "100%",
                background: "#FFFBEB",
                border: "1px solid #FDE68A",
                color: "#92400E",
                fontSize: 13,
                fontWeight: 700,
                padding: "10px 14px",
                borderRadius: "var(--radius-pill)",
                cursor: demoLoading ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.15s ease",
              }}
            >
              <Sparkles size={14} color="#D97706" />
              <span>{demoLoading ? "Memuat Sesi Demo..." : "Coba Demo dengan Data Contoh"}</span>
            </button>
            <p style={{ fontSize: 11.5, color: "#64748B", textAlign: "center", margin: "8px 0 0" }}>
              Tanpa akun. Data contoh hanya untuk mencoba fitur.
            </p>
          </div>

          {/* Signup link */}
          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: "1px solid #E2E8F0",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: 13, color: "#475569" }}>
              Belum punya akun?{" "}
              <Link href="/signup" style={{ color: "#B45309", fontWeight: 700, textDecoration: "none" }}>
                Daftar Sekarang
              </Link>
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .btn-login-gold:hover:not(:disabled) {
          background-color: #B45309 !important;
          box-shadow: 0 4px 14px rgba(217, 119, 6, 0.4) !important;
        }
        .btn-demo-outline:hover:not(:disabled) {
          background-color: #FEF3C7 !important;
          border-color: #FCD34D !important;
        }
      `}</style>
    </div>
  );
}
