import crypto from "crypto"; // Node の組み込み crypto モジュールを使用（署名検証用）

export async function verifySlackRequest(request: Request) { // Slack リクエストの署名とタイムスタンプを検証する
  const signingSecret = process.env.SLACK_SIGNING_SECRET; // 環境変数から署名用シークレットを取得
  if (!signingSecret) {
    throw new Error("SLACK_SIGNING_SECRET is not configured"); // 未設定ならエラー
  }

  const timestamp = request.headers.get("x-slack-request-timestamp"); // Slack からのタイムスタンプヘッダ
  const signature = request.headers.get("x-slack-signature"); // Slack 署名ヘッダ
  if (!timestamp || !signature) {
    return false; // 必須ヘッダが無ければ検証失敗
  }

  const now = Math.floor(Date.now() / 1000); // 現在時刻（秒）
  const requestTime = Number(timestamp); // リクエストヘッダのタイムスタンプを数値化
  if (!Number.isFinite(requestTime) || Math.abs(now - requestTime) > 60 * 5) {
    return false; // タイムスタンプが不正か 5 分以上ずれていれば拒否
  }

  const body = await request.clone().text(); // ボディを文字列として取得（複数回読むため clone）
  const base = `v0:${timestamp}:${body}`; // Slack の署名ベース文字列形式
  const expected = `v0=${crypto.createHmac("sha256", signingSecret).update(base).digest("hex")}`; // 期待される署名を計算

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)); // タイミング攻撃対策で比較
}

export async function readSlackPayload(request: Request) { // リクエストボディを解析してペイロードを返す
  const body = await request.text(); // 生のボディ文字列を取得
  const contentType = request.headers.get("content-type") || ""; // Content-Type ヘッダを取得

  if (contentType.includes("application/json")) { // JSON ボディならそのまま解析
    return { body, payload: JSON.parse(body) as Record<string, unknown> };
  }

  const params = new URLSearchParams(body); // フォームエンコードの場合は URLSearchParams で解析
  const payload = params.get("payload"); // interactivity の場合、payload パラメータに JSON が入る
  if (payload) {
    return { body, payload: JSON.parse(payload) as Record<string, unknown> };
  }

  return { body, payload: Object.fromEntries(params.entries()) as Record<string, unknown> }; // それ以外はパラメータをオブジェクト化して返す
}