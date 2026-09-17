"use client";

import React from "react";

export type BotState = "idle" | "thinking" | "happy" | "alert";

interface BotAvatarProps {
  state?: BotState;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showBadge?: boolean;
}

export const BotAvatar: React.FC<BotAvatarProps> = ({
  state = "idle",
  size = "md",
  className = "",
  showBadge = false,
}) => {
  // Size mappings (Tailwind + fallback inline px)
  const pixelSizes = {
    sm: 36,
    md: 56,
    lg: 80,
    xl: 112,
  };

  const px = pixelSizes[size];

  // State colors and halos
  const stateConfig = {
    idle: {
      primary: "#06b6d4", // cyan-500
      secondary: "#0284c7", // sky-600
      glow: "shadow-[0_0_25px_rgba(6,182,212,0.35)]",
      ring: "border-cyan-500/30",
      accentBg: "bg-cyan-500/10",
      statusText: "Ready to Audit",
      badgeColor: "bg-cyan-500",
    },
    thinking: {
      primary: "#38bdf8", // sky-400
      secondary: "#6366f1", // indigo-500
      glow: "shadow-[0_0_35px_rgba(56,189,248,0.5)]",
      ring: "border-sky-400/50",
      accentBg: "bg-sky-500/15",
      statusText: "Analyzing Codebase",
      badgeColor: "bg-sky-400 animate-pulse",
    },
    happy: {
      primary: "#10b981", // emerald-500
      secondary: "#059669", // emerald-600
      glow: "shadow-[0_0_35px_rgba(16,185,129,0.45)]",
      ring: "border-emerald-500/40",
      accentBg: "bg-emerald-500/15",
      statusText: "System Clean",
      badgeColor: "bg-emerald-500",
    },
    alert: {
      primary: "#f43f5e", // rose-500
      secondary: "#e11d48", // rose-600
      glow: "shadow-[0_0_35px_rgba(244,63,94,0.5)]",
      ring: "border-rose-500/50",
      accentBg: "bg-rose-500/15",
      statusText: "Vulnerabilities Detected",
      badgeColor: "bg-rose-500 animate-ping",
    },
  };

  const config = stateConfig[state];

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: px, height: px, minWidth: px, minHeight: px }}
    >
      {/* Outer Glow Halo */}
      <div
        className={`relative w-full h-full rounded-2xl flex items-center justify-center transition-all duration-500 ${config.glow} ${config.accentBg} border ${config.ring} backdrop-blur-md overflow-hidden`}
        style={{ width: px, height: px }}
      >
        {/* Animated Sweep Ring for 'thinking' state */}
        {state === "thinking" && (
          <div className="absolute -inset-1 rounded-2xl border-2 border-t-sky-400 border-r-transparent border-b-indigo-500 border-l-transparent animate-spin pointer-events-none" />
        )}

        {/* Pulsing Alarm Ring for 'alert' state */}
        {state === "alert" && (
          <div className="absolute -inset-1 rounded-2xl border-2 border-rose-500/50 animate-ping opacity-75 pointer-events-none" />
        )}

        {/* Gentle Breath Aura for 'idle' state */}
        {state === "idle" && (
          <div className="absolute inset-0 rounded-2xl border border-cyan-400/30 animate-pulse-slow pointer-events-none" />
        )}

        {/* Happy Sparkle Ring for 'happy' state */}
        {state === "happy" && (
          <div className="absolute -inset-0.5 rounded-2xl border border-emerald-400/40 shadow-glow-emerald pointer-events-none" />
        )}

        {/* SVG Robot Shield Core with hardcoded max sizes */}
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 transform hover:scale-105 shrink-0"
          style={{ width: Math.round(px * 0.8), height: Math.round(px * 0.8), maxWidth: "100%", maxHeight: "100%" }}
        >
          {/* Cyber Antennas */}
          <line
            x1="32"
            y1="10"
            x2="32"
            y2="16"
            stroke={config.primary}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="32" cy="8" r="3" fill={config.primary} className={state === "thinking" ? "animate-pulse" : ""} />

          {/* Robot Head / Shield Hull */}
          <path
            d="M16 20C16 17.7909 17.7909 16 20 16H44C46.2091 16 48 17.7909 48 20V36C48 45.9411 41.2548 54.5882 32 57C22.7452 54.5882 16 45.9411 16 36V20Z"
            fill="#090e1a"
            stroke={config.primary}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Inner Circuit Accent */}
          <path
            d="M22 22H42V35C42 41.5 37.8 47.5 32 49.5C26.2 47.5 22 41.5 22 35V22Z"
            fill={config.accentBg}
            opacity="0.6"
          />

          {/* Visor Area */}
          <rect
            x="20"
            y="24"
            width="24"
            height="13"
            rx="6.5"
            fill="#050811"
            stroke={config.primary}
            strokeWidth="1.5"
          />

          {/* Visor Content Based on State */}
          {state === "idle" && (
            <g className="animate-pulse">
              <circle cx="27" cy="30.5" r="2.7" fill="#06b6d4" />
              <circle cx="37" cy="30.5" r="2.7" fill="#06b6d4" />
              <circle cx="28" cy="29.5" r="0.8" fill="#ffffff" />
              <circle cx="38" cy="29.5" r="0.8" fill="#ffffff" />
            </g>
          )}

          {state === "thinking" && (
            <g>
              <rect x="23" y="29" width="18" height="3" rx="1.5" fill="#38bdf8" className="animate-pulse" />
              <circle cx="32" cy="30.5" r="3.5" fill="#6366f1" className="animate-ping opacity-75" />
            </g>
          )}

          {state === "happy" && (
            <g>
              <path
                d="M24 32C25 29 28 29 29 32"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M35 32C36 29 39 29 40 32"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M29 42C30.5 44 33.5 44 35 42"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          )}

          {state === "alert" && (
            <g>
              <line x1="24" y1="28" x2="29" y2="33" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="29" y1="33" x2="24" y2="33" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="40" y1="28" x2="35" y2="33" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="35" y1="33" x2="40" y2="33" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          )}

          {/* Chin Crest */}
          <polygon points="32,53 29,48 35,48" fill={config.primary} />
        </svg>
      </div>

      {/* Optional Status Pill Badge */}
      {showBadge && (
        <span
          className={`absolute -bottom-2 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wide uppercase border text-white ${config.accentBg} ${config.ring} shadow-sm backdrop-blur-md pointer-events-none select-none`}
        >
          {state}
        </span>
      )}
    </div>
  );
};

export default BotAvatar;
