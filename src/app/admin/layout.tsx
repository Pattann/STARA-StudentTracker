import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Admin — STARA (Student Tracking & Academic Roadmap Assistant)",
  description: "Panel Kontrol Administrator STARA: Ringkasan Mahasiswa, Data Akademik, Moderasi Template, dan Monitor Sistem AI.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-root-container" style={{ height: "100vh", width: "100vw", overflow: "hidden", background: "var(--bg-primary)" }}>
      {children}
    </div>
  );
}
