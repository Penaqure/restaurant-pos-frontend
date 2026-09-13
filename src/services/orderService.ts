import axiosInstance from "@/lib/axiosInstance";

export type OrderStatus = "placed" | "preparing" | "ready" | "served" | "completed" | "cancelled";
export type OrderType = "dine_in" | "takeaway" | "delivery";

export type OrderItemAddon = { id: string; nameSnapshot: string; priceSnapshot: string; quantity: number };
export type OrderItem = {
  id: string;
  itemNameSnapshot: string;
  variantNameSnapshot: string | null;
  unitPriceSnapshot: string;
  quantity: number;
  lineTotal: string;
  notes: string | null;
  addons: OrderItemAddon[];
};

export type Order = {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  status: OrderStatus;
  source: "staff" | "customer_qr";
  customerName: string | null;
  customerPhone: string | null;
  table: { id: string; name: string; location: string | null; status: string } | null;
  creator: { id: string; firstName: string; lastName: string } | null;
  server: { id: string; firstName: string; lastName: string } | null;
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  totalAmount: string;
  placedAt: string;
  completedAt: string | null;
  items: OrderItem[];
};

export type OrderLineInput = {
  menuItemId: string;
  variantId?: string;
  quantity: number;
  notes?: string;
  addons?: { addonId: string; quantity?: number }[];
};

export type CreateOrderPayload = {
  orderType: OrderType;
  tableId?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  items: OrderLineInput[];
};

export async function listOrders(status?: OrderStatus) {
  const { data } = await axiosInstance.get<Order[]>("/orders", { params: { status } });
  return data;
}

export async function getOrder(id: string) {
  const { data } = await axiosInstance.get<Order>(`/orders/${id}`);
  return data;
}

export async function createOrder(payload: CreateOrderPayload) {
  const { data } = await axiosInstance.post<Order>("/orders", payload);
  return data;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const { data } = await axiosInstance.patch<Order>(`/orders/${id}/status`, { status });
  return data;
}

export async function transferOrderTable(id: string, tableId: string) {
  const { data } = await axiosInstance.patch<Order>(`/orders/${id}/table`, { tableId });
  return data;
}

export async function addOrderItems(id: string, items: OrderLineInput[]) {
  const { data } = await axiosInstance.post<Order>(`/orders/${id}/items`, { items });
  return data;
}
