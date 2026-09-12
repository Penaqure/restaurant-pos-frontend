// Module-level so axiosInstance's request interceptor (outside React) can
// read the currently active branch without needing a hook.
let activeBranchId: string | null = null;

export function setActiveBranchId(id: string | null) {
  activeBranchId = id;
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem("billing_active_branch", id);
  else window.localStorage.removeItem("billing_active_branch");
}

export function getActiveBranchId(): string | null {
  if (activeBranchId) return activeBranchId;
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("billing_active_branch");
}
