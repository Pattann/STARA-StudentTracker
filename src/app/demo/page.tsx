"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Star, RefreshCw, AlertCircle } from "lucide-react";

export default function DemoPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const startDemo = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/demo/start", { method: "POST" });
      if (!res.ok) throw new Error("Gagal memulai sesi demo.");
      const { token } = await res.json() as { token: string };
      localStorage.setItem("stara_demo_token", token);
      router.push("/app");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
      setStatus("error");
    }
  }, [router]);

  useEffect(() => {
    // Check if existing session is valid first
    const existing = localStorage.getItem("stara_demo_token");
    if (existing) {
      fetch(`/api/demo/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: existing }),
      })
        .then((r) => r.json())
        .then((data: { valid: boolean }) => {
          if (data.valid) {
            router.push("/app");
          } else {
            startDemo();
          }
        })
        .catch(() => startDemo());
    } else {
      startDemo();
    }
  }, [router, startDemo]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: 24,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: "var(--lime)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Star size={32} color="#0B0C0E" fill="#0B0C0E" />
      </div>

      {status === "loading" && (
        <>
          <div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "var(--text-primary)",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Menyiapkan Demo...
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-secondary)",
                textAlign: "center",
              }}
            >
              Sedang memuat data simulasi untuk akun demo STARA.
            </p>
          </div>
          <div
            style={{
              width: 40,
              height: 40,
              border: "3px solid var(--border)",
              borderTop: "3px solid var(--lime)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}

      {status === "error" && (
        <>
          <div className="error-state">
            <AlertCircle size={32} color="var(--coral)" />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
              Gagal Memulai Demo
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              {error}
            </p>
            <button className="btn btn-primary" onClick={startDemo}>
              <RefreshCw size={16} />
              Coba Lagi
            </button>
          </div>
        </>
      )}
    </div>
  );
}
