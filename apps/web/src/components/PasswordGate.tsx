import { useState, useCallback, useEffect } from "react";

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("site_unlocked") === "true") {
      setUnlocked(true);
    }
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (password === "$openses5SSHwX") {
      sessionStorage.setItem("site_unlocked", "true");
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  }, [password]);

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100svh",
      background: "var(--bg)",
      color: "var(--ink)",
      fontFamily: "var(--mono)",
    }}>
      <form onSubmit={handleSubmit} style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        width: "100%",
        maxWidth: "320px",
        padding: "32px",
        border: "1px solid var(--line)",
        background: "var(--panel)",
      }}>
        <h1 style={{
          margin: "0 0 8px",
          fontSize: "1rem",
          fontWeight: "normal",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--brass)",
        }}>
          Restricted Access
        </h1>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label htmlFor="password" style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
            Enter Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: "10px",
              background: "var(--bg)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
              fontFamily: "var(--mono)",
              fontSize: "0.9rem",
              outline: "none",
            }}
            autoFocus
          />
        </div>
        {error && (
          <div style={{ color: "var(--warn)", fontSize: "0.75rem" }}>
            Access denied.
          </div>
        )}
        <button type="submit" style={{
          padding: "10px",
          background: "var(--ink)",
          color: "var(--bg)",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--mono)",
          fontSize: "0.8rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginTop: "8px",
        }}>
          Unlock
        </button>
      </form>
    </div>
  );
}
