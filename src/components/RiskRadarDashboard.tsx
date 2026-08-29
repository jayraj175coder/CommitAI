"use client";

import React from "react";
import { Commitment } from "@/types/commitment";
import { calculateRiskScore } from "@/lib/scoringEngine";
import { formatDueDateDisplay } from "@/lib/dateNormalizer";
import { ShieldAlert, AlertTriangle, ExternalLink, Check } from "lucide-react";

interface RiskRadarDashboardProps {
  commitments: Commitment[];
  onSelectEvidence: (commitment: Commitment) => void;
  onStatusChange: (id: string, newStatus: Commitment["status"]) => void;
  onFilterRisk: (category: string) => void;
}

export function RiskRadarDashboard({
  commitments,
  onSelectEvidence,
  onStatusChange,
  onFilterRisk,
}: RiskRadarDashboardProps) {
  const activeList = commitments.filter((c) => c.status !== "completed");

  const evaluated = activeList.map((c) => ({
    commitment: c,
    risk: calculateRiskScore(c),
  }));

  const critical = evaluated.filter((e) => e.risk.riskCategory === "Critical");
  const high = evaluated.filter((e) => e.risk.riskCategory === "High");
  const medium = evaluated.filter((e) => e.risk.riskCategory === "Medium");
  const low = evaluated.filter((e) => e.risk.riskCategory === "Low");

  const sortedRisks = [...evaluated].sort((a, b) => b.risk.riskScore - a.risk.riskScore).slice(0, 5);

  return (
    <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <h3 className="text-lg font-bold text-white tracking-tight">Risk Radar — Predictive Risk Engine</h3>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time risk scoring grounded in verified Gmail and Google Calendar evidence.
          </p>
        </div>

        {/* Risk Category Pills */}
        <div className="flex items-center gap-2 text-xs font-mono font-bold">
          <button
            onClick={() => onFilterRisk("critical")}
            className="bg-red-950/80 hover:bg-red-900 text-red-400 border border-red-800 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            🔴 {critical.length} Critical
          </button>
          <button
            onClick={() => onFilterRisk("high")}
            className="bg-rose-950/80 hover:bg-rose-900 text-rose-400 border border-rose-800 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            🟠 {high.length} High Risk
          </button>
          <button
            onClick={() => onFilterRisk("medium")}
            className="bg-amber-950/80 hover:bg-amber-900 text-amber-400 border border-amber-800 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            🟡 {medium.length} Medium Risk
          </button>
          <button
            onClick={() => onFilterRisk("low")}
            className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            🟢 {low.length} Low Risk
          </button>
        </div>
      </div>

      {/* Top High-Risk Commitments List */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
          Top Highest-Risk Obligations ({sortedRisks.length})
        </h4>

        {sortedRisks.length === 0 ? (
          <div className="bg-zinc-900/40 p-8 rounded-xl border border-zinc-800/80 text-center space-y-1">
            <p className="text-zinc-300 font-semibold text-sm">No high-risk obligations detected.</p>
            <p className="text-zinc-500 text-xs">All active commitments are on track.</p>
          </div>
        ) : (
          sortedRisks.map(({ commitment, risk }) => (
            <div
              key={commitment.id}
              className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-zinc-700"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                      risk.riskCategory === "Critical"
                        ? "bg-red-950 text-red-400 border-red-800"
                        : risk.riskCategory === "High"
                        ? "bg-rose-950 text-rose-400 border-rose-800"
                        : risk.riskCategory === "Medium"
                        ? "bg-amber-950 text-amber-400 border-amber-800"
                        : "bg-emerald-950 text-emerald-400 border-emerald-800"
                    }`}
                  >
                    Risk Score: {risk.riskScore} / 100 ({risk.riskCategory})
                  </span>

                  <span className="text-xs text-zinc-400 font-mono">
                    Due: {formatDueDateDisplay(commitment.dueDate, commitment.originalDateText)}
                  </span>
                </div>

                <h5 className="text-sm font-bold text-white">
                  <span className="text-indigo-400">{commitment.person}: </span>
                  <span>{commitment.commitment}</span>
                </h5>

                {/* Why At Risk? Reasons Box */}
                <div className="bg-zinc-950/80 border border-zinc-800 p-2.5 rounded-lg text-xs space-y-1">
                  <div className="text-amber-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Why at risk?
                  </div>
                  <ul className="list-disc list-inside text-zinc-300 text-[11px] space-y-0.5">
                    {risk.reasons.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                  <div className="text-indigo-300 text-[11px] pt-0.5 font-medium">
                    Recommended Action: {risk.recommendedAction}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => onSelectEvidence(commitment)}
                  className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Evidence
                </button>
                <button
                  onClick={() => onStatusChange(commitment.id, "completed")}
                  className="text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> Mark Done
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
