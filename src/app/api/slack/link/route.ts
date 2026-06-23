import { buildSlackLink } from "@/lib/auth"; // トークン生成とリンク作成
import { buildSlackPayloadResponse } from "@/lib/slack"; // Slack へ返す JSON レスポンス作成
import { readSlackPayload, verifySlackRequest } from "@/lib/slack-request"; // リクエスト検証とボディ解析

function readPayloadValue(payload: Record<string, unknown>, key: string) { // ペイロードから安全に文字列を取り出す
  const value = payload[key];
  return typeof value === "string" ? value : "";
}

function buildLinkResponse(link: string, source: string) { // Slack エフェメラルメッセージ用のブロックを生成
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

export async function POST(request: Request) { // `/api/slack/link` のエントリポイント
  if (!(await verifySlackRequest(request))) { // 署名検証
    return new Response("invalid signature", { status: 401 });
  }

  const { payload } = await readSlackPayload(request); // ボディをパース
  const command = readPayloadValue(payload, "command"); // スラッシュコマンドかどうか
  const userId = readPayloadValue(payload, "user_id"); // ユーザー ID
  const teamId = readPayloadValue(payload, "team_id"); // チーム ID
  const userName = readPayloadValue(payload, "user_name") || readPayloadValue(payload, "user_name"); // 表示名

  if (command) { // スラッシュコマンドからの呼び出し
    const link = buildSlackLink({
      userId,
      teamId,
      userName: userName || userId,
      imageUrl: "",
      source: "slash_command",
    });

    return buildLinkResponse(link, "slash_command"); // エフェメラル応答を返す
  }

  const type = readPayloadValue(payload, "type"); // interactivity の種類
  if (type === "block_actions") { // Home タブのボタン押下など
    const link = buildSlackLink({
      userId,
      teamId,
      userName: userName || userId,
      imageUrl: "",
      source: "home_tab",
    });

    return buildLinkResponse(link, "home_tab");
  }

  return new Response("unsupported payload", { status: 400 }); // 未対応のペイロード
}