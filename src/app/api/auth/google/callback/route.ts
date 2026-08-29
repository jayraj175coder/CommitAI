import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");
  const storedState = req.cookies.get("google_oauth_state")?.value;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code) {
    const notice = error === "access_denied" ? "cancelled" : "auth_failed";
    return NextResponse.redirect(`${baseUrl}/?auth_notice=${notice}&provider=google`);
  }

  if (state && storedState && state !== storedState) {
    console.warn("[Google OAuth] CSRF state mismatch.");
    return NextResponse.redirect(`${baseUrl}/?auth_notice=csrf_state_mismatch&provider=google`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${baseUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/?auth_notice=setup_required&provider=google`);
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokenRes.ok || !tokens.access_token) {
      return NextResponse.redirect(`${baseUrl}/?auth_notice=token_exchange_failed&provider=google`);
    }

    // Fetch User Email Profile
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();

    const sessionData = JSON.stringify({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      email: profile.email || "Connected Google Account",
      connectedAt: new Date().toISOString(),
    });

    const response = NextResponse.redirect(`${baseUrl}/?auth_success=1`);
    
    response.cookies.set("google_session", Buffer.from(sessionData).toString("base64"), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(`${baseUrl}/?auth_notice=internal_error&provider=google`);
  }
}
