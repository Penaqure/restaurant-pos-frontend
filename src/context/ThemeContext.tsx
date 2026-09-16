"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { THEME_STORAGE_KEY as STORAGE_KEY } from "@/lib/themeStorageKey";

export type Theme = "light" | "dark";

// The blocking script (see layout.tsx) always sets data-theme on <html>
// before first paint -- either the stored choice or, if there isn't one,
// the resolved system preference. Mirrors that same resolution so the
// toggle's icon matches what's actually on screen.
function readCurrentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const applied = document.documentElement.getAttribute("data-theme");
  if (applied === "dark" || applied === "light") return applied;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function hasExplicitChoice(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

type ThemeContextValue = { theme: Theme; toggleTheme: () => void };
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Must start as "light" to match what the server renders -- the server
  // has no access to localStorage/matchMedia, so readCurrentTheme() always
  // resolves to "light" there. Using the real (possibly browser-only) value
  // here would make the client's first hydration pass disagree with the
  // server-rendered HTML on anything that reads `theme` (e.g. ThemeToggle's
  // icon/label), which React reports as a hydration error. The actual page
  // colors are unaffected either way -- those come from the blocking script
  // in layout.tsx setting data-theme on <html> before first paint, not from
  // this state. The effect below brings this state in sync right after
  // mount, once it's safe to read the DOM/media query.
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    // Deliberate post-hydration correction, not a state/external-system
    // sync: reading the real theme during render (client or server) is
    // exactly what caused the hydration mismatch this state is initialized
    // to avoid.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(readCurrentTheme());

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function onChange(e: MediaQueryListEvent) {
      // Only follow live system changes while the user hasn't explicitly
      // chosen a theme (data-theme is always set now, so its presence alone
      // can't signal that anymore -- localStorage is the real source of truth).
      if (!hasExplicitChoice()) {
        const next: Theme = e.matches ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", next);
        setThemeState(next);
      }
    }
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function toggleTheme() {
    setThemeState((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Private browsing / storage disabled -- theme still applies for
        // this page view, it just won't be remembered next visit.
      }
      return next;
    });
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
