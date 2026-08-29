"use client";

import React, { useState } from "react";
import { Commitment } from "@/types/commitment";
import { X, Copy, Check, FileText, Calendar, User, ShieldCheck, Sparkles, Layers } from "lucide-react";
import { StatusBadge, SourceBadge, ConfidenceIndicator } from "./StatusBadge";
import { formatDueDateDisplay } from "@/lib/dateNormalizer";
import { generateFollowUpMessage } from "@/lib/nlQueryEngine";

interface EvidenceViewerModalProps {
  commitment: Commitment | null;
  onClose: () => void;
  onStatusChange?: (id: string, newStatus: Commitment["status"]) => void;
}

export function EvidenceViewerModal({
  commitment,
  onClose,
  onStatusChange,
}: EvidenceViewerModalProps) {
  const [copied, setCopied] = useState(false);
  const [copiedFollowUp, setCopiedFollowUp] = useState(false);

  if (!commitment) return null;

  const followUp = generateFollowUpMessage(commitment);

  const handleCopyEvidence = () => {
    navigator.clipboard.writeText(commitment.evidence);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyFollowUp = () => {
    navigator.clipboard.writeText(followUp.messageText);
    setCopiedFollowUp(true);
    setTimeout(() => setCopiedFollowUp(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 bg-indigo-950/50 border border-indigo-800/50 px-2 py-0.5 rounded">
                Extraction Evidence Record
              </span>
              <ConfidenceIndicator confidence={commitment.confidence} />
            </div>
            <h3 className="text-xl font-bold text-zinc-100">{commitment.commitment}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 p-1 rounded-lg hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/80">
            <div>
              <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Person
              </div>
              <div className="text-sm font-semibold text-zinc-200">{commitment.person}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Due Date
              </div>
              <div className="text-sm font-medium text-zinc-200">
                {formatDueDateDisplay(commitment.dueDate, commitment.originalDateText)}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1">Status</div>
              <StatusBadge status={commitment.status} />
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1">Source</div>
              <SourceBadge sourceType={commitment.sourceType} source={commitment.source} />
            </div>
          </div>

          {/* Primary Evidence Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-400" />
                How CommitAI Knows (Original Source Evidence)
              </label>
              <button
                onClick={handleCopyEvidence}
                className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy Evidence"}
              </button>
            </div>
            <div className="bg-zinc-900/90 border border-indigo-500/30 p-4 rounded-xl text-xs space-y-2 text-indigo-100 font-mono leading-relaxed relative">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-sans border-b border-zinc-800 pb-1.5">
                <span>Source: {commitment.source}</span>
                <span>Confidence: {Math.round(commitment.confidence * 100)}% Verified</span>
              </div>
              <div>
                <span className="text-zinc-500 font-sans block text-[11px] mb-0.5">Original Source Snippet:</span>
                &quot;{commitment.evidence}&quot;
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] font-sans pt-1 border-t border-zinc-800/60">
                <div><span className="text-zinc-500 block">Person:</span> <strong className="text-zinc-200">{commitment.person}</strong></div>
                <div><span className="text-zinc-500 block">Extracted Due:</span> <strong className="text-zinc-200">{formatDueDateDisplay(commitment.dueDate, commitment.originalDateText)}</strong></div>
                <div><span className="text-zinc-500 block">Direction:</span> <strong className="text-indigo-300">{commitment.direction === "i_owe" ? "You Owe" : "They Owe You"}</strong></div>
              </div>
            </div>
          </div>

          {/* Commitment History & Cross-App Timeline */}
          {commitment.history && commitment.history.length > 0 && (
            <div className="space-y-2 border-t border-zinc-800/80 pt-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                Cross-Platform Commitment History & Timeline ({commitment.history.length})
              </label>

              <div className="space-y-2 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                {commitment.history.map((evt, idx) => (
                  <div key={evt.id || idx} className="flex items-start gap-3 text-xs border-l-2 border-indigo-500/50 pl-3 py-1">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-300 uppercase font-mono text-[10px] bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                          {evt.event.replace("_", " ")}
                        </span>
                        <span className="text-zinc-400 font-mono text-[10px]">{evt.source}</span>
                      </div>
                      <p className="text-zinc-200 font-mono text-xs mt-1">&quot;{evt.evidence}&quot;</p>
                      {evt.oldDueDate && evt.newDueDate && evt.oldDueDate !== evt.newDueDate && (
                        <div className="text-[11px] text-amber-400 font-mono">
                          Deadline shifted: {formatDueDateDisplay(evt.oldDueDate)} → {formatDueDateDisplay(evt.newDueDate)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Generated Follow-Up Message Section */}
          <div className="space-y-2 border-t border-zinc-800/80 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Evidence-Based Follow-Up Message
              </label>
              <button
                onClick={handleCopyFollowUp}
                className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-colors"
              >
                {copiedFollowUp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedFollowUp ? "Copied Draft" : "Copy Follow-Up"}
              </button>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-sm text-zinc-300 space-y-2">
              <p className="italic bg-zinc-950 p-3 rounded border border-zinc-800/50 font-sans">
                &quot;{followUp.messageText}&quot;
              </p>
              <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                {followUp.disclaimer}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Mark status:</span>
            {onStatusChange && (
              <>
                {commitment.status !== "completed" && (
                  <button
                    onClick={() => {
                      onStatusChange(commitment.id, "completed");
                      onClose();
                    }}
                    className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded font-medium transition-colors"
                  >
                    Mark Complete
                  </button>
                )}
                {commitment.status === "completed" && (
                  <button
                    onClick={() => {
                      onStatusChange(commitment.id, "due_soon");
                      onClose();
                    }}
                    className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded font-medium transition-colors"
                  >
                    Reopen Commitment
                  </button>
                )}
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
