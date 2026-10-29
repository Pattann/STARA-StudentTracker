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
  Compass,
  Award,
  Bell,
  User,
  HelpCircle,
  Star,
  RefreshCw,
  LogOut,
  ChevronRight,
  X,
  Menu,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useSession } from "@/features/session/context";
import { StudentAvatarBadge, useStudentAvatar } from "@/components/ui/StudentAvatar";

const navItems = [
  { href: "/app", label: "Beranda", icon: LayoutDashboard },
  { href: "/app/roadmap", label: "Roadmap Saya", icon: Map },
  { href: "/app/simulator", label: "Simulasi Skenario", icon: Zap },
  { href: "/app/templates", label: "Jelajahi Template", icon: BookMarked },
  { href: "/app/thesis", label: "Panduan Skripsi", icon: BookOpen },
  { href: "/app/achievements", label: "Prestasi & CV", icon: Award },
  { href: "/app/reminders", label: "Pengingat", icon: Bell },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { token, user, clearSession } = useSession();

  const isActive = (href: string) => {
    if (href === "/app") return pathname === "/app";
    return pathname.startsWith(href);
  };

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
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <img
            src="/blackstara.svg"
            alt="Logo STARA"
            width={24}
            height={24}
            style={{ width: 24, height: 24, objectFit: "contain", display: "block", flexShrink: 0 }}
          />
          <span
            style={{
              fontWeight: 800,
              fontSize: 16,
              lineHeight: 1,
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

        {/* Nav Items */}
        <div className="sidebar-content">
          <div className="sidebar-nav" role="list">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`sidebar-nav-item ${isActive(item.href) ? "active" : ""}`}
                role="listitem"
                onClick={() => onClose()}
              >
                <item.icon
                  size={17}
                  className="nav-icon"
                  aria-hidden="true"
                />
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="divider" style={{ margin: "8px 8px" }} />

          <div className="sidebar-nav" role="list">
            <Link
              href="/app/profile"
              className={`sidebar-nav-item ${isActive("/app/profile") ? "active" : ""}`}
              onClick={() => onClose()}
            >
              <User size={17} aria-hidden="true" />
              <span>Profil & Pengaturan</span>
            </Link>

            <Link
              href="/onboarding"
              className="sidebar-nav-item"
              onClick={() => onClose()}
            >
              <Sparkles size={17} aria-hidden="true" color="#D97706" />
              <span style={{ color: "#92400E", fontWeight: 700 }}>Setup Onboarding</span>
            </Link>
            <Link
              href="/app/check-ins"
              className={`sidebar-nav-item ${isActive("/app/check-ins") ? "active" : ""}`}
              onClick={() => onClose()}
            >
              <ChevronRight size={17} aria-hidden="true" />
              <span>Riwayat Check-in</span>
            </Link>
            <button
              className="sidebar-nav-item"
              style={{ width: "100%" }}
              onClick={() => {/* help */}}
            >
              <HelpCircle size={17} aria-hidden="true" />
              <span>Bantuan</span>
            </button>
          </div>
        </div>

        {/* User Session Info Card */}
        {token && (
          <div
            style={{
              margin: "8px",
              flexShrink: 0,
              background: "#FFFFFF",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "12px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#16A34A",
                  boxShadow: "0 0 6px rgba(22, 163, 74, 0.4)",
                }}
              />
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: "#15803D",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Akun Aktif
              </span>
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.name || "Mahasiswa STARA"}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-secondary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginTop: 2,
              }}
            >
              {user?.email || "Akun Terverifikasi"}
            </div>
          </div>
        )}

        <div style={{ padding: "8px", flexShrink: 0 }}>
          <button
            id="btn-sidebar-logout"
            onClick={() => clearSession()}
            className="sidebar-nav-item"
            style={{ width: "100%", color: "var(--coral)", cursor: "pointer" }}
          >
            <LogOut size={17} />
            <span>Keluar</span>
          </button>
        </div>
      </nav>
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
  const pathname = usePathname();
  const { token, user } = useSession();

  const resolvedTitle = (() => {
    if (pageTitle && pageTitle !== "STARA") return pageTitle;
    if (pathname === "/app") return "Beranda";
    if (pathname.startsWith("/app/roadmap")) return "Roadmap Saya";
    if (pathname.startsWith("/app/simulator")) return "Simulasi Skenario";
    if (pathname.startsWith("/app/templates")) return "Jelajahi Template";
    if (pathname.startsWith("/app/thesis")) return "Panduan Skripsi";
    if (pathname.startsWith("/app/achievements")) return "Prestasi & CV";
    if (pathname.startsWith("/app/reminders")) return "Pengingat";
    if (pathname.startsWith("/app/profile")) return "Profil & Pengaturan";
    if (pathname.startsWith("/app/check-ins")) return "Riwayat Check-in";
    return "Dashboard Mahasiswa";
  })();

  const isDemoAccount =
    !user ||
    user.id === "demo-student" ||
    user.email === "mahasiswa@student.stara.ac.id";

  const userInitial = user?.name
    ? user.name.trim().charAt(0).toUpperCase()
    : "M";

  const [avatarId] = useStudentAvatar(user?.id);

  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <button
          onClick={onMenuClick}
          className="btn btn-ghost btn-sm"
          style={{ display: "none" }}
          aria-label="Buka menu"
        >
          <Menu size={20} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", lineHeight: 1 }}>
            Workspace
          </span>
          <ChevronRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <h1
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1,
              color: "var(--text-primary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {resolvedTitle}
          </h1>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {token && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: isDemoAccount ? "#92400E" : "#15803D",
              background: isDemoAccount
                ? "rgba(245, 205, 71, 0.22)"
                : "rgba(22, 163, 74, 0.10)",
              border: isDemoAccount
                ? "1px solid rgba(217, 119, 6, 0.3)"
                : "1px solid rgba(22, 163, 74, 0.25)",
              borderRadius: "var(--radius-pill)",
              padding: "4px 12px",
              fontWeight: 700,
              letterSpacing: "0.01em",
              lineHeight: 1.2,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: isDemoAccount ? "#D97706" : "#16A34A",
                flexShrink: 0,
              }}
            />
            <span>
              {isDemoAccount
                ? "Demo Workspace"
                : user?.name || "Mahasiswa Aktif"}
            </span>
          </span>
        )}

        <Link
          href="/app/profile"
          aria-label="Profil pengguna"
          style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
        >
          {isDemoAccount ? (
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
              }}
              title="Demo Workspace — Profil & Pengaturan"
            >
              <User size={15} color="var(--text-secondary)" />
            </div>
          ) : (
            <StudentAvatarBadge
              avatarId={avatarId}
              initial={userInitial}
              size={34}
              title={`${user?.name || "Mahasiswa"} (${user?.email || "Profil & Pengaturan"})`}
            />
          )}
        </Link>
      </div>
    </header>
  );
}
