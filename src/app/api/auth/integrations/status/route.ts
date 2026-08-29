import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const discordSession = req.cookies.get("discord_session");
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;

  let discordConnected = false;
  let discordUsername = "";

  if (discordSession && discordSession.value) {
    try {
      const session = JSON.parse(Buffer.from(discordSession.value, "base64").toString("utf-8"));
      if (session.accessToken) {
        const userRes = await fetch("https://discord.com/api/users/@me", {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          discordConnected = true;
          discordUsername = `${userData.username}#${userData.discriminator || "0"}`;
        }
      }
    } catch {
      discordConnected = false;
    }
  }

  const telegramConnected = !!(telegramToken && telegramToken.length > 10);

  return NextResponse.json({
    discord: {
      isConnected: discordConnected,
      username: discordUsername,
    },
    telegram: {
      isConnected: telegramConnected,
      botName: "@CommitAIBot",
    },
  });
}
