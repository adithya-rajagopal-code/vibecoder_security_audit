"use client";

import React from "react";
import { Finding } from "@/lib/types";
import { CodeViewer } from "./CodeViewer";
import { BotAvatar } from "./BotAvatar";
import {
  AlertOctagon,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Wrench,
  Flame,
  FileCode2,
  Terminal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldAlert,
} from "lucide-react";

interface FindingCardProps {
  finding: Finding;
  index: number;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  index,
  isExpanded = true,
  onToggle,
}) => {
  // Severity styling configuration
  const getSeverityBadge = (sev: string) => {
    switch (sev.toLowerCase()) {
      case "critical":
        return {
          bg: "bg-rose-500/10",
          border: "border-rose-500/30",
          text: "text-rose-400",
          dot: "bg-rose-500",
          icon: AlertOctagon,
          glow: "border-rose-500/25 shadow-glow-rose",
          botState: "alert" as const,
        };
      case "high":
        return {
          bg: "bg-amber-500/10",
          border: "border-amber-500/30",
          text: "text-amber-400",
          dot: "bg-amber-500",
          icon: AlertTriangle,
          glow: "border-amber-500/25",
          botState: "alert" as const,
        };
      case "medium":
        return {
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/30",
          text: "text-yellow-400",
          dot: "bg-yellow-500",
          icon: AlertCircle,
          glow: "border-yellow-500/20",
          botState: "thinking" as const,
        };
      default:
        return {
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/30",
          text: "text-emerald-400",
          dot: "bg-emerald-500",
          icon: HelpCircle,
          glow: "border-emerald-500/20",
          botState: "idle" as const,
        };
    }
  };

  // Helper to categorize finding into clean user labels
  const getCategoryLabel = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("secret") || t.includes("env") || t.includes("key")) return "Secrets";
    if (t.includes("sql")) return "SQL Injection";
    if (t.includes("auth") || t.includes("idor") || t.includes("access")) return "Authorization";
    return "Code Security";
  };

  const sevStyle = getSeverityBadge(finding.severity);
  const SeverityIcon = sevStyle.icon;
  const category = getCategoryLabel(finding.type);

  return (
    <div
      className={`glass-card specular-border rounded-2xl border ${sevStyle.glow} transition-all duration-300 overflow-hidden ${
        onToggle ? "cursor-pointer" : ""
      }`}
    >
      {/* Top Header / Accordion Bar */}
      <div
        onClick={onToggle}
        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-start sm:items-center space-x-3.5 flex-1 min-w-0">
          <div className={`p-2.5 rounded-xl ${sevStyle.bg} border ${sevStyle.border} shrink-0 mt-0.5 sm:mt-0`}>
            <SeverityIcon className={`w-5 h-5 ${sevStyle.text}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-[11px] font-mono text-slate-400">
                #{finding.id || `SEC-${index + 1}`}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-white/[0.06] text-cyan-300 border border-white/[0.08]">
                {category}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                {finding.title}
              </h3>
            </div>

            <div className="flex items-center space-x-2 mt-1 text-xs">
              <FileCode2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-mono text-cyan-300 truncate">
                {finding.file}
              </span>
              <span className="font-mono text-slate-400 shrink-0">
                : Line {finding.line}
              </span>
            </div>
          </div>
        </div>

        {/* Right Badges & Expand Chevron */}
        <div className="flex items-center space-x-2.5 self-end sm:self-center shrink-0">
          {/* Severity Badge */}
          <span
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${sevStyle.bg} ${sevStyle.border} ${sevStyle.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${sevStyle.dot}`} />
            <span>{finding.severity}</span>
          </span>

          {/* Confidence Badge */}
          <span className="hidden md:inline-flex px-2 py-1 rounded-full text-[11px] font-medium glass-pill text-slate-300 capitalize">
            {finding.confidence}
          </span>

          {/* Accordion Expand/Collapse Chevron */}
          {onToggle && (
            <button
              type="button"
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors"
              aria-label={isExpanded ? "Collapse finding" : "Expand finding"}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-cyan-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Accordion Collapsible Body */}
      {isExpanded && (
        <div className="px-5 pb-6 pt-1 border-t border-white/[0.06] space-y-4 animate-in fade-in-50 duration-200 cursor-default" onClick={(e) => e.stopPropagation()}>
          {/* Redacted Evidence Block */}
          {finding.evidence && (
            <div className="p-3 rounded-xl bg-[#080d1a] border border-cyan-500/20">
              <div className="flex items-center space-x-1.5 text-[11px] font-mono text-cyan-400 mb-1.5">
                <Terminal className="w-3.5 h-3.5" />
                <span>Detected Flag / Code Pattern</span>
              </div>
              <div className="font-mono text-xs text-cyan-200/90 break-all select-all">
                {finding.evidence}
              </div>
            </div>
          )}

          {/* Code Context Viewer */}
          <CodeViewer
            fileName={finding.file}
            targetLine={finding.line}
            codeContext={finding.code_context}
          />

          {/* Conversational AI Bot Debrief Speech Bubble */}
          <div className="rounded-2xl bg-gradient-to-b from-[#0c1222] to-[#080d18] border border-cyan-500/20 p-4 sm:p-5 relative">
            <div className="flex items-center space-x-2.5 mb-3 pb-2.5 border-b border-white/[0.08]">
              <BotAvatar state={sevStyle.botState} size="sm" />
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-white tracking-wide">
                    ViberGuard AI Debrief
                  </span>
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Contextual Root-Cause Analysis
                </span>
              </div>
            </div>

            {/* Chat Bubble Explanation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* 1. What is broken */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-cyan-300 mb-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>What happened?</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {finding.description}
                  </p>
                </div>
              </div>

              {/* 2. Threat & Impact */}
              <div className="p-3 rounded-xl bg-rose-500/[0.04] border border-rose-500/15 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-rose-300 mb-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Real-world Threat</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {finding.impact}
                  </p>
                </div>
              </div>

              {/* 3. Actionable Remediation */}
              <div className="p-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/15 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-300 mb-1.5">
                    <Wrench className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Recommended Fix</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {finding.recommendation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
