"use client";

import React, { useState } from "react";
import { Commitment } from "@/types/commitment";
import { CommitmentStorage } from "@/lib/storageService";
import { calculateAttentionScore, calculateCommitmentHealth } from "@/lib/scoringEngine";
import { generateFollowUpMessage } from "@/lib/nlQueryEngine";
import { LandingPage } from "@/components/LandingPage";
import { CommitmentGraph } from "@/components/CommitmentGraph";
import { CommitmentsList } from "@/components/CommitmentsList";
import { CommandCenterView } from "@/components/CommandCenterView";
import { AddInputSection } from "@/components/AddInputSection";
import { Network } from "lucide-react";
import { FollowUpCopilotView } from "@/components/FollowUpCopilotView";
import { RiskRadarDashboard } from "@/components/RiskRadarDashboard";
import { EvidenceViewerModal } from "@/components/EvidenceViewerModal";
import { AskCommitAIView } from "@/components/AskCommitAIView";
import { PeopleView } from "@/components/PeopleView";
import { SettingsView } from "@/components/SettingsView";
import { TimelineView } from "@/components/TimelineView";
import {
  Sparkles,
  LayoutDashboard,
  Layers,
  Users,
  Search,
  Settings,
  Clock,
  AlertTriangle,
  Activity,
  ShieldCheck,
  Zap,
  Lock,
  FileText,
  Send
} from "lucide-react";

import { ConnectionsView } from "@/components/ConnectionsView";
import { Link2 } from "lucide-react";

type ViewTab = "landing" | "dashboard" | "commitments" | "graph" | "followups" | "people" | "ask" | "timeline" | "connections" | "settings";

export function MainApp() {
  const [currentTab, setCurrentTab] = useState<ViewTab>("dashboard");
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [selectedEvidenceCommitment, setSelectedEvidenceCommitment] = useState<Commitment | null>(null);
  const [activeMetricFilter, setActiveMetricFilter] = useState<string>("all");
  const [apiKey, setApiKey] = useState<string>("");
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [authBanner, setAuthBanner] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCommitments(CommitmentStorage.getCommitments());
    setIsMounted(true);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const authSuccess = params.get("auth_success");
      const authNotice = params.get("auth_notice");
      const provider = params.get("provider") || "Google";

      if (authSuccess) {
        setAuthBanner({
          type: "success",
          message: `Successfully connected ${provider.charAt(0).toUpperCase() + provider.slice(1)}! You can now sync your commitments.`,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (authNotice) {
        let msg = `Authentication notice: ${authNotice}`;
        if (authNotice === "setup_required") {
          msg = `OAuth credentials missing in environment variables. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.`;
        } else if (authNotice === "cancelled") {
          msg = `Sign-in cancelled.`;
        } else if (authNotice === "token_exchange_failed" || authNotice === "auth_failed") {
          msg = `Failed to authenticate ${provider}. Please verify your authorized OAuth redirect URI in Google Cloud Console.`;
        } else if (authNotice === "csrf_state_mismatch") {
          msg = `Security check state expired. Please try connecting again.`;
        }
        setAuthBanner({
          type: authNotice === "cancelled" ? "info" : "error",
          message: msg,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleCommitmentsExtracted = (newItems: Commitment[]) => {
    const updated = CommitmentStorage.addCommitments(newItems);
    setCommitments(updated);
    setIsDemoMode(false);
  };

  const handleStatusChange = (id: string, newStatus: Commitment["status"]) => {
    const updated = CommitmentStorage.updateCommitment(id, { status: newStatus });
    setCommitments(updated);
  };

  const handleUpdateCommitment = (id: string, updates: Partial<Commitment>) => {
    const updated = CommitmentStorage.updateCommitment(id, updates);
    setCommitments(updated);
  };

  const handleDeleteCommitment = (id: string) => {
    const updated = CommitmentStorage.deleteCommitment(id);
    setCommitments(updated);
  };

  const handleClearAllData = () => {
    CommitmentStorage.clearAllData();
    setCommitments([]);
    setIsDemoMode(false);
  };

  const [demoStep, setDemoStep] = useState<number | null>(null);

  const handleResetDemoData = () => {
    const demo = CommitmentStorage.resetToDemoData();
    setCommitments(demo);
    setActiveMetricFilter("all");
    setDemoStep(1);
    setIsDemoMode(true);
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-mono text-zinc-400">
          <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span>Loading CommitAI Dashboard...</span>
        </div>
      </div>
    );
  }

  if (currentTab === "landing") {
    return <LandingPage onGoToDashboard={() => setCurrentTab("dashboard")} />;
  }

  // Calculate Health & System Metrics
  const healthData = calculateCommitmentHealth(commitments);
  const { healthScore, healthLabel, breakdown, riskRadar } = healthData;

  // Filtered Commitments based on KPI/Radar metric click
  const filteredByMetric = commitments.filter((c) => {
    if (activeMetricFilter === "all") return true;
    if (activeMetricFilter === "overdue") return c.status === "overdue";
    if (activeMetricFilter === "atRisk") {
      const label = calculateAttentionScore(c).urgencyLabel;
      return (label === "Critical" || label === "High") && c.status !== "completed";
    }
    if (activeMetricFilter === "due48Hours") return c.status === "due_today" || c.status === "due_soon";
    if (activeMetricFilter === "conflicts") return !!c.conflictWithId && c.status !== "completed";
    if (activeMetricFilter === "completed") return c.status === "completed";
    if (activeMetricFilter === "critical") return calculateAttentionScore(c).urgencyLabel === "Critical" && c.status !== "completed";
    if (activeMetricFilter === "high") return calculateAttentionScore(c).urgencyLabel === "High" && c.status !== "completed";
    if (activeMetricFilter === "medium") return calculateAttentionScore(c).urgencyLabel === "Medium" && c.status !== "completed";
    if (activeMetricFilter === "low") return calculateAttentionScore(c).urgencyLabel === "Low" && c.status !== "completed";
    return true;
  });

  // Prioritized Attention List (Top 3 Highest Attention Score)
  const prioritized = [...commitments]
    .filter((c) => c.status !== "completed")
    .sort((a, b) => calculateAttentionScore(b).attentionScore - calculateAttentionScore(a).attentionScore)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentTab("landing")}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform border border-indigo-400/30">
            <Zap className="w-5 h-5 text-amber-300 fill-amber-300/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent leading-tight">
                CommitAI
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 rounded-full font-semibold">
                Intelligence SaaS
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">Verifiable Evidence Operations</span>
          </div>
        </div>

        {/* Global Nav Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 text-xs font-medium">
          <button
            onClick={() => setCurrentTab("dashboard")}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              currentTab === "dashboard" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Home
          </button>

          <button
            onClick={() => setCurrentTab("commitments")}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              currentTab === "commitments" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Promise Inbox
          </button>

          <button
            onClick={() => setCurrentTab("graph")}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              currentTab === "graph" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            Graph
          </button>

          <button
            onClick={() => setCurrentTab("followups")}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              currentTab === "followups" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Follow-Up Copilot
          </button>

          <button
            onClick={() => setCurrentTab("people")}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              currentTab === "people" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            People
          </button>

          <button
            onClick={() => setCurrentTab("ask")}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              currentTab === "ask" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Ask AI
          </button>

          <button
            onClick={() => setCurrentTab("timeline")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              currentTab === "timeline" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Timeline
          </button>

          <button
            onClick={() => setCurrentTab("connections")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              currentTab === "connections" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            Connections
          </button>

          <button
            onClick={() => setCurrentTab("settings")}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              currentTab === "settings" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </button>
        </nav>

        {/* Header Right Badges */}
        <div className="flex items-center gap-2">
          {isDemoMode && (
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest bg-amber-500/20 border border-amber-500/50 text-amber-300 px-2.5 py-1 rounded-full animate-pulse">
              DEMO MODE
            </span>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-8">
        {/* OAuth Feedback Notice Banner */}
        {authBanner && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between text-xs transition-all shadow-lg ${
              authBanner.type === "success"
                ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-300"
                : authBanner.type === "error"
                ? "bg-rose-950/50 border-rose-500/40 text-rose-300"
                : "bg-zinc-900 border-zinc-700 text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {authBanner.type === "success" ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : authBanner.type === "error" ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <Activity className="w-4 h-4 text-zinc-400 shrink-0" />
              )}
              <span className="font-medium">{authBanner.message}</span>
            </div>
            <button
              onClick={() => setAuthBanner(null)}
              className="text-zinc-400 hover:text-zinc-100 font-bold px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* INTERACTIVE 60-SECOND MAGIC DEMO MODAL OVERLAY */}
        {demoStep !== null && (
          <div className="bg-gradient-to-r from-indigo-950/90 via-zinc-950 to-zinc-950 border border-indigo-500/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in duration-200 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  60-Second Magic Tour — Step {demoStep} of 4
                </h3>
              </div>
              <button
                onClick={() => setDemoStep(null)}
                className="text-xs bg-zinc-900 text-zinc-400 hover:text-white px-3 py-1 rounded-xl border border-zinc-800 transition-colors"
              >
                Skip Tour ✕
              </button>
            </div>

            {demoStep === 1 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-indigo-200">1. Connecting workspace & analyzing cross-platform conversations...</p>
                <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                  <Activity className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span>47 conversations analyzed across Gmail, Slack, Teams, and Calendar → 12 commitments discovered.</span>
                </div>
                <button
                  onClick={() => setDemoStep(2)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow"
                >
                  Next Step: See Lifecycle Evolution →
                </button>
              </div>
            )}

            {demoStep === 2 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-indigo-200">2. Cross-Source Lifecycle Reconciliation (Slack → Gmail)</p>
                <div className="text-xs font-mono bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 text-zinc-300 space-y-1">
                  <div>Slack: &quot;I&apos;ll send the API credentials tomorrow.&quot; (Aug 27)</div>
                  <div className="text-amber-400 font-bold">↓ Deadline Shifted</div>
                  <div>Gmail: &quot;Sorry for the delay, I&apos;ll get them to you Friday.&quot; (Aug 29)</div>
                  <div className="text-emerald-400 pt-1 font-sans">✓ CommitAI unified both messages into 1 active timeline record instead of creating duplicate items.</div>
                </div>
                <button
                  onClick={() => setDemoStep(3)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow"
                >
                  Next Step: Conflict Alert →
                </button>
              </div>
            )}

            {demoStep === 3 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-amber-300">3. Conflict Detection Engine</p>
                <div className="text-xs bg-amber-950/40 p-3 rounded-xl border border-amber-800/60 text-amber-200 space-y-1">
                  <strong>⚠️ POTENTIAL SCHEDULING CONFLICT DETECTED:</strong>
                  <div>Contract promised &quot;Invoice #INV-902&quot; yesterday, but email later stated &quot;Resend invoice tomorrow afternoon&quot;.</div>
                  <div className="text-[11px] text-amber-300/80 font-mono pt-1">Recommended Action: &quot;Review conflict &amp; ask for confirmation&quot;</div>
                </div>
                <button
                  onClick={() => setDemoStep(4)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow"
                >
                  Final Summary →
                </button>
              </div>
            )}

            {demoStep === 4 && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-emerald-300">
                  &quot;Your digital conversations contain promises. CommitAI makes them visible.&quot;
                </p>
                <p className="text-xs text-zinc-300">
                  You are now viewing the full live interactive workspace with real evidence grounding, Ask AI assistant, and follow-up generators.
                </p>
                <button
                  onClick={() => setDemoStep(null)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow"
                >
                  Explore Dashboard
                </button>
              </div>
            )}
          </div>
        )}
        {/* VIEW 1: COMMAND CENTER (DASHBOARD) */}
        {currentTab === "dashboard" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <CommandCenterView
              commitments={commitments}
              onSelectEvidence={(c) => setSelectedEvidenceCommitment(c)}
              onStatusChange={handleStatusChange}
              onUpdateCommitment={handleUpdateCommitment}
              onFilterMetric={(filter) => setActiveMetricFilter(filter)}
              onNavigateToTab={(tab) => setCurrentTab(tab as ViewTab)}
              onSyncNow={() => {
                fetch("/api/sync/gmail", { method: "POST" })
                  .then((res) => res.json())
                  .then((data) => {
                    if (data.commitments) handleCommitmentsExtracted(data.commitments);
                  })
                  .catch((err) => console.error("Sync error:", err));
              }}
            />
            {/* 1.5 RISK RADAR DASHBOARD */}
            <RiskRadarDashboard
              commitments={commitments}
              onSelectEvidence={(c) => setSelectedEvidenceCommitment(c)}
              onStatusChange={handleStatusChange}
              onFilterRisk={(category) => setActiveMetricFilter(category)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Health Gauge Box */}
              <div className="lg:col-span-4 bg-zinc-950/90 border border-zinc-800/90 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">Commitment Health</h3>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    healthLabel === "Excellent" ? "bg-emerald-950 text-emerald-400 border-emerald-800" :
                    healthLabel === "Good" ? "bg-indigo-950 text-indigo-400 border-indigo-800" :
                    healthLabel === "At Risk" ? "bg-amber-950 text-amber-400 border-amber-800" :
                    "bg-red-950 text-red-400 border-red-800"
                  }`}>
                    {healthLabel}
                  </span>
                </div>

                <div className="flex items-baseline gap-3 my-2">
                  <span className="text-5xl font-extrabold text-white tracking-tight">{healthScore}</span>
                  <span className="text-zinc-500 font-mono text-sm">/ 100 Health Score</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-zinc-900 rounded-full h-2.5 my-3 overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full transition-all duration-500 ${
                      healthScore >= 70 ? "bg-indigo-500" : healthScore >= 45 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${healthScore}%` }}
                  />
                </div>

                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  Real-time operational health aggregated from active obligations, overdue delays, and conflicting timeline risks.
                </p>
              </div>

              {/* KPI Cards Grid */}
              <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Active */}
                <div
                  onClick={() => setActiveMetricFilter(activeMetricFilter === "all" ? "active" : "all")}
                  className={`bg-zinc-950 border p-4 rounded-2xl cursor-pointer transition-all hover:border-indigo-500/50 flex flex-col justify-between ${
                    activeMetricFilter === "all" ? "border-zinc-800" : "border-indigo-500"
                  }`}
                >
                  <div className="text-xs text-zinc-400 font-medium">Active Obligations</div>
                  <div className="text-3xl font-bold text-zinc-100 mt-2">{breakdown.active}</div>
                  <span className="text-[10px] text-zinc-500 mt-2 font-mono">Total tracked: {breakdown.total}</span>
                </div>

                {/* Overdue */}
                <div
                  onClick={() => setActiveMetricFilter(activeMetricFilter === "overdue" ? "all" : "overdue")}
                  className={`bg-zinc-950 border p-4 rounded-2xl cursor-pointer transition-all hover:border-red-500/50 flex flex-col justify-between ${
                    activeMetricFilter === "overdue" ? "border-red-500 bg-red-950/20" : "border-red-900/40"
                  }`}
                >
                  <div className="text-xs text-red-400 font-medium flex items-center justify-between">
                    <span>Overdue</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <div className="text-3xl font-bold text-red-400 mt-2">{breakdown.overdue}</div>
                  <span className="text-[10px] text-red-400/70 mt-2 font-mono">Action required</span>
                </div>

                {/* At-Risk */}
                <div
                  onClick={() => setActiveMetricFilter(activeMetricFilter === "atRisk" ? "all" : "atRisk")}
                  className={`bg-zinc-950 border p-4 rounded-2xl cursor-pointer transition-all hover:border-amber-500/50 flex flex-col justify-between ${
                    activeMetricFilter === "atRisk" ? "border-amber-500 bg-amber-950/20" : "border-amber-900/40"
                  }`}
                >
                  <div className="text-xs text-amber-400 font-medium flex items-center justify-between">
                    <span>At-Risk</span>
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-3xl font-bold text-amber-400 mt-2">{breakdown.atRisk}</div>
                  <span className="text-[10px] text-amber-400/70 mt-2 font-mono">Critical & High priority</span>
                </div>

                {/* Due 48h */}
                <div
                  onClick={() => setActiveMetricFilter(activeMetricFilter === "due48Hours" ? "all" : "due48Hours")}
                  className={`bg-zinc-950 border p-4 rounded-2xl cursor-pointer transition-all hover:border-blue-500/50 flex flex-col justify-between ${
                    activeMetricFilter === "due48Hours" ? "border-blue-500 bg-blue-950/20" : "border-blue-900/40"
                  }`}
                >
                  <div className="text-xs text-blue-400 font-medium flex items-center justify-between">
                    <span>Due &lt; 48 Hours</span>
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-blue-400 mt-2">{breakdown.due48Hours}</div>
                  <span className="text-[10px] text-blue-400/70 mt-2 font-mono">Upcoming deadlines</span>
                </div>
              </div>
            </div>

            {/* Visual Risk Radar Breakdown Bar */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" /> Visual Risk Radar Breakdown
                </span>
                <span className="text-zinc-500 font-mono">Click category to filter list below</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => setActiveMetricFilter(activeMetricFilter === "critical" ? "all" : "critical")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeMetricFilter === "critical" ? "border-red-500 bg-red-950/30" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                  }`}
                >
                  <div className="text-[11px] font-bold text-red-400 uppercase">Critical Risk ({riskRadar.critical})</div>
                  <div className="text-xs text-zinc-400 mt-1">Immediate intervention</div>
                </button>

                <button
                  onClick={() => setActiveMetricFilter(activeMetricFilter === "high" ? "all" : "high")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeMetricFilter === "high" ? "border-amber-500 bg-amber-950/30" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                  }`}
                >
                  <div className="text-[11px] font-bold text-amber-400 uppercase">High Risk ({riskRadar.high})</div>
                  <div className="text-xs text-zinc-400 mt-1">Nearing deadline</div>
                </button>

                <button
                  onClick={() => setActiveMetricFilter(activeMetricFilter === "medium" ? "all" : "medium")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeMetricFilter === "medium" ? "border-indigo-500 bg-indigo-950/30" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                  }`}
                >
                  <div className="text-[11px] font-bold text-indigo-400 uppercase">Medium Risk ({riskRadar.medium})</div>
                  <div className="text-xs text-zinc-400 mt-1">On schedule</div>
                </button>

                <button
                  onClick={() => setActiveMetricFilter(activeMetricFilter === "low" ? "all" : "low")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeMetricFilter === "low" ? "border-emerald-500 bg-emerald-950/30" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                  }`}
                >
                  <div className="text-[11px] font-bold text-emerald-400 uppercase">Low Risk ({riskRadar.low})</div>
                  <div className="text-xs text-zinc-400 mt-1">Normal status</div>
                </button>
              </div>
            </div>

            {/* 2. WHAT NEEDS ME? SECTION */}
            {prioritized.length > 0 && (
              <div className="bg-gradient-to-r from-red-950/20 via-zinc-950 to-zinc-950 border border-red-900/40 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                    <h3 className="text-lg font-bold text-zinc-100 uppercase tracking-tight">WHAT NEEDS ME?</h3>
                  </div>
                  <span className="text-xs font-mono text-amber-400 bg-amber-950/80 border border-amber-800 px-3 py-1 rounded-full font-semibold">
                    Top Priority Actions
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {prioritized.map((item) => {
                    const scoreObj = calculateAttentionScore(item);
                    const followUp = generateFollowUpMessage(item);
                    return (
                      <div
                        key={item.id}
                        className="bg-zinc-900/90 border border-zinc-800 hover:border-indigo-500/50 p-5 rounded-xl space-y-3 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> {scoreObj.urgencyLabel} RISK ({scoreObj.attentionScore}/100)
                            </span>
                          </div>

                          <div className="text-sm font-bold text-zinc-100">
                            <span className="text-indigo-400">{item.person}:</span> {item.commitment}
                          </div>

                          <div className="text-xs text-zinc-400 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80">
                            <strong className="text-zinc-300 font-semibold block mb-0.5">Why it matters:</strong>
                            {scoreObj.reasons.length > 0 ? scoreObj.reasons.join(" • ") : "Deadline approaching without completion evidence."}
                          </div>

                          <div className="text-xs text-zinc-400 font-mono bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60">
                            <strong className="text-indigo-400 font-semibold block font-sans mb-0.5">Recommended Action:</strong>
                            &quot;{followUp.messageText.slice(0, 95)}...&quot;
                          </div>
                        </div>

                        <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                          <button
                            onClick={() => setSelectedEvidenceCommitment(item)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" /> View Evidence
                          </button>
                          <button
                            onClick={() => setSelectedEvidenceCommitment(item)}
                            className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 px-3 py-1 rounded-lg font-medium transition-colors"
                          >
                            Draft Follow-up
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. VISUAL COMMITMENT GRAPH */}
            <CommitmentGraph
              commitments={commitments}
              onSelectEvidence={(c) => setSelectedEvidenceCommitment(c)}
            />

            {/* 4. INGESTION INPUT SECTION */}
            <AddInputSection
              onCommitmentsExtracted={handleCommitmentsExtracted}
              apiKey={apiKey}
            />

            {/* 5. COMMITMENTS DIRECTORY LIST */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" /> All Commitment Intelligence Records
                </h3>
                {activeMetricFilter !== "all" && (
                  <button
                    onClick={() => setActiveMetricFilter("all")}
                    className="text-xs text-indigo-400 hover:underline font-mono"
                  >
                    Clear Filter ({activeMetricFilter})
                  </button>
                )}
              </div>
              <CommitmentsList
                commitments={filteredByMetric}
                onSelectEvidence={(c) => setSelectedEvidenceCommitment(c)}
                onStatusChange={handleStatusChange}
                onUpdateCommitment={handleUpdateCommitment}
                onDeleteCommitment={handleDeleteCommitment}
              />
            </div>

            {/* 6. PRIVACY & DATA TRUST FOOTER SECTION */}
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-zinc-200 font-bold text-sm">
                <Lock className="w-4 h-4 text-emerald-400" /> Privacy & Data Trust Assurance
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400">
                <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60">
                  <strong className="text-zinc-200 block mb-1">Local Browser Storage</strong>
                  All commitments and extracted evidence remain 100% in your browser memory/localStorage.
                </div>
                <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60">
                  <strong className="text-zinc-200 block mb-1">Zero Data Harvesting</strong>
                  No external servers store your communication logs or contact notes.
                </div>
                <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60">
                  <strong className="text-zinc-200 block mb-1">Instant Reset & Control</strong>
                  Clear data anytime from Settings or switch to Demo mode with 1-click.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: COMMITMENTS */}
        {currentTab === "commitments" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <h2 className="text-xl font-bold text-zinc-100">Full Commitments Directory</h2>
            <CommitmentsList
              commitments={commitments}
              onSelectEvidence={(c) => setSelectedEvidenceCommitment(c)}
              onStatusChange={handleStatusChange}
              onUpdateCommitment={handleUpdateCommitment}
              onDeleteCommitment={handleDeleteCommitment}
            />
          </div>
        )}

        {/* VIEW 2.2: GRAPH */}
        {currentTab === "graph" && (
          <div className="animate-in fade-in duration-150">
            <CommitmentGraph
              commitments={commitments}
              onSelectEvidence={(c) => setSelectedEvidenceCommitment(c)}
              onNavigateToTab={(tab) => setCurrentTab(tab as ViewTab)}
            />
          </div>
        )}

        {/* VIEW 2.5: FOLLOW-UP COPILOT */}
        {currentTab === "followups" && (
          <div className="animate-in fade-in duration-150">
            <FollowUpCopilotView
              commitments={commitments}
              onSelectEvidence={(c) => setSelectedEvidenceCommitment(c)}
              onStatusChange={handleStatusChange}
              onUpdateCommitment={handleUpdateCommitment}
            />
          </div>
        )}

        {/* VIEW 3: PEOPLE */}
        {currentTab === "people" && (
          <div className="animate-in fade-in duration-150">
            <PeopleView
              commitments={commitments}
              onSelectEvidence={(c) => setSelectedEvidenceCommitment(c)}
            />
          </div>
        )}

        {/* VIEW 4: ASK COMMITAI */}
        {currentTab === "ask" && (
          <div className="animate-in fade-in duration-150">
            <AskCommitAIView
              commitments={commitments}
              onSelectEvidence={(c) => setSelectedEvidenceCommitment(c)}
            />
          </div>
        )}

        {/* VIEW 5: TIMELINE */}
        {currentTab === "timeline" && (
          <div className="animate-in fade-in duration-150">
            <TimelineView
              commitments={commitments}
              onSelectEvidence={(c) => setSelectedEvidenceCommitment(c)}
            />
          </div>
        )}

        {/* VIEW 6: CONNECTIONS */}
        {currentTab === "connections" && (
          <div className="animate-in fade-in duration-150">
            <ConnectionsView
              onSyncCommitmentsDiscovered={handleCommitmentsExtracted}
              onClearAllData={handleClearAllData}
            />
          </div>
        )}

        {/* VIEW 6: SETTINGS */}
        {currentTab === "settings" && (
          <div className="animate-in fade-in duration-150">
            <SettingsView
              apiKey={apiKey}
              onSaveApiKey={(key) => setApiKey(key)}
              onResetDemoData={handleResetDemoData}
              onSyncCommitmentsDiscovered={handleCommitmentsExtracted}
            />
          </div>
        )}
      </main>

      {/* Evidence Viewer Modal */}
      <EvidenceViewerModal
        commitment={selectedEvidenceCommitment}
        onClose={() => setSelectedEvidenceCommitment(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
