import Link from "next/link";

export default function InvalidLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-slate-100">
      <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
        <h1 className="text-2xl font-semibold">リンクが無効です</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          期限切れ、改ざん、または設定不足の可能性があります。
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950"
        >
          トップへ戻る
        </Link>
      </div>
    </main>
  );
}