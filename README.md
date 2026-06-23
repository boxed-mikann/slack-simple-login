## Slack Simple Login PoC

このアプリは、Slack（スラッシュコマンドや App Home）から短命のログインリンクを発行し、Vercel 上の Next.js アプリにセッションを設定する動作を確認するための PoC（技術検証）です。

セットアップ（簡易）

1. 環境変数をコピーして編集します:

```bash
cp apps/slack-simple-login/.env.example apps/slack-simple-login/.env.local
# apps/slack-simple-login/.env.local を編集して実際の値を設定します
```

2. ローカルで Slack テストを行う場合はトンネル（例: ngrok）を利用し、`APP_URL` をトンネル URL に設定してください。Slack 側には `SLACK_SIGNING_SECRET` と `SLACK_BOT_TOKEN` を設定します。

```bash
# 開発サーバーを起動
pnpm --filter slack-simple-login dev

# 別ターミナルで ngrok を起動（例: ポート 33116 を公開）
ngrok http 33116
```

3. Slack マニフェストをアップロード

- Slack の App Management → App Manifest → Import Manifest を開きます。
- `apps/slack-simple-login/slack-manifest.json` の内容を貼り付け、`https://<your-app>` を `APP_URL` に置き換えて保存してください。

4. Slack アプリの設定

- Interactivity & Shortcuts: Request URL を `${APP_URL}/api/slack/link` に設定します。
- OAuth & Permissions: Bot スコープに `commands`, `chat:write`, `users:read` を含めます。
- Slash Commands: `/login` がマニフェストで登録されていることを確認してください。

5. Vercel へのデプロイ

- Vercel で `apps/slack-simple-login` をルートにしたプロジェクトを作成するか、モノレポ設定で出力先を `apps/slack-simple-login` にしてください。
- Vercel の環境変数に次を追加します: `APP_URL`, `SLACK_SIGNING_SECRET`, `SLACK_BOT_TOKEN`, `LOGIN_LINK_SECRET`。
- デプロイ後、Slack の Interactivity/Events の URL を `https://<your-vercel-app>/api/slack/link` / `/api/slack/events` に向けてください。

動作確認手順

1. Slack で `/login` を実行すると、エフェメラルメッセージまたは Home タブからログインリンクが発行されます。
2. 発行されたリンクを開くと `${APP_URL}/api/login?token=...` にアクセスし、サーバーがセッションクッキーを設定して `/dashboard` にリダイレクトします。
3. `/dashboard` では `users.info` を使って取得した Slack の表示名とアバターが表示されます。

補足

- 本 PoC では簡便のため固定の Bot トークンを使用しています（OAuth インストールフローは未実装）。本番運用では OAuth を実装し、トークンを安全に保存してください。
- 単一使用リンクや失効機能が必要な場合は、Vercel KV やデータベースを追加して発行済みトークンを管理してください。

もし README の文言や注釈の追加、より詳しい手順（Vercel のスクリーンショット等）が必要であれば指示してください。