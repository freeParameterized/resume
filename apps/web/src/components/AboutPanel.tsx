import type { AboutMe } from "../types";

type Props = {
  about: AboutMe | null;
  open: boolean;
  onClose: () => void;
};

export function AboutPanel({ about, open, onClose }: Props) {
  if (!open || !about) return null;
  return (
    <aside className="about-panel glass fade-in" role="dialog" aria-labelledby="about-title">
      <div className="drawer-head">
        <div>
          <div className="status">About Me</div>
          <h2 id="about-title">{about.headline}</h2>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close About Me">
          ×
        </button>
      </div>
      <p>{about.body}</p>
    </aside>
  );
}
