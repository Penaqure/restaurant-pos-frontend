// The auth token itself lives in an httpOnly cookie set by the backend on
// login (see restaurant-billing-backend/controllers/auth/authController.js)
// -- deliberately unreadable from here, which is what keeps an XSS bug from
// being able to exfiltrate it. This module only clears local UI state;
// actually ending the session happens server-side via authService.logout().
export function clearAuth() {
  // Nothing to do client-side: no token or user data is cached in
  // localStorage/cookies outside the httpOnly cookie itself.
}
