"use client";

import React, { useState } from "react";
import { Commitment, CommitmentStatus } from "@/types/commitment";
import { calculateCommitmentHealth, calculateRiskScore } from "@/lib/scoringEngine";
import { formatDueDateDisplay } from "@/lib/dateNormalizer";
import { generateActionPlan } from "@/lib/actionPlanGenerator";
import {
  ShieldAlert,
  ExternalLink,
  Check,
  Sparkles,
  Calendar,
  Zap,
  Activity,
  ArrowRight,
  HelpCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  UserCheck,
  Clock3
} from "lucide-react";
import { StatusBadge, SourceBadge } from "./StatusBadge";

interface CommandCenterViewProps {
  commitments: Commitment[];
  onSelectEvidence: (commitment: Commitment) => void;
  onStatusChange: (id: string, newStatus: CommitmentStatus) => void;
  onUpdateCommitment?: (id: string, updates: Partial<Commitment>) => void;
  onFilterMetric: (filter: string) => void;
  onNavigateToTab: (tab: string) => void;
  onSyncNow?: () => void;
}

export function CommandCenterView({
  commitments,
  onSelectEvidence,
  onStatusChange,
  _onUpdateCommitment,
  onFilterMetric,
  onNavigateToTab,
  onSyncNow,
}: CommandCenterViewProps & { _onUpdateCommitment?: unknown }) {
  const [showHealthWhy, setShowHealthWhy] = useState(false);
  const [whySeeingId, setWhySeeingId] = useState<string | null>(null);

  const activeCommitments = commitments.filter((c) => c.status !== "completed");
  const healthData = calculateCommitmentHealth(commitments);
  const { healthScore, healthLabel, breakdown } = healthData;

  // Filter categories
  const criticalAttention = activeCommitments.filter((c) => {
    const r = calculateRiskScore(c);
    return r.riskCategory === "Critical" || c.status === "overdue";
  });
  const dueToday = activeCommitments.filter((c) => c.status === "due_today");
  const dueThisWeek = activeCommitments.filter((c) => c.status === "due_today" || c.status === "due_soon");
  const waitingOnThem = activeCommitments.filter((c) => c.direction === "they_owe_me" || c.direction === "owed_to_me");
  const waitingOnMe = activeCommitments.filter((c) => c.direction === "i_owe" || c.direction === "owed_by_me");
  const ambiguous = activeCommitments.filter((c) => c.status === "ambiguous");
  const conflicts = activeCommitments.filter((c) => !!c.conflictWithId);

  // Priority Queue: Top 5 Highest Risk Active
  const priorityQueue = [...activeCommitments]
    .map((c) => ({ commitment: c, risk: calculateRiskScore(c) }))
    .sort((a, b) => b.risk.riskScore - a.risk.riskScore)
    .slice(0, 5);

  // Top Risk Item
  const topRiskItem = priorityQueue.length > 0 ? priorityQueue[0] : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 0. BEFORE vs AFTER COMMITAI BRAND POSITIONING */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="text-center space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 font-bold bg-indigo-950/60 border border-indigo-800/60 px-3 py-0.5 rounded-full">
            Evidence-First Architecture
          </span>
          <h3 className="text-lg font-bold text-white tracking-tight">CommitAI remembers what people promise.</h3>
          <p className="text-xs text-zinc-400 max-w-lg mx-auto">
            Turn scattered promises across email, calendars and conversations into one intelligent, evidence-backed commitment layer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs font-mono">
          <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl space-y-2">
            <span className="text-red-400 font-bold uppercase tracking-wider block text-[11px]">BEFORE COMMITAI (Scattered &amp; Forgotten)</span>
            <div className="flex flex-wrap gap-2 text-[11px] text-zinc-400">
              <span className="bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">📧 Email Threads</span>
              <span className="bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">💬 Chat Messages</span>
              <span className="bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">📅 Calendar Events</span>
              <span className="bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">📝 Meeting Notes</span>
            </div>
            <p className="text-zinc-500 text-[11px] italic pt-1">&quot;Promises scattered everywhere, deadlines missed without warning.&quot;</p>
          </div>

          <div className="bg-indigo-950/30 border border-indigo-500/40 p-4 rounded-xl space-y-2">
            <span className="text-indigo-300 font-bold uppercase tracking-wider block text-[11px]">AFTER COMMITAI (One Verified Commitment)</span>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <span className="bg-indigo-900/50 text-indigo-200 px-2 py-0.5 rounded border border-indigo-700">Who</span>
              <span className="bg-indigo-900/50 text-indigo-200 px-2 py-0.5 rounded border border-indigo-700">What</span>
              <span className="bg-indigo-900/50 text-indigo-200 px-2 py-0.5 rounded border border-indigo-700">When</span>
              <span className="bg-amber-900/50 text-amber-200 px-2 py-0.5 rounded border border-amber-700">Risk Score</span>
              <span className="bg-emerald-900/50 text-emerald-200 px-2 py-0.5 rounded border border-emerald-700">Verbatim Evidence</span>
              <span className="bg-blue-900/50 text-blue-200 px-2 py-0.5 rounded border border-blue-700">Next Action</span>
            </div>
            <p className="text-indigo-300/80 text-[11px] font-sans font-medium pt-1">✓ One continuous, evidence-grounded source of truth.</p>
          </div>
        </div>
      </div>

      {/* 1. DAILY BRIEF / WELCOME BANNER */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-950/60 border border-indigo-800/50 px-3 py-1 rounded-full text-xs font-mono text-indigo-400 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Verified Operations Command Center
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Today&apos;s Operational Brief</h2>
            <p className="text-sm text-zinc-400 mt-0.5">
              Aggregated real-time intelligence from authorized Gmail threads and Calendar events.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Health Badge Button */}
            <button
              onClick={() => setShowHealthWhy(!showHealthWhy)}
              className={`p-3 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all shadow ${
                healthLabel === "Excellent"
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-800 hover:bg-emerald-900"
                  : healthLabel === "Good"
                  ? "bg-indigo-950/80 text-indigo-300 border-indigo-800 hover:bg-indigo-900"
                  : healthLabel === "At Risk"
                  ? "bg-amber-950/80 text-amber-300 border-amber-800 hover:bg-amber-900"
                  : "bg-red-950/80 text-red-300 border-red-800 hover:bg-red-900"
              }`}
            >
              <Activity className="w-4 h-4 shrink-0" />
              <span>Health: {healthScore}/100 ({healthLabel})</span>
              <HelpCircle className="w-3.5 h-3.5 opacity-70" />
            </button>

            {onSyncNow && (
              <button
                onClick={onSyncNow}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-3 rounded-xl transition-all shadow flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Now</span>
              </button>
            )}
          </div>
        </div>

        {/* Health Explanation Dropdown */}
        {showHealthWhy && (
          <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-xl text-xs space-y-2 animate-in fade-in duration-150">
            <div className="font-bold text-indigo-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              Why is your Commitment Health score {healthScore}/100?
            </div>
            <p className="text-zinc-300 leading-relaxed">
              Your health score evaluates active obligation ratio, overdue penalties, approaching deadlines, timeline conflicts, and risk density.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] pt-1">
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                <span className="text-zinc-500 block">Active Total:</span>
                <span className="text-white font-bold">{breakdown.active}</span>
              </div>
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                <span className="text-red-400 block">Overdue:</span>
                <span className="text-red-300 font-bold">{breakdown.overdue}</span>
              </div>
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                <span className="text-amber-400 block">High Risk:</span>
                <span className="text-amber-300 font-bold">{breakdown.atRisk}</span>
              </div>
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                <span className="text-purple-400 block">Conflicts:</span>
                <span className="text-purple-300 font-bold">{breakdown.conflicts}</span>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Brief Summary Bullets */}
        {activeCommitments.length > 0 ? (
          <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-zinc-200 uppercase tracking-wider font-mono text-[11px] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Key Executive Takeaways:
            </div>
            <ul className="space-y-1.5 text-zinc-300">
              {breakdown.overdue > 0 && (
                <li className="flex items-center gap-2 text-red-300 font-medium">
                  <span>🔴</span>
                  <span>{breakdown.overdue} obligation(s) are currently past due and require immediate follow-up.</span>
                </li>
              )}
              {dueToday.length > 0 && (
                <li className="flex items-center gap-2 text-amber-300 font-medium">
                  <span>⚡</span>
                  <span>{dueToday.length} obligation(s) scheduled for completion today.</span>
                </li>
              )}
              {waitingOnThem.length > 0 && (
                <li className="flex items-center gap-2 text-cyan-300 font-medium">
                  <span>⏳</span>
                  <span>You are waiting on deliverables from {Array.from(new Set(waitingOnThem.map((c) => c.person))).length} contact(s).</span>
                </li>
              )}
              {topRiskItem && (
                <li className="flex items-center gap-2 text-rose-300 font-medium">
                  <span>⚠️</span>
                  <span>
                    Highest risk item: <strong>{topRiskItem.commitment.person}</strong> — &quot;{topRiskItem.commitment.commitment}&quot; (Risk: {topRiskItem.risk.riskScore}/100)
                  </span>
                </li>
              )}
            </ul>
          </div>
        ) : (
          <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl text-xs text-zinc-400 text-center">
            No active obligations currently require immediate attention.
          </div>
        )}
      </div>

      {/* 1.5 RECENTLY DISCOVERED FEED */}
      {commitments.length > 0 && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Recently Discovered Feed
            </h4>
            <span className="text-[10px] font-mono text-zinc-500">Live extracted obligations</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {commitments.slice(0, 3).map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectEvidence(c)}
                className="bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs space-y-2 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <SourceBadge sourceType={c.sourceType} source={c.source} />
                  <span className="text-emerald-400 font-mono font-bold">{Math.round(c.confidence * 100)}% Verified</span>
                </div>
                <div>
                  <h5 className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {c.person}: &quot;{c.commitment}&quot;
                  </h5>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    Due: {formatDueDateDisplay(c.dueDate, c.originalDateText)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. ATTENTION SUMMARY BAR (CLICKABLE KPI COUNTERS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
        <button
          onClick={() => onFilterMetric("critical")}
          className="bg-zinc-950 border border-red-900/50 hover:border-red-500 p-3 rounded-2xl text-left transition-all group"
        >
          <span className="text-[10px] font-mono text-red-400 font-bold uppercase block">Critical</span>
          <span className="text-2xl font-extrabold text-red-400 mt-1 block">{criticalAttention.length}</span>
          <span className="text-[10px] text-zinc-500 font-mono group-hover:text-red-300">Inspect List →</span>
        </button>

        <button
          onClick={() => onFilterMetric("due48Hours")}
          className="bg-zinc-950 border border-amber-900/50 hover:border-amber-500 p-3 rounded-2xl text-left transition-all group"
        >
          <span className="text-[10px] font-mono text-amber-400 font-bold uppercase block">Due Today</span>
          <span className="text-2xl font-extrabold text-amber-400 mt-1 block">{dueToday.length}</span>
          <span className="text-[10px] text-zinc-500 font-mono group-hover:text-amber-300">Inspect List →</span>
        </button>

        <button
          onClick={() => onFilterMetric("due48Hours")}
          className="bg-zinc-950 border border-blue-900/50 hover:border-blue-500 p-3 rounded-2xl text-left transition-all group"
        >
          <span className="text-[10px] font-mono text-blue-400 font-bold uppercase block">Due This Week</span>
          <span className="text-2xl font-extrabold text-blue-400 mt-1 block">{dueThisWeek.length}</span>
          <span className="text-[10px] text-zinc-500 font-mono group-hover:text-blue-300">Inspect List →</span>
        </button>

        <button
          onClick={() => onFilterMetric("active")}
          className="bg-zinc-950 border border-cyan-900/50 hover:border-cyan-500 p-3 rounded-2xl text-left transition-all group"
        >
          <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase block">Waiting On Them</span>
          <span className="text-2xl font-extrabold text-cyan-300 mt-1 block">{waitingOnThem.length}</span>
          <span className="text-[10px] text-zinc-500 font-mono group-hover:text-cyan-200">Inspect List →</span>
        </button>

        <button
          onClick={() => onFilterMetric("active")}
          className="bg-zinc-950 border border-indigo-900/50 hover:border-indigo-500 p-3 rounded-2xl text-left transition-all group"
        >
          <span className="text-[10px] font-mono text-indigo-300 font-bold uppercase block">Waiting On Me</span>
          <span className="text-2xl font-extrabold text-indigo-300 mt-1 block">{waitingOnMe.length}</span>
          <span className="text-[10px] text-zinc-500 font-mono group-hover:text-indigo-200">Inspect List →</span>
        </button>

        <button
          onClick={() => onFilterMetric("all")}
          className="bg-zinc-950 border border-purple-900/50 hover:border-purple-500 p-3 rounded-2xl text-left transition-all group"
        >
          <span className="text-[10px] font-mono text-purple-300 font-bold uppercase block">Ambiguous</span>
          <span className="text-2xl font-extrabold text-purple-300 mt-1 block">{ambiguous.length}</span>
          <span className="text-[10px] text-zinc-500 font-mono group-hover:text-purple-200">Inspect List →</span>
        </button>

        <button
          onClick={() => onFilterMetric("conflicts")}
          className="bg-zinc-950 border border-rose-900/50 hover:border-rose-500 p-3 rounded-2xl text-left transition-all group"
        >
          <span className="text-[10px] font-mono text-rose-300 font-bold uppercase block">Conflicts</span>
          <span className="text-2xl font-extrabold text-rose-300 mt-1 block">{conflicts.length}</span>
          <span className="text-[10px] text-zinc-500 font-mono group-hover:text-rose-200">Inspect List →</span>
        </button>
      </div>

      {/* 2.5 ANALYTICS & RISK DISTRIBUTION BAR CHART */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" /> Operational Risk Distribution Analytics
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">Visual workload &amp; commitment risk profile derived from real data.</p>
          </div>
          <span className="text-xs font-mono text-zinc-500">{commitments.length} Total Commitments Analysed</span>
        </div>

        {/* Visual Percentage Progress & Bar Graph */}
        <div className="space-y-3 text-xs font-mono">
          {/* Multi-segment Progress Bar */}
          <div className="h-4 w-full bg-zinc-900 rounded-full overflow-hidden flex border border-zinc-800 p-0.5">
            <div
              style={{ width: `${commitments.length > 0 ? (criticalAttention.length / commitments.length) * 100 : 0}%` }}
              className="bg-red-500 h-full rounded-l transition-all"
              title="Critical / Overdue"
            />
            <div
              style={{ width: `${commitments.length > 0 ? (dueToday.length / commitments.length) * 100 : 0}%` }}
              className="bg-amber-500 h-full transition-all"
              title="Due Today"
            />
            <div
              style={{ width: `${commitments.length > 0 ? (waitingOnThem.length / commitments.length) * 100 : 0}%` }}
              className="bg-cyan-500 h-full transition-all"
              title="Waiting On Them"
            />
            <div
              style={{ width: `${commitments.length > 0 ? (waitingOnMe.length / commitments.length) * 100 : 0}%` }}
              className="bg-indigo-500 h-full transition-all"
              title="Waiting On Me"
            />
            <div
              style={{ width: `${commitments.length > 0 ? ((commitments.length - activeCommitments.length) / commitments.length) * 100 : 0}%` }}
              className="bg-emerald-500 h-full rounded-r transition-all"
              title="Completed"
            />
          </div>

          {/* Chart Breakdown Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1 text-[11px]">
            <div className="flex items-center gap-2 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
              <span className="text-zinc-400">Overdue ({criticalAttention.length})</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-zinc-400">Due Today ({dueToday.length})</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0" />
              <span className="text-zinc-400">Owed To You ({waitingOnThem.length})</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
              <span className="text-zinc-400">You Owe ({waitingOnMe.length})</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-zinc-400">Fulfilled ({commitments.length - activeCommitments.length})</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PRIORITY QUEUE (TOP 5 HIGHEST RISK OBLIGATIONS) */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-400" /> Your Priority Queue
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Top 5 commitments requiring highest attention right now.</p>
          </div>
          <button
            onClick={() => onNavigateToTab("commitments")}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1"
          >
            View All ({commitments.length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {priorityQueue.length === 0 ? (
          <div className="bg-zinc-900/40 p-10 rounded-xl border border-zinc-800/80 text-center space-y-3">
            <Check className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-white font-bold text-base">No active commitments found</h4>
            <p className="text-zinc-400 text-xs max-w-md mx-auto">
              CommitAI scans authorized messages and calendar events for promises, deadlines and follow-ups.
            </p>
            {onSyncNow && (
              <button
                onClick={onSyncNow}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow inline-flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sync Authorized Gmail &amp; Calendar
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {priorityQueue.map(({ commitment, risk }) => {
              const actionPlan = generateActionPlan(commitment);
              const isWhyOpen = whySeeingId === commitment.id;

              return (
                <div
                  key={commitment.id}
                  className="bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 p-4 rounded-xl space-y-3 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
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
                        Risk {risk.riskScore}/100 ({risk.riskCategory})
                      </span>
                      <SourceBadge sourceType={commitment.sourceType} source={commitment.source} />
                      <StatusBadge status={commitment.status} />
                    </div>

                    <span className="text-xs text-zinc-400 font-mono">
                      Due: {formatDueDateDisplay(commitment.dueDate, commitment.originalDateText)}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white">
                      <span className="text-indigo-400">{commitment.person}: </span>
                      <span>{commitment.commitment}</span>
                    </h4>
                  </div>

                  {/* Why It Matters & Next Action */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-zinc-950/80 p-3 rounded-lg border border-zinc-800 space-y-1">
                      <span className="text-zinc-500 font-bold uppercase text-[10px] block">Why It Matters:</span>
                      <p className="text-zinc-300 font-medium">{risk.reasons.join(" • ")}</p>
                    </div>

                    <div className="bg-zinc-950/80 p-3 rounded-lg border border-indigo-500/30 space-y-1">
                      <span className="text-indigo-400 font-bold uppercase text-[10px] block">Recommended Next Action:</span>
                      <p className="text-indigo-200 font-medium">{actionPlan.suggestedNextStep}</p>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectEvidence(commitment)}
                        className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View Evidence
                      </button>

                      <button
                        onClick={() => setWhySeeingId(isWhyOpen ? null : commitment.id)}
                        className="text-xs text-zinc-400 hover:text-zinc-200 font-mono flex items-center gap-1 px-2 py-1 rounded transition-colors"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
                        Why am I seeing this?
                        {isWhyOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                          commitment.commitment
                        )}&details=${encodeURIComponent(`Source: ${commitment.source}\nEvidence: ${commitment.evidence}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5" /> Calendar Event
                      </a>

                      <button
                        onClick={() => onStatusChange(commitment.id, "completed")}
                        className="text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark Done
                      </button>
                    </div>
                  </div>

                  {/* Evidence-First AI "Why Am I Seeing This?" Box */}
                  {isWhyOpen && (
                    <div className="bg-zinc-950 p-4 rounded-xl border border-indigo-500/40 space-y-2 text-xs font-mono animate-in fade-in duration-150">
                      <div className="font-bold text-indigo-300 flex items-center gap-1.5 font-sans">
                        <FileText className="w-4 h-4 text-indigo-400" /> Evidence Provenance Trace:
                      </div>
                      <div className="text-zinc-300 space-y-1 leading-relaxed">
                        <div><span className="text-zinc-500">Source: </span>{commitment.source}</div>
                        <div><span className="text-zinc-500">Sender/Contact: </span>{commitment.person}</div>
                        <div><span className="text-zinc-500">Created At: </span>{new Date(commitment.createdAt).toLocaleString()}</div>
                        <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800 text-indigo-200 mt-2 font-mono">
                          &quot;{commitment.evidence}&quot;
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. WAITING ON ME vs WAITING ON THEM DUAL PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Panel 1: WAITING ON ME */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
            <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-400" /> WAITING ON ME ({waitingOnMe.length})
            </h4>
            <span className="text-[11px] font-mono text-zinc-500">Your Obligations</span>
          </div>

          {waitingOnMe.length === 0 ? (
            <p className="text-xs text-zinc-500 p-4 text-center">No active commitments owed by you.</p>
          ) : (
            <div className="space-y-2">
              {waitingOnMe.slice(0, 4).map((c) => (
                <div key={c.id} className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{c.person}</span>
                    <span className="text-[10px] font-mono text-zinc-400">Due: {formatDueDateDisplay(c.dueDate, c.originalDateText)}</span>
                  </div>
                  <p className="text-zinc-300 line-clamp-1">&quot;{c.commitment}&quot;</p>
                  <div className="pt-1 flex items-center justify-end gap-2">
                    <button
                      onClick={() => onSelectEvidence(c)}
                      className="text-[11px] text-indigo-400 hover:underline font-mono"
                    >
                      View Evidence
                    </button>
                    <button
                      onClick={() => onStatusChange(c.id, "completed")}
                      className="text-[11px] text-emerald-400 hover:underline font-mono"
                    >
                      Mark Done
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel 2: WAITING ON THEM */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
            <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-cyan-400" /> WAITING ON THEM ({waitingOnThem.length})
            </h4>
            <span className="text-[11px] font-mono text-zinc-500">Owed To You</span>
          </div>

          {waitingOnThem.length === 0 ? (
            <p className="text-xs text-zinc-500 p-4 text-center">No active commitments owed by external contacts.</p>
          ) : (
            <div className="space-y-2">
              {waitingOnThem.slice(0, 4).map((c) => (
                <div key={c.id} className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{c.person}</span>
                    <span className="text-[10px] font-mono text-zinc-400">Due: {formatDueDateDisplay(c.dueDate, c.originalDateText)}</span>
                  </div>
                  <p className="text-zinc-300 line-clamp-1">&quot;{c.commitment}&quot;</p>
                  <div className="pt-1 flex items-center justify-end gap-2">
                    <button
                      onClick={() => onSelectEvidence(c)}
                      className="text-[11px] text-indigo-400 hover:underline font-mono"
                    >
                      View Evidence
                    </button>
                    <button
                      onClick={() => onStatusChange(c.id, "completed")}
                      className="text-[11px] text-emerald-400 hover:underline font-mono"
                    >
                      Mark Done
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
