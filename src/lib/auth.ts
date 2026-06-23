import crypto from "crypto";

export type SlackIdentity = {
  teamId: string;
  userId: string;
  userName: string;
  imageUrl: string;
  source: "slash_command" | "home_tab";
  issuedAt: number;
  expiresAt: number;
};

const TOKEN_SEPARATOR = ".";
const TOKEN_TTL_MS = 10 * 60 * 1000;

function getSecret() {
  const secret = process.env.LOGIN_LINK_SECRET;
  if (!secret) {
    throw new Error("LOGIN_LINK_SECRET is not configured");
  }

  return secret;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function hmac(payload: string) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createLoginToken(identity: Omit<SlackIdentity, "issuedAt" | "expiresAt">) {
  const issuedAt = Date.now();
  const payload: SlackIdentity = {
    ...identity,
    issuedAt,
    expiresAt: issuedAt + TOKEN_TTL_MS,
  };

  const payloadText = JSON.stringify(payload);
  const encodedPayload = base64UrlEncode(payloadText);
  const signature = hmac(encodedPayload);

  return `${encodedPayload}${TOKEN_SEPARATOR}${signature}`;
}

export function verifyLoginToken(token: string) {
  const [encodedPayload, signature] = token.split(TOKEN_SEPARATOR);

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = hmac(encodedPayload);

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SlackIdentity;

  if (payload.expiresAt < Date.now()) {
    return null;
  }

  return payload;
}

export function buildAppUrl(pathname: string) {
  const origin = process.env.APP_URL;
  if (!origin) {
    throw new Error("APP_URL is not configured");
  }

  return new URL(pathname, origin).toString();
}

export function buildSlackLink(identity: Omit<SlackIdentity, "issuedAt" | "expiresAt">) {
  const token = createLoginToken(identity);
  return buildAppUrl(`/api/login?token=${encodeURIComponent(token)}`);
}