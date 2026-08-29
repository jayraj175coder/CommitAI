import { NextRequest, NextResponse } from "next/server";

function getBaseUrl(req?: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  if (req) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "https";
    if (host) return `${proto}://${host}`.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}

export async function GET(req: NextRequest) {
  const urlParams = req.nextUrl.searchParams;
  const code = urlParams.get("code");
  const state = urlParams.get("state");
  const storedState = req.cookies.get("discord_oauth_state")?.value;
  const baseUrl = getBaseUrl(req);

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/connections?auth_notice=cancelled`);
  }

  if (state && storedState && state !== storedState) {
    console.warn("Discord OAuth state mismatch.");
    return NextResponse.redirect(`${baseUrl}/connections?auth_notice=discord_state_mismatch`);
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI || `${baseUrl}/api/auth/discord/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/connections?auth_notice=discord_setup_required`);
  }

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL("/connections?auth_notice=discord_token_failed", req.url));
    }

    const tokenData = await tokenRes.json();
    const sessionPayload = Buffer.from(
      JSON.stringify({
        accessToken: tokenData.access_token,
        tokenType: tokenData.token_type,
        createdAt: Date.now(),
      })
    ).toString("base64");

    const response = NextResponse.redirect(new URL("/connections?connected=discord", req.url));
    response.cookies.set("discord_session", sessionPayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL("/connections?auth_notice=discord_error", req.url));
  }
}
