import { NextRequest, NextResponse } from "next/server";
import { processInputExtraction } from "@/lib/aiExtractor";
import { DiscordConnector } from "@/lib/connectors";

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get("discord_session");

  if (!cookie || !cookie.value) {
    return NextResponse.json(
      { error: "Discord account not connected. Please connect Discord first." },
      { status: 401 }
    );
  }

  try {
    const session = JSON.parse(Buffer.from(cookie.value, "base64").toString("utf-8"));
    const accessToken = session.accessToken;

    if (!accessToken) {
      return NextResponse.json({ error: "Access token missing." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const channelIds: string[] = body.channelIds || [];

    if (channelIds.length === 0) {
      return NextResponse.json({
        messagesAnalyzed: 0,
        commitmentsDiscovered: 0,
        commitments: [],
        message: "No Discord channels were selected for monitoring.",
      });
    }

    const discordConnector = new DiscordConnector();
    const commitmentsDiscovered = [];
    let messagesAnalyzedCount = 0;

    for (const channelId of channelIds) {
      const msgRes = await fetch(`https://discord.com/api/channels/${channelId}/messages?limit=25`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!msgRes.ok) {
        console.warn(`Discord API message fetch failed for channel ${channelId} with status ${msgRes.status}`);
        continue;
      }

      const messages = await msgRes.json();
      if (!Array.isArray(messages)) continue;

      messagesAnalyzedCount += messages.length;

      for (const msg of messages) {
        if (!msg.content || msg.content.trim().length === 0) continue;

        const normalized = discordConnector.normalize({
          id: msg.id,
          author: msg.author?.username || "Discord User",
          channelName: channelId,
          content: msg.content,
          timestamp: msg.timestamp || new Date().toISOString(),
        });

        const extracted = await processInputExtraction(
          normalized.content,
          `Discord #${channelId} (from ${normalized.person})`,
          "discord",
          undefined,
          normalized.timestamp
        );

        extracted.forEach((item) => {
          item.sourceId = msg.id;
          item.sourceUrl = normalized.sourceUrl;
          item.sourceType = "discord";
        });

        commitmentsDiscovered.push(...extracted);
      }
    }

    return NextResponse.json({
      syncedAt: new Date().toISOString(),
      messagesAnalyzed: messagesAnalyzedCount,
      commitmentsDiscovered: commitmentsDiscovered.length,
      commitments: commitmentsDiscovered,
    });
  } catch (err) {
    console.error("Discord sync error:", err);
    return NextResponse.json({ error: "Internal server error during Discord sync." }, { status: 500 });
  }
}
