import { cookies } from "next/headers"; // Next.js の cookies ヘルパ
import { NextResponse } from "next/server"; // Next.js のレスポンスユーティリティ
import { verifyLoginToken } from "@/lib/auth"; // トークン検証関数

const SESSION_COOKIE = "slack-simple-login-session"; // セッションクッキー名

function isSecureCookie() { // APP_URL が https なら secure 属性を付ける
  const appUrl = process.env.APP_URL || "";
  return appUrl.startsWith("https://");
}

export async function GET(request: Request) { // ログインリンクを消費するエンドポイント
  const url = new URL(request.url);
  const token = url.searchParams.get("token"); // クエリからトークンを取得

  if (!token) {
    return NextResponse.redirect(new URL("/", request.url)); // トークン無ければトップへリダイレクト
  }

  const identity = verifyLoginToken(token); // トークン検証
  if (!identity) {
    return NextResponse.redirect(new URL("/login/invalid", request.url)); // 無効トークンはエラーページへ
  }

  const cookieStore = await cookies(); // クッキー操作用ストアを取得

  cookieStore.set({ // セッションをクッキーに設定
    name: SESSION_COOKIE,
    value: JSON.stringify(identity),
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(),
    path: "/",
    expires: new Date(identity.expiresAt),
  });

  return NextResponse.redirect(new URL("/dashboard", request.url)); // ログイン後ダッシュボードへ
}