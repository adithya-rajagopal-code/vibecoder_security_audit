"use client";

import React, { useState, useRef } from "react";
import { BotAvatar } from "./BotAvatar";
import {
  UploadCloud,
  FileArchive,
  AlertCircle,
  Sparkles,
  KeyRound,
  Database,
  UserCheck,
  History,
  Trash2,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

export interface ScanHistoryItem {
  id: string;
  fileName: string;
  score: number;
  timestamp: string;
  report: any;
}

interface UploadScreenProps {
  onStartScan: (file: File) => void;
  onQuickDemoScan: () => void;
  isScanning: boolean;
  recentScans?: ScanHistoryItem[];
  onSelectRecentScan?: (item: ScanHistoryItem) => void;
  onClearHistory?: () => void;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({
  onStartScan,
  onQuickDemoScan,
  isScanning,
  recentScans = [],
  onSelectRecentScan,
  onClearHistory,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);

    // File validation: extension check
    const isZip =
      file.name.toLowerCase().endsWith(".zip") ||
      file.type === "application/zip" ||
      file.type === "application/x-zip-compressed";

    if (!isZip) {
      setErrorMessage("Invalid file: Only ZIP archives (.zip) are supported.");
      setSelectedFile(null);
      return false;
    }

    // File validation: size check <= 10MB
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setErrorMessage(
        `File too large: Uploaded ZIP is ${sizeMB} MB. Maximum allowed size is 10 MB.`
      );
      setSelectedFile(null);
      return false;
    }

    setSelectedFile(file);
    return true;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isScanning) setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (isScanning) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const pickedFile = e.target.files[0];
      validateAndSetFile(pickedFile);
    }
  };

  const handleStartScanClick = () => {
    if (selectedFile) {
      onStartScan(selectedFile);
    }
  };

  return (
    <div data-scanner-exclude className="max-w-3xl mx-auto my-6 sm:my-10 px-4">
      {/* Hero Header with BotAvatar */}
      <div className="text-center mb-8 flex flex-col items-center">
        {/* Animated Bot Avatar in Idle State */}
        <div className="mb-4">
          <BotAvatar state="idle" size="lg" showBadge />
        </div>

        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-pill border border-cyan-500/20 text-xs font-semibold text-cyan-300 mb-3 shadow-glow-cyan">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Security Review for AI-Generated Codebases</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Find Security Risks Hiding in <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
            AI-Generated Projects
          </span>
        </h1>

        <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
          Upload your project ZIP to get deterministic static vulnerability detection paired with clear, founder-friendly AI explanations.
        </p>

        {/* Local Endpoints Indicator */}
        <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-white/10 text-slate-400">
          <span className="text-slate-300 font-semibold">Local Services:</span>
          <span className="text-cyan-400">Auditor: localhost:3000</span>
          <span>•</span>
          <a
            href="http://localhost:5000"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 underline"
          >
            Demo Store: localhost:5000
          </a>
          <span>•</span>
          <span className="text-emerald-400">Backend: 172.16.39.215:8000</span>
        </div>
      </div>

      {/* Drag & Drop Glass Upload Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isScanning && fileInputRef.current?.click()}
        className={`glass-panel specular-border rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 relative overflow-hidden group ${
          isDragActive
            ? "border-cyan-400/80 bg-cyan-500/[0.08] shadow-glow-cyan scale-[1.01]"
            : "hover:border-white/20 hover:bg-slate-900/70"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,application/zip,application/x-zip-compressed"
          onChange={handleFileChange}
          className="hidden"
          disabled={isScanning}
        />

        {/* Ambient inner glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/15 transition-all" />

        {/* Upload Icon */}
        <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/10 border border-cyan-500/30 flex items-center justify-center shadow-glow-cyan group-hover:scale-105 transition-transform duration-300">
          <UploadCloud className="w-10 h-10 text-cyan-400 group-hover:text-cyan-300" />
        </div>

        {selectedFile ? (
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-200">
              <FileArchive className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-xs font-semibold">
                {selectedFile.name}
              </span>
              <span className="text-[11px] text-slate-400">
                ({(selectedFile.size / 1024).toFixed(0)} KB)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Click or drop another ZIP to replace
            </p>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-bold text-white mb-1.5">
              Upload your Project ZIP
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mb-4">
              Drag & drop your project archive here, or{" "}
              <span className="text-cyan-400 font-semibold underline underline-offset-4">
                browse files
              </span>
            </p>

            <div className="inline-flex items-center space-x-2 text-[11px] font-medium text-slate-400 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
              <span>ZIP archives only</span>
              <span>•</span>
              <span>Maximum 10 MB</span>
              <span>•</span>
              <span>Python, JavaScript, TypeScript</span>
            </div>
          </div>
        )}

        {/* Inline Error Display */}
        {errorMessage && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center space-x-2 text-rose-300 text-xs font-medium max-w-md mx-auto"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Action Trigger Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        {selectedFile && (
          <button
            onClick={handleStartScanClick}
            disabled={isScanning}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold text-sm shadow-glow-cyan transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            Start Security Audit
          </button>
        )}

        <button
          onClick={onQuickDemoScan}
          disabled={isScanning}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl glass-card hover:bg-white/10 border border-white/15 text-slate-200 hover:text-white font-semibold text-sm transition-all flex items-center justify-center space-x-2 shadow-glass"
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Try Sample Demo (VibeShop ZIP)</span>
        </button>
      </div>

      {/* Recent Scans Strip (Client-Side History) */}
      {recentScans && recentScans.length > 0 && (
        <div className="mt-10 p-4 rounded-2xl glass-card border border-white/[0.08]">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-white">
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span>Recent Scan History</span>
            </div>
            {onClearHistory && (
              <button
                onClick={onClearHistory}
                className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center space-x-1 transition-colors"
                title="Clear local history"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {recentScans.slice(0, 3).map((item) => {
              const isGood = item.score >= 80;
              const isCritical = item.score < 40;

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectRecentScan && onSelectRecentScan(item)}
                  className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-cyan-500/30 flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                        isCritical
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : isGood
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {item.score}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                        {item.fileName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.timestamp}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-xs text-slate-400 group-hover:text-cyan-300 transition-colors">
                    <span className="text-[11px]">View Report</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Feature Highlights Grid */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="glass-card specular-border p-4 rounded-2xl border border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2.5">
            <KeyRound className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-white mb-1">
            Exposed Secrets & .env
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Catches hardcoded API keys, database credentials, and unignored environment files.
          </p>
        </div>

        <div className="glass-card specular-border p-4 rounded-2xl border border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-2.5">
            <Database className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-white mb-1">
            SQL Injection Risks
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Identifies dynamic f-string and template string concatenations in database queries.
          </p>
        </div>

        <div className="glass-card specular-border p-4 rounded-2xl border border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2.5">
            <UserCheck className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-white mb-1">
            Authorization & IDOR
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Detects unvalidated user-controlled resource identifiers in endpoint lookups.
          </p>
        </div>
      </div>
    </div>
  );
};
