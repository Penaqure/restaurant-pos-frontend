import axiosInstance from "@/lib/axiosInstance";
import type { BillPdfSize } from "@/services/billService";

export type BillingSettings = {
  defaultBillSize: BillPdfSize;
  billShowGst: boolean;
  billShowLogo: boolean;
  billFooterNote: string | null;
};

export async function getBillingSettings() {
  const { data } = await axiosInstance.get<BillingSettings>("/vendor-settings/billing");
  return data;
}

export async function updateBillingSettings(updates: Partial<BillingSettings>) {
  const { data } = await axiosInstance.patch<BillingSettings>("/vendor-settings/billing", updates);
  return data;
}
