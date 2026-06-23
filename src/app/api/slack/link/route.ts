import { buildSlackLink } from "@/lib/auth";
import { buildSlackPayloadResponse } from "@/lib/slack";
import { readSlackPayload, verifySlackRequest } from "@/lib/slack-request";

function readPayloadValue(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" ? value : "";
}

function buildLinkResponse(link: string, source: string) {
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `ログインリンクを発行しました。\n<${link}|ここを押してログイン>`,
      },
    },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `source: ${source}` }],
    },
  ];

  return buildSlackPayloadResponse({
    response_type: "ephemeral",
    replace_original: false,
    blocks,
    text: `ログインリンク: ${link}`,
  });
}

export async function POST(request: Request) {
  if (!(await verifySlackRequest(request))) {
    return new Response("invalid signature", { status: 401 });
  }

  const { payload } = await readSlackPayload(request);
  const command = readPayloadValue(payload, "command");
  const userId = readPayloadValue(payload, "user_id");
  const teamId = readPayloadValue(payload, "team_id");
  const userName = readPayloadValue(payload, "user_name") || readPayloadValue(payload, "user_name");

  if (command) {
    const link = buildSlackLink({
      userId,
      teamId,
      userName: userName || userId,
      imageUrl: "",
      source: "slash_command",
    });

    return buildLinkResponse(link, "slash_command");
  }

  const type = readPayloadValue(payload, "type");
  if (type === "block_actions") {
    const link = buildSlackLink({
      userId,
      teamId,
      userName: userName || userId,
      imageUrl: "",
      source: "home_tab",
    });

    return buildLinkResponse(link, "home_tab");
  }

  return new Response("unsupported payload", { status: 400 });
}