import crypto from "crypto";

export async function verifySlackRequest(request: Request) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    throw new Error("SLACK_SIGNING_SECRET is not configured");
  }

  const timestamp = request.headers.get("x-slack-request-timestamp");
  const signature = request.headers.get("x-slack-signature");
  if (!timestamp || !signature) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  const requestTime = Number(timestamp);
  if (!Number.isFinite(requestTime) || Math.abs(now - requestTime) > 60 * 5) {
    return false;
  }

  const body = await request.clone().text();
  const base = `v0:${timestamp}:${body}`;
  const expected = `v0=${crypto.createHmac("sha256", signingSecret).update(base).digest("hex")}`;

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function readSlackPayload(request: Request) {
  const body = await request.text();
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return { body, payload: JSON.parse(body) as Record<string, unknown> };
  }

  const params = new URLSearchParams(body);
  const payload = params.get("payload");
  if (payload) {
    return { body, payload: JSON.parse(payload) as Record<string, unknown> };
  }

  return { body, payload: Object.fromEntries(params.entries()) as Record<string, unknown> };
}