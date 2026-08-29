"use client";

import React, { useState, useEffect } from "react";
import { Commitment } from "@/types/commitment";
import { RefreshCw, CheckCircle2, ShieldCheck, Lock, Trash2, Mail, AlertTriangle } from "lucide-react";

interface GoogleConnectSectionProps {
  onSyncCommitmentsDiscovered?: (newItems: Commitment[]) => void;
  onClearAllData?: () => void;
}

export function GoogleConnectSection({
  onSyncCommitmentsDiscovered,
  onClearAllData,
}: GoogleConnectSectionProps) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectedEmail, setConnectedEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [lastSyncStats, setLastSyncStats] = useState<{
    syncedAt?: string;
    messagesAnalyzed?: number;
    discoveredCount?: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPrivacyCenter, setShowPrivacyCenter] = useState<boolean>(false);

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/auth/google/status");
      if (res.ok) {
        const data = await res.json();
        setIsConnected(data.isConnected);
        if (data.email) setConnectedEmail(data.email);
      }
    } catch {
      setIsConnected(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkStatus();
  }, []);

  const handleDisconnect = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/google/revoke", { method: "POST" });
      if (res.ok) {
        setIsConnected(false);
        setConnectedEmail("");
        setLastSyncStats(null);
        if (onClearAllData) {
          onClearAllData();
        }
      }
    } catch {
      setErrorMsg("Failed to disconnect Google account.");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/sync/gmail", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Gmail sync encountered an error.");
      } else {
        setLastSyncStats({
          syncedAt: new Date(data.syncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          messagesAnalyzed: data.messagesAnalyzed,
          discoveredCount: data.commitmentsDiscovered,
        });
        if (data.commitments && data.commitments.length > 0 && onSyncCommitmentsDiscovered) {
          onSyncCommitmentsDiscovered(data.commitments);
        }
      }
    } catch {
      setErrorMsg("Sync request failed.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-zinc-700 flex items-center justify-center">
              <Mail className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-base font-bold text-zinc-100">Google Account Integration</h3>
            {isConnected ? (
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Connected
              </span>
            ) : (
              <span className="text-[10px] bg-zinc-900 text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded-full">
                Disconnected
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400">
            Automatically discover commitments from Gmail messages and emails.
          </p>
        </div>

        {/* Action Controls */}
        <div>
          {!isConnected ? (
            <a
              href="/api/auth/google"
              className="bg-white hover:bg-zinc-200 text-zinc-900 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow flex items-center gap-2 active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Connect Google</span>
            </a>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncNow}
                disabled={syncing}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing Gmail..." : "Sync Now"}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-medium px-3 py-2 rounded-xl transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sync Statistics */}
      {isConnected && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
          <div>
            <span className="text-zinc-500 block font-sans">Connected Account:</span>
            <span className="text-zinc-200 font-bold">{connectedEmail || "Google Account"}</span>
          </div>
          <div>
            <span className="text-zinc-500 block font-sans">Last Synced:</span>
            <span className="text-indigo-400 font-bold">{lastSyncStats?.syncedAt || "Just now"}</span>
          </div>
          <div>
            <span className="text-zinc-500 block font-sans">Discovered Commitments:</span>
            <span className="text-emerald-400 font-bold">
              {lastSyncStats?.discoveredCount !== undefined ? `${lastSyncStats.discoveredCount} items` : "Active"}
            </span>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {errorMsg && (
        <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-3 text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {lastSyncStats && !errorMsg && (
        <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            {lastSyncStats.discoveredCount && lastSyncStats.discoveredCount > 0
              ? `Analyzed ${lastSyncStats.messagesAnalyzed || 0} recent messages and discovered ${lastSyncStats.discoveredCount} commitment(s).`
              : "No commitments found in your connected Google account."}
          </span>
        </div>
      )}

      {/* PRIVACY CENTER EXPANDABLE */}
      <div className="pt-2 border-t border-zinc-800/80">
        <div className="flex items-center justify-between text-xs">
          <button
            onClick={() => setShowPrivacyCenter(!showPrivacyCenter)}
            className="text-indigo-400 hover:underline font-bold flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{showPrivacyCenter ? "Hide Privacy Center" : "View Privacy & Data Center"}</span>
          </button>
          {onClearAllData && (
            <button
              onClick={onClearAllData}
              className="text-red-400 hover:text-red-300 font-medium flex items-center gap-1 text-[11px]"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Imported Commitment Data
            </button>
          )}
        </div>

        {showPrivacyCenter && (
          <div className="mt-4 bg-zinc-900/80 border border-zinc-800 p-5 rounded-xl text-xs space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-zinc-200 font-bold">
              <Lock className="w-4 h-4 text-emerald-400" /> Privacy-First Architecture Guarantees
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-400">
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <strong className="text-zinc-200 block mb-1">What Data is Accessed?</strong>
                Read-only window of recent email subjects and bodies matching commitment keywords.
              </div>
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <strong className="text-zinc-200 block mb-1">What Data is Stored?</strong>
                Only extracted commitment metadata, due dates, and short evidence snippets for verification. Full email bodies are never stored.
              </div>
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <strong className="text-zinc-200 block mb-1">Where is Data Stored?</strong>
                100% stored in local browser state. Never sold or harvested for third-party AI training.
              </div>
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <strong className="text-zinc-200 block mb-1">Instant Disconnect & Erasure</strong>
                Revoke Google OAuth authorization anytime with 1 click or wipe all local data.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
