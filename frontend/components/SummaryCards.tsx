"use client";

import React from "react";
import { Summary } from "@/lib/types";
import { AlertOctagon, AlertTriangle, AlertCircle, Info } from "lucide-react";

interface SummaryCardsProps {
  summary: Summary;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const cards = [
    {
      label: "Critical",
      count: summary.critical,
      color: "text-rose-400",
      border: "border-rose-500/20",
      bg: "bg-rose-500/[0.06]",
      icon: AlertOctagon,
      desc: "Secrets, SQLi",
    },
    {
      label: "High",
      count: summary.high,
      color: "text-amber-400",
      border: "border-amber-500/20",
      bg: "bg-amber-500/[0.06]",
      icon: AlertTriangle,
      desc: "Authorization / IDOR",
    },
    {
      label: "Medium",
      count: summary.medium,
      color: "text-yellow-400",
      border: "border-yellow-500/20",
      bg: "bg-yellow-500/[0.06]",
      icon: AlertCircle,
      desc: "Config / Exposure",
    },
    {
      label: "Low",
      count: summary.low,
      color: "text-emerald-400",
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/[0.06]",
      icon: Info,
      desc: "Best Practices",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className={`glass-card specular-border rounded-xl p-4 border ${item.border} ${item.bg} relative overflow-hidden`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">
                {item.label}
              </span>
              <Icon className={`w-4 h-4 ${item.color} opacity-80`} />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${item.color}`}>
                {item.count}
              </span>
              <span className="text-[11px] text-slate-400">
                finding{item.count === 1 ? "" : "s"}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {item.desc}
            </p>
          </div>
        );
      })}
    </div>
  );
};
