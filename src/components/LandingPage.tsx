"use client";

import React from "react";
import { Sparkles, ArrowRight, MessageSquare, Mail, Calendar, ArrowDown, Zap } from "lucide-react";

interface LandingPageProps {
  onGoToDashboard: () => void;
}

export function LandingPage({ onGoToDashboard }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans relative overflow-hidden">
      {/* Premium Background Subtle Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))]" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#18181b15_1px,transparent_1px),linear-gradient(to_bottom,#18181b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Header Navigation */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between border-b border-zinc-900/80">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onGoToDashboard}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30">
            <Zap className="w-5 h-5 text-amber-300 fill-amber-300/20" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent block leading-tight">
              CommitAI
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">Personal Commitment Intelligence</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onGoToDashboard}
            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold px-4 py-2.5 rounded-xl border border-zinc-800 transition-all hidden sm:block"
          >
            Sign In
          </button>
          <button
            onClick={onGoToDashboard}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 active:scale-95"
          >
            <span>Try CommitAI</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-16 sm:py-24 text-center space-y-16">
        {/* Above the fold - Hero Headline */}
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-950/80 border border-indigo-500/30 px-4 py-1.5 rounded-full text-xs font-medium text-indigo-300 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            AI-powered • Evidence-backed • Privacy-first
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            NEVER FORGET WHAT YOU PROMISED.
          </h1>

          <p className="text-lg sm:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed font-normal">
            CommitAI remembers the promises hiding inside your messages, emails, notes, screenshots, and conversations.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGoToDashboard}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-base font-bold px-8 py-4 rounded-2xl shadow-2xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95"
            >
              <span>Try CommitAI</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onGoToDashboard}
              className="w-full sm:w-auto bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-base font-semibold px-8 py-4 rounded-2xl transition-all"
            >
              See how it works
            </button>
          </div>
        </div>

        {/* SECTION 2: SHOW THE PROBLEM VISUALLY */}
        <div className="pt-12 space-y-8 text-left max-w-5xl mx-auto">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              You make commitments everywhere.
            </h2>
            <p className="text-sm text-zinc-400">
              Promises get scattered across chat apps, email threads, and quick meeting notes.
            </p>
          </div>

          {/* Raw Input Examples */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Example 1 */}
            <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl space-y-3 shadow-xl">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                  <MessageSquare className="w-4 h-4" /> Chat
                </span>
                <span className="font-mono text-[11px]">Project Lead</span>
              </div>
              <p className="text-sm font-mono text-zinc-200 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                &quot;Yep, I&apos;ll send it tomorrow.&quot;
              </p>
            </div>

            {/* Example 2 */}
            <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl space-y-3 shadow-xl">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1.5 font-medium text-blue-400">
                  <Mail className="w-4 h-4" /> Email
                </span>
                <span className="font-mono text-[11px]">Elena Vance</span>
              </div>
              <p className="text-sm font-mono text-zinc-200 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                &quot;I&apos;ll review the document by Friday.&quot;
              </p>
            </div>

            {/* Example 3 */}
            <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl space-y-3 shadow-xl">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1.5 font-medium text-purple-400">
                  <Calendar className="w-4 h-4" /> Meeting Note
                </span>
                <span className="font-mono text-[11px]">Alex Mercer</span>
              </div>
              <p className="text-sm font-mono text-zinc-200 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                &quot;I&apos;ll call the client this afternoon.&quot;
              </p>
            </div>
          </div>

          {/* Visual Transformation Arrow */}
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-500/40 px-4 py-2 rounded-full text-xs font-bold text-indigo-300 shadow-lg">
              <span>CommitAI Transformation Engine</span>
              <ArrowDown className="w-4 h-4 text-indigo-400 animate-bounce" />
            </div>
          </div>

          {/* Transformed Commitment Structure Card */}
          <div className="bg-zinc-950 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-bold">
                  Structured Commitment Output
                </span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="text-indigo-400">Alex:</span> Send revised project proposal
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-amber-950 text-amber-400 border border-amber-800 px-3 py-1 rounded-full font-bold">
                  Due Soon
                </span>
                <span className="bg-zinc-900 text-zinc-300 border border-zinc-800 px-3 py-1 rounded-full font-mono">
                  Confidence 96%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs font-mono bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
              <div>
                <span className="text-zinc-500 block">Person:</span>
                <span className="text-zinc-200 font-semibold">Alex Mercer</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Promise:</span>
                <span className="text-zinc-200 font-semibold">Send proposal</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Due Date:</span>
                <span className="text-zinc-200 font-semibold">Tomorrow, 5 PM</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Evidence Source:</span>
                <span className="text-indigo-300 font-semibold">&quot;Yep, I&apos;ll send it tomorrow.&quot;</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: WHY COMMITAI? (THREE CORE DIFFERENTIATORS) */}
        <div className="pt-8 text-left max-w-5xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-white tracking-tight">Why CommitAI?</h2>
            <p className="text-xs text-zinc-400">Intelligent commitment tracking grounded in real source evidence.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-6 space-y-2 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-800/50 flex items-center justify-center text-indigo-400 font-bold text-sm">
                01
              </div>
              <h3 className="text-base font-bold text-zinc-100">REMEMBERS</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Captures commitments automatically from your everyday conversations, emails, and meeting notes.
              </p>
            </div>

            <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-6 space-y-2 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-violet-950/60 border border-violet-800/50 flex items-center justify-center text-violet-400 font-bold text-sm">
                02
              </div>
              <h3 className="text-base font-bold text-zinc-100">UNDERSTANDS</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Identifies people, promises, exact deadlines, and conflicting obligations before they slip.
              </p>
            </div>

            <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-6 space-y-2 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400 font-bold text-sm">
                03
              </div>
              <h3 className="text-base font-bold text-zinc-100">PROVES</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Shows the original verbatim source evidence behind every extracted task and conclusion.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 4: FINAL TRUST SIGNAL */}
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-8 text-center max-w-4xl mx-auto space-y-4 shadow-2xl">
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 bg-indigo-950/80 border border-indigo-800 px-3 py-1 rounded-full font-bold">
            Verifiable AI Trust
          </span>
          <h3 className="text-xl font-bold text-white">Every commitment has a reason.</h3>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-mono text-zinc-300 pt-2">
            <span className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl">Original message</span>
            <span className="text-indigo-400 font-bold">→</span>
            <span className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl">AI interpretation</span>
            <span className="text-indigo-400 font-bold">→</span>
            <span className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl">Commitment</span>
            <span className="text-indigo-400 font-bold">→</span>
            <span className="bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 px-3 py-2 rounded-xl font-bold">Verifiable Evidence</span>
          </div>
        </div>
      </main>

      {/* Product Footer */}
      <footer className="relative z-10 border-t border-zinc-900 py-8 px-6 text-center text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full">
        <div>
          <span className="font-bold text-zinc-300">CommitAI</span> — Never forget a promise again.
        </div>
        <div className="text-zinc-500 text-[11px] mt-2 sm:mt-0">
          Personal Commitment Intelligence Platform
        </div>
      </footer>
    </div>
  );
}
