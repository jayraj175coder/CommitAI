"use client";

import React from "react";
import { Commitment } from "@/types/commitment";
import { formatDueDateDisplay } from "@/lib/dateNormalizer";
import { StatusBadge } from "./StatusBadge";
import { Clock, ExternalLink, Calendar, GitCommit, ArrowRight, Layers } from "lucide-react";

interface TimelineViewProps {
  commitments: Commitment[];
  onSelectEvidence: (commitment: Commitment) => void;
}

export function TimelineView({ commitments, onSelectEvidence }: TimelineViewProps) {
  // Sort commitments chronologically by due date / created date
  const sorted = [...commitments].sort((a, b) => {
    const timeA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
    const timeB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
    return timeA - timeB;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="pb-4 border-b border-zinc-800 space-y-1">
        <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          Commitment Lifecycle & Timeline Memory
        </h3>
        <p className="text-xs text-zinc-400">
          CommitAI tracks the complete lifecycle: <span className="font-mono text-indigo-300">CREATE → MODIFY → DELAY → CANCEL → FULFILL</span>.
        </p>
      </div>

      {/* Lifecycle Flow Legend */}
      <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl flex flex-wrap items-center justify-around gap-2 text-xs font-mono text-zinc-300">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> 1. CREATE</span>
        <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 2. MODIFY / DELAY</span>
        <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> 3. CANCEL / CONFLICT</span>
        <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> 4. FULFILL</span>
      </div>

      <div className="relative border-l-2 border-zinc-800 ml-4 space-y-6 py-2">
        {sorted.length === 0 ? (
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-12 text-center shadow-xl space-y-2 -ml-4">
            <Clock className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <h4 className="text-zinc-300 font-semibold text-base">No commitments found yet.</h4>
            <p className="text-zinc-500 text-xs">
              Connect another communication source or sync again after new conversations arrive.
            </p>
          </div>
        ) : (
          sorted.map((c) => {
          const isOverdue = c.status === "overdue";
          const hasHistory = c.history && c.history.length > 0;

          return (
            <div key={c.id} className="relative pl-6 group">
              {/* Timeline Dot */}
              <div
                className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 transition-transform group-hover:scale-125 ${
                  isOverdue
                    ? "bg-red-500 border-red-950"
                    : c.status === "completed"
                    ? "bg-emerald-500 border-emerald-950"
                    : hasHistory
                    ? "bg-amber-500 border-amber-950"
                    : "bg-indigo-500 border-indigo-950"
                }`}
              />

              <div className="bg-zinc-950 border border-zinc-800 group-hover:border-zinc-700 rounded-2xl p-5 transition-colors space-y-3 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={c.status} />
                    <span className="font-mono text-zinc-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      {formatDueDateDisplay(c.dueDate, c.originalDateText)}
                    </span>
                    {hasHistory && (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <GitCommit className="w-3 h-3" /> Lifecycle Updated
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectEvidence(c)}
                    className="text-xs bg-zinc-900 hover:bg-zinc-800 text-indigo-400 border border-zinc-800 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Lifecycle & Evidence
                  </button>
                </div>

                <h4 className="text-base font-bold text-zinc-100">
                  <span className="text-indigo-400">{c.person}:</span> {c.commitment}
                </h4>

                {/* Micro Lifecycle Event Stream */}
                {hasHistory && (
                  <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl space-y-1.5 text-xs font-mono">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block font-sans">
                      <Layers className="w-3 h-3 inline mr-1 text-indigo-400" /> Lifecycle Events ({c.history!.length})
                    </span>
                    {c.history!.map((evt, idx) => (
                      <div key={evt.id || idx} className="text-zinc-300 text-[11px] flex items-center justify-between">
                        <span>
                          <strong className="text-indigo-300 uppercase font-bold mr-1 font-mono">[{evt.event.replace("_", " ")}]</strong>
                          {evt.evidence.slice(0, 65)}...
                        </span>
                        <span className="text-zinc-500 text-[10px]">{evt.source}</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-zinc-500 italic bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-900">
                  &quot;{c.evidence}&quot;
                </p>
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}
