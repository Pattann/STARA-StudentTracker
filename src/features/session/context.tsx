"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";

interface SessionContextType {
  token: string | null;
  isLoading: boolean;
  resetDemo: () => Promise<void>;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextType>({
  token: null,
  isLoading: true,
  resetDemo: async () => {},
  clearSession: () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem("stara_demo_token");
    setToken(t);
    setIsLoading(false);
  }, []);

  const resetDemo = useCallback(async () => {
    if (!token) return;
    const res = await fetch("/api/demo/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json() as { token?: string };
    if (data.token) {
      localStorage.setItem("stara_demo_token", data.token);
      setToken(data.token);
      router.refresh();
    }
  }, [token, router]);

  const clearSession = useCallback(() => {
    localStorage.removeItem("stara_demo_token");
    setToken(null);
    router.push("/");
  }, [router]);

  return (
    <SessionContext.Provider value={{ token, isLoading, resetDemo, clearSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
