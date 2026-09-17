"use client";

import React from "react";
import { AlertOctagon, RotateCcw, ShieldX, Sparkles } from "lucide-react";

interface ErrorMessageProps {
  errorCode?: string;
  errorMessage: string;
  onRetry: () => void;
  onUseDemoMode?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  errorCode = "SCAN_FAILED",
  errorMessage,
  onRetry,
  onUseDemoMode,
}) => {
  return (
    <div data-scanner-exclude className="max-w-2xl mx-auto my-12 p-8 rounded-2xl glass-card border border-rose-500/30 shadow-glow-rose specular-border text-center relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute -top-16 -right-16 w-40 h-40 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-glow-rose">
        <ShieldX className="w-7 h-7" />
      </div>

      <div className="inline-block px-2.5 py-0.5 mb-2 rounded-full text-[11px] font-mono font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
        Error: {errorCode}
      </div>

      <h2 className="text-xl font-bold text-white tracking-tight mb-2">
        Scan Operation Could Not Complete
      </h2>

      <p className="text-sm text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
        {errorMessage}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onRetry}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm font-medium transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Upload Another ZIP</span>
        </button>

        {onUseDemoMode && errorCode === "BACKEND_UNREACHABLE" && (
          <button
            onClick={onUseDemoMode}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-sm font-semibold shadow-glow-cyan transition-all"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Launch VibeShop Demo Mode</span>
          </button>
        )}
      </div>
    </div>
  );
};
