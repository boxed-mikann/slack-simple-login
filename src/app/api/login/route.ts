import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyLoginToken } from "@/lib/auth";

const SESSION_COOKIE = "slack-simple-login-session";

function isSecureCookie() {
  const appUrl = process.env.APP_URL || "";
  return appUrl.startsWith("https://");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const identity = verifyLoginToken(token);
  if (!identity) {
    return NextResponse.redirect(new URL("/login/invalid", request.url));
  }

  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE,
    value: JSON.stringify(identity),
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(),
    path: "/",
    expires: new Date(identity.expiresAt),
  });

  return NextResponse.redirect(new URL("/dashboard", request.url));
}