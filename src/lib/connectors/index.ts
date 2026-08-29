import { SourceType } from "@/types/commitment";

export interface NormalizedSourceData {
  sourceType: SourceType;
  sourceId: string;
  sourceUrl?: string;
  person: string;
  personIdentifier?: string;
  timestamp: string;
  content: string;
  metadata?: Record<string, string | number | boolean>;
}

export type ConnectionStatus = "connected" | "available" | "setup_required" | "demo_available";

export interface ConnectionProvider {
  id: string;
  name: string;
  sourceType: SourceType;
  status: ConnectionStatus;
  accessScopes: string;
  whyNeeded: string;
  getAuthorizationUrl(): string | null;
  normalize(rawData: unknown): NormalizedSourceData;
}

export class GmailConnector implements ConnectionProvider {
  id = "gmail";
  name = "Gmail";
  sourceType: SourceType = "gmail";
  status: ConnectionStatus = "available";
  accessScopes = "Read-only access to relevant email messages matching commitment phrases";
  whyNeeded = "Discovers promises, deliverables, and updated deadlines from email threads.";

  getAuthorizationUrl(): string {
    return "/api/auth/google";
  }

  normalize(rawData: { id: string; threadId?: string; from: string; subject: string; body: string; date: string }): NormalizedSourceData {
    return {
      sourceType: "gmail",
      sourceId: rawData.id,
      sourceUrl: `https://mail.google.com/mail/u/0/#inbox/${rawData.threadId || rawData.id}`,
      person: rawData.from.replace(/<.*>/, "").trim() || "Email Contact",
      personIdentifier: rawData.from,
      timestamp: rawData.date || new Date().toISOString(),
      content: `Subject: ${rawData.subject}\n\n${rawData.body}`,
      metadata: { subject: rawData.subject },
    };
  }
}

export class GoogleCalendarConnector implements ConnectionProvider {
  id = "google_calendar";
  name = "Google Calendar";
  sourceType: SourceType = "google_calendar";
  status: ConnectionStatus = "available";
  accessScopes = "Read-only access to upcoming calendar events and meeting descriptions";
  whyNeeded = "Identifies promised meetings, presentations, and delivery milestones.";

  getAuthorizationUrl(): string {
    return "/api/auth/google";
  }

  normalize(rawData: { id: string; htmlLink?: string; summary: string; description?: string; organizer?: string; start: string }): NormalizedSourceData {
    return {
      sourceType: "google_calendar",
      sourceId: rawData.id,
      sourceUrl: rawData.htmlLink || "https://calendar.google.com",
      person: rawData.organizer || "Calendar Event",
      timestamp: rawData.start || new Date().toISOString(),
      content: `Event: ${rawData.summary}\n${rawData.description || ""}`,
      metadata: { summary: rawData.summary },
    };
  }
}

export class OutlookConnector implements ConnectionProvider {
  id = "outlook";
  name = "Microsoft Outlook";
  sourceType: SourceType = "outlook";
  status: ConnectionStatus = "setup_required";
  accessScopes = "Read-only access to Outlook email threads";
  whyNeeded = "Discovers corporate obligations and vendor promises sent via Outlook.";

  getAuthorizationUrl(): string | null {
    return null;
  }

  normalize(rawData: { id: string; sender: string; subject: string; body: string; receivedDateTime: string }): NormalizedSourceData {
    return {
      sourceType: "outlook",
      sourceId: rawData.id,
      sourceUrl: "https://outlook.live.com",
      person: rawData.sender || "Outlook Contact",
      timestamp: rawData.receivedDateTime || new Date().toISOString(),
      content: `Subject: ${rawData.subject}\n\n${rawData.body}`,
      metadata: { subject: rawData.subject },
    };
  }
}

export class SlackConnector implements ConnectionProvider {
  id = "slack";
  name = "Slack";
  sourceType: SourceType = "slack";
  status: ConnectionStatus = "setup_required";
  accessScopes = "Read-only access to public Slack channels and direct mentions";
  whyNeeded = "Captures quick chat promises before they get buried in channel history.";

  getAuthorizationUrl(): string | null {
    return null;
  }

  normalize(rawData: { ts: string; user: string; channel: string; text: string; permalink?: string }): NormalizedSourceData {
    return {
      sourceType: "slack",
      sourceId: rawData.ts,
      sourceUrl: rawData.permalink || "https://slack.com",
      person: rawData.user || "Slack User",
      timestamp: new Date(parseFloat(rawData.ts) * 1000).toISOString(),
      content: `Channel #${rawData.channel}: ${rawData.text}`,
      metadata: { channel: rawData.channel },
    };
  }
}

export class TeamsConnector implements ConnectionProvider {
  id = "teams";
  name = "Microsoft Teams";
  sourceType: SourceType = "teams";
  status: ConnectionStatus = "setup_required";
  accessScopes = "Read-only access to Teams chat messages and channel notes";
  whyNeeded = "Unifies enterprise commitments across team channels and meeting chats.";

  getAuthorizationUrl(): string | null {
    return null;
  }

  normalize(rawData: { id: string; fromUser: string; teamName?: string; content: string; createdDateTime: string }): NormalizedSourceData {
    return {
      sourceType: "teams",
      sourceId: rawData.id,
      sourceUrl: "https://teams.microsoft.com",
      person: rawData.fromUser || "Teams Member",
      timestamp: rawData.createdDateTime || new Date().toISOString(),
      content: rawData.content,
      metadata: { teamName: rawData.teamName || "Teams Channel" },
    };
  }
}

export class DiscordConnector implements ConnectionProvider {
  id = "discord";
  name = "Discord";
  sourceType: SourceType = "discord";
  status: ConnectionStatus = "available";
  accessScopes = "Read-only access to authorized server channels and mentions";
  whyNeeded = "Tracks commitments made across project Discord channels.";

  getAuthorizationUrl(): string | null {
    return "/api/auth/discord";
  }

  normalize(rawData: { id: string; author: string; channelName: string; content: string; timestamp: string }): NormalizedSourceData {
    return {
      sourceType: "discord",
      sourceId: rawData.id,
      sourceUrl: "https://discord.com",
      person: rawData.author || "Discord Member",
      timestamp: rawData.timestamp || new Date().toISOString(),
      content: `Discord #${rawData.channelName}: ${rawData.content}`,
      metadata: { channelName: rawData.channelName },
    };
  }
}

export class TelegramConnector implements ConnectionProvider {
  id = "telegram";
  name = "Telegram";
  sourceType: SourceType = "telegram";
  status: ConnectionStatus = "available";
  accessScopes = "Read-only access to authorized Telegram group chats";
  whyNeeded = "Captures freelance client agreements and instant chat commitments.";

  getAuthorizationUrl(): string | null {
    return "/api/auth/telegram";
  }

  normalize(rawData: { message_id: number; from_name: string; text: string; date: number }): NormalizedSourceData {
    return {
      sourceType: "telegram",
      sourceId: String(rawData.message_id),
      sourceUrl: "https://telegram.org",
      person: rawData.from_name || "Telegram User",
      timestamp: new Date(rawData.date * 1000).toISOString(),
      content: rawData.text,
      metadata: {},
    };
  }
}

export const ALL_PROVIDERS: ConnectionProvider[] = [
  new GmailConnector(),
  new GoogleCalendarConnector(),
  new OutlookConnector(),
  new SlackConnector(),
  new TeamsConnector(),
  new DiscordConnector(),
  new TelegramConnector(),
];
