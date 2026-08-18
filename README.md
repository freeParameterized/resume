# Peter A. Lilley — living resume

A **living** frontend + backend exhibit: spatial tote / work graph (Three.js), resume-accurate project panels, Copilot-style chat with **inline context cards**, and **offline local inference** (Ollama + whisper.cpp + Windows SAPI) on this machine. To a visitor it is just a site.

Identity: Chesterfield / St. Louis, MO · **Free Parameter LLC**. Public GitHub: [github.com/freeParameterized](https://github.com/freeParameterized). Title published: **Staff Technician (CAD automation / Civil 3D tools)**. Phone and street stay TBD (not on the site).

## Quick start

Requires **Node 20+**. Ollama and voice tools are optional; text UI still runs if they are down.

```bash
cd living-resume
copy .env.example .env
npm install
npm start
```

- Site: [http://127.0.0.1:5173](http://127.0.0.1:5173)
- API: [http://127.0.0.1:8787](http://127.0.0.1:8787)
- Vite proxies `/api/*` to Express. Single client config point: `VITE_API_URL` (`apps/web/src/config.ts` → `API_BASE`).

`npm start` and `npm run dev` are the same: API + web together.

## Demo

1. Open the site. The glass **Ask about my code** dock is on the right. Typed or spoken questions stream tokens and **inline cards** (project, metric, job, About Me, optional paper).
2. **Settings** (Slack-style swatches): theme, voice on/off, mic on/off, local model, reduced motion — all in `localStorage`.
3. Ask **“What got you into programming?”** — About Me fades in, camera moves, card inlines in chat (`originStoryDraft: true`).
4. Hero stays tight: DMA PDF auto-check, 8–12h → ~30s, ~25% fewer errors, Digital Twin Pro. Longer work lives in **Deep dive**.
5. Turn **Speak replies** off in Settings to fully disable TTS.

## Ollama (local models)

API talks only to `http://127.0.0.1:11434`. Default pick: **`gemma4:26b`** (25.8B Q4_K_M, ~16.8 GB) — strongest local general chat on this disk. Cloud tags (`*-cloud`) are never auto-selected.

Fallback chain if the default is missing: `gemma4:26b` → `qwen3-coder:30b` → `gemma4:latest` → `qwen3:8b` → `qwen2.5-coder:7b` → `llama3.2:3b`.

`GET /api/models` lists what is installed. `POST /api/ask` `{ "question", "model" }` can override. If Ollama is down, the UI says **inference is offline** and answers are extractive from `data/corpus.json` — not a fake live model.

## Voice (optional)

Whisper.cpp (`D:\OfflineLLMGui\whisper.cpp`) + Windows SAPI **Microsoft David Desktop**. `VOICE_SPEAKER=male-default`. This is **not** Peter’s cloned voice. Future: `VOICE_CLONE_PATH`. Disable TTS and/or mic in Settings.

## Hosting & domain

**Do not expose this workstation without auth.** The API binds `127.0.0.1` by default. Helmet, CORS allowlist, and rate limits are on `/api/chat`, `/api/stt`, `/api/tts`. No secrets in git. `.env` is gitignored.

### GitHub Pages (static client)

1. Enable Pages in the GitHub repo (or wait).
2. Run the workflow **Pages client** manually (`workflow_dispatch` in `.github/workflows/pages.yml` — it does **not** run on push).
3. Set `VITE_BASE=/living-resume/` for a project site. Leave `VITE_API_URL` empty so the static build uses bundled corpus (chat Q&A needs a local/hosted API).
4. Custom domain **freeparameter.com**: in the Pages settings add the domain; at the DNS host create a `CNAME` (or A records per GitHub docs) from `www` or apex to `freeParameterized.github.io`. Add a `CNAME` file in `apps/web/public` if you want it in the artifact.

### Render (API)

`render.yaml` is ready: Node web service, `HOST=0.0.0.0`, `TRUST_PROXY=1`, `CORS_ORIGINS` set to the Pages origin. A Render box **will not** see this PC’s Ollama unless you point `OLLAMA_HOST` at a reachable private endpoint. Without Ollama, the hosted API is extractive-only.

### Secure tunnel for a live local-inference demo (do not run now)

Keep the API on loopback. Put **auth in front**, then tunnel:

- **Cloudflare Tunnel** (`cloudflared tunnel`) with Access (email OTP / SSO) in front of `http://127.0.0.1:8787`.
- **Tailscale Funnel** only on a tailnet you control, still behind Tailscale ACLs.

Set the static client `VITE_API_URL` to that HTTPS origin and add it to `CORS_ORIGINS`. Do **not** open a tunnel from this repo’s scripts.

### Separate partition / remote viewing

Stub only: `server/remote.stub.js`. Not RDP, not VNC, not implemented.

## Privacy

- Knowledge is `data/corpus.json` (plus optional `data/papers.json` when present).
- Phone and street are TBD.
- Do not say he is seeking Project Management.

## Scripts

| Script | What |
| --- | --- |
| `npm start` / `npm run dev` | API watch + Vite |
| `npm run build:pages` | Static frontend |
| `npm run start -w @living-resume/api` | Compiled API |
