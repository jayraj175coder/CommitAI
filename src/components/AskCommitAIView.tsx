"use client";

import React, { useState } from "react";
import { Commitment } from "@/types/commitment";
import { executeNaturalLanguageQuery, NLQueryResult, generateFollowUpMessage } from "@/lib/nlQueryEngine";
import { Search, Sparkles, ExternalLink, ShieldCheck, FileText, User, Bot, ArrowRight, Copy, Check } from "lucide-react";
import { StatusBadge, SourceBadge, ConfidenceIndicator } from "./StatusBadge";
import { calculateRiskScore } from "@/lib/scoringEngine";

interface AskCommitAIViewProps {
  commitments: Commitment[];
  onSelectEvidence: (commitment: Commitment) => void;
}

export function AskCommitAIView({ commitments, onSelectEvidence }: AskCommitAIViewProps) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<NLQueryResult | null>(null);
  const [draftedMessage, setDraftedMessage] = useState<string | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);

  const predefinedQueries = [
    "What do I need to worry about this week?",
    "Which commitments are at risk?",
    "What am I waiting for from other people?",
    "Which deadlines changed recently?",
    "Show me my overdue commitments.",
    "What should I follow up on today?",
    "Do I have any calendar conflicts?",
    "What commitments did I make this week?",
  ];

  const handleQuerySubmit = (qToRun?: string) => {
    const targetQuery = qToRun || query;
    if (!targetQuery.trim()) return;

    setDraftedMessage(null);
    const queryRes = executeNaturalLanguageQuery(targetQuery, commitments);
    setResult(queryRes);
    if (qToRun) setQuery(qToRun);
  };

  // Generate proactive insights from real active commitments
  const activeList = commitments.filter((c) => c.status !== "completed");
  const overdueCount = activeList.filter((c) => c.status === "overdue").length;
  const highRiskCount = activeList.filter((c) => calculateRiskScore(c).riskCategory === "Critical" || calculateRiskScore(c).riskCategory === "High").length;
  const waitingCount = activeList.filter((c) => c.direction === "they_owe_me").length;
  const changedCount = activeList.filter((c) => !!c.conflictWithId || (c.history && c.history.length > 1)).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* WHAT NEEDS YOUR ATTENTION? - Proactive AI Briefing */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> WHAT NEEDS YOUR ATTENTION? (Proactive Briefing)
          </h3>
          <span className="text-xs font-mono text-zinc-500">Based on real connected evidence</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div
            onClick={() => handleQuerySubmit("Show me my overdue commitments")}
            className="bg-zinc-900/80 hover:bg-zinc-900 p-3 rounded-xl border border-red-800/60 cursor-pointer transition-colors space-y-1"
          >
            <span className="text-red-400 font-bold block">🔴 {overdueCount} Overdue Item(s)</span>
            <span className="text-zinc-400 text-[11px]">Require immediate review or follow-up.</span>
          </div>

          <div
            onClick={() => handleQuerySubmit("Which commitments are at risk?")}
            className="bg-zinc-900/80 hover:bg-zinc-900 p-3 rounded-xl border border-rose-800/60 cursor-pointer transition-colors space-y-1"
          >
            <span className="text-rose-400 font-bold block">🟠 {highRiskCount} High Risk Item(s)</span>
            <span className="text-zinc-400 text-[11px]">Approaching deadline with no completion proof.</span>
          </div>

          <div
            onClick={() => handleQuerySubmit("What am I waiting for from other people?")}
            className="bg-zinc-900/80 hover:bg-zinc-900 p-3 rounded-xl border border-cyan-800/60 cursor-pointer transition-colors space-y-1"
          >
            <span className="text-cyan-300 font-bold block">⏳ {waitingCount} Waiting For Others</span>
            <span className="text-zinc-400 text-[11px]">Owed to you by external contacts.</span>
          </div>

          <div
            onClick={() => handleQuerySubmit("Which deadlines changed recently?")}
            className="bg-zinc-900/80 hover:bg-zinc-900 p-3 rounded-xl border border-purple-800/60 cursor-pointer transition-colors space-y-1"
          >
            <span className="text-purple-300 font-bold block">⚠️ {changedCount} Timeline Shift(s)</span>
            <span className="text-zinc-400 text-[11px]">Deadlines re-stated or updated in threads.</span>
          </div>
        </div>
      </div>

      {/* Copilot Input Header */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-indigo-950/60 border border-indigo-800/50 px-3 py-1 rounded-full text-xs font-mono text-indigo-400">
          <Bot className="w-3.5 h-3.5" />
          CommitAI Operations Copilot
        </div>

        <h2 className="text-2xl font-bold text-zinc-100">Ask Anything About Your Work</h2>
        <p className="text-sm text-zinc-400 max-w-xl mx-auto">
          Query deadlines, risks, and obligations. All answers are strictly grounded in your authenticated Gmail and Calendar records.
        </p>

        {/* Input Bar */}
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Ask about your commitments, risks, or deadlines..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuerySubmit()}
            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-2xl pl-11 pr-28 py-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-medium transition-all shadow-inner"
          />
          <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <button
            onClick={() => handleQuerySubmit()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow"
          >
            Ask Copilot
          </button>
        </div>

        {/* Predefined Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {predefinedQueries.map((pq) => (
            <button
              key={pq}
              onClick={() => handleQuerySubmit(pq)}
              className="text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-zinc-100 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              {pq}
            </button>
          ))}
        </div>
      </div>

      {/* Answer & Results Section */}
      {result && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Main Summary Answer */}
          <div
            className={`p-6 rounded-2xl border ${
              result.hasSufficientEvidence
                ? "bg-zinc-950 border-indigo-500/30 text-zinc-100"
                : "bg-red-950/20 border-red-800/40 text-red-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Intent: {result.queryIntent}
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {result.hasSufficientEvidence ? "Grounding: Verified Connected Sources" : "Grounding: Insufficient Data"}
              </span>
            </div>

            <p className="text-base font-medium leading-relaxed">
              &quot;{result.answerText}&quot;
            </p>

            {/* Contextual Draft Follow-up Button */}
            {result.matchedCommitments.length > 0 && (
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    const topItem = result.matchedCommitments[0];
                    const msg = generateFollowUpMessage(topItem);
                    setDraftedMessage(msg.messageText);
                  }}
                  className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Draft Follow-up Email
                </button>
              </div>
            )}

            {/* Generated Draft Box */}
            {draftedMessage && (
              <div className="mt-3 bg-zinc-900 p-4 rounded-xl border border-amber-500/40 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-amber-300">
                  <span>AI Drafted Follow-up Email (Requires Confirmation)</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(draftedMessage);
                      setCopiedDraft(true);
                      setTimeout(() => setCopiedDraft(false), 2000);
                    }}
                    className="text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded border border-zinc-800"
                  >
                    {copiedDraft ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedDraft ? "Copied" : "Copy Draft"}
                  </button>
                </div>
                <p className="font-mono text-zinc-200 bg-zinc-950 p-3 rounded border border-zinc-800 leading-relaxed">
                  &quot;{draftedMessage}&quot;
                </p>
              </div>
            )}
          </div>

          {/* Clickable Grounded Evidence Reference Items */}
          {result.groundedEvidenceList.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 pl-1 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-400" />
                Clickable Evidence Grounding References ({result.groundedEvidenceList.length})
              </h4>

              {result.groundedEvidenceList.map((item) => {
                const fullCommitment = result.matchedCommitments.find((c) => c.id === item.commitmentId);
                return (
                  <div
                    key={item.commitmentId}
                    className="bg-zinc-950 border border-zinc-800 hover:border-indigo-500/50 rounded-xl p-4 transition-all space-y-2 group cursor-pointer"
                    onClick={() => fullCommitment && onSelectEvidence(fullCommitment)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {fullCommitment && <StatusBadge status={fullCommitment.status} />}
                        {fullCommitment && <SourceBadge sourceType={fullCommitment.sourceType} source={fullCommitment.source} />}
                        <ConfidenceIndicator confidence={item.confidence} />
                      </div>
                      
                      <button className="text-xs bg-indigo-600/10 group-hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-md font-medium flex items-center gap-1 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Inspect Raw Source Evidence
                      </button>
                    </div>

                    <div className="pt-1">
                      <h5 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-indigo-400" />
                        <span>{item.person}:</span>
                        <span className="text-zinc-200">{item.commitment}</span>
                      </h5>
                      <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                        Due Date: <span className="text-zinc-200">{item.dueDateDisplay}</span>
                      </p>
                    </div>

                    <div className="bg-zinc-900/90 p-3 rounded-lg border border-indigo-500/20 text-xs font-mono text-indigo-100">
                      <span className="text-zinc-500 block text-[11px] font-sans mb-0.5">Verbatim Source Evidence:</span>
                      &quot;{item.evidenceSnippet}&quot;
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Suggested Follow-up Questions */}
          {result.suggestedQuestions && result.suggestedQuestions.length > 0 && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2">
              <span className="text-xs font-mono text-zinc-400 font-bold uppercase tracking-wider block">
                Suggested Follow-up Questions:
              </span>
              <div className="flex flex-wrap gap-2">
                {result.suggestedQuestions.map((sq, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuerySubmit(sq)}
                    className="text-xs bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/60 px-3 py-1.5 rounded-lg flex items-center gap-1 font-medium transition-colors"
                  >
                    <span>{sq}</span>
                    <ArrowRight className="w-3 h-3 text-indigo-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
