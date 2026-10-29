/**
 * AI Provider interface and implementation.
 * Falls back to deterministic rules when no API key is configured.
 */

import "server-only";

export interface AIExplanationRequest {
  goalLabel: string;
  scenarioType: string;
  parameters: Record<string, unknown>;
  baselineSummary: string;
  scenarioSummary: string;
  conflicts: string[];
  unknowns: string[];
  studentProfile?: {
    institutionName?: string;
    programName?: string;
    educationLevel?: string;
    currentSemester?: number;
    completedCredits?: number;
    totalCurriculumCredits?: number;
    gpa?: number;
    interests?: string;
  };
}

export interface AIExplanationOutput {
  summary: string;
  benefits: string[];
  tradeoffs: string[];
  risks: string[];
  assumptions: string[];
  unknowns: string[];
  recommendedNextSteps: string[];
  questionsForCampus: string[];
  isAiGenerated: boolean;
  fallbackReason?: string;
}

export interface AIThesisRequest {
  interests: string[];
  methods: string[];
  dataAvailability: string;
  timeAvailable: string;
  skills: string[];
  constraints?: string;
  programName: string;
}

export interface AIThesisDirection {
  topicArea: string;
  exampleQuestion: string;
  whyItFits: string;
  possibleMethod: string;
  dataRequired: string;
  feasibility: "tinggi" | "sedang" | "perlu_validasi";
  mainRisks: string[];
  firstSteps: string[];
  questionsForSupervisor: string[];
}

export interface AIThesisOutput {
  directions: AIThesisDirection[];
  isAiGenerated: boolean;
  fallbackReason?: string;
}

export interface ThesisStageProgressInfo {
  completedStagesCount: number;
  totalStages: number;
  currentActiveStageNumber: number;
  currentActiveStageTitle: string;
  nextStageTitle?: string;
  approvedTitle?: string;
  completedStageTitles: string[];
  notesOrArtifacts?: Record<string, string>;
}

export interface AIThesisChatRequest {
  programName?: string;
  topicContext?: string;
  thesisProgress?: ThesisStageProgressInfo;
  chatHistory: { role: "user" | "assistant"; content: string }[];
  userMessage: string;
}

export interface AIThesisChatOutput {
  reply: string;
  isAiGenerated: boolean;
  fallbackReason?: string;
}

export interface AIThesisReviewRequest {
  titleOrDraft: string;
  programName?: string;
  interests?: string;
  methods?: string;
}

export interface AIThesisReviewOutput {
  originalTitle: string;
  score: number;
  verdict: "sangat_baik" | "cukup_baik" | "perlu_penyempurnaan";
  strengths: string[];
  weaknesses: string[];
  improvedTitles: string[];
  suggestedMethods: string[];
  defenseQuestions: string[];
  isAiGenerated: boolean;
  fallbackReason?: string;
}

export interface AIChatRequest {
  simulationContext: {
    scenarioType: string;
    title: string;
    baselineSummary: string;
    scenarioSummary: string;
    semesterDelta: number | null;
    creditsDelta: number;
    goalLabel: string;
  };
  explanation: {
    summary: string;
    benefits: string[];
    risks: string[];
    tradeoffs: string[];
    recommendedNextSteps: string[];
    questionsForCampus: string[];
  };
  chatHistory: { role: "user" | "assistant"; content: string }[];
  userMessage: string;
}

export interface AIChatOutput {
  reply: string;
  isAiGenerated: boolean;
  fallbackReason?: string;
}

export interface AIAlternativesRequest {
  scenarioType: string;
  parameters: Record<string, unknown>;
  goalLabel: string;
  baselineSummary: string;
  scenarioSummary: string;
  semesterDelta: number | null;
  risks: string[];
  studentProfile?: {
    programName?: string;
    institutionName?: string;
    currentSemester?: number;
    interests?: string;
  };
}

export interface AIAlternative {
  title: string;
  description: string;
  tradeoff: string;
  suitableFor: string;
  suggestedAction: string;
}

export interface AIAlternativesOutput {
  alternatives: AIAlternative[];
  isAiGenerated: boolean;
  fallbackReason?: string;
}

export interface AICustomPlanFormField {
  id: string;
  label: string;
  type: "text" | "select" | "number" | "textarea";
  defaultValue: string;
  options?: string[];
  helperText?: string;
  required?: boolean;
}

export interface AICustomPlanFormRequest {
  userPrompt: string;
  studentProfile?: {
    programName?: string;
    institutionName?: string;
    currentSemester?: number;
    interests?: string;
  };
  baselineSummary?: string;
  roadmapOverview?: string;
}

export interface AICustomPlanFormOutput {
  categoryBadge: string;
  detectedGoal: string;
  briefExplanation: string;
  fields: AICustomPlanFormField[];
  isAiGenerated: boolean;
  fallbackReason?: string;
}

export interface AICustomPlanSimulateRequest {
  userPrompt: string;
  categoryBadge: string;
  detectedGoal: string;
  formData: Record<string, string>;
  studentProfile?: {
    programName?: string;
    institutionName?: string;
    currentSemester?: number;
    interests?: string;
  };
  baselineSummary?: string;
  roadmapOverview?: string;
}

export interface AICustomPlanSimulateOutput {
  overallVerdict: "aman" | "perlu_perhatian" | "berisiko_tinggi";
  verdictTitle: string;
  academicImpactSummary: string;
  estimatedHoursPerWeek: string;
  impactOnGraduation: string;
  keyRisks: string[];
  mitigationStrategies: string[];
  actionSteps: {
    phase: "Pra-Kegiatan" | "Pelaksanaan" | "Pasca-Kegiatan";
    steps: string[];
  }[];
  suggestedAlternatives: {
    title: string;
    description: string;
    benefit: string;
  }[];
  questionsForAcademicAdvisor: string[];
  isAiGenerated: boolean;
  fallbackReason?: string;
}

export interface AIProvider {
  explainSimulation(req: AIExplanationRequest): Promise<AIExplanationOutput>;
  generateThesisDirections(req: AIThesisRequest): Promise<AIThesisOutput>;
  chatAboutSimulation(req: AIChatRequest): Promise<AIChatOutput>;
  suggestAlternativeScenarios(req: AIAlternativesRequest): Promise<AIAlternativesOutput>;
  chatAboutThesis(req: AIThesisChatRequest): Promise<AIThesisChatOutput>;
  reviewThesisTopic(req: AIThesisReviewRequest): Promise<AIThesisReviewOutput>;
  generateCustomPlanForms(req: AICustomPlanFormRequest): Promise<AICustomPlanFormOutput>;
  simulateCustomPlan(req: AICustomPlanSimulateRequest): Promise<AICustomPlanSimulateOutput>;
}

const globalForAi = globalThis as unknown as {
  workingModel?: string;
  deadModels?: Set<string>;
};

function parseAiJson<T = Record<string, any>>(rawText: string): T {
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned || "{}") as T;
  } catch {
    // Try extracting the outermost JSON object if there is surrounding text
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as T;
    }
    throw new Error("Respons AI bukan format JSON yang valid.");
  }
}

function getProvider(): AIProvider | null {
  const provider = process.env.AI_PROVIDER;
  if (!provider) return null;

  if (provider === "google" && process.env.GOOGLE_AI_API_KEY) {
    try {
      // Dynamic import Google GenAI
      const { GoogleGenAI } = require("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

      // Urutan model nyata yang cepat + memori model aktif agar tidak mencoba ulang model 404
      const BASE_CANDIDATE_MODELS = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-3-flash-preview",
      ];

      if (!globalForAi.deadModels) {
        globalForAi.deadModels = new Set<string>();
      }

      async function generateWithFallback(options: {
        contents: string;
        config?: Record<string, unknown>;
      }): Promise<{ text: string; modelUsed: string }> {
        let lastError: unknown = null;
        const dead = globalForAi.deadModels!;
        const orderedModels = globalForAi.workingModel
          ? [
              globalForAi.workingModel,
              ...BASE_CANDIDATE_MODELS.filter((m) => m !== globalForAi.workingModel && !dead.has(m)),
            ]
          : BASE_CANDIDATE_MODELS.filter((m) => !dead.has(m));

        const modelsToTry = orderedModels.length > 0 ? orderedModels : BASE_CANDIDATE_MODELS.slice(0, 2);

        for (const model of modelsToTry) {
          try {
            // Matikan thinkingBudget pada model 2.5/3 agar token output tidak habis dipakai internal thinking
            const modelConfig: Record<string, unknown> = {
              ...(options.config || {}),
            };
            if (model.includes("2.5") || model.includes("3")) {
              modelConfig.thinkingConfig = { thinkingBudget: 0 };
            }

            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout pada model ${model}`)), 14000)
            );
            const res = await Promise.race([
              ai.models.generateContent({
                model,
                contents: options.contents,
                config: modelConfig,
              }),
              timeoutPromise,
            ]);
            const text = res.text?.trim() || "";
            if (text) {
              globalForAi.workingModel = model;
              return { text, modelUsed: model };
            }
          } catch (err: unknown) {
            lastError = err;
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes("404") || msg.includes("not found") || msg.includes("NOT_FOUND")) {
              dead.add(model);
            }
            console.warn(`[AI Failover] Model ${model} gagal atau limit. Mencoba model cadangan berikutnya...`);
          }
        }
        throw lastError || new Error("Semua model AI cadangan gagal merespons.");
      }

      return {
        async explainSimulation(req: AIExplanationRequest): Promise<AIExplanationOutput> {
          const profileInfo = req.studentProfile
            ? `
- Perguruan Tinggi: ${req.studentProfile.institutionName || "Kampus"}
- Program Studi: ${req.studentProfile.programName || "S1"} (${req.studentProfile.educationLevel || "S1"})
- Semester Berjalan: Semester ${req.studentProfile.currentSemester || "?"} (IPK: ${req.studentProfile.gpa ?? "-"})
- Progress SKS: ${req.studentProfile.completedCredits || 0} selesai dari ${req.studentProfile.totalCurriculumCredits || 144} SKS
- Minat Spesifik: ${req.studentProfile.interests || "Umum"}`
            : "";

          const prompt = `
Anda adalah konsultan akademik cerdas STARA (Student Tracker & Academic Roadmap Assistant).
Tugas: Berikan analisis ringkas, tajam, dan langsung ke inti untuk simulasi "what-if" mahasiswa:
${profileInfo}
- Target: ${req.goalLabel} | Skenario: ${req.scenarioType}
- Parameter: ${JSON.stringify(req.parameters)}
- Baseline: ${req.baselineSummary}
- Skenario: ${req.scenarioSummary}
- Peringatan/Konflik: ${JSON.stringify(req.conflicts)}
- Belum Diketahui: ${JSON.stringify(req.unknowns)}

Panduan penulisan:
- Tulis secara padat, jelas, tanpa kalimat pembuka klise.
- Setiap poin maksimal 1-2 kalimat fokus.
- Maksimal 3 butir untuk benefits, tradeoffs, risks, questionsForCampus, recommendedNextSteps.

HANYA kembalikan valid JSON (tanpa markdown backtick):
{
  "summary": "Ringkasan 2 kalimat dampak skenario ini terhadap kelulusan dan ritme SKS",
  "benefits": ["keuntungan 1", "keuntungan 2"],
  "tradeoffs": ["konsekuensi 1", "konsekuensi 2"],
  "risks": ["risiko utama 1", "risiko 2"],
  "assumptions": ["asumsi perhitungan yang digunakan"],
  "unknowns": ["hal yang perlu dipastikan ke kampus"],
  "recommendedNextSteps": ["langkah konkrit 1", "langkah 2"],
  "questionsForCampus": ["pertanyaan kunci untuk dosen wali / prodi"],
  "isAiGenerated": true
}
`;

          const { text } = await generateWithFallback({
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              maxOutputTokens: 2048,
            },
          });

          const parsed = parseAiJson(text);
          return {
            summary: parsed.summary || req.scenarioSummary,
            benefits: parsed.benefits || [],
            tradeoffs: parsed.tradeoffs || [],
            risks: parsed.risks || req.conflicts,
            assumptions: parsed.assumptions || ["Perhitungan berbasis data kurikulum saat ini."],
            unknowns: parsed.unknowns || req.unknowns,
            recommendedNextSteps: parsed.recommendedNextSteps || ["Konsultasikan dengan dosen wali."],
            questionsForCampus: parsed.questionsForCampus || req.unknowns.map((u) => `Tentang: ${u}`),
            isAiGenerated: true,
          };
        },

        async generateThesisDirections(req: AIThesisRequest): Promise<AIThesisOutput> {
          const prompt = `
Anda adalah asisten pembimbing skripsi/tugas akhir STARA untuk perguruan tinggi di Indonesia.
Bantu mahasiswa dengan profil berikut untuk menemukan 3 arah topik & judul skripsi/TA yang tajam, modern, dan layak diujikan di Sidang Sempro:
- Program Studi: ${req.programName}
- Minat/Bidang Tertarik: ${req.interests.join(", ")}
- Metode yang dikuasai/diminati: ${req.methods.length > 0 ? req.methods.join(", ") : "Menyesuaikan topik terbaik"}
- Ketersediaan Data: ${req.dataAvailability}
- Target Waktu Pengerjaan: ${req.timeAvailable}
- Skill/Tools: ${req.skills.length > 0 ? req.skills.join(", ") : "Sesuai kurikulum prodi"}
${req.constraints ? `- Batasan/Kendala Khusus: ${req.constraints}` : ""}

Panduan:
- Setiap "topicArea" harus berupa contoh Judul Skripsi Ilmiah yang spesifik, jelas metode dan objeknya (bukan sekadar nama bidang).
- "exampleQuestion" harus berupa rumusan masalah penelitian yang terukur.
- "firstSteps" harus berisi 3 langkah teknis awal yang konkret.

HANYA kembalikan valid JSON (tanpa markdown codeblocks) dengan format:
{
  "directions": [
    {
      "topicArea": "Judul Skripsi Spesifik (Metode + Objek/Studi Kasus + Tujuan)",
      "exampleQuestion": "Rumusan masalah / pertanyaan penelitian terukur",
      "whyItFits": "Alasan spesifik mengapa topik ini cocok dengan prodi, minat, ketersediaan data, dan target waktu mahasiswa",
      "possibleMethod": "Metode / algoritma / pendekatan analisis yang disarankan",
      "dataRequired": "Spesifikasi dataset / sumber data yang digunakan",
      "feasibility": "tinggi",
      "mainRisks": ["risiko teknis 1", "risiko 2"],
      "firstSteps": ["langkah awal 1", "langkah awal 2", "langkah awal 3"],
      "questionsForSupervisor": ["pertanyaan 1 untuk dosen pembimbing", "pertanyaan 2 untuk dosen pembimbing"]
    }
  ],
  "isAiGenerated": true
}
`;

          const { text } = await generateWithFallback({
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              maxOutputTokens: 2500,
            },
          });

          const parsed = parseAiJson(text);
          return {
            directions: Array.isArray(parsed.directions) && parsed.directions.length > 0
              ? parsed.directions
              : generateFallbackThesisDirections(req).directions,
            isAiGenerated: true,
          };
        },

        async chatAboutSimulation(req: AIChatRequest): Promise<AIChatOutput> {
          const ctx = req.simulationContext;
          const systemCtx = `
Anda adalah STARA AI — konsultan strategi akademik dan teman diskusi mahasiswa Indonesia.
Karakter & Gaya Komunikasi Anda:
- Ramah, suportif, terstruktur, dan solutif menggunakan bahasa Indonesia yang luwes namun tetap jelas.
- Konteks Rencana / Simulasi Mahasiswa Saat Ini:
  * Skenario / Rencana: ${ctx.title} (${ctx.scenarioType})
  * Target Utama Mahasiswa: ${ctx.goalLabel}
  * Kondisi Roadmap Saat Ini (Baseline): ${ctx.baselineSummary}
  * Detail Rencana / Hasil Skenario: ${ctx.scenarioSummary}
  * Dampak Semester Kelulusan: ${ctx.semesterDelta !== null ? `${ctx.semesterDelta > 0 ? "+" : ""}${ctx.semesterDelta} semester` : "tetap tepat waktu (tidak menunda kelulusan)"}
  * Perubahan SKS: ${ctx.creditsDelta > 0 ? `+${ctx.creditsDelta}` : ctx.creditsDelta} SKS
  * Ringkasan Evaluasi: ${req.explanation.summary}

Panduan Menjawab agar Sangat Jelas & Membantu:
1. JAWAB SECARA LENGKAP & TUNTAS (100 - 220 kata). JANGAN PERNAH memotong kalimat di tengah jalan!
2. Berikan jawaban yang terstruktur dan mudah dibaca:
   - Paragraf singkat pembuka yang langsung menjawab pertanyaan mahasiswa terkait rencana "${ctx.title}".
   - Gunakan poin-poin bernomor (1., 2., 3.) atau bullet (•) untuk rincian strategi, manajemen waktu kuliah vs kegiatan, tips menjaga IPK, atau langkah administrasi kampus.
   - Tutup dengan 1 kalimat kesimpulan atau rekomendasi langkah praktis berikutnya.
3. Batasan Topik:
   - Fokus pada akademik, rencana kegiatan/lomba/magang/MBKM (${ctx.title}), manajemen waktu kuliah, SKS, portofolio/SKPI, dan kelulusan.
   - Jika mahasiswa bertanya di luar topik kuliah/karier/pengembangan diri mahasiswa (misal: resep masakan, politik, game), tolak dengan sopan dan arahkan kembali ke diskusi rencana "${ctx.title}".
`;

          const historyText = req.chatHistory
            .map((h) => `${h.role === "user" ? "Mahasiswa" : "STARA AI"}: ${h.content}`)
            .join("\n");

          const fullPrompt = `${systemCtx}\n\nRiwayat Percakapan:\n${historyText}\n\nMahasiswa: ${req.userMessage}\nSTARA AI (berikan jawaban lengkap, terstruktur, dan tuntas):`;

          const { text } = await generateWithFallback({
            contents: fullPrompt,
            config: {
              maxOutputTokens: 2048,
              temperature: 0.65,
            },
          });

          const reply = text || "Maaf sekali, saya tidak bisa memproses pertanyaan berikut untuk saat ini.";
          return { reply, isAiGenerated: true };
        },

        async suggestAlternativeScenarios(req: AIAlternativesRequest): Promise<AIAlternativesOutput> {
          const profileInfo = req.studentProfile
            ? `Mahasiswa: ${req.studentProfile.programName || "S1"} di ${req.studentProfile.institutionName || "Kampus"}, Semester ${req.studentProfile.currentSemester || "?"}. Minat: ${req.studentProfile.interests || "Umum"}.`
            : "";

          const prompt = `
Anda adalah konsultan strategi akademik STARA.
${profileInfo}
${req.scenarioType === "custom"
  ? `Mahasiswa sedang merancang RENCANA STUDI KUSTOM. Keinginan / Rencana: ${JSON.stringify(req.parameters)}
- Target Mahasiswa: ${req.goalLabel}
- Kondisi Roadmap: ${req.baselineSummary}
- Konteks Rencana: ${req.scenarioSummary}

Tugas: Berikan 3 opsi strategi alternatif yang SPESIFIK terhadap kegiatan tersebut (misal: pengaturan jadwal blok waktu, kolaborasi lintas prodi, konversi ke poin TAK/SKPI atau mata kuliah pilihan, atau penyesuaian beban SKS semester).`
  : `Mahasiswa sedang mengevaluasi skenario: ${req.scenarioType} (Parameter: ${JSON.stringify(req.parameters)})
- Target: ${req.goalLabel}
- Hasil simulasi saat ini: ${req.scenarioSummary} (Delta semester: ${req.semesterDelta ?? 0})
- Risiko terdeteksi: ${req.risks.join("; ")}

Tugas: Berikan 3 alternatif skenario yang BERBEDA, KREATIF, dan REALISTIS untuk mencapai target mahasiswa dengan risiko lebih terkendali.`}

HANYA kembalikan valid JSON (tanpa markdown codeblock):
{
  "alternatives": [
    {
      "title": "Nama Opsi Strategi yang Spesifik & Jelas",
      "description": "Penjelasan praktis bagaimana menjalankan opsi ini tanpa mengorbankan kuliah (1-2 kalimat)",
      "tradeoff": "Konsekuensi atau hal yang perlu disiapkan (1 kalimat)",
      "suitableFor": "Paling cocok jika kamu...",
      "suggestedAction": "Keuntungan utama & langkah konkret yang bisa langsung diambil"
    }
  ],
  "isAiGenerated": true
}
`;

          const { text } = await generateWithFallback({
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.8,
              maxOutputTokens: 2048,
            },
          });

          const parsed = parseAiJson(text);
          return {
            alternatives: Array.isArray(parsed.alternatives) && parsed.alternatives.length > 0
              ? parsed.alternatives
              : generateFallbackAlternatives(req).alternatives,
            isAiGenerated: true,
          };
        },

        async chatAboutThesis(req: AIThesisChatRequest): Promise<AIThesisChatOutput> {
          const systemCtx = `
Anda adalah STARA Thesis AI Consultant — konsultan dan dosen pembimbing pendamping skripsi/tugas akhir mahasiswa di Indonesia.
Karakter & Gaya Komunikasi Anda:
- Suportif, akademis, sistematis, dan jelas dalam bahasa Indonesia.
- Profil Mahasiswa: Program Studi ${req.programName || "S1"}.
${req.topicContext ? `- Fokus Topik / Judul yang sedang dibahas: "${req.topicContext}"` : ""}
${
  req.thesisProgress
    ? `- PROGRES TRACKER 11 TAHAPAN SKRIPSI MAHASISWA SAAT INI:
  * Tahapan Selesai (${req.thesisProgress.completedStagesCount} dari ${req.thesisProgress.totalStages} tahapan): ${
        req.thesisProgress.completedStageTitles.length > 0
          ? req.thesisProgress.completedStageTitles.join(", ")
          : "Belum ada tahapan yang dicentang ACC"
      }
  * Tahap Aktif yang Sedang Dikerjakan: Tahap ${req.thesisProgress.currentActiveStageNumber} - ${req.thesisProgress.currentActiveStageTitle}
  ${req.thesisProgress.nextStageTitle ? `* Target Tahap Berikutnya: ${req.thesisProgress.nextStageTitle}` : ""}
  ${req.thesisProgress.approvedTitle ? `* Judul Skripsi Saat Ini: "${req.thesisProgress.approvedTitle}"` : ""}`
    : ""
}

Panduan Menjawab agar Sangat Jelas & Bernilai Akademik Tinggi:
1. JAWAB SECARA LENGKAP, TERSTRUKTUR, DAN TUNTAS (120 - 260 kata). Jangan pernah memotong kalimat di tengah jalan!
2. Gunakan struktur jawaban yang rapi:
   - Jawaban inti yang langsung mengacu pada prodi (${req.programName || "S1"}), judul/topik mahasiswa, dan tahapan skripsinya saat ini.
   - Rincian poin bernomor (1., 2., 3.) atau contoh konkret (misalnya contoh kalimat rumusan masalah, struktur paragraf BAB, metrik pengujian, atau cara menjawab dosen penguji).
   - Langkah aksi selanjutnya ("Langkah Selanjutnya untuk Bimbingan:") agar mahasiswa tahu persis apa yang harus dikerjakan hari ini.
3. Batasan Topik:
   - Fokus pada ide topik, judul skripsi, rumusan masalah, research gap, BAB 1-5, metodologi, sitasi jurnal, Turnitin, bimbingan dosen, dan sidang Sempro/Skripsi.
   - Jika ditanya hal di luar skripsi/akademik, tolak secara sopan dan arahkan kembali ke penyelesaian skripsi.
`;

          const historyText = req.chatHistory
            .map((h) => `${h.role === "user" ? "Mahasiswa" : "Konsultan Skripsi AI"}: ${h.content}`)
            .join("\n");

          const fullPrompt = `${systemCtx}\n\nRiwayat Percakapan:\n${historyText}\n\nMahasiswa: ${req.userMessage}\nKonsultan Skripsi AI (berikan panduan lengkap, terstruktur, dan tuntas):`;

          const { text } = await generateWithFallback({
            contents: fullPrompt,
            config: {
              maxOutputTokens: 2500,
              temperature: 0.65,
            },
          });

          const reply = text || "Maaf, saat ini saya tidak dapat memproses pertanyaan seputar skripsi.";
          return { reply, isAiGenerated: true };
        },

        async reviewThesisTopic(req: AIThesisReviewRequest): Promise<AIThesisReviewOutput> {
          const prompt = `
Anda adalah reviewer dan dewan penguji proposal skripsi perguruan tinggi di Indonesia.
Tinjau draf judul / ide penelitian skripsi mahasiswa berikut secara tajam dan konstruktif:
- Draf Judul / Ide: "${req.titleOrDraft}"
- Program Studi: ${req.programName || "Teknik Informatika"}
${req.interests ? `- Bidang Minat: ${req.interests}` : ""}
${req.methods ? `- Metode yang Diminati: ${req.methods}` : ""}

Lakukan evaluasi kritis akademik:
1. score (0 - 100): nilai ketajaman masalah, kejelasan objek/studi kasus, ketepatan metode, dan keterukuran evaluasi.
2. verdict: "sangat_baik" (score >= 80), "cukup_baik" (score 65-79), atau "perlu_penyempurnaan" (score < 65).
3. strengths: 3 poin kelebihan spesifik dari draf judul/topik ini.
4. weaknesses: 3 poin potensi kelemahan atau celah yang rawan dicecar dosen penguji saat Sidang Sempro.
5. improvedTitles: 3 variasi judul alternatif yang lebih tajam, formal-ilmiah, dan siap diajukan ke dosen pembimbing.
6. suggestedMethods: 3 metode penelitian / algoritma / teknik analisis yang paling relevan untuk judul ini.
7. defenseQuestions: 3 pertanyaan kritis yang paling sering ditanyakan penguji Sempro untuk topik ini beserta petunjuk singkat cara menjawabnya.

HANYA kembalikan valid JSON (tanpa markdown codeblock):
{
  "originalTitle": "${req.titleOrDraft.replace(/"/g, '\\"')}",
  "score": 82,
  "verdict": "sangat_baik",
  "strengths": ["Kelebihan 1", "Kelebihan 2", "Kelebihan 3"],
  "weaknesses": ["Celah Sempro 1", "Celah Sempro 2", "Celah Sempro 3"],
  "improvedTitles": ["Judul Ilmiah Alternatif 1", "Judul Ilmiah Alternatif 2", "Judul Ilmiah Alternatif 3"],
  "suggestedMethods": ["Metode 1", "Metode 2", "Metode 3"],
  "defenseQuestions": ["Pertanyaan Penguji 1 (Tips jawab: ...)", "Pertanyaan Penguji 2 (Tips jawab: ...)", "Pertanyaan Penguji 3 (Tips jawab: ...)"],
  "isAiGenerated": true
}
`;

          const { text } = await generateWithFallback({
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.65,
              maxOutputTokens: 2048,
            },
          });

          const parsed = parseAiJson(text);
          return {
            originalTitle: req.titleOrDraft,
            score: typeof parsed.score === "number" ? parsed.score : 78,
            verdict: parsed.verdict || "cukup_baik",
            strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 ? parsed.strengths : ["Topik memiliki relevansi dengan kebutuhan industri dan keilmuan prodi."],
            weaknesses: Array.isArray(parsed.weaknesses) && parsed.weaknesses.length > 0 ? parsed.weaknesses : ["Perlu penegasan batasan masalah, sumber data, dan metrik evaluasi terukur."],
            improvedTitles: Array.isArray(parsed.improvedTitles) && parsed.improvedTitles.length > 0 ? parsed.improvedTitles : [`Analisis dan Implementasi ${req.titleOrDraft}`],
            suggestedMethods: Array.isArray(parsed.suggestedMethods) && parsed.suggestedMethods.length > 0 ? parsed.suggestedMethods : ["Metode Komparatif Eksperimental"],
            defenseQuestions: Array.isArray(parsed.defenseQuestions) && parsed.defenseQuestions.length > 0 ? parsed.defenseQuestions : ["Apa kebaruan (novelty) penelitian ini dibandingkan riset terdahulu?"],
            isAiGenerated: true,
          };
        },

        async generateCustomPlanForms(req: AICustomPlanFormRequest): Promise<AICustomPlanFormOutput> {
          const prompt = `
Anda adalah konsultan perancangan skenario studi mahasiswa STARA (Student Tracking and Academic Roadmap Assistant).
Mahasiswa menuliskan ide atau rencana kegiatannya secara bebas:
"${req.userPrompt}"

Konteks Akademik Mahasiswa:
- Program Studi: ${req.studentProfile?.programName || "S1"}
- Kampus: ${req.studentProfile?.institutionName || "Perguruan Tinggi"}
- Semester Saat Ini: ${req.studentProfile?.currentSemester || 4}
- Minat: ${req.studentProfile?.interests || "Umum"}
${req.baselineSummary ? `- Status Roadmap: ${req.baselineSummary}` : ""}

TUGAS ANDA:
1. Identifikasi kategori kegiatan (misal: "Kompetisi & Prestasi Mahasiswa", "Karier & Magang", "Kegiatan Nonakademik", "Sertifikasi & Pelatihan", "Proyek & Riset Mandiri").
2. Rumuskan "detectedGoal" yang ringkas dan akurat sesuai kalimat mahasiswa (misal: "Lomba Business Model Canvas (BMC) Tingkat Nasional").
3. Buatkan 5-6 parameter formulir adaptif yang PALING RELEVAN untuk mengukur beban waktu, periode semester, target capaian, potensi bentrok kuliah, dan beban SKS.
4. Setiap field harus memiliki defaultValue cerdas yang langsung sesuai dengan konteks rencana mahasiswa.
5. Format tipe field yang diizinkan: "text", "select", "number", "textarea".

HANYA kembalikan valid JSON (tanpa markdown codeblock):
{
  "categoryBadge": "Kompetisi & Prestasi Mahasiswa",
  "detectedGoal": "Nama Rencana Spesifik Mahasiswa",
  "briefExplanation": "Parameter berikut disiapkan oleh STARA AI untuk memetakan alokasi waktu dan dampak rencana terhadap kuliah regulermu.",
  "fields": [
    {
      "id": "semester_periode",
      "label": "Semester atau periode pelaksanaan",
      "type": "select",
      "defaultValue": "Semester 5 (Paralel Kuliah)",
      "options": ["Semester 5 (Paralel Kuliah)", "Semester 6 (Paralel Kuliah)", "Liburan Antar-Semester", "Semester Depan"],
      "helperText": "Pilih periode pelaksanaan kegiatan.",
      "required": true
    }
  ]
}
`;

          const { text } = await generateWithFallback({
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.6,
              maxOutputTokens: 2048,
            },
          });

          const parsed = parseAiJson(text);
          return {
            categoryBadge: parsed.categoryBadge || "Rencana Kustom",
            detectedGoal: parsed.detectedGoal || req.userPrompt.slice(0, 60),
            briefExplanation: parsed.briefExplanation || "Parameter berikut disiapkan untuk memetakan dampak rencana studimu.",
            fields: Array.isArray(parsed.fields) && parsed.fields.length > 0 ? parsed.fields : generateFallbackCustomPlanForms(req).fields,
            isAiGenerated: true,
          };
        },

        async simulateCustomPlan(req: AICustomPlanSimulateRequest): Promise<AICustomPlanSimulateOutput> {
          const formText = Object.entries(req.formData)
            .map(([k, v]) => `  - ${k}: ${v}`)
            .join("\n");

          const prompt = `
Anda adalah evaluator skenario akademik cerdas STARA.
Evaluasi rencana studi kustom mahasiswa berikut secara spesifik dan mendalam:
- Pernyataan Awal Mahasiswa: "${req.userPrompt}"
- Kategori Rencana: ${req.categoryBadge}
- Rencana Spesifik: ${req.detectedGoal}
- Parameter Formulir yang Diisi Mahasiswa:
${formText}

Profil Mahasiswa:
- Program Studi: ${req.studentProfile?.programName || "S1"}
- Kampus: ${req.studentProfile?.institutionName || "Perguruan Tinggi"}
- Semester Saat Ini: ${req.studentProfile?.currentSemester || 4}
- Minat: ${req.studentProfile?.interests || "Umum"}
${req.baselineSummary ? `- Baseline Roadmap: ${req.baselineSummary}` : ""}

Lakukan analisis spesifik terhadap "${req.detectedGoal}" (JANGAN gunakan kalimat generik tentang liburan kecuali mahasiswa memang memilih waktu liburan):
1. overallVerdict: "aman" (beban realistis & terkendali), "perlu_perhatian" (perlu manajemen jadwal ekstra saat pekan UTS/UAS/tugas besar), atau "berisiko_tinggi" (sangat rawan mengganggu SKS wajib).
2. verdictTitle: kesimpulan 1 kalimat yang spesifik terhadap "${req.detectedGoal}".
3. academicImpactSummary: analisis 2-3 kalimat mengenai dampak kegiatan ini terhadap beban SKS kuliah, cara menjaga IPK, serta nilai tambahnya bagi portofolio/poin TAK/SKPI mahasiswa.
4. estimatedHoursPerWeek: estimasi alokasi waktu per minggu.
5. impactOnGraduation: dampak terhadap target kelulusan.
6. keyRisks: 3 potensi risiko spesifik yang perlu diantisipasi selama menjalankan "${req.detectedGoal}".
7. mitigationStrategies: 3 strategi mitigasi konkret agar kuliah dan "${req.detectedGoal}" sama-sama sukses.
8. actionSteps: 3 tahapan aksi ("Pra-Kegiatan", "Pelaksanaan", "Pasca-Kegiatan"), masing-masing 2 langkah praktis.
9. suggestedAlternatives: 3 strategi alternatif/kombinasi yang relevan dengan "${req.detectedGoal}".
10. questionsForAcademicAdvisor: 2-3 pertanyaan penting untuk didiskusikan dengan dosen wali / pembimbing.

HANYA kembalikan valid JSON (tanpa markdown codeblock):
{
  "overallVerdict": "aman",
  "verdictTitle": "Judul Evaluasi Spesifik",
  "academicImpactSummary": "Ringkasan analisis dampak akademik dan manfaat kegiatan.",
  "estimatedHoursPerWeek": "10 - 14 jam/minggu",
  "impactOnGraduation": "Tidak menunda kelulusan, tetap lulus tepat waktu di Semester 8",
  "keyRisks": ["Risiko 1", "Risiko 2", "Risiko 3"],
  "mitigationStrategies": ["Mitigasi 1", "Mitigasi 2", "Mitigasi 3"],
  "actionSteps": [
    { "phase": "Pra-Kegiatan", "steps": ["Langkah 1", "Langkah 2"] },
    { "phase": "Pelaksanaan", "steps": ["Langkah 1", "Langkah 2"] },
    { "phase": "Pasca-Kegiatan", "steps": ["Langkah 1", "Langkah 2"] }
  ],
  "suggestedAlternatives": [
    {
      "title": "Nama Strategi Alternatif 1",
      "description": "Deskripsi praktis strategi alternatif 1.",
      "benefit": "Manfaat nyata bagi waktu kuliah atau portofolio."
    },
    {
      "title": "Nama Strategi Alternatif 2",
      "description": "Deskripsi praktis strategi alternatif 2.",
      "benefit": "Manfaat nyata bagi waktu kuliah atau portofolio."
    }
  ],
  "questionsForAcademicAdvisor": ["Pertanyaan 1", "Pertanyaan 2"]
}
`;

          const { text } = await generateWithFallback({
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.65,
              maxOutputTokens: 2500,
            },
          });

          const parsed = parseAiJson(text);
          const fallback = generateFallbackCustomPlanSimulate(req);
          return {
            overallVerdict: parsed.overallVerdict || fallback.overallVerdict,
            verdictTitle: parsed.verdictTitle || fallback.verdictTitle,
            academicImpactSummary: parsed.academicImpactSummary || fallback.academicImpactSummary,
            estimatedHoursPerWeek: parsed.estimatedHoursPerWeek || fallback.estimatedHoursPerWeek,
            impactOnGraduation: parsed.impactOnGraduation || fallback.impactOnGraduation,
            keyRisks: Array.isArray(parsed.keyRisks) && parsed.keyRisks.length > 0 ? parsed.keyRisks : fallback.keyRisks,
            mitigationStrategies: Array.isArray(parsed.mitigationStrategies) && parsed.mitigationStrategies.length > 0 ? parsed.mitigationStrategies : fallback.mitigationStrategies,
            actionSteps: Array.isArray(parsed.actionSteps) && parsed.actionSteps.length > 0 ? parsed.actionSteps : fallback.actionSteps,
            suggestedAlternatives: Array.isArray(parsed.suggestedAlternatives) && parsed.suggestedAlternatives.length > 0 ? parsed.suggestedAlternatives : fallback.suggestedAlternatives,
            questionsForAcademicAdvisor: Array.isArray(parsed.questionsForAcademicAdvisor) && parsed.questionsForAcademicAdvisor.length > 0 ? parsed.questionsForAcademicAdvisor : fallback.questionsForAcademicAdvisor,
            isAiGenerated: true,
          };
        },
      };
    } catch (e) {
      console.error("[AI Provider init error]", e);
      return null;
    }
  }

  return null;
}

export const aiProvider: AIProvider = {
  async explainSimulation(req: AIExplanationRequest): Promise<AIExplanationOutput> {
    const real = getProvider();
    if (real) {
      try {
        return await real.explainSimulation(req);
      } catch (err) {
        console.error("[explainSimulation error]", err);
      }
    }

    return {
      summary: `Simulasi skenario ${req.scenarioType} telah dihitung. ${req.baselineSummary}`,
      benefits: [
        "Memberikan gambaran dampak langsung terhadap sisa SKS dan target semester lulus.",
        "Membantu memetakan kesiapan beban akademik sebelum mengambil keputusan resmi.",
      ],
      tradeoffs: [
        "Perlu penyesuaian distribusi mata kuliah pada semester terdampak.",
      ],
      risks: req.conflicts.length > 0 ? req.conflicts : ["Pastikan tidak ada mata kuliah prasyarat berantai yang tertunda."],
      assumptions: [
        "Perhitungan menggunakan data kurikulum dan SKS pada roadmap aktif mahasiswa.",
        "Kebijakan konversi SKS mengikuti aturan program studi masing-masing.",
      ],
      unknowns: req.unknowns,
      recommendedNextSteps: [
        "Diskusikan hasil simulasi ini bersama dosen wali sebelum masa perwalian KRS.",
        "Konfirmasi syarat konversi SKS atau izin kegiatan ke program studi.",
      ],
      questionsForCampus: req.unknowns.length > 0
        ? req.unknowns.map((u) => `Bagaimana prosedur resmi terkait: ${u}?`)
        : ["Apakah skenario ini dapat dikonversi ke SKS mata kuliah pilihan atau poin TAK/SKPI?"],
      isAiGenerated: false,
      fallbackReason: "Penjelasan berbasis analisis aturan STARA.",
    };
  },

  async generateThesisDirections(req: AIThesisRequest): Promise<AIThesisOutput> {
    const real = getProvider();
    if (real) {
      try {
        return await real.generateThesisDirections(req);
      } catch (err) {
        console.error("[generateThesisDirections error]", err);
      }
    }

    return generateFallbackThesisDirections(req);
  },

  async chatAboutSimulation(req: AIChatRequest): Promise<AIChatOutput> {
    const real = getProvider();
    if (real) {
      try {
        return await real.chatAboutSimulation(req);
      } catch (err) {
        console.error("[chatAboutSimulation error]", err);
      }
    }

    const ctx = req.simulationContext;
    const lowerMsg = req.userMessage.toLowerCase();
    let reply = `Terkait rencanamu pada **${ctx.title}** (${ctx.scenarioSummary}):\n\n`;

    if (lowerMsg.includes("waktu") || lowerMsg.includes("jadwal") || lowerMsg.includes("bagi")) {
      reply += `Berikut strategi membagi waktu agar kuliah dan kegiatanmu tetap aman:\n1. **Sistem Time-Blocking Mingguan**: Kunci jadwal kuliah wajib dan praktikum terlebih dahulu, lalu alokasikan 2–3 jam di malam hari atau akhir pekan khusus untuk persiapan ${ctx.title}.\n2. **Cicil Tugas Kuliah H-3**: Jangan menunda tugas besar hingga mendekati jadwal kegiatan/kompetisi agar tidak menumpuk saat pekan UTS/UAS.\n3. **Komunikasi Tim & Dosen**: Jika kegiatan dilakukan berkelompok, bagi porsi kerja secara proporsional sesuai beban SKS masing-masing anggota.`;
    } else if (lowerMsg.includes("izin") || lowerMsg.includes("dosen") || lowerMsg.includes("wali") || lowerMsg.includes("kampus")) {
      reply += `Untuk koordinasi dengan Dosen Wali / Program Studi:\n1. **Konsultasi Saat Perwalian**: Sampaikan rencana ${ctx.title} beserta target luarannya (sertifikat, juara, atau portofolio).\n2. **Pengajuan Surat Tugas / Dispensasi**: Jika ada tahapan kegiatan yang bertepatan dengan jam kuliah, ajukan surat dispensasi resmi dari kemahasiswaan/prodi minimal 1 minggu sebelumnya.\n3. **Klaim Poin TAK / SKPI**: Simpan bukti keikutsertaan dan sertifikat untuk diajukan sebagai poin TAK/SKKM dan pendamping ijazah (SKPI).`;
    } else {
      reply += `Rencana **${ctx.title}** sangat positif untuk memperkuat portofolio dan pengalaman praktis kamu.\n\n**3 Langkah Strategis yang Disarankan:**\n1. **Amankan Mata Kuliah Wajib**: Pastikan mata kuliah berprasyarat di semester ini tetap menjadi prioritas utama agar target lulus tepat waktu tidak terganggu.\n2. **Atur Alokasi Jam Mandiri**: Siapkan sekitar 10–15 jam/minggu secara konsisten tanpa mengganggu waktu istirahat dan persiapan ujian.\n3. **Manfaatkan Luaran Kegiatan**: Dokumentasikan proyek atau hasil kegiatan ini ke dalam CV, LinkedIn, serta klaim poin TAK/SKKM di kampus.`;
    }
    return { reply, isAiGenerated: false };
  },

  async suggestAlternativeScenarios(req: AIAlternativesRequest): Promise<AIAlternativesOutput> {
    const real = getProvider();
    if (real) {
      try {
        return await real.suggestAlternativeScenarios(req);
      } catch (err) {
        console.error("[suggestAlternativeScenarios error]", err);
      }
    }

    return generateFallbackAlternatives(req);
  },

  async chatAboutThesis(req: AIThesisChatRequest): Promise<AIThesisChatOutput> {
    const real = getProvider();
    if (real) {
      try {
        return await real.chatAboutThesis(req);
      } catch (err) {
        console.error("[chatAboutThesis error]", err);
      }
    }
    return generateFallbackThesisChat(req);
  },

  async reviewThesisTopic(req: AIThesisReviewRequest): Promise<AIThesisReviewOutput> {
    const real = getProvider();
    if (real) {
      try {
        return await real.reviewThesisTopic(req);
      } catch (err) {
        console.error("[reviewThesisTopic error]", err);
      }
    }
    return generateFallbackThesisReview(req);
  },

  async generateCustomPlanForms(req: AICustomPlanFormRequest): Promise<AICustomPlanFormOutput> {
    const real = getProvider();
    if (real) {
      try {
        return await real.generateCustomPlanForms(req);
      } catch (err) {
        console.error("[generateCustomPlanForms error]", err);
      }
    }
    return generateFallbackCustomPlanForms(req);
  },

  async simulateCustomPlan(req: AICustomPlanSimulateRequest): Promise<AICustomPlanSimulateOutput> {
    const real = getProvider();
    if (real) {
      try {
        return await real.simulateCustomPlan(req);
      } catch (err) {
        console.error("[simulateCustomPlan error]", err);
      }
    }
    return generateFallbackCustomPlanSimulate(req);
  },
};

function generateFallbackThesisDirections(req: AIThesisRequest): AIThesisOutput {
  const prodi = req.programName || "Teknik Informatika";
  const mainInterest = req.interests[0] || "Sistem Cerdas & Optimasi Proses";
  const secondInterest = req.interests[1] || "Analisis Data & Pengambilan Keputusan";
  const method1 = req.methods[0] || "Analisis Kuantitatif & Pemodelan Eksperimental";
  const method2 = req.methods[1] || "Studi Kasus & Evaluasi Komparatif";

  const directions: AIThesisDirection[] = [
    {
      topicArea: `Optimasi dan Analisis Kinerja Berbasis ${mainInterest} pada Studi Kasus ${prodi}`,
      exampleQuestion: `Bagaimana merancang dan mengevaluasi pendekatan berbasis ${mainInterest} untuk meningkatkan efisiensi dan akurasi penyelesaian masalah pada domain ${prodi}?`,
      whyItFits: `Sangat sesuai dengan minat utama kamu di bidang ${mainInterest} serta dapat diselesaikan dalam target waktu ${req.timeAvailable} menggunakan ${req.dataAvailability.toLowerCase()}.`,
      possibleMethod: method1,
      dataRequired: req.dataAvailability,
      feasibility: "tinggi",
      mainRisks: [
        "Perlu penentuan batasan masalah yang spesifik agar ruang lingkup tidak terlalu melebar.",
        "Membutuhkan praproses dan validasi data agar hasil pengujian bebas bias.",
      ],
      firstSteps: [
        `Kumpulkan 5–10 jurnal bereputasi (Sinta 1/2 atau Scopus) 5 tahun terakhir terkait ${mainInterest}.`,
        "Susun tabel perbandingan penelitian terdahulu (metode, dataset, metrik, dan research gap).",
        "Siapkan draf ringkasan masalah 1 halaman untuk dikonsultasikan ke calon dosen pembimbing.",
      ],
      questionsForSupervisor: [
        `Apakah cakupan studi kasus ${mainInterest} ini sudah cukup tajam untuk standar skripsi S1 di ${prodi}?`,
        "Parameter atau metrik evaluasi apa yang paling disarankan untuk menguji validitas hasil?",
      ],
    },
    {
      topicArea: `Perancangan Kerangka Kerja Evaluasi dan Prediksi Berbasis ${secondInterest}`,
      exampleQuestion: `Faktor dan parameter kunci apa saja pada pendekatan ${secondInterest} yang paling signifikan dalam meningkatkan kualitas keputusan/sistem?`,
      whyItFits: `Menggabungkan penguasaan ${req.skills.length > 0 ? req.skills.join(", ") : "analisis sistematis"} dengan kebutuhan riset terapan di ${prodi}.`,
      possibleMethod: method2,
      dataRequired: req.dataAvailability,
      feasibility: "tinggi",
      mainRisks: [
        "Perlu pembanding (baseline) yang jelas agar kontribusi penelitian terlihat nyata saat Sidang Sempro.",
      ],
      firstSteps: [
        "Identifikasi variabel independen dan dependen yang akan diuji dalam penelitian.",
        "Pastikan ketersediaan dataset atau instrumen pengumpulan data sejak awal penyusunan BAB 1.",
        "Buat diagram alur penelitian (research workflow) sebagai bahan diskusi bimbingan pertama.",
      ],
      questionsForSupervisor: [
        "Apakah metode komparasi yang diajukan sudah memadai atau perlu dikombinasikan dengan metode lain?",
        "Berapa ukuran sampel/data minimal yang diharapkan oleh dewan penguji?",
      ],
    },
    {
      topicArea: `Studi Komparatif Metode pada ${mainInterest} untuk Peningkatan Efektivitas Operasional`,
      exampleQuestion: `Seberapa besar peningkatan performa yang dihasilkan melalui perbandingan metode pada kasus ${mainInterest}?`,
      whyItFits: "Penelitian bertipe komparatif sangat disukai penguji karena memiliki tolok ukur matematis/statistik yang objektif dan terukur.",
      possibleMethod: "Eksperimen Komparatif & Pengujian Metrik Terukur",
      dataRequired: req.dataAvailability,
      feasibility: "sedang",
      mainRisks: [
        "Memerlukan ketelitian dalam menjelaskan alasan ilmiah pemilihan kedua metode yang dibandingkan.",
      ],
      firstSteps: [
        "Tentukan 2 metode/pendekatan spesifik yang akan dibandingkan pada objek penelitian yang sama.",
        "Tetapkan indikator evaluasi (misal: akurasi, waktu proses, efisiensi biaya, atau tingkat kepuasan).",
      ],
      questionsForSupervisor: [
        "Apakah kedua metode yang dibandingkan ini sepadan (apple-to-apple) untuk diuji pada objek tersebut?",
      ],
    },
  ];

  return {
    directions,
    isAiGenerated: false,
    fallbackReason: "Rekomendasi disusun berdasarkan pemetaan profil akademik dan minat risetmu.",
  };
}

function generateFallbackAlternatives(req: AIAlternativesRequest): AIAlternativesOutput {
  const wish = String(req.parameters?.keinginanMahasiswa || req.scenarioSummary || "").toLowerCase();

  if (req.scenarioType === "custom" && /lomba|kompetisi|bmc|business|data|hackathon|gemastik/i.test(wish)) {
    return {
      alternatives: [
        {
          title: "Kolaborasi Tim Lintas Keahlian (Role-Splitting)",
          description: "Bentuk tim 3 orang dengan pembagian peran tegas (Riset Pasar/Data, Desain Pitch Deck, & Finansial/Teknis) agar beban per orang turun 60%.",
          tradeoff: "Memerlukan koordinasi rutin 2 kali seminggu agar progres tim tetap sinkron.",
          suitableFor: "Mahasiswa yang mengambil 18–20 SKS kuliah aktif di semester berjalan.",
          suggestedAction: "Meringankan beban waktu menjadi hanya 5–7 jam/minggu tanpa mengganggu tugas kuliah.",
        },
        {
          title: "Integrasi Materi Lomba dengan Tugas Besar Kuliah",
          description: "Selaraskan topik kompetisi dengan studi kasus tugas besar mata kuliah proyek/kewirausahaan/analitik di semester ini.",
          tradeoff: "Perlu persetujuan dosen pengampu mata kuliah terkait kesesuaian topik.",
          suitableFor: "Mahasiswa yang ingin sekali jalan antara target akademik dan prestasi nasional.",
          suggestedAction: "Satu karya menghasilkan nilai mata kuliah A sekaligus portofolio kompetisi nasional.",
        },
        {
          title: "Klaim Poin TAK/SKKM & Insentif Prestasi Kampus",
          description: "Daftarkan keikutsertaan melalui Direktorat Kemahasiswaan/Prodi agar mendapat pembimbing resmi dan konversi poin TAK.",
          tradeoff: "Perlu mengurus surat pengantar sebelum batas penutupan pendaftaran lomba.",
          suitableFor: "Mahasiswa yang mengejar target poin TAK/SKKM kelulusan.",
          suggestedAction: "Menambah 15–30 poin TAK/SKPI sekaligus mendapat dukungan pendanaan kampus.",
        },
      ],
      isAiGenerated: false,
    };
  }

  const scenarioAlts: Record<string, AIAlternative[]> = {
    magang: [
      {
        title: "Magang Paruh Waktu (Part-time / Hybrid)",
        description: "Ambil skema magang hybrid 20 jam/minggu agar mata kuliah wajib prasyarat tetap bisa diambil tanpa menunda kelulusan.",
        tradeoff: "Perlu disiplin tinggi mengatur jadwal antara kantor dan kelas.",
        suitableFor: "Mahasiswa yang masih memiliki mata kuliah wajib semester berjalan.",
        suggestedAction: "Tetap lulus tepat waktu di Semester 8 sambil mengantongi pengalaman industri.",
      },
      {
        title: "Konversi Penuh 20 SKS MBKM Magang Bersertifikat",
        description: "Pilih mitra magang resmi yang diakui prodi untuk konversi langsung ke mata kuliah pilihan dan kerja praktik.",
        tradeoff: "Harus memastikan kesepakatan ekuivalensi SKS dengan Kaprodi sebelum magang dimulai.",
        suitableFor: "Mahasiswa Semester 6–7 yang ingin fokus penuh di industri.",
        suggestedAction: "Bebas tugas kuliah reguler selama 1 semester penuh dengan pengakuan 20 SKS.",
      },
    ],
    mbkm: [
      {
        title: "Studi Independen Bersertifikat + Konversi SKS Pilihan",
        description: "Ikuti bootcamp/studi independen resmi yang materinya linear dengan peminatan prodi untuk dikonversi ke SKS pilihan.",
        tradeoff: "Perlu memetakan silabus program dengan kurikulum prodi.",
        suitableFor: "Mahasiswa yang ingin sertifikasi industri dan portofolio proyek nyata.",
        suggestedAction: "Konversi hingga 20 SKS sekaligus menghasilkan proyek akhir siap kerja.",
      },
    ],
    custom: [
      {
        title: "Penjadwalan Time-Blocking Terukur (Kuliah + Kegiatan)",
        description: "Tetapkan kuota maksimal 10–12 jam/minggu khusus di akhir pekan dan sore hari agar mata kuliah wajib tetap aman.",
        tradeoff: "Waktu bersantai di akhir pekan berkurang selama periode kegiatan berlangsung.",
        suitableFor: "Mahasiswa yang ingin aktif berprestasi/berkegiatan tanpa menurunkan IPK.",
        suggestedAction: "IPK tetap terjaga di atas 3.50 dan target kegiatan tercapai tepat waktu.",
      },
      {
        title: "Konversi Luaran ke Poin TAK / SKPI & Portofolio Karier",
        description: "Dokumentasikan setiap luaran kegiatan untuk diajukan sebagai poin TAK/SKKM serta portofolio LinkedIn.",
        tradeoff: "Perlu menyiapkan sertifikat dan dokumentasi resmi penyelenggara.",
        suitableFor: "Mahasiswa yang sedang memenuhi syarat poin TAK kelulusan.",
        suggestedAction: "Mempercepat pemenuhan syarat sidang skripsi dan meningkatkan daya saing CV.",
      },
    ],
    cuti: [
      {
        title: "Pengurangan Beban SKS (Ambil 12 SKS Ringan)",
        description: "Alih-alih cuti penuh yang menunda lulus 1–2 semester, ambil SKS minimal pada mata kuliah tanpa praktikum berat.",
        tradeoff: "Tetap perlu mengikuti perkuliahan ringan, namun masa studi tidak mundur jauh.",
        suitableFor: "Mahasiswa yang butuh pemulihan ritme belajar tanpa kehilangan status aktif.",
        suggestedAction: "Status mahasiswa tetap aktif dan progres SKS tetap berjalan.",
      },
    ],
    exchange: [
      {
        title: "Pertukaran Mahasiswa Mitra Credit-Transfer Resmi",
        description: "Pilih universitas mitra yang sudah memiliki MoU ekuivalensi mata kuliah dengan prodi asal.",
        tradeoff: "Pilihan mata kuliah harus mengikuti daftar yang disetujui prodi.",
        suitableFor: "Mahasiswa yang ingin pengalaman global tanpa mengulang semester.",
        suggestedAction: "100% SKS yang ditempuh di kampus tujuan diakui di transkrip nilai.",
      },
    ],
    advanced_course: [
      {
        title: "Ambil 1–2 Mata Kuliah Pilihan Lanjutan Pendukung Skripsi",
        description: "Fokuskan pengambilan mata kuliah tingkat atas yang langsung berkaitan dengan calon topik tugas akhir.",
        tradeoff: "Memerlukan kesiapan belajar mandiri lebih awal.",
        suitableFor: "Mahasiswa dengan IPK >= 3.25 yang ingin mempercepat persiapan skripsi.",
        suggestedAction: "Tugas besar mata kuliah lanjutan bisa langsung dijadikan draf awal BAB 1–3 skripsi.",
      },
    ],
  };

  return {
    alternatives: scenarioAlts[req.scenarioType] ?? scenarioAlts.custom,
    isAiGenerated: false,
  };
}

function generateFallbackThesisChat(req: AIThesisChatRequest): AIThesisChatOutput {
  const lower = req.userMessage.toLowerCase();
  const stageNum = req.thesisProgress?.currentActiveStageNumber ?? 1;
  const stageTitle = req.thesisProgress?.currentActiveStageTitle ?? "Penentuan Topik & Pengajuan Judul";
  const approvedTitle = req.thesisProgress?.approvedTitle || req.topicContext || "penelitian skripsimu";

  let header = `Berdasarkan progresmu di **Tahap ${stageNum}: ${stageTitle}** (${req.programName || "Program Studi S1"})${
    req.thesisProgress?.approvedTitle ? ` dengan judul **"${req.thesisProgress.approvedTitle}"**` : ""
  }:\n\n`;

  if (lower.includes("judul") || lower.includes("topik") || lower.includes("ide")) {
    return {
      reply:
        header +
        `Untuk menyusun judul skripsi yang langsung disetujui dosen pembimbing, pastikan memuat **3 komponen wajib**:\n` +
        `1. **Metode / Pendekatan Spesifik**: Hindari kata terlalu umum. Sebutkan algoritma, metode rekayasa, atau kerangka analisis yang digunakan.\n` +
        `2. **Objek & Studi Kasus Nyata**: Tentukan di mana atau pada data apa metode tersebut diterapkan.\n` +
        `3. **Tujuan / Indikator Terukur**: Misalnya peningkatan efisiensi, akurasi klasifikasi, optimasi biaya, atau perancangan sistem.\n\n` +
        `**Langkah Selanjutnya untuk Bimbingan:**\nSiapkan 2 alternatif judul beserta alasan ketersediaan datanya, lalu uji skor kelayakannya di tab **Reviewer Judul & Topik** atau simpan ke **Tahap 1**!`,
      isAiGenerated: false,
    };
  }

  if (lower.includes("rumusan") || lower.includes("gap") || lower.includes("masalah") || lower.includes("batasan")) {
    return {
      reply:
        header +
        `Berikut panduan menyusun **Research Gap & Rumusan Masalah** untuk **${approvedTitle}**:\n` +
        `1. **Cara Menemukan Research Gap**: Ambil 5 jurnal terbaru (5 tahun terakhir), lalu cari keterbatasan pada bagian *Conclusion / Future Work* (misal: akurasi masih di bawah 85%, objek berbeda, atau metode belum menguji variabel tertentu).\n` +
        `2. **Format Rumusan Masalah**: Buat 2–3 kalimat tanya yang berurutan secara logis:\n` +
        `   • *Pertanyaan 1 (Desain/Implementasi)*: Bagaimana merancang/menerapkan metode X pada kasus Y?\n` +
        `   • *Pertanyaan 2 (Evaluasi Terukur)*: Seberapa besar kinerja/peningkatan efektivitas metode X jika diukur dengan metrik Z?\n` +
        `3. **Batasan Masalah**: Batasi periode data, jumlah sampel/dataset, dan ruang lingkup pengujian agar selesai tepat waktu dalam 1–2 semester.`,
      isAiGenerated: false,
    };
  }

  if (lower.includes("bab 1") || lower.includes("latar belakang") || lower.includes("pendahuluan")) {
    return {
      reply:
        header +
        `Gunakan struktur **Piramida Terbalik (4 Bagian)** untuk menulis Latar Belakang BAB 1 yang kuat:\n` +
        `1. **Paragraf 1–2 (Konteks & Urgensi Empiris)**: Paparkan fenomena aktual dan dukung dengan data/angka/fakta resmi mengapa masalah pada **${approvedTitle}** penting diselesaikan.\n` +
        `2. **Paragraf 3–4 (Analisis Solusi Terdahulu & Gap)**: Jelaskan penelitian sebelumnya yang pernah mencoba menyelesaikan masalah serupa beserta kekurangannya.\n` +
        `3. **Paragraf 5 (Solusi/Metode yang Diajukan)**: Jelaskan mengapa metode yang kamu pilih tepat untuk menutup celah tersebut.\n` +
        `4. **Paragraf Penutup**: Tegaskan tujuan akhir penelitian dan manfaatnya secara teoritis maupun praktis.`,
      isAiGenerated: false,
    };
  }

  if (lower.includes("bab 2") || lower.includes("tinjauan") || lower.includes("literatur") || lower.includes("jurnal")) {
    return {
      reply:
        header +
        `Strategi menyusun **BAB 2 & Studi Literatur State-of-the-Art**:\n` +
        `1. **Matriks Penelitian Terdahulu**: Buat tabel berisi minimal 5–10 paper (Peneliti & Tahun, Judul, Metode, Dataset/Objek, Hasil Utama, dan Perbedaan dengan Skripsimu).\n` +
        `2. **Hindari Copy-Paste Definisi**: Fokuskan sub-bab landasan teori hanya pada variabel, metode, dan rumus evaluasi yang benar-benar dipakai di BAB 3 dan BAB 4.\n` +
        `3. **Bagan Kerangka Berpikir**: Buat diagram visual yang menghubungkan Kondisi Masalah → Pendekatan Metode → Output Solusi.`,
      isAiGenerated: false,
    };
  }

  if (lower.includes("bab 3") || lower.includes("metodologi") || lower.includes("metode")) {
    return {
      reply:
        header +
        `Komponen wajib dalam **BAB 3 Metodologi Penelitian** agar lolos ujian Sempro:\n` +
        `1. **Diagram Alur Penelitian (Flowchart)**: Gambarkan tahapan dari studi literatur, pengumpulan data, praproses, implementasi metode, hingga pengujian dan penarikan kesimpulan.\n` +
        `2. **Spesifikasi Data / Populasi**: Jelaskan sumber data, jumlah sampel/baris data, dan cara validasinya.\n` +
        `3. **Skenario & Metrik Evaluasi**: Tentukan rumus pengujian yang objektif (misal: *Accuracy, F1-Score, RMSE, System Usability Scale, atau Efisiensi Waktu/Biaya*).`,
      isAiGenerated: false,
    };
  }

  if (lower.includes("sempro") || lower.includes("sidang") || lower.includes("penguji") || lower.includes("presentasi")) {
    return {
      reply:
        header +
        `**Strategi Menghadapi Dewan Penguji Seminar Proposal / Sidang Skripsi:**\n` +
        `1. **3 Pertanyaan Paling Sering Dicecar Penguji**:\n` +
        `   • *"Mengapa memilih metode ini, bukan metode lain?"* → Jawab dengan bukti dari jurnal acuan di BAB 2.\n` +
        `   • *"Dari mana datanya dan apakah sudah valid?"* → Tunjukkan sumber dataset/sampel yang sudah siap di BAB 3.\n` +
        `   • *"Apa bedanya skripsimu dengan penelitian sebelumnya?"* → Tunjukkan tabel State-of-the-Art milikmu.\n` +
        `2. **Struktur Slide 15 Menit (Maks 12 Slide)**: Fokuskan 70% waktu pada Latar Belakang Masalah, Research Gap, dan Metodologi (BAB 3).`,
      isAiGenerated: false,
    };
  }

  return {
    reply:
      header +
      `Berikut langkah fokus yang perlu kamu siapkan pada **${stageTitle}**:\n` +
      `1. **Lengkapi Dokumen & Catatan Tahap ${stageNum}**: Buka detail Tahap ${stageNum} di tab **Tracker 11 Tahap** untuk melihat output wajib yang diminta dosen pembimbing.\n` +
      `2. **Siapkan Bahan Bimbingan**: Jangan datang bimbingan dengan tangan kosong—bawa minimal draf progres dan 2 opsi solusi atas kendala yang kamu temui.\n` +
      `3. **Tanyakan Hal Spesifik**: Kamu bisa meminta saya membuatkan contoh rumusan masalah, kerangka BAB 1–5, rekomendasi jurnal, atau simulasi pertanyaan sidang untuk topikmu!`,
    isAiGenerated: false,
  };
}

function generateFallbackThesisReview(req: AIThesisReviewRequest): AIThesisReviewOutput {
  const title = (req.titleOrDraft || "").trim();
  const prodi = req.programName || "Teknik Informatika";
  const wordCount = title.split(/\s+/).filter(Boolean).length;
  const hasMethod = /menggunakan|berbasis|dengan|algoritma|metode|analisis|penerapan|komparasi|optimasi|klasifikasi|perancangan|implementasi|evaluasi/i.test(title);
  const score = Math.min(92, Math.max(66, (hasMethod ? 78 : 66) + (wordCount >= 7 && wordCount <= 18 ? 8 : 0)));
  const verdict = score >= 80 ? "sangat_baik" : score >= 68 ? "cukup_baik" : "perlu_penyempurnaan";

  return {
    originalTitle: title,
    score,
    verdict,
    strengths: [
      `Topik memiliki relevansi kuat dengan kurikulum dan bidang keahlian ${prodi}.`,
      hasMethod
        ? "Sudah mencantumkan indikasi pendekatan/metode penyelesaian masalah secara eksplisit."
        : "Gagasan objek penelitian memiliki urgensi praktis yang baik untuk diangkat menjadi skripsi.",
      "Ruang lingkup penelitian realistis untuk diselesaikan dalam 1–2 semester.",
    ],
    weaknesses: [
      !hasMethod
        ? "Metode atau algoritma spesifik belum disebutkan secara tegas di dalam redaksi judul."
        : "Perlu memperjelas indikator/metrik evaluasi keberhasilan di dalam rumusan masalah.",
      "Perlu penegasan batasan studi kasus atau sumber dataset agar tidak dianggap terlalu luas oleh penguji Sempro.",
    ],
    improvedTitles: [
      `Analisis dan Optimasi ${title} Menggunakan Pendekatan Terukur pada Studi Kasus ${prodi}`,
      `Implementasi dan Evaluasi Kinerja Metode pada ${title} untuk Peningkatan Efisiensi Sistem`,
      `Studi Komparatif Pendekatan Berbasis Data pada ${title}`,
    ],
    suggestedMethods: [
      "Eksperimen Kuantitatif & Evaluasi Metrik Performa",
      "Analisis Komparatif Berbasis Baseline",
      "Perancangan Sistem Terstruktur & Pengujian Validitas",
    ],
    defenseQuestions: [
      "Apa kebaruan (novelty) atau pembeda utama penelitian ini dibandingkan 5 jurnal terdahulu?",
      "Mengapa Anda memilih metode tersebut dibandingkan metode alternatif lainnya untuk menyelesaikan masalah ini?",
      "Bagaimana cara Anda mengukur dan memvalidasi bahwa hasil penelitian ini benar-benar akurat dan bebas bias?",
    ],
    isAiGenerated: false,
    fallbackReason: "Evaluasi kelayakan judul berdasarkan standar akademik STARA.",
  };
}

function generateFallbackCustomPlanForms(req: AICustomPlanFormRequest): AICustomPlanFormOutput {
  const p = (req.userPrompt || "").toLowerCase();

  if (/pengabdian|kkn|desa|sosial|libur|relawan/i.test(p)) {
    return {
      categoryBadge: "Kegiatan Nonakademik",
      detectedGoal: "Pengabdian Masyarakat / Aksi Sosial",
      briefExplanation: "STARA AI menyiapkan parameter berikut untuk memetakan alokasi waktu dan memastikan kegiatan tidak berbenturan dengan jadwal akademik.",
      fields: [
        {
          id: "semester_periode",
          label: "Semester atau periode pelaksanaan",
          type: "select",
          defaultValue: "Liburan Semester Genap",
          options: ["Liburan Semester Genap", "Liburan Semester Ganjil", "Antara Semester 4 dan 5", "Semester Aktif (Paralel Kuliah)"],
          helperText: "Pilih waktu luang agar tidak mengganggu perkuliahan aktif.",
          required: true,
        },
        {
          id: "durasi",
          label: "Durasi kegiatan",
          type: "text",
          defaultValue: "2 - 4 minggu",
          helperText: "Estimasi lama pelaksanaan kegiatan di lapangan.",
          required: true,
        },
        {
          id: "beban_waktu",
          label: "Estimasi beban waktu",
          type: "text",
          defaultValue: "Penuh waktu saat libur (tidak mengganggu kuliah reguler)",
          helperText: "Alokasi jam per minggu yang dicurahkan.",
          required: true,
        },
        {
          id: "target_kegiatan",
          label: "Target kegiatan",
          type: "text",
          defaultValue: "Pemberdayaan masyarakat & perolehan sertifikat pengabdian",
          helperText: "Luaran atau output nyata yang diharapkan tercapai.",
          required: true,
        },
        {
          id: "potensi_bentrok",
          label: "Potensi bentrok dengan agenda akademik",
          type: "text",
          defaultValue: "Rendah — selesai sebelum masa pengisian KRS semester baru",
          helperText: "Titik kritis seperti jadwal registrasi atau perkuliahan perdana.",
          required: false,
        },
        {
          id: "konversi_sks",
          label: "Pengajuan Konversi SKS / Pengakuan Akademik (Opsional)",
          type: "select",
          defaultValue: "Tidak (hanya poin SKPI / Portofolio)",
          options: ["Tidak (hanya poin SKPI / Portofolio)", "Ya, ingin diajukan untuk SKS Kuliah Pengabdian/MBKM", "Belum diputuskan"],
          helperText: "Konversi SKS tidak perlu menjadi field utama, kecuali pengguna menyatakan ingin mengajukan pengakuan akademik.",
          required: false,
        },
      ],
      isAiGenerated: false,
    };
  }

  if (/lomba|kompetisi|hackathon|data|bmc|business|gemastik|prestasi|olimpiade/i.test(p)) {
    const nextSem = (req.studentProfile?.currentSemester ?? 4) + 1;
    return {
      categoryBadge: "Kompetisi & Prestasi Mahasiswa",
      detectedGoal: req.userPrompt.length <= 65 ? req.userPrompt : "Kompetisi Mahasiswa Tingkat Nasional",
      briefExplanation: "STARA AI menyiapkan parameter khusus untuk menyeimbangkan persiapan kompetisi dengan beban kuliah reguler.",
      fields: [
        {
          id: "semester_periode",
          label: "Semester atau periode pelaksanaan",
          type: "select",
          defaultValue: `Semester ${nextSem} (Paralel Kuliah)`,
          options: [`Semester ${nextSem} (Paralel Kuliah)`, `Semester ${nextSem + 1}`, "Liburan Antar-Semester"],
          helperText: "Kapan kompetisi dan babak penyisihan berlangsung.",
          required: true,
        },
        {
          id: "durasi",
          label: "Durasi persiapan & kompetisi",
          type: "text",
          defaultValue: "6 - 8 minggu intensif",
          helperText: "Waktu yang dibutuhkan untuk riset, latihan, dan submisi karya.",
          required: true,
        },
        {
          id: "beban_waktu",
          label: "Estimasi beban waktu per minggu",
          type: "text",
          defaultValue: "10 - 14 jam/minggu di luar jam kuliah",
          helperText: "Waktu luang yang dialokasikan di malam hari atau akhir pekan.",
          required: true,
        },
        {
          id: "target_kegiatan",
          label: "Target capaian kegiatan",
          type: "text",
          defaultValue: "Lolos babak final / Juara Nasional, klaim poin TAK, & portofolio karier",
          helperText: "Target objektif yang ingin dicapai tim/individu.",
          required: true,
        },
        {
          id: "potensi_bentrok",
          label: "Potensi bentrok dengan agenda akademik",
          type: "text",
          defaultValue: "Perlu antisipasi jika jadwal final bertepatan dengan pekan UTS / Tugas Besar",
          helperText: "Perlu diwaspadai jika deadline submisi bertepatan dengan ujian.",
          required: false,
        },
        {
          id: "beban_sks_kuliah",
          label: "Rencana pengambilan SKS kuliah reguler",
          type: "select",
          defaultValue: "18 - 20 SKS reguler",
          options: ["18 - 20 SKS reguler", "15 - 17 SKS (Beban lebih ringan)", "21 - 24 SKS (Maksimal)"],
          helperText: "Beban SKS yang diambil bersamaan dengan persiapan lomba.",
          required: true,
        },
      ],
      isAiGenerated: false,
    };
  }

  return {
    categoryBadge: "Rencana Kustom dengan AI",
    detectedGoal: req.userPrompt.slice(0, 60),
    briefExplanation: "STARA AI menyiapkan parameter untuk menganalisis beban waktu dan dampak rencana terhadap roadmap studimu.",
    fields: [
      {
        id: "semester_periode",
        label: "Semester atau periode pelaksanaan",
        type: "select",
        defaultValue: `Semester ${(req.studentProfile?.currentSemester ?? 4) + 1}`,
        options: [`Semester ${(req.studentProfile?.currentSemester ?? 4) + 1}`, "Liburan Semester", "Tahun Akademik Depan"],
        helperText: "Waktu pelaksanaan kegiatan yang direncanakan.",
        required: true,
      },
      {
        id: "durasi",
        label: "Durasi kegiatan",
        type: "text",
        defaultValue: "1 semester (3 - 4 bulan)",
        helperText: "Lama periode waktu kegiatan berlangsung.",
        required: true,
      },
      {
        id: "beban_waktu",
        label: "Estimasi alokasi waktu per minggu",
        type: "text",
        defaultValue: "10 - 15 jam/minggu",
        helperText: "Rata-rata waktu yang dialokasikan setiap minggu.",
        required: true,
      },
      {
        id: "target_kegiatan",
        label: "Target luaran utama kegiatan",
        type: "text",
        defaultValue: "Peningkatan kompetensi praktis, sertifikat, dan portofolio",
        helperText: "Output konkret dari kegiatan ini.",
        required: true,
      },
      {
        id: "potensi_bentrok",
        label: "Potensi bentrok dengan perkuliahan",
        type: "text",
        defaultValue: "Terkendali — dilaksanakan di luar jam kuliah wajib",
        helperText: "Titik temu dengan agenda perkuliahan reguler.",
        required: false,
      },
      {
        id: "konversi_sks",
        label: "Pengakuan / Konversi Akademik (Opsional)",
        type: "select",
        defaultValue: "Sebagai Poin TAK / SKPI & Portofolio",
        options: ["Sebagai Poin TAK / SKPI & Portofolio", "Ingin diajukan untuk SKS Pilihan / MBKM", "Pengembangan Mandiri"],
        helperText: "Apakah kegiatan ini akan diajukan untuk poin TAK atau SKS.",
        required: false,
      },
    ],
    isAiGenerated: false,
  };
}

function generateFallbackCustomPlanSimulate(req: AICustomPlanSimulateRequest): AICustomPlanSimulateOutput {
  const combinedText = `${req.userPrompt} ${req.detectedGoal} ${req.categoryBadge} ${Object.values(req.formData).join(" ")}`.toLowerCase();
  const isCompetition = /lomba|kompetisi|bmc|business|hackathon|data|gemastik|olimpiade|juara|final/i.test(combinedText);
  const isInternship = /magang|intern|kerja|part-time|startup|industri|perusahaan/i.test(combinedText);
  const isHoliday = /libur/i.test(req.formData.semester_periode || "");
  const semLabel = req.formData.semester_periode || `Semester ${(req.studentProfile?.currentSemester ?? 4) + 1}`;
  const sksLabel = req.formData.beban_sks_kuliah || "18 - 20 SKS";

  if (isCompetition) {
    return {
      overallVerdict: "aman",
      verdictTitle: `Rencana Kompetisi di ${semLabel} Sangat Realistis & Bernilai Tambah Tinggi`,
      academicImpactSummary: `Mengikuti "${req.detectedGoal}" pada ${semLabel} sambil menempuh ${sksLabel} sangat layak dijalankan. Selama persiapan dilakukan dengan sistem time-blocking (10–14 jam/minggu di luar jam kuliah), jadwal kelulusanmu tetap aman di Semester 8 dan portofolio serta poin TAK/SKKM kamu akan meningkat signifikan.`,
      estimatedHoursPerWeek: req.formData.beban_waktu || "10 - 14 jam/minggu",
      impactOnGraduation: "Tidak menunda kelulusan — estimasi lulus tetap tepat waktu (Semester 8)",
      keyRisks: [
        "Potensi penumpukan beban kerja jika jadwal submisi proposal/final bertepatan dengan pekan UTS atau Tugas Besar kuliah.",
        "Risiko pembagian tugas tim yang kurang merata jika tidak disepakati sejak awal.",
        "Kelelahan fokus jika persiapan lomba dilakukan larut malam menjelang kuliah pagi.",
      ],
      mitigationStrategies: [
        "Kunci jadwal latihan & penyusunan materi lomba di akhir pekan dan maksimal 2 jam pada malam hari kerja.",
        "Cicil tugas kuliah wajib minimal H-4 sebelum tenggat submisi babak penyisihan/final lomba.",
        "Ajukan surat dispensasi resmi dari prodi/kemahasiswaan jika babak presentasi final jatuh pada hari perkuliahan.",
      ],
      actionSteps: [
        {
          phase: "Pra-Kegiatan",
          steps: [
            "Bentuk tim dengan pembagian peran spesifik (Riset & Analisis, Desain Materi/Pitch Deck, dan Presentasi).",
            "Petakan timeline babak penyisihan hingga final dan tandai irisan dengan jadwal UTS/UAS kampus.",
          ],
        },
        {
          phase: "Pelaksanaan",
          steps: [
            "Jalankan sprint persiapan mingguan (2x pertemuan evaluasi per minggu) tanpa mengorbankan presensi kuliah.",
            "Konsultasikan draf karya/proposal lomba dengan dosen pembimbing untuk mempertajam kualitas analisis.",
          ],
        },
        {
          phase: "Pasca-Kegiatan",
          steps: [
            "Klaim sertifikat kepesertaan/juara ke sistem TAK/SKKM dan Surat Keterangan Pendamping Ijazah (SKPI).",
            "Publikasikan studi kasus dan hasil karya kompetisi ke portofolio LinkedIn dan CV.",
          ],
        },
      ],
      suggestedAlternatives: [
        {
          title: "Sinergi Topik Lomba dengan Tugas Besar Kuliah",
          description: "Gunakan riset atau model bisnis/analitik dari kompetisi ini sebagai bahan Tugas Besar mata kuliah relevan di semester berjalan.",
          benefit: "Hemat waktu kerja hingga 45% dengan hasil ganda (nilai kuliah + karya lomba).",
        },
        {
          title: "Kolaborasi Tim Lintas Jurusan & Pembimbing Dosen",
          description: "Ajak rekan dengan keahlian komplementer dan minta arahan dosen ahli agar validasi karya jauh lebih cepat.",
          benefit: "Peluang lolos babak final meningkat sekaligus memperluas jejaring akademik.",
        },
      ],
      questionsForAcademicAdvisor: [
        "Apakah keikutsertaan dan prestasi pada kompetisi nasional ini dapat dikonversi menjadi poin TAK/SKKM dan dicatat di SKPI?",
        "Bagaimana prosedur pengajuan dosen pembimbing lomba serta surat dispensasi jika babak final berlangsung di luar kota?",
      ],
      isAiGenerated: false,
    };
  }

  if (isInternship) {
    return {
      overallVerdict: "perlu_perhatian",
      verdictTitle: `Rencana Magang pada ${semLabel} Layak dengan Penyesuaian Jadwal Kuliah`,
      academicImpactSummary: `Menjalankan "${req.detectedGoal}" pada ${semLabel} memberikan akselerasi karier yang sangat kuat. Namun karena dilakukan paralel dengan perkuliahan, pastikan beban SKS dijaga pada kisaran terukur atau ajukan konversi SKS mata kuliah pilihan/MBKM agar tidak mengganggu IPK.`,
      estimatedHoursPerWeek: req.formData.beban_waktu || "15 - 20 jam/minggu",
      impactOnGraduation: "Tetap lulus tepat waktu jika mata kuliah wajib prasyarat tidak ditinggalkan",
      keyRisks: [
        "Bentrok jadwal meeting/jam kerja magang dengan kelas tatap muka atau praktikum wajib.",
        "Beban ganda saat masa ujian tengah/akhir semester berlangsung bersamaan dengan sprint proyek magang.",
      ],
      mitigationStrategies: [
        "Pilih kelas kuliah di pagi hari dan sepakati jam kerja fleksibel/remote dengan mentor perusahaan.",
        "Konsultasikan ke Kaprodi mengenai peluang konversi kegiatan magang menjadi SKS Kerja Praktik atau MK Pilihan.",
      ],
      actionSteps: [
        {
          phase: "Pra-Kegiatan",
          steps: [
            "Susun KRS dengan memprioritaskan mata kuliah wajib tanpa bentrok jam kerja magang.",
            "Konfirmasi perjanjian jam kerja part-time/hybrid bersama pihak perusahaan.",
          ],
        },
        {
          phase: "Pelaksanaan",
          steps: [
            "Catat logbook pekerjaan mingguan yang relevan dengan kompetensi program studi.",
            "Jaga komunikasi proaktif dengan dosen pengampu dan supervisor magang saat pekan ujian.",
          ],
        },
        {
          phase: "Pasca-Kegiatan",
          steps: [
            "Minta surat keterangan selesai magang dan penilaian kinerja resmi dari perusahaan.",
            "Gunakan studi kasus masalah di tempat magang sebagai kandidat topik Skripsi / Tugas Akhir.",
          ],
        },
      ],
      suggestedAlternatives: [
        {
          title: "Konversi SKS Kerja Praktik / Mata Kuliah Pilihan",
          description: "Ajukan kegiatan magang ini ke program studi agar diakui sebagai SKS Kerja Praktik atau MK Pilihan.",
          benefit: "Mengurangi beban kelas reguler sebesar 3–6 SKS di semester berjalan.",
        },
        {
          title: "Jadikan Kasus Magang sebagai Topik Skripsi Awal",
          description: "Amati permasalahan teknis di perusahaan tempat magang untuk diangkat menjadi proposal Tugas Akhir di semester berikutnya.",
          benefit: "Mempercepat penyelesaian skripsi karena data dan studi kasus sudah tersedia.",
        },
      ],
      questionsForAcademicAdvisor: [
        "Apakah magang part-time ini dapat diakui sebagai pemenuhan SKS Kerja Praktik / Magang di kurikulum prodi?",
        "Berapa batas SKS kuliah reguler yang paling aman diambil sambil menjalani magang part-time?",
      ],
      isAiGenerated: false,
    };
  }

  return {
    overallVerdict: "aman",
    verdictTitle: isHoliday
      ? "Rencana Sangat Aman & Efektif (Memanfaatkan Periode Libur Antar-Semester)"
      : `Rencana "${req.detectedGoal}" Realistis dengan Penjadwalan Terstruktur`,
    academicImpactSummary: `Rencana "${req.detectedGoal}" pada ${semLabel} sangat layak dijalankan. ${
      isHoliday
        ? "Karena dilaksanakan pada masa libur antar-semester, kegiatan ini sama sekali tidak membebani SKS kuliah aktif dan bebas dari risiko penundaan kelulusan."
        : "Dengan alokasi waktu mingguan yang konsisten di luar jam kuliah wajib, kamu tetap dapat menjaga performa IPK sekaligus memperoleh portofolio dan poin TAK/SKPI."
    }`,
    estimatedHoursPerWeek: req.formData.beban_waktu || "10 - 15 jam/minggu",
    impactOnGraduation: "Tidak menunda kelulusan — estimasi tetap tepat waktu di Semester 8",
    keyRisks: [
      isHoliday
        ? "Perlu memastikan kegiatan selesai tepat waktu sebelum masa perwalian dan pengisian KRS semester baru."
        : "Potensi tumpang tindih waktu apabila terdapat deadline tugas besar kuliah secara bersamaan.",
      "Perlu memastikan sertifikat dan dokumentasi kegiatan terverifikasi untuk klaim poin TAK/SKPI.",
    ],
    mitigationStrategies: [
      "Susun jadwal mingguan terukur dan tetapkan prioritas utama pada mata kuliah wajib berprasyarat.",
      "Simpan seluruh dokumentasi, surat tugas, dan sertifikat untuk administrasi poin kemahasiswaan.",
    ],
    actionSteps: [
      {
        phase: "Pra-Kegiatan",
        steps: [
          "Pastikan jadwal kegiatan tidak berbenturan dengan kalender akademik dan masa KRS.",
          "Siapkan rincian target luaran yang ingin dicapai dari kegiatan ini.",
        ],
      },
      {
        phase: "Pelaksanaan",
        steps: [
          "Jalankan kegiatan sesuai alokasi jam mingguan yang telah direncanakan.",
          "Catat progres dan hasil karya secara berkala sebagai bahan portofolio.",
        ],
      },
      {
        phase: "Pasca-Kegiatan",
        steps: [
          "Unggah bukti sertifikat ke portal kemahasiswaan/TAK dan perbarui CV.",
          "Evaluasi dampak kegiatan terhadap kesiapan rencana studi semester berikutnya.",
        ],
      },
    ],
    suggestedAlternatives: [
      {
        title: "Integrasi Luaran ke Portofolio & Poin TAK/SKPI",
        description: "Dokumentasikan hasil kegiatan ini sebagai proyek portofolio profesional dan klaim poin TAK kampus.",
        benefit: "Meningkatkan kesiapan karier sekaligus memenuhi syarat sidang kelulusan.",
      },
      {
        title: "Kolaborasi Tim untuk Efisiensi Beban Waktu",
        description: "Jalankan kegiatan bersama rekan satu angkatan agar beban persiapan dan koordinasi lebih ringan.",
        benefit: "Menghemat alokasi waktu pribadi hingga 40% setiap minggu.",
      },
    ],
    questionsForAcademicAdvisor: [
      "Apakah kegiatan ini dapat diklaim ke dalam poin TAK/SKKM dan Surat Keterangan Pendamping Ijazah (SKPI)?",
      "Apakah ada saran penyesuaian mata kuliah pilihan yang mendukung rencana kegiatan ini?",
    ],
    isAiGenerated: false,
  };
}


