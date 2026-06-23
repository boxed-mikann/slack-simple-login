import crypto from "crypto"; // Node の組み込み暗号モジュールを読み込む（HMAC 用）

export type SlackIdentity = { // Slack から受け取るユーザー情報の型定義
  teamId: string; // Slack ワークスペース（チーム）ID
  userId: string; // Slack ユーザー ID
  userName: string; // Slack の表示名
  imageUrl: string; // ユーザーのアバター画像 URL
  source: "slash_command" | "home_tab"; // リンク発行元（スラッシュ or Home）
  issuedAt: number; // 発行時刻（Unix ms）
  expiresAt: number; // 有効期限（Unix ms）
};

const TOKEN_SEPARATOR = "."; // トークン内でペイロードと署名を分ける区切り文字
const TOKEN_TTL_MS = 10 * 60 * 1000; // トークンの有効期間（10分）

function getSecret() { // 環境変数から署名用シークレットを取得
  const secret = process.env.LOGIN_LINK_SECRET; // シークレットを環境変数から読む
  if (!secret) {
    throw new Error("LOGIN_LINK_SECRET is not configured"); // 未設定なら例外を投げる
  }

  return secret; // シークレットを返す
}

function base64UrlEncode(value: string) { // URL 安全な Base64 エンコード
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) { // URL 安全な Base64 デコード
  return Buffer.from(value, "base64url").toString("utf8");
}

function hmac(payload: string) { // ペイロードに対する HMAC-SHA256 を計算して返す
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createLoginToken(identity: Omit<SlackIdentity, "issuedAt" | "expiresAt">) { // ログイントークンを作成
  const issuedAt = Date.now(); // 発行時刻を現在時刻で決める
  const payload: SlackIdentity = {
    ...identity, // 引数の識別情報を展開
    issuedAt, // 発行時刻を設定
    expiresAt: issuedAt + TOKEN_TTL_MS, // 有効期限を設定
  };

  const payloadText = JSON.stringify(payload); // ペイロードを JSON 文字列化
  const encodedPayload = base64UrlEncode(payloadText); // Base64URL エンコード
  const signature = hmac(encodedPayload); // エンコード済ペイロードの HMAC を計算

  return `${encodedPayload}${TOKEN_SEPARATOR}${signature}`; // ペイロード.署名 の形式で返す
}

export function verifyLoginToken(token: string) { // トークンの検証とペイロード復元
  const [encodedPayload, signature] = token.split(TOKEN_SEPARATOR); // 区切りで分割

  if (!encodedPayload || !signature) { // どちらかが欠けていたら無効
    return null;
  }

  const expectedSignature = hmac(encodedPayload); // 期待される署名を計算

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) { // タイミング攻撃対策の比較
    return null; // 署名不一致で無効
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SlackIdentity; // ペイロードを復元して型にキャスト

  if (payload.expiresAt < Date.now()) { // 有効期限切れチェック
    return null; // 期限切れで無効
  }

  return payload; // 検証成功ならペイロードを返す
}

export function buildAppUrl(pathname: string) { // アプリのルート（APP_URL）を基に完全 URL を生成
  const origin = process.env.APP_URL; // 環境変数からアプリのベース URL を取得
  if (!origin) {
    throw new Error("APP_URL is not configured"); // 未設定なら例外
  }

  return new URL(pathname, origin).toString(); // 完全 URL を返す
}

export function buildSlackLink(identity: Omit<SlackIdentity, "issuedAt" | "expiresAt">) { // Slack 用のログインリンクを生成
  const token = createLoginToken(identity); // トークンを作る
  return buildAppUrl(`/api/login?token=${encodeURIComponent(token)}`); // `api/login` エンドポイントへのリンクを返す
}