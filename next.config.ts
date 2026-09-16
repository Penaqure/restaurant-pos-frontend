import type { NextConfig } from "next";

// The backend API (and its socket.io realtime connection) lives on a
// different port than this app -- same LAN host, per docker-compose.yml --
// so the CSP has to explicitly allow that origin for fetch/XHR/WebSocket.
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
const apiOrigin = new URL(apiBaseUrl).origin;
const apiWsOrigin = apiOrigin.replace(/^http/, "ws");

const isDev = process.env.NODE_ENV !== "production";

// Next's App Router streams server-component payloads to the client via
// inline `<script>` tags it generates itself (framework internals, not this
// app's code), so 'unsafe-inline' is required for script-src unless every
// page opts into per-request nonces + fully dynamic rendering -- overkill
// for this app. This follows Next's own documented "without nonces" CSP
// baseline (see node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md),
// scoped to this app's actual origins. `unsafe-eval` is dev-only, required
// by React's dev-mode error-stack reconstruction, per the same doc.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${apiOrigin}`,
  `connect-src 'self' ${apiOrigin} ${apiWsOrigin}${isDev ? " ws://localhost:*" : ""}`,
  "font-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // NOT upgrade-insecure-requests: this app is deliberately served over
  // plain HTTP on the shop's LAN (see docker-compose.yml/COOKIE_SECURE) --
  // that directive would make the browser try to upgrade the API/socket.io
  // requests above to https:// and fail, since nothing here terminates TLS.
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Bundles only the files the server actually needs into .next/standalone,
  // so the production Docker image doesn't have to ship full node_modules.
  output: "standalone",
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
