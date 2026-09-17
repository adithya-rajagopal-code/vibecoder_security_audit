"use client";

import React, { useEffect, useState } from "react";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

interface ScoreCardProps {
  score: number;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ score }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Smooth count-up animation on mount or when score changes
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1200; // 1.2 seconds count-up
    const target = Math.max(0, Math.min(100, score));

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo function for a crisp, snappy deceleration
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentVal = Math.floor(easeProgress * target);

      setAnimatedScore(currentVal);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setAnimatedScore(target);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [score]);

  // Deterministic color styling based on score thresholds
  const getColorScheme = (val: number) => {
    if (val < 40) {
      return {
        text: "text-rose-400",
        bg: "bg-rose-500/10",
        border: "border-rose-500/25",
        stroke: "#f43f5e",
        glow: "shadow-glow-rose",
        status: "Critical Risks Detected",
        icon: ShieldAlert,
        description: "Severe security vulnerabilities requiring immediate remediation before deployment.",
      };
    } else if (val < 75) {
      return {
        text: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/25",
        stroke: "#f59e0b",
        glow: "",
        status: "Elevated Risk",
        icon: Shield,
        description: "Security weaknesses identified that warrant developer review.",
      };
    } else {
      return {
        text: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/25",
        stroke: "#10b981",
        glow: "shadow-glow-emerald",
        status: "No Supported Issues Detected",
        icon: ShieldCheck,
        description: "No hardcoded secrets, SQL injection, or potential IDOR patterns detected in analyzed files.",
      };
    }
  };

  const scheme = getColorScheme(score);
  const StatusIcon = scheme.icon;

  // SVG Circular Meter math
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const safeScore = Math.max(0, Math.min(100, animatedScore));
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  return (
    <div className="glass-card specular-border rounded-2xl p-6 relative overflow-hidden flex flex-col items-center text-center justify-between">
      {/* Background ambient gradient glow */}
      <div
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: scheme.stroke }}
      />

      <div className="w-full flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center space-x-2">
          <StatusIcon className={`w-4 h-4 ${scheme.text}`} />
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Security Score
          </span>
        </div>
        <span
          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-colors duration-500 ${scheme.bg} ${scheme.border} ${scheme.text}`}
        >
          {scheme.status}
        </span>
      </div>

      {/* Circular Progress Gauge */}
      <div className="relative my-6 flex items-center justify-center">
        <svg className="w-36 h-36 transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            className="text-slate-800/80"
            strokeWidth="9"
            stroke="currentColor"
            fill="transparent"
          />
          {/* Progress circle stroke */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke={scheme.stroke}
            strokeWidth="9"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Center Score Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
          <span className={`text-4xl font-extrabold tracking-tight font-mono ${scheme.text} transition-colors duration-500`}>
            {animatedScore}
          </span>
          <span className="text-[11px] uppercase tracking-wider font-medium text-slate-400">
            / 100
          </span>
        </div>
      </div>

      {/* Assessment summary text */}
      <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
        {scheme.description}
      </p>
    </div>
  );
};
