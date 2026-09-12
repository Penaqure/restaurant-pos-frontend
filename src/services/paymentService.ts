import axiosInstance from "@/lib/axiosInstance";
import { Bill } from "./billService";

export type PaymentMethod = "cash" | "card" | "upi" | "wallet" | "other";

export type Payment = {
  id: string;
  method: PaymentMethod;
  amount: string;
  referenceNumber: string | null;
  status: "recorded" | "void";
  paidAt: string;
  notes: string | null;
  recorder: { id: string; firstName: string; lastName: string };
};

export async function listPayments(billId: string) {
  const { data } = await axiosInstance.get<Payment[]>("/payments", { params: { billId } });
  return data;
}

export async function recordPayment(payload: {
  billId: string;
  method: PaymentMethod;
  amount: number;
  referenceNumber?: string;
  notes?: string;
}) {
  const { data } = await axiosInstance.post<{ payment: Payment; bill: Bill }>("/payments", payload);
  return data;
}

export async function voidPayment(id: string) {
  const { data } = await axiosInstance.delete<{ payment: Payment; bill: Bill }>(`/payments/${id}`);
  return data;
}
