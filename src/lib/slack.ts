const SLACK_API_BASE = "https://slack.com/api"; // Slack Web API のベース URL

type HomeView = { // views.publish で使用する Home ビューの型
  type: "home";
  blocks: Array<Record<string, unknown>>;
};

type SlackUserProfile = { // Slack の user.profile オブジェクトで期待するフィールド
  display_name?: string;
  real_name?: string;
  image_72?: string;
  image_192?: string;
  image_512?: string;
};

type SlackUsersInfoResponse = { // users.info API のレスポンス型の最小限
  ok: boolean;
  user?: {
    profile?: SlackUserProfile;
    name?: string;
  };
  error?: string;
};

export async function fetchSlackProfile(userId: string) { // Slack の users.info から表示名と画像を取得
  const token = process.env.SLACK_BOT_TOKEN; // Bot トークンを環境変数から取得
  if (!token) {
    throw new Error("SLACK_BOT_TOKEN is not configured"); // 未設定ならエラー
  }

  const response = await fetch(`${SLACK_API_BASE}/users.info?user=${encodeURIComponent(userId)}`, {
    headers: {
      Authorization: `Bearer ${token}`, // Authorization ヘッダに Bearer トークンを設定
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const data = (await response.json()) as SlackUsersInfoResponse; // レスポンスをパース

  if (!response.ok || !data.ok || !data.user) {
    throw new Error(data.error || "Failed to load Slack user profile"); // 失敗時は例外
  }

  const profile = data.user.profile; // profile 情報を取り出す
  const displayName = profile?.display_name || profile?.real_name || data.user.name || userId; // 表示名の選択ロジック
  const imageUrl = profile?.image_192 || profile?.image_72 || profile?.image_512 || ""; // 画像 URL の選択

  return {
    displayName,
    imageUrl,
  };
}

export function buildSlackPayloadResponse(body: Record<string, unknown>) { // Slack 用レスポンスを JSON で返却するユーティリティ
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export function buildSlackHomeView(input: {
  displayName: string;
  loginLink: string;
}) : HomeView { // Home タブに表示するビューペイロードを組み立てる
  return {
    type: "home",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Slack Simple Login",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${input.displayName}* さん、ログインリンクを発行できます。`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "ログインリンクを開く",
            },
            url: input.loginLink, // ボタンから直接リンクを開けるように URL を指定
            action_id: "open_login_link",
          },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "`/login` と同じ短命リンクを Home タブからも開けます。",
          },
        ],
      },
    ],
  };
}

export async function publishSlackHomeView(input: {
  userId: string;
  view: HomeView;
}) {
  const token = process.env.SLACK_BOT_TOKEN; // Bot トークンを取得
  if (!token) {
    throw new Error("SLACK_BOT_TOKEN is not configured");
  }

  const response = await fetch(`${SLACK_API_BASE}/views.publish`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`, // API 呼び出しにトークンを付与
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      user_id: input.userId,
      view: input.view,
    }),
  });

  const data = (await response.json()) as { ok?: boolean; error?: string }; // レスポンスをパース

  if (!response.ok || !data.ok) {
    throw new Error(data.error || "Failed to publish Slack Home view"); // 失敗時は例外を投げる
  }
}