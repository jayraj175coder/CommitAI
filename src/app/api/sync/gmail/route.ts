import { NextRequest, NextResponse } from "next/server";
import { processInputExtraction } from "@/lib/aiExtractor";
import { GmailConnector, GoogleCalendarConnector } from "@/lib/connectors";
import { decodeHtmlEntities } from "@/lib/textUtils";

interface GmailMessageHeader {
  name: string;
  value: string;
}

interface GmailMessagePayload {
  mimeType?: string;
  headers?: GmailMessageHeader[];
  body?: { data?: string };
  parts?: GmailMessagePayload[];
}

function decodeBase64Url(str: string): string {
  try {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    return Buffer.from(base64, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function extractTextFromPayload(payload: GmailMessagePayload): string {
  let text = "";
  if (payload.body?.data) {
    text += decodeBase64Url(payload.body.data) + "\n";
  }
  if (payload.parts && payload.parts.length > 0) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        text += decodeBase64Url(part.body.data) + "\n";
      } else if (part.parts) {
        text += extractTextFromPayload(part) + "\n";
      }
    }
  }
  return text;
}

async function refreshGoogleToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret || !refreshToken) return null;

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get("google_session");

  if (!cookie || !cookie.value) {
    return NextResponse.json(
      { error: "Google account not connected. Please connect Google first." },
      { status: 401 }
    );
  }

  try {
    const session = JSON.parse(Buffer.from(cookie.value, "base64").toString("utf-8"));
    let accessToken = session.accessToken;
    let refreshed = false;

    if (!accessToken && !session.refreshToken) {
      return NextResponse.json({ error: "Access token missing." }, { status: 401 });
    }

    if (!accessToken && session.refreshToken) {
      const newAccessToken = await refreshGoogleToken(session.refreshToken);
      if (newAccessToken) {
        accessToken = newAccessToken;
        session.accessToken = newAccessToken;
        refreshed = true;
      } else {
        return NextResponse.json({ error: "Unable to refresh Google access token." }, { status: 401 });
      }
    }

    let messagesFetchedCount = 0;
    let messagesAnalyzedCount = 0;
    const commitmentsDiscovered = [];

    const gmailConnector = new GmailConnector();
    const calendarConnector = new GoogleCalendarConnector();

    // 1. Fetch Gmail Messages (Fetch up to 50 recent messages from inbox / sent)
    let listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // If expired, refresh and retry once
    if (listRes.status === 401 && session.refreshToken) {
      const newAccessToken = await refreshGoogleToken(session.refreshToken);
      if (newAccessToken) {
        accessToken = newAccessToken;
        session.accessToken = newAccessToken;
        refreshed = true;
        listRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
      }
    }

    if (listRes.ok) {
      const listData = await listRes.json();
      const messages = listData.messages || [];
      messagesFetchedCount = messages.length;

      // Analyze up to 25 messages to stay within reasonable execution time
      const messagesToFetch = messages.slice(0, 25);

      for (const msg of messagesToFetch) {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!detailRes.ok) continue;

        messagesAnalyzedCount++;
        const detail = await detailRes.json();
        const payload: GmailMessagePayload = detail.payload || {};
        const headers = payload.headers || [];

        const subjectHeader = headers.find((h) => h.name.toLowerCase() === "subject");
        const fromHeader = headers.find((h) => h.name.toLowerCase() === "from");
        const dateHeader = headers.find((h) => h.name.toLowerCase() === "date");

        const subject = decodeHtmlEntities(subjectHeader?.value || "Email Message");
        const from = decodeHtmlEntities(fromHeader?.value || "Email Contact");
        const msgDate = dateHeader?.value ? new Date(dateHeader.value).toISOString() : new Date().toISOString();

        let bodyText = decodeHtmlEntities(detail.snippet || "");
        const extractedBody = extractTextFromPayload(payload);
        if (extractedBody.trim()) {
          bodyText += "\n" + decodeHtmlEntities(extractedBody);
        }

        if (bodyText.trim()) {
          const normalized = gmailConnector.normalize({
            id: msg.id,
            threadId: msg.threadId,
            from,
            subject,
            body: bodyText,
            date: msgDate,
          });

          const extracted = await processInputExtraction(
            normalized.content,
            `Gmail: ${subject} (from ${normalized.person})`,
            "gmail",
            undefined,
            msgDate
          );

          // Attach sourceId, sourceUrl, and sourceType
          extracted.forEach((item) => {
            item.sourceId = msg.id;
            item.sourceUrl = normalized.sourceUrl;
            item.sourceType = "gmail";
          });

          commitmentsDiscovered.push(...extracted);
        }
      }
    } else {
      console.warn("Gmail API list returned status:", listRes.status);
    }

    // 2. Fetch Google Calendar Events (Upcoming and recent 14 days)
    const timeMin = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const calRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
        timeMin
      )}&maxResults=20&singleEvents=true&orderBy=startTime`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (calRes.ok) {
      const calData = await calRes.json();
      const events = calData.items || [];

      for (const evt of events) {
        if (!evt.summary) continue;

        const normalized = calendarConnector.normalize({
          id: evt.id,
          htmlLink: evt.htmlLink,
          summary: evt.summary,
          description: evt.description,
          organizer: evt.organizer?.displayName || evt.organizer?.email || "Calendar Event",
          start: evt.start?.dateTime || evt.start?.date || new Date().toISOString(),
        });

        const extracted = await processInputExtraction(
          normalized.content,
          `Google Calendar: ${evt.summary}`,
          "google_calendar"
        );

        extracted.forEach((item) => {
          item.sourceId = evt.id;
          item.sourceUrl = normalized.sourceUrl;
          item.sourceType = "google_calendar";
        });

        commitmentsDiscovered.push(...extracted);
      }
    }

    const response = NextResponse.json({
      syncedAt: new Date().toISOString(),
      messagesFetched: messagesFetchedCount,
      messagesAnalyzed: messagesAnalyzedCount,
      commitmentsDiscovered: commitmentsDiscovered.length,
      commitments: commitmentsDiscovered,
      diagnostics: {
        messagesFetchedCount,
        messagesAnalyzedCount,
        commitmentsDiscoveredCount: commitmentsDiscovered.length,
      },
    });

    if (refreshed) {
      response.cookies.set("google_session", Buffer.from(JSON.stringify(session)).toString("base64"), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
    }

    return response;
  } catch (err: unknown) {
    console.error("Sync error:", err);
    return NextResponse.json({ error: "Internal server error during Google sync." }, { status: 500 });
  }
}
