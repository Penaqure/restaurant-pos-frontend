"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { Ban, ClipboardList, Eye, LayoutGrid, Loader2, QrCode, Table2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/currency";
import VendorNav from "@/components/layout/VendorNav";
import { listOrders, updateOrderStatus, Order, OrderStatus, OrderType } from "@/services/orderService";
import { isWithinDateRange } from "@/lib/dateRange";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Pagination from "@/components/ui/Pagination";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";

const STATUS_STYLES: Record<string, string> = {
  placed: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  preparing: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  ready: "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  served: "bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  completed: "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  cancelled: "bg-foreground/5 text-muted-foreground",
};

// A solid left-border accent per status on order cards -- same color
// family as STATUS_STYLES' badges, but a strip rather than a full card
// tint. Card bodies carry a lot of text (item lists, prices), and a full
// colored background behind all of that hurts readability, especially in
// dark mode; a thin accent gives the same at-a-glance signal without it.
// Solid mid-saturation shades read fine on both a light and dark card
// background, so no separate dark: variant is needed here.
const STATUS_ACCENT: Record<string, string> = {
  placed: "border-l-blue-500",
  preparing: "border-l-amber-500",
  ready: "border-l-purple-500",
  served: "border-l-teal-500",
  completed: "border-l-green-500",
  cancelled: "border-l-border",
};

// Once an order is served it can no longer be cancelled (mirrors
// ORDER_STATUS_TRANSITIONS on the backend).
const CANCELLABLE_STATUSES: OrderStatus[] = ["placed", "preparing", "ready"];

// Broad buckets for the tabs -- "active" covers everything still moving
// through the kitchen/counter; exact prep-stage filtering (placed vs.
// preparing vs. ready) lives on the Kitchen page, not here.
const ACTIVE_STATUSES: OrderStatus[] = ["placed", "preparing", "ready", "served"];
type StatusTab = "all" | "active" | "completed" | "cancelled";
const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

type ViewMode = "cards" | "table";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "total-desc", label: "Total: high to low" },
  { value: "total-asc", label: "Total: low to high" },
] as const;
type SortOption = (typeof SORT_OPTIONS)[number]["value"];

const PAGE_SIZE = 10;

export default function OrdersPage() {
  const { user } = useAuth();
  const currencyCode = user?.vendor?.currency;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [typeFilter, setTypeFilter] = useState<OrderType | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
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
      if (statusTab === "active" && !ACTIVE_STATUSES.includes(o.status)) return false;
      if (statusTab === "completed" && o.status !== "completed") return false;
      if (statusTab === "cancelled" && o.status !== "cancelled") return false;
      if (typeFilter !== "all" && o.orderType !== typeFilter) return false;
      if (!isWithinDateRange(o.placedAt, dateFrom, dateTo)) return false;
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
  }, [orders, search, statusTab, typeFilter, dateFrom, dateTo, sort]);

  // Counts reflect every other active filter (search/type/date) except the
  // tab itself, so switching tabs shows how many orders are in *that*
  // bucket given what's already filtered -- not the unfiltered total.
  const tabCounts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const base = orders.filter((o) => {
      if (typeFilter !== "all" && o.orderType !== typeFilter) return false;
      if (!isWithinDateRange(o.placedAt, dateFrom, dateTo)) return false;
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
    return {
      all: base.length,
      active: base.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
      completed: base.filter((o) => o.status === "completed").length,
      cancelled: base.filter((o) => o.status === "cancelled").length,
    };
  }, [orders, search, typeFilter, dateFrom, dateTo]);

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
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-4 text-muted-foreground" />
            Orders
          </CardTitle>
          <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
            <button
              onClick={() => setViewMode("cards")}
              title="Card view"
              className={`flex size-7 items-center justify-center rounded ${
                viewMode === "cards" ? "bg-brand-600 text-white" : "text-muted-foreground hover:bg-foreground/5"
              }`}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              title="Table view"
              className={`flex size-7 items-center justify-center rounded ${
                viewMode === "table" ? "bg-brand-600 text-white" : "text-muted-foreground hover:bg-foreground/5"
              }`}
            >
              <Table2 className="size-4" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="flex gap-1.5 overflow-x-auto border-b border-border py-2">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => updateAndResetPage(setStatusTab, t.value)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                statusTab === t.value
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-border bg-surface-card text-muted-foreground hover:border-brand-300"
              }`}
            >
              {t.label} ({tabCounts[t.value]})
            </button>
          ))}
        </CardContent>

        <CardContent className="flex flex-col gap-3 border-b border-border sm:flex-row sm:flex-wrap sm:items-center">
          <SearchInput
            value={search}
            onChange={(e) => updateAndResetPage(setSearch, e.target.value)}
            placeholder="Search order #, customer, table..."
            className="sm:max-w-xs sm:flex-1"
          />
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
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => updateAndResetPage(setDateFrom, e.target.value)}
              className="sm:w-auto"
              aria-label="From date"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => updateAndResetPage(setDateTo, e.target.value)}
              className="sm:w-auto"
              aria-label="To date"
            />
          </div>
          <Select value={sort} onChange={(e) => setSort(e.target.value as SortOption)} className="sm:w-auto">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </CardContent>
        <CardContent className={viewMode === "table" ? "p-0" : undefined}>
          {loading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading...
            </div>
          ) : orders.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No orders yet.</p>
          ) : filteredOrders.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No orders match your search/filters.</p>
          ) : viewMode === "cards" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibleOrders.map((o) => (
                <div
                  key={o.id}
                  className={`flex flex-col rounded-xl border border-border bg-surface-card shadow-soft border-l-4 ${STATUS_ACCENT[o.status]}`}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-border p-3.5">
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/orders/${o.id}`}
                        className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline"
                      >
                        {o.orderNumber}
                        {o.source === "customer_qr" && (
                          <QrCode className="size-3.5 shrink-0 text-muted-foreground" aria-label="Self-ordered via QR" />
                        )}
                      </Link>
                      <p className="truncate text-xs capitalize text-muted-foreground">
                        {o.orderType.replace("_", " ")}
                        {o.table && ` · Table ${o.table.name}`}
                        {o.customerName && ` · ${o.customerName}`}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[o.status]}`}
                    >
                      {o.status}
                    </span>
                  </div>

                  <ul className="flex-1 divide-y divide-border px-3.5">
                    {o.items.map((item) => (
                      <li key={item.id} className="py-2 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-foreground">
                            {item.quantity}× {item.itemNameSnapshot}
                            {item.variantNameSnapshot && ` (${item.variantNameSnapshot})`}
                          </span>
                          <span className="shrink-0 font-mono text-xs text-muted-foreground">
                            {formatCurrency(item.lineTotal, currencyCode)}
                          </span>
                        </div>
                        {item.addons.length > 0 && (
                          <p className="truncate text-xs text-muted-foreground">
                            + {item.addons.map((a) => `${a.nameSnapshot} x${a.quantity}`).join(", ")}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between gap-2 border-t border-border p-3.5">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {formatCurrency(o.totalAmount, currencyCode)}
                    </span>
                    <div className="flex gap-1">
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
                  </div>
                </div>
              ))}
            </div>
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
                      <td className="px-5 py-3 font-mono text-muted-foreground">{formatCurrency(o.totalAmount, currencyCode)}</td>
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
