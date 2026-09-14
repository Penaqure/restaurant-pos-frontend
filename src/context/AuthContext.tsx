"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { login as loginRequest, fetchMe, CurrentUser } from "@/services/authService";
import { getToken, setToken, clearAuth } from "@/lib/authStorage";

type AuthContextValue = {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<CurrentUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then(setUser)
      .catch(() => clearAuth())
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { token } = await loginRequest(email, password);
    setToken(token);
    const me = await fetchMe();
    setUser(me);
    return me;
  }

  function logout() {
    clearAuth();
    setUser(null);
    router.push("/login");
  }

  // Re-pulls /auth/me so branding changes (logo, brand color) saved on the
  // settings page show up in the sidebar immediately, without a full reload.
  async function refreshUser() {
    const me = await fetchMe();
    setUser(me);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
