import { buildSlackLink } from "@/lib/auth"; // トークン作成とリンク生成
import { buildSlackHomeView, fetchSlackProfile, publishSlackHomeView } from "@/lib/slack"; // Home ビュー生成と publish
import { readSlackPayload, verifySlackRequest } from "@/lib/slack-request"; // リクエスト検証とボディ解析

function readString(value: unknown) { // 安全に文字列を取り出すヘルパ
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) { // Slack Events API のエントリポイント
  if (!(await verifySlackRequest(request))) { // 署名とタイムスタンプ検証
    return new Response("invalid signature", { status: 401 });
  }

  const { payload } = await readSlackPayload(request); // ボディをパース
  const type = readString(payload.type); // イベント種別を取得

  if (type === "url_verification") { // URL 検証リクエストへの応答
    return Response.json({ challenge: readString(payload.challenge) });
  }

  if (type !== "event_callback") { // イベントコールバック以外は何もしない
    return new Response("ok", { status: 200 });
  }

  const event = payload.event as Record<string, unknown> | undefined; // イベント本体
  if (!event) {
    return new Response("ok", { status: 200 });
  }

  if (readString(event.type) !== "app_home_opened") { // app_home_opened のみ処理
    return new Response("ok", { status: 200 });
  }

  const userId = readString(event.user); // イベント発生ユーザー
  if (!userId) {
    return new Response("ok", { status: 200 });
  }

  const authorizations = Array.isArray(payload.authorizations) ? payload.authorizations : []; // authorizations フィールドから team を探す
  const firstAuthorization = authorizations[0] as
    | {
        team_id?: string;
        team?: {
          id?: string;
        };
      }
    | undefined;
  const teamId =
    readString(payload.team_id) ||
    readString(firstAuthorization?.team_id) ||
    readString(firstAuthorization?.team?.id); // teamId を安全に決定

  const profile = await fetchSlackProfile(userId); // Slack からプロフィールを取得
  const loginLink = buildSlackLink({ // Home タブ用の短命ログインリンクを作成
    userId,
    teamId,
    userName: profile.displayName,
    imageUrl: profile.imageUrl,
    source: "home_tab",
  });

  await publishSlackHomeView({ // Home タブにビューペイロードを公開
    userId,
    view: buildSlackHomeView({
      displayName: profile.displayName,
      loginLink,
    }),
  });

  return new Response("ok", { status: 200 }); // Slack に成功応答
}