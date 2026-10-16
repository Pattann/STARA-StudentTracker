"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/features/session/context";
import { useParams } from "next/navigation";
import { ThumbsUp, Copy, Flag, MessageSquare, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TEMPLATE_CATEGORIES } from "@/lib/constants";

type Template = {
  id: string;
  title: string;
  description: string;
  category: string;
  institutionName?: string;
  programName?: string;
  cohortYear?: number;
  goals?: string;
  semesterSteps: string;
  sourceType: string;
  usefulCount: number;
  authorDisplayName?: string;
  isAnonymous: boolean;
  updatedAt: string;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: { name: string | null } | null;
    replies: Array<{
      id: string;
      content: string;
      createdAt: string;
      user: { name: string | null } | null;
    }>;
  }>;
  _count: { votes: number; clones: number };
};

export default function TemplateDetailPage() {
  const { token } = useSession();
  const params = useParams();
  const id = params?.id as string;
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [cloned, setCloned] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const t = token ? `?token=${token}` : "";
    fetch(`/api/templates/${id}${t}`)
      .then((r) => r.json())
      .then((d: { template: Template }) => { setTemplate(d.template); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id, token]);

  const handleClone = async () => {
    if (!token || !template) return;
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-demo-token": token },
      body: JSON.stringify({ action: "clone", templateId: template.id }),
    });
    const data = await res.json() as { message?: string };
    setCloned(true);
    setToast(data.message ?? "Template di-clone ke workspace kamu.");
    setTimeout(() => setToast(null), 3000);
  };

  const semesterSteps: Array<{ semester: number; tasks: string[] }> = (() => {
    try {
      return JSON.parse(template?.semesterSteps ?? "[]") as Array<{ semester: number; tasks: string[] }>;
    } catch {
      return [];
    }
  })();

  if (loading) return (
    <div>
      <div className="skeleton" style={{ height: 30, width: 200, marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 200, marginBottom: 16 }} />
    </div>
  );

  if (!template) return (
    <div className="empty-state">
      <AlertCircle size={32} color="var(--coral)" />
      <p style={{ color: "var(--text-secondary)" }}>Template tidak ditemukan.</p>
      <Link href="/app/templates" className="btn btn-secondary btn-sm">Kembali</Link>
    </div>
  );

  return (
    <div style={{ maxWidth: 720 }}>
      <Link href="/app/templates" className="btn btn-ghost btn-sm" style={{ marginBottom: 20, display: "inline-flex" }}>
        <ArrowLeft size={14} /> Kembali
      </Link>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <span className="badge badge-teal">
            {TEMPLATE_CATEGORIES[template.category as keyof typeof TEMPLATE_CATEGORIES] ?? template.category}
          </span>
          <span className="badge badge-gray" style={{ fontSize: 11 }}>
            {template.sourceType === "terverifikasi" ? "✓ Terverifikasi" : template.sourceType === "komunitas" ? "Komunitas" : "Pengalaman Pribadi"}
          </span>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
          {template.title}
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 14 }}>
          {template.description}
        </p>

        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)", marginBottom: 16, flexWrap: "wrap" }}>
          <span>👤 {template.isAnonymous ? "Anonim" : (template.authorDisplayName ?? "Mahasiswa")}</span>
          {template.programName && <span>📚 {template.programName}</span>}
          {template.institutionName && <span>🏛 {template.institutionName}</span>}
          {template.cohortYear && <span>📅 Angkatan {template.cohortYear}</span>}
          <span>👍 {template._count.votes} bermanfaat</span>
          <span>📋 {template._count.clones} kali di-clone</span>
        </div>

        <div className="assumption-notice" style={{ marginBottom: 16 }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12 }}>
            Template ini adalah pengalaman pribadi mahasiswa, bukan kebijakan resmi kampus.
          </span>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleClone}
            disabled={cloned}
            aria-label="Clone template ini ke workspace"
          >
            <Copy size={14} />
            {cloned ? "Berhasil Di-clone!" : "Clone Template"}
          </button>
          <button className="btn btn-ghost btn-sm" aria-label="Tandai bermanfaat">
            <ThumbsUp size={14} />
            Bermanfaat
          </button>
        </div>
      </div>

      {/* Semester Steps */}
      {semesterSteps.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>
            Rencana per Semester
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {semesterSteps.map((step) => (
              <div key={step.semester} style={{ paddingBottom: 12, borderBottom: "1px solid var(--border-subtle)" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 8 }}>
                  Semester {step.semester}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {step.tasks.map((task, i) => (
                    <div key={i} style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", gap: 6 }}>
                      <span style={{ color: "var(--text-muted)" }}>•</span>
                      {task}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <MessageSquare size={16} color="var(--teal)" />
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
            Komentar ({template.comments.length})
          </h2>
        </div>
        {template.comments.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Belum ada komentar.</p>
        ) : (
          template.comments.map((c) => (
            <div key={c.id} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                  {c.user?.name ?? "Anonim"}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {new Date(c.createdAt).toLocaleDateString("id-ID")}
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{c.content}</p>
              {c.replies.map((r) => (
                <div key={r.id} style={{ marginLeft: 16, marginTop: 8, padding: "8px 12px", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>{r.user?.name ?? "Anonim"}</span>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>{r.content}</p>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {toast && (
        <div className="toast-container">
          <div className="toast info">{toast}</div>
        </div>
      )}
    </div>
  );
}
