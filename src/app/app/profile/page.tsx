"use client";

import { useEffect, useState } from "react";
import { useSession, setCachedRoadmap } from "@/features/session/context";
import { generateAcademicSummaryPdf } from "@/lib/pdf-export";
import {
  AVATAR_OPTIONS,
  StudentAvatarBadge,
  useStudentAvatar,
} from "@/components/ui/StudentAvatar";
import {
  User,
  GraduationCap,
  Sparkles,
  Bell,
  Download,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Lock,
  RotateCcw,
  Cpu,
  Save,
} from "lucide-react";
import Link from "next/link";

const FLOW_STORAGE_KEY = "stara_flow_done";
const PREF_REMINDERS_KEY = "stara_reminder_prefs";

interface ProfileResponse {
  profile: {
    institutionName: string;
    facultyName: string | null;
    programName: string;
    educationLevel: string;
    entryYear: number;
    currentSemester: number;
    totalCurriculumCredits: number;
    completedCredits: number;
    gpa: number | null;
    goals: string;
    interests: string;
    studyMode: string | null;
    takEnabled: boolean;
    takTarget: number | null;
    weeklyHours: number | null;
  } | null;
  campuses: string[];
  programs: Array<{
    name: string;
    faculty: string;
    level: string;
    totalCredits: number;
  }>;
}

export default function ProfilePage() {
  const { token, user, updateUser, clearSession } = useSession();

  const [loading, setLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingAcademic, setSavingAcademic] = useState(false);
  const [savingAi, setSavingAi] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // 1. Account Identity State (No NIM)
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [avatarId, setAvatarId] = useStudentAvatar(user?.id);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // 2. Academic & Study Target State
  const [institutionName, setInstitutionName] = useState("Telkom University");
  const [facultyName, setFacultyName] = useState("Fakultas Informatika");
  const [programName, setProgramName] = useState("S1 Teknik Informatika");
  const [educationLevel, setEducationLevel] = useState("S1");
  const [entryYear, setEntryYear] = useState("2023");
  const [currentSemester, setCurrentSemester] = useState("4");
  const [totalCurriculumCredits, setTotalCurriculumCredits] = useState("144");
  const [completedCredits, setCompletedCredits] = useState("60");
  const [gpa, setGpa] = useState("3.50");
  const [goals, setGoals] = useState("balanced");
  const [takEnabled, setTakEnabled] = useState(true);
  const [takTarget, setTakTarget] = useState("120");
  const [interests, setInterests] = useState("");

  // 3. AI & Recommendation Preferences (Focused on study & pre-thesis planning, not completed thesis)
  const [studyMode, setStudyMode] = useState("academic_gpa");
  const [weeklyHours, setWeeklyHours] = useState("20");

  // 4. Reminder & Display Preferences
  const [reminderPrefs, setReminderPrefs] = useState({
    krsDeadline: true,
    semesterCheckIn: true,
    preThesisPrep: true,
  });
  const [flowCompletedCount, setFlowCompletedCount] = useState(0);

  // Reference lists from Admin DB
  const [campuses, setCampuses] = useState<string[]>([]);
  const [programs, setPrograms] = useState<ProfileResponse["programs"]>([]);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (user) {
      setAccountName(user.name || "");
      setAccountEmail(user.email || "");
    }
  }, [user]);

  useEffect(() => {
    try {
      const rawFlow = localStorage.getItem(FLOW_STORAGE_KEY);
      if (rawFlow) {
        const parsed = JSON.parse(rawFlow) as string[];
        setFlowCompletedCount(Array.isArray(parsed) ? parsed.length : 0);
      }
      const rawPrefs = localStorage.getItem(PREF_REMINDERS_KEY);
      if (rawPrefs) {
        setReminderPrefs(JSON.parse(rawPrefs));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/profile?token=${token}`, {
      headers: { "x-demo-token": token },
    })
      .then((r) => r.json())
      .then((data: ProfileResponse) => {
        if (data.campuses) setCampuses(data.campuses);
        if (data.programs) setPrograms(data.programs);
        if (data.profile) {
          const p = data.profile;
          setInstitutionName(p.institutionName || "Telkom University");
          setFacultyName(p.facultyName || "");
          setProgramName(p.programName || "");
          setEducationLevel(p.educationLevel || "S1");
          setEntryYear(String(p.entryYear || 2023));
          setCurrentSemester(String(p.currentSemester || 4));
          setTotalCurriculumCredits(String(p.totalCurriculumCredits || 144));
          setCompletedCredits(String(p.completedCredits || 0));
          setGpa(p.gpa !== null && p.gpa !== undefined ? String(p.gpa) : "3.50");
          setGoals(p.goals || "balanced");
          setTakEnabled(p.takEnabled ?? true);
          setTakTarget(String(p.takTarget ?? 120));
          setStudyMode(p.studyMode || "academic_gpa");
          setWeeklyHours(String(p.weeklyHours ?? 20));
          try {
            const parsedInterests = JSON.parse(p.interests || "[]");
            if (Array.isArray(parsedInterests)) {
              setInterests(parsedInterests.join(", "));
            }
          } catch {
            setInterests(p.interests || "");
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [token]);

  // Handler 1: Save Account Identity
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!accountName.trim() || !accountEmail.trim()) {
      showToast("Nama lengkap dan email kampus wajib diisi.", "error");
      return;
    }
    if (newPassword.trim() && newPassword.trim().length < 6) {
      showToast("Kata sandi baru minimal harus 6 karakter.", "error");
      return;
    }

    setSavingAccount(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({
          type: "account",
          userId: user?.id,
          name: accountName.trim(),
          email: accountEmail.trim(),
          newPassword: newPassword.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memperbarui akun.");

      updateUser({
        id: json.user?.id ?? user?.id ?? "student-user",
        name: accountName.trim(),
        email: accountEmail.trim(),
      });
      setNewPassword("");
      showToast(json.message || "Identitas akun berhasil diperbarui!");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Gagal menyimpan akun.", "error");
    } finally {
      setSavingAccount(false);
    }
  };

  // Handler 2: Save Academic Data & Target Studi
  const handleSaveAcademic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const parsedGpa = parseFloat(gpa);
    if (isNaN(parsedGpa) || parsedGpa < 0 || parsedGpa > 4.0) {
      showToast("IPK harus berada di rentang 0.00 hingga 4.00 (maksimal 4.00).", "error");
      return;
    }

    setSavingAcademic(true);
    try {
      const interestList = interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({
          type: "academic",
          institutionName,
          facultyName,
          programName,
          educationLevel,
          entryYear: parseInt(entryYear) || 2023,
          currentSemester: parseInt(currentSemester) || 4,
          totalCurriculumCredits: parseInt(totalCurriculumCredits) || 144,
          completedCredits: parseInt(completedCredits) || 0,
          gpa: parseFloat(gpa) || 0,
          goals,
          takEnabled,
          takTarget: parseInt(takTarget) || 120,
          interests: interestList,
          studyMode,
          weeklyHours: parseInt(weeklyHours) || 20,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan data akademik.");

      // Clear client roadmap cache so Beranda & Roadmap reflect changes immediately
      setCachedRoadmap(token, null);
      showToast("Data akademik & target studi berhasil disinkronkan ke Beranda & Roadmap!");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Gagal menyimpan data akademik.", "error");
    } finally {
      setSavingAcademic(false);
    }
  };

  // Handler 3: Save AI Preferences
  const handleSaveAiPrefs = async () => {
    if (!token) return;
    setSavingAi(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-token": token },
        body: JSON.stringify({
          type: "ai_preferences",
          studyMode,
          weeklyHours: parseInt(weeklyHours) || 20,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan preferensi AI.");
      setCachedRoadmap(token, null);
      showToast("Preferensi asisten AI & kapasitas belajar berhasil disimpan!");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Gagal menyimpan preferensi AI.", "error");
    } finally {
      setSavingAi(false);
    }
  };

  // Handler 4: Toggle Reminder Prefs & Reset Guided Flow
  const toggleReminderPref = (key: keyof typeof reminderPrefs) => {
    setReminderPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(PREF_REMINDERS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    showToast("Preferensi pengingat diperbarui.");
  };

  const handleResetGuidedFlow = () => {
    try {
      localStorage.removeItem(FLOW_STORAGE_KEY);
      setFlowCompletedCount(0);
      showToast("Kotak panduan 'Mulai di Sini' berhasil ditampilkan kembali di Beranda!");
    } catch {
      /* ignore */
    }
  };

  // Handler 5: Export Academic & Roadmap Summary PDF
  const handleExportData = async () => {
    if (!token) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/profile?token=${token}&export=1`, {
        headers: { "x-demo-token": token },
      });
      const data = await res.json();
      const p = data.profile;
      const semNum = parseInt(currentSemester) || p?.currentSemester || 4;
      const totSks = parseInt(totalCurriculumCredits) || p?.totalCurriculumCredits || 144;
      const compSks = parseInt(completedCredits) || p?.completedCredits || 0;
      const remSks = Math.max(0, totSks - compSks);
      const estGrad =
        (goals || p?.goals) === "fast" ? Math.max(semNum, 7) : Math.max(semNum, 8);

      // Clear client cache so Beranda & Roadmap also reflect the auto-seeded roadmap if it was created
      setCachedRoadmap(token, null);

      const pdfBlob = generateAcademicSummaryPdf({
        studentName: accountName || user?.name || "Mahasiswa STARA",
        studentEmail: accountEmail || user?.email || "mahasiswa@student.stara.ac.id",
        institutionName: institutionName || p?.institutionName || "Telkom University",
        facultyName: facultyName || p?.facultyName || "Fakultas Utama",
        programName: programName || p?.programName || "Program Studi",
        educationLevel: educationLevel || p?.educationLevel || "S1",
        entryYear: parseInt(entryYear) || p?.entryYear || 2023,
        currentSemester: semNum,
        completedCredits: compSks,
        totalCurriculumCredits: totSks,
        remainingCredits: remSks,
        gpa: gpa ? parseFloat(gpa) : p?.gpa ?? null,
        estimatedGraduationSemester: estGrad,
        goals: goals || p?.goals || "balanced",
        takEnabled: takEnabled ?? p?.takEnabled ?? true,
        takTarget: parseInt(takTarget) || p?.takTarget || 120,
        studyMode: studyMode || p?.studyMode || "academic_gpa",
        weeklyHours: parseInt(weeklyHours) || p?.weeklyHours || 20,
        interests: interests || "Teknologi, Riset & Pengembangan",
        semesterPlans: data.semesterPlans ?? [],
        achievements: data.achievements ?? [],
        reminders: data.reminders ?? [],
      });

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stara-ringkasan-akademik-${(accountName || user?.name || "mahasiswa")
        .toLowerCase()
        .replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Dokumen PDF Ringkasan Akademik & Roadmap lengkap berhasil diunduh!");
    } catch {
      showToast("Gagal membuat dokumen PDF ringkasan akademik.", "error");
    } finally {
      setExporting(false);
    }
  };

  const userInitial = (accountName || user?.name || "M").trim().charAt(0).toUpperCase();

  return (
    <div style={{ maxWidth: 840, paddingBottom: 40 }}>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`toast ${toast.type}`}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {toast.type === "error" ? (
            <AlertCircle size={18} color="var(--coral)" />
          ) : (
            <CheckCircle2 size={18} color="#16A34A" />
          )}
          <span style={{ fontWeight: 600 }}>{toast.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
          Profil & Pengaturan
        </h1>
        <p style={{ fontSize: 13.5, color: "var(--text-secondary)", margin: 0 }}>
          Kelola identitas akun, perbarui progres akademik tiap semester, dan sesuaikan preferensi rekomendasi AI STARA.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════════
          1. IDENTITAS & KEAMANAN AKUN (TANPA NIM)
          ══════════════════════════════════════════════════════════════════════════════ */}
      <form onSubmit={handleSaveAccount} className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <StudentAvatarBadge
              avatarId={avatarId}
              initial={userInitial}
              size={54}
              showEditHint={true}
              onClick={() => setShowAvatarPicker((prev) => !prev)}
              title="Klik untuk memilih karakter avatar"
            />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <User size={16} color="var(--amber-deep)" />
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                  Identitas & Keamanan Akun
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker((prev) => !prev)}
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: "var(--radius-pill)",
                    background: "rgba(245, 205, 71, 0.2)",
                    border: "1px solid rgba(217, 119, 6, 0.35)",
                    color: "var(--amber-deep)",
                    cursor: "pointer",
                  }}
                >
                  {showAvatarPicker ? "Tutup Pilihan Karakter" : "✨ Pilih Karakter Avatar"}
                </button>
              </div>
              <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "3px 0 0" }}>
                Perubahan nama, email, dan karakter avatar akan langsung disinkronkan ke Sidebar dan Header atas.
              </p>
            </div>
          </div>
          <span className="badge badge-green">Akun Mahasiswa Aktif</span>
        </div>

        {/* Interactive Animal & Character Avatar Picker */}
        <div
          style={{
            marginBottom: 18,
            padding: "12px 14px",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-base)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showAvatarPicker ? 10 : 0, gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)" }}>
                Karakter Avatar Kamu:
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--amber-deep)",
                  background: "rgba(245, 205, 71, 0.22)",
                  padding: "2px 9px",
                  borderRadius: "var(--radius-pill)",
                }}
              >
                {AVATAR_OPTIONS.find((o) => o.id === avatarId)?.name || "Rubah Cerdik"} —{" "}
                {AVATAR_OPTIONS.find((o) => o.id === avatarId)?.trait || "Strategis & Adaptif"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {AVATAR_OPTIONS.map((opt) => {
                const isSelected = avatarId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setAvatarId(opt.id);
                      showToast(`Karakter avatar diubah menjadi ${opt.name}!`);
                    }}
                    title={`${opt.name} (${opt.trait})`}
                    style={{
                      padding: 2,
                      borderRadius: "50%",
                      border: isSelected ? `2.5px solid var(--text-primary)` : "2px solid transparent",
                      background: isSelected ? "var(--bg-elevated)" : "transparent",
                      cursor: "pointer",
                      transform: isSelected ? "scale(1.08)" : "scale(1)",
                      transition: "all 0.15s ease",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <StudentAvatarBadge avatarId={opt.id} initial={userInitial} size={34} />
                  </button>
                );
              })}
            </div>
          </div>

          {showAvatarPicker && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: 8,
                marginTop: 10,
                paddingTop: 10,
                borderTop: "1px solid var(--border-subtle)",
              }}
            >
              {AVATAR_OPTIONS.map((opt) => {
                const active = avatarId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setAvatarId(opt.id);
                      showToast(`Karakter avatar diubah menjadi ${opt.name}!`);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      border: active ? `2px solid ${opt.border}` : "1px solid var(--border)",
                      background: active ? "var(--bg-elevated)" : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "var(--transition)",
                    }}
                  >
                    <StudentAvatarBadge avatarId={opt.id} initial={userInitial} size={36} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {opt.name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {opt.trait}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Nama Lengkap</label>
            <input
              type="text"
              className="form-input"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Contoh: Rendy Pratama"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Kampus / Akun</label>
            <input
              type="email"
              className="form-input"
              value={accountEmail}
              onChange={(e) => setAccountEmail(e.target.value)}
              placeholder="nama@student.telkomuniversity.ac.id"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Lock size={13} />
              <span>Kata Sandi Baru (Opsional)</span>
            </label>
            <input
              type="password"
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Kosongkan jika tidak diubah"
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="btn btn-primary btn-sm" disabled={savingAccount}>
            <Save size={14} />
            <span>{savingAccount ? "Menyimpan..." : "Simpan Identitas Akun"}</span>
          </button>
        </div>
      </form>

      {/* ══════════════════════════════════════════════════════════════════════════════
          2. DATA AKADEMIK & TARGET STUDI
          ══════════════════════════════════════════════════════════════════════════════ */}
      <form onSubmit={handleSaveAcademic} className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <GraduationCap size={18} color="var(--teal)" />
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                Data Akademik & Target Studi
              </h2>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "2px 0 0" }}>
              Perbarui semester, perolehan SKS, dan IPK tanpa harus mengulang Onboarding. Tersinkron otomatis ke Beranda & Roadmap.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: 220 }} />
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Perguruan Tinggi / Kampus</label>
                <input
                  type="text"
                  list="campus-options"
                  className="form-input"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="Telkom University"
                  required
                />
                <datalist id="campus-options">
                  {campuses.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div className="form-group">
                <label className="form-label">Fakultas</label>
                <input
                  type="text"
                  className="form-input"
                  value={facultyName}
                  onChange={(e) => setFacultyName(e.target.value)}
                  placeholder="Fakultas Informatika"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Program Studi</label>
                <input
                  type="text"
                  list="program-options"
                  className="form-input"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  placeholder="S1 Teknik Informatika"
                  required
                />
                <datalist id="program-options">
                  {programs.map((p) => (
                    <option key={p.name} value={p.name} />
                  ))}
                </datalist>
              </div>

              <div className="form-group">
                <label className="form-label">Jenjang Pendidikan</label>
                <select
                  className="form-input"
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                >
                  <option value="S1">S1 — Sarjana</option>
                  <option value="D4">D4 — Sarjana Terapan</option>
                  <option value="D3">D3 — Diploma Tiga</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Semester Aktif</label>
                <select
                  className="form-input"
                  value={currentSemester}
                  onChange={(e) => setCurrentSemester(e.target.value)}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
                    <option key={sem} value={String(sem)}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tahun Masuk</label>
                <input
                  type="number"
                  min={2018}
                  max={2030}
                  className="form-input"
                  value={entryYear}
                  onChange={(e) => setEntryYear(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">SKS Selesai</label>
                <input
                  type="number"
                  min={0}
                  max={200}
                  className="form-input"
                  value={completedCredits}
                  onChange={(e) => setCompletedCredits(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Total SKS Kurikulum</label>
                <input
                  type="number"
                  min={100}
                  max={200}
                  className="form-input"
                  value={totalCurriculumCredits}
                  onChange={(e) => setTotalCurriculumCredits(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">IPK Terakhir (0.00 - 4.00, Maks. 4.00)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.00"
                  max="4.00"
                  className="form-input"
                  value={gpa}
                  onChange={(e) => {
                    const rawVal = e.target.value.replace(",", ".");
                    if (rawVal === "") {
                      setGpa("");
                      return;
                    }
                    const parsed = parseFloat(rawVal);
                    if (!isNaN(parsed) && parsed > 4.0) {
                      setGpa("4.00");
                    } else if (!isNaN(parsed) && parsed < 0) {
                      setGpa("0.00");
                    } else {
                      setGpa(rawVal);
                    }
                  }}
                  onBlur={(e) => {
                    const parsed = parseFloat(e.target.value);
                    if (!isNaN(parsed)) {
                      const clamped = Math.min(4.0, Math.max(0.0, parsed));
                      setGpa(clamped.toFixed(2));
                    }
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14, marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Target Ritme Kelulusan</label>
                <select
                  className="form-input"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                >
                  <option value="fast">Lulus Cepat (Target 3.5 Tahun / 7 Semester)</option>
                  <option value="balanced">Seimbang Akademik & Karier (4 Tahun / 8 Semester)</option>
                  <option value="active">Aktif Organisasi, Lomba & Magang MBKM</option>
                  <option value="relaxed">Ritme Fleksibel / Beban SKS Ringan</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Poin TAK / SKKM</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={takEnabled}
                    onChange={(e) => setTakEnabled(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: "var(--amber)" }}
                  />
                  <input
                    type="number"
                    min={0}
                    max={500}
                    disabled={!takEnabled}
                    className="form-input"
                    value={takTarget}
                    onChange={(e) => setTakTarget(e.target.value)}
                    placeholder="120"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Minat Karier / Peminatan (Pisahkan koma)</label>
                <input
                  type="text"
                  className="form-input"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="AI, Web Development, Data Science"
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={savingAcademic}>
                <Save size={14} />
                <span>{savingAcademic ? "Menyimpan..." : "Simpan Data Akademik & Target"}</span>
              </button>
            </div>
          </>
        )}
      </form>

      {/* ══════════════════════════════════════════════════════════════════════════════
          3. PREFERENSI ASISTEN AI & REKOMENDASI (FOKUS KULIAH & PRA-SKRIPSI)
          ══════════════════════════════════════════════════════════════════════════════ */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Cpu size={18} color="var(--purple)" />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
              Preferensi Asisten AI & Rekomendasi Studi
            </h2>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "2px 0 0" }}>
            Atur pendekatan saran AI STARA saat menganalisis beban SKS, simulasi skenario, dan persiapan awal sebelum mengambil skripsi.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 10, marginBottom: 16 }}>
          {[
            {
              id: "academic_gpa",
              title: "Fokus Akademik & Optimasi IPK",
              desc: "Prioritaskan distribusi SKS yang aman dan pemenuhan mata kuliah prasyarat inti setiap semester.",
            },
            {
              id: "career_internship",
              title: "Keseimbangan Kuliah & Karier / Magang",
              desc: "Rekomendasikan ruang semester yang ideal untuk magang MBKM, proyek portofolio, dan sertifikasi.",
            },
            {
              id: "pre_thesis_prep",
              title: "Eksplorasi Topik & Persiapan Pra-Skripsi",
              desc: "Bantu memetakan mata kuliah pilihan dan kesiapan metodologi riset sebelum mulai menyusun proposal.",
            },
          ].map((opt) => {
            const active = studyMode === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => setStudyMode(opt.id)}
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  border: active ? "2px solid var(--amber)" : "1px solid var(--border)",
                  background: active ? "rgba(245, 205, 71, 0.12)" : "var(--bg-base)",
                  cursor: "pointer",
                  transition: "var(--transition)",
                }}
              >
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                  {opt.title}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.45 }}>
                  {opt.desc}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div className="form-group" style={{ maxWidth: 320, width: "100%" }}>
            <label className="form-label">Kapasitas Belajar Mandiri Mingguan (Jam / Minggu)</label>
            <input
              type="number"
              min={4}
              max={60}
              className="form-input"
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(e.target.value)}
            />
            <span className="form-hint">Dipakai Simulator & AI untuk menghitung batas aman beban SKS per semester.</span>
          </div>

          <button
            type="button"
            onClick={handleSaveAiPrefs}
            className="btn btn-primary btn-sm"
            disabled={savingAi}
          >
            <Save size={14} />
            <span>{savingAi ? "Menyimpan..." : "Simpan Preferensi AI"}</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════════
          4. PREFERENSI PENGINGAT & TAMPILAN PANDUAN BERANDA
          ══════════════════════════════════════════════════════════════════════════════ */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Bell size={18} color="var(--amber)" />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
              Preferensi Pengingat & Panduan Beranda
            </h2>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "2px 0 0" }}>
            Atur kategori pengingat akademik otomatis dan visibilitas panduan langkah awal di halaman Beranda.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {[
            {
              key: "krsDeadline" as const,
              title: "Pengingat Jadwal KRS & Prasyarat Semester",
              desc: "Tampilkan pengingat persiapan pengisian KRS dan pengecekan mata kuliah prasyarat.",
            },
            {
              key: "semesterCheckIn" as const,
              title: "Pengingat Evaluasi Check-in Semester",
              desc: "Ingatkan evaluasi capaian SKS dan target IPK pada pertengahan dan akhir semester.",
            },
            {
              key: "preThesisPrep" as const,
              title: "Pengingat Tahapan Persiapan Skripsi",
              desc: "Notifikasi persiapan awal seperti eksplorasi topik, syarat SKS minimum, dan pengajuan pembimbing.",
            },
          ].map((item) => (
            <label
              key={item.key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-base)",
                cursor: "pointer",
              }}
            >
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{item.desc}</div>
              </div>
              <input
                type="checkbox"
                checked={reminderPrefs[item.key]}
                onChange={() => toggleReminderPref(item.key)}
                style={{ width: 18, height: 18, accentColor: "var(--amber)", flexShrink: 0 }}
              />
            </label>
          ))}
        </div>

        {/* Guided Flow Reset Box */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            padding: "12px 14px",
            borderRadius: "var(--radius-md)",
            background: "rgba(245, 205, 71, 0.12)",
            border: "1px solid rgba(217, 119, 6, 0.3)",
          }}
        >
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>
              Kotak Panduan &ldquo;✨ Mulai di Sini&rdquo; di Beranda
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Saat 4 langkah awal di Beranda sudah diklik semua, kotak panduan otomatis disembunyikan. Klik tombol di samping jika ingin menampilkannya kembali dari awal ({flowCompletedCount}/4 langkah tercatat).
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetGuidedFlow}
            className="btn btn-secondary btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <RotateCcw size={14} />
            <span>Tampilkan Ulang Panduan</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════════
          5. MANAJEMEN DATA & AKSI AKUN
          ══════════════════════════════════════════════════════════════════════════════ */}
      <div className="card">
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
          Manajemen Data & Aksi Akun
        </h2>
        <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 16 }}>
          Unduh cadangan data perencanaan studimu, susun ulang dari awal melalui Wizard Onboarding, atau keluar dari sesi akun.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button
            type="button"
            onClick={handleExportData}
            disabled={exporting}
            className="btn btn-secondary btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Download size={14} />
            <span>{exporting ? "Menyiapkan PDF..." : "Unduh Ringkasan Akademik & Roadmap (PDF)"}</span>
          </button>

          <Link
            href="/onboarding"
            className="btn btn-secondary btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
          >
            <Sparkles size={14} color="var(--amber)" />
            <span>Setup Ulang via Wizard Onboarding</span>
          </Link>

          <button
            type="button"
            onClick={clearSession}
            className="btn btn-danger btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: "auto" }}
          >
            <LogOut size={14} />
            <span>Keluar dari Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
}
