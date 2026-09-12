// Token lives in a plain (non-httpOnly) cookie -- set from the client after
// login -- so both the browser (axios) and the server-side proxy (route
// protection) can read it. Swap for an httpOnly cookie issued by the backend
// once the login endpoint sets it directly.
const COOKIE_NAME = "billing_token";

export function setToken(token: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${60 * 60 * 24}; samesite=lax`;
}

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function clearAuth() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}
