import axiosInstance from "@/lib/axiosInstance";

export type Role = {
  id: string;
  name: string;
  permissions: string[];
};

export async function listRoles() {
  const { data } = await axiosInstance.get<Role[]>("/roles");
  return data;
}
