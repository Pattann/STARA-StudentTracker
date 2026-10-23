"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  Star,
  ArrowRight,
  ArrowUpRight,
  Compass,
  GitBranch,
  Zap,
  BookOpen,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Calendar,
  Layers,
  GraduationCap,
  Briefcase,
  Megaphone,
  Laptop,
  Check,
  Target,
  Flame,
  BarChart3,
  Code,
  FileText,
  SlidersHorizontal,
} from "lucide-react";

export default function HomePage() {
  const [activeNav, setActiveNav] = useState("beranda");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFeatureTab, setActiveFeatureTab] = useState<number>(0);
  const fiturScrollRef = useRef<HTMLDivElement>(null);

  const scrollFitur = (direction: "left" | "right") => {
    if (fiturScrollRef.current) {
      const amount = direction === "left" ? -340 : 340;
      fiturScrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  // Monitor scroll for navbar elevation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { id: "beranda", label: "Beranda", href: "#beranda" },
    { id: "fitur", label: "Fitur", href: "#fitur" },
    { id: "cara-kerja", label: "Cara Kerja", href: "#cara-kerja" },
    { id: "tentang", label: "Tentang", href: "#tentang" },
  ];

  return (
    <div
      className="landing-page"
      id="beranda"
      style={{
        backgroundColor: "#FAF9F5",
        color: "#18181B",
        minHeight: "100vh",
        position: "relative",
        width: "100%",
        overflowX: "hidden",
      }}
    >
      {/* Background ambient lighting */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: "1400px",
          height: "900px",
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(245,205,71,0.14) 0%, rgba(245,205,71,0.03) 50%, transparent 80%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      {/* ============================================================
          1. NAVBAR (Horizontal Capsule Pill)
         ============================================================ */}
      <header className="stara-nav-wrapper">
        <nav
          className="stara-pill-nav"
          style={{
            borderColor: scrolled ? "rgba(0, 0, 0, 0.10)" : "rgba(0, 0, 0, 0.07)",
            background: scrolled ? "rgba(255, 255, 255, 0.94)" : "rgba(255, 255, 255, 0.90)",
            boxShadow: scrolled
              ? "0 12px 32px -4px rgba(28, 25, 23, 0.08), 0 2px 6px -1px rgba(28, 25, 23, 0.03)"
              : "0 8px 24px -4px rgba(28, 25, 23, 0.05), 0 2px 6px -1px rgba(28, 25, 23, 0.02)",
          }}
          aria-label="Navigasi Utama STARA"
        >
          {/* Logo Brand */}
          <Link href="#beranda" className="stara-logo-link" aria-label="STARA Beranda" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div className="stara-logo-mark">
              <img
                src="/blackstara.svg"
                alt="Logo STARA"
                width={28}
                height={28}
                style={{ width: 28, height: 28, objectFit: "contain", display: "block" }}
              />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", color: "#111827" }}>STARA</span>
          </Link>

          {/* Center Navigation Links (Desktop) - Clean typography without nested shapes */}
          <div className="stara-nav-links hidden-mobile-flex">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                className={`stara-nav-link ${activeNav === link.id ? "active" : ""}`}
                onClick={() => setActiveNav(link.id)}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Action Buttons */}
          <div className="stara-nav-actions">
            <Link href="/login" className="stara-btn-ghost">
              Masuk
            </Link>
            <Link href="/demo" className="stara-btn-primary">
              <span>Mulai Gratis</span>
              <ArrowUpRight size={15} />
            </Link>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              className="show-mobile-flex"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-primary)",
                padding: "6px",
                cursor: "pointer",
                borderRadius: "var(--radius-pill)",
                display: "none",
              }}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" role="dialog" aria-modal="true">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="stara-logo-mark">
                <img
                  src="/blackstara.svg"
                  alt="Logo STARA"
                  width={28}
                  height={28}
                  style={{ width: 28, height: 28, objectFit: "contain", display: "block" }}
                />
              </div>
              <span style={{ fontWeight: 800, fontSize: 19, color: "#111827" }}>STARA</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={{ background: "transparent", border: "none", color: "var(--text-secondary)", padding: 8 }}
              aria-label="Tutup menu"
            >
              <X size={24} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                className="mobile-nav-link"
                onClick={() => {
                  setActiveNav(link.id);
                  setMobileMenuOpen(false);
                }}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
            <Link
              href="/login"
              className="stara-btn-secondary"
              style={{ justifyContent: "center", padding: "12px" }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Masuk ke Akun
            </Link>
            <Link
              href="/demo"
              className="stara-btn-primary"
              style={{ justifyContent: "center", padding: "12px" }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>Mulai Gratis</span>
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* ============================================================
          2. HERO SECTION
         ============================================================ */}
      <section className="stara-hero">
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 10 }}>
          {/* Clean Minimalist Eyebrow Badge */}
          <div className="stara-eyebrow">
            <span className="stara-eyebrow-dot" />
            <span>Rencanakan Kuliah, Raih Tujuanmu</span>
          </div>

          {/* Two-Line Editorial Headline */}
          <h1 className="stara-headline">
            <span className="stara-headline-line1">Rancang Perjalananmu.</span>
            <span className="stara-headline-line2">Capai Lebih Banyak.</span>
          </h1>

          {/* Description */}
          <p className="stara-desc">
            Rancang roadmap studi terintegrasi dari semester awal hingga wisuda. Pantau capaian SKS, simulasikan magang atau MBKM secara adaptif, dan ambil keputusan akademik dengan percaya diri bersama STARA.
          </p>

          {/* CTA Buttons */}
          <div className="stara-cta-group">
            <Link
              href="/app/onboarding"
              className="stara-btn-primary hero-btn-primary"
            >
              <span>Mulai Perjalanan</span>
              <ArrowUpRight size={16} />
            </Link>
            <Link
              href="/demo"
              className="stara-btn-secondary hero-btn-secondary"
            >
              Jelajahi Demo
            </Link>
          </div>
        </div>

        <div className="hero-layered-cards-wrapper" role="region" aria-label="Visualisasi Roadmap Akademik STARA">
          {/* Ambient Stage Pedestal Glow - Unifies CTA & Cards */}
          <div
            style={{
              position: "absolute",
              top: "-50px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "80%",
              maxWidth: 920,
              height: "440px",
              background: "radial-gradient(ellipse 65% 50% at 50% 25%, rgba(245, 205, 71, 0.24) 0%, rgba(245, 205, 71, 0.05) 50%, transparent 75%)",
              filter: "blur(28px)",
              pointerEvents: "none",
              zIndex: 1,
            }}
            aria-hidden="true"
          />

          {/* Floating Badges - Editorial Crisp White Pills with STARA Accents */}
          <div
            style={{
              position: "absolute",
              top: "55px",
              left: "2%",
              zIndex: 35,
              background: "#FFFFFF",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              padding: "7px 14px",
              borderRadius: "var(--radius-pill)",
              fontSize: 11.5,
              fontWeight: 600,
              color: "#18181B",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 8px 24px rgba(28, 25, 23, 0.06)",
              animation: "floatSlow 5.5s ease-in-out infinite",
            }}
            className="hidden-mobile-flex"
          >
            <Megaphone size={14} color="#1E3A8A" />
            <span>KRS Genap Siap</span>
          </div>

          <div
            style={{
              position: "absolute",
              top: "16px",
              left: "14%",
              zIndex: 35,
              background: "#FFFFFF",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              padding: "6px 14px",
              borderRadius: "var(--radius-pill)",
              fontSize: 12,
              fontWeight: 600,
              color: "#18181B",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 8px 24px rgba(28, 25, 23, 0.06)",
              animation: "floatSlow 4.5s ease-in-out infinite",
            }}
            className="hidden-mobile-flex"
          >
            <GraduationCap size={14} color="#B45309" />
            <span>Target Sem 5 Siap</span>
          </div>

          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "14%",
              zIndex: 35,
              background: "#FFFFFF",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              padding: "6px 14px",
              borderRadius: "var(--radius-pill)",
              fontSize: 12,
              fontWeight: 600,
              color: "#18181B",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 8px 24px rgba(28, 25, 23, 0.06)",
              animation: "floatReverse 5s ease-in-out infinite",
            }}
            className="hidden-mobile-flex"
          >
            <TrendingUp size={14} color="#B45309" />
            <span>Simulasi MBKM Siap</span>
          </div>

          <div
            style={{
              position: "absolute",
              top: "55px",
              right: "2%",
              zIndex: 35,
              background: "#FFFFFF",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              padding: "7px 14px",
              borderRadius: "var(--radius-pill)",
              fontSize: 11.5,
              fontWeight: 600,
              color: "#18181B",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 8px 24px rgba(28, 25, 23, 0.06)",
              animation: "floatReverse 6s ease-in-out infinite",
            }}
            className="hidden-mobile-flex"
          >
            <Laptop size={14} color="#15803D" />
            <span>SIAKAD Terhubung</span>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#15803D" }} />
          </div>

          {/* Cards Flex Layout */}
          <div className="hero-layered-cards">
            {/* CARD 1 (Far Left): Target Lulus */}
            <div
              className="roadmap-card card-outer-left hidden-tablet"
              style={{
                width: 220,
                height: 350,
                background: "#FFFFFF",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                padding: "22px 18px",
                transform: "rotate(-8deg) translateY(36px) translateX(28px)",
                zIndex: 10,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 16px 36px -4px rgba(28, 25, 23, 0.08), 0 4px 12px -2px rgba(28, 25, 23, 0.04)",
              }}
              tabIndex={0}
              aria-label="Kartu Target Kelulusan"
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#1E3A8A",
                      letterSpacing: "0.08em",
                      background: "rgba(30, 58, 138, 0.07)",
                      border: "1px solid rgba(30, 58, 138, 0.14)",
                      padding: "4px 8px",
                      borderRadius: 6,
                    }}
                  >
                    TARGET LULUS
                  </span>
                  {/* Clean Icon Container */}
                  <div
                    className="card-frosted-icon"
                    style={{
                      background: "rgba(30, 58, 138, 0.06)",
                      borderColor: "rgba(30, 58, 138, 0.16)",
                    }}
                  >
                    <Calendar size={18} color="#1E3A8A" />
                  </div>
                </div>

                <div style={{ fontSize: 36, fontWeight: 800, color: "#18181B", letterSpacing: "-0.04em", lineHeight: 1, fontFamily: "var(--font-inter, 'Plus Jakarta Sans', system-ui, sans-serif)" }}>
                  2026
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1E3A8A", marginTop: 4, marginBottom: 20 }}>
                  Semester 8 • Wisuda
                </div>

                {/* Visual 8-Segment Stepper */}
                <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <div
                      key={s}
                      style={{
                        flex: 1,
                        height: 6,
                        borderRadius: 3,
                        background: s <= 4 ? "#1E3A8A" : "rgba(0, 0, 0, 0.08)",
                      }}
                    />
                  ))}
                </div>
                <div style={{ fontSize: 10, color: "#71717A", fontWeight: 600 }}>
                  4 dari 8 Semester
                </div>
              </div>

              <div>
                {/* Single Status Pill */}
                <div
                  style={{
                    background: "rgba(21, 128, 61, 0.08)",
                    border: "1px solid rgba(21, 128, 61, 0.20)",
                    borderRadius: 10,
                    padding: "8px 10px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#15803D" }} />
                  <span style={{ fontSize: 11, color: "#18181B", fontWeight: 700 }}>On-Track • IPK 3.78</span>
                </div>
              </div>
            </div>

            {/* CARD 2 (Secondary Left): Progres Studi */}
            <div
              className="roadmap-card card-inner-left"
              style={{
                width: 270,
                height: 410,
                background: "#FFFFFF",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                padding: "24px 20px",
                transform: "rotate(-4deg) translateY(14px) translateX(12px)",
                zIndex: 20,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 20px 45px -4px rgba(28, 25, 23, 0.08), 0 4px 14px -2px rgba(28, 25, 23, 0.04)",
              }}
              tabIndex={0}
              aria-label="Kartu Progres Studi"
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#1E3A8A",
                      letterSpacing: "0.08em",
                      background: "rgba(30, 58, 138, 0.07)",
                      border: "1px solid rgba(30, 58, 138, 0.14)",
                      padding: "4px 8px",
                      borderRadius: 6,
                    }}
                  >
                    PROGRES STUDI
                  </span>
                  {/* Icon Container: Book */}
                  <div
                    className="card-frosted-icon"
                    style={{
                      background: "rgba(30, 58, 138, 0.06)",
                      borderColor: "rgba(30, 58, 138, 0.16)",
                    }}
                  >
                    <BookOpen size={18} color="#1E3A8A" />
                  </div>
                </div>

                {/* Big Metric Display */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 44, fontWeight: 800, color: "#18181B", letterSpacing: "-0.04em", lineHeight: 1, fontFamily: "var(--font-inter, 'Plus Jakarta Sans', system-ui, sans-serif)" }}>
                    51%
                  </span>
                  <span style={{ fontSize: 13, color: "#1E3A8A", fontWeight: 700 }}>
                    74 / 144 SKS
                  </span>
                </div>

                {/* Structured Progress Bar */}
                <div style={{ width: "100%", height: 8, borderRadius: 4, background: "rgba(0,0,0,0.06)", overflow: "hidden", margin: "10px 0 20px" }}>
                  <div style={{ width: "51.4%", height: "100%", borderRadius: 4, background: "#1E3A8A" }} />
                </div>

                {/* Two Clean Metric Chips */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ background: "#FAF9F5", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#18181B", fontFamily: "var(--font-inter, 'Plus Jakarta Sans', system-ui, sans-serif)" }}>22</div>
                    <div style={{ fontSize: 10, color: "#15803D", fontWeight: 700 }}>MK Tuntas ✓</div>
                  </div>
                  <div style={{ background: "#FAF9F5", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#18181B", fontFamily: "var(--font-inter, 'Plus Jakarta Sans', system-ui, sans-serif)" }}>3.78</div>
                    <div style={{ fontSize: 10, color: "#71717A", fontWeight: 700 }}>IPK Kumulatif</div>
                  </div>
                </div>
              </div>

              {/* Milestone Chip */}
              <div
                style={{
                  background: "#FAF9F5",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  borderRadius: 10,
                  padding: "9px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: "#18181B" }}>Target Sem 5: KRS 24 SKS</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#15803D", background: "rgba(21, 128, 61, 0.10)", border: "1px solid rgba(21, 128, 61, 0.20)", padding: "2px 7px", borderRadius: 5 }}>Siap</span>
              </div>
            </div>

            {/* CARD 3 (MAIN CENTER): Perjalanan Akademikmu */}
            <div
              className="roadmap-card card-center-primary"
              style={{
                width: 340,
                minHeight: 485,
                background: "#FFFFFF",
                border: "1.5px solid rgba(245, 205, 71, 0.65)",
                padding: "24px 22px",
                transform: "translateY(0) scale(1.02)",
                zIndex: 30,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 20px 50px -4px rgba(245, 205, 71, 0.22), 0 10px 30px rgba(28, 25, 23, 0.06)",
              }}
              tabIndex={0}
              aria-label="Kartu Utama Perjalanan Akademik STARA"
            >
              <div>
                {/* Header with Compass Icon */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      className="card-frosted-icon"
                      style={{
                        background: "rgba(245, 205, 71, 0.18)",
                        borderColor: "rgba(245, 205, 71, 0.4)",
                      }}
                    >
                      <Compass size={19} color="#B45309" />
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#B45309",
                        letterSpacing: "0.08em",
                        background: "rgba(245, 205, 71, 0.18)",
                        padding: "4px 9px",
                        borderRadius: "var(--radius-pill)",
                        border: "1px solid rgba(245, 205, 71, 0.35)",
                      }}
                    >
                      ACADEMIC ROADMAP
                    </span>
                  </div>

                  <Link
                    href="/demo"
                    style={{
                      background: "var(--lime)",
                      color: "#18181B",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "5px 12px",
                      borderRadius: "var(--radius-pill)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      textDecoration: "none",
                      boxShadow: "0 2px 10px rgba(245, 205, 71, 0.35)",
                    }}
                  >
                    <span>Mulai</span>
                    <ArrowUpRight size={13} />
                  </Link>
                </div>

                {/* Big Visual Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: "#18181B", margin: 0, letterSpacing: "-0.02em", fontFamily: "var(--font-inter, 'Plus Jakarta Sans', system-ui, sans-serif)" }}>
                    Semester 4
                  </h3>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#B45309",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F5CD47" }} />
                    Sedang Berjalan
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ width: "100%", height: 7, background: "rgba(0, 0, 0, 0.06)", borderRadius: 4, overflow: "hidden", marginBottom: 20 }}>
                  <div
                    style={{
                      width: "52%",
                      height: "100%",
                      background: "linear-gradient(90deg, #E5BB35 0%, #F5CD47 100%)",
                      borderRadius: 4,
                      boxShadow: "0 0 10px rgba(245, 205, 71, 0.4)",
                    }}
                  />
                </div>

                {/* 4 Clean Visual Roadmap Stages */}
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {/* Stage 1: Sem 1-3 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#F5F3ED", borderRadius: 10, border: "1px solid rgba(0,0,0,0.05)" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(21,128,61,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check size={12} color="#15803D" strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#27272A", flex: 1 }}>Sem 1–3 • Pondasi & Teori</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#15803D" }}>54 SKS ✓</span>
                  </div>

                  {/* Stage 2: Sem 4 (Active) */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(245, 205, 71, 0.18)", borderRadius: 10, border: "1px solid rgba(245, 205, 71, 0.55)" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--lime)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#18181B" }} />
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: "#18181B", flex: 1 }}>Sem 4 • Kuliah Inti</span>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: "#B45309" }}>20 SKS Aktif</span>
                  </div>

                  {/* Stage 3: Sem 6 MBKM */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(21, 128, 61, 0.08)", borderRadius: 10, border: "1px solid rgba(21, 128, 61, 0.18)" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(21, 128, 61, 0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Briefcase size={12} color="#15803D" />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#18181B", flex: 1 }}>Sem 6 • Magang MBKM</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#15803D", background: "rgba(21,128,61,0.12)", padding: "2px 7px", borderRadius: 5 }}>+20 SKS</span>
                  </div>

                  {/* Stage 4: Sem 8 Wisuda */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#F5F3ED", borderRadius: 10, border: "1px solid rgba(0,0,0,0.05)" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <GraduationCap size={12} color="#71717A" />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#52525B", flex: 1 }}>Sem 8 • Kelulusan</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#1E3A8A" }}>Target 2026</span>
                  </div>
                </div>
              </div>

              {/* Bottom tag */}
              <div style={{ borderTop: "1px solid rgba(0, 0, 0, 0.06)", paddingTop: 10, fontSize: 10.5, color: "#15803D", textAlign: "center", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Check size={12} color="#15803D" strokeWidth={3} />
                <span>Sinkronisasi SIAKAD Aktif</span>
              </div>
            </div>

            {/* CARD 4 (Secondary Right): What-If Simulator */}
            <div
              className="roadmap-card card-inner-right"
              style={{
                width: 275,
                height: 410,
                background: "#FFFFFF",
                border: "1px solid rgba(245, 205, 71, 0.45)",
                padding: "24px 20px",
                transform: "rotate(4deg) translateY(14px) translateX(-12px)",
                zIndex: 20,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 20px 45px -4px rgba(245, 205, 71, 0.15), 0 4px 14px -2px rgba(28, 25, 23, 0.04)",
              }}
              tabIndex={0}
              aria-label="Kartu What-If Simulator"
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#B45309",
                      letterSpacing: "0.08em",
                      background: "rgba(245, 205, 71, 0.15)",
                      padding: "4px 8px",
                      borderRadius: 6,
                    }}
                  >
                    WHAT-IF SIMULATOR
                  </span>
                  {/* Clean Icon: SlidersHorizontal */}
                  <div
                    className="card-frosted-icon"
                    style={{
                      background: "rgba(245, 205, 71, 0.15)",
                      borderColor: "rgba(245, 205, 71, 0.35)",
                    }}
                  >
                    <SlidersHorizontal size={18} color="#B45309" />
                  </div>
                </div>

                {/* Minimal Toggle */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 4,
                    background: "#F5F3ED",
                    padding: 3,
                    borderRadius: 9,
                    border: "1px solid rgba(0,0,0,0.06)",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ textAlign: "center", padding: "6px", fontSize: 11, color: "#71717A", fontWeight: 600 }}>
                    Reguler
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      padding: "6px",
                      fontSize: 11,
                      color: "#18181B",
                      fontWeight: 700,
                      background: "var(--lime)",
                      borderRadius: 7,
                    }}
                  >
                    ✓ MBKM
                  </div>
                </div>

                {/* Hero Stat: Big -36% */}
                <div style={{ background: "rgba(245, 205, 71, 0.14)", border: "1px solid rgba(245, 205, 71, 0.35)", borderRadius: 12, padding: "14px", textAlign: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color: "#B45309", lineHeight: 1, fontFamily: "var(--font-inter, 'Plus Jakarta Sans', system-ui, sans-serif)" }}>
                    -36%
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#18181B", marginTop: 4 }}>
                    Beban Kuliah Sem 7
                  </div>
                  <div style={{ fontSize: 10.5, color: "#71717A", marginTop: 2 }}>
                    <span style={{ textDecoration: "line-through" }}>22 SKS</span> ➔ <strong style={{ color: "#18181B" }}>14 SKS</strong>
                  </div>
                </div>
              </div>

              {/* Two Clean Result Badges */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, color: "#18181B" }}>
                  <CheckCircle2 size={15} color="#15803D" />
                  <span>Wisuda Tetap Sem 8 (Tepat Waktu)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, color: "#B45309" }}>
                  <Briefcase size={15} color="#B45309" />
                  <span>+6 Bulan Pengalaman Industri</span>
                </div>
              </div>
            </div>

            {/* CARD 5 (Far Right): Skripsi / Tugas Akhir */}
            <div
              className="roadmap-card card-outer-right hidden-tablet"
              style={{
                width: 220,
                height: 350,
                background: "#FFFFFF",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                padding: "22px 18px",
                transform: "rotate(8deg) translateY(36px) translateX(-28px)",
                zIndex: 10,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 16px 36px -4px rgba(28, 25, 23, 0.08), 0 4px 12px -2px rgba(28, 25, 23, 0.04)",
              }}
              tabIndex={0}
              aria-label="Kartu Skripsi dan Tugas Akhir"
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#15803D",
                      letterSpacing: "0.08em",
                      background: "rgba(21, 128, 61, 0.08)",
                      border: "1px solid rgba(21, 128, 61, 0.18)",
                      padding: "4px 8px",
                      borderRadius: 6,
                    }}
                  >
                    SKRIPSI / TA
                  </span>
                  {/* Clean Icon Container: FileText */}
                  <div
                    className="card-frosted-icon"
                    style={{
                      background: "rgba(21, 128, 61, 0.06)",
                      borderColor: "rgba(21, 128, 61, 0.18)",
                    }}
                  >
                    <FileText size={18} color="#15803D" />
                  </div>
                </div>

                <div style={{ fontSize: 16, fontWeight: 800, color: "#18181B", marginBottom: 12 }}>
                  Tugas Akhir
                </div>

                {/* Big Visual Metric: 6 SKS */}
                <div style={{ background: "#FAF9F5", border: "1px solid rgba(0, 0, 0, 0.06)", borderRadius: 12, padding: "12px", textAlign: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: "#15803D", lineHeight: 1, fontFamily: "var(--font-inter, 'Plus Jakarta Sans', system-ui, sans-serif)" }}>
                    6 SKS
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#52525B", marginTop: 4 }}>
                    Fokus Semester 7–8
                  </div>
                </div>

                {/* Minimal Status Chips */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 700, color: "#27272A" }}>
                    <Check size={12} color="#15803D" strokeWidth={3} />
                    <span>Topik & Proposal Siap</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 700, color: "#27272A" }}>
                    <Check size={12} color="#15803D" strokeWidth={3} />
                    <span>Dosen Pembimbing OK</span>
                  </div>
                </div>
              </div>

              {/* Single Bottom Pill */}
              <div style={{ background: "rgba(21, 128, 61, 0.08)", border: "1px solid rgba(21, 128, 61, 0.20)", borderRadius: 8, padding: "6px 8px", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#15803D" }} />
                <span style={{ fontSize: 10.5, color: "#15803D", fontWeight: 700 }}>Syarat SKS Terpenuhi</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          4. FITUR UNGGULAN SECTION (#fitur)
         ============================================================ */}
      <section
        id="fitur"
        style={{
          maxWidth: 1200,
          margin: "150px auto 0",
          padding: "0 24px",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div className="stara-eyebrow" style={{ marginBottom: 14 }}>
            <span>FITUR UNGGULAN</span>
          </div>
          <h2
            style={{
              fontSize: "clamp(30px, 4.2vw, 50px)",
              fontFamily: "var(--font-serif, 'Fraunces', Georgia, serif)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#18181B",
              marginBottom: 16,
            }}
          >
            Alat Cerdas untuk Perjalanan Akademikmu
          </h2>
          <p style={{ fontSize: 16, color: "#52525B", maxWidth: 620, margin: "0 auto", lineHeight: 1.6 }}>
            Dari perancangan KRS tiap semester hingga panduan bimbingan skripsi, STARA mendampingi setiap tahapan studimu
            secara terstruktur.
          </p>
        </div>

        {/* Sleek Minimal Header Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--lime)",
                boxShadow: "0 0 8px rgba(245, 205, 71, 0.6)",
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#71717A", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Eksplorasi Modul STARA
            </span>
          </div>

          {/* Frosted Control Pills */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "#FFFFFF",
              border: "1px solid rgba(0, 0, 0, 0.07)",
              padding: "4px 8px",
              borderRadius: "var(--radius-pill)",
              boxShadow: "0 4px 16px -2px rgba(28, 25, 23, 0.05)",
            }}
          >
            <button
              onClick={() => scrollFitur("left")}
              className="fitur-nav-btn"
              aria-label="Scroll fitur ke kiri"
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#B45309", padding: "0 8px", letterSpacing: "0.08em" }}>
              4 MODUL
            </span>
            <button
              onClick={() => scrollFitur("right")}
              className="fitur-nav-btn"
              aria-label="Scroll fitur ke kanan"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Feature Interactive Showcase with Sleek Micro-Visuals & Horizontal Scrollbar */}
        <div
          ref={fiturScrollRef}
          className="fitur-scroll-container"
          role="region"
          aria-label="Daftar Fitur Unggulan STARA"
          tabIndex={0}
        >
          {[
            {
              id: 0,
              icon: <GitBranch size={20} />,
              tag: "Roadmap Adaptif",
              title: "Roadmap Semester Cerdas",
              desc: "Visualisasi perjalanan kuliah semester 1 hingga wisuda yang otomatis menyesuaikan prasyarat.",
              accent: "#D97706",
              link: "/app/roadmap",
              visual: (
                <div style={{ margin: "16px 0 14px", background: "#F5F3ED", borderRadius: 14, padding: "14px 12px", border: "1px solid rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#B45309" }}>Sem 1–4 Tuntas</span>
                    <span style={{ fontSize: 10, color: "#047857", fontWeight: 700, background: "rgba(16,185,129,0.12)", padding: "2px 6px", borderRadius: 4 }}>74 SKS ✓</span>
                  </div>
                  <div style={{ width: "100%", height: 6, background: "rgba(0,0,0,0.06)", borderRadius: 3, overflow: "hidden", marginBottom: 12 }}>
                    <div style={{ width: "52%", height: "100%", background: "linear-gradient(90deg, #E5BB35, #F5CD47)", borderRadius: 3, boxShadow: "0 0 10px rgba(245,205,71,0.5)" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 10.5, color: "#18181B" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F5CD47", boxShadow: "0 0 6px #F5CD47" }} />
                      Sem 5 (Aktif)
                    </span>
                    <span style={{ color: "#71717A" }}>Target Wisuda</span>
                  </div>
                </div>
              ),
            },
            {
              id: 1,
              icon: <SlidersHorizontal size={20} />,
              tag: "What-If Simulator",
              title: "Simulasi Skenario Studi",
              desc: "Uji skenario magang MBKM, double degree, atau cuti tanpa menebak dampaknya pada kelulusan.",
              accent: "#B45309",
              link: "/app/simulator",
              visual: (
                <div style={{ margin: "16px 0 14px", background: "#F5F3ED", borderRadius: 14, padding: "14px 12px", border: "1px solid rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10, background: "#FAF9F5", padding: 3, borderRadius: 8 }}>
                    <div style={{ textAlign: "center", fontSize: 10.5, color: "#71717A", padding: "4px" }}>Reguler</div>
                    <div style={{ textAlign: "center", fontSize: 10.5, color: "#18181B", background: "var(--lime)", fontWeight: 700, borderRadius: 6, padding: "4px" }}>✓ MBKM Magang</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ fontSize: 24, fontWeight: 900, color: "#B45309", lineHeight: 1 }}>-36%</span>
                      <span style={{ fontSize: 10.5, color: "#71717A", marginLeft: 6 }}>Beban Sem 7</span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#15803D", background: "rgba(21,128,61,0.12)", padding: "3px 7px", borderRadius: 5 }}>Tepat Waktu ✓</span>
                  </div>
                </div>
              ),
            },
            {
              id: 2,
              icon: <BookOpen size={20} />,
              tag: "Skripsi Compass",
              title: "Panduan Tugas Akhir",
              desc: "Strukturkan eksplorasi topik skripsi, kriteria calon dosen pembimbing, hingga persiapan sidang.",
              accent: "#15803D",
              link: "/app/thesis",
              visual: (
                <div style={{ margin: "16px 0 14px", background: "#F5F3ED", borderRadius: 14, padding: "12px", border: "1px solid rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: 7 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "#18181B" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Check size={12} color="#15803D" strokeWidth={3} /> Topik & Analisis Minat</span>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: "#15803D" }}>Siap</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "#18181B" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Check size={12} color="#15803D" strokeWidth={3} /> Rekomendasi Pembimbing</span>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: "#15803D" }}>Match</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "#71717A" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px dashed #15803D", display: "inline-block" }} />
                      Draf Bab 1–3
                    </span>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: "#15803D" }}>6 SKS</span>
                  </div>
                </div>
              ),
            },
            {
              id: 3,
              icon: <Award size={20} />,
              tag: "Prestasi & TAK",
              title: "Log Prestasi & Ekspor CV",
              desc: "Catat poin TAK, kejuaraan, dan kepanitiaan. Hasilkan CV siap kirim berstandar perguruan tinggi Indonesia.",
              accent: "#EA580C",
              link: "/app/achievements",
              visual: (
                <div style={{ margin: "16px 0 14px", background: "#F5F3ED", borderRadius: 14, padding: "14px 12px", border: "1px solid rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: "#EA580C" }}>125 <span style={{ fontSize: 12, fontWeight: 600, color: "#71717A" }}>/ 100 TAK</span></span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#15803D", background: "rgba(21,128,61,0.12)", padding: "2px 6px", borderRadius: 4 }}>Lulus Syarat ✓</span>
                  </div>
                  <div style={{ width: "100%", height: 6, background: "rgba(0,0,0,0.06)", borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(90deg, #EA580C, #F97316)", borderRadius: 3, boxShadow: "0 0 10px rgba(249,115,22,0.4)" }} />
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: "#18181B", background: "#FAF9F5", padding: "2px 7px", borderRadius: 4, border: "1px solid rgba(0,0,0,0.05)" }}>Prestasi & Lomba</span>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: "#EA580C", background: "rgba(234,88,12,0.12)", padding: "2px 7px", borderRadius: 4 }}>Format CV ATS</span>
                  </div>
                </div>
              ),
            },
          ].map((feat) => {
            const isActive = activeFeatureTab === feat.id;
            return (
              <div
                key={feat.id}
                className="fitur-card-item"
                onClick={() => setActiveFeatureTab(feat.id)}
                style={{
                  background: "#FFFFFF",
                  border: isActive ? `1.5px solid ${feat.accent}` : "1px solid rgba(0, 0, 0, 0.07)",
                  borderRadius: 22,
                  padding: "24px 22px",
                  cursor: "pointer",
                  transition: "all 250ms ease",
                  boxShadow: isActive ? `0 16px 36px -6px rgba(245, 205, 71, 0.22), 0 4px 14px rgba(28, 25, 23, 0.04)` : "0 8px 24px -4px rgba(28, 25, 23, 0.04)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
                tabIndex={0}
                role="button"
                aria-pressed={isActive}
              >
                <div>
                  {/* Top Bar: Frosted Blurred Icon + Category Pill */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div
                      className="card-frosted-icon"
                      style={{
                        background: `${feat.accent}15`,
                        borderColor: `${feat.accent}35`,
                        color: feat.accent,
                      }}
                    >
                      {feat.icon}
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: feat.accent,
                        letterSpacing: "0.08em",
                        background: `${feat.accent}15`,
                        padding: "4px 8px",
                        borderRadius: 6,
                        textTransform: "uppercase",
                      }}
                    >
                      {feat.tag}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#18181B", marginBottom: 8, letterSpacing: "-0.01em" }}>
                    {feat.title}
                  </h3>
                  <p style={{ fontSize: 13, color: "#52525B", lineHeight: 1.55, margin: 0 }}>
                    {feat.desc}
                  </p>

                  {/* Rich Micro-Visual Graphic */}
                  {feat.visual}
                </div>

                {/* Bottom Bar: Status + Action */}
                <div
                  style={{
                    paddingTop: 14,
                    borderTop: "1px solid rgba(0, 0, 0, 0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11.5,
                      color: isActive ? feat.accent : "#71717A",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {isActive && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: feat.accent,
                          boxShadow: `0 0 6px ${feat.accent}`,
                        }}
                      />
                    )}
                    {isActive ? "Sedang Ditinjau" : "Klik untuk Detail"}
                  </span>
                  <Link
                    href={feat.link}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#18181B",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      textDecoration: "none",
                      background: "#FAF9F5",
                      padding: "5px 10px",
                      borderRadius: 8,
                      border: "1px solid rgba(0, 0, 0, 0.07)",
                      transition: "all 0.2s ease",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>Buka Fitur</span>
                    <ArrowUpRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================
          5. CARA KERJA SECTION (#cara-kerja)
         ============================================================ */}
      <section
        id="cara-kerja"
        style={{
          maxWidth: 1200,
          margin: "160px auto 0",
          padding: "0 24px",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <div className="stara-eyebrow" style={{ marginBottom: 14 }}>
            <span>CARA KERJA</span>
          </div>
          <h2
            style={{
              fontSize: "clamp(30px, 4.2vw, 50px)",
              fontFamily: "var(--font-serif, 'Fraunces', Georgia, serif)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#18181B",
              marginBottom: 16,
            }}
          >
            Langkah Terarah Menuju Kelulusan
          </h2>
          <p style={{ fontSize: 16, color: "#52525B", maxWidth: 580, margin: "0 auto", lineHeight: 1.6 }}>
            Empat tahapan sederhana untuk menyusun dan memantau perjalanan akademikmu tanpa rasa cemas.
          </p>
        </div>

        {/* Infinite Looping Marquee Carousel */}
        <div className="cara-kerja-marquee-wrapper" role="region" aria-label="Alur 4 Langkah Cara Kerja STARA">
          <div className="cara-kerja-marquee-track">
            {[
              {
                step: "01",
                title: "Lengkapi Riwayat Kuliah",
                desc: "Masukkan data perguruan tinggi, program studi, semester saat ini, dan total SKS yang telah kamu selesaikan.",
                accent: "#D97706",
              },
              {
                step: "02",
                title: "Dapatkan Roadmap Cerdas",
                desc: "Sistem STARA menyusun milestone semester dan merekomendasikan distribusi mata kuliah yang seimbang.",
                accent: "#15803D",
              },
              {
                step: "03",
                title: "Eksplorasi Skenario What-If",
                desc: "Bandingkan alternatif rencana bila ingin magang MBKM, mengambil semester pendek, atau cuti studi.",
                accent: "#B45309",
              },
              {
                step: "04",
                title: "Pantau & Rayakan Wisuda",
                desc: "Perbarui progres tiap akhir semester, pantau TAK dan skripsi, lalu capai kelulusan sesuai target pribadimu.",
                accent: "#EA580C",
              },
            ]
              .concat([
                {
                  step: "01",
                  title: "Lengkapi Riwayat Kuliah",
                  desc: "Masukkan data perguruan tinggi, program studi, semester saat ini, dan total SKS yang telah kamu selesaikan.",
                  accent: "#D97706",
                },
                {
                  step: "02",
                  title: "Dapatkan Roadmap Cerdas",
                  desc: "Sistem STARA menyusun milestone semester dan merekomendasikan distribusi mata kuliah yang seimbang.",
                  accent: "#15803D",
                },
                {
                  step: "03",
                  title: "Eksplorasi Skenario What-If",
                  desc: "Bandingkan alternatif rencana bila ingin magang MBKM, mengambil semester pendek, atau cuti studi.",
                  accent: "#B45309",
                },
                {
                  step: "04",
                  title: "Pantau & Rayakan Wisuda",
                  desc: "Perbarui progres tiap akhir semester, pantau TAK dan skripsi, lalu capai kelulusan sesuai target pribadimu.",
                  accent: "#EA580C",
                },
              ])
              .map((item, idx) => (
                <div key={idx} className="cara-kerja-card">
                  <div>
                    <div
                      style={{
                        fontSize: 32,
                        fontWeight: 800,
                        color: item.accent,
                        letterSpacing: "-0.04em",
                        marginBottom: 16,
                        opacity: 0.95,
                        fontFamily: "var(--font-serif, 'Fraunces', Georgia, serif)",
                      }}
                    >
                      {item.step}
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "#18181B", marginBottom: 12 }}>
                      {item.title}
                    </h3>
                    <p style={{ fontSize: 14, color: "#52525B", lineHeight: 1.6 }}>{item.desc}</p>
                  </div>

                  <div
                    style={{
                      marginTop: 24,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 12,
                      color: item.accent,
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={15} />
                    <span>Siap diimplementasikan</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          6. TENTANG STARA SECTION (#tentang)
         ============================================================ */}
      <section
        id="tentang"
        style={{
          maxWidth: 1200,
          margin: "160px auto 0",
          padding: "0 24px",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #FEFBF0 0%, #FEF8E6 50%, #FDF3D2 100%)",
            border: "1px solid rgba(245, 205, 71, 0.45)",
            borderRadius: 28,
            padding: "56px 40px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 40,
            alignItems: "center",
            boxShadow: "0 20px 48px -6px rgba(245, 205, 71, 0.18)",
          }}
        >
          <div>
            <div className="stara-eyebrow" style={{ marginBottom: 16 }}>
              <span>TENTANG STARA</span>
            </div>
            <h2
              style={{
                fontSize: "clamp(28px, 3.8vw, 42px)",
                fontFamily: "var(--font-serif, 'Fraunces', Georgia, serif)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "#18181B",
                lineHeight: 1.15,
                marginBottom: 18,
              }}
            >
              Dirancang untuk Realitas Mahasiswa Indonesia
            </h2>
            <p style={{ fontSize: 15, color: "#3F3F46", lineHeight: 1.7, marginBottom: 20 }}>
              STARA lahir dari pemahaman bahwa masa perkuliahan di Indonesia memiliki dinamika khas: aturan SKS, KRS tiap
              awal semester, kebijakan konversi MBKM antar-kampus, akumulasi poin TAK, hingga proses bimbingan skripsi
              yang sering kali membingungkan.
            </p>
            <p style={{ fontSize: 15, color: "#3F3F46", lineHeight: 1.7 }}>
              Kami tidak menjanjikan kelulusan instan. STARA memberikan kejelasan, transparansi perhitungan, dan simulasi
              adaptif agar kamu bisa mengambil keputusan akademik dengan percaya diri.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {[
              {
                title: "Konteks Kampus Indonesia",
                desc: "Mendukung istilah SKS, KRS, MBKM, TAK, dan panduan dosen pembimbing skripsi yang relevan.",
              },
              {
                title: "Eksplorasi Aman (What-If)",
                desc: "Simulasikan magang atau cuti tanpa merusak rencana awal sebelum kamu berkonsultasi dengan dosen PA.",
              },
              {
                title: "Akses Demo Tanpa Syarat",
                desc: "Jelajahi seluruh fitur STARA langsung melalui Guest Demo tanpa kewajiban mendaftarkan data sensitif.",
              },
            ].map((box, idx) => (
              <div
                key={idx}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(245, 205, 71, 0.35)",
                  borderRadius: 16,
                  padding: "18px 20px",
                  boxShadow: "0 4px 16px -2px rgba(28, 25, 23, 0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <ShieldCheck size={18} color="#D97706" />
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#18181B" }}>{box.title}</span>
                </div>
                <p style={{ fontSize: 13, color: "#52525B", lineHeight: 1.5, margin: 0 }}>{box.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          7. BOTTOM CTA BANNER
         ============================================================ */}
      <section
        style={{
          maxWidth: 1080,
          margin: "140px auto 90px",
          padding: "0 24px",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #FFE66D 0%, #F5CD47 45%, #EAB308 100%)",
            border: "1px solid rgba(255, 255, 255, 0.75)",
            borderRadius: 32,
            padding: "68px 32px 56px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 32px 80px -16px rgba(234, 179, 8, 0.38), 0 12px 28px -6px rgba(28, 25, 23, 0.06), inset 0 1px 2px rgba(255, 255, 255, 0.85)",
          }}
        >
          {/* Subtle light glow orb & ambient backdrop */}
          <div
            style={{
              position: "absolute",
              top: "40%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "600px",
              height: "340px",
              background: "radial-gradient(circle, rgba(255,255,255,0.45) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
            aria-hidden="true"
          />

          {/* Frosted Modern Eyebrow Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255, 255, 255, 0.6)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.85)",
              padding: "6px 16px",
              borderRadius: "var(--radius-pill)",
              fontSize: 11.5,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#854D0E",
              marginBottom: 18,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
            }}
          >
            <Sparkles size={14} color="#854D0E" />
            <span>MULAI SEKARANG</span>
          </div>

          <h2
            style={{
              fontSize: "clamp(32px, 4.6vw, 54px)",
              fontFamily: "var(--font-serif, 'Fraunces', Georgia, serif)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#18181B",
              maxWidth: 720,
              margin: "0 auto 16px",
              lineHeight: 1.14,
            }}
          >
            Rancang Perjalanan Kuliahmu Bersama STARA
          </h2>

          <p
            style={{
              fontSize: "clamp(15px, 1.8vw, 17px)",
              color: "#3F3F46",
              fontWeight: 500,
              maxWidth: 520,
              margin: "0 auto 36px",
              lineHeight: 1.65,
            }}
          >
            Mulai susun roadmap akademikmu sekarang atau coba pengalaman penuh melalui demo interaktif.
          </p>

          <div className="stara-cta-group" style={{ justifyContent: "center" }}>
            <Link
              href="/app/onboarding"
              style={{
                fontSize: 15,
                fontWeight: 700,
                padding: "14px 34px",
                background: "#18181B",
                color: "#FFFFFF",
                borderRadius: "var(--radius-pill)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                textDecoration: "none",
                boxShadow: "0 10px 28px -4px rgba(24, 24, 27, 0.35)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                transition: "all 0.2s cubic-bezier(0.2, 0, 0.2, 1)",
              }}
            >
              <span>Mulai Perjalanan</span>
              <ArrowUpRight size={17} />
            </Link>
            <Link
              href="/demo"
              style={{
                fontSize: 15,
                fontWeight: 700,
                padding: "14px 30px",
                background: "#FFFFFF",
                color: "#18181B",
                border: "1px solid rgba(255, 255, 255, 0.9)",
                borderRadius: "var(--radius-pill)",
                textDecoration: "none",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
                transition: "all 0.2s cubic-bezier(0.2, 0, 0.2, 1)",
              }}
            >
              Jelajahi Demo
            </Link>
          </div>

          {/* Trust Highlights Row */}
          <div
            style={{
              marginTop: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "14px 24px",
              fontSize: 12.5,
              fontWeight: 600,
              color: "#68480C",
            }}
          >
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={15} color="#15803D" />
              <span>Akses Demo Langsung Tanpa Daftar</span>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={15} color="#15803D" />
              <span>100% Gratis untuk Eksplorasi</span>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={15} color="#15803D" />
              <span>Simulasi SKS & MBKM Adaptif</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          8. FOOTER
         ============================================================ */}
      <footer
        style={{
          borderTop: "1px solid rgba(0, 0, 0, 0.07)",
          background: "#F4F0E8",
          padding: "50px 24px 36px",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 36,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="stara-logo-mark">
                <img
                  src="/blackstara.svg"
                  alt="Logo STARA"
                  width={28}
                  height={28}
                  style={{ width: 28, height: 28, objectFit: "contain", display: "block" }}
                />
              </div>
              <span style={{ fontWeight: 800, fontSize: 18, color: "#18181B" }}>STARA</span>
              <span style={{ fontSize: 12, color: "#71717A", marginLeft: 8 }}>
                Student Tracking and Academic Roadmap Assistant
              </span>
            </div>

            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {navLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  style={{ fontSize: 13.5, color: "#52525B", textDecoration: "none" }}
                  className="stara-btn-ghost"
                >
                  {link.label}
                </a>
              ))}
              <Link href="/demo" style={{ fontSize: 13.5, color: "#B45309", fontWeight: 700, textDecoration: "none" }}>
                Mode Demo ↗
              </Link>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(0, 0, 0, 0.06)",
              paddingTop: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              fontSize: 12,
              color: "#71717A",
            }}
          >
            <div>© {new Date().getFullYear()} STARA. Platform perencanaan akademik mahasiswa Indonesia.</div>
            <div style={{ display: "flex", gap: 16 }}>
              <span>Data simulasi independen</span>
              <span>•</span>
              <span>Bukan sistem resmi SIAKAD kampus</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Inline styles for responsive tweaks */}
      <style jsx>{`
        @media (max-width: 900px) {
          .hidden-tablet {
            display: none !important;
          }
          .hero-layered-cards {
            min-height: 420px;
          }
          .card-inner-left {
            transform: rotate(-3deg) translateY(8px) !important;
          }
          .card-inner-right {
            transform: rotate(3deg) translateY(8px) !important;
          }
        }
        @media (max-width: 680px) {
          .hidden-mobile-flex {
            display: none !important;
          }
          .show-mobile-flex {
            display: flex !important;
          }
          .hero-layered-cards {
            flex-direction: column;
            align-items: center;
            min-height: auto;
            gap: 20px;
          }
          .roadmap-card {
            width: 100% !important;
            max-width: 340px !important;
            transform: none !important;
          }
          .card-center-primary {
            order: 1;
          }
          .card-inner-left {
            order: 2;
          }
          .card-inner-right {
            order: 3;
          }
        }
      `}</style>
    </div>
  );
}
