"use client";

import React, { useState } from "react";
import { Search, Check, Trash2, ShieldAlert, AlertTriangle, ExternalLink, ChevronDown, ChevronUp, HelpCircle, Calendar, Clock, Bell, Sparkles, FileText, CheckCircle2 } from "lucide-react";
import { StatusBadge, DirectionBadge, SourceBadge, ConfidenceIndicator } from "./StatusBadge";
import { formatDueDateDisplay } from "@/lib/dateNormalizer";
import { calculateAttentionScore } from "@/lib/scoringEngine";
import { generateActionPlan, ActionPlan } from "@/lib/actionPlanGenerator";

interface CommitmentsListProps {
  commitments: Commitment[];
  onSelectEvidence: (commitment: Commitment) => void;
  onStatusChange: (id: string, newStatus: Commitment["status"]) => void;
  onUpdateCommitment?: (id: string, updates: Partial<Commitment>) => void;
  onDeleteCommitment: (id: string) => void;
  defaultDirectionTab?: "all" | "i_owe" | "they_owe_me";
}

export function CommitmentsList({
  commitments,
  onSelectEvidence,
  onStatusChange,
  onUpdateCommitment,
  onDeleteCommitment,
  defaultDirectionTab = "all",
}: CommitmentsListProps) {
  const [directionTab, setDirectionTab] = useState<"all" | "i_owe" | "they_owe_me">(defaultDirectionTab);
  const [selectedSourceType, setSelectedSourceType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"attentionScore" | "dueDate" | "confidence" | "person">("attentionScore");
  const [expandedScoreId, setExpandedScoreId] = useState<string | null>(null);
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);
  const [actionPlans, setActionPlans] = useState<Record<string, ActionPlan>>({});

  const filtered = commitments.filter((c) => {
    if (selectedSourceType !== "all" && c.sourceType !== selectedSourceType) return false;
    if (directionTab !== "all") {
      if (directionTab === "i_owe" && c.direction !== "i_owe") return false;
      if (directionTab === "they_owe_me" && c.direction !== "they_owe_me") return false;
    }
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return (
        c.person.toLowerCase().includes(q) ||
        c.commitment.toLowerCase().includes(q) ||
        c.object.toLowerCase().includes(q) ||
        c.evidence.toLowerCase().includes(q) ||
        c.source.toLowerCase().includes(q)
      );
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (sortBy === "attentionScore") {
      return calculateAttentionScore(b).attentionScore - calculateAttentionScore(a).attentionScore;
    }
    if (sortBy === "dueDate") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortBy === "confidence") return b.confidence - a.confidence;
    if (sortBy === "person") return a.person.localeCompare(b.person);
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Source Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold">
        <span className="text-zinc-500 mr-1">Source Filter:</span>
        <button
          onClick={() => setSelectedSourceType("all")}
          className={`px-3 py-1 rounded-xl border transition-all ${
            selectedSourceType === "all" ? "bg-indigo-600 text-white border-indigo-500 shadow" : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
          }`}
        >
          All Sources
        </button>
        <button
          onClick={() => setSelectedSourceType("gmail")}
          className={`px-3 py-1 rounded-xl border transition-all ${
            selectedSourceType === "gmail" ? "bg-blue-600 text-white border-blue-500 shadow" : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
          }`}
        >
          Gmail
        </button>
        <button
          onClick={() => setSelectedSourceType("google_calendar")}
          className={`px-3 py-1 rounded-xl border transition-all ${
            selectedSourceType === "google_calendar" ? "bg-emerald-600 text-white border-emerald-500 shadow" : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
          }`}
        >
          Calendar
        </button>
        <button
          onClick={() => setSelectedSourceType("discord")}
          className={`px-3 py-1 rounded-xl border transition-all ${
            selectedSourceType === "discord" ? "bg-indigo-600 text-white border-indigo-500 shadow" : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
          }`}
        >
          Discord
        </button>
        <button
          onClick={() => setSelectedSourceType("telegram")}
          className={`px-3 py-1 rounded-xl border transition-all ${
            selectedSourceType === "telegram" ? "bg-cyan-600 text-white border-cyan-500 shadow" : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
          }`}
        >
          Telegram
        </button>
      </div>

      {/* Promise Inbox Dual Tabs (I PROMISED / THEY PROMISED) */}
      <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 text-xs font-bold w-fit shadow-lg">
        <button
          onClick={() => setDirectionTab("all")}
          className={`px-4 py-2 rounded-xl transition-all ${
            directionTab === "all" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          ALL PROMISES ({commitments.length})
        </button>
        <button
          onClick={() => setDirectionTab("i_owe")}
          className={`px-4 py-2 rounded-xl transition-all ${
            directionTab === "i_owe" ? "bg-amber-600 text-white shadow-md shadow-amber-600/30" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          I PROMISED ({commitments.filter((c) => c.direction === "i_owe").length})
        </button>
        <button
          onClick={() => setDirectionTab("they_owe_me")}
          className={`px-4 py-2 rounded-xl transition-all ${
            directionTab === "they_owe_me" ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          THEY PROMISED ({commitments.filter((c) => c.direction === "they_owe_me").length})
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 shadow-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search commitments, persons, objects, or source snippets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors font-medium"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 text-xs">
            {["all", "overdue", "due_today", "due_soon", "upcoming", "completed", "ambiguous"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-lg font-medium capitalize transition-all ${
                  filterStatus === st
                    ? "bg-indigo-600 text-white shadow"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Sort Control */}
          <select
            value={sortBy}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as "attentionScore" | "dueDate" | "confidence" | "person")}
            className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="attentionScore">Sort: Risk / Attention Score</option>
            <option value="dueDate">Sort: Due Date</option>
            <option value="confidence">Sort: AI Extraction Confidence</option>
            <option value="person">Sort: Person Name</option>
          </select>
        </div>
      </div>

      {/* Commitments Table / Cards */}
      {filtered.length === 0 ? (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-12 text-center shadow-xl space-y-2">
          <ShieldAlert className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <h4 className="text-zinc-300 font-semibold text-base">No commitments found yet.</h4>
          <p className="text-zinc-500 text-xs">
            Connect another communication source or sync again after new conversations arrive.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const scoreDetails = calculateAttentionScore(c);
            const hasConflict = !!c.conflictWithId;
            const isExpanded = expandedScoreId === c.id;

            return (
              <div
                key={c.id}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col gap-3 shadow-lg ${
                  hasConflict
                    ? "bg-amber-950/10 border-amber-500/40 hover:border-amber-500/70"
                    : c.status === "overdue"
                    ? "bg-red-950/10 border-red-900/40 hover:border-red-500/60"
                    : "bg-zinc-950 border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={c.status} />
                      <DirectionBadge direction={c.direction} />
                      <SourceBadge sourceType={c.sourceType} source={c.source} />
                      <ConfidenceIndicator confidence={c.confidence} />
                      
                      {scoreDetails.attentionScore > 0 && (
                        <button
                          onClick={() => setExpandedScoreId(isExpanded ? null : c.id)}
                          className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2.5 py-0.5 rounded-full flex items-center gap-1 hover:border-amber-500 transition-colors"
                          title="Click to expand 'Why did CommitAI detect this?'"
                        >
                          <span>Attention {scoreDetails.attentionScore}/100</span>
                          <span className="text-amber-500 font-mono">Why?</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}

                      {hasConflict && (
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-900/90 border border-amber-500/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          Commitment Conflict
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                      <span className="text-indigo-400">{c.person}:</span>
                      <span>{c.commitment}</span>
                    </h4>

                    {hasConflict && (
                      <div className="bg-amber-950/50 border border-amber-800/60 p-3 rounded-xl text-xs text-amber-200 space-y-1">
                        <strong className="text-amber-300 uppercase tracking-wider text-[10px] block">⚠️ POTENTIAL SCHEDULING CONFLICT</strong>
                        <div>{c.conflictReason}</div>
                        <div className="text-[11px] text-amber-300/80 pt-1 font-mono">
                          Recommended Action: &quot;Review conflict and ask for confirmation to reconcile updated timeline&quot;
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-1">
                      <div className="flex items-center gap-1 font-mono">
                        <span className="text-zinc-500">Deliverable:</span>
                        <span className="text-zinc-200 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                          {c.object}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 font-mono">
                        <span className="text-zinc-500">Due:</span>
                        <span className="text-zinc-200">
                          {formatDueDateDisplay(c.dueDate, c.originalDateText)}
                        </span>
                      </div>

                      <div className="text-zinc-500 max-w-[340px] truncate italic bg-zinc-900/40 px-2 py-0.5 rounded border border-zinc-900">
                        &quot;{c.evidence}&quot;
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => {
                        const plan = generateActionPlan(c);
                        setActionPlans((prev) => ({ ...prev, [c.id]: plan }));
                        setExpandedActionId(expandedActionId === c.id ? null : c.id);
                      }}
                      className="text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow shadow-indigo-600/20"
                      title="Generate AI Action Plan"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      Action Plan
                    </button>

                    <button
                      onClick={() => setExpandedActionId(expandedActionId === c.id ? null : c.id)}
                      className="text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 px-3 py-1.5 rounded-xl font-medium flex items-center gap-1 transition-all"
                    >
                      <span>Actions</span>
                      {expandedActionId === c.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    <button
                      onClick={() => onSelectEvidence(c)}
                      className="text-xs bg-indigo-600/15 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all shadow"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Evidence &amp; Timeline ({c.history ? c.history.length : 1})
                    </button>

                    <button
                      onClick={() =>
                        onStatusChange(c.id, c.status === "completed" ? "due_soon" : "completed")
                      }
                      className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold border transition-all flex items-center gap-1 ${
                        c.status === "completed"
                          ? "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                          : "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/25"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      {c.status === "completed" ? "Reopen" : "Done"}
                    </button>

                    <button
                      onClick={() => onDeleteCommitment(c.id)}
                      className="text-zinc-500 hover:text-red-400 p-2 rounded-xl hover:bg-red-950/30 transition-colors"
                      title="Delete commitment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expandable Actions Area & AI Action Plan */}
                {expandedActionId === c.id && (
                  <div className="mt-3 p-4 bg-zinc-900/90 border border-indigo-500/30 rounded-xl space-y-4 animate-in fade-in duration-150">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                      <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-300" /> Commitment Action Area
                      </h5>
                      <span className="text-[11px] font-mono text-zinc-400">ID: {c.id}</span>
                    </div>

                    {/* AI Action Plan Result Card */}
                    {actionPlans[c.id] && (
                      <div className="bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 p-3.5 rounded-xl text-xs space-y-2">
                        <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                          <CheckCircle2 className="w-4 h-4 text-amber-400" /> AI Grounded Action Plan
                        </div>
                        <div className="space-y-1 text-zinc-200">
                          <div>
                            <span className="text-zinc-400 font-semibold">Objective: </span>
                            {actionPlans[c.id].whatNeedsToBeDone}
                          </div>
                          <div>
                            <span className="text-zinc-400 font-semibold">Suggested Next Step: </span>
                            <span className="text-indigo-200 font-medium">{actionPlans[c.id].suggestedNextStep}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 font-semibold">Deadline: </span>
                            <span className="text-zinc-200 font-mono">{actionPlans[c.id].suggestedDeadline}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 font-semibold">People Involved: </span>
                            <span className="text-zinc-300">{actionPlans[c.id].peopleInvolved.join(", ")}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Controls Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      {/* Set / Edit Due Date */}
                      <div className="space-y-1 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                        <label className="text-[11px] font-semibold text-zinc-400 block flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Due Date
                        </label>
                        <input
                          type="date"
                          value={c.dueDate ? c.dueDate.substring(0, 10) : ""}
                          onChange={(e) => {
                            if (e.target.value && onUpdateCommitment) {
                              onUpdateCommitment(c.id, { dueDate: new Date(e.target.value).toISOString() });
                            }
                          }}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-zinc-200 text-xs font-mono"
                        />
                      </div>

                      {/* Snooze */}
                      <div className="space-y-1 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                        <label className="text-[11px] font-semibold text-zinc-400 block flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-400" /> Snooze Commitment
                        </label>
                        <select
                          onChange={(e) => {
                            const days = parseInt(e.target.value, 10);
                            if (days > 0 && onUpdateCommitment) {
                              const snoozedDate = new Date();
                              snoozedDate.setDate(snoozedDate.getDate() + days);
                              onUpdateCommitment(c.id, {
                                dueDate: snoozedDate.toISOString(),
                                snoozedUntil: snoozedDate.toISOString(),
                              });
                            }
                          }}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-zinc-200 text-xs"
                        >
                          <option value="0">Snooze for...</option>
                          <option value="1">1 Day (Tomorrow)</option>
                          <option value="3">3 Days</option>
                          <option value="7">1 Week</option>
                        </select>
                      </div>

                      {/* Google Calendar Event Export */}
                      <div className="space-y-1 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                        <label className="text-[11px] font-semibold text-zinc-400 block flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-400" /> Calendar Event
                        </label>
                        <a
                          href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                            c.commitment
                          )}&details=${encodeURIComponent(
                            `Source: ${c.source}\nEvidence: ${c.evidence}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 px-2 py-1 rounded-lg font-medium text-xs flex items-center justify-center gap-1 transition-all"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Create Calendar Event
                        </a>
                      </div>

                      {/* Assign Status */}
                      <div className="space-y-1 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                        <label className="text-[11px] font-semibold text-zinc-400 block flex items-center gap-1">
                          <Bell className="w-3.5 h-3.5 text-emerald-400" /> Status
                        </label>
                        <select
                          value={c.status}
                          onChange={(e) => onStatusChange(c.id, e.target.value as Commitment["status"])}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-zinc-200 text-xs"
                        >
                          <option value="due_soon font-bold">Open (Due Soon)</option>
                          <option value="due_today">In Progress (Due Today)</option>
                          <option value="ambiguous">Waiting (Needs Confirmation)</option>
                          <option value="overdue">Overdue</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>

                    {/* Personal Notes */}
                    <div className="space-y-1 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                      <label className="text-[11px] font-semibold text-zinc-400 block flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-zinc-400" /> Personal Notes
                      </label>
                      <textarea
                        rows={2}
                        defaultValue={c.notes || ""}
                        onBlur={(e) => {
                          if (onUpdateCommitment) {
                            onUpdateCommitment(c.id, { notes: e.target.value });
                          }
                        }}
                        placeholder="Add private context, notes, or internal updates..."
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-200 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Compact Expandable "Why?" Score Explanation Box */}
                {isExpanded && (
                  <div className="mt-2 p-3 bg-zinc-900/90 border border-amber-500/30 rounded-xl text-xs space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-amber-400 font-bold">
                      <span className="flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4" /> Why did CommitAI detect this?
                      </span>
                      <span className="font-mono text-[11px] bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded text-amber-300">
                        {scoreDetails.urgencyLabel} Attention Priority
                      </span>
                    </div>

                    <div className="font-mono text-zinc-300 text-[11px] bg-zinc-950 p-2 rounded border border-zinc-800">
                      {scoreDetails.formulaExplanation}
                    </div>

                    {scoreDetails.reasons.length > 0 && (
                      <div className="space-y-1 text-zinc-400">
                        <strong className="text-zinc-300 block text-[11px]">Contributing Factors:</strong>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                          {scoreDetails.reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
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
