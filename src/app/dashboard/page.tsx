import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchSlackProfile } from "@/lib/slack";
import type { SlackIdentity } from "@/lib/auth";

const SESSION_COOKIE = "slack-simple-login-session";

async function readSession(): Promise<SlackIdentity | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SlackIdentity;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const session = await readSession();
  if (!session) {
    redirect("/");
  }

  const authenticatedSession = session;

  const profile = await fetchSlackProfile(authenticatedSession.userId);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12 text-slate-100">
      <section className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur md:p-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
            {profile.imageUrl ? (
              <Image src={profile.imageUrl} alt={profile.displayName} fill className="object-cover" />
            ) : null}
          </div>
          <div className="space-y-2">
            <div className="text-sm text-sky-200">Slack login success</div>
            <h1 className="text-3xl font-semibold text-white md:text-4xl">{profile.displayName}</h1>
            <p className="text-sm leading-6 text-slate-300">
              user_id: {authenticatedSession.userId} / team_id: {authenticatedSession.teamId}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Source</div>
            <div className="mt-2 text-sm font-medium">{authenticatedSession.source}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Issued</div>
            <div className="mt-2 text-sm font-medium">{new Date(authenticatedSession.issuedAt).toLocaleString("ja-JP")}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Expires</div>
            <div className="mt-2 text-sm font-medium">{new Date(authenticatedSession.expiresAt).toLocaleString("ja-JP")}</div>
          </div>
        </div>
      </section>
    </main>
  );
}