import axiosInstance from "@/lib/axiosInstance";

export type CurrentUser = {
  id: string;
  vendorId: string | null;
  branchId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  vendor: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    brandColor: string;
    defaultBillSize: string;
    planLimits: { maxUsers: number; maxBranches: number } | null;
    branchCount: number;
    userCount: number;
  } | null;
  branch: { id: string; name: string } | null;
};

type LoginResponse = {
  user: Pick<CurrentUser, "id" | "vendorId" | "branchId" | "firstName" | "lastName" | "email" | "role">;
};

// The token itself is never in this response -- login sets it as an
// httpOnly cookie server-side (see authController.js), so it's never
// reachable from page JS.
export async function login(email: string, password: string) {
  const { data } = await axiosInstance.post<LoginResponse>("/auth/login", { email, password });
  return data;
}

export async function logout() {
  await axiosInstance.post("/auth/logout");
}

export async function fetchMe() {
  const { data } = await axiosInstance.get<CurrentUser>("/auth/me");
  return data;
}
