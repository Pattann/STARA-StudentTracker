"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Map,
  Zap,
  BookMarked,
  BookOpen,
  Bell,
  User,
  HelpCircle,
  LogOut,
  History,
  X,
  Menu,
  LifeBuoy,
  ShieldCheck,
} from "lucide-react";
import { useSession } from "@/features/session/context";

const navItems = [
  { href: "/app", label: "Beranda", icon: LayoutDashboard },
  { href: "/app/roadmap", label: "Roadmap Saya", icon: Map },
  { href: "/app/simulator", label: "Simulasi Skenario", icon: Zap },
  { href: "/app/templates", label: "Jelajahi Template", icon: BookMarked },
  { href: "/app/thesis", label: "Panduan Skripsi", icon: BookOpen },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { token, user, clearSession } = useSession();
  const [showHelpModal, setShowHelpModal] = useState(false);

  const isActive = (href: string) => {
    if (href === "/app") return pathname === "/app";
    return pathname.startsWith(href);
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "M";

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 49,
          }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <nav
        className={`sidebar ${isOpen ? "open" : ""}`}
        aria-label="Navigasi utama"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* ── BAGIAN ATAS: Logo & Navigasi Utama ── */}
        <div>
          {/* Logo Brand */}
          <div
            className="sidebar-logo"
            style={{
              padding: "18px 18px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <img
              src="/blackstara.svg"
              alt="Logo STARA"
              width={24}
              height={24}
              style={{ width: 24, height: 24, objectFit: "contain", display: "block" }}
            />
            <span
              style={{
                fontWeight: 800,
                fontSize: 16,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              STARA
            </span>
            <button
              onClick={onClose}
              style={{
                marginLeft: "auto",
                display: "none",
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
              }}
              className="sidebar-close-btn"
              aria-label="Tutup sidebar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Nav Items Utama */}
          <div
            className="sidebar-nav"
            role="list"
            style={{
              padding: "14px 10px",
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-nav-item ${active ? "active" : ""}`}
                  role="listitem"
                  onClick={() => onClose()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: 13.5,
                    fontWeight: active ? 600 : 500,
                    color: active ? "var(--text-primary)" : "var(--text-secondary)",
                    background: active ? "#FFFFFF" : "transparent",
                    border: active ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid transparent",
                    boxShadow: active ? "0 1px 4px rgba(0, 0, 0, 0.04)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <item.icon
                    size={16}
                    color={active ? "var(--amber)" : "var(--text-muted)"}
                    aria-hidden="true"
                    style={{ flexShrink: 0 }}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── BAGIAN BAWAH: Riwayat, Admin, Bantuan & Profil Minimalis ── */}
        <div style={{ borderTop: "1px solid var(--border-subtle)" }}>
          {/* Secondary Utilities */}
          <div
            style={{
              padding: "8px 10px 6px",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Link
              href="/app/check-ins"
              className={`sidebar-nav-item ${isActive("/app/check-ins") ? "active" : ""}`}
              onClick={() => onClose()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "7px 12px",
                borderRadius: "8px",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-secondary)",
                transition: "all 0.15s ease",
              }}
            >
              <History size={15} color="var(--text-muted)" aria-hidden="true" style={{ flexShrink: 0 }} />
              <span>Riwayat Check-in</span>
            </Link>

            <Link
              href="/admin"
              className={`sidebar-nav-item ${isActive("/admin") ? "active" : ""}`}
              onClick={() => onClose()}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: 13,
                fontWeight: isActive("/admin") ? 600 : 500,
                color: isActive("/admin") ? "var(--text-primary)" : "var(--text-secondary)",
                background: isActive("/admin")
                  ? "#FFFFFF"
                  : "rgba(245, 205, 71, 0.06)",
                border: isActive("/admin")
                  ? "1px solid rgba(0, 0, 0, 0.08)"
                  : "1px solid rgba(217, 119, 6, 0.16)",
                boxShadow: isActive("/admin") ? "0 1px 4px rgba(0, 0, 0, 0.04)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ShieldCheck
                  size={15}
                  color={isActive("/admin") ? "var(--amber-deep)" : "#B45309"}
                  aria-hidden="true"
                  style={{ flexShrink: 0 }}
                />
                <span style={{ fontWeight: 550 }}>Dashboard Admin</span>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#92400E",
                  background: "#FEF3C7",
                  border: "1px solid #FDE68A",
                  borderRadius: "var(--radius-pill)",
                  padding: "1px 6px",
                  letterSpacing: "0.02em",
                }}
              >
                ADMIN
              </span>
            </Link>

            <button
              className="sidebar-nav-item"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "7px 12px",
                borderRadius: "8px",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-secondary)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
              onClick={() => setShowHelpModal(true)}
            >
              <HelpCircle size={15} color="var(--text-muted)" aria-hidden="true" style={{ flexShrink: 0 }} />
              <span>Bantuan</span>
            </button>
          </div>

          {/* User Profile & Logout Minimalist Footer */}
          {token && (
            <div
              style={{
                margin: "4px 10px 10px",
                padding: "8px 10px",
                background: "#FAF9F5",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0, flex: 1 }}>
                {/* Avatar with Online Dot */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: "#FFFFFF",
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {userInitial}
                  </div>
                  <span
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#16A34A",
                      border: "1.5px solid #FFFFFF",
                    }}
                    title="Akun Aktif"
                  />
                </div>

                {/* Name & Email Truncated */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      lineHeight: 1.2,
                    }}
                  >
                    {user?.name || "Mahasiswa STARA"}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginTop: 2,
                    }}
                  >
                    {user?.email || "Akun Terverifikasi"}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => clearSession()}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "5px",
                  borderRadius: "6px",
                  color: "#94A3B8",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
                title="Keluar dari akun"
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--coral)";
                  e.currentTarget.style.background = "#FEE2E2";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#94A3B8";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Modal Bantuan */}
      {showHelpModal && (
        <div
          className="dialog-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            backdropFilter: "blur(2px)",
          }}
          onClick={() => setShowHelpModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: 440,
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              border: "1px solid var(--border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", color: "#B45309" }}>
                  <LifeBuoy size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>Pusat Bantuan STARA</h3>
                  <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>Panduan & Konsultasi Akademik</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: 4, borderRadius: "50%" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "12px" }}>
                <strong style={{ color: "#0F172A", display: "block", marginBottom: 4 }}>Simulasi & Penyesuaian Beban:</strong>
                Gunakan menu <strong>Simulasi Skenario</strong> untuk menguji alternatif matkul atau magang tanpa mengubah rencana utama Anda.
              </div>
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "12px" }}>
                <strong style={{ color: "#0F172A", display: "block", marginBottom: 4 }}>Validasi Aturan Akademik:</strong>
                STARA otomatis memeriksa batas 24 SKS nasional dan rantai prasyarat mata kuliah terdaftar.
              </div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
                Butuh bantuan teknis? Hubungi tim pengembang di <span style={{ color: "#0F172A", fontWeight: 600 }}>support@stara.ac.id</span>
              </div>
            </div>

            <div style={{ marginTop: 20, textAlign: "right" }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowHelpModal(false)}
                style={{ padding: "6px 18px", borderRadius: "8px" }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function Topbar({
  pageTitle,
  onMenuClick,
}: {
  pageTitle: string;
  onMenuClick: () => void;
}) {
  const { token, user } = useSession();

  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onMenuClick}
          className="btn btn-ghost btn-sm"
          style={{ display: "none" }}
          aria-label="Buka menu"
        >
          <Menu size={20} />
        </button>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
          {pageTitle}
        </h1>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {token && (
          <span
            style={{
              fontSize: 12,
              color: "#92400E",
              background: "rgba(245, 205, 71, 0.22)",
              border: "1px solid rgba(217, 119, 6, 0.3)",
              borderRadius: "var(--radius-pill)",
              padding: "4px 12px",
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            Demo Workspace
          </span>
        )}

        {/* Pengingat (Notifikasi) di samping icon profile */}
        <Link
          href="/app/reminders"
          aria-label="Pengingat & Notifikasi"
          title="Pengingat & Notifikasi"
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--text-secondary)",
              position: "relative",
              transition: "all 0.15s ease",
            }}
          >
            <Bell size={16} />
            <span
              style={{
                position: "absolute",
                top: 7,
                right: 7,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#D97706",
              }}
            />
          </div>
        </Link>

        {/* Profil & Pengaturan */}
        <Link
          href="/app/profile"
          aria-label="Profil & Pengaturan"
          title="Profil & Pengaturan"
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--text-secondary)",
              transition: "all 0.15s ease",
            }}
          >
            <User size={16} />
          </div>
        </Link>
      </div>
    </header>
  );
}
