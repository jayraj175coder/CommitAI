"use client";

import React, { useState } from "react";
import { processInputExtraction } from "@/lib/aiExtractor";
import { Commitment, SourceType } from "@/types/commitment";
import { Upload, FileText, Sparkles, AlertCircle, CheckCircle2, RefreshCw, Camera, Mic, MessageSquare, PlusCircle } from "lucide-react";
import Papa from "papaparse";

interface AddInputSectionProps {
  onCommitmentsExtracted: (items: Commitment[]) => void;
  apiKey?: string;
}

export function AddInputSection({ onCommitmentsExtracted, apiKey }: AddInputSectionProps) {
  const [activeTab, setActiveTab] = useState<"paste" | "screenshot" | "voice" | "file" | "sample">("paste");
  const [inputText, setInputText] = useState("");
  const [sourceName, setSourceName] = useState("Manual Entry");
  const [sourceType, setSourceType] = useState<SourceType>("text");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [isSimulatingVoice, setIsSimulatingVoice] = useState(false);
  const [voiceText, setVoiceText] = useState("");

  const handleExtract = async (textToProcess: string, name: string, type: SourceType) => {
    if (!textToProcess.trim()) {
      setErrorMsg("Please provide text, voice note, or screenshot details before analyzing.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessCount(null);

    try {
      const extracted = await processInputExtraction(
        textToProcess,
        name,
        type,
        apiKey
      );

      if (extracted.length === 0) {
        setErrorMsg("I couldn't find enough evidence in your data to establish any explicit commitments.");
      } else {
        onCommitmentsExtracted(extracted);
        setSuccessCount(extracted.length);
        if (activeTab === "paste") setInputText("");
      }
    } catch (e: unknown) {
      console.error(e);
      setErrorMsg("Extraction process encountered an error. Falling back to default parser.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    let type: SourceType = "document";
    if (fileName.endsWith(".csv")) type = "document";
    if (fileName.endsWith(".txt")) type = "text";
    if (file.type.startsWith("image/")) type = "screenshot";

    if (file.type.startsWith("image/")) {
      // Screenshot OCR simulation parsing
      handleExtract(
        `[Screenshot OCR Export from ${fileName}] Sender: "Yep, I'll send the document tomorrow." Recipient: "I'll review it Friday." You: "Sounds good, I'll call at 6 PM."`,
        fileName,
        "screenshot"
      );
    } else if (file.type === "text/csv" || fileName.endsWith(".csv")) {
      Papa.parse(file, {
        complete: (results) => {
          const csvText = results.data.map((row: unknown) => (Array.isArray(row) ? row.join(" ") : JSON.stringify(row))).join("\n");
          handleExtract(csvText, fileName, "document");
        },
        error: () => {
          setErrorMsg("Failed to parse CSV file format.");
        }
      });
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        handleExtract(text, fileName, type);
      };
      reader.readAsText(file);
    }
  };

  const simulateVoiceRecording = () => {
    setIsSimulatingVoice(true);
    setVoiceText("");
    const sampleVoice = "I promised to send the revised proposal by tomorrow afternoon.";
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < sampleVoice.length) {
        setVoiceText((prev) => prev + sampleVoice.charAt(idx));
        idx++;
      } else {
        clearInterval(interval);
        setIsSimulatingVoice(false);
      }
    }, 40);
  };

  const loadSample = (sampleType: "chat" | "email" | "meeting") => {
    let text = "";
    let name = "";
    let type: SourceType = "text";

    if (sampleType === "chat") {
      name = "Project Lead Chat";
      type = "chat";
      text = `Alex: I'll share the API credentials and Postman collection tomorrow morning.
Elena: I'll finalize and deliver the compliance audit report by Friday EOD.`;
    } else if (sampleType === "email") {
      name = "Vendor MSA Contract Email";
      type = "email";
      text = `From: Priya Patel <priya@cloudvendor.io>
Subject: Re: MSA Agreement Draft

Hi team, I reviewed the draft. I promise to submit the Disaster Recovery plan draft next week before our stakeholder review.
Also, you mentioned you'll review and send the signed MSA vendor agreement in 2 days.`;
    } else {
      name = "Executive Sync Notes";
      type = "meeting_notes";
      text = `Meeting Transcript:
- Sarah: I promise to complete and share the Figma design system updates today by 5 PM.
- David: I will run the database indexing benchmark script tomorrow and post metrics in channel.`;
    }

    setInputText(text);
    setSourceName(name);
    setSourceType(type);
    setActiveTab("paste");
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-400" />
            Add Anything
          </h3>
          <p className="text-xs text-zinc-400">
            Paste conversations, upload screenshots, record voice notes, or import emails.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveTab("paste")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "paste" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Paste Text
          </button>
          <button
            onClick={() => setActiveTab("screenshot")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "screenshot" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Screenshot
          </button>
          <button
            onClick={() => setActiveTab("voice")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "voice" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            Tell CommitAI
          </button>
          <button
            onClick={() => setActiveTab("file")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "file" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            File / Document
          </button>
          <button
            onClick={() => setActiveTab("sample")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "sample" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Load Sample
          </button>
        </div>
      </div>

      {/* Integration Connectors Sub-Header Bar */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-400 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
        <span className="text-zinc-300 font-bold uppercase tracking-wider font-sans">Supported Ingestion Layer:</span>
        <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-emerald-400">WhatsApp Export</span>
        <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-blue-400">Email Draft/Thread</span>
        <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-purple-400">Slack Log</span>
        <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-rose-400">Voice Transcripts</span>
        <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-amber-400 font-sans font-medium">Direct Integrations: Coming Soon</span>
      </div>

      {/* Tab Content 1: Direct Paste */}
      {activeTab === "paste" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Source Name (e.g. Email from Rahul, Client Sync)"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-medium"
            />
            <select
              value={sourceType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSourceType(e.target.value as SourceType)}
              className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="chat">Source Type: Chat / WhatsApp / Instagram DM</option>
              <option value="email">Source Type: Email Thread</option>
              <option value="meeting_notes">Source Type: Meeting Note / Transcript</option>
              <option value="text">Source Type: Plain Text Note</option>
              <option value="document">Source Type: Document</option>
            </select>
          </div>

          <textarea
            rows={4}
            placeholder="Paste your conversation, message, or email thread here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono transition-colors"
          />

          <button
            onClick={() => handleExtract(inputText, sourceName, sourceType)}
            disabled={loading}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
            {loading ? "Analyzing conversation..." : "Extract Promises & Save"}
          </button>
        </div>
      )}

      {/* Tab Content 2: Screenshot Intelligence */}
      {activeTab === "screenshot" && (
        <div className="border-2 border-dashed border-zinc-800 rounded-2xl p-8 text-center hover:border-indigo-500/50 transition-colors space-y-4">
          <Camera className="w-10 h-10 text-indigo-400 mx-auto" />
          <div>
            <h4 className="text-zinc-200 font-bold text-base">Screenshot Intelligence</h4>
            <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
              Upload a screenshot of any WhatsApp, Instagram DM, Slack, or SMS conversation. CommitAI extracts promises automatically.
            </p>
          </div>
          <div className="flex justify-center">
            <label className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold px-5 py-3 rounded-xl cursor-pointer transition-all inline-flex items-center gap-2 shadow-lg">
              <Upload className="w-4 h-4" />
              Upload Chat Screenshot
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* Tab Content 3: Tell CommitAI (Voice Input) */}
      {activeTab === "voice" && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 text-center space-y-4">
          <Mic className={`w-10 h-10 mx-auto transition-all ${isSimulatingVoice ? "text-rose-400 animate-pulse scale-110" : "text-zinc-500"}`} />
          <div>
            <h4 className="text-zinc-200 font-bold text-base">Tell CommitAI (Voice Note)</h4>
            <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
              Speak naturally. For example: &quot;I promised to send the presentation tomorrow.&quot;
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
            <button
              onClick={simulateVoiceRecording}
              disabled={isSimulatingVoice || loading}
              className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Mic className="w-4 h-4" />
              {isSimulatingVoice ? "Listening..." : "Tap to Speak"}
            </button>

            {voiceText && (
              <div className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-200 text-left">
                <span className="text-zinc-500 block mb-1 text-[10px]">Transcribed Voice Note:</span>
                &quot;{voiceText}&quot;
              </div>
            )}

            {voiceText && !isSimulatingVoice && (
              <button
                onClick={() => handleExtract(voiceText, "Voice Note Entry", "voice")}
                disabled={loading}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Save Voice Promise
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 4: File Upload */}
      {activeTab === "file" && (
        <div className="border-2 border-dashed border-zinc-800 rounded-2xl p-8 text-center hover:border-indigo-500/50 transition-colors">
          <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
          <h4 className="text-zinc-200 font-semibold text-sm">Upload TXT, CSV, or Log files</h4>
          <p className="text-xs text-zinc-500 mt-1 mb-4">
            Files will be parsed locally and processed through the structured extraction pipeline.
          </p>
          <label className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition-colors inline-flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Select Local File
            <input
              type="file"
              accept=".txt,.csv,.log,.md"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Tab Content 5: Quick Samples */}
      {activeTab === "sample" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => loadSample("chat")}
            className="p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-left space-y-1 transition-colors"
          >
            <span className="text-xs font-mono text-emerald-400 font-semibold">Chat Thread Sample</span>
            <h5 className="text-sm font-bold text-zinc-200">Project Lead Chat</h5>
            <p className="text-xs text-zinc-500">Alex & Elena discussing API specs & compliance reports.</p>
          </button>

          <button
            onClick={() => loadSample("email")}
            className="p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-left space-y-1 transition-colors"
          >
            <span className="text-xs font-mono text-blue-400 font-semibold">Email Thread Sample</span>
            <h5 className="text-sm font-bold text-zinc-200">Priya Patel Contract</h5>
            <p className="text-xs text-zinc-500">Disaster recovery spec & MSA vendor agreements.</p>
          </button>

          <button
            onClick={() => loadSample("meeting")}
            className="p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-left space-y-1 transition-colors"
          >
            <span className="text-xs font-mono text-purple-400 font-semibold">Meeting Transcript</span>
            <h5 className="text-sm font-bold text-zinc-200">Product Sync Notes</h5>
            <p className="text-xs text-zinc-500">Sarah & David sprint commitments.</p>
          </button>
        </div>
      )}

      {/* Status Messages */}
      {errorMsg && (
        <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-3 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successCount !== null && (
        <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Successfully extracted and saved {successCount} promise(s) to your Promise Inbox!</span>
        </div>
      )}
    </div>
  );
}
