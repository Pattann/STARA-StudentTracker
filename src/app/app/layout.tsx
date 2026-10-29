"use client";

import { useState } from "react";
import { Sidebar, Topbar } from "@/components/layout/AppShell";
import { SessionProvider, useSession } from "@/features/session/context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function WorkspaceGuard({ children, pageTitle }: { children: React.ReactNode; pageTitle?: string }) {
  const { token, isLoading } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !token) {
      router.push("/login");
    }
  }, [isLoading, token, router]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-base)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            border: "3px solid var(--border)",
            borderTop: "3px solid var(--lime)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!token) return null;

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar
          pageTitle={pageTitle ?? "STARA"}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="main-scroll-area">
          <div className="page-area">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <WorkspaceGuard>{children}</WorkspaceGuard>
    </SessionProvider>
  );
}
