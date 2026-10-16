# STARA — Full-Stack Website Generation Prompt
## Master specification for an AI coding agent

> **Project:** STARA — Student Tracking and Academic Roadmap Assistant  
> **Goal:** Build a polished, responsive, full-stack monolithic web application for a competition demo in 14 days.  
> **Primary viewport:** Laptop and desktop (1440×900, 1366×768); responsive down to tablet and mobile.  
> **Reference UI:** The user-provided screenshot: premium black landing page, generous whitespace, centered pill navigation, large typography, small floating labels, bright colorful 3D-style cards, restrained glow, and a bold hero composition. Use it as visual inspiration, not as a pixel-for-pixel copy.  
> **Core stack:** TypeScript end-to-end.  
> **Architecture:** One monolithic Next.js application with server-side code, API routes/server actions, database access, authentication, and AI integration in one repository. Do not create microservices. Java is not required; use TypeScript for both frontend and backend.

---


# LANGUAGE AND INDONESIAN UNIVERSITY CONTEXT — MANDATORY

**STARA is a website for students in Indonesia. The entire user-facing experience must use Bahasa Indonesia by default.** Do not generate an English-language UI just because the implementation prompt is written in English.

## Language rules

- Landing page, navigation, buttons, labels, forms, validation messages, empty states, loading states, error messages, confirmations, reminders, onboarding, dashboard, roadmap, simulator, community, thesis guidance, career guidance, achievement records, CV preview, settings, admin interface, and demo content must all be in natural, clear Bahasa Indonesia.
- Use Indonesian university terminology familiar to students, for example:
  - Kampus / Perguruan Tinggi
  - Fakultas
  - Program Studi (Prodi)
  - Semester
  - SKS
  - IPK
  - KRS
  - TAK or equivalent student activity credits, when applicable
  - Magang
  - MBKM / program pembelajaran di luar program studi, where applicable
  - Pertukaran Mahasiswa
  - Skripsi / Tugas Akhir
  - Dosen Pembimbing
  - Sidang
  - Yudisium
- Keep technical terms such as API, AI, backend, frontend, and database only where they are useful; explain them in Indonesian when shown to non-technical users.
- Use a friendly, encouraging, respectful tone—not overly formal, not childish, and not condescending.
- Use Indonesian date formatting and Asia/Jakarta as the default timezone for demo reminders, while allowing date/time configuration where appropriate.
- Use `id-ID` locale for displayed dates and numbers. Display credits as `SKS`; do not assume all campuses use the same TAK or credit rules.
- Avoid importing foreign university assumptions as if they were Indonesian rules. Campus policies vary, so label rules as “Data kampus”, “Input mahasiswa”, “Pengalaman mahasiswa”, or “Perlu dikonfirmasi”.
- Do not invent official Indonesian university policies, MBKM conversion rules, SKS limits, KRS dates, yudisium dates, or graduation requirements.
- Use realistic but fictional Indonesian demo data. Do not use real students' personal data.
- Use Indonesian microcopy and example content. Suggested landing-page copy:
  - Eyebrow: “Perjalanan kuliahmu, lebih terarah”
  - Headline: “Rencanakan Kuliahmu.”
  - Emphasis: “Tetap dengan Ritmemu.”
  - Subtitle: “Roadmap akademik personal yang menyesuaikan rencana dan perubahan perjalanan kuliahmu.”
  - Primary CTA: “Buat Roadmap Saya”
  - Secondary CTA: “Jelajahi Template”
  - Demo CTA: “Coba Demo”
- Navigation labels should be localized, for example:
  - Dashboard → Beranda
  - My Roadmap → Roadmap Saya
  - What-If Simulator → Simulasi Skenario
  - Explore Templates → Jelajahi Template
  - Thesis Compass → Panduan Skripsi
  - After Graduation → Rencana Setelah Lulus
  - Achievements & CV → Prestasi & CV
  - Reminders → Pengingat
  - Profile & Settings → Profil & Pengaturan
- The internal code identifiers, file names, schema field names, and comments may remain in English for maintainability. The visible UI must remain Bahasa Indonesia.
- If internationalization is added, Indonesian (`id`) must be the default locale. Do not spend MVP time building a full translation system unless it is straightforward and does not delay the required workflows.

## Indonesian student experience

- The onboarding should ask for campus, faculty (optional), program of study, entry year, current semester, SKS completed, and goals in terms students in Indonesia understand.
- Support manual entry for students whose campus is not in the institution list.
- Campus-managed curriculum data must show institution/program, curriculum year, source, and verification status.
- Community templates must distinguish official campus information from peer experience.
- Treat MBKM and credit conversion as campus/program-dependent; require confirmation before treating credits as recognized.
- TAK is not universal across all campuses. Make it configurable and allow the student to use a campus-specific equivalent or skip it.
- Thesis Compass must use the Indonesian academic context, including calon dosen pembimbing, proposal, pengumpulan data, bimbingan, revisi, sidang, and tugas akhir where relevant.
- Reminder examples should include KRS, registration periods, internship application deadlines, proposal deadlines, sidang, and yudisium—but only use actual dates when provided by a verified source or the user.
- The CV export should support Indonesian-language content by default, with an optional English CV as a future enhancement if time allows.

## Language acceptance criteria

- [ ] Every user-facing page and component is in Bahasa Indonesia.
- [ ] No accidental English labels remain in the main workflow.
- [ ] Demo data and notifications use Indonesian.
- [ ] Dates and numbers are formatted for `id-ID`.
- [ ] Campus-specific rules are not presented as universal national rules.
- [ ] The user can manually enter a campus/program not found in the list.


# 1. Role and execution instructions

You are a senior product designer, UX architect, full-stack TypeScript engineer, database designer, AI engineer, and QA engineer. Build STARA as a working application, not a static mockup.

## Non-negotiable requirements

- **All user-facing text must be in Bahasa Indonesia by default**, using terminology familiar to students at Indonesian universities. Internal code identifiers may be English. Follow the mandatory language/context section below.

1. Implement the complete primary workflow from onboarding → generated roadmap → dashboard → What-If simulation → apply scenario → check-in/reminders, plus community templates.
2. Build all main pages and connect their navigation.
3. Every visible button, form, filter, tab, and menu must work or be clearly marked as unavailable in the demo. Do not leave decorative controls pretending to work.
4. Use TypeScript throughout the application. Do not add a separate Java/Spring backend.
5. Keep the application monolithic: one Next.js project and one deployment unit. Database and external AI provider may be external services, but there are no separately deployed internal microservices.
6. Make the demo usable without sign-up through a **Guest Demo** entry point and seeded sample data.
7. Store data persistently for authenticated users. For guests, use a clearly isolated demo workspace with a reset-demo option. Do not imply guest data is permanent if it is stored only in browser storage.
8. The app must remain useful when the AI provider is unavailable. Core academic calculations must work deterministically without AI.
9. Do not invent official university policies, curriculum rules, student statistics, credit conversions, or graduation guarantees.
10. Build for desktop/laptop first, but make all pages responsive.
11. Include loading, empty, error, success, and confirmation states.
12. After implementation, run lint, type checking, database migrations, and available tests; fix errors rather than merely reporting them.

If the environment supports creating files and running commands, create the project directly. If an existing repository is provided, inspect it first and preserve working code. If the agent cannot execute a command or access a service, document the exact blocker and continue with a functional local fallback.

---

# 2. Product definition

STARA helps university students plan their academic journey, explore possible choices, track milestones, learn from peers’ templates, prepare for a thesis, and organize achievements.

## Product principles

- **Personal:** Roadmaps are tailored to the student’s current situation and goals.
- **Adaptive:** The user can revise plans when circumstances change.
- **Transparent:** Calculations show their assumptions and uncertainty.
- **Community-informed:** Peer templates are useful references, not official policy.
- **Supportive:** No shame, public ranking, or anxiety-inducing comparison.
- **Student-controlled:** The user chooses whether to apply a simulation or share a template.
- **Academic integrity:** Thesis Compass guides exploration and feasibility; it does not generate a submission-ready thesis or guarantee supervisor approval.

## Primary user journey

1. Open landing page.
2. Choose **Try Demo** or **Get Started**.
3. Complete a short onboarding flow.
4. Review and confirm the generated academic roadmap.
5. Arrive at the dashboard.
6. Open the What-If Simulator, create a scenario, and compare it to the active roadmap.
7. Save the scenario or apply it after explicit confirmation.
8. Explore and clone a peer template.
9. Use reminders/check-ins to keep the roadmap current.
10. Explore Thesis Compass, post-study direction, and achievements.
11. Return to the dashboard to see updated milestones and progress.

---

# 3. Required technology stack

Use stable, compatible versions available in the execution environment. Do not upgrade packages unnecessarily.

## Application

- **Next.js App Router**
- **React**
- **TypeScript** with strict mode enabled
- **Tailwind CSS**
- **shadcn/ui** or accessible equivalent components
- **Lucide icons**
- **Recharts** only where charts materially help
- **React Flow (`@xyflow/react`)** for the visual roadmap node editor and semantic connections
- **Zod** for validating inputs and API payloads
- **React Hook Form** for multi-step forms, where useful

## Backend inside the monolith

Use Next.js server-side capabilities:
- Route Handlers under `app/api/**/route.ts` for HTTP API endpoints.
- Server Actions for simple form mutations when appropriate.
- Server Components for server-rendered page data.
- Service modules for business logic.
- Repository/data-access modules for database operations.
- Middleware only for lightweight request handling, redirects, or demo/session routing. Do not put database queries or heavy authorization logic in Next.js middleware. Perform authoritative authentication and authorization checks in server-side services/route handlers.

## Database

Preferred:
- **PostgreSQL**
- **Prisma ORM**
- Prisma migrations and seed scripts

SQLite may be used only as a temporary local fallback if PostgreSQL cannot be provisioned; keep schema and access code portable where possible.

## Authentication and guest mode

Preferred:
- Auth.js/NextAuth with a supported provider or credentials setup compatible with the chosen version.
- If authentication setup would jeopardize the 14-day demo, provide guest/demo mode first and a clean optional email/password flow.
- Never expose private server secrets to the browser.
- Enforce ownership checks in server-side services for every private record.

## AI integration

Use a provider-agnostic server-side AI adapter:
- Define a typed `AIProvider` interface.
- Implement one real provider only if an API key is configured.
- Read provider API keys from server environment variables.
- If no API key is configured, use deterministic templates/rules and clearly label output as rule-based/demo output.
- AI must never be the authority for SKS arithmetic, prerequisite validation, official campus rules, or graduation estimates.
- Validate AI input and output with Zod. Handle malformed output and timeouts.
- Do not send sensitive student data to the AI provider unless necessary and explicitly disclosed. Prefer sending minimized, non-identifying context.

---

# 4. UI/UX art direction based on the supplied reference

## Visual concept

Create a premium, dark, editorial landing page inspired by the supplied screenshot:
- Near-black canvas with a subtle charcoal gradient.
- Off-white typography.
- Small lime/yellow accent for “Early access”, status labels, and primary action details.
- Cyan/teal and coral/pink accents for small labels and community elements.
- Rounded capsule navigation centered near the top.
- Large centered headline, with a mix of bold sans-serif and a subtle italic serif/emphasis on a phrase.
- A concise subtitle with limited line length.
- Small floating name/status pills around the hero, used sparingly.
- A layered row of colorful academic roadmap cards near the bottom of the hero, with the central card elevated and emphasized.
- Use soft glow, gentle gradients, tasteful shadows, and restrained motion.
- Do not overcrowd the page with people or stock photos. Prefer custom CSS compositions, abstract 3D-style shapes, illustrations, cards, and icons.
- Do not reproduce the reference’s branding, copy, or avatar product; reinterpret its visual composition for STARA.

## Landing page composition

For desktop (target 1440×900):
1. Warm light-gray outer page background or framing area, with a large dark hero panel inset from the viewport edges. The inner app itself should use a coherent dark theme.
2. Header: STARA symbol/wordmark at left; centered pill navigation; “Log in” and bright “Try Demo” button at right.
3. Small accent eyebrow: “Your academic journey, made clearer.”
4. Main headline example:
   - “Plan Your Journey.”
   - “Make Your Own Pace.”
   Emphasize the second phrase with italic serif styling or a distinct weight.
5. Subtitle: “A personal academic roadmap that adapts as your plans change.”
6. CTA buttons: **Build My Roadmap** and **Explore Templates**.
7. Bottom hero: layered cards representing “Semester 4”, “Internship Plan”, “Thesis Compass”, “TAK Milestones”, and “Graduation Outlook”. Center card is largest and overlaps the others slightly. Ensure text remains legible and keyboard users can access all links.
8. Decorative floating labels such as “Roadmap updated” and “Your pace, your plan”, with low visual prominence.
9. Add a small note such as “No student card verification required” if it fits naturally.

## App interior

The authenticated/demo workspace should remain visually related to the landing page, but optimize usability:
- Dark sidebar on desktop, main content area in charcoal/near-black.
- Persistent top bar with page title, active semester, notification control, and profile/demo indicator.
- Main cards with restrained borders, clear hierarchy, and high-contrast text.
- Use accent colors sparingly to differentiate academic, career, thesis, and community content.
- Progress bars and charts must have labels; color cannot be the only way to convey state.
- Avoid excessive glassmorphism, overly bright gradients, dense dashboards, or tiny low-contrast text.
- Default body font: a modern sans-serif such as Inter or Geist; use a restrained serif italic for editorial emphasis.
- Define design tokens for backgrounds, text, borders, radius, spacing, shadows, and accents.

## Responsive rules

Desktop-first, but responsive:
- Desktop ≥ 1200px: persistent sidebar/workspace, generous grid layouts.
- Tablet 768–1199px: collapsible sidebar, two-column cards where appropriate.
- Mobile < 768px: single-column layout, compact header, sidebar becomes a drawer, cards stack vertically, comparison tables become cards or horizontally scrollable with accessible labels.
- No horizontal page overflow.
- Forms must remain comfortable to use on touch devices.
- The landing hero composition must stack cleanly on mobile rather than clipping cards off-screen.
- Respect `prefers-reduced-motion`.

## Accessibility

- Semantic HTML and correct heading hierarchy.
- Keyboard-accessible menus, dialogs, tabs, and cards.
- Visible focus styles.
- Sufficient contrast.
- Labels and error messages associated with fields.
- Screen-reader-friendly status updates.
- Do not communicate success/failure by color alone.

---

# 5. Sitemap and navigation

## Public routes

- `/` — Landing page
- `/demo` — Start or reset guest demo
- `/login` — Optional login
- `/signup` — Optional account creation
- `/privacy` — Privacy explanation
- `/terms` — Terms and limitations

## Main workspace routes

- `/app` — Dashboard
- `/app/onboarding` — Multi-step onboarding
- `/app/roadmap` — Personal roadmap timeline
- `/app/simulator` — What-If Simulator
- `/app/templates` — Community template discovery
- `/app/templates/[id]` — Template details
- `/app/thesis` — Thesis Compass
- `/app/career` — Post-study direction
- `/app/achievements` — Achievement Log
- `/app/cv` — CV preview/export
- `/app/reminders` — Reminders and deadlines
- `/app/check-ins` — Semester check-in history and forms
- `/app/profile` — Profile and academic preferences
- `/app/settings` — Privacy and notifications
- `/admin` — Admin area (protected; only if admin functionality is implemented)

Use a shared workspace layout. Show the same route in navigation consistently; do not duplicate pages unnecessarily.

## Desktop sidebar

1. Overview
2. My Roadmap
3. What-If Simulator
4. Explore Templates
5. Thesis Compass
6. After Graduation
7. Achievements & CV
8. Reminders

Bottom section:
- Profile & Settings
- Help / feedback
- Guest Demo badge and “Reset demo” action when applicable

---

# 6. Detailed feature requirements

## Feature 1 — Onboarding dan Personal Roadmap

### Tujuan produk

Roadmap adalah pusat seluruh pengalaman STARA. Semua fitur—What-If Simulator, template komunitas, Skripsi Compass, check-in, pengingat, dan Achievement Log—harus dapat terhubung ke roadmap pengguna.

**Gunakan pendekatan hybrid:**
1. **Form** untuk memasukkan dan mengedit data akademik dengan validasi.
2. **Timeline semester** sebagai tampilan roadmap default yang paling mudah dipahami.
3. **Visual Map / Node Editor** sebagai tampilan tambahan yang memperlihatkan hubungan antar target akademik dan memungkinkan pengguna mengubah rencana secara visual.

Jangan membangun kanvas gambar bebas seperti draw.io yang semua shape-nya tidak memiliki makna. Node STARA harus merupakan objek akademik terstruktur yang dapat dihitung, divalidasi, dan digunakan What-If Simulator.

### Onboarding wizard

Buat wizard 4–5 langkah dengan indikator progres, tombol Kembali/Lanjutkan, simpan draf, dan opsi melewati pertanyaan opsional.

**Langkah 1 — Profil akademik**
- Perguruan tinggi/kampus
- Fakultas (opsional)
- Program Studi (Prodi)
- Jenjang pendidikan
- Tahun masuk
- Semester saat ini
- Mode studi bila relevan

Pengguna harus bisa mengetik nama kampus atau program studi secara manual jika belum ada dalam daftar.

**Langkah 2 — Kondisi akademik**
- Total SKS kurikulum
- SKS yang sudah lulus dan diakui
- SKS yang sedang diambil (opsional)
- Mata kuliah yang mengulang (opsional)
- IPK (opsional; jangan diwajibkan)
- Mata kuliah, prasyarat, dan semester penawaran jika diketahui
- Sumber data: input mahasiswa, data kampus, atau template komunitas

**Langkah 3 — Goal**
- Lulus secepat mungkin secara realistis
- Seimbang antara akademik dan kehidupan pribadi
- Aktif magang dan organisasi
- Menjalani ritme yang lebih ringan dengan rencana kelulusan yang tetap jelas

**Langkah 4 — Minat dan komitmen**
- Magang
- MBKM/program pembelajaran di luar prodi
- Pertukaran mahasiswa
- Organisasi
- Lomba/sertifikasi
- Penelitian/skripsi
- Waktu yang tersedia per minggu (opsional)

**Langkah 5 — Tinjau dan konfirmasi**
- Tampilkan ringkasan semua data.
- Tandai data yang belum diketahui atau masih berupa estimasi.
- Tampilkan asumsi yang akan digunakan.
- Beri kesempatan mengedit sebelum roadmap dibuat.

### Roadmap generation

Generate rencana semester demi semester yang memuat:
- Target SKS per semester
- Mata kuliah dan statusnya jika data tersedia
- Target TAK atau kegiatan kemahasiswaan setara jika berlaku di kampus
- Persiapan magang/karier
- Persiapan skripsi/tugas akhir
- Target pribadi dan pengingat

Setiap task harus memiliki:
- ID unik
- Judul dan deskripsi
- Kategori: akademik, TAK/kegiatan, karier, skripsi, pribadi
- Semester target dan/atau tanggal target
- Prioritas
- Status: belum dimulai, berjalan, selesai, tertunda, dibatalkan
- Catatan opsional
- Sumber data dan label tingkat kepastian
- Waktu penyelesaian jika selesai

### Dua mode tampilan roadmap

#### A. Timeline — tampilan default
- Semester disusun secara kronologis.
- Semester aktif ditonjolkan.
- Pengguna dapat membuka/menutup detail semester.
- Tampilkan total SKS terjadwal, target, dan progres.
- Task bisa ditambah, diedit, ditandai selesai, ditunda, atau dibatalkan.
- Tampilkan estimasi kelulusan dengan label asumsi/kepastian.
- Tampilkan konflik atau data yang belum tersedia.
- Sediakan histori versi roadmap.

#### B. Visual Map / Node Editor — tampilan interaktif
Gunakan React Flow (`@xyflow/react`) atau library React node-editor sejenis yang aktif dan kompatibel. Jangan membangun editor diagram dari nol.

Sediakan node bertipe jelas:
- **Semester node:** periode, target SKS, dan ringkasan beban.
- **Mata kuliah node:** nama/kode, SKS, prasyarat, status, dan semester rencana.
- **Milestone node:** target akademik atau personal, tanggal, prioritas, status.
- **TAK/kegiatan node:** jenis kegiatan, target, progres, bila relevan.
- **Magang/MBKM/exchange node:** periode, status konversi SKS, dan milestone terkait.
- **Skripsi node:** eksplorasi topik, proposal, pengumpulan data, bimbingan, revisi, sidang/tugas akhir sesuai konteks pengguna.

Koneksi juga harus memiliki makna:
- `PREREQUISITE`: mata kuliah A harus lulus sebelum B.
- `SEQUENCE`: satu milestone sebaiknya dilakukan sebelum milestone lain.
- `PLANNED_IN`: target atau mata kuliah ditempatkan pada semester tertentu.
- `IMPACTS`: suatu skenario atau perubahan berdampak pada node tertentu.

Interaksi:
- Tambah node melalui tombol **Tambah Target**, bukan hanya shape kosong.
- Klik node untuk membuka panel detail di sisi kanan.
- Drag-and-drop mengubah posisi visual saja, bukan semester akademik secara otomatis.
- Perubahan semester harus dilakukan lewat field semester atau aksi yang jelas.
- Pengguna bisa menghubungkan node melalui handle yang terlihat dan memilih jenis relasinya.
- Validasi koneksi prasyarat dan tampilkan peringatan jika ada konflik.
- Filter node berdasarkan semester dan kategori.
- Sediakan undo/redo dasar bila realistis; jika tidak, prioritaskan penyimpanan aman.
- Simpan posisi visual dan koneksi agar tampilan dapat dibuka kembali.

### Aturan penting untuk data dan perhitungan

Pisahkan data akademik dari posisi visual:
- Posisi X/Y node hanya untuk tata letak.
- Semester rencana, SKS, prasyarat, dan status disimpan sebagai data domain terpisah.
- Node semester, milestone, dan kegiatan non-kredit tidak ikut dijumlahkan sebagai SKS.
- Hitung SKS hanya dari mata kuliah unik yang benar-benar terjadwal pada semester tersebut.
- Jangan menghitung mata kuliah yang sama dua kali jika hanya direferensikan oleh beberapa koneksi.
- Validasi total SKS dan prasyarat sebelum menyatakan rencana valid.
- Jangan menganggap SKS MBKM/exchange diakui sebelum status konversinya dikonfirmasi.
- TAK tidak berlaku universal; buat konfigurabel dan izinkan pengguna melewatinya atau memakai istilah kampusnya sendiri.

### Perhitungan roadmap

- Sisa SKS = total SKS kurikulum − SKS lulus/diakui.
- Estimasi semester lulus harus mempertimbangkan mata kuliah yang tersisa, prasyarat, semester penawaran jika diketahui, batas beban yang dimasukkan, dan milestone tugas akhir.
- Jika data penting belum tersedia, jangan memberikan tanggal/semester lulus seolah pasti. Tampilkan rentang atau “Belum cukup data untuk estimasi yang andal”.
- Preset goal memengaruhi distribusi beban yang disarankan, tetapi tidak boleh mengesampingkan aturan resmi yang diketahui.

### Integrasi roadmap dengan fitur lain

- What-If dapat membuat salinan skenario dari roadmap aktif dan menyoroti node yang terdampak.
- Template komunitas dapat di-clone menjadi draft roadmap yang dapat diedit.
- Check-in memperbarui progres berdasarkan jawaban pengguna.
- Pengingat dapat ditautkan ke task atau milestone.
- Skripsi Compass dapat menambahkan milestone skripsi setelah persetujuan pengguna.
- Achievement Log dapat ditautkan ke milestone yang relevan.
- Perubahan yang berdampak besar harus menampilkan ringkasan dan memerlukan konfirmasi sebelum diterapkan.



## Feature 2 — What-If Simulator dengan AI sebagai Academic Decision Assistant

### Tujuan

What-If Simulator adalah USP utama STARA. Fitur ini membantu mahasiswa memahami konsekuensi pilihan akademik sebelum mengambil keputusan. Fitur ini bukan chatbot biasa dan tidak boleh mengarang prediksi kelulusan.

**Arsitektur wajib: Rules Engine + Scenario Comparison + AI Explanation.**

- **Rules Engine (TypeScript):** sumber kebenaran untuk semua hitungan SKS, validasi prasyarat, konflik jadwal, dan estimasi semester kelulusan.
- **Scenario Comparison:** membandingkan roadmap aktif dengan roadmap alternatif yang dibuat dari parameter skenario.
- **AI:** menjelaskan hasil hitungan, merangkum trade-off, membantu mengevaluasi alternatif, dan menyarankan pertanyaan untuk dosen wali/pengelola akademik.

AI tidak boleh menjadi kalkulator akademik atau mengganti hasil numerik dari Rules Engine.

### Skenario yang wajib didukung

1. Magang
2. MBKM/program pembelajaran di luar prodi
3. Mengambil mata kuliah tingkat atas lebih awal
4. Pertukaran mahasiswa
5. Cuti akademik

Untuk cuti, cukup sediakan kategori umum seperti “Cuti akademik” dan alasan opsional yang tidak sensitif. Jangan meminta detail kesehatan secara wajib.

### Workflow What-If

1. Pengguna membuka **Simulasi Skenario** dari menu, dashboard, atau node roadmap.
2. Pengguna memilih jenis skenario.
3. Jika skenario dimulai dari node visual, isi parameter awal dari node tersebut agar pengguna tidak mengulang input.
4. Pengguna mengisi parameter yang relevan.
5. Backend memvalidasi input dengan Zod dan memeriksa kepemilikan roadmap.
6. Rules Engine membuat salinan kerja roadmap dan menghitung dampak skenario.
7. Scenario Comparison membandingkan baseline dan alternatif.
8. AI menerima ringkasan terstruktur dari hasil hitungan dan menjelaskan dampaknya dalam Bahasa Indonesia.
9. Server memvalidasi output AI. Jika AI gagal, tampilkan penjelasan fallback berbasis aturan.
10. Pengguna dapat mengubah parameter, menyimpan skenario, membandingkan skenario lain, atau memilih **Terapkan ke Roadmap Saya**.
11. Sebelum penerapan, tampilkan perbedaan sebelum/sesudah dan minta konfirmasi.
12. Saat diterapkan, buat versi roadmap baru dan pertahankan versi lama. Jangan pernah menimpa roadmap lama secara diam-diam.

### Parameter per skenario

**Magang**
- Semester mulai
- Durasi
- Apakah magang berbenturan dengan kuliah reguler
- SKS yang akan dikonversi, jika ada
- Status konversi: dikonfirmasi, belum diketahui, tidak ada

**MBKM**
- Jenis program dan durasi
- Mata kuliah/capaian pembelajaran terkait
- SKS yang diklaim akan diakui
- Status persetujuan/konversi
- Potensi konflik urutan mata kuliah

**Mata kuliah tingkat atas**
- Mata kuliah yang ingin diambil
- Prasyarat yang diketahui
- Semester penawaran
- Beban SKS yang direncanakan
- Status pemenuhan prasyarat

**Pertukaran mahasiswa**
- Periode dan durasi
- Mata kuliah asal dan mata kuliah mitra yang dipetakan
- Status pengakuan kredit
- Mata kuliah yang berpotensi tertunda

**Cuti akademik**
- Semester mulai
- Durasi
- Alasan umum opsional
- Mata kuliah dan milestone yang berpotensi terdampak

### Output perbandingan yang wajib ditampilkan

Tampilkan baseline dan alternatif secara berdampingan:
- Estimasi semester kelulusan atau rentang estimasi jika data memungkinkan
- Total SKS lulus, sisa SKS, dan SKS yang direncanakan per semester
- Perubahan mata kuliah dan milestone
- Node roadmap yang terdampak, bila simulasi berasal dari Visual Map
- Risiko prasyarat dan mata kuliah yang hanya tersedia pada periode tertentu jika datanya diketahui
- Dampak terhadap persiapan skripsi, magang, atau target lainnya
- Potensi manfaat dan konsekuensi
- Asumsi yang digunakan
- Data yang belum diketahui dan hal yang perlu dikonfirmasi ke kampus

Gunakan status validasi:
- **Sesuai data yang tersedia:** tidak ada konflik yang diketahui dari data yang dimiliki.
- **Perlu konfirmasi:** hasil tergantung kebijakan/data yang belum tersedia.
- **Konflik terdeteksi:** input bertentangan dengan prasyarat atau batas yang diketahui.

Jangan menyamakan “tidak ada konflik yang diketahui” dengan “pasti disetujui kampus”.

### Rules Engine — implementasi TypeScript

Buat modul murni dan mudah diuji, terpisah dari UI dan AI. Contoh fungsi:
- `calculateRemainingCredits()`
- `validateScenario()`
- `validatePrerequisites()`
- `calculateSemesterLoad()`
- `estimateGraduationWindow()`
- `applyScenarioToDraftRoadmap()`
- `compareRoadmaps()`
- `identifyImpactedNodes()`
- `generateRuleBasedTradeoffs()`

Persyaratan:
- Fungsi perhitungan menerima data terstruktur dan menghasilkan output terstruktur.
- Gunakan angka dari data akademik yang tersimpan, bukan dari jawaban AI.
- Jangan menganggap konversi MBKM/exchange disetujui kecuali sumber menyatakan sudah dikonfirmasi.
- Jika semester penawaran atau prasyarat tidak diketahui, tandai hasil sebagai provisional.
- Jangan memaksakan estimasi kelulusan bila data tidak cukup; tampilkan “Belum cukup data untuk estimasi yang andal” dan jelaskan data yang diperlukan.
- Buat unit tests untuk SKS, prasyarat, konversi kredit, cuti, dan skenario yang datanya tidak lengkap.

### AI — Academic Decision Assistant

Bangun AI module di dalam monolit Next.js pada:
- `src/server/ai/provider.ts`
- `src/server/ai/prompts.ts`
- `src/server/ai/schemas.ts`
- `src/server/ai/fallback.ts`
- `src/server/ai/service.ts`

AI diakses hanya dari backend menggunakan API model yang dikonfigurasi lewat environment variable. Jangan mengirim API key ke frontend.

AI bertugas:
1. Menjelaskan hasil hitungan deterministik dengan Bahasa Indonesia yang mudah dipahami.
2. Merangkum keuntungan, konsekuensi, dan trade-off tiap pilihan.
3. Mengajukan pertanyaan klarifikasi jika ada informasi penting yang belum tersedia.
4. Menyarankan alternatif yang bisa diuji sebagai skenario baru.
5. Menyarankan pertanyaan yang tepat untuk dosen wali, pengelola program, atau kantor akademik.

AI tidak boleh:
- Menghitung ulang atau mengubah nilai numerik yang diberikan Rules Engine.
- Mengarang kebijakan kampus, batas SKS, deadline KRS, atau keputusan konversi kredit.
- Menjamin tanggal/semester kelulusan.
- Menganggap pengalaman mahasiswa lain sebagai aturan resmi.
- Menerapkan perubahan roadmap tanpa persetujuan pengguna.

### Bentuk data AI

Kirim ke AI hanya konteks minimum yang diperlukan, misalnya:
- Goal mahasiswa
- Tipe skenario dan parameter relevan
- Ringkasan baseline
- Ringkasan hasil skenario dari Rules Engine
- Asumsi, konflik, dan data yang belum tersedia

Minta output JSON terstruktur yang divalidasi menggunakan Zod, misalnya:
- `summary`
- `benefits[]`
- `tradeoffs[]`
- `risks[]`
- `assumptions[]`
- `unknowns[]`
- `recommendedNextSteps[]`
- `questionsForCampus[]`

Jangan minta AI menghasilkan nilai `remainingCredits`, `graduationSemester`, atau angka akademik lain sebagai sumber utama. Nilai tersebut harus berasal dari Rules Engine. AI hanya boleh merujuk nilai itu dalam penjelasannya.

### Fallback saat AI tidak tersedia

Jika API key tidak ada, terjadi timeout, respons tidak valid, atau provider gagal:
- Simulator tetap menyelesaikan perhitungan.
- Tampilkan ringkasan rule-based dari hasil yang dihitung.
- Beri label “Penjelasan otomatis berbasis aturan” jika bukan hasil AI.
- Jangan mengarang seolah AI sudah digunakan.
- Sediakan tombol coba lagi jika sesuai.

### Simpan dan terapkan skenario

Setiap skenario menyimpan:
- Pemilik atau guest workspace
- ID dan versi baseline roadmap
- Jenis dan parameter skenario
- Hasil Rules Engine
- Asumsi dan data yang belum tersedia
- Penjelasan AI secara terpisah
- Status: draf, selesai dihitung, diterapkan, diarsipkan
- ID versi roadmap hasil penerapan, jika ada
- Timestamp

Saat pengguna menerapkan skenario:
1. Buat draft versi roadmap baru.
2. Tampilkan diff sebelum/sesudah.
3. Minta konfirmasi.
4. Simpan versi baru secara transaksional.
5. Pertahankan baseline dan riwayat simulasi.
6. Perbarui node visual dan timeline dari data roadmap yang sama.



## Feature 3 — Community Templates

### Template categories

- Semester roadmap
- TAK/co-curricular planning
- Internship preparation
- MBKM/exchange preparation
- Thesis planning
- Balancing study and organizations

### Search and filters

- Campus/institution
- Program/major
- Goal
- Category
- Last updated
- Usefulness count

### Template detail

Show:
- Title and description
- Creator display name or anonymous label
- Institution, major, and cohort/year if supplied
- Intended audience and goal
- Semester-by-semester steps
- Last updated date
- Source type: personal experience, community advice, or institution-verified data
- Usefulness action
- Clone/use-template action
- Comments and replies
- Report action

### Clone workflow

- Clone creates a new private copy.
- Changes to the copy must not change the source template.
- Store `sourceTemplateId` and clone provenance.
- Never overwrite the user's active roadmap automatically.
- Let the user preview and customize the clone before applying it.

### Moderation

- Users can report templates/comments with a reason.
- Admin can review, hide, restore, or remove reported content.
- Store moderation actions and timestamps.
- One user can have only one active usefulness vote per template.
- Add rate limits or basic abuse protection to public write actions.

### No social feed

Do not implement follower counts, following, direct messages, or a general social activity feed. Keep the product focused on templates and academic planning.

---

## Feature 4 — Thesis Compass

### Guided questionnaire

Collect:
- Areas of interest
- Relevant major/discipline
- Data availability
- Preferred or known research methods
- Time available
- Skills/tools
- Constraints such as privacy, permissions, cost, and access

### Output

Generate 2–3 possible research directions, each containing:
- Topic area
- Example research question
- Why it fits the student's interests
- Possible method
- Data required
- Feasibility: high, medium, or needs validation
- Main risks
- First steps
- Questions to confirm with a supervisor

Label output as exploration guidance, not a guaranteed acceptable thesis topic.

### Supervisor email template

Allow the student to:
- Enter supervisor name and context
- Choose a polite formal tone
- Generate an editable email draft
- Copy the email
- Mark outreach status

Never send an email automatically.

### Advising log

Fields:
- Date
- Supervisor/advisor
- Topics discussed
- Decisions/feedback
- Follow-up tasks
- Due date
- Status

Keep advising logs private by default.

---

## Feature 5 — Semester Check-ins and Reminders

### Start-of-semester check-in

Ask:
- Are current SKS targets realistic?
- Have courses/schedules changed?
- Are internship, organization, and TAK goals still relevant?
- Does workload need adjustment?
- What is the main priority this semester?

### End-of-semester check-in

Ask:
- How many credits were passed?
- Which milestones were completed?
- Which tasks were delayed?
- Which achievements should be recorded?
- Has the student's goal changed?

Never infer that a course was passed solely because the semester ended. Update based on user input.

### Reminders

Categories:
- Academic deadlines
- KRS/course registration
- MBKM/internship applications
- Thesis milestones
- Graduation/yudisium
- Personal goals

Fields:
- Title
- Category
- Deadline
- Source URL or source description, optional
- Official/unverified/personal label
- Status
- Notification preference

For the MVP, manual reminders are acceptable. Do not invent official deadlines. Browser notifications/email delivery are optional and must only be claimed if implemented and configured.

---

## Feature 6 — After Graduation

Create a short questionnaire about:
- Preferred direction: work, graduate study, entrepreneurship, or exploration
- Interests
- Current experience
- Skills
- Priorities and constraints (optional)

Output a flexible action plan for:
- Work first: portfolio, CV, job search, interviews
- S2/S3: study field, admission requirements, funding, research preparation
- Entrepreneurship: customer discovery, problem validation, experiment, business model
- Exploration: low-commitment experiments and reflection

Allow multiple paths. Users can change direction at any time.

Do not present this as a validated psychometric test.

---

## Feature 7 — Achievement Log and CV Export

### Achievement record

Fields:
- Title
- Category: internship, organization, project, competition, certification, academic, volunteering, other
- Role
- Description
- Start/end date
- Results/impact entered by the user
- Skills
- Optional evidence URL
- CV inclusion status

### Workflow

1. Add achievement.
2. Edit and review description.
3. Select entries for a CV.
4. Preview a simple CV.
5. Export PDF if feasible within the schedule; otherwise provide print-friendly page with browser print support.

Never fabricate titles, employers, awards, metrics, or skills.

---

## Feature 8 — Micro-Affirmation and Anti-FOMO

- Contextual messages for semester starts, delayed tasks, thesis progress, internship preparation, and completed milestones.
- Celebrate small milestones without competitive rankings.
- Show personal progress over time.
- Provide anonymous aggregate insights only when backed by sufficient real data.
- If no real aggregate data exists, show clearly labeled illustrative examples or omit the insight.
- Allow users to turn off affirmations and peer insights.
- Offer campus counseling/support links where known and verified.
- Do not infer or diagnose mental health conditions from usage or academic performance.

---

## Feature 9 — Profile and Settings

Include:
- Academic profile editor
- Goal preferences
- Data source labels
- Privacy controls
- Anonymous display option for community templates
- Notification preferences
- Export personal data if feasible
- Delete/reset demo data
- Account sign-out for authenticated users

Explain what information is public in templates and what remains private.

---

# 7. Data architecture and schema

Use Prisma with PostgreSQL. Define enums and relations, foreign keys, indexes, timestamps, and deletion behavior.

Recommended core models (adjust names as appropriate):

## Identity and academic data
- `User`
- `GuestSession` or equivalent demo workspace record
- `AcademicProfile`
- `Institution`
- `Program`
- `Curriculum`
- `Course`
- `CoursePrerequisite`
- `AcademicRecord`
- `UserPreference`

## Roadmap
- `Roadmap`
- `RoadmapVersion`
- `SemesterPlan`
- `RoadmapTask`
- `CheckIn`

## Simulation
- `Simulation`
- `SimulationScenario`
- `SimulationResult`

Store:
- Scenario type and parameters
- Baseline roadmap version
- Calculated result JSON with a validated schema
- Assumptions and missing information
- AI explanation separately from deterministic result
- Applied version ID, if applied

## Community
- `Template`
- `TemplateTask`
- `TemplateClone`
- `Comment`
- `TemplateVote`
- `Report`
- `ModerationAction`

## Thesis and career
- `ThesisAssessment`
- `ResearchDirection`
- `AdvisingLog`
- `CareerAssessment`
- `CareerActionPlan`
- `Achievement`
- `CVProfile`
- `CVEntry`

## Operations
- `Reminder`
- `Notification`
- `AuditEvent` where useful

### Data integrity

- Every private record must be scoped to the authenticated user or guest workspace.
- Enforce ownership on the server for reads, updates, and deletes.
- Never trust `userId` sent from the client as proof of ownership.
- Validate every mutation.
- Use transactions when applying a simulation or cloning a template.
- Preserve source template data when a clone changes.
- Avoid storing sensitive health details when a generic leave category is enough.
- Add created/updated timestamps.
- Use seed scripts for predictable demo data.

Do not implement every proposed table if it adds unnecessary complexity. Prioritize the smallest coherent schema that supports the required end-to-end workflows, but leave the architecture extensible.

---

# 8. Suggested project folder structure

Use a clear, modular monolith. Exact names may be adjusted to match the installed Next.js version, but keep responsibilities separated.

```text
stara/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   ├── images/
│   ├── icons/
│   └── illustrations/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx
│   │   │   ├── demo/page.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (workspace)/
│   │   │   └── app/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx
│   │   │       ├── onboarding/page.tsx
│   │   │       ├── roadmap/page.tsx
│   │   │       ├── simulator/page.tsx
│   │   │       ├── templates/page.tsx
│   │   │       ├── templates/[id]/page.tsx
│   │   │       ├── thesis/page.tsx
│   │   │       ├── career/page.tsx
│   │   │       ├── achievements/page.tsx
│   │   │       ├── cv/page.tsx
│   │   │       ├── reminders/page.tsx
│   │   │       ├── check-ins/page.tsx
│   │   │       ├── profile/page.tsx
│   │   │       └── settings/page.tsx
│   │   ├── admin/
│   │   ├── api/
│   │   │   ├── roadmap/route.ts
│   │   │   ├── simulator/route.ts
│   │   │   ├── templates/route.ts
│   │   │   ├── thesis/route.ts
│   │   │   ├── reminders/route.ts
│   │   │   └── ai/route.ts
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── error.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── landing/
│   │   ├── dashboard/
│   │   ├── roadmap/
│   │   ├── simulator/
│   │   ├── templates/
│   │   ├── thesis/
│   │   ├── career/
│   │   ├── achievements/
│   │   └── shared/
│   ├── features/
│   │   ├── onboarding/
│   │   ├── roadmap/
│   │   ├── simulator/
│   │   ├── community/
│   │   ├── thesis/
│   │   ├── reminders/
│   │   └── achievements/
│   ├── server/
│   │   ├── auth/
│   │   ├── authorization/
│   │   ├── db/
│   │   │   └── prisma.ts
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── rules-engine/
│   │   ├── ai/
│   │   │   ├── provider.ts
│   │   │   ├── prompts.ts
│   │   │   ├── schemas.ts
│   │   │   └── fallback.ts
│   │   └── demo/
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   └── shared-schemas/
│   ├── types/
│   └── middleware.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

### Architecture rules

- `app/`: route composition and pages.
- `components/`: reusable UI, preferably presentation-focused.
- `features/`: feature-specific frontend logic and components.
- `server/services/`: business use cases.
- `server/repositories/`: database access.
- `server/rules-engine/`: deterministic academic calculations.
- `server/ai/`: AI provider, prompt templates, schemas, and fallback.
- `server/authorization/`: resource ownership and role checks.
- `middleware.ts`: lightweight routing/session handling only; never use it as the sole security boundary.
- `prisma/`: schema, migrations, seed data.
- `tests/`: unit, integration, and browser-level tests.

Do not import server-only modules into client components. Use server-only safeguards for database and AI modules.

---

# 9. API and server-side workflow

Prefer a small, coherent API. Exact endpoints may be adjusted if Server Actions are used consistently.

Suggested endpoints:

```text
POST   /api/demo/start
POST   /api/demo/reset

GET    /api/profile
PATCH  /api/profile
POST   /api/onboarding/complete

GET    /api/roadmap
POST   /api/roadmap/generate
PATCH  /api/roadmap/tasks/:taskId
POST   /api/roadmap/versions
POST   /api/roadmap/versions/:id/apply

POST   /api/simulator
GET    /api/simulator/:id
POST   /api/simulator/:id/apply

GET    /api/templates
GET    /api/templates/:id
POST   /api/templates
POST   /api/templates/:id/clone
POST   /api/templates/:id/vote
POST   /api/templates/:id/report
POST   /api/templates/:id/comments

POST   /api/thesis/assess
POST   /api/thesis/directions
POST   /api/thesis/advising-logs

GET    /api/reminders
POST   /api/reminders
PATCH  /api/reminders/:id

POST   /api/check-ins
POST   /api/achievements
PATCH  /api/achievements/:id
POST   /api/ai/explain-simulation
POST   /api/ai/thesis-directions
```

Implement only endpoints required by the pages. Do not create empty route files just to match the list.

For each mutation:
1. Authenticate or resolve the guest workspace.
2. Validate payload with Zod.
3. Authorize access to the target record.
4. Call a service.
5. Use a transaction when multiple related records must change atomically.
6. Return a typed response.
7. Handle errors consistently.
8. Avoid exposing internal stack traces.

---

# 10. Guest/demo mode

Guest mode is essential for competition judging.

## Required demo behavior

- Landing CTA **Try Demo** opens a ready-to-use seeded workspace.
- A demo user has a sample campus, program, academic profile, roadmap, reminders, achievements, and community templates.
- The user can navigate to every core feature without account creation.
- The user can modify the demo roadmap and run scenarios.
- Show a visible **Demo Workspace** indicator.
- Provide **Reset Demo** to restore a known starting state.
- Do not let one guest see another guest’s private changes.
- If the demo uses browser storage, label its persistence accurately. If server-backed guest sessions are implemented, use a random session token and appropriate expiry.
- Do not include real student personal information in seed data.

Create at least these demo records:
- One sample student in a generic sample institution/program.
- A multi-semester roadmap.
- Five scenario presets.
- Six to ten community templates with varied categories.
- Several comments and usefulness votes.
- Three reminders.
- Two thesis research directions.
- Three achievements.
- A small number of check-in records.

Make the seed deterministic so a demo reset always produces the same experience.

---

# 11. AI design: where to build it and what to use

## Important clarification

Do **not** “train a new AI model” from scratch for this 14-day competition prototype. That is unnecessary and unrealistic for the timeline. Use an existing language model through a server-side API, combine it with deterministic rules, and use curated knowledge/templates.

Build the AI module inside the monolithic Next.js project at:

```text
src/server/ai/
├── provider.ts
├── prompts.ts
├── schemas.ts
├── fallback.ts
└── service.ts
```

## AI responsibilities

1. Explain What-If results from trusted numeric calculations.
2. Produce 2–3 thesis research directions based on student input.
3. Explain feasibility, data requirements, and next steps.
4. Draft an editable supervisor email.
5. Rewrite student-entered achievements into clearer CV bullet points without inventing facts.
6. Offer contextual supportive messages from curated templates.

## What not to use AI for

- Computing SKS totals.
- Approving credit conversions.
- Determining official graduation eligibility.
- Inventing official deadlines.
- Diagnosing mental health.
- Generating fake achievements or citations.
- Making unreviewed changes to the active roadmap.

## AI service workflow

1. Frontend submits a minimal, validated request to a server endpoint.
2. Server checks session/ownership and validates input.
3. Service gathers only necessary context.
4. Rule engine calculates any numeric result first.
5. AI receives a structured summary and explicit instructions.
6. Validate the output against a Zod schema.
7. Reject or fall back if output is malformed, unsafe, or times out.
8. Display the result as a suggestion that the user can edit.
9. Log technical status without logging unnecessary sensitive input.

## Provider strategy

- Implement a provider interface so the model vendor can be changed.
- Use one existing hosted LLM API if credentials are available.
- Do not hard-code API keys.
- Store keys in server environment variables.
- Provide a local deterministic fallback.
- Keep the app functional when AI is disabled.
- Use low-cost settings and bounded output for the prototype.

If the project later gains sufficient approved data, evaluate retrieval-augmented generation (RAG) over verified institutional documents. Do not fine-tune a model or use student records for training in the MVP.

---

# 12. Security, privacy, and reliability

Minimum safeguards:
- Validate all inputs on the server.
- Enforce ownership checks for every private resource.
- Keep AI API keys and database credentials server-only.
- Use secure session handling and CSRF protections appropriate to the selected auth approach.
- Rate-limit or protect public write endpoints.
- Sanitize/render user-generated content safely.
- Validate URLs and uploaded file types if file uploads are introduced.
- Avoid unnecessary collection of health or other sensitive information.
- Provide a privacy notice describing demo persistence and AI processing.
- Use transactions for roadmap version application and template cloning.
- Never expose server stack traces in the UI.
- Add clear AI-generated-content labels where appropriate.

---

# 13. Design system and component guidance

Define tokens in CSS variables and Tailwind theme configuration.

Suggested palette:
- Background: `#0B0C0E`
- Elevated surface: `#141619`
- Secondary surface: `#1D2024`
- Primary text: `#F4F3EF`
- Secondary text: `#A5A7AD`
- Border: `#2C3035`
- Lime accent: `#D7F36A`
- Teal accent: `#45D6D0`
- Coral accent: `#FF7E8A`
- Blue accent: `#8588FF`

Use accent colors semantically and sparingly. Keep text readable on every background.

Create reusable components:
- `AppShell`
- `Sidebar`
- `Topbar`
- `PageHeader`
- `StatCard`
- `RoadmapTimeline`
- `SemesterCard`
- `MilestoneItem`
- `ProgressBar`
- `ScenarioBuilder`
- `ScenarioComparison`
- `AssumptionNotice`
- `TemplateCard`
- `TemplateFilters`
- `CommentThread`
- `ReminderItem`
- `EmptyState`
- `ErrorState`
- `LoadingSkeleton`
- `ConfirmApplyDialog`
- `DemoBanner`

Interaction standards:
- Confirm destructive or irreversible actions.
- Give immediate feedback on successful saves.
- Preserve form data on validation errors.
- Use skeletons for loading states.
- Use toast notifications only for concise status feedback.
- Avoid excessive animation; use subtle transitions and reduced-motion support.
- Use realistic seed content rather than lorem ipsum.

---

# 14. Suggested 14-day implementation plan

## Days 1–2: Foundation
- Initialize Next.js, TypeScript, Tailwind, Prisma, and PostgreSQL.
- Create design tokens and shared layout.
- Define the minimal Prisma schema.
- Seed the demo workspace.
- Implement guest entry and reset.

## Days 3–4: Onboarding and roadmap
- Build the multi-step onboarding wizard.
- Validate data with Zod.
- Generate a deterministic roadmap.
- Implement dashboard, timeline, task editing, and progress.

## Days 5–7: What-If Simulator
- Build pure TypeScript rules-engine functions.
- Implement all five scenario types at MVP depth.
- Add comparison UI and assumption notices.
- Save scenario results.
- Implement explicit apply/confirmation and roadmap version history.
- Add unit tests for calculations.

## Days 8–9: Community
- Build template listing, search, and filters.
- Implement template detail, clone, vote, comments, and report.
- Ensure clones are independent from originals.
- Add basic moderation controls or a protected minimal admin page.

## Days 10–11: Thesis and retention
- Build Thesis Compass questionnaire and result display.
- Implement editable supervisor email template and advising log.
- Build check-ins, reminders, and achievement records.

## Day 12: AI integration
- Add the server-side provider adapter.
- Implement simulation explanation and thesis-direction generation.
- Validate outputs and implement fallback behavior.
- If API credentials are unavailable, polish deterministic fallbacks rather than blocking the app.

## Days 13–14: QA and competition readiness
- Run lint and type checking.
- Run migrations and seed from a clean database.
- Test guest isolation, access control, and error states.
- Test at desktop, tablet, and mobile widths.
- Verify all primary buttons and navigation.
- Prepare a short demo script and reset procedure.
- Fix critical bugs before adding new features.

This is an aggressive plan. If time runs short, keep the complete onboarding → roadmap → simulator → apply → dashboard loop and working template discovery/clone. Simplify the career quiz, CV styling, and advanced AI first.

---

# 15. Acceptance criteria

The application is ready for the competition demo only when the following work:

## Core
- [ ] Guest Demo starts without registration.
- [ ] Onboarding accepts and validates academic data.
- [ ] Roadmap is generated and displayed.
- [ ] Tasks can be updated and progress persists according to the chosen storage mode.
- [ ] What-If scenario results are calculated deterministically.
- [ ] Assumptions and missing information are visible.
- [ ] Applying a scenario requires confirmation and preserves the prior version.
- [ ] A template can be searched, opened, cloned, and edited independently.
- [ ] Users can comment, vote as useful, and report content.
- [ ] Semester check-ins can update user-entered progress.
- [ ] Reminders can be created and completed.
- [ ] Thesis Compass produces editable guidance or a clearly labeled fallback.
- [ ] Achievement records can be selected for a basic CV/print view.

## Technical
- [ ] TypeScript strict mode passes.
- [ ] Lint passes.
- [ ] Database migration and seed work from a clean state.
- [ ] No API keys are exposed to client bundles.
- [ ] Server-side ownership checks are enforced.
- [ ] Core rules-engine unit tests pass.
- [ ] Errors and empty states are handled.
- [ ] Demo reset restores a predictable starting state.

## UI/UX
- [ ] Landing page follows the dark editorial reference direction.
- [ ] Desktop layout is polished at 1366×768 and 1440×900.
- [ ] Tablet and mobile layouts work without horizontal overflow.
- [ ] All interactive controls have visible focus and accessible labels.
- [ ] The primary demo can be completed without dead ends.

---

# 16. Required final deliverables from the coding agent

When implementation is complete, provide:

1. Working application source code.
2. Clear project folder structure.
3. Prisma schema and migrations.
4. Seed script and demo reset behavior.
5. `.env.example` with placeholder names only—never real secrets.
6. README with installation, database setup, migration, seed, development, and production instructions.
7. Description of where frontend, backend logic, middleware, rules engine, and AI module live.
8. List of completed features and any intentionally simplified features.
9. Test commands and actual test results.
10. A short demo walkthrough for judges.
11. A list of known limitations and the assumptions used for sample academic data.

Do not claim tests passed unless they were actually run. Do not claim a deployment or external integration exists unless it has been configured and verified.

---

# 17. Start implementation now

First inspect the current repository and available runtime. Then:

1. State a concise implementation plan.
2. Set up the monolithic TypeScript project.
3. Implement the shared visual system and landing page.
4. Implement guest/demo mode and seeded data.
5. Build the primary workflow end to end.
6. Add community templates.
7. Add the remaining supporting modules at MVP depth.
8. Run checks and fix errors.
9. Document how to run and demonstrate the application.

Do not stop after producing wireframes, architecture diagrams, or static HTML. Build the functioning application. If a feature cannot be completed within the available environment or time, implement a clearly labeled, useful fallback and document the limitation.
