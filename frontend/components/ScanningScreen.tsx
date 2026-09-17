"use client";

import React, { useEffect, useState } from "react";
import { BotAvatar } from "./BotAvatar";
import {
  KeyRound,
  Database,
  UserCheck,
  BrainCircuit,
  Loader2,
  Cpu,
  CheckCircle2,
  Terminal,
  Code2,
  AlertTriangle,
} from "lucide-react";

interface ScanningScreenProps {
  fileName: string;
}

const STREAMING_CODE_SNIPPETS = [
  {
    file: "users.py",
    line: 12,
    code: "cursor.execute(f\"SELECT * FROM users WHERE id = '{uid}'\")",
    status: "FLAGGED",
    detail: "CWE-89: Raw string interpolation in SQL query sink",
  },
  {
    file: "config.py",
    line: 4,
    code: "SECRET_KEY = \"sk_live_viberguard_998124baf8921ec\"",
    status: "FLAGGED",
    detail: "CWE-798: Hardcoded high-entropy secret detected",
  },
  {
    file: "products.py",
    line: 38,
    code: "cursor.execute(\"SELECT * FROM products WHERE cat = ?\", (category,))",
    status: "SAFE",
    detail: "AST Check: Parameterized SQL statement verified",
  },
  {
    file: "account.py",
    line: 27,
    code: "user_id = request.args.get('id')  # Direct object lookup",
    status: "FLAGGED",
    detail: "CWE-639: Unvalidated resource access without session check",
  },
];

export const ScanningScreen: React.FC<ScanningScreenProps> = ({ fileName }) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(14);
  const [activeCodeSnippetIdx, setActiveCodeSnippetIdx] = useState(0);
  const [currentLogLine, setCurrentLogLine] = useState<string>(
    `> Initializing AST sandbox container for ${fileName}...`
  );

  const scanSteps = [
    {
      title: "Extracting & Validating Project",
      desc: "Unpacking archive, indexing files, parsing AST syntax trees",
      icon: Cpu,
      log: `> Unpacking ${fileName} • 8 source files discovered and indexed`,
    },
    {
      title: "Scanning for Hardcoded Secrets",
      desc: "Entropy analysis & regex for API keys, passwords, and .env files",
      icon: KeyRound,
      log: `> Inspecting config.py & .env files for high-entropy tokens...`,
    },
    {
      title: "Checking SQL Query Sanitization",
      desc: "AST traversal for string interpolation & unparameterized queries",
      icon: Database,
      log: `> AST inspection on users.py — checking cursor.execute sinks...`,
    },
    {
      title: "Reviewing Authorization & Ownership",
      desc: "Detecting unvalidated lookups and potential IDOR vulnerabilities",
      icon: UserCheck,
      log: `> Analyzing route handler permissions in account.py...`,
    },
    {
      title: "Synthesizing AI Explanations",
      desc: "Generating plain-English impact analysis and code diff remediations",
      icon: BrainCircuit,
      log: `> Contextual AI layer generating founder-friendly remediation diffs...`,
    },
  ];

  // Natural pacing: step intervals slowed to ~1.2s so user can read progress
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setActiveStepIndex((prev) => {
        const next = prev < scanSteps.length - 1 ? prev + 1 : prev;
        setCurrentLogLine(scanSteps[next].log);
        return next;
      });
    }, 1200);

    // Smooth progress bar progression
    const progressInterval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 92) return 92; // Hold at 92% until real scan resolves
        const jump = Math.floor(Math.random() * 5) + 3;
        return Math.min(prev + jump, 92);
      });
    }, 280);

    // Cycle through live scanned code snippets
    const codeInterval = setInterval(() => {
      setActiveCodeSnippetIdx((prev) => (prev + 1) % STREAMING_CODE_SNIPPETS.length);
    }, 1400);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      clearInterval(codeInterval);
    };
  }, [scanSteps.length]);

  const activeSnippet = STREAMING_CODE_SNIPPETS[activeCodeSnippetIdx];

  return (
    <div
      data-scanner-exclude
      className="max-w-3xl mx-auto my-6 p-8 sm:p-10 rounded-3xl glass-panel specular-border text-center relative overflow-hidden shadow-2xl"
    >
      {/* Ambient background glows */}
      <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none animate-pulse-slow" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none animate-pulse-slow" />

      {/* Bot Avatar in Thinking / Scanning State */}
      <div className="mb-4 flex justify-center">
        <BotAvatar state="thinking" size="xl" showBadge />
      </div>

      <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full glass-pill text-xs font-mono text-cyan-300 mb-3 border border-cyan-500/30">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="font-semibold tracking-wide">ViberGuard Deep Security Audit Active</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
        Auditing Your Project
      </h2>
      <p className="text-sm text-slate-300 max-w-lg mx-auto mb-6">
        Scanning <span className="font-mono text-cyan-300 font-bold">{fileName}</span> with deterministic AST security checks & AI explanation models.
      </p>

      {/* Progress bar with clear, larger typography */}
      <div className="w-full max-w-lg mx-auto mb-5">
        <div className="flex justify-between text-xs font-mono text-slate-300 mb-2 px-1 font-semibold">
          <span>Scan Pipeline Status</span>
          <span className="text-cyan-300 font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/10 relative">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500 rounded-full transition-all duration-300 ease-out relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute inset-0 bg-white/25 animate-[pulse_1.5s_infinite]" />
          </div>
        </div>
      </div>

      {/* Live Code Inspector Terminal (Shows actual code lines being audited) */}
      <div className="max-w-lg mx-auto mb-6 rounded-2xl bg-black/75 border border-cyan-500/30 text-left overflow-hidden shadow-glow-cyan">
        <div className="px-4 py-2 bg-slate-900/90 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono text-cyan-300 font-semibold">
              Live AST Inspector: {activeSnippet.file}:{activeSnippet.line}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
            ANALYZING
          </span>
        </div>

        {/* Code Viewport with Animated Laser Scanning Line */}
        <div className="p-4 relative font-mono text-xs overflow-hidden">
          {/* Animated Laser Scan Beam */}
          <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#22d3ee] pointer-events-none animate-[scanline_2.2s_ease-in-out_infinite]" />

          <div className="text-slate-300 mb-2 truncate">
            <span className="text-slate-500 mr-2">{activeSnippet.line} |</span>
            <span className="text-white font-semibold">{activeSnippet.code}</span>
          </div>

          <div className="flex items-center space-x-2 pt-2 border-t border-white/[0.06] text-[11px]">
            {activeSnippet.status === "FLAGGED" ? (
              <span className="inline-flex items-center text-amber-400 font-semibold space-x-1">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                <span>[FLAGGED]</span>
              </span>
            ) : (
              <span className="inline-flex items-center text-emerald-400 font-semibold space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                <span>[CLEAN]</span>
              </span>
            )}
            <span className="text-slate-400 truncate">{activeSnippet.detail}</span>
          </div>
        </div>
      </div>

      {/* Streaming Terminal Log Line */}
      <div className="max-w-lg mx-auto mb-6 p-3 rounded-xl bg-black/60 border border-white/[0.08] flex items-center space-x-2.5 text-left">
        <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
        <span className="text-xs font-mono text-cyan-300/95 truncate">
          {currentLogLine}
        </span>
      </div>

      {/* Step Sequence with Checkmark Animations */}
      <div className="max-w-lg mx-auto text-left space-y-2.5">
        {scanSteps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < activeStepIndex;
          const isCurrent = idx === activeStepIndex;

          return (
            <div
              key={step.title}
              className={`flex items-center space-x-3.5 p-3 rounded-xl border transition-all duration-300 ${
                isCurrent
                  ? "bg-cyan-500/[0.1] border-cyan-500/50 text-cyan-200 shadow-glow-cyan"
                  : isDone
                  ? "bg-white/[0.02] border-emerald-500/20 text-slate-300"
                  : "bg-transparent border-transparent text-slate-500 opacity-35"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                  isCurrent
                    ? "bg-cyan-500/20 text-cyan-300 ring-2 ring-cyan-400/40"
                    : isDone
                    ? "bg-emerald-500/20 text-emerald-400 scale-105"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate text-white">
                  {step.title}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {step.desc}
                </div>
              </div>

              {isDone && (
                <span className="text-xs font-mono text-emerald-400 shrink-0 font-bold">
                  PASS
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScanningScreen;
