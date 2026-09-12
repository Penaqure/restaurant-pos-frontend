import axiosInstance from "@/lib/axiosInstance";

export type MenuCategory = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type TaxRate = {
  id: string;
  name: string;
  ratePercent: string;
  isDefault: boolean;
  isActive: boolean;
};

export type ItemVariant = { id: string; name: string; price: string; isDefault: boolean };
export type ItemAddon = { id: string; name: string; price: string; isActive: boolean };

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  basePrice: string;
  imageUrl: string | null;
  isVeg: boolean;
  isAvailable: boolean;
  taxRateId: string | null;
  category: { id: string; name: string };
  taxRate: { id: string; name: string; ratePercent: string } | null;
  variants: ItemVariant[];
  addons: ItemAddon[];
};

// -- Categories --
export async function listCategories() {
  const { data } = await axiosInstance.get<MenuCategory[]>("/menu/categories");
  return data;
}
export async function createCategory(payload: { name: string; description?: string; sortOrder?: number }) {
  const { data } = await axiosInstance.post<MenuCategory>("/menu/categories", payload);
  return data;
}
export async function updateCategory(id: string, payload: { name?: string; description?: string; sortOrder?: number }) {
  const { data } = await axiosInstance.patch<MenuCategory>(`/menu/categories/${id}`, payload);
  return data;
}
export async function deleteCategory(id: string) {
  await axiosInstance.delete(`/menu/categories/${id}`);
}

// -- Tax rates --
export async function listTaxRates() {
  const { data } = await axiosInstance.get<TaxRate[]>("/menu/tax-rates");
  return data;
}
export async function createTaxRate(payload: { name: string; ratePercent: number; isDefault?: boolean }) {
  const { data } = await axiosInstance.post<TaxRate>("/menu/tax-rates", payload);
  return data;
}

// -- Items --
export type CreateItemPayload = {
  categoryId: string;
  name: string;
  description?: string;
  basePrice: number;
  isVeg?: boolean;
  taxRateId?: string;
  variants?: { name: string; price: number; isDefault?: boolean }[];
  addons?: { name: string; price: number }[];
};

export async function listItems(categoryId?: string) {
  const { data } = await axiosInstance.get<MenuItem[]>("/menu/items", { params: { categoryId } });
  return data;
}
export async function getItem(id: string) {
  const { data } = await axiosInstance.get<MenuItem>(`/menu/items/${id}`);
  return data;
}
export async function createItem(payload: CreateItemPayload) {
  const { data } = await axiosInstance.post<MenuItem>("/menu/items", payload);
  return data;
}
export async function updateItem(id: string, payload: Partial<CreateItemPayload> & { isAvailable?: boolean }) {
  const { data } = await axiosInstance.patch<MenuItem>(`/menu/items/${id}`, payload);
  return data;
}
export async function deleteItem(id: string) {
  await axiosInstance.delete(`/menu/items/${id}`);
}
export async function uploadItemImage(id: string, file: File) {
  const form = new FormData();
  form.append("image", file);
  const { data } = await axiosInstance.post<{ imageUrl: string }>(`/menu/items/${id}/image`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function addVariant(itemId: string, payload: { name: string; price: number; isDefault?: boolean }) {
  const { data } = await axiosInstance.post<ItemVariant>(`/menu/items/${itemId}/variants`, payload);
  return data;
}
export async function updateVariant(
  itemId: string,
  variantId: string,
  payload: { name?: string; price?: number; isDefault?: boolean }
) {
  const { data } = await axiosInstance.patch<ItemVariant>(`/menu/items/${itemId}/variants/${variantId}`, payload);
  return data;
}
export async function deleteVariant(itemId: string, variantId: string) {
  await axiosInstance.delete(`/menu/items/${itemId}/variants/${variantId}`);
}

export async function addAddon(itemId: string, payload: { name: string; price: number }) {
  const { data } = await axiosInstance.post<ItemAddon>(`/menu/items/${itemId}/addons`, payload);
  return data;
}
export async function updateAddon(itemId: string, addonId: string, payload: { name?: string; price?: number }) {
  const { data } = await axiosInstance.patch<ItemAddon>(`/menu/items/${itemId}/addons/${addonId}`, payload);
  return data;
}
export async function deleteAddon(itemId: string, addonId: string) {
  await axiosInstance.delete(`/menu/items/${itemId}/addons/${addonId}`);
}
