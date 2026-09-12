import axios from "axios";
import type { MenuCategory, MenuItem } from "@/services/menuService";

// A separate, bare axios client (no auth/branch header interceptors, no
// 401-redirect handling) -- these endpoints are called from an anonymous
// customer's phone after scanning a table's QR code and must never depend
// on, or leak, a staff session that happens to exist in the same browser.
const publicClient = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_BASE_URL });

export type PublicMenu = {
  vendor: { name: string; logoUrl: string | null; brandColor: string };
  branch: { id: string; name: string };
  table: { id: string; name: string; status: string };
  categories: MenuCategory[];
  items: MenuItem[];
};

export async function getPublicMenu(tableId: string) {
  const { data } = await publicClient.get<PublicMenu>(`/public/menu/${tableId}`);
  return data;
}

export type PublicOrderPayload = {
  tableId: string;
  customerName?: string;
  items: {
    menuItemId: string;
    variantId?: string;
    quantity: number;
    notes?: string;
    addons?: { addonId: string; quantity?: number }[];
  }[];
};

export type PublicOrderResult = { orderNumber: string; totalAmount: string; tableName: string };

export async function placePublicOrder(payload: PublicOrderPayload) {
  const { data } = await publicClient.post<PublicOrderResult>("/public/orders", payload);
  return data;
}
