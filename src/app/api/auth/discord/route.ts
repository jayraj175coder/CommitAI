import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/discord/callback`;

  if (!clientId) {
    return NextResponse.redirect(new URL("/connections?auth_notice=discord_setup_required", req.url));
  }

  const state = crypto.randomBytes(16).toString("hex");
  const scopes = encodeURIComponent("identify email guilds messages.read");
  const discordUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes}&state=${state}`;

  const response = NextResponse.redirect(discordUrl);
  response.cookies.set("discord_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 mins
    path: "/",
  });

  return response;
}
