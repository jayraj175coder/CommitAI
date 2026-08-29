"use client";

import React from "react";
import {
  AlertCircle,
  Clock,
  Calendar,
  CheckCircle2,
  HelpCircle,
  FileText,
  Mail,
  MessageSquare,
  FileCode,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Zap,
  Camera,
  Mic
} from "lucide-react";
import { Commitment, CommitmentStatus, SourceType } from "@/types/commitment";

export function StatusBadge({ status }: { status: CommitmentStatus }) {
  switch (status) {
    case "overdue":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
          <AlertCircle className="w-3.5 h-3.5" />
          OVERDUE
        </span>
      );
    case "due_today":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <Zap className="w-3.5 h-3.5" />
          DUE TODAY
        </span>
      );
    case "due_soon":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <Clock className="w-3.5 h-3.5" />
          DUE SOON
        </span>
      );
    case "upcoming":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Calendar className="w-3.5 h-3.5" />
          UPCOMING
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          COMPLETED
        </span>
      );
    case "ambiguous":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <HelpCircle className="w-3.5 h-3.5" />
          AMBIGUOUS
        </span>
      );
  }
}

export function DirectionBadge({ direction }: { direction: Commitment["direction"] }) {
  if (direction === "i_owe") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/50">
        <ArrowUpRight className="w-3 h-3" /> You promised
      </span>
    );
  }
  if (direction === "they_owe_me") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/50">
        <ArrowDownLeft className="w-3 h-3" /> They promised you
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
      Internal
    </span>
  );
}

export function SourceBadge({ sourceType, source }: { sourceType: SourceType; source: string }) {
  const getIcon = () => {
    switch (sourceType) {
      case "gmail":
      case "email":
      case "outlook":
        return <Mail className="w-3.5 h-3.5 text-blue-400" />;
      case "google_calendar":
        return <Calendar className="w-3.5 h-3.5 text-emerald-400" />;
      case "discord":
        return <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />;
      case "telegram":
        return <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />;
      case "chat":
      case "whatsapp":
      case "slack":
      case "teams":
      case "sms":
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />;
      case "screenshot":
        return <Camera className="w-3.5 h-3.5 text-indigo-400" />;
      case "voice":
        return <Mic className="w-3.5 h-3.5 text-rose-400" />;
      case "meeting_notes":
      case "meeting":
        return <FileCode className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 max-w-[220px] truncate" title={source}>
      {getIcon()}
      <span className="truncate">{source}</span>
    </span>
  );
}

export function ConfidenceIndicator({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  let color = "text-emerald-400";
  if (confidence < 0.8) color = "text-amber-400";
  if (confidence < 0.65) color = "text-red-400";

  return (
    <div className="flex items-center gap-1 text-xs font-mono" title={`AI Extraction Confidence: ${percentage}%`}>
      <Sparkles className={`w-3 h-3 ${color}`} />
      <span className={color}>{percentage}%</span>
    </div>
  );
}
