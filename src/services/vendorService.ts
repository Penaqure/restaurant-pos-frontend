import axiosInstance from "@/lib/axiosInstance";

export type SubscriptionPlan = {
  id: string;
  name: string;
  priceMonthly: string;
  billingCycle: string;
  maxBranches: number;
  maxUsers: number;
  isActive: boolean;
};

export type Vendor = {
  id: string;
  name: string;
  slug: string;
  contactEmail: string;
  contactPhone: string | null;
  gstin: string | null;
  planId: string | null;
  planStatus: "trial" | "active" | "suspended";
  logoUrl: string | null;
  brandColor: string;
  currency: string;
  country: string;
  timezone: string;
  invoicePrefix: string;
  defaultTaxRatePercent: string;
  isActive: boolean;
  branches: { id: string; name: string }[];
  plan: SubscriptionPlan | null;
  userCount?: number;
};

export const CURRENCY_OPTIONS = [
  { code: "INR", label: "INR — Indian Rupee (₹)" },
  { code: "USD", label: "USD — US Dollar ($)" },
  { code: "EUR", label: "EUR — Euro (€)" },
  { code: "GBP", label: "GBP — British Pound (£)" },
  { code: "AED", label: "AED — UAE Dirham" },
  { code: "SGD", label: "SGD — Singapore Dollar" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
];

// Drives how tax is presented on bills -- India shows GST split into
// CGST/SGST; everywhere else gets a plain tax line.
export const COUNTRY_OPTIONS = [
  { code: "IN", label: "India" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "SG", label: "Singapore" },
  { code: "AU", label: "Australia" },
  { code: "CA", label: "Canada" },
  { code: "OTHER", label: "Other" },
];

export const TIMEZONE_OPTIONS = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Kuala_Lumpur",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
];

export async function listVendors() {
  const { data } = await axiosInstance.get<Vendor[]>("/platform/vendors");
  return data;
}

export async function getVendor(id: string) {
  const { data } = await axiosInstance.get<Vendor>(`/platform/vendors/${id}`);
  return data;
}

export type UpdateVendorPayload = Partial<{
  name: string;
  contactEmail: string;
  contactPhone: string;
  gstin: string;
  planId: string | null;
  planStatus: "trial" | "active" | "suspended";
  brandColor: string;
  isActive: boolean;
  currency: string;
  country: string;
  timezone: string;
  invoicePrefix: string;
  defaultTaxRatePercent: number;
}>;

export async function updateVendor(id: string, payload: UpdateVendorPayload) {
  const { data } = await axiosInstance.patch<Vendor>(`/platform/vendors/${id}`, payload);
  return data;
}

export async function deleteVendor(id: string) {
  await axiosInstance.delete(`/platform/vendors/${id}`);
}

export async function uploadVendorLogo(id: string, file: File) {
  const form = new FormData();
  form.append("logo", file);
  const { data } = await axiosInstance.post<{ logoUrl: string }>(`/platform/vendors/${id}/logo`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export type CreateVendorPayload = {
  vendorName: string;
  contactEmail: string;
  contactPhone?: string;
  gstin?: string;
  branchName?: string;
  currency?: string;
  country?: string;
  timezone?: string;
  invoicePrefix?: string;
  defaultTaxRatePercent?: number;
  ownerFirstName: string;
  ownerLastName?: string;
  ownerEmail: string;
  ownerPassword: string;
};

export async function createVendor(payload: CreateVendorPayload) {
  const { data } = await axiosInstance.post("/platform/vendors", payload);
  return data;
}

// -- Subscription plans --

export async function listPlans() {
  const { data } = await axiosInstance.get<SubscriptionPlan[]>("/platform/plans");
  return data;
}

export type PlanPayload = {
  name: string;
  priceMonthly: number;
  billingCycle?: string;
  maxBranches: number;
  maxUsers: number;
  isActive?: boolean;
};

export async function createPlan(payload: PlanPayload) {
  const { data } = await axiosInstance.post<SubscriptionPlan>("/platform/plans", payload);
  return data;
}

export async function updatePlan(id: string, payload: Partial<PlanPayload>) {
  const { data } = await axiosInstance.patch<SubscriptionPlan>(`/platform/plans/${id}`, payload);
  return data;
}

export async function deletePlan(id: string) {
  const { data } = await axiosInstance.delete<{ vendorsAffected: number }>(`/platform/plans/${id}`);
  return data;
}
