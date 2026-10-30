import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel Administrator | STARA",
  description:
    "Panel Kontrol Administrator STARA: Moderasi Template, Kurikulum Akademik, Ringkasan Operasional, dan Kinerja AI.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="admin-root-container"
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "var(--bg-base)",
        color: "var(--text-primary)",
      }}
    >
      {children}
    </div>
  );
}
