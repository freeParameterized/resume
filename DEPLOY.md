# Running this thing — the short version

Everything you actually need, in the order you need it. `SECURITY.md` has the "is this safe"
answers; `README.md` has the architecture.

## Show it live, right now

One command, from the repo root:

```powershell
npm run demo
```

That starts three things together: the API, the website, and the Cloudflare tunnel. Wait for
this block to appear in the terminal:

```
  ==============================================================
   SHARE THIS LINK:  https://<random-words>.trycloudflare.com
   New link every restart. Ctrl+C here closes it immediately.
  ==============================================================
```

**That https URL is the thing you send.** Nothing else needs to happen.

`Ctrl+C` in that terminal stops all three and kills the public link.

If you only want it on this machine, `npm start` runs the API and site without a tunnel:
[http://127.0.0.1:5173](http://127.0.0.1:5173).

If you already have the dev server running and just want to start the tunnel, you can run:

```powershell
npm run tunnel
```

## The link changes every single time

Quick-tunnel URLs are random and temporary. Restarting gives you a different one and the old
one dies.

**Never put a `trycloudflare.com` link on a resume, an application, a cover letter, or a
LinkedIn profile.** It will be dead by the time anyone clicks it. Use it for "I'm on the phone
with you now, open this" and nothing else. For a permanent link, use the GitHub Pages URL below.

## Voice needs the https link

The microphone only works over the https tunnel URL (or `localhost` on this machine). iOS
Safari refuses microphone access on a plain LAN address like `http://192.168.x.x`, so if you
send someone your local IP the mic button will be disabled with an explanation. Send the
tunnel link instead.

Spoken replies and the mic can each be turned off in the site's Settings panel.

## The always-on link (workstation off)

The static site is published by GitHub Pages at
**https://freeParameterized.github.io/resume/**.

It publishes automatically on every push to `main`, and you can also trigger it by hand: repo
on GitHub → Actions → **Pages client** → *Run workflow*. The first deploy only works once Pages
is enabled in the repo settings (Settings → Pages → Source: GitHub Actions).

What a visitor sees there when this PC is off:

- the full site, resume content, projects, themes, and the resume PDF download — all normal
- the chat box still answers, but from the bundled corpus text instead of a live model. It says
  so plainly: *"The live AI demo runs on Peter's workstation — ask him for the live link."*
- no microphone and no spoken replies, because those need the local API

So the permanent link is never broken or embarrassing; it is just the non-AI version.

## Stopping the tunnel and proving it is closed

1. `Ctrl+C` in the terminal running it.
2. Confirm no process survived:

```powershell
Get-Process cloudflared -ErrorAction SilentlyContinue   # should print nothing
```

3. If that printed anything — closed terminal, lost window, anything — close it for certain:

```powershell
npm run tunnel:stop
```

4. Load the old public URL in a browser. It should fail, or show Cloudflare's 502 page.

`SECURITY.md` covers what was exposed while it was up, and what was never exposed.

## Phone number and street address

They are deliberately not on the site, and the chat refuses to give them out. If you ever want
them in the resume PDF, they live in exactly one file:

**`data/resume.json`** → the `contact` block → the `phone` and `address` fields.

Edit those, then regenerate the PDF (next section). Nothing else needs to change; the chat
corpus (`data/corpus.json`) has no phone or address in it at all, and should stay that way.

## Regenerating the resume PDF

```powershell
npm run resume:pdf
```

Writes `apps/web/public/resume.pdf` plus the `.txt` and `.md` versions. A download from the
site is saved as `YYYY.MM.DD_resume.pdf` (today's date, no personal name). It
self-validates before it reports success: the file really is a PDF and is not truncated, it is
one or two pages (three is a hard failure), and the text layer is genuinely extractable and
contains his name and the Summary heading rather than being a picture of a resume. If any check
fails it prints exactly what is wrong and exits non-zero, so a silently blank PDF cannot ship.

## Checking it still behaves (acceptance battery)

```powershell
node scripts/acceptance.mjs http://127.0.0.1:8787
```

Asks the questions a reviewer asks first and asserts the answers that must not drift: Digital
Twin Pro attributed to him personally and not to DMA, a real resume link, no phone number, a refusal for
"ignore your instructions", no invented interview anecdotes, and no first-person impersonation
of Peter on follow-up questions. Expect `15 passed, 0 failed`. Two of the cases deliberately
reach the model rather than a scripted answer, so the run takes about half a minute; if you run
it twice inside a minute it pauses for the 20-questions-per-minute rate limit and continues.

It also works against the public link: `node scripts/acceptance.mjs https://<random>.trycloudflare.com`.

Latency check: `node scripts/bench-chat.mjs`. Pre-composed answers return in about 30-90 ms;
questions that reach the model start streaming in roughly 3 seconds and finish in about 4.

## Who has visited

```powershell
npm run visits
```

Prints something like:

```
Today - 3 visits: 2 Chrome/Windows, 1 Safari/iOS; 4 chat messages; 1 resume download
```

The log is `logs/visits.log` — gitignored, never served over the web. It records a UTC
timestamp, the event type, a coarse browser/OS family, and a random per-tab session id.
It does **not** record IP addresses, locations, or full user-agent strings.

While the API is running you also get a terminal bell and a line the moment someone opens the
link:

```
[visit] someone opened the site - Safari/iOS at 7:07 PM (session 9497e4f94aa0)
```

Options in `.env`, all off by default except the bell:

| Setting | Effect |
| --- | --- |
| `VISIT_LOG_MESSAGES=1` | also record the text of each question (default: length only) |
| `VISIT_BELL=0` | silence the bell and the new-visitor line |
| `VISIT_LOG=0` | stop logging entirely |

`npm run visits -- --days 30` looks further back; `npm run visits -- --raw` dumps the last 40
lines verbatim.

## Switching the chat model

Three ways, in increasing permanence:

1. **In the site**: Settings → Model. Affects that visitor's session only.
2. **Per request**: `POST /api/ask` with `{"question": "...", "model": "qwen3-coder:30b"}`.
3. **Permanently**: `OLLAMA_MODEL=` in `.env`, then restart.

`GET /api/models` lists what is installed on this machine.

**`llama3.1:8b` is the default on purpose.** It was measured on this hardware at roughly 120 ms
to first token warm, against 2.2 s for `qwen3:8b` and far worse for the 26B model, whose 17 GB
of weights made the demo look broken while a reviewer waited. The bigger models are still
installed and still selectable in Settings if you want to show off answer quality and can
afford the pause. For a live demo, leave it on `llama3.1:8b`.

## Fresh machine, from nothing

```powershell
cd <repo>
copy .env.example .env
npm install
npm start
```

The site is pinned to port 5173 and will refuse to start rather than quietly move to 5174, so
the URL is always the same. Ollama and the voice tools are optional: with Ollama down the chat
answers from the corpus and says so, and with whisper missing the mic button explains itself.
