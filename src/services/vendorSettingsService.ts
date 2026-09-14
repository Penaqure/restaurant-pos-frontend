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

export type BrandingSettings = {
  name: string;
  brandColor: string;
  logoUrl: string | null;
};

export async function getBrandingSettings() {
  const { data } = await axiosInstance.get<BrandingSettings>("/vendor-settings/branding");
  return data;
}

export async function updateBrandingSettings(updates: Partial<Pick<BrandingSettings, "name" | "brandColor">>) {
  const { data } = await axiosInstance.patch<BrandingSettings>("/vendor-settings/branding", updates);
  return data;
}

export async function uploadBrandingLogo(file: File) {
  const form = new FormData();
  form.append("logo", file);
  const { data } = await axiosInstance.post<{ logoUrl: string }>("/vendor-settings/branding/logo", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
