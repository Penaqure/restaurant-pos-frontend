import axios from "axios";
import { getToken, clearAuth } from "./authStorage";
import { getActiveBranchId } from "./branchStorage";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const branchId = getActiveBranchId();
  if (branchId) {
    config.headers["X-Branch-Id"] = branchId;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only an already-authenticated request (one that carried a token) going
    // 401 means the session itself was invalidated -- e.g. a vendor got
    // disabled mid-session. A fresh, tokenless login attempt with bad
    // credentials is also a 401, but must NOT trigger this: redirecting to
    // /login while already on /login would reload the page and wipe the
    // inline error the login form just set.
    const hadToken = Boolean(error.config?.headers?.Authorization);
    if (error.response?.status === 401 && hadToken) {
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
