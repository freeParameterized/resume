import { API_BASE } from "./config";

/**
 * Tells the API that a page view or a resume download happened, so Peter can see that
 * someone opened the link. It sends one thing: a random id from sessionStorage that
 * groups a single sitting's events together. No identity, no tracking across visits —
 * the id dies with the tab.
 *
 * Everything here is best-effort. On the static GitHub Pages build there is no API to
 * talk to, so these calls fail and are ignored.
 */
const KEY = "lr-session";

export function visitSession(): string {
  try {
    const existing = sessionStorage.getItem(KEY);
    if (existing) return existing;
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    const id = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    sessionStorage.setItem(KEY, id);
    return id;
  } catch {
    return "";
  }
}

/** Attach to API calls the server logs itself (chat, speech) so they join the session. */
export function visitHeaders(): Record<string, string> {
  const id = visitSession();
  return id ? { "x-visit-session": id } : {};
}

export function logVisit(event: "page" | "resume", detail?: string): void {
  const id = visitSession();
  if (!id) return;
  try {
    void fetch(`${API_BASE}/api/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-visit-session": id },
      body: JSON.stringify({ event, detail }),
      // Survives the navigation a download link can trigger.
      keepalive: true,
    }).catch(() => {
      /* no API in the static build */
    });
  } catch {
    /* ignore */
  }
}
