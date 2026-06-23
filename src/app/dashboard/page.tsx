import Image from "next/image"; // Next.js の Image コンポーネント（最適化済み画像表示）
import { cookies } from "next/headers"; // サーバーサイドでクッキーを読むユーティリティ
import { redirect } from "next/navigation"; // サーバー側リダイレクト用
import { fetchSlackProfile } from "@/lib/slack"; // Slack API ラッパーからプロフィール取得関数を読み込む
import type { SlackIdentity } from "@/lib/auth"; // セッションの型定義

const SESSION_COOKIE = "slack-simple-login-session"; // セッションクッキー名

async function readSession(): Promise<SlackIdentity | null> { // クッキーからセッション JSON を読み取る
  const cookieStore = await cookies(); // Next.js の cookies() を取得
  const raw = cookieStore.get(SESSION_COOKIE)?.value; // 指定クッキーの生文字列を取得
  if (!raw) {
    return null; // クッキー無しなら未ログイン
  }

  try {
    return JSON.parse(raw) as SlackIdentity; // JSON パースしてセッションを返す
  } catch {
    return null; // パース失敗なら無効とみなす
  }
}

export default async function DashboardPage() { // ダッシュボードページ（サーバーコンポーネント）
  const session = await readSession(); // セッションを読み取る
  if (!session) {
    redirect("/"); // セッション無ければトップへリダイレクト
  }

  const authenticatedSession = session; // 型の都合で別名に保持

  const profile = await fetchSlackProfile(authenticatedSession.userId); // Slack からプロフィールを取得

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12 text-slate-100"> {/* メインレイアウト */}
      <section className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur md:p-12"> {/* カード風のコンテナ */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center"> {/* プロフィール行 */}
          <div className="relative h-24 w-24 overflow-hidden rounded-3xl border border-white/10 bg-slate-900"> {/* アバター枠 */}
            {profile.imageUrl ? (
              <Image src={profile.imageUrl} alt={profile.displayName} fill className="object-cover" />
            ) : null}
          </div>
          <div className="space-y-2"> {/* 名前と説明 */}
            <div className="text-sm text-sky-200">Slack login success</div>
            <h1 className="text-3xl font-semibold text-white md:text-4xl">{profile.displayName}</h1>
            <p className="text-sm leading-6 text-slate-300"> {/* ユーザーとチーム ID 表示 */}
              user_id: {authenticatedSession.userId} / team_id: {authenticatedSession.teamId}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3"> {/* 発行元・発行日時・有効期限を表示 */}
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