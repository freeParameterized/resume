import type { MouseEvent } from "react";
import { logVisit } from "./visits";

export const RESUME_PDF_FILENAME = "2026.08.20_PeterL_Resume.pdf";
export const RESUME_PDF_URL = `${import.meta.env.BASE_URL}${RESUME_PDF_FILENAME}`;

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
  const file = new File([blob], RESUME_PDF_FILENAME, { type: "application/pdf" });

  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: RESUME_PDF_FILENAME });
      return;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
    }
  }

  const ios =
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (ios) {
    window.location.assign(RESUME_PDF_URL);
    return;
  }

  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = RESUME_PDF_FILENAME;
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
