"use client";

import React from "react";
import { Finding } from "@/lib/types";
import { CheckCircle2, XCircle, AlertTriangle, KeyRound, Database, UserCheck } from "lucide-react";

interface PassedChecksProps {
  findings: Finding[];
}

export const PassedChecks: React.FC<PassedChecksProps> = ({ findings }) => {
  // Check if any finding belongs to these categories
  const hasSecrets = findings.some(
    (f) => f.type === "hardcoded_secret" || f.type === "exposed_env"
  );
  const hasSqlInjection = findings.some((f) => f.type === "sql_injection");
  const hasIdor = findings.some((f) => f.type === "potential_idor");

  const checks = [
    {
      id: "secrets",
      title: "Hardcoded Secrets & Environment Files",
      passed: !hasSecrets,
      passMessage: "No exposed secrets or .env files detected",
      failMessage: "Potential exposed secret or credential detected",
      icon: KeyRound,
    },
    {
      id: "sql_injection",
      title: "SQL Injection Detection",
      passed: !hasSqlInjection,
      passMessage: "No unsafe SQL string interpolations detected",
      failMessage: "Potential SQL injection vulnerability detected",
      icon: Database,
    },
    {
      id: "authorization",
      title: "Authorization & Resource Ownership (IDOR)",
      passed: !hasIdor,
      passMessage: "No unverified resource lookup patterns flagged",
      failMessage: "Potential authorization / IDOR weakness detected",
      icon: UserCheck,
    },
  ];

  return (
    <div className="glass-card specular-border rounded-2xl p-5 border border-white/[0.08]">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight">
            Security Category Verification
          </h3>
          <p className="text-xs text-slate-400">
            Automated verification across supported vulnerability classes
          </p>
        </div>
        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full glass-pill text-slate-300">
          3 Analyzers
        </span>
      </div>

      {/* Verification rows */}
      <div className="space-y-2.5">
        {checks.map((check) => {
          const Icon = check.icon;
          return (
            <div
              key={check.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                check.passed
                  ? "bg-emerald-500/[0.04] border-emerald-500/20 text-emerald-300"
                  : "bg-rose-500/[0.04] border-rose-500/20 text-rose-300"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-lg ${
                    check.passed ? "bg-emerald-500/10" : "bg-rose-500/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    {check.title}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {check.passed ? check.passMessage : check.failMessage}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 font-medium text-xs">
                {check.passed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Passed</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span className="text-rose-400 font-semibold">Flagged</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mandatory Scope & Safety Disclaimer from Spec */}
      <div className="mt-4 p-3 rounded-xl bg-amber-500/[0.05] border border-amber-500/20 flex items-start space-x-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed text-amber-200/80">
          <strong className="text-amber-300 font-semibold">Important Scope Notice:</strong>{" "}
          A passed check means no supported issue was detected by the static rules. It does{" "}
          <strong>NOT</strong> guarantee that the application is 100% secure. This MVP scanner
          evaluates hardcoded secrets, SQL injection, and potential authorization flaws.
        </p>
      </div>
    </div>
  );
};
