import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { ModalScrollLock } from "@/components/shared/ModalScrollLock";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  style: ["normal"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "STARA — Student Tracking and Academic Roadmap Assistant",
  description:
    "Roadmap akademik personal yang menyesuaikan rencana dan perubahan perjalanan kuliahmu.",
  keywords: ["roadmap akademik", "perencanaan kuliah", "mahasiswa", "skripsi", "IPK"],
  icons: {
    icon: [
      { url: "/whitestara.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/whitestara.svg",
    apple: "/apple-icon.png",
  },
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
    <html lang="id" data-scroll-behavior="smooth" suppressHydrationWarning style={{ backgroundColor: "#FAF9F5", colorScheme: "light" }}>
      <body
        className={`${inter.variable} ${fraunces.variable}`}
        style={{
          backgroundColor: "#FAF9F5",
          color: "#18181B",
          margin: 0,
          minHeight: "100vh",
        }}
      >
        <ModalScrollLock />
        {children}
      </body>
    </html>
  );
}
