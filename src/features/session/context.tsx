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
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextType>({
  token: null,
  user: null,
  isLoading: true,
  clearSession: () => {},
});

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

  const clearSession = useCallback(() => {
    localStorage.removeItem("stara_demo_token");
    localStorage.removeItem("stara_user");
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <SessionContext.Provider value={{ token, user, isLoading, clearSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
