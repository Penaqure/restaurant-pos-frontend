"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { AlertCircle, ChefHat, Lock, LogIn, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A session can be cut off outside of this form -- e.g. a vendor gets
  // disabled while one of its users is mid-session, and axiosInstance's
  // interceptor redirects here. It stashes why before the hard redirect,
  // since a full page navigation wipes any component state.
  useEffect(() => {
    try {
      const notice = sessionStorage.getItem("billing_login_notice");
      if (notice) {
        setError(notice);
        sessionStorage.removeItem("billing_login_notice");
      }
    } catch {
      // sessionStorage can throw in private/blocked-storage contexts -- fine
      // to just skip showing the notice then.
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.firstName}`);
      router.push(user.role === "super_admin" ? "/platform" : "/dashboard");
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Invalid email or password";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[36rem] -translate-x-1/2 rounded-full bg-brand-300/30 blur-3xl"
      />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm space-y-5 rounded-xl border border-border bg-surface-card p-8 shadow-card"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-pop">
            <ChefHat className="size-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to manage your restaurant</p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-danger">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="email">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
              placeholder="you@restaurant.com"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9"
              placeholder="••••••••"
            />
          </div>
        </div>

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          {!submitting && <LogIn className="size-4" />}
          {submitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
