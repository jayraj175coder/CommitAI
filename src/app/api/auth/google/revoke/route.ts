import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get("google_session");

  if (cookie?.value) {
    try {
      const session = JSON.parse(Buffer.from(cookie.value, "base64").toString("utf-8"));
      if (session.accessToken) {
        // Revoke token via Google OAuth2 revoke endpoint
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(session.accessToken)}`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }).catch(() => null);
      }
    } catch {
      // Ignore session parse error
    }
  }

  const response = NextResponse.json({ success: true, message: "Disconnected and revoked access successfully." });
  response.cookies.delete("google_session");
  response.cookies.delete("google_oauth_state");
  return response;
}
