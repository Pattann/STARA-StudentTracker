"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface SessionContextType {
  token: string | null;
  user: UserInfo | null;
  isLoading: boolean;
  updateUser: (updates: Partial<UserInfo>) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextType>({
  token: null,
  user: null,
  isLoading: true,
  updateUser: () => {},
  clearSession: () => {},
});

const memoryCache = new Map<string, { data: unknown; timestamp: number }>();

export function getCachedRoadmap<T = unknown>(token: string | null): T | null {
  if (!token) return null;
  const key = `roadmap:${token}`;
  const mem = memoryCache.get(key);
  if (mem) return mem.data as T;
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as T;
        memoryCache.set(key, { data: parsed, timestamp: Date.now() });
        return parsed;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function setCachedRoadmap(token: string | null, data: unknown) {
  if (!token) return;
  const key = `roadmap:${token}`;
  if (!data) {
    memoryCache.delete(key);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
    return;
  }
  memoryCache.set(key, { data, timestamp: Date.now() });
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem("stara_demo_token");
    const u = localStorage.getItem("stara_user");
    setToken(t);
    if (u) {
      try {
        setUser(JSON.parse(u));
      } catch {
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  const updateUser = useCallback((updates: Partial<UserInfo>) => {
    setUser((prev) => {
      const next: UserInfo = {
        id: updates.id ?? prev?.id ?? "student-user",
        name: updates.name ?? prev?.name ?? "Mahasiswa STARA",
        email: updates.email ?? prev?.email ?? "mahasiswa@student.stara.ac.id",
        role: updates.role ?? prev?.role ?? "student",
      };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("stara_user", JSON.stringify(next));
        } catch {
          /* ignore */
        }
      }
      return next;
    });
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem("stara_demo_token");
    localStorage.removeItem("stara_user");
    memoryCache.clear();
    if (typeof window !== "undefined") {
      try {
        sessionStorage.clear();
      } catch {
        /* ignore */
      }
    }
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <SessionContext.Provider value={{ token, user, isLoading, updateUser, clearSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
