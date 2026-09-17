import type { Metadata } from "next";
import "./globals.css";
import { AiAnimatedBackground } from "@/components/AiAnimatedBackground";

export const metadata: Metadata = {
  title: "VibeCoder Security Auditor AI — AI-Assisted Code Vulnerability Scanner",
  description:
    "Security analysis tool for AI-generated codebases. Upload your project ZIP to detect exposed secrets, SQL injection, and authorization weaknesses with clear AI explanations.",
  keywords: [
    "cybersecurity",
    "vulnerability scanner",
    "AI code audit",
    "SQL injection",
    "hardcoded secrets",
    "IDOR",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#080c14] text-slate-100 min-h-screen antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {/* Animated Moving AI Neural Background */}
        <AiAnimatedBackground />

        {/* Main Application Container */}
        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
