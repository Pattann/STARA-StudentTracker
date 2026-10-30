"use client";

import { useState } from "react";
import { X, UploadCloud, Sparkles, ShieldCheck, CheckCircle2, AlertCircle, Building2, GraduationCap, Layers } from "lucide-react";
import { useSession } from "@/features/session/context";

interface PublishTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (templateId: string) => void;
  defaultData?: {
    institutionName?: string;
    programName?: string;
    totalSemesters?: number;
    totalCredits?: number;
  };
}

export function PublishTemplateModal({
  isOpen,
  onClose,
  onSuccess,
  defaultData,
}: PublishTemplateModalProps) {
  const { token, user } = useSession();

  const [title, setTitle] = useState(
    defaultData?.programName
      ? `Roadmap Studi ${defaultData.programName} (Alur Komprehensif)`
      : "Roadmap Studi Mahasiswa Komprehensif"
  );
  const [description, setDescription] = useState(
    "Distribusi rencana mata kuliah semester demi semester yang dioptimalkan untuk kelulusan tepat waktu, pemenuhan prasyarat, dan fokus kompetensi utama."
  );
  const [category, setCategory] = useState<string>("semester");
  const [strategyTip, setStrategyTip] = useState(
    "Pertahankan IPK minimal 3.0 pada semester fundamental agar leluasa mengambil batas maksimal 24 SKS."
  );
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [authorName, setAuthorName] = useState(user?.name || "Mahasiswa STARA");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.length < 5) {
      setErrorMsg("Judul template minimal 5 karakter.");
      return;
    }
    if (!description.trim() || description.length < 10) {
      setErrorMsg("Deskripsi template minimal 10 karakter.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-demo-token": token || "",
        },
        body: JSON.stringify({
          action: "publish_roadmap",
          title: title.trim(),
          description: description.trim(),
          category,
          strategyTip: strategyTip.trim(),
          isAnonymous,
          authorDisplayName: isAnonymous ? "Mahasiswa Anonim" : authorName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengajukan template");
      }

      setIsSuccess(true);
      if (onSuccess && data.templateId) {
        onSuccess(data.templateId);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "540px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          border: "1px solid var(--border)",
          overflow: "hidden",
          animation: "modalPop 0.2s ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#FAF9F5",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#FEF3C7",
                border: "1px solid #FDE68A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#B45309",
              }}
            >
              <UploadCloud size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
                Bagikan Roadmap ke Komunitas
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)" }}>
                Jadikan template publik yang dapat di-clone mahasiswa lain setelah diverifikasi admin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: 4, borderRadius: "50%" }}
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 22px" }}>
          {isSuccess ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "#DCFCE7",
                  border: "2px solid #86EFAC",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  color: "#15803D",
                }}
              >
                <CheckCircle2 size={28} />
              </div>
              <h4 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
                Roadmap Berhasil Diajukan!
              </h4>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>
                Rencana studi Anda telah disimpan sebagai draft template komunitas dan dikirim ke{" "}
                <strong>Dashboard Moderasi Admin STARA</strong>. Begitu admin memverifikasi kelayakan SKS & kurikulumnya,
                template akan langsung tayang secara publik di halaman <strong>Jelajahi Template</strong>.
              </p>
              <button
                className="btn btn-primary btn-sm"
                onClick={onClose}
                style={{ padding: "8px 24px", borderRadius: "8px" }}
              >
                Tutup & Kembali
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {errorMsg && (
                <div
                  style={{
                    padding: "9px 12px",
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid var(--coral)",
                    borderRadius: "8px",
                    color: "var(--coral)",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Info Banner Konteks Roadmap Mahasiswa */}
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "#334155",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Building2 size={14} color="#64748B" />
                  <span>{defaultData?.institutionName || "Telkom University"}</span>
                  <span>•</span>
                  <GraduationCap size={14} color="#64748B" />
                  <span style={{ fontWeight: 600 }}>{defaultData?.programName || "Teknik Informatika"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 700, color: "#92400E" }}>
                  <Layers size={13} color="#D97706" />
                  <span>{defaultData?.totalCredits ? `${defaultData.totalCredits} SKS` : "Roadmap Aktif"}</span>
                </div>
              </div>

              {/* Judul Template */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  Judul Template Publik <span style={{ color: "var(--coral)" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: 13 }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Roadmap 8 Semester Lulus Tepat Waktu (Fokus AI)"
                  required
                />
              </div>

              {/* Kategori */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  Kategori Template
                </label>
                <select
                  className="form-input"
                  style={{ fontSize: 13 }}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="semester">Roadmap Semester (Kurikulum Lengkap)</option>
                  <option value="magang">Persiapan Magang & MBKM</option>
                  <option value="tak">Perencanaan TAK & Portofolio</option>
                  <option value="skripsi">Timeline Skripsi & Tugas Akhir</option>
                  <option value="organisasi">Manajemen Studi & Organisasi</option>
                </select>
              </div>

              {/* Deskripsi */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  Deskripsi & Target Mahasiswa <span style={{ color: "var(--coral)" }}>*</span>
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  style={{ fontSize: 12.5, resize: "vertical" }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan untuk siapa template ini cocok dan apa keunggulan distribusinya..."
                  required
                />
              </div>

              {/* Tips Strategi */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  Tips Strategi Belajar untuk Mahasiswa Lain
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: 12.5 }}
                  value={strategyTip}
                  onChange={(e) => setStrategyTip(e.target.value)}
                  placeholder="Contoh: Ambil matkul tingkat atas saat semester genap..."
                />
              </div>

              {/* Identitas Penulis */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 2 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    fontSize: 12.5,
                    color: "var(--text-primary)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: "#D97706" }}
                  />
                  <span>Kirim secara Anonim (Sembunyikan nama profil saya)</span>
                </label>

                {!isAnonymous && (
                  <div style={{ paddingLeft: 24 }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontSize: 12, padding: "5px 10px" }}
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Nama tampilan kontributor"
                    />
                  </div>
                )}
              </div>

              {/* Keamanan & Moderasi Notice */}
              <div
                style={{
                  background: "#FFFBEB",
                  border: "1px solid #FDE68A",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 11.5,
                  color: "#92400E",
                }}
              >
                <ShieldCheck size={16} color="#D97706" style={{ flexShrink: 0 }} />
                <span>
                  Template Anda akan langsung masuk ke panel <strong>Admin STARA</strong> untuk diverifikasi sebelum
                  ditayangkan ke publik.
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onClose}
                  disabled={isLoading}
                  style={{ padding: "7px 16px" }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isLoading}
                  style={{ padding: "7px 20px", display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Sparkles size={14} />
                  <span>{isLoading ? "Mengirim ke Admin..." : "Ajukan Template"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
