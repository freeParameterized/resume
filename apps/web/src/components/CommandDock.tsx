import { useEffect, useRef, useState, type FormEvent } from "react";

const COMMANDS = ["work", "projects", "skills", "education", "contact", "resume", "help", "clear"] as const;

type LogLine = { kind: "in" | "out"; text: string };

type Props = {
  onJump: (id: string) => void;
  onPrint: () => void;
};

export function CommandDock({ onJump, onPrint }: Props) {
  const [entry, setEntry] = useState("");
  const [log, setLog] = useState<LogLine[]>([{ kind: "out", text: "Type a section name, or help." }]);
  const inputRef = useRef<HTMLInputElement>(null);

  const run = (raw: string) => {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;
    const push = (text: string) => setLog((l) => [...l, { kind: "in", text: raw }, { kind: "out", text }]);
    if (cmd === "help" || cmd === "?") {
      push("Commands: " + COMMANDS.join(", "));
    } else if (cmd === "clear") {
      setLog([{ kind: "out", text: "Type a section name, or help." }]);
    } else if (cmd === "resume") {
      push("Opening the printable resume.");
      onPrint();
    } else if (cmd === "work") {
      push("Jumping to work.");
      onJump("work");
    } else if (["projects", "skills", "education", "contact"].includes(cmd)) {
      push("Jumping to " + cmd + ".");
      onJump(cmd);
    } else {
      push("Unknown command: " + cmd + ". Try help.");
    }
    setEntry("");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="cmd-dock">
      <nav className="cmd-tabs" aria-label="Resume sections">
        {["work", "projects", "skills", "education", "contact"].map((s) => (
          <button key={s} type="button" onClick={() => run(s)}>
            {s}
          </button>
        ))}
      </nav>
      <div className="cmd-log" aria-live="polite">
        {log.slice(-6).map((l, i) => (
          <p key={`${i}-${l.text}`} className={l.kind === "in" ? "cmd-in" : "cmd-out"}>
            {l.kind === "in" ? "> " : ""}
            {l.text}
          </p>
        ))}
      </div>
      <form
        className="cmd-form"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          run(entry);
        }}
      >
        <label className="cmd-prompt" htmlFor="resume-cmd">
          &gt;
        </label>
        <input
          id="resume-cmd"
          ref={inputRef}
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          aria-label="Command input"
          placeholder="work"
          spellCheck={false}
          autoComplete="off"
        />
      </form>
      <p className="cmd-hint">Press / to focus the command line. Type resume for a printable copy.</p>
    </div>
  );
}
