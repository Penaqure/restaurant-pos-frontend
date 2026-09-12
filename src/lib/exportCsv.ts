import type { Analytics } from "@/services/reportService";

function escapeCell(value: string | number) {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function section(title: string, header: string[], rows: (string | number)[][]) {
  const lines = [title, header.join(","), ...rows.map((r) => r.map(escapeCell).join(","))];
  return lines.join("\n");
}

// One CSV per report run rather than one per section -- an owner comparing
// two date ranges wants a single file they can drop into a spreadsheet, not
// a folder of small ones.
export function buildAnalyticsCsv(analytics: Analytics): string {
  const { overview, dailySales, paymentMethods, orderTypes, topItems, categorySales, discounts, branchSales, staffPerformance } =
    analytics;

  const parts = [
    section(
      "Overview",
      ["Metric", "Value"],
      [
        ["Total sales", overview.sales.toFixed(2)],
        ["Bills generated", overview.orders],
        ["Average order value", overview.avgOrderValue.toFixed(2)],
        ["Tax collected", overview.taxCollected.toFixed(2)],
        ["Discount given", overview.discountGiven.toFixed(2)],
        ["Cancelled orders", overview.cancelledOrders],
        ["Total orders placed", overview.totalOrdersPlaced],
      ]
    ),
    section(
      "Daily sales",
      ["Date", "Sales", "Orders"],
      dailySales.map((d) => [d.date, d.sales.toFixed(2), d.orders])
    ),
    section(
      "Payments by method",
      ["Method", "Amount"],
      paymentMethods.map((m) => [m.method, m.amount.toFixed(2)])
    ),
    section(
      "Sales by order type",
      ["Type", "Orders", "Sales"],
      orderTypes.map((t) => [t.type, t.orders, t.sales.toFixed(2)])
    ),
    section(
      "Top-selling items",
      ["Item", "Qty sold", "Revenue"],
      topItems.map((i) => [i.name, i.quantity, i.revenue.toFixed(2)])
    ),
    section(
      "Sales by category",
      ["Category", "Qty sold", "Revenue"],
      categorySales.map((c) => [c.name, c.quantity, c.revenue.toFixed(2)])
    ),
    section(
      "Discount usage",
      ["Code", "Times used", "Total discount"],
      discounts.map((d) => [d.code, d.timesUsed, d.totalDiscount.toFixed(2)])
    ),
    section(
      "Sales by branch",
      ["Branch", "Orders", "Sales"],
      branchSales.map((b) => [b.branchName, b.orders, b.sales.toFixed(2)])
    ),
    section(
      "Staff performance",
      ["Staff", "Orders", "Sales"],
      staffPerformance.map((s) => [s.name, s.orders, s.sales.toFixed(2)])
    ),
  ];

  return parts.join("\n\n");
}

export function downloadCsv(filename: string, content: string) {
  // A UTF-8 BOM makes Excel (not just Sheets) detect the encoding correctly
  // instead of mangling the ₹ symbol and other non-ASCII characters.
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
