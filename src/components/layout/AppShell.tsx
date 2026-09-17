"use client";

import { ReactNode, useEffect, useState, CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChefHat, ChevronDown, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useBranch } from "@/context/BranchContext";
import { buildBrandRamp } from "@/lib/brandColor";
import NotificationBell from "@/components/layout/NotificationBell";
import ThemeToggle from "@/components/layout/ThemeToggle";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/api\/?$/, "");

export default function AppShell({
  title,
  backHref,
  nav,
  children,
}: {
  title: string;
  // A details page (a specific bill/order/menu item/vendor) passes the URL
  // of the list it was reached from -- a real link rather than
  // router.back() so it still goes somewhere sensible when the page was
  // opened directly (a bookmark, a shared link, a refresh) rather than
  // navigated to from within the app.
  backHref?: string;
  nav?: ReactNode;
  children: ReactNode;
}) {
  const { user, logout } = useAuth();
  const { branches, activeBranchId, canSwitch, setBranch } = useBranch();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "";
  const brandVars = buildBrandRamp(user?.vendor?.brandColor);

  // The browser tab icon should mirror whatever logo is showing as the
  // "default" logo in the sidebar above -- the vendor's uploaded logo once
  // set, falling back to the app's own icon when the vendor has none.
  const logoUrl = user?.vendor?.logoUrl;
  useEffect(() => {
    const href = logoUrl ? `${API_ORIGIN}${logoUrl}` : "/favicon.ico";
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [logoUrl]);

  return (
    <div className="flex min-h-screen" style={brandVars as CSSProperties}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface-card transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-600 text-white shadow-pop">
            {user?.vendor?.logoUrl ? (
              <Image
                src={`${API_ORIGIN}${user.vendor.logoUrl}`}
                alt={user.vendor.name}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <ChefHat className="size-5" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">
              {user?.vendor?.name || "RestroDesk"}
            </p>
            <p className="text-xs text-muted-foreground">RestroDesk</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/5 lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">{nav}</nav>

        {user && (
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-xs capitalize text-muted-foreground">
                  {user.role.replace("_", " ")}
                </p>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-surface-card/85 px-4 py-3.5 backdrop-blur lg:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex size-9 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-foreground/5 lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            {backHref && (
              <Link
                href={backHref}
                title="Back"
                className="flex size-9 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-foreground/5"
              >
                <ArrowLeft className="size-4.5" />
              </Link>
            )}
            <h1 className="truncate text-base font-semibold text-foreground lg:text-lg">{title}</h1>
          </div>

          {canSwitch && branches.length > 1 && (
            <div className="relative shrink-0">
              <select
                value={activeBranchId || ""}
                onChange={(e) => setBranch(e.target.value)}
                className="max-w-[9.5rem] appearance-none rounded-md border border-border bg-surface-card py-1.5 pl-3 pr-8 text-sm text-foreground focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:max-w-none"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          )}

          <ThemeToggle />
          {user?.vendorId && <NotificationBell />}
        </header>

        <main className="min-w-0 flex-1 bg-surface p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
