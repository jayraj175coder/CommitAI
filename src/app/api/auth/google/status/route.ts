import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("google_session");

  if (!cookie || !cookie.value) {
    return NextResponse.json({ isConnected: false });
  }

  try {
    const session = JSON.parse(Buffer.from(cookie.value, "base64").toString("utf-8"));
    return NextResponse.json({
      isConnected: true,
      email: session.email,
      connectedAt: session.connectedAt,
    });
  } catch {
    return NextResponse.json({ isConnected: false });
  }
}
