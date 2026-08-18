import { THEMES, type ThemeId } from "../theme";
import type { Settings } from "../settings";
import type { ModelCatalog } from "../types";

type Props = {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onChange: (next: Settings) => void;
  models: ModelCatalog | null;
  ollamaReachable: boolean;
};

export function SettingsPanel({ open, onClose, settings, onChange, models, ollamaReachable }: Props) {
  if (!open) return null;
  const localModels = (models?.installed || []).filter((m) => !m.cloud);

  return (
    <>
      <button type="button" className="drawer-backdrop" aria-label="Close settings" onClick={onClose} />
      <aside className="settings-panel glass fade-in" role="dialog" aria-labelledby="settings-title">
        <div className="drawer-head">
          <h2 id="settings-title">Settings</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <p className="ask-note">Slack-style appearance. All of these persist in this browser.</p>

        <h3>Theme</h3>
        <div className="swatch-grid" role="list">
          {THEMES.map((t) => (
            <button
              type="button"
              key={t.id}
              className={`swatch${settings.theme === t.id ? " is-active" : ""}`}
              onClick={() => onChange({ ...settings, theme: t.id as ThemeId })}
              title={t.label}
            >
              <span className="swatch-chip" style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.sceneBg})` }} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <h3>Voice</h3>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.tts}
            onChange={(e) => onChange({ ...settings, tts: e.target.checked })}
          />
          Speak replies (Windows male SAPI — not Peter’s voice)
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.stt}
            onChange={(e) => onChange({ ...settings, stt: e.target.checked })}
          />
          Enable microphone / Whisper STT
        </label>

        <h3>Local model</h3>
        {!ollamaReachable ? (
          <p className="honesty">Ollama is offline. Chat still answers from the curated corpus (extractive). This is not a live model.</p>
        ) : (
          <select
            value={settings.model || models?.selected || ""}
            onChange={(e) => onChange({ ...settings, model: e.target.value })}
          >
            {localModels.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name} · {m.parameterSize || "?"} · {m.sizeGB} GB
              </option>
            ))}
          </select>
        )}
        {models?.chain ? (
          <p className="job-meta">
            Fallback chain: {models.chain.map((c) => `${c.id}${c.present ? "" : " (missing)"}`).join(" → ")}
          </p>
        ) : null}

        <h3>Motion</h3>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(e) => onChange({ ...settings, reducedMotion: e.target.checked })}
          />
          Reduced motion
        </label>
      </aside>
    </>
  );
}
