"use client";

import React, { useState } from "react";
import { Key, Shield, RefreshCw, Database, Check, Sparkles } from "lucide-react";
import { GoogleConnectSection } from "./GoogleConnectSection";
import { Commitment } from "@/types/commitment";

interface SettingsViewProps {
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  onResetDemoData: () => void;
  onSyncCommitmentsDiscovered?: (newItems: Commitment[]) => void;
}

export function SettingsView({ apiKey, onSaveApiKey, onResetDemoData, onSyncCommitmentsDiscovered }: SettingsViewProps) {
  const [inputKey, setInputKey] = useState(apiKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveKey = () => {
    onSaveApiKey(inputKey);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="pb-4 border-b border-zinc-800">
        <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-400" />
          Settings & Provider Configuration
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          Configure AI extraction provider API keys or manage persistent storage state.
        </p>
      </div>

      {/* Google Connect Section */}
      <GoogleConnectSection
        onSyncCommitmentsDiscovered={onSyncCommitmentsDiscovered}
        onClearAllData={onResetDemoData}
      />

      {/* AI Provider Config */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-800/50 text-indigo-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-zinc-100">OpenAI Compatible API Key</h4>
            <p className="text-xs text-zinc-400">
              Optional. If not provided, CommitAI seamlessly runs on the built-in deterministic fallback engine.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            API Secret Key
          </label>
          <input
            type="password"
            placeholder="sk-or-v1-..."
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-mono text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
          />

          <div className="flex items-center justify-between">
            <button
              onClick={handleSaveKey}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg transition-colors flex items-center gap-2"
            >
              {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Sparkles className="w-4 h-4" />}
              {savedSuccess ? "Saved Key Securely!" : "Save Configuration"}
            </button>

            <span className="text-[11px] text-zinc-500">
              Keys are stored strictly in client memory/localStorage & never logged.
            </span>
          </div>
        </div>
      </div>

      {/* Reset Storage */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-800/50 text-amber-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-zinc-100">Reset Demo Data</h4>
            <p className="text-xs text-zinc-400">
              Restore the original polished 11-item demo dataset with relative dates and evidence snippets.
            </p>
          </div>
        </div>

        <button
          onClick={onResetDemoData}
          className="bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reload Default Realistic Demo Data
        </button>
      </div>
    </div>
  );
}
