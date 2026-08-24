/** Public Digital Twin Pro URLs. No Firebase config or API keys in this repo. */

export const DTP_WEB = "https://freeParameterized.github.io/digital-twin-pro/";
export const DTP_WEB_ALT = "https://freeparameterized.github.io/digital-twin-pro/";
export const DTP_GITHUB = "https://github.com/freeParameterized/digital-twin-pro";
export const DTP_PLAY =
  "https://play.google.com/store/apps/details?id=com.production.free_inventory_management_system&hl=en_US";

export function dtpEmbedUrl(base: string) {
  return `${base}${base.includes("?") ? "&" : "?"}embed=1`;
}
