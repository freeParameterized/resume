import { useState } from "react";
import { DTP_GITHUB, DTP_PLAY, DTP_WEB, DTP_WEB_ALT, dtpEmbedUrl } from "../demo";

type Props = {
  title: string;
};

export function TabletFrame({ title }: Props) {
  const [src, setSrc] = useState(dtpEmbedUrl(DTP_WEB));
  const [blocked, setBlocked] = useState(false);

  return (
    <figure className="tablet-demo">
      <div className="tablet-shell" aria-label={`${title} tablet preview`}>
        <div className="tablet-bezel">
          <span className="tablet-camera" aria-hidden="true" />
          <div className="tablet-screen">
            {blocked ? (
              <div className="tablet-fallback">
                <p>The live demo did not load in this frame.</p>
                <p className="tablet-fallback-note">
                  Open the web demo in a new tab. API keys stay off this resume repo.
                </p>
              </div>
            ) : (
              <iframe
                className="tablet-frame"
                title={`${title} live demo`}
                src={src}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                referrerPolicy="strict-origin-when-cross-origin"
                onError={() => setBlocked(true)}
              />
            )}
          </div>
        </div>
      </div>
      <figcaption className="tablet-links">
        <a href={DTP_WEB} target="_blank" rel="noreferrer">
          Open web demo
        </a>
        <button
          type="button"
          className="tablet-host-swap"
          onClick={() =>
            setSrc(src.includes("freeParameterized") ? dtpEmbedUrl(DTP_WEB_ALT) : dtpEmbedUrl(DTP_WEB))
          }
        >
          {src.includes("freeParameterized") ? "Retry GitHub Pages" : "Open GitHub Pages"}
        </button>
        <a href={DTP_PLAY} target="_blank" rel="noreferrer">
          Play Store
        </a>
        <a href={DTP_GITHUB} target="_blank" rel="noreferrer">
          GitHub
        </a>
      </figcaption>
    </figure>
  );
}
