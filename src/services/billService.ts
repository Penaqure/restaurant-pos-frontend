import axiosInstance from "@/lib/axiosInstance";

export type TaxBreakdownEntry = { ratePercent: number; taxableAmount: number; taxAmount: number };

export type Bill = {
  id: string;
  billNumber: string;
  subtotal: string;
  discountAmount: string;
  taxBreakdown: TaxBreakdownEntry[];
  taxAmount: string;
  roundOffAmount: string;
  totalAmount: string;
  amountPaid: string;
  balanceDue: string;
  paymentStatus: "unpaid" | "partial" | "paid" | "refunded";
  status: "draft" | "finalized" | "void";
  generatedAt: string;
  discount: { id: string; code: string; type: string; value: string } | null;
  generator: { id: string; firstName: string; lastName: string };
  order: {
    id: string;
    orderNumber: string;
    orderType: string;
    table: { id: string; name: string } | null;
    items: {
      id: string;
      itemNameSnapshot: string;
      variantNameSnapshot: string | null;
      quantity: number;
      lineTotal: string;
      addons: { id: string; nameSnapshot: string; quantity: number }[];
    }[];
  };
};

export async function listBills() {
  const { data } = await axiosInstance.get<Bill[]>("/bills");
  return data;
}

export async function getBill(id: string) {
  const { data } = await axiosInstance.get<Bill>(`/bills/${id}`);
  return data;
}

export async function generateBillFromOrder(orderId: string, discountCode?: string) {
  const { data } = await axiosInstance.post<Bill>(`/bills/from-order/${orderId}`, {
    discountCode: discountCode || undefined,
  });
  return data;
}

export type BillPdfSize = "a4" | "a5" | "letter" | "thermal-80" | "thermal-72" | "thermal-58";

export const BILL_PDF_SIZES: { value: BillPdfSize; label: string }[] = [
  { value: "a4", label: "A4 (invoice)" },
  { value: "a5", label: "A5 (invoice)" },
  { value: "letter", label: "Letter (invoice)" },
  { value: "thermal-80", label: "80mm receipt" },
  { value: "thermal-72", label: "72mm receipt" },
  { value: "thermal-58", label: "58mm receipt" },
];

// The PDF route requires the Authorization header, so a plain <a href> won't
// work -- fetch it as a blob through axios (which attaches the token) and
// open that instead. Omitting `size` lets the backend fall back to the
// vendor's configured default bill size instead of forcing one here.
export async function openBillPdf(id: string, size?: BillPdfSize) {
  const { data } = await axiosInstance.get(`/bills/${id}/pdf`, { params: { size }, responseType: "blob" });
  const blobUrl = URL.createObjectURL(data as Blob);
  window.open(blobUrl, "_blank");
}
