import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "STARA — Student Tracking and Academic Roadmap Assistant",
  description:
    "Roadmap akademik personal yang menyesuaikan rencana dan perubahan perjalanan kuliahmu.",
  keywords: ["roadmap akademik", "perencanaan kuliah", "mahasiswa", "skripsi", "IPK"],
  openGraph: {
    title: "STARA — Rencanakan Perjalanan Kuliahmu",
    description: "Asisten perencanaan akademik untuk mahasiswa Indonesia.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning style={{ backgroundColor: "#0B0D0C", colorScheme: "dark" }}>
      <body
        className={inter.variable}
        style={{
          backgroundColor: "#0B0D0C",
          color: "#F5F5F0",
          margin: 0,
          minHeight: "100vh",
        }}
      >
        {children}
      </body>
    </html>
  );
}
