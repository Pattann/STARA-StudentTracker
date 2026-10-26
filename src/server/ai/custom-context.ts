import "server-only";
import { prisma } from "@/server/db/prisma";
import { calculateFullRoadmap } from "@/server/rules-engine";
import { parseJsonSafe } from "@/lib/utils";

export interface CustomPlanContext {
  goalLabel: string;
  baselineSummary: string;
  roadmapOverview: string;
  currentSemester?: number;
  studentProfile?: {
    programName?: string;
    institutionName?: string;
    currentSemester?: number;
    interests?: string;
  };
}

/**
 * Membangun konteks akademik mahasiswa (profil + roadmap aktif) untuk fitur
 * "Rencana Kustom dengan AI" yang tidak terikat pada satu simulasi tertentu.
 */
export async function buildCustomPlanContext(guestSessionId: string): Promise<CustomPlanContext> {
  const profile = await prisma.academicProfile.findUnique({ where: { guestSessionId } });
  const roadmap = await prisma.roadmap.findFirst({
    where: { guestSessionId },
    orderBy: { createdAt: "desc" },
  });

  const version = roadmap?.currentVersionId
    ? await prisma.roadmapVersion.findUnique({
        where: { id: roadmap.currentVersionId },
        include: {
          semesterPlans: {
            include: { tasks: true },
            orderBy: { semesterNum: "asc" },
          },
        },
      })
    : null;

  let baselineSummary = "Roadmap belum tersedia.";
  let roadmapOverview = "Belum ada roadmap aktif.";

  if (version && profile) {
    const calc = calculateFullRoadmap({
      totalCurriculumCredits: profile.totalCurriculumCredits,
      completedCredits: profile.completedCredits,
      inProgressCredits: profile.inProgressCredits,
      currentSemester: profile.currentSemester,
      goals: profile.goals,
      semesterPlans: version.semesterPlans.map((sp) => ({
        semesterNum: sp.semesterNum,
        targetCredits: sp.targetCredits,
        plannedCredits: sp.plannedCredits,
        tasks: sp.tasks.map((t) => ({
          id: t.id,
          credits: t.credits,
          status: t.status,
          category: t.category,
          prerequisites: parseJsonSafe<string[]>(t.prerequisites, []),
        })),
      })),
    });
    baselineSummary = `${calc.remainingCredits} SKS tersisa, estimasi lulus semester ${calc.estimatedGraduationSemester ?? "?"}`;
    roadmapOverview = version.semesterPlans
      .map((sp) => {
        const sks = sp.tasks.reduce((s, t) => s + (t.credits || 0), 0);
        return `Semester ${sp.semesterNum}: ${sks} SKS (${sp.tasks.length} item)`;
      })
      .join("; ");
  }

  return {
    goalLabel: profile?.goals ?? "Lulus tepat waktu",
    baselineSummary,
    roadmapOverview,
    currentSemester: profile?.currentSemester,
    studentProfile: profile
      ? {
          programName: profile.programName,
          institutionName: profile.institutionName,
          currentSemester: profile.currentSemester,
          interests: profile.interests ?? "Umum",
        }
      : undefined,
  };
}
