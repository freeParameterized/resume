/** Single config point for the API origin. Empty = same-origin / Vite proxy. */
export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || "";
