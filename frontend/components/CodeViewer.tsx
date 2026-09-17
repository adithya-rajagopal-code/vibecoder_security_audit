"use client";

import React, { useState } from "react";
import { CodeContext } from "@/lib/types";
import { AlertCircle, FileCode, Copy, Check } from "lucide-react";

interface CodeViewerProps {
  fileName: string;
  targetLine: number;
  codeContext?: CodeContext;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  fileName,
  targetLine,
  codeContext,
}) => {
  const [copied, setCopied] = useState(false);

  if (!codeContext || !codeContext.lines || codeContext.lines.length === 0) {
    return null;
  }

  const { start_line, lines } = codeContext;

  const handleCopyCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const codeSnippet = lines.join("\n");
      await navigator.clipboard.writeText(codeSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code snippet", err);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-[#060910]/90 backdrop-blur-md overflow-hidden text-xs shadow-inner">
      {/* Code viewer header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-white/[0.03] border-b border-white/[0.08]">
        <div className="flex items-center space-x-2 text-slate-300">
          <FileCode className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-[11px] font-medium text-slate-200">
            {fileName}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
            Vulnerable Target: Line {targetLine}
          </span>

          {/* One-touch Copy Button */}
          <button
            onClick={handleCopyCode}
            type="button"
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-all text-[10px] font-mono"
            title="Copy snippet to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code lines */}
      <div className="p-2.5 overflow-x-auto font-mono text-[11px] leading-relaxed">
        {lines.map((lineContent, index) => {
          const currentLineNumber = start_line + index;
          const isVulnerable = currentLineNumber === targetLine;

          return (
            <div
              key={currentLineNumber}
              className={`flex items-center py-0.5 px-2 rounded transition-colors ${
                isVulnerable
                  ? "bg-rose-500/15 text-rose-200 border-l-2 border-rose-500 font-semibold shadow-inner"
                  : "text-slate-300 hover:bg-white/[0.02]"
              }`}
            >
              {/* Line number */}
              <span
                className={`w-8 shrink-0 select-none text-right pr-3 ${
                  isVulnerable
                    ? "text-rose-400 font-bold"
                    : "text-slate-400 opacity-60"
                }`}
              >
                {currentLineNumber}
              </span>

              {/* Code content */}
              <span className="flex-1 whitespace-pre pl-1">
                {lineContent || " "}
              </span>

              {/* Vulnerable callout indicator */}
              {isVulnerable && (
                <span className="ml-3 shrink-0 flex items-center space-x-1 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] tracking-wide border border-rose-500/30">
                  <AlertCircle className="w-2.5 h-2.5" />
                  <span>vulnerable line</span>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
