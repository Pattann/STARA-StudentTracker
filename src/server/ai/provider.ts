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

export interface AIProvider {
  explainSimulation(req: AIExplanationRequest): Promise<AIExplanationOutput>;
  generateThesisDirections(req: AIThesisRequest): Promise<AIThesisOutput>;
}

function getProvider(): AIProvider | null {
  const provider = process.env.AI_PROVIDER;
  if (!provider) return null;

  if (provider === "google" && process.env.GOOGLE_AI_API_KEY) {
    try {
      // Dynamic import Google GenAI
      const { GoogleGenAI } = require("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

      return {
        async explainSimulation(req: AIExplanationRequest): Promise<AIExplanationOutput> {
          const prompt = `
Anda adalah asisten akademik cerdas STARA (Student Tracker & Academic Roadmap Assistant).
Tugas Anda adalah menganalisis simulasi skenario "what-if" dari rencana studi mahasiswa berikut:
- Target Kelulusan: ${req.goalLabel}
- Tipe Skenario: ${req.scenarioType}
- Parameter Tambahan: ${JSON.stringify(req.parameters)}
- Ringkasan Baseline (Sebelum): ${req.baselineSummary}
- Ringkasan Skenario (Sesudah): ${req.scenarioSummary}
- Konflik/Peringatan yang Terdeteksi: ${JSON.stringify(req.conflicts)}
- Hal Belum Diketahui: ${JSON.stringify(req.unknowns)}

Berikan analisis terstruktur dalam bahasa Indonesia profesional yang ramah mahasiswa.
HANYA kembalikan valid JSON (tanpa markdown backtick \`\`\`json) dengan format berikut:
{
  "summary": "Ringkasan dampak skenario ini terhadap kelulusan dan beban studi (2-3 kalimat)",
  "benefits": ["keuntungan 1", "keuntungan 2"],
  "tradeoffs": ["konsekuensi/tradeoff 1", "konsekuensi 2"],
  "risks": ["risiko 1", "risiko 2"],
  "assumptions": ["asumsi perhitungan yang digunakan"],
  "unknowns": ["hal yang masih perlu diverifikasi ke pihak kampus"],
  "recommendedNextSteps": ["langkah konkrit 1 yang harus diambil mahasiswa", "langkah 2"],
  "questionsForCampus": ["pertanyaan tepat untuk ditanyakan ke dosen wali / prodi"],
  "isAiGenerated": true
}
`;

          const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            },
          });

          const text = response.text?.trim() || "{}";
          const parsed = JSON.parse(text);
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

          const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            },
          });

          const text = response.text?.trim() || "{}";
          const parsed = JSON.parse(text);
          return {
            directions: parsed.directions || [],
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
      } catch {
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
