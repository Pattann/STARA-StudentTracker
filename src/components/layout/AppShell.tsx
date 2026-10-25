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

const navItems = [
  { href: "/app", label: "Beranda", icon: LayoutDashboard },
  { href: "/app/roadmap", label: "Roadmap Saya", icon: Map },
  { href: "/app/simulator", label: "Simulasi Skenario", icon: Zap },
  { href: "/app/templates", label: "Jelajahi Template", icon: BookMarked },
  { href: "/app/thesis", label: "Panduan Skripsi", icon: BookOpen },
  { href: "/app/career", label: "Rencana Setelah Lulus", icon: Compass },
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
        <div className="sidebar-logo" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="/whitestara.svg"
            alt="Logo STARA"
            width={26}
            height={26}
            style={{ width: 26, height: 26, objectFit: "contain", display: "block" }}
          />
          <span
            style={{
              fontWeight: 800,
              fontSize: 17,
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
              href="/admin"
              className="sidebar-nav-item"
              style={{
                background: "rgba(245, 205, 71, 0.08)",
                border: "1px solid rgba(245, 205, 71, 0.2)",
              }}
              onClick={() => onClose()}
            >
              <ShieldCheck size={17} aria-hidden="true" color="var(--lime)" />
              <span style={{ color: "var(--lime)", fontWeight: 700 }}>Dashboard Admin</span>
            </Link>
            <Link
              href="/onboarding"
              className="sidebar-nav-item"
              onClick={() => onClose()}
            >
              <Sparkles size={17} aria-hidden="true" color="var(--lime)" />
              <span style={{ color: "var(--lime)", fontWeight: 600 }}>Setup Onboarding</span>
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
              background: "rgba(245, 205, 71, 0.06)",
              border: "1px solid rgba(245, 205, 71, 0.2)",
              borderRadius: "var(--radius-md)",
              padding: "12px",
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
                  background: "var(--lime)",
                  boxShadow: "0 0 6px var(--lime)",
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "var(--lime)",
                  letterSpacing: "0.05em",
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
                color: "#F5F5F0",
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
                color: "#A4AAA5",
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

        <div style={{ padding: "8px" }}>
          <button
            onClick={() => clearSession()}
            className="sidebar-nav-item"
            style={{ width: "100%", color: "var(--coral)" }}
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
  const { token } = useSession();

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

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {token && (
          <span
            style={{
              fontSize: 12,
              color: "var(--lime)",
              background: "rgba(215,243,106,0.1)",
              border: "1px solid rgba(215,243,106,0.2)",
              borderRadius: "var(--radius-pill)",
              padding: "4px 12px",
              fontWeight: 600,
            }}
          >
            Demo Workspace
          </span>
        )}
        <Link
          href="/admin"
          style={{
            fontSize: 12,
            color: "var(--text-primary)",
            background: "rgba(245, 205, 71, 0.12)",
            border: "1px solid rgba(245, 205, 71, 0.3)",
            borderRadius: "var(--radius-pill)",
            padding: "4px 12px",
            fontWeight: 700,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <ShieldCheck size={14} color="var(--lime)" />
          <span>Mode Admin</span>
        </Link>
        <Link href="/app/profile" aria-label="Profil pengguna">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <User size={16} color="var(--text-secondary)" />
          </div>
        </Link>
      </div>
    </header>
  );
}
