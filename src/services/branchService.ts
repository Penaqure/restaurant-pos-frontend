import axiosInstance from "@/lib/axiosInstance";

export type Branch = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  gstin: string | null;
  isActive: boolean;
};

export async function listBranches() {
  const { data } = await axiosInstance.get<Branch[]>("/branches");
  return data;
}

export type BranchPayload = {
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  gstin?: string;
};

export async function createBranch(payload: BranchPayload) {
  const { data } = await axiosInstance.post<Branch>("/branches", payload);
  return data;
}

export async function updateBranch(id: string, payload: Partial<BranchPayload & { isActive: boolean }>) {
  const { data } = await axiosInstance.patch<Branch>(`/branches/${id}`, payload);
  return data;
}

export async function deleteBranch(id: string) {
  await axiosInstance.delete(`/branches/${id}`);
}
