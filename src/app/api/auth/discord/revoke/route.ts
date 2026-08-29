import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  const response = NextResponse.json({ success: true, message: "Disconnected Discord account." });
  response.cookies.delete("discord_session");
  return response;
}
