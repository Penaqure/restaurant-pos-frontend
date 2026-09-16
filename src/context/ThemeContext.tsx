"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { THEME_STORAGE_KEY as STORAGE_KEY } from "@/lib/themeStorageKey";

export type Theme = "light" | "dark";

// The blocking script (see layout.tsx) only sets data-theme on <html> once
// the user has made an explicit choice; before that, dark mode comes purely
// from the prefers-color-scheme media query in globals.css. Mirrors that
// same fallback so the toggle's icon matches what's actually on screen.
function readCurrentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const applied = document.documentElement.getAttribute("data-theme");
  if (applied === "dark" || applied === "light") return applied;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

type ThemeContextValue = { theme: Theme; toggleTheme: () => void };
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // A lazy initializer runs during render (not inside an effect), so this
  // reads the DOM/media-query state the blocking script already applied
  // without the extra render-then-correct flash a useEffect would cause.
  const [theme, setThemeState] = useState<Theme>(readCurrentTheme);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function onChange(e: MediaQueryListEvent) {
      // Only follow live system changes while the user hasn't overridden it.
      if (!document.documentElement.getAttribute("data-theme")) {
        setThemeState(e.matches ? "dark" : "light");
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
