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

export interface AIThesisChatRequest {
  programName?: string;
  topicContext?: string;
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

function getProvider(): AIProvider | null {
  const provider = process.env.AI_PROVIDER;
  if (!provider) return null;

  if (provider === "google" && process.env.GOOGLE_AI_API_KEY) {
    try {
      // Dynamic import Google GenAI
      const { GoogleGenAI } = require("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

      // Urutan model otomatis: jika model utama terkena limit (429/503), otomatis coba cadangan
      const CANDIDATE_MODELS = [
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash-lite",
        "gemini-3-flash-preview",
        "gemini-3.5-flash",
        "gemini-3.6-flash",
      ];

      async function generateWithFallback(options: {
        contents: string;
        config?: Record<string, unknown>;
      }): Promise<{ text: string; modelUsed: string }> {
        let lastError: unknown = null;
        for (const model of CANDIDATE_MODELS) {
          try {
            const res = await ai.models.generateContent({
              model,
              contents: options.contents,
              config: options.config,
            });
            const text = res.text?.trim() || "";
            if (text) {
              return { text, modelUsed: model };
            }
          } catch (err: unknown) {
            lastError = err;
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
              maxOutputTokens: 1200,
            },
          });

          const parsed = JSON.parse(text || "{}");
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
Anda adalah asisten pembimbing skripsi/tugas akhir STARA.
Bantu mahasiswa dengan profil berikut untuk menemukan arah topik skripsi/TA:
- Program Studi: ${req.programName}
- Minat/Bidang Tertarik: ${req.interests.join(", ")}
- Metode yang dikuasai/diminati: ${req.methods.join(", ")}
- Ketersediaan Data: ${req.dataAvailability}
- Waktu yang Tersedia: ${req.timeAvailable}
- Skill: ${req.skills.join(", ")}
${req.constraints ? `- Catatan Khusus: ${req.constraints}` : ""}

Hasilkan 2-3 rekomendasi arah penelitian TA yang realistis dan terstruktur.
HANYA kembalikan valid JSON (tanpa markdown codeblocks) dengan format:
{
  "directions": [
    {
      "topicArea": "Judul Bidang Topik",
      "exampleQuestion": "Rumusan masalah / pertanyaan penelitian contoh",
      "whyItFits": "Mengapa topik ini cocok dengan minat & skill mahasiswa",
      "possibleMethod": "Metode penelitian yang disarankan",
      "dataRequired": "Kebutuhan dataset/data penelitian",
      "feasibility": "tinggi",
      "mainRisks": ["risiko 1", "risiko 2"],
      "firstSteps": ["langkah awal 1", "langkah 2"],
      "questionsForSupervisor": ["pertanyaan untuk diajukan ke calon dosen pembimbing"]
    }
  ],
  "isAiGenerated": true
}
`;

          const { text } = await generateWithFallback({
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            },
          });

          const parsed = JSON.parse(text || "{}");
          return {
            directions: parsed.directions || [],
            isAiGenerated: true,
          };
        },

        async chatAboutSimulation(req: AIChatRequest): Promise<AIChatOutput> {
          const ctx = req.simulationContext;
          const systemCtx = `
Anda adalah STARA AI — asisten akademik dan teman diskusi mahasiswa Indonesia.
Karakter Anda:
- Ramah, luwes, suportif, dan berbahasa Indonesia yang santai tapi sopan.
- Anda paham konteks simulasi mahasiswa berikut:
  * Skenario: ${ctx.title} (${ctx.scenarioType})
  * Target: ${ctx.goalLabel}
  * Baseline: ${ctx.baselineSummary}
  * Setelah Skenario: ${ctx.scenarioSummary}
  * Perubahan Semester: ${ctx.semesterDelta !== null ? `${ctx.semesterDelta > 0 ? "+" : ""}${ctx.semesterDelta} semester` : "tidak berubah"}
  * Perubahan SKS: ${ctx.creditsDelta > 0 ? `+${ctx.creditsDelta}` : ctx.creditsDelta} SKS
  * Ringkasan Analisis: ${req.explanation.summary}

Panduan Batasan Topik (Strict Guardrails):
- FOKUS UTAMA ANDA HANYA seputar akademik, simulasi skenario (${ctx.title}), perencanaan roadmap studi, SKS, magang/MBKM, skripsi, dan kelulusan mahasiswa di platform STARA.
- Jika mahasiswa menyapa (seperti "halo", "hai", "pagi"), sapa balik dengan ramah dan tanyakan apa yang ingin didiskusikan tentang simulasi skenario atau rencana studinya.
- JIKA MAHASISWA BERTANYA DI LUAR TOPIK AKADEMIK/KULIAH/SIMULASI (misal: tentang politik, resep masakan, game, cerita fiksi, curhat umum, coding hal yang tidak ada kaitannya dengan studi, atau topik random lainnya):
  * JANGAN melayani atau melanjutkan topik di luar konteks tersebut.
  * Tolak secara sopan dan langsung arahkan kembali pembicaraan ke topik akademik atau simulasi ini.
  * Contoh respons pengalihan: "Maaf ya, sebagai asisten akademik STARA, saya difokuskan untuk membantu perencanaan studi, simulasi skenario, dan kelulusanmu. Ada yang ingin kamu diskusikan atau tanyakan seputar rencana semester atau simulasi ${ctx.title} ini?"
- Jaga jawaban tetap ringkas, padat (2-4 kalimat), sopan, dan solutif.
`;

          const historyText = req.chatHistory
            .map((h) => `${h.role === "user" ? "Mahasiswa" : "STARA AI"}: ${h.content}`)
            .join("\n");

          const fullPrompt = `${systemCtx}\n\nRiwayat Percakapan:\n${historyText}\n\nMahasiswa: ${req.userMessage}\nSTARA AI:`;

          const { text } = await generateWithFallback({
            contents: fullPrompt,
            config: {
              maxOutputTokens: 500,
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
  ? `Mahasiswa sedang merancang RENCANA STUDI KUSTOM (bukan skenario baku). Parameter/keinginan: ${JSON.stringify(req.parameters)}
- Target: ${req.goalLabel}
- Kondisi roadmap: ${req.baselineSummary}
- Konteks: ${req.scenarioSummary}

Tugas: Berikan 3 rencana alternatif yang BERBEDA, KREATIF, dan REALISTIS (misal: percepatan lulus, magang/MBKM, riset bersama dosen, pengurangan beban, kombinasi) sesuai profil dan keinginan mahasiswa. Hanya seputar akademik, kuliah, karier mahasiswa, dan kelulusan.`
  : `Mahasiswa sedang mengevaluasi skenario: ${req.scenarioType} (Parameter: ${JSON.stringify(req.parameters)})
- Target: ${req.goalLabel}
- Hasil simulasi saat ini: ${req.scenarioSummary} (Delta semester: ${req.semesterDelta ?? 0})
- Risiko terdeteksi: ${req.risks.join("; ")}

Tugas: Berikan 2 alternatif skenario yang BERBEDA, KREATIF, dan REALISTIS untuk mencapai target mahasiswa dengan risiko lebih terkendali.`}
Setiap kali diminta, eksplorasi opsi berbeda (misal: alternatif waktu pelaksanaan, model konversi SKS, kombinasi dengan riset dosen, program magang remote/part-time, atau penyesuaian beban matakuliah).

HANYA kembalikan valid JSON:
{
  "alternatives": [
    {
      "title": "Nama Opsi Alternatif yang Menarik & Jelas",
      "description": "Penjelasan praktis skenario ini (1-2 kalimat)",
      "tradeoff": "Konsekuensi atau trade-off yang harus dihadapi (1 kalimat)",
      "suitableFor": "Paling cocok jika kamu...",
      "suggestedAction": "Langkah awal nyata yang bisa diambil"
    }
  ],
  "isAiGenerated": true
}
`;

          const { text } = await generateWithFallback({
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.85,
              maxOutputTokens: 800,
            },
          });

          const parsed = JSON.parse(text || "{}");
          return {
            alternatives: parsed.alternatives || [],
            isAiGenerated: true,
          };
        },

        async chatAboutThesis(req: AIThesisChatRequest): Promise<AIThesisChatOutput> {
          const systemCtx = `
Anda adalah STARA Thesis AI Consultant — konsultan dan mentor akademik skripsi & tugas akhir mahasiswa di Indonesia.
Karakter Anda:
- Ramah, empatik, suportif, berwawasan akademik kuat, dan berbahasa Indonesia yang santai tapi formal-akademis.
- Mahasiswa: Program Studi ${req.programName || "Teknik Informatika / Umum"}.
${req.topicContext ? `- Konteks Topik / Judul yang sedang dibahas: "${req.topicContext}"` : ""}

Panduan Batasan Topik (Strict Guardrails):
- FOKUS ANDA HANYA SEPUTAR:
  1. Penentuan ide topik, perumusan judul skripsi/TA, identifikasi masalah, dan batasan masalah.
  2. Metodologi penelitian (eksperimen, survei, kuantitatif, kualitatif, model AI/ML, studi kasus, perancangan sistem/SDLC).
  3. Struktur naskah skripsi (BAB 1 Pendahuluan, BAB 2 Tinjauan Pustaka & Kerangka Teori, BAB 3 Metodologi, BAB 4 Hasil & Pembahasan, BAB 5 Kesimpulan).
  4. Pencarian referensi ilmiah, jurnal IEEE/Scopus/Sinta, dan dataset publik.
  5. Tips bimbingan dosen, revisi naskah, dan persiapan menghadapi Sidang Seminar Proposal (Sempro) / Sidang Skripsi Sarjana.
- JIKA MAHASISWA BERTANYA DI LUAR TOPIK RISET/SKRIPSI/AKADEMIK:
  * Tolak secara sopan dan langsung arahkan kembali ke pembahasan skripsi.
  * Contoh: "Maaf ya, sebagai konsultan skripsi STARA, saya difokuskan untuk mendampingi riset dan tugas akhirmu. Ada bagian dari skripsi atau judulmu yang ingin kita diskusikan?"
- Jaga jawaban tetap ringkas, padat (2-4 paragraf fokus), dan berikan rekomendasi aksi konkrit.
`;

          const historyText = req.chatHistory
            .map((h) => `${h.role === "user" ? "Mahasiswa" : "Konsultan Skripsi AI"}: ${h.content}`)
            .join("\n");

          const fullPrompt = `${systemCtx}\n\nRiwayat Percakapan:\n${historyText}\n\nMahasiswa: ${req.userMessage}\nKonsultan Skripsi AI:`;

          const { text } = await generateWithFallback({
            contents: fullPrompt,
            config: {
              maxOutputTokens: 600,
            },
          });

          const reply = text || "Maaf, saat ini saya tidak dapat memproses pertanyaan seputar skripsi.";
          return { reply, isAiGenerated: true };
        },

        async reviewThesisTopic(req: AIThesisReviewRequest): Promise<AIThesisReviewOutput> {
          const prompt = `
Anda adalah reviewer dan dewan penguji proposal skripsi perguruan tinggi.
Tinjau draf judul / ide penelitian skripsi mahasiswa berikut:
- Draf Judul / Ide: "${req.titleOrDraft}"
- Program Studi: ${req.programName || "Teknik Informatika"}
${req.interests ? `- Bidang Minat: ${req.interests}` : ""}
${req.methods ? `- Metode yang Diminati: ${req.methods}` : ""}

Lakukan evaluasi kritis akademik:
1. Skor kesiapan judul (0 - 100): nilai ketajaman, kejelasan objek, metode, dan keterukuran.
2. Verdict: "sangat_baik" (score >= 80), "cukup_baik" (score 65-79), atau "perlu_penyempurnaan" (score < 65).
3. Strengths: 2 butir kelebihan judul/topik ini.
4. Weaknesses: 2 butir potensi titik lemah yang rawan dicecar dosen penguji (misal: terlalu umum, kurang novelty, variabel ambigu, dataset sulit).
5. ImprovedTitles: 2-3 variasi judul alternatif yang lebih tajam, spesifik, dan memenuhi kaidah penulisan ilmiah perguruan tinggi.
6. SuggestedMethods: 2 metode / algoritma yang cocok untuk judul ini.
7. DefenseQuestions: 2 pertanyaan kritis yang kemungkinan besar diajukan saat Sidang Sempro.

HANYA kembalikan valid JSON (tanpa markdown codeblock):
{
  "originalTitle": "${req.titleOrDraft.replace(/"/g, '\\"')}",
  "score": 80,
  "verdict": "sangat_baik",
  "strengths": ["Kelebihan 1", "Kelebihan 2"],
  "weaknesses": ["Kelemahan 1", "Kelemahan 2"],
  "improvedTitles": ["Variasi Judul 1", "Variasi Judul 2", "Variasi Judul 3"],
  "suggestedMethods": ["Metode 1", "Metode 2"],
  "defenseQuestions": ["Pertanyaan Sempro 1", "Pertanyaan Sempro 2"],
  "isAiGenerated": true
}
`;

          const { text } = await generateWithFallback({
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.7,
              maxOutputTokens: 800,
            },
          });

          const parsed = JSON.parse(text || "{}");
          return {
            originalTitle: req.titleOrDraft,
            score: typeof parsed.score === "number" ? parsed.score : 75,
            verdict: parsed.verdict || "cukup_baik",
            strengths: parsed.strengths || ["Topik memiliki relevansi dengan kebutuhan industri saat ini."],
            weaknesses: parsed.weaknesses || ["Perlu penegasan batasan masalah dan ruang lingkup dataset."],
            improvedTitles: parsed.improvedTitles || [`Analisis dan Implementasi ${req.titleOrDraft}`],
            suggestedMethods: parsed.suggestedMethods || ["Metode Komparatif Eksperimental"],
            defenseQuestions: parsed.defenseQuestions || ["Apa kebaruan (novelty) penelitian ini dibandingkan riset terdahulu?"],
            isAiGenerated: true,
          };
        },

        async generateCustomPlanForms(req: AICustomPlanFormRequest): Promise<AICustomPlanFormOutput> {
          const prompt = `
Anda adalah konsultan perancangan skenario studi mahasiswa STARA (Student Tracking and Academic Roadmap Assistant).
Mahasiswa menuliskan ide atau rencana kegiatannya secara bebas:
"${req.userPrompt}"

Konteks Akademik Mahasiswa:
- Program Studi: ${req.studentProfile?.programName || "Teknik Informatika"}
- Kampus: ${req.studentProfile?.institutionName || "Telkom University"}
- Semester Saat Ini: ${req.studentProfile?.currentSemester || 4}
- Minat: ${req.studentProfile?.interests || "Umum"}
${req.baselineSummary ? `- Status Roadmap: ${req.baselineSummary}` : ""}

TUGAS ANDA:
1. Identifikasi kategori kegiatan (misal: "Kegiatan Nonakademik", "Kompetisi & Prestasi Mahasiswa", "Karier & Magang", "Sertifikasi & Pelatihan", "Proyek & Riset Mandiri", dll.).
2. Buatkan 4-6 parameter formulir adaptif yang PALING RELEVAN dan spesifik untuk mengukur beban waktu, jadwal, dan dampak akademik dari rencana tersebut.
3. CONTOH ATURAN PENTING:
   - Jika pengguna berniat kegiatan nonakademik (seperti pengabdian masyarakat saat liburan):
     Sediakan field: Semester atau periode pelaksanaan, Durasi kegiatan, Estimasi beban waktu, Target kegiatan, Potensi bentrok dengan agenda akademik, dan Konversi SKS (dengan helperText: "Konversi SKS tidak perlu menjadi field utama, kecuali pengguna menyatakan ingin mengajukan pengakuan akademik.").
   - Jika pengguna berniat mengikuti lomba / kompetisi sambil kuliah:
     Sediakan field: Semester pelaksanaan, Durasi persiapan & kompetisi, Estimasi beban waktu per minggu, Target kegiatan, Potensi bentrok dengan agenda akademik, dan Rencana beban SKS kuliah berjalan.
4. Setiap field harus memiliki default value cerdas yang sudah terisi otomatis agar memudahkan mahasiswa.
5. Format tipe field yang diizinkan: "text", "select", "number", "textarea".

HANYA kembalikan valid JSON (tanpa markdown codeblock):
{
  "categoryBadge": "Kegiatan Nonakademik",
  "detectedGoal": "Pengabdian Masyarakat saat Liburan",
  "briefExplanation": "Parameter ini disiapkan untuk memetakan alokasi waktu dan memastikan kegiatan pengabdian tidak berbenturan dengan agenda perkuliahan.",
  "fields": [
    {
      "id": "semester_periode",
      "label": "Semester atau periode pelaksanaan",
      "type": "select",
      "defaultValue": "Liburan Semester Genap (antar Semester 4 dan 5)",
      "options": ["Liburan Semester Genap", "Liburan Semester Ganjil", "Semester 5 (Paralel Kuliah)", "Semester 6"],
      "helperText": "Pilih waktu luang agar tidak mengganggu perkuliahan aktif.",
      "required": true
    },
    {
      "id": "durasi",
      "label": "Durasi kegiatan",
      "type": "text",
      "defaultValue": "2 - 4 minggu",
      "helperText": "Lama pelaksanaan kegiatan di lapangan.",
      "required": true
    },
    {
      "id": "beban_waktu",
      "label": "Estimasi beban waktu",
      "type": "text",
      "defaultValue": "Penuh waktu saat libur (di luar perkuliahan aktif)",
      "helperText": "Alokasi jam per minggu yang dicurahkan.",
      "required": true
    },
    {
      "id": "target_kegiatan",
      "label": "Target kegiatan",
      "type": "text",
      "defaultValue": "Pemberdayaan masyarakat & perolehan sertifikat",
      "helperText": "Luaran atau output nyata yang diharapkan.",
      "required": true
    },
    {
      "id": "potensi_bentrok",
      "label": "Potensi bentrok dengan agenda akademik",
      "type": "text",
      "defaultValue": "Rendah — selesai sebelum masa pengisian KRS semester baru",
      "helperText": "Titik kritis seperti jadwal UTS/UAS atau pendaftaran semester.",
      "required": false
    },
    {
      "id": "konversi_sks",
      "label": "Konversi SKS / Pengakuan Akademik (Opsional)",
      "type": "select",
      "defaultValue": "Tidak (hanya poin SKPI / Portofolio)",
      "options": ["Tidak (hanya poin SKPI / Portofolio)", "Ya, diajukan untuk SKS Kuliah Pengabdian / MBKM", "Belum diputuskan"],
      "helperText": "Konversi SKS tidak perlu menjadi field utama, kecuali pengguna menyatakan ingin mengajukan pengakuan akademik.",
      "required": false
    }
  ]
}
`;

          const { text } = await generateWithFallback({
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.6,
              maxOutputTokens: 900,
            },
          });

          const parsed = JSON.parse(text || "{}");
          return {
            categoryBadge: parsed.categoryBadge || "Rencana Kustom",
            detectedGoal: parsed.detectedGoal || req.userPrompt.slice(0, 50),
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
Anda adalah evaluator skenario akademik STARA.
Evaluasi rencana studi kustom mahasiswa berdasarkan data formulir yang telah diisi:
- Pernyataan Awal: "${req.userPrompt}"
- Kategori Rencana: ${req.categoryBadge}
- Rencana Spesifik: ${req.detectedGoal}
- Formulir Parameter yang Diisi:
${formText}

Profil Mahasiswa:
- Program Studi: ${req.studentProfile?.programName || "Teknik Informatika"}
- Kampus: ${req.studentProfile?.institutionName || "Telkom University"}
- Semester Saat Ini: ${req.studentProfile?.currentSemester || 4}
- Minat: ${req.studentProfile?.interests || "Umum"}
${req.baselineSummary ? `- Baseline Roadmap: ${req.baselineSummary}` : ""}

Lakukan analisis mendalam:
1. overallVerdict: "aman" (beban realistis & aman), "perlu_perhatian" (beban padat/ada potensi bentrok), atau "berisiko_tinggi" (sangat rawan telat lulus/IPK anjlok).
2. verdictTitle: judul evaluasi yang memotivasi (misal: "Rencana Sangat Realistis & Bernilai Tambah Tinggi").
3. academicImpactSummary: ulasan 2-3 kalimat mengenai dampak terhadap perkuliahan, SKS, dan kelulusan.
4. estimatedHoursPerWeek: estimasi beban waktu per minggu (misal: "12-16 jam/minggu").
5. impactOnGraduation: pengaruh terhadap masa studi (misal: "Tetap tepat waktu lulus Semester 8").
6. keyRisks: 2-3 potensi risiko nyata (misal: kelelahan fisik, jadwal UTS/UAS terhimpit).
7. mitigationStrategies: 2-3 cara mitigasi praktis.
8. actionSteps: 3 tahapan aksi (Pra-Kegiatan, Pelaksanaan, Pasca-Kegiatan) masing-masing 2 langkah konkret.
9. suggestedAlternatives: 2 variasi alternatif yang lebih aman atau bernilai tambah tinggi jika ada kendala.
10. questionsForAcademicAdvisor: 2 pertanyaan spesifik untuk ditanyakan ke dosen wali.

HANYA kembalikan valid JSON (tanpa markdown codeblock):
{
  "overallVerdict": "aman",
  "verdictTitle": "Rencana Sangat Realistis & Bernilai Tambah Tinggi",
  "academicImpactSummary": "Kegiatan ini dapat diselesaikan tanpa mengganggu beban 18 SKS reguler asalkan jadwal persiapan diatur sebelum pekan ujian.",
  "estimatedHoursPerWeek": "12 - 16 jam/minggu",
  "impactOnGraduation": "Tidak menunda kelulusan, tetap berada di jalur 8 semester",
  "keyRisks": [
    "Beban waktu bertambah menjelang pekan ujian tengah semester.",
    "Potensi kelelahan jika tidak ada jeda istirahat yang cukup."
  ],
  "mitigationStrategies": [
    "Cicil persiapan 1 bulan sebelum kompetisi/kegiatan dimulai.",
    "Komunikasikan jadwal kegiatan dengan dosen pengampu jika bertepatan dengan kuis."
  ],
  "actionSteps": [
    { "phase": "Pra-Kegiatan", "steps": ["Susun jadwal mingguan rinci.", "Konfirmasi izin/proposal kegiatan jika diperlukan."] },
    { "phase": "Pelaksanaan", "steps": ["Fokus pada target harian tanpa meninggalkan tugas kuliah.", "Catat log aktivitas secara berkala."] },
    { "phase": "Pasca-Kegiatan", "steps": ["Dokumentasikan sertifikat dan laporan luaran.", "Ajukan poin SKPI / TAK ke fakultas."] }
  ],
  "suggestedAlternatives": [
    {
      "title": "Pelaksanaan Bertahap di Masa Libur",
      "description": "Geser fokus utama ke masa libur antar-semester agar semester aktif tetap 100% untuk akademik.",
      "benefit": "Nol risiko terhadap IPK dan kelulusan."
    },
    {
      "title": "Bentuk Tim Kolaborasi Multidisiplin",
      "description": "Bagi beban kerja dengan rekan lintas jurusan.",
      "benefit": "Beban kerja terbagi 50% lebih ringan."
    }
  ],
  "questionsForAcademicAdvisor": [
    "Apakah kegiatan ini bisa diajukan untuk ekuivalensi SKPI atau mata kuliah pilihan?",
    "Apakah ada surat rekomendasi prodi yang dapat membantu administrasi kegiatan?"
  ]
}
`;

          const { text } = await generateWithFallback({
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.7,
              maxOutputTokens: 1000,
            },
          });

          const parsed = JSON.parse(text || "{}");
          return {
            overallVerdict: parsed.overallVerdict || "aman",
            verdictTitle: parsed.verdictTitle || "Rencana Studi Telah Dianalisis",
            academicImpactSummary: parsed.academicImpactSummary || "Rencana ini dinilai realistis dengan penjadwalan yang tepat.",
            estimatedHoursPerWeek: parsed.estimatedHoursPerWeek || "10 - 15 jam/minggu",
            impactOnGraduation: parsed.impactOnGraduation || "Estimasi kelulusan tetap aman",
            keyRisks: Array.isArray(parsed.keyRisks) ? parsed.keyRisks : ["Perlu disiplin membagi waktu dengan mata kuliah wajib."],
            mitigationStrategies: Array.isArray(parsed.mitigationStrategies) ? parsed.mitigationStrategies : ["Tetapkan batas maksimal jam kerja mandiri per hari."],
            actionSteps: Array.isArray(parsed.actionSteps) ? parsed.actionSteps : generateFallbackCustomPlanSimulate(req).actionSteps,
            suggestedAlternatives: Array.isArray(parsed.suggestedAlternatives) ? parsed.suggestedAlternatives : generateFallbackCustomPlanSimulate(req).suggestedAlternatives,
            questionsForAcademicAdvisor: Array.isArray(parsed.questionsForAcademicAdvisor) ? parsed.questionsForAcademicAdvisor : ["Bagaimana prosedur pengakuan sertifikat ini di transkrip aktivitas mahasiswa?"],
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
        // Fall through to fallback
      }
    }

    // Deterministic fallback
    const { generateRuleBasedTradeoffs } = await import("@/server/rules-engine");

    // Build a dummy diff for fallback
    return {
      summary: `Simulasi skenario ${req.scenarioType} telah dihitung. ${req.baselineSummary}`,
      benefits: [],
      tradeoffs: [],
      risks: req.conflicts.map((c) => c),
      assumptions: [
        "Perhitungan menggunakan data yang dimasukkan mahasiswa.",
        "Aturan kampus mungkin berbeda dari estimasi ini.",
      ],
      unknowns: req.unknowns,
      recommendedNextSteps: [
        "Diskusikan dengan dosen wali atau pengelola akademik.",
        "Konfirmasi kebijakan konversi SKS jika relevan.",
      ],
      questionsForCampus: req.unknowns.map((u) => `Tentang: ${u}`),
      isAiGenerated: false,
      fallbackReason: "AI provider tidak dikonfigurasi. Menggunakan penjelasan berbasis aturan.",
    };
  },

  async generateThesisDirections(req: AIThesisRequest): Promise<AIThesisOutput> {
    const real = getProvider();
    if (real) {
      try {
        return await real.generateThesisDirections(req);
      } catch {
        // Fall through to fallback
      }
    }

    // Deterministic fallback
    return generateFallbackThesisDirections(req);
  },

  async chatAboutSimulation(req: AIChatRequest): Promise<AIChatOutput> {
    const real = getProvider();
    if (real) {
      try {
        return await real.chatAboutSimulation(req);
      } catch (err) {
        console.error("[chatAboutSimulation error]", err);
        // Fall through to fallback
      }
    }

    // Deterministic fallback — jawaban berbasis konteks tanpa AI
    const lowerMsg = req.userMessage.toLowerCase();
    let reply = "Maaf, AI asisten saat ini tidak tersedia. ";
    if (lowerMsg.includes("risiko") || lowerMsg.includes("bahaya")) {
      reply += `Risiko utama dari skenario ini: ${req.explanation.risks.slice(0, 2).join("; ") || "belum ada risiko signifikan yang terdeteksi"}.`;
    } else if (lowerMsg.includes("manfaat") || lowerMsg.includes("keuntungan")) {
      reply += `Manfaat skenario ini: ${req.explanation.benefits.slice(0, 2).join("; ") || "lihat ringkasan di atas"}.`;
    } else if (lowerMsg.includes("langkah") || lowerMsg.includes("selanjutnya")) {
      reply += `Langkah selanjutnya yang disarankan: ${req.explanation.recommendedNextSteps.slice(0, 2).join("; ") || "konsultasikan dengan dosen wali"}.`;
    } else {
      reply += `Silakan baca ringkasan simulasi di atas. Untuk analisis lebih mendalam, konfigurasikan API key AI di pengaturan.`;
    }
    return { reply, isAiGenerated: false, fallbackReason: "AI provider tidak dikonfigurasi." };
  },

  async suggestAlternativeScenarios(req: AIAlternativesRequest): Promise<AIAlternativesOutput> {
    const real = getProvider();
    if (real) {
      try {
        return await real.suggestAlternativeScenarios(req);
      } catch {
        // Fall through to fallback
      }
    }

    // Deterministic rule-based fallback
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
  const directions: AIThesisDirection[] = [];

  if (req.interests.length > 0) {
    directions.push({
      topicArea: `${req.interests[0]} dan Dampaknya`,
      exampleQuestion: `Bagaimana ${req.interests[0]} memengaruhi ${req.programName}?`,
      whyItFits: `Minat kamu di bidang ${req.interests[0]} sangat relevan dengan tren penelitian terkini.`,
      possibleMethod: req.methods[0] ?? "Studi kasus kualitatif",
      dataRequired: req.dataAvailability,
      feasibility: "sedang",
      mainRisks: ["Akses data mungkin terbatas.", "Memerlukan validasi dari pakar bidang."],
      firstSteps: [
        "Lakukan studi literatur 10–15 jurnal terkini.",
        "Tentukan fokus penelitian yang spesifik.",
        "Konsultasi awal dengan calon pembimbing.",
      ],
      questionsForSupervisor: [
        "Apakah topik ini masih relevan untuk diangkat saat ini?",
        "Sumber data apa yang direkomendasikan?",
        "Metode penelitian apa yang paling sesuai?",
      ],
    });
  }

  if (req.interests.length > 1) {
    directions.push({
      topicArea: `Analisis ${req.interests[1]}`,
      exampleQuestion: `Faktor apa yang memengaruhi ${req.interests[1]} dalam konteks ${req.programName}?`,
      whyItFits: `Topik ${req.interests[1]} memiliki relevansi praktis yang tinggi dan dukungan literatur yang cukup.`,
      possibleMethod: req.methods[1] ?? "Survei dan analisis statistik",
      dataRequired: "Data primer melalui kuesioner atau wawancara.",
      feasibility: "tinggi",
      mainRisks: ["Jumlah responden mungkin terbatas.", "Bias responden perlu diantisipasi."],
      firstSteps: [
        "Desain instrumen penelitian (kuesioner/panduan wawancara).",
        "Identifikasi populasi dan sampel target.",
        "Ajukan izin penelitian jika diperlukan.",
      ],
      questionsForSupervisor: [
        "Berapa jumlah sampel yang diperlukan untuk validitas penelitian?",
        "Apakah ada kolaborator atau data yang bisa diakses melalui jaringan dosen?",
      ],
    });
  }

  if (directions.length < 2) {
    directions.push({
      topicArea: "Kajian Literatur dan Sintesis",
      exampleQuestion: `Bagaimana perkembangan penelitian terbaru di bidang ${req.programName}?`,
      whyItFits:
        "Penelitian berbasis literatur memiliki kelayakan tinggi dan bisa diselesaikan dalam waktu yang tersedia.",
      possibleMethod: "Systematic literature review",
      dataRequired: "Jurnal ilmiah, prosiding, dan laporan penelitian.",
      feasibility: "tinggi",
      mainRisks: ["Memerlukan kemampuan analisis kritis yang kuat."],
      firstSteps: [
        "Tentukan kata kunci pencarian dan database yang akan digunakan.",
        "Tetapkan kriteria inklusi dan eksklusi.",
        "Buat peta literatur awal.",
      ],
      questionsForSupervisor: [
        "Database jurnal apa yang direkomendasikan untuk bidang ini?",
        "Rentang tahun publikasi apa yang relevan?",
      ],
    });
  }

  return {
    directions,
    isAiGenerated: false,
    fallbackReason: "AI provider tidak dikonfigurasi. Arahan berbasis template dan data input mahasiswa.",
  };
}

function generateFallbackAlternatives(req: AIAlternativesRequest): AIAlternativesOutput {
  const alternatives: AIAlternative[] = [];
  const scenarioAlts: Record<string, AIAlternative[]> = {
    magang: [
      {
        title: "Magang Paruh Waktu (Part-time)",
        description: "Lakukan magang dengan jam lebih fleksibel agar tidak mengorbankan SKS reguler.",
        tradeoff: "Pengalaman magang mungkin kurang intensif dibanding full-time.",
        suitableFor: "Mahasiswa yang masih punya kuliah penting di semester tersebut.",
        suggestedAction: "Cari program magang part-time di perusahaan yang memberi sertifikat dan konversi SKS.",
      },
      {
        title: "Magang di Semester Akhir",
        description: "Tunda magang ke semester 7-8 saat beban SKS lebih ringan.",
        tradeoff: "Waktu lebih mepet ke kelulusan, tapi risiko gangguan studi lebih kecil.",
        suitableFor: "Mahasiswa yang ingin menyelesaikan semua mata kuliah wajib terlebih dahulu.",
        suggestedAction: "Rencanakan semester akhir dengan hanya menyisakan skripsi + magang.",
      },
    ],
    mbkm: [
      {
        title: "MBKM Proyek Internal",
        description: "Ikuti program MBKM proyek di dalam kampus (riset, wirausaha) yang risikonya lebih rendah.",
        tradeoff: "Pengalaman di luar kampus lebih sedikit dibanding pertukaran.",
        suitableFor: "Mahasiswa yang ingin poin MBKM tapi tidak ingin terlalu jauh dari kampus.",
        suggestedAction: "Daftar ke program riset atau wirausaha mahasiswa yang terdaftar di MBKM.",
      },
    ],
    custom: [
      {
        title: "Jalur Lulus Tepat Waktu",
        description: "Pertahankan beban 18–20 SKS per semester dan fokus menuntaskan mata kuliah wajib sebelum skripsi.",
        tradeoff: "Waktu untuk kegiatan di luar kuliah (magang, organisasi) lebih terbatas.",
        suitableFor: "Mahasiswa yang menargetkan kelulusan 8 semester dengan risiko rendah.",
        suggestedAction: "Cek sisa SKS di Roadmap Saya dan susun KRS semester depan bersama dosen wali.",
      },
      {
        title: "Jalur Magang + Skripsi Paralel",
        description: "Ambil magang/MBKM di semester 6–7 lalu gunakan data magang sebagai bahan skripsi.",
        tradeoff: "Perlu koordinasi konversi SKS dan jadwal bimbingan yang ketat.",
        suitableFor: "Mahasiswa yang ingin pengalaman industri tanpa menunda kelulusan.",
        suggestedAction: "Jalankan simulasi Magang atau MBKM untuk melihat dampaknya pada kelulusan.",
      },
    ],
    cuti: [
      {
        title: "Pengurangan Beban SKS",
        description: "Alih-alih cuti penuh, kurangi jumlah SKS per semester untuk istirahat bertahap.",
        tradeoff: "Kelulusan sedikit lebih lama dibanding jadwal normal, tapi tidak perlu cuti formal.",
        suitableFor: "Mahasiswa yang butuh waktu recovery tapi tidak ingin kehilangan status aktif.",
        suggestedAction: "Ajukan permohonan pengurangan SKS ke wali akademik.",
      },
    ],
    exchange: [
      {
        title: "Student Exchange Virtual",
        description: "Ikuti program pertukaran online/hybrid agar tidak perlu meninggalkan kampus.",
        tradeoff: "Pengalaman internasional kurang maksimal, tapi tanpa biaya hidup di luar negeri.",
        suitableFor: "Mahasiswa dengan keterbatasan biaya atau kewajiban di kota asal.",
        suggestedAction: "Cari program student exchange virtual dari kampus mitra di portal MBKM.",
      },
    ],
    advanced_course: [
      {
        title: "Ambil 1 Mata Kuliah Lanjutan Dulu",
        description: "Mulai dengan 1 mata kuliah tingkat atas untuk uji kemampuan sebelum mengambil lebih banyak.",
        tradeoff: "Progress lebih lambat, tapi lebih aman secara akademik.",
        suitableFor: "Mahasiswa yang belum yakin dengan kesiapan mengambil banyak mata kuliah lanjutan sekaligus.",
        suggestedAction: "Konsultasikan ke dosen PA pilihan mata kuliah lanjutan yang paling feasible.",
      },
    ],
  };

  const typeAlts = scenarioAlts[req.scenarioType] ?? [];
  alternatives.push(...typeAlts);

  if (alternatives.length === 0) {
    alternatives.push({
      title: "Konsultasi Dosen Wali",
      description: "Diskusikan opsi skenario alternatif langsung dengan dosen wali untuk panduan personal.",
      tradeoff: "Memerlukan waktu untuk membuat janji dan berdiskusi.",
      suitableFor: "Semua mahasiswa yang ingin mengambil keputusan akademik yang aman.",
      suggestedAction: "Hubungi dosen wali dan bawa hasil simulasi ini sebagai bahan diskusi.",
    });
  }

  return {
    alternatives,
    isAiGenerated: false,
    fallbackReason: "AI provider tidak dikonfigurasi. Alternatif berbasis aturan.",
  };
}

function generateFallbackThesisChat(req: AIThesisChatRequest): AIThesisChatOutput {
  const lower = req.userMessage.toLowerCase();
  let reply = "Halo! Sebagai panduan skripsi STARA: ";
  if (lower.includes("judul") || lower.includes("topik")) {
    reply += "Untuk menentukan judul skripsi yang kuat, carilah irisan antara: 1) Masalah nyata di industri/masyarakat, 2) Minat & penguasaan metodologimu, dan 3) Ketersediaan data/akses riset. Pastikan judul memuat metode + objek/kasus + tujuan terukur.";
  } else if (lower.includes("bab 1") || lower.includes("latar belakang")) {
    reply += "Piramida terbalik adalah kunci BAB 1: Mulai dari fenomena umum, urgensi masalah spesifik, data/fakta pendukung, gap riset terdahulu, lalu tawarkan solusi/metode yang kamu ajukan beserta manfaatnya.";
  } else if (lower.includes("dosen") || lower.includes("pembimbing")) {
    reply += "Tips bimbingan: Selalu bawa resume/catatan kemajuan (progres mingguan), siapkan 2-3 opsi solusi saat berkonsultasi bukan hanya keluhan, dan catat setiap masukan dosen ke log bimbingan.";
  } else if (lower.includes("sidang") || lower.includes("sempro")) {
    reply += "Kunci sidang sempro: Kuasai BAB 1-3 luar kepala, terutama alasan pemilihan metode (why this method?) dan cara validasi data/pengujian. Jangan defensif, tunjukkan keterbukaan terhadap masukan penguji.";
  } else {
    reply += "Silakan tanyakan hal spesifik seputar perumusan judul, latar belakang masalah, metodologi penelitian, atau persiapan sidang sempro/skripsi agar saya bisa memberi arahan yang lebih tajam.";
  }
  return { reply, isAiGenerated: false, fallbackReason: "AI provider tidak dikonfigurasi." };
}

function generateFallbackThesisReview(req: AIThesisReviewRequest): AIThesisReviewOutput {
  const title = (req.titleOrDraft || "").trim();
  const wordCount = title.split(/\s+/).filter(Boolean).length;
  const hasMethod = /menggunakan|berbasis|dengan|algoritma|metode|analisis|penerapan|komparasi|optimasi|klasifikasi/i.test(title);
  const score = Math.min(90, Math.max(60, (hasMethod ? 75 : 62) + (wordCount >= 6 && wordCount <= 16 ? 10 : 0)));
  const verdict = score >= 80 ? "sangat_baik" : score >= 68 ? "cukup_baik" : "perlu_penyempurnaan";

  return {
    originalTitle: title,
    score,
    verdict,
    strengths: [
      `Topik memiliki kaitan relevan dengan rumpun keilmuan ${req.programName || "Teknik Informatika"}.`,
      hasMethod ? "Sudah menyertakan indikasi metode atau pendekatan teknis." : "Fokus objek penelitian sudah mulai terdefinisi.",
    ],
    weaknesses: [
      !hasMethod ? "Belum secara eksplisit menyebutkan metode atau algoritma spesifik yang digunakan." : "Perlu mempertegas batasan ruang lingkup studi kasus.",
      "Perlu memastikan ketersediaan dataset dan parameter evaluasi terukur.",
    ],
    improvedTitles: [
      `Penerapan dan Evaluasi Performa ${title} untuk Peningkatan Efisiensi Sistem`,
      `Analisis Komparatif Metode Berbasis ${title} pada Kasus Terapan`,
      `Rancang Bangun Prototipe Berkelanjutan Berbasis ${title}`,
    ],
    suggestedMethods: ["Metode Eksperimental Berbasis Metrik Akurasi", "Pengembangan Sistem Agile / Prototyping"],
    defenseQuestions: [
      "Mengapa Anda memilih pendekatan ini dibandingkan alternatif metode konvensional?",
      "Bagaimana Anda membuktikan bahwa hasil pengujian ini valid dan bebas dari bias data?",
    ],
    isAiGenerated: false,
    fallbackReason: "AI provider tidak dikonfigurasi. Evaluasi berbasis aturan.",
  };
}

function generateFallbackCustomPlanForms(req: AICustomPlanFormRequest): AICustomPlanFormOutput {
  const p = (req.userPrompt || "").toLowerCase();

  if (/pengabdian|kkn|desa|sosial|libur|relawan/i.test(p)) {
    return {
      categoryBadge: "Kegiatan Nonakademik",
      detectedGoal: "Pengabdian Masyarakat / Aksi Sosial Liburan",
      briefExplanation: "AI menyiapkan formulir parameter berikut untuk memetakan beban dan memastikan tidak berbenturan dengan agenda akademik.",
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
      fallbackReason: "Formulir adaptif berbasis aturan deterministik.",
    };
  }

  if (/lomba|kompetisi|hackathon|data analyst|gemastik|prestasi/i.test(p)) {
    return {
      categoryBadge: "Kompetisi & Prestasi Mahasiswa",
      detectedGoal: "Kompetisi Mahasiswa Tingkat Nasional",
      briefExplanation: "AI menyiapkan formulir parameter khusus untuk menyeimbangkan persiapan lomba dengan beban kuliah reguler.",
      fields: [
        {
          id: "semester_periode",
          label: "Semester atau periode pelaksanaan",
          type: "select",
          defaultValue: "Semester Depan (Semester 5)",
          options: ["Semester Depan (Semester 5)", "Semester 6", "Liburan Semester"],
          helperText: "Kapan kompetisi dan babak penyisihan berlangsung.",
          required: true,
        },
        {
          id: "durasi",
          label: "Durasi persiapan & kompetisi",
          type: "text",
          defaultValue: "6 - 8 minggu intensif",
          helperText: "Waktu yang dibutuhkan untuk latihan dan pengerjaan karya.",
          required: true,
        },
        {
          id: "beban_waktu",
          label: "Estimasi beban waktu per minggu",
          type: "text",
          defaultValue: "10-15 jam/minggu di luar jam kuliah",
          helperText: "Waktu luang yang dialokasikan di malam hari atau akhir pekan.",
          required: true,
        },
        {
          id: "target_kegiatan",
          label: "Target capaian kegiatan",
          type: "text",
          defaultValue: "Lolos babak final / Juara Nasional & portofolio data analyst",
          helperText: "Target objektif yang ingin dicapai tim/individu.",
          required: true,
        },
        {
          id: "potensi_bentrok",
          label: "Potensi bentrok dengan agenda akademik",
          type: "text",
          defaultValue: "Potensi bentrok saat pekan UTS atau tugas besar kuliah",
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
      fallbackReason: "Formulir adaptif berbasis aturan deterministik.",
    };
  }

  // Generic fallback
  return {
    categoryBadge: "Rencana Kustom dengan AI",
    detectedGoal: req.userPrompt.slice(0, 45),
    briefExplanation: "AI menyiapkan formulir parameter untuk menganalisis beban dan dampak rencana terhadap roadmap studimu.",
    fields: [
      {
        id: "semester_periode",
        label: "Semester atau periode pelaksanaan",
        type: "select",
        defaultValue: `Semester ${req.studentProfile?.currentSemester ? req.studentProfile.currentSemester + 1 : 5}`,
        options: ["Semester Depan", "Liburan Semester", "Tahun Akademik Depan"],
        helperText: "Waktu pelaksanaan kegiatan yang direncanakan.",
        required: true,
      },
      {
        id: "durasi",
        label: "Durasi kegiatan",
        type: "text",
        defaultValue: "1 semester (3-6 bulan)",
        helperText: "Lama periode waktu kegiatan berlangsung.",
        required: true,
      },
      {
        id: "beban_waktu",
        label: "Estimasi alokasi waktu per minggu",
        type: "text",
        defaultValue: "10-15 jam/minggu",
        helperText: "Rata-rata waktu yang dialokasikan setiap minggu.",
        required: true,
      },
      {
        id: "target_kegiatan",
        label: "Target luaran utama kegiatan",
        type: "text",
        defaultValue: "Peningkatan kompetensi dan perolehan sertifikat/karya",
        helperText: "Output konkret dari kegiatan ini.",
        required: true,
      },
      {
        id: "potensi_bentrok",
        label: "Potensi bentrok dengan perkuliahan",
        type: "text",
        defaultValue: "Rendah — jika diatur secara disiplin di luar jam kuliah",
        helperText: "Titik temu dengan agenda perkuliahan reguler.",
        required: false,
      },
      {
        id: "konversi_sks",
        label: "Pengakuan / Konversi Akademik (Opsional)",
        type: "select",
        defaultValue: "Tidak perlu konversi SKS (Pengembangan Mandiri)",
        options: ["Tidak perlu konversi SKS (Pengembangan Mandiri)", "Ingin diajukan untuk SKS Pilihan / MBKM", "Sebagai Poin Portofolio / SKPI"],
        helperText: "Konversi SKS tidak perlu menjadi field utama, kecuali pengguna menyatakan ingin mengajukan pengakuan akademik.",
        required: false,
      },
    ],
    isAiGenerated: false,
    fallbackReason: "Formulir adaptif berbasis aturan deterministik.",
  };
}

function generateFallbackCustomPlanSimulate(req: AICustomPlanSimulateRequest): AICustomPlanSimulateOutput {
  const isHoliday = Object.values(req.formData).some((v) => /libur/i.test(v));

  return {
    overallVerdict: "aman",
    verdictTitle: isHoliday ? "Rencana Sangat Aman & Efektif (Memanfaatkan Masa Libur)" : "Rencana Realistis dengan Penjadwalan Terstruktur",
    academicImpactSummary: `Rencana "${req.detectedGoal}" sangat layak dijalankan. ${
      isHoliday
        ? "Karena dilaksanakan pada periode libur antar-semester, kegiatan ini tidak membebani SKS kuliah berjalan dan tidak berisiko menunda kelulusan."
        : "Dengan komitmen waktu yang terukur di luar jam kuliah, mahasiswa tetap dapat mempertahankan IPK dan menyelesaikan beban SKS reguler."
    }`,
    estimatedHoursPerWeek: req.formData.beban_waktu || "10 - 15 jam/minggu",
    impactOnGraduation: "Tidak menunda kelulusan, estimasi tetap tepat waktu di Semester 8",
    keyRisks: [
      "Potensi penurunan energi saat memasuki awal perkuliahan jika liburan dipakai intensif.",
      "Perlu memastikan dokumen izin atau sertifikat penyelenggara terverifikasi resmi.",
    ],
    mitigationStrategies: [
      "Sisakan jeda minimal 3-5 hari sebelum hari pertama perkuliahan baru dimulai.",
      "Simpan rekam jejak kegiatan secara digital untuk pengajuan portofolio atau SKPI.",
    ],
    actionSteps: [
      {
        phase: "Pra-Kegiatan",
        steps: [
          "Lakukan pendaftaran atau koordinasi izin dengan panitia/pihak terkait.",
          "Pastikan seluruh urusan KRS semester baru telah tuntas sebelum kegiatan dimulai.",
        ],
      },
      {
        phase: "Pelaksanaan",
        steps: [
          "Fokus pada capaian objektif kegiatan sesuai target yang sudah dirumuskan.",
          "Dokumentasikan foto, karya, dan logbook kegiatan secara rutin.",
        ],
      },
      {
        phase: "Pasca-Kegiatan",
        steps: [
          "Minta surat keterangan selesai atau sertifikat dari penanggung jawab program.",
          "Laporkan pencapaian ke bagian kemahasiswaan atau dosen wali untuk pencatatan poin SKPI.",
        ],
      },
    ],
    suggestedAlternatives: [
      {
        title: "Optimasi Portofolio Mandiri",
        description: "Gunakan hasil luaran kegiatan sebagai bahan portofolio showcase di LinkedIn/GitHub.",
        benefit: "Meningkatkan daya saing karier tanpa menambah beban kuliah.",
      },
      {
        title: "Kolaborasi Bersama Tim Kampus",
        description: "Ajak rekan satu program studi untuk berbagi tugas.",
        benefit: "Meringankan alokasi waktu hingga 40%.",
      },
    ],
    questionsForAcademicAdvisor: [
      "Apakah sertifikat kegiatan ini dapat dimasukkan ke dalam Surat Keterangan Pendamping Ijazah (SKPI)?",
      "Apakah ada rekomendasi prodi yang relevan untuk mendukung kegiatan ini?",
    ],
    isAiGenerated: false,
    fallbackReason: "Simulasi evaluasi berbasis aturan deterministik.",
  };
}

