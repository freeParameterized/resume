import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@corpus": path.join(root, "data/corpus.json"),
      "@papers": path.join(root, "data/papers.json"),
      "@resume": path.join(root, "data/resume.json"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    // Fail loudly instead of drifting to 5174 when 5173 is taken, so the URL is always the same.
    strictPort: true,
    // Cloudflare quick tunnels hand out a random *.trycloudflare.com host; without this
    // Vite answers "Blocked request" and the public demo URL shows a blank page.
    allowedHosts: [".trycloudflare.com"],
    // The dev server can read anything under `allow`, and it is what the public tunnel
    // hits, so keep source, env, git and scratch data out of reach.
    fs: {
      allow: [root],
      deny: [
        "**/.env",
        "**/.env.*",
        "**/.git/**",
        "**/node_modules/.cache/**",
        "**/*.{pem,crt,key,pfx}",
        "**/scripts/**",
      ],
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
    allowedHosts: [".trycloudflare.com"],
    // Preview serves only the built dist/, which is the safer thing to expose publicly.
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
});
