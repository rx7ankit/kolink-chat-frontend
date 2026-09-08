/** Public app origin — OAuth callbacks and legal pages live here. */
export const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://chat.getkolink.com"
).replace(/\/$/, "");

/** Single backend API base for every environment. */
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.chat.getkolink.com/api/v1"
).replace(/\/$/, "");

export function oauthCallbackUrl(provider: string) {
  return `${APP_URL}/api/oauth/${provider}/callback`;
}

export function webhookUrl(provider: string) {
  return `${API_URL}/webhooks/${provider}`;
}
