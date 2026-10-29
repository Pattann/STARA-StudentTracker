/**
 * Official A4 PDF Report Generator for STARA Academic & Roadmap Summary
 * Produces a multi-page, structured PDF 1.4 document with zero external dependencies.
 */

import { CURRICULUM_CATALOG } from "@/features/curriculum/catalog";

export interface PdfExportInput {
  studentName: string;
  studentEmail: string;
  institutionName: string;
  facultyName: string;
  programName: string;
  educationLevel: string;
  entryYear: number;
  currentSemester: number;
  completedCredits: number;
  totalCurriculumCredits: number;
  remainingCredits: number;
  gpa: number | null;
  estimatedGraduationSemester: number | null;
  goals: string;
  takEnabled: boolean;
  takTarget: number;
  studyMode?: string;
  weeklyHours?: number;
  interests?: string;
  semesterPlans: Array<{
    semesterNum: number;
    semesterLabel?: string | null;
    isCurrentSemester: boolean;
    targetCredits: number;
    tasks: Array<{
      title: string;
      courseCode?: string | null;
      credits: number;
      category: string;
      status: string;
    }>;
  }>;
  achievements?: Array<{
    title: string;
    category: string;
    role?: string | null;
    startDate?: string | null;
  }>;
  reminders?: Array<{
    title: string;
    category: string;
    deadline?: string | null;
  }>;
}

function pdfEscape(text: string): string {
  const clean = text
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2022/g, "-")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
  return clean
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function measurePdfTextWidth(text: string, fontSize: number, bold = false): number {
  let units = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if ("ilI.,:;!|-'()[] ".includes(ch)) {
      units += 0.28;
    } else if ("mwMW@%&QOGD".includes(ch)) {
      units += 0.76;
    } else if (ch >= "A" && ch <= "Z") {
      units += 0.64;
    } else {
      units += 0.51;
    }
  }
  return units * fontSize * (bold ? 1.04 : 1.0);
}

function fitPdfText(
  text: string,
  maxWidthPt: number,
  fontSize: number,
  bold = false
): string {
  const normalized = (text || "-").trim() || "-";
  if (measurePdfTextWidth(normalized, fontSize, bold) <= maxWidthPt) {
    return normalized;
  }
  let sliced = normalized;
  while (
    sliced.length > 1 &&
    measurePdfTextWidth(sliced + "...", fontSize, bold) > maxWidthPt
  ) {
    sliced = sliced.slice(0, -1);
  }
  return sliced + "...";
}

function formatGoalLabel(goal: string): string {
  if (goal === "fast") return "Lulus Cepat (3.5 Tahun / 7 Sem)";
  if (goal === "active") return "Aktif Organisasi & Magang";
  if (goal === "relaxed") return "Ritme Fleksibel / Santai";
  return "Seimbang Akademik & Karier (4 Thn)";
}

function formatStudyModeLabel(mode?: string): string {
  if (mode === "career_internship") return "Keseimbangan Kuliah & Karier";
  if (mode === "pre_thesis_prep") return "Eksplorasi & Persiapan Pra-Skripsi";
  return "Fokus Akademik & Optimasi IPK";
}

function formatStatusLabel(status: string): string {
  if (status === "done") return "Selesai";
  if (status === "in_progress") return "Berjalan";
  return "Direncanakan";
}

function formatCategoryLabel(cat: string): string {
  const c = (cat || "akademik").toLowerCase();
  if (c === "skripsi") return "Skripsi";
  if (c === "karier") return "Karier/KP";
  if (c === "tak") return "TAK/SKKM";
  if (c === "pribadi") return "Mandiri";
  return "Akademik";
}

function buildFallbackSemesters(
  currentSemester: number
): PdfExportInput["semesterPlans"] {
  const catalog = CURRICULUM_CATALOG["Teknik Informatika"] || [];
  const filtered = catalog.filter((c) => c.code !== "IF4101");
  return [1, 2, 3, 4, 5, 6, 7, 8].map((semNum) => {
    const semCourses = filtered.filter((c) => c.semesterNum === semNum);
    return {
      semesterNum: semNum,
      isCurrentSemester: semNum === currentSemester,
      targetCredits: semNum === 8 ? 8 : 20,
      tasks: semCourses.map((c) => ({
        title: c.name,
        courseCode: c.code,
        credits: c.credits,
        category: c.category,
        status:
          semNum < currentSemester
            ? "done"
            : semNum === currentSemester
            ? "in_progress"
            : "planned",
      })),
    };
  });
}

export function generateAcademicSummaryPdf(input: PdfExportInput): Blob {
  const PAGE_W = 595.28; // A4 width in pt
  const PAGE_H = 841.89; // A4 height in pt
  const MARGIN_X = 34;
  const CONTENT_W = PAGE_W - MARGIN_X * 2; // 527.28 pt

  const pages: string[][] = [];
  let currentCommands: string[] = [];
  let cursorY = PAGE_H - 32;

  const startNewPage = () => {
    if (currentCommands.length > 0) {
      pages.push(currentCommands);
    }
    currentCommands = [];
    cursorY = PAGE_H - 34;
  };

  const ensureSpace = (neededHeight: number) => {
    if (cursorY - neededHeight < 42) {
      startNewPage();
    }
  };

  const drawRect = (
    x: number,
    yTop: number,
    w: number,
    h: number,
    fillRgb?: [number, number, number],
    strokeRgb?: [number, number, number],
    lineWidth = 0.6
  ) => {
    const yBottom = yTop - h;
    currentCommands.push("q");
    if (fillRgb) {
      currentCommands.push(
        `${fillRgb[0].toFixed(3)} ${fillRgb[1].toFixed(3)} ${fillRgb[2].toFixed(3)} rg`
      );
    }
    if (strokeRgb) {
      currentCommands.push(
        `${strokeRgb[0].toFixed(3)} ${strokeRgb[1].toFixed(3)} ${strokeRgb[2].toFixed(3)} RG`
      );
      currentCommands.push(`${lineWidth} w`);
    }
    const op = fillRgb && strokeRgb ? "B" : fillRgb ? "f" : "S";
    currentCommands.push(
      `${x.toFixed(2)} ${yBottom.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${op}`
    );
    currentCommands.push("Q");
  };

  const drawLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    strokeRgb: [number, number, number] = [0.85, 0.85, 0.88],
    lineWidth = 0.6
  ) => {
    currentCommands.push("q");
    currentCommands.push(
      `${strokeRgb[0].toFixed(3)} ${strokeRgb[1].toFixed(3)} ${strokeRgb[2].toFixed(3)} RG`
    );
    currentCommands.push(`${lineWidth} w`);
    currentCommands.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
    currentCommands.push("Q");
  };

  const drawText = (
    text: string,
    x: number,
    y: number,
    size = 9,
    bold = false,
    rgb: [number, number, number] = [0.09, 0.09, 0.11]
  ) => {
    const font = bold ? "/F2" : "/F1";
    currentCommands.push("BT");
    currentCommands.push(
      `${rgb[0].toFixed(3)} ${rgb[1].toFixed(3)} ${rgb[2].toFixed(3)} rg`
    );
    currentCommands.push(`${font} ${size} Tf`);
    currentCommands.push(`${x.toFixed(2)} ${y.toFixed(2)} Td`);
    currentCommands.push(`(${pdfEscape(text)}) Tj`);
    currentCommands.push("ET");
  };

  const drawTextRight = (
    text: string,
    rightX: number,
    y: number,
    size = 9,
    bold = false,
    rgb: [number, number, number] = [0.09, 0.09, 0.11]
  ) => {
    const w = measurePdfTextWidth(text, size, bold);
    drawText(text, rightX - w, y, size, bold, rgb);
  };

  const drawTextCenter = (
    text: string,
    centerX: number,
    y: number,
    size = 9,
    bold = false,
    rgb: [number, number, number] = [0.09, 0.09, 0.11]
  ) => {
    const w = measurePdfTextWidth(text, size, bold);
    drawText(text, centerX - w / 2, y, size, bold, rgb);
  };

  // ─── KOP DOKUMEN RESMI STARA (CLEAN, NO OVERLAP) ───────────────────────────
  const headerH = 52;
  drawRect(MARGIN_X, cursorY, CONTENT_W, headerH, [0.1, 0.1, 0.12]);
  drawRect(MARGIN_X, cursorY, CONTENT_W, 3.5, [0.96, 0.8, 0.28]); // Gold top accent bar

  drawText(
    "STARA  |  RINGKASAN AKADEMIK & ROADMAP STUDI",
    MARGIN_X + 14,
    cursorY - 22,
    11,
    true,
    [1, 1, 1]
  );

  const printedDate = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  drawText(
    `Student Tracking and Academic Roadmap Assistant   |   Dicetak: ${printedDate}`,
    MARGIN_X + 14,
    cursorY - 38,
    8,
    false,
    [0.82, 0.82, 0.86]
  );

  // Right badge vertically centered in header, well clear of the title
  const badgeW = 106;
  const badgeH = 20;
  const badgeX = MARGIN_X + CONTENT_W - badgeW - 14;
  const badgeYTop = cursorY - (headerH - badgeH) / 2;
  drawRect(badgeX, badgeYTop, badgeW, badgeH, [0.96, 0.8, 0.28]);
  drawTextCenter(
    "DOKUMEN AKADEMIK",
    badgeX + badgeW / 2,
    badgeYTop - 13,
    7.5,
    true,
    [0.09, 0.09, 0.11]
  );

  cursorY -= headerH + 14;

  // ─── BAGIAN 1: IDENTITAS & PROFIL AKADEMIK MAHASISWA ────────────────────────
  drawText(
    "1. IDENTITAS & PROFIL AKADEMIK MAHASISWA",
    MARGIN_X,
    cursorY,
    9.5,
    true,
    [0.09, 0.09, 0.11]
  );
  cursorY -= 6;

  // Left column gets 54% width (285pt) so long campus emails never truncate
  const leftColW = Math.round(CONTENT_W * 0.54); // 285 pt
  const rightColW = CONTENT_W - leftColW; // 242.28 pt
  const rowH1 = 17.5;

  const profileRows: Array<[[string, string], [string, string]]> = [
    [
      ["Nama Mahasiswa", input.studentName || "Mahasiswa STARA"],
      ["Semester Aktif", `Semester ${input.currentSemester}`],
    ],
    [
      ["Email Kampus", input.studentEmail || "-"],
      ["Tahun Masuk", `Angkatan ${input.entryYear}`],
    ],
    [
      ["Perguruan Tinggi", input.institutionName || "Telkom University"],
      ["Fokus Kelulusan", formatGoalLabel(input.goals)],
    ],
    [
      ["Fakultas", input.facultyName || "Fakultas Utama"],
      [
        "Target TAK / SKKM",
        input.takEnabled ? `${input.takTarget} Poin (Aktif)` : "Tidak Diaktifkan",
      ],
    ],
    [
      ["Program Studi", `${input.programName} (${input.educationLevel})`],
      ["Belajar Mandiri", `${input.weeklyHours ?? 20} Jam / Minggu`],
    ],
    [
      ["Minat Karier", input.interests || "Teknologi, Riset & Pengembangan"],
      ["Pendekatan AI", formatStudyModeLabel(input.studyMode)],
    ],
  ];

  const totalProfileTableH = profileRows.length * rowH1;
  drawRect(MARGIN_X, cursorY, CONTENT_W, totalProfileTableH, [1, 1, 1], [0.8, 0.8, 0.84]);

  profileRows.forEach(([leftPair, rightPair], idx) => {
    const rTop = cursorY - idx * rowH1;
    const bg: [number, number, number] =
      idx % 2 === 0 ? [1, 1, 1] : [0.985, 0.982, 0.97];
    drawRect(MARGIN_X, rTop, CONTENT_W, rowH1, bg, [0.88, 0.88, 0.9], 0.4);

    const textY = rTop - 12;

    // Left Column (Label width: 78pt, Value width: 190pt)
    drawText(
      fitPdfText(leftPair[0], 76, 8, false),
      MARGIN_X + 10,
      textY,
      8,
      false,
      [0.4, 0.4, 0.45]
    );
    drawText(":", MARGIN_X + 88, textY, 8, false, [0.4, 0.4, 0.45]);
    drawText(
      fitPdfText(leftPair[1], leftColW - 102, 8, true),
      MARGIN_X + 95,
      textY,
      8,
      true,
      [0.09, 0.09, 0.11]
    );

    // Right Column (Label width: 76pt, Value width: 148pt)
    const rightStartX = MARGIN_X + leftColW;
    drawText(
      fitPdfText(rightPair[0], 76, 8, false),
      rightStartX + 10,
      textY,
      8,
      false,
      [0.4, 0.4, 0.45]
    );
    drawText(":", rightStartX + 88, textY, 8, false, [0.4, 0.4, 0.45]);
    drawText(
      fitPdfText(rightPair[1], rightColW - 102, 8, true),
      rightStartX + 95,
      textY,
      8,
      true,
      [0.09, 0.09, 0.11]
    );
  });

  // Vertical divider line between Left and Right columns
  drawLine(
    MARGIN_X + leftColW,
    cursorY,
    MARGIN_X + leftColW,
    cursorY - totalProfileTableH,
    [0.8, 0.8, 0.84],
    0.6
  );

  cursorY -= totalProfileTableH + 14;

  // ─── BAGIAN 2: RINGKASAN CAPAIAN & PROGRES KELULUSAN ────────────────────────
  drawText(
    "2. RINGKASAN CAPAIAN SKS, IPK & ESTIMASI KELULUSAN",
    MARGIN_X,
    cursorY,
    9.5,
    true,
    [0.09, 0.09, 0.11]
  );
  cursorY -= 6;

  const trueRemainingCredits = Math.max(
    0,
    input.totalCurriculumCredits - input.completedCredits
  );
  const progressPct = Math.min(
    100,
    Math.round(
      (input.completedCredits / Math.max(1, input.totalCurriculumCredits)) * 100
    )
  );
  const estGradSem =
    input.estimatedGraduationSemester ||
    (input.goals === "fast"
      ? Math.max(input.currentSemester, 7)
      : Math.max(input.currentSemester, 8));
  const semsRemaining = Math.max(1, estGradSem - input.currentSemester + 1);
  const avgSksPerSem = Math.ceil(trueRemainingCredits / semsRemaining);

  const boxGap = 8;
  const boxW = (CONTENT_W - boxGap * 3) / 4;
  const cardH = 48;
  const metrics = [
    {
      label: "SEMESTER BERJALAN",
      value: `Semester ${input.currentSemester}`,
      sub: `Angkatan ${input.entryYear}`,
      color: [0.57, 0.25, 0.05] as [number, number, number],
    },
    {
      label: "SKS TELAH LULUS",
      value: `${input.completedCredits} SKS`,
      sub: `Dari ${input.totalCurriculumCredits} SKS kurikulum`,
      color: [0.08, 0.5, 0.24] as [number, number, number],
    },
    {
      label: "SISA BEBAN SKS",
      value: `${trueRemainingCredits} SKS`,
      sub: `Rata-rata ~${avgSksPerSem} SKS/semester`,
      color: [0.05, 0.53, 0.49] as [number, number, number],
    },
    {
      label: "IPK & ESTIMASI LULUS",
      value: input.gpa ? `IPK ${input.gpa.toFixed(2)}` : "IPK -",
      sub: `Target Lulus Semester ${estGradSem}`,
      color: [0.31, 0.27, 0.9] as [number, number, number],
    },
  ];

  metrics.forEach((m, i) => {
    const bx = MARGIN_X + i * (boxW + boxGap);
    drawRect(bx, cursorY, boxW, cardH, [0.99, 0.99, 0.98], [0.8, 0.8, 0.84]);
    drawText(m.label, bx + 9, cursorY - 13, 7, true, [0.45, 0.45, 0.5]);
    drawText(m.value, bx + 9, cursorY - 29, 11.5, true, m.color);
    drawText(
      fitPdfText(m.sub, boxW - 16, 7.2, false),
      bx + 9,
      cursorY - 41,
      7.2,
      false,
      [0.4, 0.4, 0.45]
    );
  });

  cursorY -= cardH + 6;

  // Visual Progress Bar Strip with exact right-aligned text
  const progBoxH = 26;
  drawRect(MARGIN_X, cursorY, CONTENT_W, progBoxH, [0.985, 0.982, 0.97], [0.82, 0.8, 0.76]);
  drawText(
    `Progres Penyelesaian Kurikulum: ${input.completedCredits} / ${input.totalCurriculumCredits} SKS (${progressPct}% Selesai)`,
    MARGIN_X + 10,
    cursorY - 10.5,
    7.8,
    true,
    [0.12, 0.12, 0.15]
  );
  drawTextRight(
    `Sisa ${trueRemainingCredits} SKS dalam ${semsRemaining} semester ke depan`,
    MARGIN_X + CONTENT_W - 10,
    cursorY - 10.5,
    7.8,
    false,
    [0.36, 0.36, 0.4]
  );

  const barX = MARGIN_X + 10;
  const barW = CONTENT_W - 20;
  drawRect(barX, cursorY - 15, barW, 5.5, [0.9, 0.89, 0.86]);
  const fillW = Math.max(4, (barW * progressPct) / 100);
  drawRect(barX, cursorY - 15, fillW, 5.5, [0.08, 0.52, 0.25]);

  cursorY -= progBoxH + 14;

  // ─── BAGIAN 3: RENCANA STUDI & MATA KULIAH PER SEMESTER (SEMESTER 1 - 8) ────
  drawText(
    "3. RENCANA STUDI & MATA KULIAH PER SEMESTER (ROADMAP SEMESTER 1 - 8)",
    MARGIN_X,
    cursorY,
    9.5,
    true,
    [0.09, 0.09, 0.11]
  );
  cursorY -= 7;

  const hasValidTasks =
    Array.isArray(input.semesterPlans) &&
    input.semesterPlans.some((sp) => Array.isArray(sp.tasks) && sp.tasks.length > 0);

  const effectiveSemesters = hasValidTasks
    ? input.semesterPlans
    : buildFallbackSemesters(input.currentSemester);

  // Column X offsets inside CONTENT_W (527.28 pt):
  // Col 0 (NO): 0..26 (center-aligned)
  // Col 1 (KODE MK): 26..84
  // Col 2 (NAMA MATA KULIAH): 84..352
  // Col 3 (KATEGORI): 352..418
  // Col 4 (SKS): 418..462 (center-aligned)
  // Col 5 (STATUS): 462..527.28
  const colOffsets = [0, 26, 84, 352, 418, 462, CONTENT_W];

  for (const sem of effectiveSemesters) {
    const tasks = sem.tasks || [];
    const totalSemSks = tasks.reduce((acc, t) => acc + (t.credits || 0), 0);
    const semHeaderH = 18;
    const tableColHeaderH = 14.5;
    const rowH = 14.5;
    const rowsCount = Math.max(1, tasks.length);

    // Keep each semester block 100% intact on the same page (never split a semester across pages!)
    const fullSemesterBlockH = semHeaderH + tableColHeaderH + rowsCount * rowH + 8;
    ensureSpace(fullSemesterBlockH);

    const isDoneSem = sem.semesterNum < input.currentSemester;
    const isCurrSem = sem.semesterNum === input.currentSemester || sem.isCurrentSemester;

    const headerBg: [number, number, number] = isCurrSem
      ? [0.97, 0.91, 0.68]
      : isDoneSem
      ? [0.91, 0.96, 0.92]
      : [0.94, 0.94, 0.95];

    drawRect(MARGIN_X, cursorY, CONTENT_W, semHeaderH, headerBg, [0.78, 0.78, 0.82]);

    const semBadge = isCurrSem
      ? "SEDANG BERJALAN"
      : isDoneSem
      ? "SELESAI"
      : "DIRENCANAKAN";

    drawText(
      `SEMESTER ${sem.semesterNum}   |   Status: ${semBadge}`,
      MARGIN_X + 10,
      cursorY - 12.2,
      8.5,
      true,
      [0.09, 0.09, 0.11]
    );
    drawTextRight(
      `Total Beban: ${totalSemSks} SKS (${tasks.length} Mata Kuliah)`,
      MARGIN_X + CONTENT_W - 10,
      cursorY - 12.2,
      8,
      true,
      [0.22, 0.22, 0.28]
    );
    cursorY -= semHeaderH;

    // Column Header Row
    drawRect(
      MARGIN_X,
      cursorY,
      CONTENT_W,
      tableColHeaderH,
      [0.965, 0.965, 0.975],
      [0.8, 0.8, 0.84],
      0.5
    );

    const headerY = cursorY - 10;
    drawTextCenter("NO", MARGIN_X + (colOffsets[0] + colOffsets[1]) / 2, headerY, 7.2, true, [0.35, 0.35, 0.4]);
    drawText("KODE MK", MARGIN_X + colOffsets[1] + 6, headerY, 7.2, true, [0.35, 0.35, 0.4]);
    drawText("NAMA MATA KULIAH / KEGIATAN AKADEMIK", MARGIN_X + colOffsets[2] + 6, headerY, 7.2, true, [0.35, 0.35, 0.4]);
    drawText("KATEGORI", MARGIN_X + colOffsets[3] + 6, headerY, 7.2, true, [0.35, 0.35, 0.4]);
    drawTextCenter("SKS", MARGIN_X + (colOffsets[4] + colOffsets[5]) / 2, headerY, 7.2, true, [0.35, 0.35, 0.4]);
    drawText("STATUS", MARGIN_X + colOffsets[5] + 6, headerY, 7.2, true, [0.35, 0.35, 0.4]);

    for (let c = 1; c < colOffsets.length - 1; c++) {
      drawLine(
        MARGIN_X + colOffsets[c],
        cursorY,
        MARGIN_X + colOffsets[c],
        cursorY - tableColHeaderH,
        [0.84, 0.84, 0.88],
        0.45
      );
    }
    cursorY -= tableColHeaderH;

    if (tasks.length === 0) {
      drawRect(MARGIN_X, cursorY, CONTENT_W, rowH, [1, 1, 1], [0.85, 0.85, 0.88], 0.45);
      drawText(
        "Belum ada mata kuliah terjadwal pada semester ini.",
        MARGIN_X + 10,
        cursorY - 10,
        7.8,
        false,
        [0.45, 0.45, 0.5]
      );
      cursorY -= rowH;
    } else {
      for (let idx = 0; idx < tasks.length; idx++) {
        const t = tasks[idx];
        const rowBg: [number, number, number] =
          idx % 2 === 0 ? [1, 1, 1] : [0.99, 0.99, 0.985];
        drawRect(MARGIN_X, cursorY, CONTENT_W, rowH, rowBg, [0.86, 0.86, 0.89], 0.45);

        for (let c = 1; c < colOffsets.length - 1; c++) {
          drawLine(
            MARGIN_X + colOffsets[c],
            cursorY,
            MARGIN_X + colOffsets[c],
            cursorY - rowH,
            [0.88, 0.88, 0.91],
            0.4
          );
        }

        const rowTextY = cursorY - 10.2;
        const codeStr = t.courseCode ? t.courseCode.toUpperCase() : `MK-S${sem.semesterNum}0${idx + 1}`;
        const statusEffective =
          t.status || (isDoneSem ? "done" : isCurrSem ? "in_progress" : "planned");
        const statusColor: [number, number, number] =
          statusEffective === "done"
            ? [0.08, 0.5, 0.24]
            : statusEffective === "in_progress"
            ? [0.57, 0.25, 0.05]
            : [0.38, 0.38, 0.44];

        drawTextCenter(
          String(idx + 1),
          MARGIN_X + (colOffsets[0] + colOffsets[1]) / 2,
          rowTextY,
          7.8,
          false,
          [0.35, 0.35, 0.4]
        );
        drawText(
          fitPdfText(codeStr, colOffsets[2] - colOffsets[1] - 10, 7.8, true),
          MARGIN_X + colOffsets[1] + 6,
          rowTextY,
          7.8,
          true,
          [0.18, 0.18, 0.24]
        );
        drawText(
          fitPdfText(t.title, colOffsets[3] - colOffsets[2] - 12, 8, false),
          MARGIN_X + colOffsets[2] + 6,
          rowTextY,
          8,
          false,
          [0.09, 0.09, 0.11]
        );
        drawText(
          fitPdfText(formatCategoryLabel(t.category), colOffsets[4] - colOffsets[3] - 10, 7.6, false),
          MARGIN_X + colOffsets[3] + 6,
          rowTextY,
          7.6,
          false,
          [0.3, 0.3, 0.36]
        );
        drawTextCenter(
          t.credits > 0 ? `${t.credits} SKS` : "-",
          MARGIN_X + (colOffsets[4] + colOffsets[5]) / 2,
          rowTextY,
          7.8,
          true,
          [0.15, 0.15, 0.2]
        );
        drawText(
          fitPdfText(formatStatusLabel(statusEffective), colOffsets[6] - colOffsets[5] - 10, 7.6, true),
          MARGIN_X + colOffsets[5] + 6,
          rowTextY,
          7.6,
          true,
          statusColor
        );

        cursorY -= rowH;
      }
    }

    cursorY -= 8;
  }

  // ─── BAGIAN 4: RINGKASAN PRESTASI & AGENDA PENGINGAT AKADEMIK ──────────────
  const box4H = 52;
  ensureSpace(box4H + 22);
  cursorY -= 2;
  drawText(
    "4. CATATAN PRESTASI & AGENDA PENGINGAT AKADEMIK",
    MARGIN_X,
    cursorY,
    9.5,
    true,
    [0.09, 0.09, 0.11]
  );
  cursorY -= 6;

  const halfBoxW = (CONTENT_W - 10) / 2;
  drawRect(MARGIN_X, cursorY, halfBoxW, box4H, [0.99, 0.99, 0.985], [0.8, 0.8, 0.84]);
  drawRect(MARGIN_X + halfBoxW + 10, cursorY, halfBoxW, box4H, [0.99, 0.99, 0.985], [0.8, 0.8, 0.84]);

  drawText(
    "Ringkasan Prestasi & Portofolio CV:",
    MARGIN_X + 10,
    cursorY - 14,
    8.2,
    true,
    [0.12, 0.12, 0.16]
  );
  const achList =
    input.achievements && input.achievements.length > 0
      ? input.achievements
          .slice(0, 2)
          .map((a) => `- ${a.title} (${a.category.toUpperCase()})`)
      : [
          `- Target Pengumpulan Poin TAK/SKKM: ${input.takTarget} Poin`,
          "- Portofolio akademik & proyek terintegrasi di modul Prestasi & CV",
        ];
  achList.forEach((line, idx) => {
    drawText(
      fitPdfText(line, halfBoxW - 20, 7.8, false),
      MARGIN_X + 10,
      cursorY - 28 - idx * 12.5,
      7.8,
      false,
      [0.3, 0.3, 0.35]
    );
  });

  const rightBoxX = MARGIN_X + halfBoxW + 10;
  drawText(
    "Agenda & Pengingat Akademik Aktif:",
    rightBoxX + 10,
    cursorY - 14,
    8.2,
    true,
    [0.12, 0.12, 0.16]
  );
  const remList =
    input.reminders && input.reminders.length > 0
      ? input.reminders
          .slice(0, 2)
          .map((r) => `- ${r.title} (${r.deadline || "Terjadwal"})`)
      : [
          `- Persiapan KRS & Verifikasi Prasyarat Semester ${input.currentSemester + 1}`,
          "- Evaluasi Capaian IPK & Review Target Studi Semester",
        ];
  remList.forEach((line, idx) => {
    drawText(
      fitPdfText(line, halfBoxW - 20, 7.8, false),
      rightBoxX + 10,
      cursorY - 28 - idx * 12.5,
      7.8,
      false,
      [0.3, 0.3, 0.35]
    );
  });

  if (currentCommands.length > 0) {
    pages.push(currentCommands);
  }

  // Add clean footer with left & right aligned metadata on every page
  const totalPages = pages.length;
  pages.forEach((cmds, pageIdx) => {
    // Thin separator line above footer
    cmds.push("q");
    cmds.push("0.84 0.84 0.87 RG 0.5 w");
    cmds.push(`${MARGIN_X} 32 m ${(MARGIN_X + CONTENT_W).toFixed(2)} 32 l S`);
    cmds.push("Q");

    cmds.push("BT");
    cmds.push("0.45 0.45 0.50 rg");
    cmds.push("/F1 7.6 Tf");
    cmds.push(`${MARGIN_X} 20 Td`);
    cmds.push(
      `(${pdfEscape(
        `STARA Academic Summary  |  ${input.institutionName} - ${input.programName}`
      )}) Tj`
    );
    cmds.push("ET");

    const pageStr = `Halaman ${pageIdx + 1} dari ${totalPages}`;
    const pageStrW = measurePdfTextWidth(pageStr, 7.6, true);
    cmds.push("BT");
    cmds.push("0.35 0.35 0.40 rg");
    cmds.push("/F2 7.6 Tf");
    cmds.push(`${(MARGIN_X + CONTENT_W - pageStrW).toFixed(2)} 20 Td`);
    cmds.push(`(${pdfEscape(pageStr)}) Tj`);
    cmds.push("ET");
  });

  // ─── ASSEMBLE PDF 1.4 OBJECTS ───────────────────────────────────────────────
  const objects: string[] = [];
  const pageObjIds: number[] = [];

  for (let i = 0; i < totalPages; i++) {
    pageObjIds.push(5 + i * 2);
  }

  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");
  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds
      .map((id) => `${id} 0 R`)
      .join(" ")}] /Count ${totalPages} >>\nendobj`
  );
  objects.push(
    "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj"
  );
  objects.push(
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj"
  );

  for (let i = 0; i < totalPages; i++) {
    const pageObjId = 5 + i * 2;
    const contentObjId = pageObjId + 1;
    const streamContent = pages[i].join("\n");

    objects.push(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj`
    );
    objects.push(
      `${contentObjId} 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj`
    );
  }

  let pdfBody = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(pdfBody.length);
    pdfBody += obj + "\n";
  }

  const xrefOffset = pdfBody.length;
  pdfBody += `xref\n0 ${objects.length + 1}\n`;
  pdfBody += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdfBody += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdfBody += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdfBody], { type: "application/pdf" });
}
