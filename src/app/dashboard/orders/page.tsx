"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { Ban, ClipboardList, Eye, Loader2, QrCode } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import VendorNav from "@/components/layout/VendorNav";
import { listOrders, updateOrderStatus, Order, OrderStatus, OrderType } from "@/services/orderService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";

const STATUS_STYLES: Record<string, string> = {
  placed: "bg-blue-50 text-blue-700",
  preparing: "bg-amber-50 text-amber-700",
  ready: "bg-purple-50 text-purple-700",
  served: "bg-teal-50 text-teal-700",
  completed: "bg-green-50 text-green-700",
  cancelled: "bg-black/5 text-muted-foreground",
};

// Once an order is served it can no longer be cancelled (mirrors
// ORDER_STATUS_TRANSITIONS on the backend).
const CANCELLABLE_STATUSES: OrderStatus[] = ["placed", "preparing", "ready"];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "total-desc", label: "Total: high to low" },
  { value: "total-asc", label: "Total: low to high" },
] as const;
type SortOption = (typeof SORT_OPTIONS)[number]["value"];

const PAGE_SIZE = 10;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<OrderType | "all">("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [cancelingOrder, setCancelingOrder] = useState(false);

  function refresh() {
    return listOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, []);

  function updateAndResetPage<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (typeFilter !== "all" && o.orderType !== typeFilter) return false;
      if (
        query &&
        !o.orderNumber.toLowerCase().includes(query) &&
        !(o.customerName || "").toLowerCase().includes(query) &&
        !(o.table?.name || "").toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });

    result.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime();
        case "total-desc":
          return Number(b.totalAmount) - Number(a.totalAmount);
        case "total-asc":
          return Number(a.totalAmount) - Number(b.totalAmount);
        default:
          return new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime();
      }
    });
    return result;
  }, [orders, search, statusFilter, typeFilter, sort]);

  async function handleConfirmCancelOrder() {
    if (!cancelTarget) return;
    setCancelingOrder(true);
    try {
      await updateOrderStatus(cancelTarget.id, "cancelled");
      toast.success(`Order ${cancelTarget.orderNumber} cancelled`);
      setCancelTarget(null);
      await refresh();
    } catch {
      toast.error("Could not cancel order");
    } finally {
      setCancelingOrder(false);
    }
  }

  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visibleOrders = filteredOrders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <AppShell title="Orders" nav={<VendorNav />}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-4 text-muted-foreground" />
            Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 border-b border-border sm:flex-row sm:flex-wrap sm:items-center">
          <SearchInput
            value={search}
            onChange={(e) => updateAndResetPage(setSearch, e.target.value)}
            placeholder="Search order #, customer, table..."
            className="sm:max-w-xs sm:flex-1"
          />
          <Select
            value={statusFilter}
            onChange={(e) => updateAndResetPage(setStatusFilter, e.target.value as OrderStatus | "all")}
            className="sm:w-auto"
          >
            <option value="all">All statuses</option>
            {(["placed", "preparing", "ready", "served", "completed", "cancelled"] as OrderStatus[]).map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </Select>
          <Select
            value={typeFilter}
            onChange={(e) => updateAndResetPage(setTypeFilter, e.target.value as OrderType | "all")}
            className="sm:w-auto"
          >
            <option value="all">All types</option>
            <option value="dine_in">Dine in</option>
            <option value="takeaway">Takeaway</option>
            <option value="delivery">Delivery</option>
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
          ) : orders.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No orders yet.</p>
          ) : filteredOrders.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No orders match your search/filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Order</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Table</th>
                    <th className="px-5 py-3 font-medium">Total</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.map((o) => (
                    <tr key={o.id} className="border-t border-border">
                      <td className="px-5 py-3">
                        <Link
                          href={`/dashboard/orders/${o.id}`}
                          className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline"
                        >
                          {o.orderNumber}
                          {o.source === "customer_qr" && (
                            <QrCode className="size-3.5 shrink-0 text-muted-foreground" aria-label="Self-ordered via QR" />
                          )}
                        </Link>
                      </td>
                      <td className="px-5 py-3 capitalize text-muted-foreground">{o.orderType.replace("_", " ")}</td>
                      <td className="px-5 py-3 text-muted-foreground">{o.table?.name || "—"}</td>
                      <td className="px-5 py-3 font-mono text-muted-foreground">₹{o.totalAmount}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[o.status]}`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {CANCELLABLE_STATUSES.includes(o.status) && (
                            <Button variant="ghost" size="sm" onClick={() => setCancelTarget(o)}>
                              <Ban className="size-3.5" />
                              Cancel
                            </Button>
                          )}
                          <Link href={`/dashboard/orders/${o.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="size-3.5" />
                              View
                            </Button>
                          </Link>
                        </div>
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

      {cancelTarget && (
        <ConfirmDialog
          title="Cancel this order?"
          description={`Order ${cancelTarget.orderNumber}${cancelTarget.table ? ` on ${cancelTarget.table.name}` : ""} will be cancelled.`}
          confirmLabel="Cancel order"
          loading={cancelingOrder}
          onConfirm={handleConfirmCancelOrder}
          onCancel={() => setCancelTarget(null)}
        />
      )}
    </AppShell>
  );
}
