/**
 * Starts a Cloudflare quick tunnel to the local site and prints the one URL to share.
 *
 * cloudflared writes its banner to stderr in a box drawing, which is easy to miss in a
 * three-process concurrently pane. This waits for the site to answer, pulls the
 * https://<random>.trycloudflare.com host out of the stream, and prints it on its own line.
 *
 * The URL is new on every restart, so it is fine for "look at this now" and wrong for
 * anything printed on a resume.
 */
import { spawn, spawnSync } from "node:child_process";

const TARGET = process.env.TUNNEL_TARGET || "http://127.0.0.1:5173";
const URL_RE = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;

async function waitForSite(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: "GET" });
      if (res.ok || res.status === 404) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

console.log(`[tunnel] waiting for ${TARGET} ...`);
const up = await waitForSite(TARGET);
if (!up) {
  console.log(`[tunnel] ${TARGET} never answered; starting the tunnel anyway.`);
}

const child = spawn("cloudflared", ["tunnel", "--url", TARGET, "--no-autoupdate"], {
  stdio: ["ignore", "pipe", "pipe"],
  shell: process.platform === "win32",
});

let announced = false;

function scan(chunk) {
  const text = chunk.toString();
  const match = text.match(URL_RE);
  if (match && !announced) {
    announced = true;
    const url = match[0];
    console.log("");
    console.log("  ==============================================================");
    console.log(`   SHARE THIS LINK:  ${url}`);
    console.log("   New link every restart. Ctrl+C here closes it immediately.");
    console.log("  ==============================================================");
    console.log("");
  }
  // Keep cloudflared's own output visible; errors matter when the link does not appear.
  process.stdout.write(text);
}

child.stdout.on("data", scan);
child.stderr.on("data", scan);

child.on("error", (err) => {
  console.error(
    `[tunnel] could not start cloudflared (${err.message}). Install it with: scoop install cloudflared`,
  );
  process.exitCode = 1;
});

child.on("exit", (code) => {
  console.log(`[tunnel] cloudflared exited (${code ?? "signal"}); the public link is closed.`);
  process.exitCode = code ?? 0;
});

/**
 * On Windows cloudflared runs under a shell, so killing this process alone can leave the
 * tunnel alive and the "closed" link still serving. Kill the whole tree by pid instead.
 * Verify with: Get-Process cloudflared   (should print nothing)
 */
function stopTunnel() {
  if (!child.pid || child.exitCode !== null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }
  child.kill();
}

for (const sig of ["SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"]) {
  process.on(sig, () => {
    stopTunnel();
    process.exit(0);
  });
}
process.on("exit", stopTunnel);
