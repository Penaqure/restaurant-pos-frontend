"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, Receipt } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import VendorNav from "@/components/layout/VendorNav";
import { listBills, Bill } from "@/services/billService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";

const PAYMENT_STYLES: Record<Bill["paymentStatus"], string> = {
  unpaid: "bg-red-50 text-red-700",
  partial: "bg-amber-50 text-amber-700",
  paid: "bg-green-50 text-green-700",
  refunded: "bg-black/5 text-muted-foreground",
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "total-desc", label: "Total: high to low" },
  { value: "total-asc", label: "Total: low to high" },
] as const;
type SortOption = (typeof SORT_OPTIONS)[number]["value"];

const PAGE_SIZE = 10;

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Bill["paymentStatus"] | "all">("all");
  const [sort, setSort] = useState<SortOption>("newest");

  useEffect(() => {
    listBills()
      .then(setBills)
      .finally(() => setLoading(false));
  }, []);

  function updateAndResetPage<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  const filteredBills = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = bills.filter((b) => {
      if (statusFilter !== "all" && b.paymentStatus !== statusFilter) return false;
      if (
        query &&
        !b.billNumber.toLowerCase().includes(query) &&
        !b.order.orderNumber.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });

    result.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime();
        case "total-desc":
          return Number(b.totalAmount) - Number(a.totalAmount);
        case "total-asc":
          return Number(a.totalAmount) - Number(b.totalAmount);
        default:
          return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
      }
    });
    return result;
  }, [bills, search, statusFilter, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredBills.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visibleBills = filteredBills.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <AppShell title="Bills" nav={<VendorNav />}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="size-4 text-muted-foreground" />
            Bills
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 border-b border-border sm:flex-row sm:flex-wrap sm:items-center">
          <SearchInput
            value={search}
            onChange={(e) => updateAndResetPage(setSearch, e.target.value)}
            placeholder="Search bill # or order #..."
            className="sm:max-w-xs sm:flex-1"
          />
          <Select
            value={statusFilter}
            onChange={(e) => updateAndResetPage(setStatusFilter, e.target.value as Bill["paymentStatus"] | "all")}
            className="sm:w-auto"
          >
            <option value="all">All payment statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value as SortOption)} className="sm:w-auto">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </CardContent>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading...
            </div>
          ) : bills.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No bills yet.</p>
          ) : filteredBills.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No bills match your search/filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Bill</th>
                    <th className="px-5 py-3 font-medium">Order</th>
                    <th className="px-5 py-3 font-medium">Total</th>
                    <th className="px-5 py-3 font-medium">Payment</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {visibleBills.map((b) => (
                    <tr key={b.id} className="border-t border-border">
                      <td className="px-5 py-3">
                        <Link href={`/dashboard/bills/${b.id}`} className="font-medium text-brand-700 hover:underline">
                          {b.billNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{b.order.orderNumber}</td>
                      <td className="px-5 py-3 font-mono text-muted-foreground">₹{b.totalAmount}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${PAYMENT_STYLES[b.paymentStatus]}`}
                        >
                          {b.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/dashboard/bills/${b.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="size-3.5" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        <Pagination page={safePage} pageCount={pageCount} onPageChange={setPage} />
      </Card>
    </AppShell>
  );
}
