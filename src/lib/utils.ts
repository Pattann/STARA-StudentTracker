import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string, locale = "id-ID"): string {
  try {
    return new Date(dateStr).toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)} hari lalu`;
  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Besok";
  if (diffDays <= 7) return `${diffDays} hari lagi`;
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} minggu lagi`;
  return `${Math.ceil(diffDays / 30)} bulan lagi`;
}

export function semesterLabel(num: number, entryYear: number): string {
  const year = Math.floor((num - 1) / 2) + entryYear;
  const parity = num % 2 === 1 ? "Ganjil" : "Genap";
  const yearStr = `${year}/${year + 1}`;
  return `Semester ${num} • ${parity} ${yearStr}`;
}

export function estimateGraduationText(semestersLeft: number, currentSemester: number, entryYear: number): string {
  if (semestersLeft <= 0) return "Estimasi sudah terpenuhi";
  const targetSemester = currentSemester + semestersLeft;
  const targetYear = Math.floor((targetSemester - 1) / 2) + entryYear;
  const parity = targetSemester % 2 === 1 ? "Ganjil" : "Genap";
  return `Sekitar Semester ${targetSemester} (${parity} ${targetYear}/${targetYear + 1})`;
}

export function parseJsonSafe<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}
