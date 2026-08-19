/**
 * Guaranteed kill switch for the public link: closes every cloudflared process, whatever
 * started it. Ctrl+C in the tunnel terminal normally does this on its own; this is here for
 * the case where a terminal was closed, a window was lost, or you simply want to be certain.
 *
 * Usage: npm run tunnel:stop
 */
import { spawnSync } from "node:child_process";

const win = process.platform === "win32";
const result = win
  ? spawnSync("taskkill", ["/IM", "cloudflared.exe", "/T", "/F"], { encoding: "utf8" })
  : spawnSync("pkill", ["-f", "cloudflared"], { encoding: "utf8" });

const output = `${result.stdout || ""}${result.stderr || ""}`.trim();

if (/SUCCESS|terminated/i.test(output) || result.status === 0) {
  console.log("[tunnel] cloudflared stopped. The public link is closed.");
} else {
  console.log("[tunnel] no cloudflared process was running. Nothing to close.");
}

console.log(
  win
    ? "[tunnel] verify with:  Get-Process cloudflared -ErrorAction SilentlyContinue   (should print nothing)"
    : "[tunnel] verify with:  pgrep -fa cloudflared   (should print nothing)",
);
