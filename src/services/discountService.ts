import axiosInstance from "@/lib/axiosInstance";

export type Discount = {
  id: string;
  code: string;
  type: "percentage" | "flat";
  value: string;
  minOrderAmount: string;
  isActive: boolean;
  usageCount: number;
  usageLimit: number | null;
};

export async function listDiscounts() {
  const { data } = await axiosInstance.get<Discount[]>("/discounts");
  return data;
}

export async function createDiscount(payload: {
  code: string;
  type: "percentage" | "flat";
  value: number;
  minOrderAmount?: number;
}) {
  const { data } = await axiosInstance.post<Discount>("/discounts", payload);
  return data;
}

export async function updateDiscount(
  id: string,
  payload: Partial<{ value: number; minOrderAmount: number; usageLimit: number | null; isActive: boolean }>
) {
  const { data } = await axiosInstance.patch<Discount>(`/discounts/${id}`, payload);
  return data;
}

export async function deleteDiscount(id: string) {
  await axiosInstance.delete(`/discounts/${id}`);
}
