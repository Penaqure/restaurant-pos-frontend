import axios from "axios";
import { clearAuth } from "./authStorage";
import { getActiveBranchId } from "./branchStorage";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  // The auth token rides an httpOnly cookie rather than an Authorization
  // header now, so the browser must be told to send cookies on these
  // cross-origin (frontend:3000 -> backend:5000) requests.
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const branchId = getActiveBranchId();
  if (branchId) {
    config.headers["X-Branch-Id"] = branchId;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 while sitting elsewhere in the app means the session was
    // invalid/expired -- e.g. a vendor got disabled mid-session -- so a hard
    // redirect + notice is appropriate. But on the login page itself, a 401
    // is routine, not an error: AuthContext's mount-time /auth/me probe
    // always 401s for a logged-out visitor (the auth cookie is httpOnly, so
    // there's no way to check client-side before asking), and a failed
    // login POST is also a 401. Redirecting to /login while already on
    // /login would force a full reload -- which reruns that same mount
    // probe, 401s again, reloads again, forever, hammering the API into the
    // rate limiter within seconds. Checking the current page (not the
    // request URL) catches both cases with one guard.
    const onLoginPage = typeof window !== "undefined" && window.location.pathname === "/login";
    if (error.response?.status === 401 && !onLoginPage) {
      clearAuth();
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(
            "billing_login_notice",
            error.response?.data?.message || "You've been signed out."
          );
        } catch {
          // sessionStorage can throw in private/blocked-storage contexts -- the
          // redirect below still works, the user just won't see the reason.
        }
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
