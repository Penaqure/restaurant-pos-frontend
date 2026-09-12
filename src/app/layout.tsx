import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { BranchProvider } from "@/context/BranchContext";

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
  title: "Restaurant Billing",
  description: "Multi-vendor restaurant billing platform",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface text-foreground font-sans">
        <AuthProvider>
          <BranchProvider>
            {children}
            <ToastContainer position="top-right" autoClose={3000} />
          </BranchProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
