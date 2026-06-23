import type { Metadata } from "next"; // Next.js のメタデータ型
import { Geist, Geist_Mono } from "next/font/google"; // フォントを Next.js 経由で読み込む
import "./globals.css"; // グローバル CSS を読み込む

const geistSans = Geist({ // 本文用フォントの設定
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({ // 等幅フォントの設定
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = { // ページのデフォルトメタ情報
  title: "Slack Simple Login PoC",
  description: "Slack から短命リンクを発行してログイン状態を再現する PoC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}> {/* フォント変数をルートに追加 */}
      <body className="min-h-full">{children}</body> {/* アプリケーション本体 */}
    </html>
  );
}