"use client";

import React, { useState } from "react";
import { Commitment } from "@/types/commitment";
import { calculateRiskScore } from "@/lib/scoringEngine";
import { formatDueDateDisplay } from "@/lib/dateNormalizer";
import { generateFollowUpMessage } from "@/lib/nlQueryEngine";
import {
  Send,
  Sparkles,
  ExternalLink,
  Calendar,
  Check,
  Copy,
  ShieldCheck,
  RefreshCw,
  FileText,
  Volume2
} from "lucide-react";
import { StatusBadge, SourceBadge } from "./StatusBadge";

interface FollowUpCopilotViewProps {
  commitments: Commitment[];
  onSelectEvidence: (commitment: Commitment) => void;
  onStatusChange: (id: string, newStatus: Commitment["status"]) => void;
  onUpdateCommitment: (id: string, updates: Partial<Commitment>) => void;
}

export type ToneOption = "professional" | "friendly" | "concise" | "urgent";

export function FollowUpCopilotView({
  commitments,
  onSelectEvidence,
  onStatusChange,
  onUpdateCommitment,
}: FollowUpCopilotViewProps) {
  const [activeQueueTab, setActiveQueueTab] = useState<"all" | "overdue" | "due_today" | "due_soon" | "high_risk">("all");
  const [selectedTone, setSelectedTone] = useState<ToneOption>("professional");
  const [activeDraftCommitmentId, setActiveDraftCommitmentId] = useState<string | null>(null);
  const [editedDraft, setEditedDraft] = useState<string>("");
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Filter ONLY commitments where "They owe me" / another person owes an action
  const waitingOnThemList = commitments.filter(
    (c) => (c.direction === "they_owe_me" || c.direction === "owed_to_me") && c.status !== "completed"
  );

  // Queue Sub-filters
  const filteredQueue = waitingOnThemList.filter((c) => {
    if (activeQueueTab === "overdue") return c.status === "overdue";
    if (activeQueueTab === "due_today") return c.status === "due_today";
    if (activeQueueTab === "due_soon") return c.status === "due_soon";
    if (activeQueueTab === "high_risk") {
      const riskCat = calculateRiskScore(c).riskCategory;
      return riskCat === "Critical" || riskCat === "High";
    }
    return true;
  });

  // Sort queue by risk score + overdue duration
  filteredQueue.sort((a, b) => calculateRiskScore(b).riskScore - calculateRiskScore(a).riskScore);

  const handleGenerateDraft = (commitment: Commitment, tone: ToneOption) => {
    setActiveDraftCommitmentId(commitment.id);
    const baseFollowUp = generateFollowUpMessage(commitment);
    let msg = baseFollowUp.messageText;

    const personFirst = commitment.person.split(" ")[0];
    const dateStr = formatDueDateDisplay(commitment.dueDate, commitment.originalDateText);

    if (tone === "friendly") {
      msg = `Hi ${personFirst}! Hope you're having a great week. Quick touchpoint regarding "${commitment.commitment}" (due around ${dateStr}). Whenever you get a chance, could you pass along an update? Thanks so much!`;
    } else if (tone === "concise") {
      msg = `Hi ${personFirst}, checking in on "${commitment.commitment}" due ${dateStr}. Please let me know the status when you have a second. Thanks!`;
    } else if (tone === "urgent") {
      msg = `Hi ${personFirst}, following up urgently on "${commitment.commitment}". This deliverable was scheduled for ${dateStr}. Please share the current status as soon as possible so we stay on schedule.`;
    } else {
      msg = `Hi ${personFirst}, hope you are doing well. I wanted to follow up regarding "${commitment.commitment}" scheduled for ${dateStr}. Based on our previous email thread ("${commitment.evidence}"), could you share an update on expected delivery? Best regards.`;
    }

    setEditedDraft(msg);
  };

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(editedDraft);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const activeDraftCommitment = commitments.find((c) => c.id === activeDraftCommitmentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-950/60 border border-indigo-800/50 px-3 py-1 rounded-full text-xs font-mono text-indigo-400 mb-1">
              <Send className="w-3.5 h-3.5 text-indigo-400" /> Follow-Up Copilot
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Follow-Up Operations Queue</h2>
            <p className="text-sm text-zinc-400 mt-0.5">
              Review obligations owed to you by external participants and generate evidence-grounded follow-ups.
            </p>
          </div>

          <span className="text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-3 py-1.5 rounded-full font-bold">
            ⏳ {waitingOnThemList.length} Owed To You
          </span>
        </div>

        {/* Queue Category Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-900">
          <button
            onClick={() => setActiveQueueTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeQueueTab === "all" ? "bg-indigo-600 text-white shadow" : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            ALL WAITING ({waitingOnThemList.length})
          </button>
          <button
            onClick={() => setActiveQueueTab("overdue")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeQueueTab === "overdue" ? "bg-red-600 text-white shadow" : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            🔴 OVERDUE ({waitingOnThemList.filter((c) => c.status === "overdue").length})
          </button>
          <button
            onClick={() => setActiveQueueTab("due_today")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeQueueTab === "due_today" ? "bg-amber-600 text-white shadow" : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            ⚡ DUE TODAY ({waitingOnThemList.filter((c) => c.status === "due_today").length})
          </button>
          <button
            onClick={() => setActiveQueueTab("due_soon")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeQueueTab === "due_soon" ? "bg-blue-600 text-white shadow" : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            🟠 DUE SOON ({waitingOnThemList.filter((c) => c.status === "due_soon").length})
          </button>
          <button
            onClick={() => setActiveQueueTab("high_risk")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeQueueTab === "high_risk" ? "bg-purple-600 text-white shadow" : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            ⚠️ HIGH RISK ({waitingOnThemList.filter((c) => calculateRiskScore(c).riskCategory === "Critical" || calculateRiskScore(c).riskCategory === "High").length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Queue List (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          {filteredQueue.length === 0 ? (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-12 text-center shadow-xl space-y-2">
              <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-zinc-200 font-bold text-base">No follow-ups needed in this queue</h4>
              <p className="text-zinc-500 text-xs">All obligations owed to you are completed or up to date.</p>
            </div>
          ) : (
            filteredQueue.map((c) => {
              const risk = calculateRiskScore(c);
              const isSelectedForDraft = activeDraftCommitmentId === c.id;

              return (
                <div
                  key={c.id}
                  className={`bg-zinc-950 border rounded-2xl p-5 shadow-xl space-y-3 transition-all ${
                    isSelectedForDraft ? "border-indigo-500 ring-1 ring-indigo-500/50" : "border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                          risk.riskCategory === "Critical"
                            ? "bg-red-950 text-red-400 border-red-800"
                            : risk.riskCategory === "High"
                            ? "bg-rose-950 text-rose-400 border-rose-800"
                            : risk.riskCategory === "Medium"
                            ? "bg-amber-950 text-amber-400 border-amber-800"
                            : "bg-emerald-950 text-emerald-400 border-emerald-800"
                        }`}
                      >
                        Risk {risk.riskScore}/100
                      </span>
                      <StatusBadge status={c.status} />
                      <SourceBadge sourceType={c.sourceType} source={c.source} />
                    </div>

                    <span className="text-xs text-zinc-400 font-mono">
                      Due: {formatDueDateDisplay(c.dueDate, c.originalDateText)}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white">
                      <span className="text-indigo-400">{c.person}: </span>
                      <span>{c.commitment}</span>
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 font-mono italic bg-zinc-900/60 p-2 rounded border border-zinc-800/80">
                      &quot;{c.evidence}&quot;
                    </p>
                  </div>

                  {/* Calendar Awareness Badge */}
                  {c.sourceType === "google_calendar" && (
                    <div className="bg-blue-950/40 border border-blue-800/60 p-2.5 rounded-xl text-xs text-blue-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" /> Linked to Calendar Event / Meeting Scheduled
                      </span>
                      <button
                        onClick={() => onSelectEvidence(c)}
                        className="text-[11px] underline font-mono text-blue-300"
                      >
                        View Details
                      </button>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-900">
                    <button
                      onClick={() => handleGenerateDraft(c, selectedTone)}
                      className="text-xs bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-4 py-2 rounded-xl transition-all shadow shadow-indigo-600/20 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Draft Follow-Up
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectEvidence(c)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Evidence
                      </button>

                      {/* Snooze Dropdown */}
                      <select
                        onChange={(e) => {
                          const days = parseInt(e.target.value, 10);
                          if (days > 0) {
                            const snoozedDate = new Date();
                            snoozedDate.setDate(snoozedDate.getDate() + days);
                            onUpdateCommitment(c.id, {
                              dueDate: snoozedDate.toISOString(),
                              snoozedUntil: snoozedDate.toISOString(),
                            });
                          }
                        }}
                        className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-2 py-1 font-mono"
                      >
                        <option value="0">Snooze...</option>
                        <option value="1">Tomorrow</option>
                        <option value="3">3 Days</option>
                        <option value="7">Next Week</option>
                      </select>

                      <button
                        onClick={() => onStatusChange(c.id, "completed")}
                        className="text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark Done
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* AI Draft & Evidence Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4 sticky top-20">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> AI Grounded Draft Composer
              </h3>
              {activeDraftCommitment && (
                <span className="text-[10px] font-mono text-zinc-400">{activeDraftCommitment.person}</span>
              )}
            </div>

            {activeDraftCommitment ? (
              <div className="space-y-4">
                {/* Tone Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 block flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> Select Tone &amp; Persona
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                    {(["professional", "friendly", "concise", "urgent"] as ToneOption[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setSelectedTone(t);
                          handleGenerateDraft(activeDraftCommitment, t);
                        }}
                        className={`p-2 rounded-xl border text-center capitalize transition-all ${
                          selectedTone === t
                            ? "bg-indigo-600 text-white border-indigo-500 shadow"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editable Draft Text Area */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 block">Review &amp; Edit Draft</label>
                  <textarea
                    rows={6}
                    value={editedDraft}
                    onChange={(e) => setEditedDraft(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-3 text-xs text-zinc-100 font-sans leading-relaxed focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-900">
                  <button
                    onClick={() => handleGenerateDraft(activeDraftCommitment, selectedTone)}
                    className="text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 px-3 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                  </button>

                  <button
                    onClick={handleCopyDraft}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl transition-all shadow flex items-center gap-1.5"
                  >
                    {copiedSuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSuccess ? "Copied to Clipboard!" : "Copy Message"}
                  </button>
                </div>

                {/* Evidence Grounding Box */}
                <div className="bg-zinc-900/60 border border-indigo-500/30 p-3.5 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-indigo-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Generated strictly from evidence
                  </div>
                  <div className="space-y-1 text-zinc-300 text-[11px] font-mono">
                    <div><span className="text-zinc-500">Source: </span>{activeDraftCommitment.source}</div>
                    <div><span className="text-zinc-500">Sender: </span>{activeDraftCommitment.person}</div>
                    <div className="bg-zinc-950 p-2 rounded border border-zinc-800 text-indigo-200 mt-1">
                      &quot;{activeDraftCommitment.evidence}&quot;
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-zinc-600" />
                <p className="text-xs">Select any obligation in the queue and click <strong>Draft Follow-Up</strong> to compose an evidence-backed message.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
