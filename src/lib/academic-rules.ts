export const MIN_CREDITS_PER_COMPLETED_SEMESTER = 17;
export const MAX_CREDITS_PER_COMPLETED_SEMESTER = 24;

export interface CompletedCreditsBounds {
  isLocked: boolean;
  completedSemesters: number;
  min: number;
  max: number;
}

/**
 * Menghitung batas minimal & maksimal SKS tuntas kumulatif berdasarkan semester aktif.
 * - Semester 1: terkunci otomatis di 0 SKS (belum ada semester lulus).
 * - Semester >= 2: wajib diisi dengan rentang 17 s.d. 24 SKS per semester yang telah dilalui,
 *   dibatasi maksimal oleh total SKS kurikulum prodi.
 */
export function getCompletedCreditsBounds(
  currentSemester: number,
  totalCurriculumCredits = 144
): CompletedCreditsBounds {
  const safeTotal = Math.max(80, Number(totalCurriculumCredits) || 144);
  const safeSem = Math.max(1, Math.floor(Number(currentSemester) || 1));

  if (safeSem <= 1) {
    return {
      isLocked: true,
      completedSemesters: 0,
      min: 0,
      max: 0,
    };
  }

  const completedSemesters = safeSem - 1;
  const max = Math.min(safeTotal, completedSemesters * MAX_CREDITS_PER_COMPLETED_SEMESTER);
  const maxReasonableMin = Math.max(0, safeTotal - 6);
  const min = Math.min(max, maxReasonableMin, completedSemesters * MIN_CREDITS_PER_COMPLETED_SEMESTER);

  return {
    isLocked: false,
    completedSemesters,
    min,
    max,
  };
}

