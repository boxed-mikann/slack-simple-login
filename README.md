# Slack Simple Login PoC

This app demonstrates issuing short-lived login links from Slack (slash command or App Home) and converting them to a session on a Vercel-hosted Next.js app.

Quick setup

1. Copy environment variables:

```bash
cp apps/slack-simple-login/.env.example apps/slack-simple-login/.env.local
# edit .env.local and set real values
```

2. For local Slack testing, run a tunnel (ngrok) and set `APP_URL` to your tunnel URL, then set `SLACK_SIGNING_SECRET` and `SLACK_BOT_TOKEN` in the Slack App settings.

```bash
# start dev server
pnpm --filter slack-simple-login dev

# in another terminal, run ngrok and export the url
ngrok http 33116
```

3. Upload Slack manifest

- Open Slack App Management → App Manifest → Import Manifest
- Paste the contents of `apps/slack-simple-login/slack-manifest.json`, replace `https://<your-app>` placeholders with your `APP_URL` (ngrok or Vercel URL), then save.

4. Configure Slack App

- Interactivity & Shortcuts: set Request URL to `${APP_URL}/api/slack/link`
- OAuth & Permissions: ensure bot scopes include `commands`, `chat:write`, `users:read`.
- Slash Commands: `/login` should be registered by the manifest.

5. Vercel deployment

- Create a Vercel project for the `apps/slack-simple-login` output (or monorepo setup) and set these Environment Variables in the Vercel dashboard: `APP_URL`, `SLACK_SIGNING_SECRET`, `SLACK_BOT_TOKEN`, `LOGIN_LINK_SECRET`.
- Deploy; Slack endpoints should point at `https://<your-vercel-app>/api/slack/link`.

Testing flow

1. In Slack, run `/login` → you should receive an ephemeral message containing a login link.
2. Open the link → it navigates to `${APP_URL}/api/login?token=...` which sets a session cookie and redirects to `/dashboard`.
3. `/dashboard` shows Slack display name and avatar (fetched via `users.info`).

Notes

- For PoC we use a static Bot token (no OAuth install flow). For production, implement OAuth and store tokens securely.
- If you need single-use links or revocation, add a storage backend (Vercel KV, Sheets, or a DB) to track issued tokens.