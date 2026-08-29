import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.redirect(new URL("/connections?auth_notice=telegram_setup_required", req.url));
  }

  return NextResponse.redirect(new URL("/connections?setup=telegram_bot", req.url));
}
