# Peter A. Lilley — resume

Resume site: work graph (Three.js), project panels, optional local chat, and a PDF built from the same data. First public URL is **https://freeParameterized.github.io/resume/**.

Identity: Chesterfield / St. Louis, MO · **Free Parameter LLC**. Public GitHub: [github.com/freeParameterized](https://github.com/freeParameterized). Title published: **Automation Tooling Engineer (Staff Technician)**. Phone and street stay TBD (not on the site).

**Showing it to someone?** Read [DEPLOY.md](DEPLOY.md) instead of this file. It is the runbook:
the one command that starts everything with a public link, why that link expires, how to stop
it, and how to see who visited.

## Quick start

Requires **Node 20+**. Ollama and voice tools are optional; text UI still runs if they are down.

```bash
cd <repo>
copy .env.example .env
npm install
npm start
```

- Site: [http://127.0.0.1:5173](http://127.0.0.1:5173)
- API: [http://127.0.0.1:8787](http://127.0.0.1:8787)
- Vite proxies `/api/*` to Express. Single client config point: `VITE_API_URL` (`apps/web/src/config.ts` → `API_BASE`).

`npm start` and `npm run dev` are the same: API + web together.

## Demo

1. Open the site. The glass **Ask about my code** dock is on the right. Typed or spoken questions stream tokens and **inline cards** (project, metric, job, optional paper).
2. **Settings** (Slack-style swatches): theme, voice on/off, mic on/off, local model, reduced motion — all in `localStorage`.
3. Hero stays tight: DMA PDF auto-check, 8–12h → ~30s, ~25% fewer errors, Digital Twin Pro. Longer work lives in **Deep dive**.
4. Turn **Speak replies** off in Settings to fully disable TTS.

## Ollama (local models)

API talks only to `http://127.0.0.1:11434`. Default pick: **`llama3.1:8b`** (~4.9 GB) — measured 117 ms to first token warm on this machine, which is the difference between a live demo and one that looks broken. Cloud tags (`*-cloud`) are never auto-selected.

Preference order when the default is missing (`apps/api/src/models.ts`): `llama3.1:8b` → `llama3.2:3b` → `gemma4:latest` → `qwen3:8b` → `qwen3-coder:30b` → `gemma4:26b`. The large models stay installed and selectable in Settings; they are simply too slow to lead with.

`GET /api/models` lists what is installed. `POST /api/ask` `{ "question", "model" }` can override. If Ollama is down, the UI says **inference is offline** and answers are extractive from `data/corpus.json` — not a fake live model.

## Voice (optional)

Whisper.cpp (`D:\OfflineLLMGui\whisper.cpp`) + Windows SAPI **Microsoft David Desktop**. `VOICE_SPEAKER=male-default`. This is **not** Peter’s cloned voice. Future: `VOICE_CLONE_PATH`. Disable TTS and/or mic in Settings.

## Hosting & domain

**Do not expose this workstation without auth.** The API binds `127.0.0.1` by default. Helmet, CORS allowlist, and rate limits are on `/api/chat`, `/api/stt`, `/api/tts`. No secrets in git. `.env` is gitignored.

### GitHub Pages (static client)

1. Enable Pages in the GitHub repo (Settings → Pages → Source: GitHub Actions).
2. `.github/workflows/pages.yml` deploys on every push to `main`, and can also be run by hand from the Actions tab.
3. The workflow sets `VITE_BASE=/resume/` and leaves `VITE_API_URL` empty, so the static build answers from the bundled corpus (live chat needs a local/hosted API).
4. Repo name on GitHub should be **resume** so Pages is `https://freeParameterized.github.io/resume/`. cadpal.net comes later.

### Render (API)

`render.yaml` is ready: Node web service, `HOST=0.0.0.0`, `TRUST_PROXY=1`, `CORS_ORIGINS` set to the Pages origin. A Render box **will not** see this PC’s Ollama unless you point `OLLAMA_HOST` at a reachable private endpoint. Without Ollama, the hosted API is extractive-only.

### Tunnel for a live local-inference demo

`npm run demo` starts the API, the site, and a **Cloudflare quick tunnel**, then prints the one
https URL to share. The API stays on loopback; only the web port (5173) is tunnelled. The URL is
random and dies with the process — see [DEPLOY.md](DEPLOY.md) and [SECURITY.md](SECURITY.md).

For anything longer than a live demo, put **auth in front**: a named Cloudflare tunnel with
Access (email OTP / SSO), or Tailscale Funnel on a tailnet you control. In that case set the
static client `VITE_API_URL` to that HTTPS origin and add it to `CORS_ORIGINS`.

### Separate partition / remote viewing

Stub only: `server/remote.stub.js`. Not RDP, not VNC, not implemented.

## Privacy

- Knowledge is `data/corpus.json` (plus optional `data/papers.json` when present).
- Phone and street are TBD: `data/resume.json` → `contact.phone` / `contact.address`.
- Visitors are logged coarsely to `logs/visits.log` (gitignored, never served): timestamp, event
  type, browser/OS family, random session id. No IPs, no locations, no raw user-agent strings.
  Question text needs `VISIT_LOG_MESSAGES=1`. Read it with `npm run visits`.

## Scripts

| Script | What |
| --- | --- |
| `npm start` / `npm run dev` | API watch + Vite on 127.0.0.1:5173 |
| `npm run demo` | API + Vite + Cloudflare tunnel, prints the public link |
| `npm run tunnel` | Tunnel only, against an already-running site |
| `npm run tunnel:stop` | Close every cloudflared process (kill switch) |
| `npm run visits` | Recent-visitor summary from `logs/visits.log` |
| `npm run resume:pdf` | Regenerate the resume PDF/TXT/MD, with validation |
| `npm run build:pages` | Static frontend |
| `npm run start -w @cadpal/api` | Compiled API |
| `node scripts/acceptance.mjs <url>` | Answer-quality and honesty battery |
| `node scripts/bench-chat.mjs [url]` | End-to-end chat latency, instant vs model |
