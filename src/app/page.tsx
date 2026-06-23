import Link from "next/link"; // Next.js の Link コンポーネントを利用してクライアント側遷移を行う

export default function HomePage() { // ホームページの React コンポーネント
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10 text-slate-100 md:px-10"> {/* ページ全体のレイアウト */}
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col justify-center gap-10"> {/* コンテンツ中央寄せ */}
        <section className="max-w-3xl space-y-6"> {/* ヒーローセクション */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur"> {/* バッジ */}
            Slack simple login PoC for Vercel
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl"> {/* ページ見出し */}
            Slack から短命リンクを発行して、そのままログイン状態へ飛ばす検証アプリ
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300 md:text-lg"> {/* 説明文 */}
            スラッシュコマンドか App Home のボタンを押すと、署名付きの有効期限リンクを返します。
            クリック後は Slack の表示名とプロフィール画像を反映したセッションでアプリに入ります。
          </p>
          <div className="flex flex-wrap gap-3"> {/* アクションボタン群 */}
            <Link
              href="/dashboard"
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[var(--accent-strong)]"
            >
              デモ画面へ
            </Link>
            <a
              href="#flow"
              className="rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
            >
              フローを見る
            </a>
          </div>
        </section>

        <section id="flow" className="grid gap-4 md:grid-cols-3"> {/* フロー説明セクション */}
          {[
            ["1", "Slack から起動", "スラッシュコマンドと App Home の両方を入口にします。"],
            ["2", "短命リンクを発行", "保存なしで、署名付きトークンだけを返します。"],
            ["3", "Slack らしいログイン", "リンク先でユーザー名とアイコンを反映します。"],
          ].map(([step, title, description]) => (
            <article
              key={step}
              className="rounded-3xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-2xl shadow-black/20 backdrop-blur"
            >
              <div className="mb-4 text-sm font-medium text-sky-200">Step {step}</div> {/* ステップ番号 */}
              <h2 className="text-xl font-semibold text-white">{title}</h2> {/* ステップタイトル */}
              <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p> {/* ステップ説明 */}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}