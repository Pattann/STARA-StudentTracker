"use client";

import { useSession } from "@/features/session/context";
import { CheckCircle2, Circle, ChevronRight, AlertCircle } from "lucide-react";

type CheckInQuestion = { id: string; label: string; type: "yes_no" | "text"; answer?: string | boolean };

const startSemesterQuestions: CheckInQuestion[] = [
  { id: "sksRealistic", label: "Apakah target SKS semester ini terasa realistis?", type: "yes_no" },
  { id: "scheduleCurrent", label: "Apakah jadwal/mata kuliah sudah sesuai rencana?", type: "yes_no" },
  { id: "workloadAdjust", label: "Apakah perlu penyesuaian beban kuliah?", type: "yes_no" },
  { id: "mainPriority", label: "Apa prioritas utama semester ini?", type: "text" },
];

const endSemesterQuestions: CheckInQuestion[] = [
  { id: "creditsPassed", label: "Berapa SKS yang berhasil kamu selesaikan?", type: "text" },
  { id: "milestoneDone", label: "Milestone apa yang berhasil dicapai?", type: "text" },
  { id: "delayedTasks", label: "Task mana yang tertunda?", type: "text" },
  { id: "goalChanged", label: "Apakah tujuan studimu berubah?", type: "yes_no" },
];

export default function CheckInsPage() {
  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>Riwayat Check-in</h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Pantau progres setiap awal dan akhir semester.</p>
      </div>

      <div className="assumption-notice" style={{ marginBottom: 20 }}>
        <AlertCircle size={16} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13 }}>Check-in tidak otomatis menandai mata kuliah lulus. Pembaruan dilakukan berdasarkan jawabanmu.</span>
      </div>

      {/* Demo Check-in Record */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Check-in Awal Semester 5</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>15 Agustus 2024</div>
          </div>
          <span className="badge badge-lime">Selesai</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { q: "Target SKS realistis?", a: "Ya" },
            { q: "Jadwal sesuai rencana?", a: "Ya" },
            { q: "Perlu penyesuaian beban?", a: "Tidak" },
            { q: "Prioritas utama", a: "Menyelesaikan proyek akhir mata kuliah basis data." },
          ].map((item) => (
            <div key={item.q} style={{ display: "flex", gap: 10, fontSize: 13 }}>
              <CheckCircle2 size={15} color="var(--lime)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ color: "var(--text-muted)" }}>{item.q}</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 600, marginLeft: "auto" }}>{item.a}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Check-in */}
      <div className="card" style={{ borderStyle: "dashed" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Check-in Akhir Semester 5</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Tersedia saat semester berakhir</div>
          </div>
          <span className="badge badge-gray">Menunggu</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Check-in akhir semester akan tersedia setelah kamu menandai semester berakhir di roadmap.</p>
        <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} disabled>
          Mulai Check-in
        </button>
      </div>
    </div>
  );
}
