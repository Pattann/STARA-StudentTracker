# STARA (Student Tracking and Academic Roadmap Assistant)

Platform web perencanaan studi bagi mahasiswa perguruan tinggi di Indonesia untuk menyusun peta jalan akademik per semester, mensimulasikan skenario akademik ("Bagaimana Jika"), menjelajahi template komunitas, dan mengelola progres 11 tahapan tugas akhir/skripsi.

---

# Link Deploy (VERCEL)
https://stara-student-tracker.vercel.app/


---

## Fitur Utama

1. **Onboarding & Profil Akademik Terukur**
   - Pemetaan semester aktif (Semester 1 hingga 10) dengan validasi rentang SKS kumulatif otomatis (17 sampai 24 SKS per semester lulus) serta validasi IPK.
   - Pembentukan rencana studi awal secara instan berdasarkan profil program studi dan target lulus.

2. **Peta Jalan Akademik (Roadmap)**
   - Visualisasi kurikulum per semester dalam mode kartu terstruktur dan diagram alur interaktif (*React Flow*).
   - Mode draf untuk menambah, mengubah, atau menghapus mata kuliah dan aktivitas akademik beserta ekspor laporan PDF.

3. **Simulator Skenario ("Bagaimana Jika") & Rencana Kustom AI**
   - Simulasi dampak pengambilan magang/MBKM, pertukaran pelajar, mata kuliah lanjut, atau cuti akademik terhadap beban SKS dan estimasi semester kelulusan.
   - Diskusi interaktif dan rekomendasi skenario alternatif berbasis Google Gemini AI dengan *fallback* mesin aturan deterministik.

4. **Template Komunitas & Moderasi**
   - Publikasi roadmap mahasiswa ke katalog komunitas dan adopsi template lintas program studi/target semester.

5. **Panduan Skripsi AI & Tracker 11 Tahapan**
   - Eksplorasi topik riset, penguji kelayakan judul skripsi (skor 0 sampai 100), dan konsultan skripsi AI 24/7.
   - Tracker 11 tahapan tugas akhir berurutan dengan validasi isian bermakna sebelum tahap dapat ditandai selesai (ACC Dosen Pembimbing).

6. **Pengingat Akademik & Check-in Semester**
   - Pencatatan tenggat KRS, evaluasi tengah semester, serta pengingat target pribadi yang tersinkronisasi penuh dengan basis data.

7. **Panel Administrator**
   - Ringkasan operasional sistem, moderasi pengajuan template komunitas, pengelolaan data perguruan tinggi dan distribusi semester, serta pemantauan latensi model AI.

---

## Arsitektur & Isolasi Backend (DevTools Protection)

Seluruh logika backend, koneksi basis data, dan pemanggilan AI berjalan 100% di sisi server (*Server-Only*) menggunakan Next.js App Router Route Handlers:

- **Zero Client Backend Exposure**: Tidak ada variabel `NEXT_PUBLIC_SUPABASE_*`, URL database, atau kunci API yang dikirim ke peramban. Semua modul di `src/server/` dan `src/lib/auth.ts` dilindungi dengan direktif `import "server-only"`.
- **Disabled Production Source Maps**: `productionBrowserSourceMaps: false` pada `next.config.ts` memastikan kode sumber TypeScript tidak pernah muncul di tab *Sources* DevTools.
- **Automatic Console Stripping**: `compiler.removeConsole` otomatis menghapus seluruh pemanggilan `console.*` pada bundle produksi sehingga tab *Console* DevTools bersih.
- **Sanitized Network Responses**: Seluruh endpoint `/api/*` mengembalikan pesan terstruktur tanpa membocorkan *stack trace*, struktur skema internal, ataupun kredensial server.

---

## Teknologi

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling & UI**: Tailwind CSS v4, Lucide Icons, React Flow (`@xyflow/react`), Recharts
- **Database & ORM**: Prisma ORM (mendukung SQLite untuk pengembangan lokal & PostgreSQL/Supabase untuk produksi)
- **AI Engine**: Google Gemini SDK (`@google/genai`) + Deterministic Academic Rules Engine

---

## Struktur Direktori

```text
stara/
├── prisma/
│   └── schema.prisma         # Skema basis data Prisma
├── public/                   # Aset statis dan ikon aplikasi
├── scripts/
│   └── prepare-db.mjs        # Penyesuaian otomatis provider SQLite / PostgreSQL (Supabase)
├── src/
│   ├── app/
│   │   ├── admin/            # Antarmuka Panel Administrator
│   │   ├── api/              # Server Route Handlers (Backend API terisolasi)
│   │   ├── app/              # Workspace Mahasiswa (Beranda, Roadmap, Simulator, Skripsi, dll.)
│   │   ├── demo/             # Inisialisasi ruang kerja demo
│   │   ├── login/            # Halaman masuk mahasiswa
│   │   ├── onboarding/       # Wizard pemetaan profil awal
│   │   └── signup/           # Halaman pendaftaran akun
│   ├── components/           # Komponen antarmuka bersama (AppShell, Avatar, Modal)
│   ├── features/             # Modul fitur (Onboarding, Kurikulum, Session, Template)
│   ├── lib/                  # Utilitas bersama & aturan validasi akademik/skripsi
│   └── server/               # Logika bisnis server-only (Prisma, AI Provider, Rules Engine)
├── .env.example              # Contoh konfigurasi environment variables
├── next.config.ts            # Konfigurasi produksi & keamanan Next.js
└── package.json
```

---

## Menjalankan Secara Lokal

1. **Instal dependensi**:
   ```bash
   npm install
   ```

2. **Salin berkas konfigurasi environment**:
   ```bash
   cp .env.example .env
   ```

3. **Sinkronkan skema basis data lokal (SQLite)**:
   ```bash
   npm run db:push
   ```

4. **Jalankan server pengembangan**:
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000` di peramban.

---

## Panduan Deployment ke Vercel & Supabase

Proyek ini dilengkapi skrip `scripts/prepare-db.mjs` yang secara otomatis mendeteksi protokol `DATABASE_URL`. Saat dijalankan lokal dengan `file:./dev.db`, Prisma memakai SQLite. Saat di-deploy ke Vercel dengan URL PostgreSQL dari Supabase, Prisma otomatis beralih ke `postgresql`.

### 1. Persiapan Database di Supabase
1. Buat proyek baru di [Supabase](https://supabase.com).
2. Buka menu **Project Settings -> Database -> Connection String (URI)**.
3. Salin dua URL koneksi berikut:
   - **Transaction Pooler (Port 6543)**: Gunakan sebagai `DATABASE_URL` (tambahkan `?pgbouncer=true` di akhir URL).
   - **Session Pooler / Direct Connection (Port 5432)**: Gunakan sebagai `DIRECT_URL`.

### 2. Push Skema Tabel ke Supabase
Jalankan perintah berikut dari terminal lokal dengan memasukkan URL Supabase untuk membuat seluruh tabel di Supabase:
```bash
DATABASE_URL="postgresql://..." DIRECT_URL="postgresql://..." npm run db:push
```

### 3. Deploy ke Vercel dari GitHub
1. Hubungkan repositori GitHub ini ke [Vercel](https://vercel.com/new).
2. Pada bagian **Environment Variables** di Vercel, tambahkan variabel berikut:
   - `DATABASE_URL`: URI Transaction Pooler Supabase (port 6543, `?pgbouncer=true`)
   - `DIRECT_URL`: URI Direct/Session Supabase (port 5432)
   - `HEALTH_CHECK_TOKEN`: Token rahasia untuk autentikasi endpoint `/api/health/database`
   - `NEXTAUTH_SECRET`: String acak panjang untuk enkripsi sesi
   - `AI_PROVIDER`: `google`
   - `GOOGLE_AI_API_KEY`: Kunci API Google Gemini (opsional, otomatis beralih ke mesin aturan jika dikosongkan)
3. Klik **Deploy**. Skrip `npm run build` akan otomatis mengonfigurasi Prisma untuk PostgreSQL, membuat Prisma Client, dan mem-build aplikasi produksi dengan proteksi DevTools aktif.

### 4. Verifikasi Health Check Database Production
Setelah deployment selesai dan `HEALTH_CHECK_TOKEN` terpasang di Vercel Environment Variables, uji koneksi Prisma ORM ke Supabase PostgreSQL beserta pemeriksaan tabel `public.connection_test` secara *read-only*:
```bash
curl -s -H "Authorization: Bearer <ISI_HEALTH_CHECK_TOKEN>" https://stara-student-tracker.vercel.app/api/health/database
```
Respons sukses:
```json
{
  "status": "success",
  "database": "connected",
  "provider": "postgresql",
  "checks": {
    "query": true,
    "connection_test_table": true
  }
}
```

