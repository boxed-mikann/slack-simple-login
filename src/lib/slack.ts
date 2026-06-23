const SLACK_API_BASE = "https://slack.com/api";

type HomeView = {
  type: "home";
  blocks: Array<Record<string, unknown>>;
};

type SlackUserProfile = {
  display_name?: string;
  real_name?: string;
  image_72?: string;
  image_192?: string;
  image_512?: string;
};

type SlackUsersInfoResponse = {
  ok: boolean;
  user?: {
    profile?: SlackUserProfile;
    name?: string;
  };
  error?: string;
};

export async function fetchSlackProfile(userId: string) {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    throw new Error("SLACK_BOT_TOKEN is not configured");
  }

  const response = await fetch(`${SLACK_API_BASE}/users.info?user=${encodeURIComponent(userId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const data = (await response.json()) as SlackUsersInfoResponse;

  if (!response.ok || !data.ok || !data.user) {
    throw new Error(data.error || "Failed to load Slack user profile");
  }

  const profile = data.user.profile;
  const displayName = profile?.display_name || profile?.real_name || data.user.name || userId;
  const imageUrl = profile?.image_192 || profile?.image_72 || profile?.image_512 || "";

  return {
    displayName,
    imageUrl,
  };
}

export function buildSlackPayloadResponse(body: Record<string, unknown>) {
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
}) : HomeView {
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
            url: input.loginLink,
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
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    throw new Error("SLACK_BOT_TOKEN is not configured");
  }

  const response = await fetch(`${SLACK_API_BASE}/views.publish`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      user_id: input.userId,
      view: input.view,
    }),
  });

  const data = (await response.json()) as { ok?: boolean; error?: string };

  if (!response.ok || !data.ok) {
    throw new Error(data.error || "Failed to publish Slack Home view");
  }
}