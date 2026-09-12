import axiosInstance from "@/lib/axiosInstance";

export type RestaurantTable = {
  id: string;
  name: string;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "cleaning";
  branch: { id: string; name: string };
};

export async function listTables() {
  const { data } = await axiosInstance.get<RestaurantTable[]>("/tables");
  return data;
}

export async function createTable(payload: { name: string; capacity?: number }) {
  const { data } = await axiosInstance.post<RestaurantTable>("/tables", payload);
  return data;
}

export async function updateTableStatus(id: string, status: RestaurantTable["status"]) {
  const { data } = await axiosInstance.patch<RestaurantTable>(`/tables/${id}`, { status });
  return data;
}

export async function updateTable(id: string, payload: { name?: string; capacity?: number }) {
  const { data } = await axiosInstance.patch<RestaurantTable>(`/tables/${id}`, payload);
  return data;
}

export async function deleteTable(id: string) {
  await axiosInstance.delete(`/tables/${id}`);
}
