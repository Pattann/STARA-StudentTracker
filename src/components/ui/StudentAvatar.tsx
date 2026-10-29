"use client";

import React, { useEffect, useState } from "react";

export interface AvatarOption {
  id: string;
  name: string;
  trait: string;
  bg: string;
  border: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: "fox",
    name: "Rubah Cerdik",
    trait: "Strategis & Adaptif",
    bg: "linear-gradient(135deg, #FFEDD5 0%, #FED7AA 100%)",
    border: "#FB923C",
  },
  {
    id: "owl",
    name: "Burung Hantu",
    trait: "Riset & Analitis",
    bg: "linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)",
    border: "#8B5CF6",
  },
  {
    id: "cat",
    name: "Kucing Kampus",
    trait: "Kreatif & Mandiri",
    bg: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
    border: "#F59E0B",
  },
  {
    id: "panda",
    name: "Panda Fokus",
    trait: "Tenang & Konsisten",
    bg: "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)",
    border: "#10B981",
  },
  {
    id: "bear",
    name: "Beruang Tangguh",
    trait: "Tekun & Disiplin",
    bg: "linear-gradient(135deg, #F5EFE6 0%, #E6D5B8 100%)",
    border: "#B45309",
  },
  {
    id: "koala",
    name: "Koala Santai",
    trait: "Seimbang & Rileks",
    bg: "linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)",
    border: "#0284C7",
  },
  {
    id: "rabbit",
    name: "Kelinci Gesit",
    trait: "Cepat & Produktif",
    bg: "linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)",
    border: "#EC4899",
  },
  {
    id: "lion",
    name: "Singa Ambisius",
    trait: "Kepemimpinan & Organisasi",
    bg: "linear-gradient(135deg, #FEF08A 0%, #FDE047 100%)",
    border: "#CA8A04",
  },
  {
    id: "penguin",
    name: "Pinguin Eksplor",
    trait: "Kolaboratif & Inovatif",
    bg: "linear-gradient(135deg, #CFFAFE 0%, #A5F3FC 100%)",
    border: "#0891B2",
  },
  {
    id: "initial",
    name: "Inisial Nama",
    trait: "Gaya Klasik",
    bg: "linear-gradient(135deg, rgba(245, 205, 71, 0.25) 0%, rgba(245, 205, 71, 0.45) 100%)",
    border: "#D97706",
  },
];

const STORAGE_KEY_PREFIX = "stara_student_avatar_";
const EVENT_NAME = "stara-avatar-updated";

export function getSavedAvatarId(userId?: string): string {
  if (typeof window === "undefined") return "fox";
  const userKey = userId ? `${STORAGE_KEY_PREFIX}${userId}` : `${STORAGE_KEY_PREFIX}default`;
  return (
    localStorage.getItem(userKey) ||
    localStorage.getItem(`${STORAGE_KEY_PREFIX}default`) ||
    "fox"
  );
}

export function setSavedAvatarId(avatarId: string, userId?: string): void {
  if (typeof window === "undefined") return;
  const userKey = userId ? `${STORAGE_KEY_PREFIX}${userId}` : `${STORAGE_KEY_PREFIX}default`;
  localStorage.setItem(userKey, avatarId);
  localStorage.setItem(`${STORAGE_KEY_PREFIX}default`, avatarId);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { avatarId, userId } }));
}

export function useStudentAvatar(userId?: string): [string, (id: string) => void] {
  const [avatarId, setAvatarIdState] = useState<string>("fox");

  useEffect(() => {
    setAvatarIdState(getSavedAvatarId(userId));

    const handleUpdate = () => {
      setAvatarIdState(getSavedAvatarId(userId));
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [userId]);

  const updateAvatar = (newId: string) => {
    setAvatarIdState(newId);
    setSavedAvatarId(newId, userId);
  };

  return [avatarId, updateAvatar];
}

export function AnimalSvg({ id, initial = "M" }: { id: string; initial?: string }) {
  switch (id) {
    case "fox":
      return (
        <svg viewBox="0 0 64 64" width="78%" height="78%" aria-hidden="true">
          {/* Ears */}
          <polygon points="12,10 26,22 14,30" fill="#EA580C" />
          <polygon points="15,14 23,22 16,27" fill="#FED7AA" />
          <polygon points="52,10 38,22 50,30" fill="#EA580C" />
          <polygon points="49,14 41,22 48,27" fill="#FED7AA" />
          {/* Head */}
          <ellipse cx="32" cy="36" rx="20" ry="17" fill="#F97316" />
          {/* White Cheeks */}
          <path d="M12,37 Q22,32 32,48 L16,47 Z" fill="#FFF7ED" />
          <path d="M52,37 Q42,32 32,48 L48,47 Z" fill="#FFF7ED" />
          {/* Eyes */}
          <circle cx="24" cy="34" r="2.8" fill="#18181B" />
          <circle cx="25" cy="33" r="1" fill="#FFFFFF" />
          <circle cx="40" cy="34" r="2.8" fill="#18181B" />
          <circle cx="41" cy="33" r="1" fill="#FFFFFF" />
          {/* Nose */}
          <polygon points="29,42 35,42 32,46" fill="#18181B" />
        </svg>
      );

    case "owl":
      return (
        <svg viewBox="0 0 64 64" width="78%" height="78%" aria-hidden="true">
          {/* Ear Tufts */}
          <polygon points="14,16 24,22 18,28" fill="#6D28D9" />
          <polygon points="50,16 40,22 46,28" fill="#6D28D9" />
          {/* Head/Body */}
          <circle cx="32" cy="36" r="19" fill="#7C3AED" />
          <ellipse cx="32" cy="43" rx="12" ry="9" fill="#EDE9FE" />
          {/* Big Glasses / Eyes */}
          <circle cx="24" cy="31" r="7.5" fill="#FFFFFF" stroke="#4C1D95" strokeWidth="2" />
          <circle cx="40" cy="31" r="7.5" fill="#FFFFFF" stroke="#4C1D95" strokeWidth="2" />
          <line x1="31.5" y1="31" x2="32.5" y2="31" stroke="#4C1D95" strokeWidth="2" />
          <circle cx="24" cy="31" r="3.2" fill="#18181B" />
          <circle cx="25" cy="29.8" r="1.1" fill="#FFFFFF" />
          <circle cx="40" cy="31" r="3.2" fill="#18181B" />
          <circle cx="41" cy="29.8" r="1.1" fill="#FFFFFF" />
          {/* Beak */}
          <polygon points="29,36 35,36 32,42" fill="#F59E0B" />
        </svg>
      );

    case "cat":
      return (
        <svg viewBox="0 0 64 64" width="78%" height="78%" aria-hidden="true">
          {/* Ears */}
          <polygon points="14,12 27,22 15,31" fill="#D97706" />
          <polygon points="17,16 24,22 17,27" fill="#FBCFE8" />
          <polygon points="50,12 37,22 49,31" fill="#D97706" />
          <polygon points="47,16 40,22 47,27" fill="#FBCFE8" />
          {/* Head */}
          <ellipse cx="32" cy="36" rx="19" ry="16" fill="#F59E0B" />
          {/* Forehead stripes */}
          <path d="M28,22 L28,27 M32,21 L32,28 M36,22 L36,27" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
          {/* Eyes */}
          <circle cx="24" cy="34" r="2.8" fill="#18181B" />
          <circle cx="25" cy="33" r="1" fill="#FFFFFF" />
          <circle cx="40" cy="34" r="2.8" fill="#18181B" />
          <circle cx="41" cy="33" r="1" fill="#FFFFFF" />
          {/* Nose & Mouth */}
          <polygon points="29.5,39 34.5,39 32,42" fill="#EC4899" />
          <path d="M28,44 Q30,46 32,43 Q34,46 36,44" fill="none" stroke="#18181B" strokeWidth="1.8" strokeLinecap="round" />
          {/* Whiskers */}
          <path d="M12,37 L19,38 M12,41 L19,41 M52,37 L45,38 M52,41 L45,41" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case "panda":
      return (
        <svg viewBox="0 0 64 64" width="78%" height="78%" aria-hidden="true">
          {/* Ears */}
          <circle cx="16" cy="18" r="7" fill="#18181B" />
          <circle cx="48" cy="18" r="7" fill="#18181B" />
          {/* Head */}
          <ellipse cx="32" cy="36" rx="20" ry="17" fill="#FFFFFF" stroke="#E4E4E7" strokeWidth="1.5" />
          {/* Eye Patches */}
          <ellipse cx="23" cy="34" rx="5.5" ry="6.5" transform="rotate(-15 23 34)" fill="#18181B" />
          <ellipse cx="41" cy="34" rx="5.5" ry="6.5" transform="rotate(15 41 34)" fill="#18181B" />
          {/* Eyes */}
          <circle cx="24" cy="33" r="2" fill="#FFFFFF" />
          <circle cx="40" cy="33" r="2" fill="#FFFFFF" />
          {/* Blush */}
          <ellipse cx="17" cy="41" rx="3" ry="1.8" fill="#FDA4AF" />
          <ellipse cx="47" cy="41" rx="3" ry="1.8" fill="#FDA4AF" />
          {/* Nose & Mouth */}
          <ellipse cx="32" cy="40" rx="3" ry="2" fill="#18181B" />
          <path d="M29,44 Q32,47 35,44" fill="none" stroke="#18181B" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case "bear":
      return (
        <svg viewBox="0 0 64 64" width="78%" height="78%" aria-hidden="true">
          {/* Ears */}
          <circle cx="16" cy="19" r="7" fill="#92400E" />
          <circle cx="16" cy="19" r="3.8" fill="#FDE68A" />
          <circle cx="48" cy="19" r="7" fill="#92400E" />
          <circle cx="48" cy="19" r="3.8" fill="#FDE68A" />
          {/* Head */}
          <ellipse cx="32" cy="36" rx="19.5" ry="17" fill="#B45309" />
          {/* Snout */}
          <ellipse cx="32" cy="41" rx="7.5" ry="6" fill="#FEF3C7" />
          {/* Eyes */}
          <circle cx="24" cy="32" r="2.6" fill="#18181B" />
          <circle cx="24.8" cy="31" r="0.9" fill="#FFFFFF" />
          <circle cx="40" cy="32" r="2.6" fill="#18181B" />
          <circle cx="40.8" cy="31" r="0.9" fill="#FFFFFF" />
          {/* Nose */}
          <ellipse cx="32" cy="39" rx="3.2" ry="2.2" fill="#451A03" />
          <path d="M32,41 L32,44 M29,44 Q32,46 35,44" fill="none" stroke="#451A03" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );

    case "koala":
      return (
        <svg viewBox="0 0 64 64" width="78%" height="78%" aria-hidden="true">
          {/* Big Fluffy Ears */}
          <circle cx="13" cy="28" r="9.5" fill="#64748B" />
          <circle cx="13" cy="28" r="5.5" fill="#F1F5F9" />
          <circle cx="51" cy="28" r="9.5" fill="#64748B" />
          <circle cx="51" cy="28" r="5.5" fill="#F1F5F9" />
          {/* Head */}
          <ellipse cx="32" cy="36" rx="18" ry="16" fill="#94A3B8" />
          {/* Eyes */}
          <circle cx="24" cy="33" r="2.5" fill="#1E293B" />
          <circle cx="24.8" cy="32.2" r="0.9" fill="#FFFFFF" />
          <circle cx="40" cy="33" r="2.5" fill="#1E293B" />
          <circle cx="40.8" cy="32.2" r="0.9" fill="#FFFFFF" />
          {/* Big Koala Nose */}
          <ellipse cx="32" cy="38" rx="4.2" ry="5.8" fill="#334155" />
          {/* Blush */}
          <ellipse cx="20" cy="39" rx="2.8" ry="1.6" fill="#FDA4AF" />
          <ellipse cx="44" cy="39" rx="2.8" ry="1.6" fill="#FDA4AF" />
        </svg>
      );

    case "rabbit":
      return (
        <svg viewBox="0 0 64 64" width="78%" height="78%" aria-hidden="true">
          {/* Long Ears */}
          <ellipse cx="24" cy="17" rx="4.8" ry="12" transform="rotate(-8 24 17)" fill="#FFFFFF" stroke="#F472B6" strokeWidth="1.5" />
          <ellipse cx="24" cy="17" rx="2.4" ry="8" transform="rotate(-8 24 17)" fill="#FBCFE8" />
          <ellipse cx="40" cy="17" rx="4.8" ry="12" transform="rotate(8 40 17)" fill="#FFFFFF" stroke="#F472B6" strokeWidth="1.5" />
          <ellipse cx="40" cy="17" rx="2.4" ry="8" transform="rotate(8 40 17)" fill="#FBCFE8" />
          {/* Head */}
          <ellipse cx="32" cy="39" rx="17.5" ry="14.5" fill="#FFFFFF" stroke="#F472B6" strokeWidth="1.5" />
          {/* Eyes */}
          <circle cx="25" cy="37" r="2.5" fill="#18181B" />
          <circle cx="25.8" cy="36.2" r="0.9" fill="#FFFFFF" />
          <circle cx="39" cy="37" r="2.5" fill="#18181B" />
          <circle cx="39.8" cy="36.2" r="0.9" fill="#FFFFFF" />
          {/* Cheeks */}
          <ellipse cx="19" cy="41" rx="3" ry="1.8" fill="#F9A8D4" />
          <ellipse cx="45" cy="41" rx="3" ry="1.8" fill="#F9A8D4" />
          {/* Pink Nose */}
          <polygon points="30,41 34,41 32,43.5" fill="#EC4899" />
          <path d="M29.5,45 Q32,47 34.5,45" fill="none" stroke="#18181B" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case "lion":
      return (
        <svg viewBox="0 0 64 64" width="78%" height="78%" aria-hidden="true">
          {/* Fluffy Mane */}
          <circle cx="32" cy="35" r="22" fill="#B45309" />
          {/* Ears */}
          <circle cx="18" cy="19" r="5" fill="#F59E0B" />
          <circle cx="46" cy="19" r="5" fill="#F59E0B" />
          {/* Face */}
          <circle cx="32" cy="36" r="15.5" fill="#FBBF24" />
          {/* Eyes */}
          <circle cx="26" cy="33" r="2.4" fill="#18181B" />
          <circle cx="38" cy="33" r="2.4" fill="#18181B" />
          {/* Snout */}
          <ellipse cx="32" cy="40" rx="6" ry="4.5" fill="#FEF3C7" />
          <polygon points="29.5,38 34.5,38 32,41" fill="#78350F" />
          <path d="M29,43 Q32,45 35,43" fill="none" stroke="#78350F" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );

    case "penguin":
      return (
        <svg viewBox="0 0 64 64" width="78%" height="78%" aria-hidden="true">
          {/* Head */}
          <ellipse cx="32" cy="36" rx="19" ry="18" fill="#1E293B" />
          {/* White Face Patch */}
          <path d="M18,36 C18,26 26,26 32,31 C38,26 46,26 46,36 C46,46 39,51 32,51 C25,51 18,46 18,36 Z" fill="#FFFFFF" />
          {/* Eyes */}
          <circle cx="25" cy="34" r="2.6" fill="#0F172A" />
          <circle cx="25.8" cy="33.2" r="0.9" fill="#FFFFFF" />
          <circle cx="39" cy="34" r="2.6" fill="#0F172A" />
          <circle cx="39.8" cy="33.2" r="0.9" fill="#FFFFFF" />
          {/* Blush */}
          <ellipse cx="20" cy="39" rx="2.6" ry="1.5" fill="#FDA4AF" />
          <ellipse cx="44" cy="39" rx="2.6" ry="1.5" fill="#FDA4AF" />
          {/* Beak */}
          <polygon points="28,38 36,38 32,43" fill="#F97316" />
        </svg>
      );

    case "initial":
    default:
      return (
        <span
          style={{
            fontWeight: 800,
            color: "var(--text-primary)",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          {initial}
        </span>
      );
  }
}

export function StudentAvatarBadge({
  avatarId,
  initial = "M",
  size = 48,
  onClick,
  showEditHint = false,
  title,
}: {
  avatarId: string;
  initial?: string;
  size?: number;
  onClick?: () => void;
  showEditHint?: boolean;
  title?: string;
}) {
  const option = AVATAR_OPTIONS.find((o) => o.id === avatarId) || AVATAR_OPTIONS[0];

  return (
    <div
      onClick={onClick}
      title={title || `${option.name} (${option.trait})`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: option.bg,
        border: `2px solid ${option.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.38),
        fontWeight: 800,
        color: "var(--text-primary)",
        flexShrink: 0,
        position: "relative",
        cursor: onClick ? "pointer" : "default",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      <AnimalSvg id={option.id} initial={initial} />
      {showEditHint && (
        <span
          style={{
            position: "absolute",
            right: -2,
            bottom: -2,
            width: Math.max(18, Math.round(size * 0.36)),
            height: Math.max(18, Math.round(size * 0.36)),
            borderRadius: "50%",
            background: "var(--text-primary)",
            color: "#FFFFFF",
            border: "2px solid var(--bg-elevated)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 9,
            fontWeight: 700,
          }}
        >
          ✎
        </span>
      )}
    </div>
  );
}

