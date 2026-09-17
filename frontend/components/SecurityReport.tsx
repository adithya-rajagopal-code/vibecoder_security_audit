"use client";

import React, { useState, useMemo } from "react";
import { ScanResponse, Finding } from "@/lib/types";
import { ScoreCard } from "./ScoreCard";
import { SummaryCards } from "./SummaryCards";
import { PassedChecks } from "./PassedChecks";
import { FindingCard } from "./FindingCard";
import { BotAvatar } from "./BotAvatar";
import {
  RotateCcw,
  ShieldCheck,
  FileCheck,
  Printer,
  AlertTriangle,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface SecurityReportProps {
  report: ScanResponse;
  fileName: string;
  onScanAnother: () => void;
}

export const SecurityReport: React.FC<SecurityReportProps> = ({
  report,
  fileName,
  onScanAnother,
}) => {
  const { security_score, summary, findings } = report;
  const isCleanScan = summary.total === 0;

  // Filter state
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Accordion state: top 2 findings auto-expanded by default
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    findings.forEach((f, idx) => {
      // Auto-expand top 2 or any critical findings
      initial[f.id || `finding-${idx}`] = idx < 2 || f.severity === "critical";
    });
    return initial;
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    findings.forEach((f, idx) => {
      next[f.id || `finding-${idx}`] = true;
    });
    setExpandedIds(next);
  };

  const handleCollapseAll = () => {
    setExpandedIds({});
  };

  // Helper to categorize findings for filter matching
  const getFindingCategory = (finding: Finding) => {
    const t = (finding.type || "").toLowerCase();
    if (t.includes("secret") || t.includes("env") || t.includes("key")) return "secrets";
    if (t.includes("sql")) return "sql";
    if (t.includes("auth") || t.includes("idor") || t.includes("access")) return "auth";
    return "other";
  };

  // Filtered findings list
  const filteredFindings = useMemo(() => {
    return findings.filter((finding) => {
      // Severity check
      if (severityFilter !== "all" && finding.severity.toLowerCase() !== severityFilter.toLowerCase()) {
        return false;
      }
      // Category check
      if (categoryFilter !== "all") {
        const cat = getFindingCategory(finding);
        if (categoryFilter === "secrets" && cat !== "secrets") return false;
        if (categoryFilter === "sql" && cat !== "sql") return false;
        if (categoryFilter === "auth" && cat !== "auth") return false;
      }
      return true;
    });
  }, [findings, severityFilter, categoryFilter]);

  // Determine Bot Avatar state & message
  const botState = summary.critical > 0 ? "alert" : summary.high > 0 ? "alert" : summary.total > 0 ? "thinking" : "happy";

  const botDebriefMessage =
    summary.critical > 0
      ? `Attention needed! I found ${summary.critical} critical security concern${
          summary.critical > 1 ? "s" : ""
        } that must be resolved before deploying this project to production.`
      : summary.high > 0
      ? `Warning: I detected ${summary.high} high-severity issue${
          summary.high > 1 ? "s" : ""
        } that could pose security risks under real-world usage.`
      : isCleanScan
      ? "Awesome job! The automated audit passed clean across all verified categories. No obvious flaws found."
      : `Audit finished. Reviewed ${summary.total} minor point${summary.total > 1 ? "s" : ""} for your review.`;

  return (
    <div data-scanner-exclude className="max-w-5xl mx-auto my-6 sm:my-10 px-4 space-y-8 animate-in fade-in duration-500 print:m-0 print:p-0">
      {/* Top Banner: Bot Personality & Quick Actions */}
      <div className="glass-panel specular-border rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden">
        <div className="flex items-center space-x-4">
          <BotAvatar state={botState} size="lg" />
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 mb-1">
              <FileCheck className="w-4 h-4" />
              <span>Audit Complete • AI Security Report</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Security Audit Report
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              {botDebriefMessage}
            </p>
            <div className="text-[11px] text-slate-400 font-mono mt-2">
              Target: <span className="text-cyan-300 font-semibold">{fileName}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2 self-start sm:self-center shrink-0 print:hidden">
          <button
            onClick={() => window.print()}
            type="button"
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 text-xs font-semibold shadow-glass transition-all hover:scale-[1.02]"
            title="Print or save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export</span>
          </button>

          <button
            onClick={onScanAnother}
            type="button"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-200 text-xs font-semibold shadow-glass transition-all hover:scale-[1.02]"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Scan Another</span>
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid: Circular Score + Severity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        <div className="md:col-span-1">
          <ScoreCard score={security_score} />
        </div>
        <div className="md:col-span-2 flex flex-col justify-between gap-4">
          <SummaryCards summary={summary} />
          <PassedChecks findings={findings} />
        </div>
      </div>

      {/* Findings Section */}
      <div className="space-y-4 pt-2">
        {/* Header with Title and Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Detailed Findings & Remediations
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-white/10 text-cyan-300">
              {filteredFindings.length} of {findings.length}
            </span>
          </div>

          {/* Quick Accordion Expand/Collapse All */}
          {findings.length > 0 && (
            <div className="flex items-center space-x-2 text-xs print:hidden">
              <button
                onClick={handleExpandAll}
                type="button"
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ChevronDown className="w-3 h-3" />
                <span>Expand All</span>
              </button>
              <button
                onClick={handleCollapseAll}
                type="button"
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ChevronUp className="w-3 h-3" />
                <span>Collapse All</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter Chips Ribbon */}
        {findings.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 py-1 print:hidden">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 mr-1">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>Filter:</span>
            </div>

            {/* Severity Filters */}
            <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-xl border border-white/[0.06]">
              {["all", "critical", "high", "medium", "low"].map((sev) => {
                const isActive = severityFilter === sev;
                return (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    type="button"
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                      isActive
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {sev}
                  </button>
                );
              })}
            </div>

            {/* Category Filters */}
            <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-xl border border-white/[0.06]">
              {[
                { id: "all", label: "All Topics" },
                { id: "secrets", label: "Secrets" },
                { id: "sql", label: "SQL Injection" },
                { id: "auth", label: "Authorization" },
              ].map((cat) => {
                const isActive = categoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    type="button"
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Clean / No Findings State */}
        {isCleanScan ? (
          <div className="p-8 sm:p-12 rounded-3xl glass-card border border-emerald-500/30 text-center specular-border shadow-glow-emerald">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              No Supported Security Concerns Detected
            </h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
              The automated static scanner did not identify any exposed secrets, SQL injection vulnerabilities, or obvious authorization weaknesses in this project.
            </p>

            <div className="max-w-md mx-auto p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/90 leading-relaxed">
                <strong>Safety Disclaimer:</strong> A clean scan does not guarantee that the application is 100% secure. This MVP verifies the three supported categories only.
              </p>
            </div>
          </div>
        ) : filteredFindings.length === 0 ? (
          /* Filter Returned No Matches */
          <div className="p-8 rounded-2xl glass-card border border-white/[0.08] text-center text-slate-400 text-xs">
            No findings match the selected filter criteria.
            <button
              onClick={() => {
                setSeverityFilter("all");
                setCategoryFilter("all");
              }}
              className="ml-2 text-cyan-400 underline hover:text-cyan-300"
            >
              Reset filters
            </button>
          </div>
        ) : (
          /* Filtered Accordion Findings List */
          <div className="space-y-4">
            {filteredFindings.map((finding, idx) => {
              const cardId = finding.id || `finding-${idx}`;
              const isExpanded = !!expandedIds[cardId];

              return (
                <FindingCard
                  key={cardId}
                  finding={finding}
                  index={idx}
                  isExpanded={isExpanded}
                  onToggle={() => toggleExpand(cardId)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom CTA to scan another project */}
      <div className="pt-8 pb-12 flex justify-center print:hidden">
        <button
          onClick={onScanAnother}
          type="button"
          className="flex items-center space-x-2 px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold text-sm shadow-glow-cyan transition-all transform hover:scale-[1.02]"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Scan Another Project</span>
        </button>
      </div>
    </div>
  );
};
