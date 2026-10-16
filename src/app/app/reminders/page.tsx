"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/features/session/context";
import { REMINDER_CATEGORIES } from "@/lib/constants";
import { Bell, Plus, CheckCircle2, Clock, AlertCircle, Trash2 } from "lucide-react";
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

export default function RemindersPage() {
  const { token } = useSession();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", category: "akademik", deadline: "", notes: "", isOfficial: false });
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchReminders = () => {
    if (!token) return;
    fetch("/api/reminders", { headers: { "x-demo-token": token } })
      .then((r) => r.json())
      .then((d: { reminders: Reminder[] }) => { setReminders(d.reminders ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchReminders(); }, [token]);

  const addReminder = async () => {
    if (!token || !form.title) return;
    setSaving(true);
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-demo-token": token },
      body: JSON.stringify(form),
    });
    const data = await res.json() as { reminder?: Reminder; error?: string };
    if (data.reminder) {
      setReminders((prev) => [data.reminder!, ...prev]);
      setForm({ title: "", category: "akademik", deadline: "", notes: "", isOfficial: false });
      setShowForm(false);
      showToast("✓ Pengingat ditambahkan");
    } else {
      showToast(`✗ ${data.error ?? "Gagal menyimpan"}`);
    }
    setSaving(false);
  };

  const updateStatus = async (id: string, status: string) => {
    if (!token) return;
    await fetch("/api/reminders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-demo-token": token },
      body: JSON.stringify({ id, status }),
    });
    setReminders((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    showToast(status === "done" ? "✓ Ditandai selesai" : "✓ Diperbarui");
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const activeReminders = reminders.filter((r) => r.status === "active");
  const doneReminders = reminders.filter((r) => r.status !== "active");

  const categoryColors: Record<string, string> = {
    akademik: "var(--blue)",
    krs: "var(--lime)",
    mbkm: "var(--teal)",
    skripsi: "var(--purple)",
    yudisium: "var(--coral)",
    pribadi: "var(--orange)",
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
            Pengingat
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Pantau deadline akademik dan target pribadi.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)} aria-expanded={showForm}>
          <Plus size={14} />
          Tambah Pengingat
        </button>
      </div>

      <div className="assumption-notice" style={{ marginBottom: 20 }}>
        <AlertCircle size={16} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13 }}>
          Deadline yang tidak berlabel resmi adalah estimasi pribadi. Verifikasi ke website resmi kampus untuk tanggal yang akurat.
        </span>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>
            Tambah Pengingat
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label" htmlFor="title">Judul Pengingat *</label>
              <input
                id="title"
                className="form-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Contoh: Pengumpulan KRS Semester 6"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="category">Kategori</label>
              <select id="category" className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {Object.entries(REMINDER_CATEGORIES).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="deadline">Tanggal Deadline (opsional)</label>
              <input id="deadline" type="date" className="form-input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label" htmlFor="notes">Catatan (opsional)</label>
              <input id="notes" className="form-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Informasi tambahan..." />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--text-secondary)" }}>
                <input type="checkbox" checked={form.isOfficial} onChange={(e) => setForm({ ...form, isOfficial: e.target.checked })} style={{ accentColor: "var(--lime)" }} />
                Deadline resmi dari kampus
              </label>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="btn btn-primary btn-sm" onClick={addReminder} disabled={!form.title || saving}>
              {saving ? "Menyimpan..." : "Simpan Pengingat"}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Batal</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 72 }} />)}
        </div>
      ) : (
        <div>
          {/* Active */}
          {activeReminders.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                Aktif ({activeReminders.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {activeReminders.map((r) => (
                  <ReminderItem key={r.id} reminder={r} onUpdate={updateStatus} categoryColor={categoryColors[r.category] ?? "var(--text-muted)"} />
                ))}
              </div>
            </div>
          )}

          {/* Empty */}
          {activeReminders.length === 0 && !showForm && (
            <div className="empty-state">
              <Bell size={36} color="var(--text-muted)" />
              <p style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Belum ada pengingat aktif</p>
              <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                <Plus size={14} /> Tambah Pengingat
              </button>
            </div>
          )}

          {/* Done */}
          {doneReminders.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                Selesai ({doneReminders.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, opacity: 0.6 }}>
                {doneReminders.map((r) => (
                  <ReminderItem key={r.id} reminder={r} onUpdate={updateStatus} categoryColor={categoryColors[r.category] ?? "var(--text-muted)"} />
                ))}
              </div>
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

function ReminderItem({ reminder: r, onUpdate, categoryColor }: { reminder: Reminder; onUpdate: (id: string, status: string) => void; categoryColor: string }) {
  return (
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <button
        onClick={() => onUpdate(r.id, r.status === "done" ? "active" : "done")}
        style={{ background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
        aria-label={r.status === "done" ? "Tandai aktif" : "Tandai selesai"}
      >
        {r.status === "done"
          ? <CheckCircle2 size={20} color="var(--lime)" />
          : <Clock size={20} color={categoryColor} />
        }
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: r.status === "done" ? "var(--text-muted)" : "var(--text-primary)", textDecoration: r.status === "done" ? "line-through" : "none" }}>
          {r.title}
          {r.isOfficial && <span className="badge badge-lime" style={{ marginLeft: 8, fontSize: 10 }}>Resmi</span>}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 10, marginTop: 2, flexWrap: "wrap" }}>
          {r.deadline && (
            <span style={{ color: categoryColor }}>
              📅 {formatDate(r.deadline)} ({formatRelativeDate(r.deadline)})
            </span>
          )}
          {r.notes && <span>{r.notes}</span>}
        </div>
      </div>
      <span className="badge" style={{ background: `${categoryColor}15`, color: categoryColor, fontSize: 11, flexShrink: 0 }}>
        {REMINDER_CATEGORIES[r.category as keyof typeof REMINDER_CATEGORIES] ?? r.category}
      </span>
    </div>
  );
}
