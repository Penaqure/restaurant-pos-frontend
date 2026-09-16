import type { Metadata } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { BranchProvider } from "@/context/BranchContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { THEME_STORAGE_KEY } from "@/lib/themeStorageKey";

// Runs before hydration (see the beforeInteractive Script below) so the
// right theme applies before first paint -- without this, the page would
// flash light and then snap to dark once React mounts. Always resolves and
// sets data-theme (falling back to system preference when nothing's been
// chosen yet) rather than only on an explicit choice, since Tailwind's
// dark: utilities (see globals.css's @custom-variant) need something
// concrete to key off, not just "attribute absent".
const NO_FLASH_THEME_SCRIPT = `
  (function () {
    try {
      var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
      var theme = stored === "dark" || stored === "light"
        ? stored
        : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      document.documentElement.setAttribute("data-theme", theme);
    } catch (e) {}
  })();
`;

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RestroDesk",
  description: "Multi-vendor restaurant billing platform",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface text-foreground font-sans">
        <Script id="theme-no-flash" strategy="beforeInteractive">
          {NO_FLASH_THEME_SCRIPT}
        </Script>
        <ThemeProvider>
          <AuthProvider>
            <BranchProvider>
              <NotificationProvider>
                {children}
                <ToastContainer position="top-right" autoClose={3000} />
              </NotificationProvider>
            </BranchProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
