import { buildSlackLink } from "@/lib/auth";
import { buildSlackPayloadResponse } from "@/lib/slack";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("user_id") || "";
  const teamId = url.searchParams.get("team_id") || "";

  const link = buildSlackLink({
    userId,
    teamId,
    userName: url.searchParams.get("user_name") || userId,
    imageUrl: "",
    source: "home_tab",
  });

  return buildSlackPayloadResponse({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `ホームタブからログインリンクを発行できます。\n<${link}|ログインリンクを開く>`,
        },
      },
    ],
    text: `ログインリンク: ${link}`,
  });
}