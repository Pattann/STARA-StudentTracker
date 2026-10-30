"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "@/features/session/context";
import { REMINDER_CATEGORIES } from "@/lib/constants";
import {
  Bell,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Calendar,
  Pencil,
  Check,
  X,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { formatDate, formatRelativeDate } from "@/lib/utils";

type Reminder = {
  id: string;
  title: string;
  category: string;
  deadline?: string | null;
  sourceLabel?: string | null;
  isOfficial: boolean;
  status: string;
  notes?: string | null;
};

type CategoryTheme = {
  label: string;
  text: string;
  bg: string;
  border: string;
  accent: string;
};

const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  krs: {
    label: "KRS / Registrasi",
    text: "#92400E",
    bg: "#FEF3C7",
    border: "#FDE68A",
    accent: "#D97706",
  },
  akademik: {
    label: "Deadline Akademik",
    text: "#1E40AF",
    bg: "#DBEAFE",
    border: "#BFDBFE",
    accent: "#2563EB",
  },
  mbkm: {
    label: "MBKM / Magang",
    text: "#0F766E",
    bg: "#CCFBF1",
    border: "#99F6E4",
    accent: "#0D9488",
  },
  skripsi: {
    label: "Skripsi / TA",
    text: "#6D28D9",
    bg: "#EDE9FE",
    border: "#DDD6FE",
    accent: "#7C3AED",
  },
  yudisium: {
    label: "Yudisium / Wisuda",
    text: "#B91C1C",
    bg: "#FEE2E2",
    border: "#FECACA",
    accent: "#DC2626",
  },
  pribadi: {
    label: "Target Pribadi",
    text: "#C2410C",
    bg: "#FFEDD5",
    border: "#FED7AA",
    accent: "#EA580C",
  },
};

function getCategoryTheme(category: string): CategoryTheme {
  return (
    CATEGORY_THEMES[category] ?? {
      label: REMINDER_CATEGORIES[category as keyof typeof REMINDER_CATEGORIES] ?? category,
      text: "#475569",
      bg: "#F1F5F9",
      border: "#E2E8F0",
      accent: "#64748B",
    }
  );
}

export default function RemindersPage() {
  const { token, isLoading: sessionLoading } = useSession();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "akademik",
    deadline: "",
    notes: "",
    isOfficial: false,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    category: "akademik",
    deadline: "",
    notes: "",
    isOfficial: false,
  });
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "done">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const fetchReminders = useCallback(async () => {
    const activeToken =
      token || (typeof window !== "undefined" ? localStorage.getItem("stara_token") : null);

    if (!activeToken) {
      if (!sessionLoading) setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reminders", {
        headers: {
          "x-demo-token": activeToken,
          Authorization: `Bearer ${activeToken}`,
        },
      });
      const data = (await res.json()) as { reminders?: Reminder[] };
      setReminders(data.reminders ?? []);
    } catch {
      showToast("✗ Gagal memuat daftar pengingat");
    } finally {
      setLoading(false);
    }
  }, [token, sessionLoading]);

  useEffect(() => {
    if (!sessionLoading) {
      fetchReminders();
    }
  }, [fetchReminders, sessionLoading]);

  const getActiveToken = () =>
    token || (typeof window !== "undefined" ? localStorage.getItem("stara_token") : null);

  const addReminder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const activeToken = getActiveToken();
    if (!activeToken || !form.title.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-demo-token": activeToken,
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          category: form.category,
          deadline: form.deadline || null,
          notes: form.notes.trim() || null,
          isOfficial: form.isOfficial,
        }),
      });
      const data = (await res.json()) as { reminder?: Reminder; error?: string };
      if (res.ok && data.reminder) {
        setReminders((prev) => [data.reminder!, ...prev]);
        setForm({
          title: "",
          category: "akademik",
          deadline: "",
          notes: "",
          isOfficial: false,
        });
        setShowForm(false);
        showToast("✓ Pengingat berhasil ditambahkan");
      } else {
        showToast(`✗ ${data.error ?? "Gagal menyimpan pengingat"}`);
      }
    } catch {
      showToast("✗ Gagal terhubung ke server");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (r: Reminder) => {
    const activeToken = getActiveToken();
    if (!activeToken) return;
    const nextStatus = r.status === "done" ? "active" : "done";
    setBusyId(r.id);

    // Optimistic update
    setReminders((prev) =>
      prev.map((item) => (item.id === r.id ? { ...item, status: nextStatus } : item))
    );

    try {
      const res = await fetch("/api/reminders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-demo-token": activeToken,
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ id: r.id, status: nextStatus }),
      });
      if (!res.ok) {
        // Revert on failure
        setReminders((prev) =>
          prev.map((item) => (item.id === r.id ? { ...item, status: r.status } : item))
        );
        showToast("✗ Gagal memperbarui status pengingat");
      } else {
        showToast(nextStatus === "done" ? "✓ Pengingat ditandai selesai" : "✓ Pengingat diaktifkan kembali");
      }
    } catch {
      setReminders((prev) =>
        prev.map((item) => (item.id === r.id ? { ...item, status: r.status } : item))
      );
      showToast("✗ Gagal memperbarui status pengingat");
    } finally {
      setBusyId(null);
    }
  };

  const startEditing = (r: Reminder) => {
    setEditingId(r.id);
    setEditForm({
      title: r.title,
      category: r.category in CATEGORY_THEMES ? r.category : "akademik",
      deadline: r.deadline ? r.deadline.slice(0, 10) : "",
      notes: r.notes ?? "",
      isOfficial: Boolean(r.isOfficial),
    });
  };

  const saveEdit = async (id: string) => {
    const activeToken = getActiveToken();
    if (!activeToken || !editForm.title.trim()) return;
    setBusyId(id);

    try {
      const res = await fetch("/api/reminders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-demo-token": activeToken,
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          id,
          title: editForm.title.trim(),
          category: editForm.category,
          deadline: editForm.deadline || null,
          notes: editForm.notes.trim() || null,
          isOfficial: editForm.isOfficial,
        }),
      });
      const data = (await res.json()) as { reminder?: Reminder; error?: string };
      if (res.ok && data.reminder) {
        setReminders((prev) => prev.map((item) => (item.id === id ? data.reminder! : item)));
        setEditingId(null);
        showToast("✓ Perubahan pengingat disimpan");
      } else {
        showToast(`✗ ${data.error ?? "Gagal memperbarui pengingat"}`);
      }
    } catch {
      showToast("✗ Gagal menyimpan perubahan");
    } finally {
      setBusyId(null);
    }
  };

  const deleteReminder = async (id: string) => {
    const activeToken = getActiveToken();
    if (!activeToken) return;
    setBusyId(id);

    const previous = reminders;
    setReminders((prev) => prev.filter((item) => item.id !== id));

    try {
      const res = await fetch(`/api/reminders?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          "x-demo-token": activeToken,
          Authorization: `Bearer ${activeToken}`,
        },
      });
      if (!res.ok) {
        setReminders(previous);
        showToast("✗ Gagal menghapus pengingat");
      } else {
        showToast("✓ Pengingat dihapus");
      }
    } catch {
      setReminders(previous);
      showToast("✗ Gagal menghapus pengingat");
    } finally {
      setBusyId(null);
    }
  };

  const activeReminders = useMemo(
    () => reminders.filter((r) => r.status === "active"),
    [reminders]
  );
  const doneReminders = useMemo(
    () => reminders.filter((r) => r.status !== "active"),
    [reminders]
  );

  const filteredReminders = useMemo(() => {
    return reminders.filter((r) => {
      if (statusFilter === "active" && r.status !== "active") return false;
      if (statusFilter === "done" && r.status === "active") return false;
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      return true;
    });
  }, [reminders, statusFilter, categoryFilter]);

  const filteredActive = filteredReminders.filter((r) => r.status === "active");
  const filteredDone = filteredReminders.filter((r) => r.status !== "active");

  const nearestDeadlineReminder = useMemo(() => {
    const withDeadlines = activeReminders
      .filter((r) => Boolean(r.deadline))
      .sort((a, b) => (a.deadline! > b.deadline! ? 1 : -1));
    return withDeadlines[0] ?? null;
  }, [activeReminders]);

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", paddingBottom: 40 }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 999,
              background: "#FEF3C7",
              border: "1px solid #FDE68A",
              color: "#92400E",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            <Sparkles size={12} color="#D97706" />
            AGENDA & TENGGAT STUDI • PENGINGAT AKTIF
          </div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#0F172A",
              letterSpacing: "-0.02em",
              marginBottom: 4,
            }}
          >
            Pengingat & Agenda Akademik
          </h1>
          <p style={{ fontSize: 14, color: "#475569" }}>
            Pantau jadwal pengisian KRS, evaluasi tengah semester, pendaftaran MBKM, hingga target tugas akhir.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          aria-expanded={showForm}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: 999,
            border: "none",
            background: showForm ? "#0F172A" : "#D97706",
            color: "#FFFFFF",
            fontSize: 13.5,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: showForm
              ? "0 2px 8px rgba(15, 23, 42, 0.15)"
              : "0 4px 12px rgba(217, 119, 6, 0.25)",
            transition: "all 0.15s ease",
          }}
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Tutup Form" : "Tambah Pengingat"}
        </button>
      </div>

      {/* Summary Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 14,
            padding: "16px 18px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Pengingat Aktif
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: "#0F172A" }}>
              {activeReminders.length}
            </span>
            <span style={{ fontSize: 12.5, color: "#64748B", fontWeight: 500 }}>
              agenda berjalan
            </span>
          </div>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 14,
            padding: "16px 18px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Tenggat Terdekat
          </div>
          <div style={{ marginTop: 6 }}>
            {nearestDeadlineReminder ? (
              <>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#0F172A",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {nearestDeadlineReminder.title}
                </div>
                <div style={{ fontSize: 12, color: "#B45309", fontWeight: 600, marginTop: 2 }}>
                  {formatDate(nearestDeadlineReminder.deadline!)} ({formatRelativeDate(nearestDeadlineReminder.deadline!)})
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13.5, color: "#64748B", fontWeight: 500, marginTop: 4 }}>
                Belum ada tenggat terjadwal
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 14,
            padding: "16px 18px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Agenda Tuntas
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: "#15803D" }}>
              {doneReminders.length}
            </span>
            <span style={{ fontSize: 12.5, color: "#64748B", fontWeight: 500 }}>
              selesai dikerjakan
            </span>
          </div>
        </div>
      </div>

      {/* Warm Amber Notice Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          background: "#FFFBEB",
          border: "1px solid #FDE68A",
          borderRadius: 12,
          color: "#92400E",
          marginBottom: 20,
        }}
      >
        <AlertCircle size={18} color="#D97706" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13, lineHeight: 1.5, fontWeight: 500 }}>
          Deadline yang tidak berlabel <strong>Resmi Kampus</strong> adalah estimasi pribadi. Selalu verifikasi ke kalender akademik resmi kampus Anda untuk tanggal yang akurat.
        </span>
      </div>

      {/* Add Form Card */}
      {showForm && (
        <form
          onSubmit={addReminder}
          style={{
            background: "#FFFFFF",
            border: "1px solid #FDE68A",
            borderRadius: 16,
            padding: "20px 22px",
            marginBottom: 22,
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
                Tambah Pengingat Baru
              </h2>
              <p style={{ fontSize: 12.5, color: "#64748B", marginTop: 2 }}>
                Simpan tenggat penting agar terpantau di agenda semester Anda.
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label
                htmlFor="reminder-title"
                style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}
              >
                Judul Pengingat <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <input
                id="reminder-title"
                className="form-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Contoh: Pengisian KRS Semester Depan / Pendaftaran Sidang Proposal"
                required
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #CBD5E1",
                  color: "#0F172A",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="reminder-category"
                style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}
              >
                Kategori Agenda
              </label>
              <select
                id="reminder-category"
                className="form-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #CBD5E1",
                  color: "#0F172A",
                }}
              >
                {Object.entries(REMINDER_CATEGORIES).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="reminder-deadline"
                style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}
              >
                Tanggal Deadline (Opsional)
              </label>
              <input
                id="reminder-deadline"
                type="date"
                className="form-input"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #CBD5E1",
                  color: "#0F172A",
                }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label
                htmlFor="reminder-notes"
                style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}
              >
                Catatan Tambahan (Opsional)
              </label>
              <input
                id="reminder-notes"
                className="form-input"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Contoh: Pastikan sudah konsultasi dengan dosen wali sebelum finalisasi..."
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #CBD5E1",
                  color: "#0F172A",
                }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#334155",
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.isOfficial}
                  onChange={(e) => setForm({ ...form, isOfficial: e.target.checked })}
                  style={{ accentColor: "#D97706", width: 16, height: 16 }}
                />
                Tandai sebagai jadwal / kalender resmi dari kampus
              </label>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
            <button
              type="submit"
              disabled={!form.title.trim() || saving}
              style={{
                padding: "9px 18px",
                borderRadius: 10,
                border: "none",
                background: !form.title.trim() || saving ? "#CBD5E1" : "#D97706",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 700,
                cursor: !form.title.trim() || saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Menyimpan..." : "Simpan Pengingat"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                padding: "9px 16px",
                borderRadius: 10,
                border: "1px solid #CBD5E1",
                background: "#FFFFFF",
                color: "#475569",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Filter Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            background: "#F1F5F9",
            padding: 4,
            borderRadius: 10,
            border: "1px solid #E2E8F0",
          }}
        >
          {(
            [
              { id: "all", label: `Semua (${reminders.length})` },
              { id: "active", label: `Aktif (${activeReminders.length})` },
              { id: "done", label: `Selesai (${doneReminders.length})` },
            ] as const
          ).map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 7,
                  border: "none",
                  background: active ? "#FFFFFF" : "transparent",
                  color: active ? "#0F172A" : "#64748B",
                  fontSize: 12.5,
                  fontWeight: active ? 700 : 600,
                  cursor: "pointer",
                  boxShadow: active ? "0 1px 2px rgba(15, 23, 42, 0.06)" : "none",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            style={{
              padding: "5px 11px",
              borderRadius: 999,
              border: categoryFilter === "all" ? "1px solid #D97706" : "1px solid #E2E8F0",
              background: categoryFilter === "all" ? "#FEF3C7" : "#FFFFFF",
              color: categoryFilter === "all" ? "#92400E" : "#475569",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Semua Kategori
          </button>
          {Object.entries(REMINDER_CATEGORIES).map(([catKey, catLabel]) => {
            const selected = categoryFilter === catKey;
            const theme = getCategoryTheme(catKey);
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setCategoryFilter(selected ? "all" : catKey)}
                style={{
                  padding: "5px 11px",
                  borderRadius: 999,
                  border: selected ? `1px solid ${theme.accent}` : "1px solid #E2E8F0",
                  background: selected ? theme.bg : "#FFFFFF",
                  color: selected ? theme.text : "#475569",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {catLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />
          ))}
        </div>
      ) : (
        <div>
          {/* Active Section */}
          {statusFilter !== "done" && filteredActive.length > 0 && (
            <div style={{ marginBottom: 26 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 10,
                }}
              >
                AKTIF ({filteredActive.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredActive.map((r) => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    isBusy={busyId === r.id}
                    isEditing={editingId === r.id}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    onToggleStatus={() => toggleStatus(r)}
                    onStartEdit={() => startEditing(r)}
                    onCancelEdit={() => setEditingId(null)}
                    onSaveEdit={() => saveEdit(r.id)}
                    onDelete={() => deleteReminder(r.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Done Section */}
          {statusFilter !== "active" && filteredDone.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#64748B",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 10,
                }}
              >
                SELESAI ({filteredDone.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredDone.map((r) => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    isBusy={busyId === r.id}
                    isEditing={editingId === r.id}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    onToggleStatus={() => toggleStatus(r)}
                    onStartEdit={() => startEditing(r)}
                    onCancelEdit={() => setEditingId(null)}
                    onSaveEdit={() => saveEdit(r.id)}
                    onDelete={() => deleteReminder(r.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredReminders.length === 0 && !showForm && (
            <div
              style={{
                background: "#FFFFFF",
                border: "1px dashed #CBD5E1",
                borderRadius: 16,
                padding: "44px 24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "#FEF3C7",
                  border: "1px solid #FDE68A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                }}
              >
                <Bell size={24} color="#D97706" />
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>
                {reminders.length === 0
                  ? "Belum ada pengingat akademik"
                  : "Tidak ada pengingat yang cocok dengan filter"}
              </p>
              <p style={{ fontSize: 13, color: "#64748B", maxWidth: 420, margin: "0 auto 18px" }}>
                {reminders.length === 0
                  ? "Tambahkan jadwal pengisian KRS, target nilai tengah semester, atau agenda bimbingan agar tidak terlewat."
                  : "Coba ubah filter status atau kategori untuk melihat daftar pengingat lainnya."}
              </p>
              {reminders.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 18px",
                    borderRadius: 999,
                    border: "none",
                    background: "#D97706",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Plus size={14} /> Tambah Pengingat Pertama
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("all");
                    setCategoryFilter("all");
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 999,
                    border: "1px solid #CBD5E1",
                    background: "#FFFFFF",
                    color: "#334155",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Reset Filter
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.startsWith("✓") ? "success" : "error"}`}>{toast}</div>
        </div>
      )}
    </div>
  );
}

type EditFormState = {
  title: string;
  category: string;
  deadline: string;
  notes: string;
  isOfficial: boolean;
};

function ReminderCard({
  reminder: r,
  isBusy,
  isEditing,
  editForm,
  setEditForm,
  onToggleStatus,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: {
  reminder: Reminder;
  isBusy: boolean;
  isEditing: boolean;
  editForm: EditFormState;
  setEditForm: React.Dispatch<React.SetStateAction<EditFormState>>;
  onToggleStatus: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
}) {
  const theme = getCategoryTheme(r.category);
  const isDone = r.status === "done";

  if (isEditing) {
    return (
      <div
        style={{
          background: "#FFFFFF",
          border: "1.5px solid #D97706",
          borderRadius: 14,
          padding: "16px 18px",
          boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: "#B45309", marginBottom: 10 }}>
          Edit Pengingat
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <input
              className="form-input"
              value={editForm.title}
              onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Judul pengingat"
              style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", color: "#0F172A" }}
            />
          </div>
          <div>
            <select
              className="form-input"
              value={editForm.category}
              onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
              style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", color: "#0F172A" }}
            >
              {Object.entries(REMINDER_CATEGORIES).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <input
              type="date"
              className="form-input"
              value={editForm.deadline}
              onChange={(e) => setEditForm((prev) => ({ ...prev, deadline: e.target.value }))}
              style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", color: "#0F172A" }}
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <input
              className="form-input"
              value={editForm.notes}
              onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Catatan tambahan (opsional)"
              style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", color: "#0F172A" }}
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#334155", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={editForm.isOfficial}
                onChange={(e) => setEditForm((prev) => ({ ...prev, isOfficial: e.target.checked }))}
                style={{ accentColor: "#D97706" }}
              />
              Deadline resmi dari kampus
            </label>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            type="button"
            onClick={onSaveEdit}
            disabled={isBusy || !editForm.title.trim()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              border: "none",
              background: "#D97706",
              color: "#FFFFFF",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Check size={14} /> Simpan
          </button>
          <button
            type="button"
            onClick={onCancelEdit}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 12px",
              borderRadius: 8,
              border: "1px solid #CBD5E1",
              background: "#FFFFFF",
              color: "#475569",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <X size={14} /> Batal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: isDone ? "#F8FAFC" : "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderLeft: `4px solid ${isDone ? "#22C55E" : theme.accent}`,
        borderRadius: 14,
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        boxShadow: isDone ? "none" : "0 1px 3px rgba(15, 23, 42, 0.03)",
        opacity: isDone ? 0.82 : 1,
        transition: "all 0.15s ease",
      }}
    >
      {/* Status Toggle Button */}
      <button
        type="button"
        onClick={onToggleStatus}
        disabled={isBusy}
        aria-label={isDone ? "Tandai aktif kembali" : "Tandai selesai"}
        title={isDone ? "Tandai aktif kembali" : "Tandai selesai"}
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: isDone ? "1px solid #BBF7D0" : `1px solid ${theme.border}`,
          background: isDone ? "#DCFCE7" : theme.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: isBusy ? "wait" : "pointer",
          flexShrink: 0,
        }}
      >
        {isDone ? (
          <CheckCircle2 size={18} color="#15803D" />
        ) : (
          <Clock size={18} color={theme.text} />
        )}
      </button>

      {/* Main Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 14.5,
              fontWeight: 700,
              color: isDone ? "#64748B" : "#0F172A",
              textDecoration: isDone ? "line-through" : "none",
            }}
          >
            {r.title}
          </span>
          {r.isOfficial && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                borderRadius: 999,
                background: "#DCFCE7",
                border: "1px solid #BBF7D0",
                color: "#166534",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <ShieldCheck size={12} /> Resmi Kampus
            </span>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 5,
            flexWrap: "wrap",
            fontSize: 12.5,
          }}
        >
          {r.deadline && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "2px 8px",
                borderRadius: 6,
                background: isDone ? "#F1F5F9" : theme.bg,
                color: isDone ? "#64748B" : theme.text,
                fontWeight: 700,
              }}
            >
              <Calendar size={12} />
              {formatDate(r.deadline)} ({formatRelativeDate(r.deadline)})
            </span>
          )}
          {r.notes && (
            <span style={{ color: "#475569", fontWeight: 500 }}>{r.notes}</span>
          )}
        </div>
      </div>

      {/* Category Pill + Action Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            background: theme.bg,
            border: `1px solid ${theme.border}`,
            color: theme.text,
            fontSize: 11.5,
            fontWeight: 700,
          }}
        >
          {theme.label}
        </span>

        <button
          type="button"
          onClick={onStartEdit}
          disabled={isBusy}
          aria-label="Edit pengingat"
          title="Edit pengingat"
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            border: "1px solid #E2E8F0",
            background: "#FFFFFF",
            color: "#64748B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Pencil size={13.5} />
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={isBusy}
          aria-label="Hapus pengingat"
          title="Hapus pengingat"
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            border: "1px solid #FEE2E2",
            background: "#FFF5F5",
            color: "#DC2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Trash2 size={13.5} />
        </button>
      </div>
    </div>
  );
}
