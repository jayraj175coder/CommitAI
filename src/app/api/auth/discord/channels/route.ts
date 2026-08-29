import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("discord_session");
  if (!cookie || !cookie.value) {
    return NextResponse.json({ error: "Discord not connected." }, { status: 401 });
  }

  try {
    const session = JSON.parse(Buffer.from(cookie.value, "base64").toString("utf-8"));
    const accessToken = session.accessToken;

    if (!accessToken) {
      return NextResponse.json({ error: "Access token missing." }, { status: 401 });
    }

    // Fetch authorized user guilds
    const guildsRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!guildsRes.ok) {
      return NextResponse.json({ error: "Failed to fetch Discord guilds." }, { status: guildsRes.status });
    }

    const guilds = await guildsRes.json();
    return NextResponse.json({ guilds });
  } catch {
    return NextResponse.json({ error: "Internal server error fetching Discord channels." }, { status: 500 });
  }
}
