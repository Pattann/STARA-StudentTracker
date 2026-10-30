/**
 * Validasi isian Tracker 11 Tahapan Skripsi.
 * Dipakai bersama oleh halaman Panduan Skripsi (klien) dan API /api/thesis/progress (server)
 * supaya aturan "isian harus bermakna" tidak bisa dilewati lewat request manual.
 */

export const THESIS_REQUIRED_MESSAGE = "Kolom ini wajib diisi.";

export type ThesisFieldIssue = {
  key: string;
  label: string;
  message: string;
};

type FieldKind =
  | "title"
  | "person"
  | "examiners"
  | "list"
  | "longtext"
  | "shorttext"
  | "note"
  | "url"
  | "date"
  | "percent"
  | "grade";

const FIELD_KINDS: Record<string, FieldKind> = {
  approvedTitle: "title",
  supervisor1: "person",
  supervisor2: "person",
  examiners: "examiners",
  defenseExaminers: "examiners",
  primaryReferences: "list",
  researchGap: "longtext",
  problemStatements: "longtext",
  bgSummary: "longtext",
  keyTheories: "longtext",
  methodDetails: "longtext",
  progressNotes: "longtext",
  keyFindings: "longtext",
  theoreticalFramework: "shorttext",
  researchScope: "shorttext",
  notes: "note",
  supervisorNotes: "note",
  revisionNotes: "note",
  documentLink: "url",
  semproDocLink: "url",
  repoLink: "url",
  articleDraftLink: "url",
  finalRepoLink: "url",
  semproDate: "date",
  defenseDate: "date",
  turnitinScore: "percent",
  defenseScore: "grade",
};

/** Kolom wajib per tahap. Harus sejalan dengan fieldConfigs pada halaman tracker. */
const REQUIRED_FIELDS: Record<number, string[]> = {
  1: ["approvedTitle", "supervisor1"],
  2: ["researchGap", "problemStatements"],
  3: ["primaryReferences", "theoreticalFramework"],
  4: ["documentLink", "bgSummary"],
  5: ["documentLink", "keyTheories"],
  6: ["documentLink", "methodDetails"],
  7: ["semproDate", "examiners"],
  8: ["repoLink", "progressNotes"],
  9: ["documentLink", "keyFindings"],
  10: ["turnitinScore", "documentLink"],
  11: ["defenseDate", "defenseExaminers", "defenseScore"],
};

const PROSE_RULES: Record<"title" | "list" | "longtext" | "shorttext" | "note", { minChars: number; minWords: number }> = {
  title: { minChars: 20, minWords: 4 },
  list: { minChars: 30, minWords: 5 },
  longtext: { minChars: 30, minWords: 5 },
  shorttext: { minChars: 10, minWords: 2 },
  note: { minChars: 15, minWords: 3 },
};

const LETTER_RUN = /[A-Za-z\u00C0-\u024F]+/g;
const KEYBOARD_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

export function isThesisFieldRequired(stageId: number, key: string): boolean {
  return (REQUIRED_FIELDS[stageId] ?? []).includes(key);
}

function isKeyboardMash(word: string): boolean {
  const w = word.toLowerCase();
  return KEYBOARD_ROWS.some((row) => {
    const reversed = row.split("").reverse().join("");
    if (w.length >= 4 && (row.includes(w) || reversed.includes(w))) return true;
    for (let i = 0; i + 5 <= w.length; i += 1) {
      const chunk = w.slice(i, i + 5);
      if (row.includes(chunk) || reversed.includes(chunk)) return true;
    }
    return false;
  });
}

function isPlausibleWord(word: string): boolean {
  // Singkatan umum seperti GNN, SVM, TA, SKS dianggap wajar.
  if (/^[A-Z]{2,6}$/.test(word)) return true;
  const w = word.toLowerCase();
  if (w.length < 3) return true;
  if (!/[aeiou]/.test(w)) return false;
  if (/(.)\1{3,}/.test(w)) return false;
  if (/[^aeiou]{6,}/.test(w)) return false;
  if (w.length >= 4 && new Set(w.split("")).size <= 2) return false;
  if (isKeyboardMash(w)) return false;
  return true;
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function checkProse(value: string, kind: keyof typeof PROSE_RULES): string | null {
  const { minChars, minWords } = PROSE_RULES[kind];
  const text = normalize(value);

  if (text.length < minChars) {
    return `Terlalu singkat. Tulis minimal ${minChars} karakter (sekarang ${text.length}).`;
  }

  const words = text.match(LETTER_RUN) ?? [];
  if (words.length < minWords) {
    return `Tulis minimal ${minWords} kata yang bermakna.`;
  }

  const contentWords = words.filter((w) => w.length >= 3);
  if (contentWords.length === 0) {
    return "Isian belum bermakna. Gunakan kata dan kalimat yang jelas.";
  }

  const plausible = contentWords.filter(isPlausibleWord).length;
  if (plausible / contentWords.length < 0.7) {
    return "Isian terlihat asal-asalan. Tulis dengan kata dan kalimat yang jelas.";
  }

  if (words.length >= 4) {
    const unique = new Set(words.map((w) => w.toLowerCase())).size;
    if (unique / words.length < 0.5) {
      return "Terlalu banyak kata yang diulang. Tulis isian yang informatif.";
    }
  }

  return null;
}

function checkPerson(value: string): string | null {
  const text = normalize(value);

  if (/\d/.test(text)) return "Nama tidak boleh mengandung angka.";

  const words = text.match(LETTER_RUN) ?? [];
  if (words.length < 2) {
    return "Tulis nama lengkap beserta gelar, contoh: Dr. Budi Santoso, M.T.";
  }

  const nameWords = words.filter((w) => w.length >= 3);
  if (nameWords.length === 0) {
    return "Nama belum valid. Tulis nama lengkap dosen.";
  }

  const plausible = nameWords.filter(isPlausibleWord).length;
  if (plausible / nameWords.length < 0.6) {
    return "Nama terlihat asal-asalan. Tulis nama lengkap dosen dengan benar.";
  }

  return null;
}

function checkExaminers(value: string): string | null {
  const text = normalize(value);
  if (text.length < 8) {
    return "Tulis nama dewan penguji minimal 8 karakter.";
  }
  const words = text.match(LETTER_RUN) ?? [];
  if (words.length < 2) {
    return "Tulis susunan dewan penguji, contoh: Dr. Budi Santoso & Dr. Siti Aminah.";
  }
  const nameWords = words.filter((w) => w.length >= 3);
  if (nameWords.length === 0) {
    return "Nama dewan penguji belum valid.";
  }
  const plausible = nameWords.filter(isPlausibleWord).length;
  if (plausible / nameWords.length < 0.6) {
    return "Nama dewan penguji terlihat asal-asalan. Tulis nama dosen dengan benar.";
  }
  return null;
}

function checkUrl(value: string): string | null {
  const text = value.trim();
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return "Tautan tidak valid. Awali dengan https://, contoh: https://docs.google.com/document/d/...";
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return "Tautan harus diawali http:// atau https://.";
  }

  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(url.hostname) || !/\.[a-z]{2,}$/i.test(url.hostname)) {
    return "Alamat situs pada tautan tidak valid.";
  }

  if ((url.pathname === "/" || url.pathname === "") && !url.search) {
    return "Tautan harus mengarah ke dokumen atau repositori tertentu, bukan hanya beranda situs.";
  }

  return null;
}

function checkDate(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return "Pilih tanggal yang valid.";

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
  if (!isRealDate) return "Tanggal tidak valid.";

  const currentYear = new Date().getFullYear();
  if (year < 2015 || year > currentYear + 5) {
    return `Tahun harus antara 2015 dan ${currentYear + 5}.`;
  }
  return null;
}

function checkPercent(value: string): string | null {
  const match = /^\s*(\d{1,3}(?:[.,]\d{1,2})?)\s*%?/.exec(value);
  if (!match) return "Isi skor berupa angka persen, contoh: 14% atau 14,5%.";
  const score = Number(match[1].replace(",", "."));
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    return "Skor Turnitin harus berada di antara 0% dan 100%.";
  }
  return null;
}

function checkGrade(value: string): string | null {
  const text = normalize(value);
  const hasGrade = /\b[A-E][+-]?\b/.test(text);
  const hasNumber = /\b\d{2,3}(?:[.,]\d+)?\b/.test(text);
  const hasPredicate = /lulus|cumlaude|pujian|memuaskan|sangat baik/i.test(text);
  if (!hasGrade && !hasNumber && !hasPredicate) {
    return "Isi nilai atau predikat kelulusan, contoh: A (89,0) atau Lulus dengan Pujian.";
  }
  return null;
}

/** Mengembalikan pesan kesalahan, atau null bila isian valid. Nilai kosong dianggap valid di sini. */
export function validateThesisField(key: string, rawValue: string): string | null {
  const value = typeof rawValue === "string" ? rawValue : "";
  if (value.trim() === "") return null;

  const kind = FIELD_KINDS[key] ?? "note";
  switch (kind) {
    case "person":
      return checkPerson(value);
    case "examiners":
      return checkExaminers(value);
    case "url":
      return checkUrl(value);
    case "date":
      return checkDate(value);
    case "percent":
      return checkPercent(value);
    case "grade":
      return checkGrade(value);
    default:
      return checkProse(value, kind);
  }
}

/**
 * Memvalidasi seluruh isian satu tahap. Kolom wajib yang kosong dan kolom opsional
 * yang diisi dengan nilai tidak valid sama-sama dilaporkan.
 */
export function validateThesisStage(
  stageId: number,
  fields: Record<string, string>,
  labels: Record<string, string> = {}
): ThesisFieldIssue[] {
  const required = REQUIRED_FIELDS[stageId] ?? [];
  const keys = Array.from(new Set([...required, ...Object.keys(fields ?? {})]));
  const issues: ThesisFieldIssue[] = [];

  for (const key of keys) {
    const label = labels[key] ?? key;
    const value = typeof fields?.[key] === "string" ? fields[key] : "";

    if (value.trim() === "") {
      if (required.includes(key)) {
        issues.push({ key, label, message: THESIS_REQUIRED_MESSAGE });
      }
      continue;
    }

    const message = validateThesisField(key, value);
    if (message) issues.push({ key, label, message });
  }

  if (stageId === 1) {
    const sup1 = normalize(fields?.supervisor1 ?? "").toLowerCase();
    const sup2 = normalize(fields?.supervisor2 ?? "").toLowerCase();
    if (sup1 && sup2 && sup1 === sup2 && !issues.some((i) => i.key === "supervisor2")) {
      issues.push({
        key: "supervisor2",
        label: labels.supervisor2 ?? "supervisor2",
        message: "Dosen Pembimbing 2 tidak boleh sama dengan Dosen Pembimbing 1.",
      });
    }
  }

  return issues;
}

/** Hanya isian yang valid yang dipertahankan; sisanya dibuang. */
export function sanitizeThesisFields(stageId: number, fields: Record<string, string>): Record<string, string> {
  const invalidKeys = new Set(
    validateThesisStage(stageId, fields)
      .filter((issue) => issue.message !== THESIS_REQUIRED_MESSAGE)
      .map((issue) => issue.key)
  );

  const clean: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields ?? {})) {
    if (typeof value !== "string") continue;
    if (value.trim() === "" || invalidKeys.has(key)) continue;
    clean[key] = value;
  }
  return clean;
}

/** Isian yang sudah diketik tetapi belum valid (kolom wajib kosong tidak dihitung). */
export function getThesisDraftIssues(
  stageId: number,
  fields: Record<string, string>,
  labels: Record<string, string> = {}
): ThesisFieldIssue[] {
  return validateThesisStage(stageId, fields, labels).filter((issue) => issue.message !== THESIS_REQUIRED_MESSAGE);
}

export function hasAnyThesisInput(fields: Record<string, string>): boolean {
  return Object.values(fields ?? {}).some((value) => typeof value === "string" && value.trim() !== "");
}
