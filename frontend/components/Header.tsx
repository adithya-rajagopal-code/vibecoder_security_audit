"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, Sparkles, Activity } from "lucide-react";
import { checkBackendHealth, API_BASE_URL } from "@/lib/api";

interface HeaderProps {
  demoMode: boolean;
  onToggleDemoMode: (enabled: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  demoMode,
  onToggleDemoMode,
}) => {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const verifyHealth = async () => {
      const isHealthy = await checkBackendHealth();
      if (mounted) {
        setBackendOnline(isHealthy);
      }
    };

    verifyHealth();
    const interval = setInterval(verifyHealth, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header data-scanner-exclude className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#080c14]/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-sky-500/10 to-transparent border border-cyan-500/30 shadow-glow-cyan">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <div className="absolute -inset-0.5 rounded-xl bg-cyan-400/10 blur-sm pointer-events-none" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">
                VibeCoder
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                Security Auditor AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              AI-Assisted Source-Code Vulnerability Detection & Remediation
            </p>
          </div>
        </div>

        {/* Status, Localhost Links, and Mode Switcher */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Demo Project Localhost Link */}
          <a
            href="http://localhost:5000"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono transition-all hover:scale-105"
            title="Open Demo Storefront (VibeShop) at http://localhost:5000"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-semibold">Demo App:</span>
            <span className="text-amber-200 underline">localhost:5000</span>
          </a>

          {/* Backend Status Pill */}
          <div
            className="flex items-center space-x-2 px-3 py-1.5 rounded-full glass-pill text-xs"
            title={
              backendOnline
                ? `Connected to FastAPI backend at ${API_BASE_URL}`
                : `Backend server offline (${API_BASE_URL} unreachable)`
            }
          >
            <span className="relative flex h-2 w-2">
              {backendOnline ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              )}
            </span>
            <span className="text-slate-300 text-[11px] font-medium hidden md:inline">
              {backendOnline
                ? `Backend: ${API_BASE_URL.replace(/^https?:\/\//, "")}`
                : `Backend: ${API_BASE_URL.replace(/^https?:\/\//, "")} (Offline)`}
            </span>
          </div>

          {/* Demo Mode Toggle */}
          <button
            onClick={() => onToggleDemoMode(!demoMode)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              demoMode
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan"
                : "bg-white/[0.04] text-slate-400 hover:text-slate-200 border border-white/10 hover:border-white/20"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Demo Mode: {demoMode ? "ON" : "OFF"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
