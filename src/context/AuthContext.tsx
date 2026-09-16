"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { login as loginRequest, logout as logoutRequest, fetchMe, CurrentUser } from "@/services/authService";
import { clearAuth } from "@/lib/authStorage";

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
    // The auth cookie is httpOnly, so there's nothing to check client-side
    // before asking -- /auth/me itself is the source of truth for whether a
    // session is live.
    fetchMe()
      .then(setUser)
      .catch(() => clearAuth())
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    // The backend sets the auth cookie directly on this response (Set-Cookie);
    // no token ever passes through this JS.
    await loginRequest(email, password);
    const me = await fetchMe();
    setUser(me);
    return me;
  }

  function logout() {
    // Fire-and-forget: don't block navigation on the network round trip,
    // but still ask the server to clear the httpOnly cookie.
    logoutRequest().catch(() => {});
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
