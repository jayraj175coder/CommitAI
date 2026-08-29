"use client";

import React, { useState } from "react";
import { Commitment } from "@/types/commitment";
import { StatusBadge } from "./StatusBadge";
import { formatDueDateDisplay } from "@/lib/dateNormalizer";
import { calculateRiskScore } from "@/lib/scoringEngine";
import { ArrowRight, Network, ShieldCheck, Zap, User, FileText, Activity } from "lucide-react";

interface CommitmentGraphProps {
  commitments: Commitment[];
  onSelectEvidence?: (commitment: Commitment) => void;
  onNavigateToTab?: (tab: string) => void;
}

export function CommitmentGraph({ commitments, onSelectEvidence, onNavigateToTab }: CommitmentGraphProps) {
  const [graphFilter, setGraphFilter] = useState<string>("all");
  const [selectedPersonFilter, setSelectedPersonFilter] = useState<string | null>(null);
  const [explainConnectionId, setExplainConnectionId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  // Filtered graph commitments
  const filteredCommitments = commitments.filter((c) => {
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.person.toLowerCase().includes(q) ||
        c.commitment.toLowerCase().includes(q) ||
        c.object.toLowerCase().includes(q) ||
        c.evidence.toLowerCase().includes(q) ||
        c.source.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    if (selectedPersonFilter && c.person.toLowerCase() !== selectedPersonFilter.toLowerCase()) return false;
    if (graphFilter === "waiting_them") return c.direction === "they_owe_me" && c.status !== "completed";
    if (graphFilter === "my_commitments") return c.direction === "i_owe" && c.status !== "completed";
    if (graphFilter === "overdue") return c.status === "overdue";
    if (graphFilter === "high_risk") {
      const risk = calculateRiskScore(c).riskCategory;
      return risk === "Critical" || risk === "High";
    }
    return true;
  });

  // Network Health
  const activeCount = commitments.filter((c) => c.status !== "completed").length;
  const overdueCount = commitments.filter((c) => c.status === "overdue").length;
  const highRiskCount = commitments.filter((c) => calculateRiskScore(c).riskCategory === "Critical" || calculateRiskScore(c).riskCategory === "High").length;
  const networkHealthLabel = overdueCount > 2 || highRiskCount > 3 ? "Critical Network Risk" : overdueCount > 0 ? "Network At Risk" : "Network Healthy";

  return (
    <div className="bg-zinc-950/90 border border-zinc-800/90 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl space-y-6">
      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b15_1px,transparent_1px),linear-gradient(to_bottom,#18181b15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Header & Graph Network Health */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10 border-b border-zinc-900 pb-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Network className="w-5 h-5" />
            </div>
            Commitment Network &amp; Relationship Graph
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Entity relationships derived strictly from authenticated Gmail and Calendar source evidence.
          </p>
        </div>

        {/* Network Health Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-mono font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${
              networkHealthLabel === "Network Healthy"
                ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                : networkHealthLabel === "Network At Risk"
                ? "bg-amber-950 text-amber-400 border-amber-800"
                : "bg-red-950 text-red-400 border-red-800"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            {networkHealthLabel} ({activeCount} Active Chains)
          </span>
        </div>
      </div>

      {/* Product Differentiation Callout */}
      <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl text-xs space-y-1 relative z-10">
        <strong className="text-zinc-200 block text-xs font-bold">Product Intelligence Differentiation:</strong>
        <p className="text-zinc-400 leading-relaxed">
          Traditional task managers organize tasks manually. <span className="text-indigo-300 font-semibold">CommitAI maps the commitments behind communication</span> automatically from email snippets and calendar events.
        </p>
      </div>

      {/* Graph Search Bar & Filters */}
      <div className="space-y-3 relative z-10">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search graph by person, promise, deliverable, or evidence..."
          className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 font-sans focus:outline-none focus:border-indigo-500"
        />

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold">
          <button
            onClick={() => { setGraphFilter("all"); setSelectedPersonFilter(null); setSearchQuery(""); }}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              graphFilter === "all" && !selectedPersonFilter && !searchQuery ? "bg-indigo-600 text-white border-indigo-500 shadow" : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
            }`}
          >
            ALL NODES ({commitments.length})
          </button>
          <button
            onClick={() => { setGraphFilter("waiting_them"); setSelectedPersonFilter(null); }}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              graphFilter === "waiting_them" ? "bg-cyan-600 text-white border-cyan-500 shadow" : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
            }`}
          >
            WAITING ON THEM
          </button>
          <button
            onClick={() => { setGraphFilter("my_commitments"); setSelectedPersonFilter(null); }}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              graphFilter === "my_commitments" ? "bg-amber-600 text-white border-amber-500 shadow" : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
            }`}
          >
            MY COMMITMENTS
          </button>
          <button
            onClick={() => { setGraphFilter("overdue"); setSelectedPersonFilter(null); }}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              graphFilter === "overdue" ? "bg-red-600 text-white border-red-500 shadow" : "bg-zinc-900 text-zinc-400 border-red-800 hover:text-white"
            }`}
          >
            OVERDUE ({overdueCount})
          </button>
          <button
            onClick={() => { setGraphFilter("high_risk"); setSelectedPersonFilter(null); }}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              graphFilter === "high_risk" ? "bg-purple-600 text-white border-purple-500 shadow" : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
            }`}
          >
            HIGH RISK ({highRiskCount})
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredCommitments.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 text-xs space-y-2 relative z-10">
          <Network className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-zinc-300 font-bold text-sm">Your commitment graph is still forming.</p>
          <p className="text-zinc-500 text-xs max-w-md mx-auto">
            Sync more Gmail or Calendar activity to discover relationships between people, promises and deadlines.
          </p>
        </div>
      ) : (
        /* Visual Graph Chain Directory */
        <div className="space-y-4 relative z-10">
          {filteredCommitments.map((c) => {
            const isOverdue = c.status === "overdue";
            const hasConflict = !!c.conflictWithId;
            const isExplainOpen = explainConnectionId === c.id;

            return (
              <div
                key={c.id}
                className={`p-4 rounded-xl border transition-all duration-200 relative overflow-hidden ${
                  hasConflict
                    ? "bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-950/20"
                    : isOverdue
                    ? "bg-red-950/20 border-red-900/50 shadow-lg shadow-red-950/20"
                    : "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 shadow-md"
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Entity Chain Links */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* Node 1: Person */}
                    <button
                      onClick={() => {
                        setSelectedPersonFilter(c.person);
                        if (onNavigateToTab) onNavigateToTab("people");
                      }}
                      className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-lg text-zinc-100 font-bold transition-all"
                      title="Click to view stakeholder profile"
                    >
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{c.person}</span>
                    </button>

                    <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />

                    {/* Node 2: Promise */}
                    <button
                      onClick={() => onSelectEvidence && onSelectEvidence(c)}
                      className="bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-200 font-medium max-w-[220px] truncate text-left"
                    >
                      {c.commitment}
                    </button>

                    <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />

                    {/* Node 3: Object Cluster */}
                    <span className="bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded-lg text-xs text-indigo-300 font-mono">
                      Topic: {c.object}
                    </span>

                    <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />

                    {/* Node 4: Due Date */}
                    <span className="text-xs text-zinc-300 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 font-mono">
                      Due: {formatDueDateDisplay(c.dueDate, c.originalDateText)}
                    </span>

                    <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />

                    <StatusBadge status={c.status} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
                    <button
                      onClick={() => setExplainConnectionId(isExplainOpen ? null : c.id)}
                      className="text-xs bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 px-3 py-1.5 rounded-lg font-mono flex items-center gap-1 transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Why Connected?
                    </button>

                    {onSelectEvidence && (
                      <button
                        onClick={() => onSelectEvidence(c)}
                        className="text-xs bg-indigo-600/15 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all shadow"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        Evidence
                      </button>
                    )}
                  </div>
                </div>

                {/* Explain Connection Box */}
                {isExplainOpen && (
                  <div className="mt-3 p-3.5 bg-zinc-950 border border-indigo-500/40 rounded-xl space-y-2 text-xs font-mono animate-in fade-in duration-150">
                    <div className="font-bold text-amber-300 flex items-center gap-1 font-sans">
                      <FileText className="w-4 h-4 text-amber-400" /> AI Grounded Relationship Explanation
                    </div>
                    <div className="text-zinc-300 space-y-1 leading-relaxed">
                      <div><span className="text-zinc-500">Connection Chain: </span>Source ({c.source}) → Participant ({c.person}) → Promise (&quot;{c.commitment}&quot;)</div>
                      <div><span className="text-zinc-500">Confidence: </span>{Math.round(c.confidence * 100)}% Verified</div>
                      <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800 text-indigo-200 mt-1 font-mono">
                        Verbatim Source Evidence: &quot;{c.evidence}&quot;
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
  );
}
