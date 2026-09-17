"use client";

import React, { useState, useEffect } from "react";
import { AppState, ScanResponse } from "@/lib/types";
import { scanProjectZip } from "@/lib/api";
import { Header } from "@/components/Header";
import { UploadScreen, ScanHistoryItem } from "@/components/UploadScreen";
import { ScanningScreen } from "@/components/ScanningScreen";
import { SecurityReport } from "@/components/SecurityReport";
import { ErrorMessage } from "@/components/ErrorMessage";
import { MOCK_VIBESHOP_REPORT } from "@/lib/mockData";

const STORAGE_KEY = "viberguard_scan_history_v1";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("upload");
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [scanReport, setScanReport] = useState<ScanResponse | null>(null);
  const [recentScans, setRecentScans] = useState<ScanHistoryItem[]>([]);
  const [errorDetails, setErrorDetails] = useState<{
    code: string;
    message: string;
  } | null>(null);

  // Load scan history from localStorage on initial render
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentScans(parsed);
        }
      }
    } catch {
      // Ignore storage read errors
    }
  }, []);

  // Helper to persist a completed report to local history
  const persistScanToHistory = (fileName: string, report: ScanResponse) => {
    try {
      const newItem: ScanHistoryItem = {
        id: Date.now().toString(),
        fileName,
        score: report.security_score,
        timestamp: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        report,
      };

      setRecentScans((prev) => {
        // Keep unique by fileName, max 5 items
        const filtered = prev.filter((item) => item.fileName !== fileName);
        const updated = [newItem, ...filtered].slice(0, 5);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // Ignore storage quota errors
        }
        return updated;
      });
    } catch {
      // Fallback
    }
  };

  // Clear local storage history
  const handleClearHistory = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setRecentScans([]);
    } catch {
      // Ignore
    }
  };

  // Handle uploading and initiating scan
  const handleStartScan = async (file: File) => {
    setSelectedFileName(file.name);
    setAppState("scanning");
    setErrorDetails(null);

    try {
      const report = await scanProjectZip(file, demoMode);
      setScanReport(report);
      persistScanToHistory(file.name, report);
      setAppState("report");
    } catch (err: unknown) {
      const errorObj = err as Error & { code?: string };
      setErrorDetails({
        code: errorObj.code || "SCAN_FAILED",
        message:
          errorObj.message ||
          "An unexpected error occurred while scanning the project archive.",
      });
      setAppState("error");
    }
  };

  // Quick Demo Launcher (VibeShop demo project from 07_DEMO_PROJECT_SPEC.md)
  const handleQuickDemoScan = async () => {
    const demoFileName = "vibeshop-mvp-demo.zip";
    setSelectedFileName(demoFileName);
    setAppState("scanning");
    setErrorDetails(null);

    // Simulate scanning pipeline with realistic indeterminate delay
    setTimeout(() => {
      setScanReport(MOCK_VIBESHOP_REPORT);
      persistScanToHistory(demoFileName, MOCK_VIBESHOP_REPORT);
      setAppState("report");
    }, 2800);
  };

  // Select a past scan from the history ribbon
  const handleSelectRecentScan = (item: ScanHistoryItem) => {
    setSelectedFileName(item.fileName);
    setScanReport(item.report);
    setAppState("report");
  };

  // Reset workflow: Return to Upload screen
  const handleResetToUpload = () => {
    setAppState("upload");
    setSelectedFileName("");
    setScanReport(null);
    setErrorDetails(null);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Glass Navigation */}
      <Header demoMode={demoMode} onToggleDemoMode={setDemoMode} />

      {/* Main Screen Content Router with Fade Transitions */}
      <main className="flex-1 flex flex-col justify-center px-4 sm:px-6 py-6 sm:py-10 transition-all duration-300">
        {appState === "upload" && (
          <UploadScreen
            onStartScan={handleStartScan}
            onQuickDemoScan={handleQuickDemoScan}
            isScanning={false}
            recentScans={recentScans}
            onSelectRecentScan={handleSelectRecentScan}
            onClearHistory={handleClearHistory}
          />
        )}

        {appState === "scanning" && (
          <ScanningScreen fileName={selectedFileName || "project.zip"} />
        )}

        {appState === "report" && scanReport && (
          <SecurityReport
            report={scanReport}
            fileName={selectedFileName || "project.zip"}
            onScanAnother={handleResetToUpload}
          />
        )}

        {appState === "error" && errorDetails && (
          <ErrorMessage
            errorCode={errorDetails.code}
            errorMessage={errorDetails.message}
            onRetry={handleResetToUpload}
            onUseDemoMode={() => {
              setDemoMode(true);
              handleQuickDemoScan();
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/[0.06] py-6 text-center text-xs text-slate-400 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-300">
              ViberGuard AI Auditor
            </span>
            <span>•</span>
            <span>VibeCoder Edition</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Deterministic AST Pattern Analysis • Contextual AI Explanation Layer • Zero Hallucinations
          </p>
        </div>
      </footer>
    </div>
  );
}
