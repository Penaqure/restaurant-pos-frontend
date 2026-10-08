// Mirrors restaurant-billing-backend/utils/currency.js -- kept in sync by
// hand since the two apps don't share a package. Falls back to the code
// itself (e.g. "AUD 10.00") for anything not explicitly mapped.
const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  GBP: "£",
  EUR: "€",
  AUD: "A$",
  CAD: "C$",
  SGD: "S$",
  AED: "د.إ",
  SAR: "﷼",
  NPR: "₨",
  LKR: "₨",
  BDT: "৳",
  PKR: "₨",
  JPY: "¥",
  CNY: "¥",
  ZAR: "R",
  MYR: "RM",
  THB: "฿",
  IDR: "Rp",
  PHP: "₱",
  NZD: "NZ$",
  CHF: "CHF ",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
};

export function getCurrencySymbol(currencyCode?: string | null): string {
  const code = (currencyCode || "INR").toUpperCase();
  return CURRENCY_SYMBOLS[code] || `${code} `;
}

export function formatCurrency(amount: number | string, currencyCode?: string | null): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return `${getCurrencySymbol(currencyCode)}${n.toFixed(2)}`;
}
