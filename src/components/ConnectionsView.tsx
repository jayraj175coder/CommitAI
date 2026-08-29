"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Calendar,
  MessageSquare,
  MessageCircle,
  Hash,
  Users,
  Send,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Clock,
  Video,
  Lock
} from "lucide-react";
import { Commitment } from "@/types/commitment";
import { INTEGRATION_REGISTRY } from "@/lib/connectors/integrationsConfig";

interface ConnectionsViewProps {
  onSyncCommitmentsDiscovered?: (newItems: Commitment[]) => void;
  onClearAllData?: () => void;
}

export function ConnectionsView({ onSyncCommitmentsDiscovered, onClearAllData }: ConnectionsViewProps) {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setConnectedEmail] = useState("");
  const [discordConnected, setDiscordConnected] = useState(false);
  const [discordUsername, setDiscordUsername] = useState("");
  const [telegramConnected, setTelegramConnected] = useState(false);

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [discordChannels, setDiscordChannels] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedDiscordChannels, setSelectedDiscordChannels] = useState<string[]>([]);
  const [showChannelModal, setShowChannelModal] = useState(false);

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/auth/google/status");
      if (res.ok) {
        const data = await res.json();
        setGoogleConnected(data.isConnected);
        if (data.email) setConnectedEmail(data.email);
      }

      const intRes = await fetch("/api/auth/integrations/status");
      if (intRes.ok) {
        const intData = await intRes.json();
        setDiscordConnected(intData.discord.isConnected);
        if (intData.discord.username) setDiscordUsername(intData.discord.username);
        setTelegramConnected(intData.telegram.isConnected);
      }
    } catch {
      setGoogleConnected(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkStatus();
  }, []);

  const handleSyncAllSources = async () => {
    setSyncing(true);
    setMsg(null);
    try {
      let totalDiscovered = 0;
      let totalAnalyzed = 0;

      if (googleConnected) {
        const res = await fetch("/api/sync/gmail", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          totalAnalyzed += data.messagesAnalyzed || 0;
          totalDiscovered += data.commitmentsDiscovered || 0;
          if (data.commitments && onSyncCommitmentsDiscovered) {
            onSyncCommitmentsDiscovered(data.commitments);
          }
        }
      }

      if (discordConnected) {
        const res = await fetch("/api/sync/discord", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channelIds: selectedDiscordChannels }),
        });
        if (res.ok) {
          const data = await res.json();
          totalAnalyzed += data.messagesAnalyzed || 0;
          totalDiscovered += data.commitmentsDiscovered || 0;
          if (data.commitments && onSyncCommitmentsDiscovered) {
            onSyncCommitmentsDiscovered(data.commitments);
          }
        }
      }

      setMsg(`Sync Complete: Analyzed ${totalAnalyzed} messages across connected sources. Discovered ${totalDiscovered} commitment(s).`);
    } catch {
      setMsg("Sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  const fetchDiscordChannels = async () => {
    try {
      const res = await fetch("/api/auth/discord/channels");
      if (res.ok) {
        const data = await res.json();
        setDiscordChannels(data.guilds || []);
      }
    } catch {
      console.warn("Failed to load Discord channels.");
    }
  };

  const handleDisconnectGoogle = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/google/revoke", { method: "POST" });
      if (res.ok) {
        setGoogleConnected(false);
        setConnectedEmail("");
        setMsg("Disconnected Google account.");
        if (onClearAllData) onClearAllData();
      }
    } catch {
      setMsg("Failed to disconnect Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectDiscord = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/discord/revoke", { method: "POST" });
      if (res.ok) {
        setDiscordConnected(false);
        setDiscordUsername("");
        setMsg("Disconnected Discord account.");
      }
    } catch {
      setMsg("Failed to disconnect Discord.");
    } finally {
      setLoading(false);
    }
  };

  const isConnected = (id: string) => {
    if (id === "gmail" || id === "google_calendar") return googleConnected;
    if (id === "discord") return discordConnected;
    if (id === "telegram") return telegramConnected;
    return false;
  };

  // Categorize Integrations Dynamically
  const connectedList = INTEGRATION_REGISTRY.filter((item) => isConnected(item.id));
  const availableList = INTEGRATION_REGISTRY.filter((item) => item.isImplemented && !isConnected(item.id));
  const comingSoonList = INTEGRATION_REGISTRY.filter((item) => !item.isImplemented);

  const getIcon = (id: string) => {
    switch (id) {
      case "gmail":
        return <Mail className="w-5 h-5 text-red-400" />;
      case "google_calendar":
        return <Calendar className="w-5 h-5 text-blue-400" />;
      case "discord":
        return <MessageSquare className="w-5 h-5 text-indigo-400" />;
      case "telegram":
        return <Send className="w-5 h-5 text-cyan-400" />;
      case "whatsapp":
        return <MessageCircle className="w-5 h-5 text-emerald-400" />;
      case "slack":
        return <Hash className="w-5 h-5 text-amber-400" />;
      case "teams":
        return <Users className="w-5 h-5 text-violet-400" />;
      case "meet":
        return <Video className="w-5 h-5 text-emerald-400" />;
      case "zoom":
        return <Video className="w-5 h-5 text-blue-500" />;
      default:
        return <MessageSquare className="w-5 h-5 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-800 space-y-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
              Unified Connections &amp; Sources
            </h3>
            <p className="text-sm text-zinc-400 mt-0.5">
              Built to unify the places where your commitments live — from email and calendars to team chats and everyday conversations.
            </p>
          </div>

          {connectedList.length > 0 && (
            <button
              onClick={handleSyncAllSources}
              disabled={syncing}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing Connected Sources..." : "Sync All Connected"}
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div className="bg-zinc-900 border border-indigo-500/40 p-3.5 rounded-xl text-xs text-indigo-200 flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* DAILY LIFE SOURCES FLOW DIAGRAM */}
      <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl space-y-3 shadow-xl">
        <div className="text-center space-y-1">
          <h4 className="text-base font-bold text-white">Your conversations, unified.</h4>
          <p className="text-xs text-zinc-400 max-w-lg mx-auto">
            CommitAI is designed to work across the tools you already use — from email and calendars to team chats and everyday conversations.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-3 font-mono text-xs">
          {INTEGRATION_REGISTRY.map((item) => (
            <span
              key={item.id}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                isConnected(item.id)
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-800 font-bold"
                  : item.isImplemented
                  ? "bg-zinc-900 text-zinc-300 border-zinc-800"
                  : "bg-zinc-950/50 text-zinc-500 border-zinc-900"
              }`}
            >
              {getIcon(item.id)}
              <span>{item.name}</span>
            </span>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 text-xs font-mono text-zinc-500 pt-2">
          <span>Your Sources</span>
          <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-indigo-300 font-bold">CommitAI Intelligence Engine</span>
          <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-emerald-400 font-bold">One Unified Timeline</span>
        </div>
      </div>

      {/* SECTION 1: CONNECTED SOURCES */}
      <div className="space-y-4">
        <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Connected Sources ({connectedList.length})
        </h4>

        {connectedList.length === 0 ? (
          <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl text-center space-y-2">
            <Lock className="w-6 h-6 text-zinc-600 mx-auto" />
            <p className="text-zinc-300 font-semibold text-sm">No connected integrations yet.</p>
            <p className="text-zinc-500 text-xs">Select any available integration below to connect your first source.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connectedList.map((conn) => {
              const isGoogle = conn.id === "gmail" || conn.id === "google_calendar";
              const isDiscord = conn.id === "discord";
              const userIdentifier = isGoogle ? googleEmail : isDiscord ? discordUsername : "@CommitAIBot Connected";

              return (
                <div
                  key={conn.id}
                  className="bg-zinc-950 border border-emerald-500/40 p-5 rounded-2xl space-y-4 shadow-xl shadow-emerald-950/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        {getIcon(conn.id)}
                      </div>
                      <div>
                        <h5 className="text-base font-bold text-white">{conn.name}</h5>
                        <span className="text-[11px] text-zinc-400 font-mono">{userIdentifier}</span>
                      </div>
                    </div>

                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full font-mono">
                      ● CONNECTED
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400">{conn.description}</p>

                  <div className="pt-2 border-t border-zinc-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSyncAllSources}
                        disabled={syncing}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                        Sync
                      </button>

                      {isDiscord && (
                        <button
                          onClick={() => {
                            fetchDiscordChannels();
                            setShowChannelModal(true);
                          }}
                          className="bg-zinc-900 hover:bg-zinc-800 text-indigo-300 text-xs font-medium px-3 py-1.5 rounded-lg border border-indigo-500/40 transition-colors"
                        >
                          Channels
                        </button>
                      )}
                    </div>

                    <button
                      onClick={isGoogle ? handleDisconnectGoogle : isDiscord ? handleDisconnectDiscord : undefined}
                      disabled={loading}
                      className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-800 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: AVAILABLE NOW */}
      <div className="space-y-4">
        <h4 className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" /> Available Now ({availableList.length})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableList.map((conn) => (
            <div key={conn.id} className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    {getIcon(conn.id)}
                  </div>
                  <div>
                    <h5 className="text-base font-bold text-white">{conn.name}</h5>
                    <span className="text-[11px] text-zinc-400 font-mono">Available Integration</span>
                  </div>
                </div>

                <span className="bg-zinc-900 text-zinc-300 border border-zinc-800 text-[10px] font-bold px-2.5 py-1 rounded-full font-mono">
                  AVAILABLE
                </span>
              </div>

              <p className="text-xs text-zinc-400">{conn.description}</p>

              <div className="pt-2 border-t border-zinc-900 flex items-center justify-between">
                {conn.authUrl ? (
                  <a
                    href={conn.authUrl}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow flex items-center gap-1.5"
                  >
                    <span>Connect {conn.name}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-xs font-mono text-zinc-500">Ready to Connect</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: COMING SOON (PRODUCT ROADMAP) */}
      <div className="space-y-4">
        <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-2">
          <Clock className="w-4 h-4 text-zinc-500" /> Coming Soon — Product Roadmap ({comingSoonList.length})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {comingSoonList.map((conn) => (
            <div key={conn.id} className="bg-zinc-950/60 border border-zinc-900 p-5 rounded-2xl space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    {getIcon(conn.id)}
                  </div>
                  <h5 className="text-sm font-bold text-zinc-200">{conn.name}</h5>
                </div>

                <span className="bg-zinc-900 text-zinc-500 border border-zinc-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                  COMING SOON
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">{conn.description}</p>

              <div className="pt-2 border-t border-zinc-900">
                <button
                  disabled
                  className="w-full bg-zinc-900 text-zinc-600 text-xs font-mono font-semibold py-2 rounded-xl border border-zinc-800/80 cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: ROADMAP VISION MESSAGE */}
      <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl text-center space-y-2 shadow-xl">
        <h4 className="text-base font-bold text-white">More sources. One commitment memory.</h4>
        <p className="text-xs text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Connect the tools you already use. CommitAI continuously builds one evidence-backed view of what was promised, what changed, what is due, and what needs your attention.
        </p>
      </div>

      {/* Discord Channel Selection Modal */}
      {showChannelModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" /> Select Discord Servers / Channels
            </h4>
            <p className="text-xs text-zinc-400">
              CommitAI will strictly monitor messages only from the authorized channels you check below.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
              {discordChannels.length === 0 ? (
                <p className="text-xs text-zinc-500 font-mono p-2">Loading authorized Discord servers...</p>
              ) : (
                discordChannels.map((guild) => (
                  <label key={guild.id} className="flex items-center gap-2.5 text-xs text-zinc-200 cursor-pointer p-2 rounded hover:bg-zinc-800/80">
                    <input
                      type="checkbox"
                      checked={selectedDiscordChannels.includes(guild.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDiscordChannels((prev) => [...prev, guild.id]);
                        } else {
                          setSelectedDiscordChannels((prev) => prev.filter((id) => id !== guild.id));
                        }
                      }}
                      className="rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-medium">{guild.name}</span>
                  </label>
                ))
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-900">
              <button
                onClick={() => setShowChannelModal(false)}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl transition-all shadow"
              >
                Save Channels ({selectedDiscordChannels.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
