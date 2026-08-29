"use client";

import React from "react";
import { Commitment } from "@/types/commitment";
import { User, ExternalLink } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { formatDueDateDisplay } from "@/lib/dateNormalizer";

interface PeopleViewProps {
  commitments: Commitment[];
  onSelectEvidence: (commitment: Commitment) => void;
}

export function PeopleView({ commitments, onSelectEvidence }: PeopleViewProps) {
  // Group commitments by person name
  const peopleMap = new Map<string, Commitment[]>();

  commitments.forEach((c) => {
    const list = peopleMap.get(c.person) || [];
    list.push(c);
    peopleMap.set(c.person, list);
  });

  const people = Array.from(peopleMap.entries()).map(([personName, list]) => {
    const overdueCount = list.filter((c) => c.status === "overdue").length;
    const activeCount = list.filter((c) => c.status !== "completed").length;
    const completedCount = list.filter((c) => c.status === "completed").length;
    const latestCommitment = list[0];

    return {
      personName,
      list,
      overdueCount,
      activeCount,
      completedCount,
      latestCommitment,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            People & Contact Commitment Directory
          </h3>
          <p className="text-xs text-zinc-400">
            Directory of all {people.length} contacts with active or completed commitments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {people.length === 0 ? (
          <div className="md:col-span-2 bg-zinc-950 border border-zinc-800 rounded-2xl p-12 text-center shadow-xl space-y-2">
            <User className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <h4 className="text-zinc-300 font-semibold text-base">No commitments found yet.</h4>
            <p className="text-zinc-500 text-xs">
              Connect another communication source or sync again after new conversations arrive.
            </p>
          </div>
        ) : (
          people.map(({ personName, list, overdueCount, activeCount, completedCount, latestCommitment }) => (
          <div
            key={personName}
            className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 shadow-xl space-y-4 transition-colors"
          >
            {/* Person Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-300">
                  {personName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-base font-bold text-zinc-100">{personName}</h4>
                  <div className="text-xs text-zinc-400">
                    Relationship summary • {list.length} total recorded
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-mono">
                {overdueCount > 0 && (
                  <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-semibold">
                    {overdueCount} Overdue
                  </span>
                )}
              </div>
            </div>

            {/* Relationship Counts Summary Bar */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
              <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                <span className="text-zinc-500 block text-[10px] font-sans">Active:</span>
                <span className="text-indigo-400 font-bold">{activeCount}</span>
              </div>
              <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                <span className="text-zinc-500 block text-[10px] font-sans">Overdue:</span>
                <span className="text-red-400 font-bold">{overdueCount}</span>
              </div>
              <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                <span className="text-zinc-500 block text-[10px] font-sans">Completed:</span>
                <span className="text-emerald-400 font-bold">{completedCount}</span>
              </div>
            </div>

            {/* Latest Promise Snapshot */}
            {latestCommitment && (
              <div className="text-xs text-zinc-400 space-y-1">
                <span className="text-zinc-500 text-[11px] font-semibold block">Latest Promise:</span>
                <div className="bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-900 text-zinc-200 font-medium truncate">
                  &quot;{latestCommitment.commitment}&quot;
                </div>
              </div>
            )}

            {/* Commitments List for this person */}
            <div className="space-y-2 pt-2 border-t border-zinc-900">
              {list.map((c) => (
                <div
                  key={c.id}
                  className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={c.status} />
                      <span className="text-zinc-400 font-mono text-[11px]">
                        {formatDueDateDisplay(c.dueDate, c.originalDateText)}
                      </span>
                    </div>
                    <div className="font-semibold text-zinc-200 truncate">{c.commitment}</div>
                  </div>

                  <button
                    onClick={() => onSelectEvidence(c)}
                    className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded-md shrink-0 transition-colors flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Evidence
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  );
}
