export interface CatalogCourse {
  code: string;
  name: string;
  credits: number;
  semesterNum: number;
  category: "akademik" | "tak" | "karier" | "skripsi" | "pribadi";
  prerequisites?: string[];
  description: string;
}

export interface MajorCurriculum {
  majorName: string;
  courses: CatalogCourse[];
}

export const CURRICULUM_CATALOG: Record<string, CatalogCourse[]> = {
  "Teknik Informatika": [
    // Semester 1
    { code: "IF1101", name: "Pengantar Rekayasa & Komputasi", credits: 2, semesterNum: 1, category: "akademik", description: "Pengenalan dasar komputasi dan pemecahan masalah algoritmik." },
    { code: "IF1102", name: "Dasar Pemrograman (Python)", credits: 4, semesterNum: 1, category: "akademik", description: "Sintaks dasar, logika percabangan, perulangan, fungsi, dan struktur data sederhana." },
    { code: "MA1101", name: "Matematika Diskrit I", credits: 3, semesterNum: 1, category: "akademik", description: "Logika matematika, himpunan, relasi, fungsi, dan induksi matematika." },
    { code: "MA1102", name: "Kalkulus I", credits: 3, semesterNum: 1, category: "akademik", description: "Turunan fungsi, diferensial, dan aplikasi optimasi." },
    { code: "KU1101", name: "Bahasa Inggris Akademik", credits: 2, semesterNum: 1, category: "akademik", description: "Kecakapan menulis dan presentasi teknis berbahasa Inggris." },

    // Semester 2
    { code: "IF1201", name: "Algoritma & Struktur Data", credits: 4, semesterNum: 2, category: "akademik", prerequisites: ["IF1102"], description: "Pointer, linked list, stack, queue, tree, dan graph dalam C/C++." },
    { code: "IF1202", name: "Organisasi & Arsitektur Komputer", credits: 3, semesterNum: 2, category: "akademik", description: "Struktur CPU, memori, instruksi assembly, dan arsitektur bus." },
    { code: "MA1201", name: "Aljabar Linier & Matriks", credits: 3, semesterNum: 2, category: "akademik", description: "Operasi matriks, sistem persamaan linier, vektor, dan transformasi geometris." },
    { code: "MA1202", name: "Kalkulus II", credits: 3, semesterNum: 2, category: "akademik", description: "Integral tentu, tak tentu, dan integral lipat." },

    // Semester 3
    { code: "IF2101", name: "Pemrograman Berorientasi Objek (OOP)", credits: 3, semesterNum: 3, category: "akademik", prerequisites: ["IF1201"], description: "Class, object, inheritance, polymorphism, encapsulation, dan GUI dalam Java/TypeScript." },
    { code: "IF2102", name: "Basis Data & Perancangan Relasional", credits: 4, semesterNum: 3, category: "akademik", description: "ER-Diagram, normalisasi database, query SQL, dan indexing." },
    { code: "IF2103", name: "Sistem Operasi", credits: 3, semesterNum: 3, category: "akademik", prerequisites: ["IF1202"], description: "Manajemen proses, threads, konkurensi, memori virtual, dan file system." },
    { code: "IF2104", name: "Strategi Algoritma", credits: 3, semesterNum: 3, category: "akademik", prerequisites: ["IF1201"], description: "Divide and conquer, greedy, dynamic programming, dan branch and bound." },

    // Semester 4 (20 SKS)
    { code: "IF2201", name: "Rekayasa Perangkat Lunak (RPL)", credits: 3, semesterNum: 4, category: "akademik", prerequisites: ["IF2101"], description: "SDLC, Scrum/Agile, analisis kebutuhan sistem, dan testing software." },
    { code: "IF2202", name: "Jaringan Komputer", credits: 3, semesterNum: 4, category: "akademik", prerequisites: ["IF2103"], description: "OSI Layer, TCP/IP, routing, subnetting, dan socket programming." },
    { code: "IF2203", name: "Probabilitas & Statistika Komputasi", credits: 3, semesterNum: 4, category: "akademik", description: "Distribusi probabilitas, regresi linier, pengujian hipotesis, dan data analytics." },
    { code: "IF2204", name: "Interaksi Manusia & Komputer (UI/UX)", credits: 3, semesterNum: 4, category: "akademik", description: "Prinsip desain UX, wireframing Figma, usability testing, dan aksesibilitas web." },
    { code: "IF2205", name: "Teori Bahasa & Otomata", credits: 3, semesterNum: 4, category: "akademik", description: "Finite state automata, regular grammar, pushdown automata, dan mesin Turing." },
    { code: "IF2206", name: "Pemrograman Berorientasi Objek Lanjut", credits: 3, semesterNum: 4, category: "akademik", prerequisites: ["IF2101"], description: "Design patterns, concurrent programming, dan arsitektur modular." },
    { code: "KU2001", name: "Pancasila & Kewarganegaraan", credits: 2, semesterNum: 4, category: "akademik", description: "Pendidikan kebangsaan, integritas moral, dan etika warga negara." },

    // Semester 5 (19 SKS)
    { code: "IF3101", name: "Kecerdasan Buatan & Pembelajaran Mesin", credits: 4, semesterNum: 5, category: "akademik", prerequisites: ["IF2104", "IF2203"], description: "Algoritma supervised & unsupervised learning, decision tree, neural network, dan evaluasi model." },
    { code: "IF3102", name: "Pengembangan Aplikasi Web Lanjut", credits: 3, semesterNum: 5, category: "akademik", prerequisites: ["IF2102"], description: "Next.js, REST API, GraphQL, authentication JWT/OAuth, dan web deployment." },
    { code: "IF3103", name: "Basis Data Terdistribusi & Big Data", credits: 3, semesterNum: 5, category: "akademik", prerequisites: ["IF2102"], description: "NoSQL (MongoDB/Redis), sharding, replikasi data, dan Apache Spark." },
    { code: "IF3104", name: "Keamanan Informasi & Kriptografi", credits: 3, semesterNum: 5, category: "akademik", description: "Enkripsi simetrik/asimetrik, hash SHA, SSL/TLS, ethical hacking, dan OWASP Top 10." },
    { code: "IF3105", name: "Sistem Operasi Lanjut & Virtualisasi", credits: 3, semesterNum: 5, category: "akademik", description: "Kernel programming, containers Docker, dan hypervisor management." },
    { code: "IF3106", name: "Analisis & Desain Algoritma Kompleks", credits: 3, semesterNum: 5, category: "akademik", description: "Graph algorithms lanjut, NP-completeness, dan optimasi heuristik." },

    // Semester 6 (19 SKS)
    { code: "IF3201", name: "Sistem Terdistribusi & Cloud Computing", credits: 3, semesterNum: 6, category: "akademik", description: "Microservices architecture, Docker, Kubernetes, dan cloud AWS/GCP." },
    { code: "IF3202", name: "Pra-Tugas Akhir & Metodologi Penelitian", credits: 2, semesterNum: 6, category: "skripsi", description: "Penulisan karya ilmiah ilmiah, penelusuran pustaka IEEE/Scopus, dan draf proposal skripsi." },
    { code: "IF3203", name: "Kerja Praktik / Magang Industri (KP)", credits: 3, semesterNum: 6, category: "karier", description: "Praktik kerja di perusahaan teknologi selama 2-3 bulan." },
    { code: "IF3204", name: "Pemrosesan Bahasa Alami (NLP)", credits: 3, semesterNum: 6, category: "akademik", description: "Tokenisasi, word embeddings, transformer architecture, dan Large Language Models (LLM)." },
    { code: "IF3205", name: "Rekayasa Kebutuhan & Kualitas Perangkat Lunak", credits: 3, semesterNum: 6, category: "akademik", description: "Requirement engineering, automated QA testing, CI/CD pipeline, dan TDD." },
    { code: "IF3206", name: "Internet of Things (IoT) & Embedded System", credits: 3, semesterNum: 6, category: "akademik", description: "Sensor, mikrokontroler ESP32/Raspberry Pi, dan protokol MQTT/CoAP." },
    { code: "IF3207", name: "Kapita Selekta Informatika I", credits: 2, semesterNum: 6, category: "akademik", description: "Kuliah praktisi industri tentang tren software architecture modern." },

    // Semester 7 (19 SKS Reguler atau 20 SKS MBKM)
    { code: "IF4101", name: "Program MBKM Magang Bersertifikat", credits: 20, semesterNum: 7, category: "karier", description: "Konversi SKS magang industri penuh 1 semester di perusahaan mitra resmi." },
    { code: "IF4102", name: "Seminar Proposal Skripsi", credits: 2, semesterNum: 7, category: "skripsi", prerequisites: ["IF3202"], description: "Ujian dan presentasi proposal Tugas Akhir di hadapan dewan penguji." },
    { code: "IF4103", name: "Etika Profesi & Hukum Teknologi", credits: 2, semesterNum: 7, category: "akademik", description: "UU ITE, hak cipta software, etika kecerdasan buatan, dan tanggung jawab profesional." },
    { code: "IF4104", name: "Proyek Capstone Rekayasa Terpadu", credits: 4, semesterNum: 7, category: "akademik", description: "Pengembangan produk software komprehensif skala produksi secara berkelompok." },
    { code: "IF4105", name: "Tata Kelola TI & Manajemen Proyek", credits: 3, semesterNum: 7, category: "akademik", description: "IT governance COBIT, ITIL, risk management, dan kepemimpinan tim teknologi." },
    { code: "IF4106", name: "Peminatan: Cloud Architecture & DevOps", credits: 3, semesterNum: 7, category: "akademik", description: "Infrastructure as Code (Terraform), serverless architecture, dan site reliability." },
    { code: "IF4107", name: "Peminatan: Computer Vision & AI Terapan", credits: 3, semesterNum: 7, category: "akademik", description: "Object detection YOLO, segmentation, OpenCV, dan deep learning PyTorch." },
    { code: "IF4108", name: "Technopreneurship & Inovasi Bisnis Digital", credits: 2, semesterNum: 7, category: "akademik", description: "Validasi ide startup, lean canvas model, pitch deck, dan valuasi produk." },

    // Semester 8 (8 SKS)
    { code: "IF4201", name: "Tugas Akhir / Skripsi", credits: 6, semesterNum: 8, category: "skripsi", prerequisites: ["IF4102"], description: "Penyusunan naskah riset/produk inovatif, bimbingan dosen, dan sidang sarjana." },
    { code: "IF4202", name: "Kolokium & Publikasi Ilmiah", credits: 2, semesterNum: 8, category: "skripsi", description: "Publikasi paper prosiding nasional atau jurnal terindeks Sinta/Scopus." },
  ],

  "Manajemen": [
    { code: "MN1101", name: "Pengantar Manajemen & Bisnis", credits: 3, semesterNum: 1, category: "akademik", description: "Fungsi-fungsi manajemen: planning, organizing, leading, dan controlling." },
    { code: "MN1102", name: "Pengantar Akuntansi I", credits: 3, semesterNum: 1, category: "akademik", description: "Siklus akuntansi, jurnal penyesuaian, neraca, dan laporan laba rugi." },
    { code: "MN2101", name: "Manajemen Pemasaran", credits: 3, semesterNum: 3, category: "akademik", description: "Bauran pemasaran 4P/7P, riset pasar, segmentasi, targeting, dan positioning." },
    { code: "MN2102", name: "Manajemen Keuangan Korporat", credits: 3, semesterNum: 3, category: "akademik", description: "Nilai waktu uang (TVM), capital budgeting, dan struktur modal." },
    { code: "MN3101", name: "Manajemen Strategis", credits: 3, semesterNum: 5, category: "akademik", description: "Analisis SWOT, Porter Five Forces, dan implementasi strategi korporasi." },
    { code: "MN3201", name: "Magang Bisnis & Kewirausahaan", credits: 4, semesterNum: 6, category: "karier", description: "Pengalaman praktik manajerial di unit bisnis atau startup." },
    { code: "MN4101", name: "Program MBKM Studi Independen Bisnis", credits: 20, semesterNum: 7, category: "karier", description: "Konversi SKS magang profesional divisi Human Resource / Marketing." },
    { code: "MN4201", name: "Skripsi Manajemen", credits: 6, semesterNum: 8, category: "skripsi", description: "Penelitian empiris manajemen dan sidang sarjana." },
  ],
};

export const MILESTONE_TEMPLATES = [
  {
    title: "Persiapan CV & Portofolio Magang",
    category: "karier",
    credits: 0,
    notes: "Review ATS CV, buat akun LinkedIn profesional, dan kumpulkan studi kasus proyek.",
    defaultSemester: 5,
  },
  {
    title: "Sertifikasi Profesional (AWS / Google Cloud / Scrum)",
    category: "karier",
    credits: 0,
    notes: "Daftar ujian sertifikasi internasional untuk meningkatkan daya saing karier.",
    defaultSemester: 6,
  },
  {
    title: "Target Poin TAK / Kegiatan Kampus (30 Poin)",
    category: "tak",
    credits: 0,
    notes: "Aktif kepanitiaan organisasi, seminar nasional, atau workshop kemahasiswaan.",
    defaultSemester: 5,
  },
  {
    title: "Partisipasi Kompetisi / Hackathon / PKM",
    category: "pribadi",
    credits: 0,
    notes: "Bentuk tim lintas disiplin untuk mengikuti perlombaan inovasi mahasiswa.",
    defaultSemester: 6,
  },
  {
    title: "Eksplorasi Calon Dosen Pembimbing Skripsi",
    category: "skripsi",
    credits: 0,
    notes: "Konsultasikan topik minat riset dengan dosen yang memiliki keahlian sebidang.",
    defaultSemester: 6,
  },
  {
    title: "Penyusunan Draf Bab 1–3 Tugas Akhir",
    category: "skripsi",
    credits: 0,
    notes: "Tuntaskan latar belakang masalah, tinjauan pustaka, dan metodologi sebelum sempro.",
    defaultSemester: 7,
  },
];
