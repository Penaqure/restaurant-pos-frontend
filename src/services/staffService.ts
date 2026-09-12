import axiosInstance from "@/lib/axiosInstance";

export type StaffMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: "active" | "inactive";
  roleId: string;
  branchId: string | null;
  role: { id: string; name: string };
  branch: { id: string; name: string } | null;
};

export async function listStaff() {
  const { data } = await axiosInstance.get<StaffMember[]>("/staff");
  return data;
}

export type CreateStaffPayload = {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  roleId: string;
  branchId?: string;
  password: string;
};

export async function createStaff(payload: CreateStaffPayload) {
  const { data } = await axiosInstance.post<StaffMember>("/staff", payload);
  return data;
}

export type UpdateStaffPayload = Partial<{
  firstName: string;
  lastName: string;
  phone: string;
  roleId: string;
  branchId: string | null;
  status: "active" | "inactive";
  password: string;
}>;

export async function updateStaff(id: string, payload: UpdateStaffPayload) {
  const { data } = await axiosInstance.patch<StaffMember>(`/staff/${id}`, payload);
  return data;
}
