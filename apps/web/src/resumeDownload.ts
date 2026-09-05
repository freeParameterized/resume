import type { MouseEvent } from "react";
import { logVisit } from "./visits";

/** Stable public asset — no personal name in the URL. */
export const RESUME_PDF_ASSET = "resume.pdf";
export const RESUME_PDF_URL = `${import.meta.env.BASE_URL}${RESUME_PDF_ASSET}`;

/** Saved filename: today's date, no personal name. Example: 2026.09.05_resume.pdf */
export function datedResumeFilename(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}_resume.pdf`;
}

/** Page-load value for static `download` attributes; click handler restamps at save time. */
export const RESUME_PDF_FILENAME = datedResumeFilename();

let cached: Blob | null = null;
let inflight: Promise<Blob> | null = null;

async function getPdfBlob(): Promise<Blob> {
  if (cached) return cached;
  if (!inflight) {
    inflight = fetch(RESUME_PDF_URL)
      .then(async (res) => {
        if (!res.ok) throw new Error(`resume pdf ${res.status}`);
        const blob = await res.blob();
        if (blob.size < 1000) throw new Error("resume pdf empty");
        cached = blob;
        return blob;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Warm the PDF so a later tap can save without waiting on the network. */
export function prefetchResumePdf(): void {
  void getPdfBlob().catch(() => {
    /* tap handler will retry */
  });
}

prefetchResumePdf();

async function saveResumePdf(): Promise<void> {
  logVisit("resume", "pdf");
  const blob = await getPdfBlob();
  const filename = datedResumeFilename();
  const file = new File([blob], filename, { type: "application/pdf" });

  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: filename });
      return;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function onResumePdfClick(e: MouseEvent<HTMLAnchorElement>): void {
  if (e.defaultPrevented) return;
  if (e.button !== 0) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  void saveResumePdf().catch(() => {
    window.location.assign(RESUME_PDF_URL);
  });
}

export const resumePdfLinkProps = {
  href: RESUME_PDF_URL,
  download: RESUME_PDF_FILENAME,
};
