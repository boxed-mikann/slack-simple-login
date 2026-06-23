import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { SlackIdentity } from "@/lib/auth";

const SESSION_COOKIE = "slack-simple-login-session";

export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const session = JSON.parse(raw) as SlackIdentity;
    return NextResponse.json({ authenticated: true, session });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}