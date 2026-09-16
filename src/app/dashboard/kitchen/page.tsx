"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ChefHat, Clock, Flame, Loader2, Printer } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import VendorNav from "@/components/layout/VendorNav";
import { listOrders, updateOrderStatus, openOrderKotPdf, Order, OrderStatus } from "@/services/orderService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const ACTIVE_STATUSES: OrderStatus[] = ["placed", "preparing", "ready"];
const TAKEAWAY_GROUP = "Takeaway / Delivery";

// Kitchen only drives orders through the prep pipeline -- serving/billing
// happens elsewhere, so the display never offers those transitions.
const KITCHEN_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: "preparing",
  preparing: "ready",
};

const STATUS_META: Record<OrderStatus, { label: string; badge: string }> = {
  placed: { label: "New", badge: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" },
  preparing: { label: "Preparing", badge: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  ready: { label: "Ready", badge: "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300" },
  served: { label: "Served", badge: "bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300" },
  completed: { label: "Completed", badge: "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300" },
  cancelled: { label: "Cancelled", badge: "bg-foreground/5 text-muted-foreground" },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function elapsedMinutes(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

function elapsedLabel(minutes: number) {
  return minutes < 1 ? "just now" : `${minutes} min`;
}

// Flags orders that have been sitting too long so kitchen staff can spot
// them at a glance instead of reading every timestamp.
function elapsedClass(minutes: number) {
  if (minutes >= 20) return "text-danger font-semibold";
  if (minutes >= 10) return "text-amber-600 font-semibold";
  return "text-muted-foreground";
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);

  function refresh() {
    return listOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
    // Short interval so a freshly-placed order shows up on the kitchen
    // screen with minimal delay without needing a websocket push.
    const interval = setInterval(refresh, 8000);
    return () => clearInterval(interval);
  }, []);

  const groups = useMemo(() => {
    const active = orders
      .filter((o) => ACTIVE_STATUSES.includes(o.status))
      .sort((a, b) => new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime());

    const byGroup = new Map<string, { location: string | null; orders: Order[] }>();
    for (const order of active) {
      const key = order.table?.name || TAKEAWAY_GROUP;
      if (!byGroup.has(key)) byGroup.set(key, { location: order.table?.location ?? null, orders: [] });
      byGroup.get(key)!.orders.push(order);
    }
    return Array.from(byGroup.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => {
        if (a.name === TAKEAWAY_GROUP) return 1;
        if (b.name === TAKEAWAY_GROUP) return -1;
        return a.name.localeCompare(b.name, undefined, { numeric: true });
      });
  }, [orders]);

  async function advance(order: Order) {
    const next = KITCHEN_NEXT[order.status];
    if (!next) return;
    setUpdatingId(order.id);
    try {
      await updateOrderStatus(order.id, next);
      toast.success(`Order marked ${next}`);
      await refresh();
    } catch {
      toast.error("Could not update order status");
    } finally {
      setUpdatingId(null);
    }
  }

  async function printKot(order: Order) {
    setPrintingId(order.id);
    try {
      await openOrderKotPdf(order.id);
    } catch {
      toast.error("Could not open kitchen ticket");
    } finally {
      setPrintingId(null);
    }
  }

  return (
    <AppShell title="Kitchen" nav={<VendorNav />}>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading...
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
          <ChefHat className="size-8" />
          <p className="text-sm">No active orders right now.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.name}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{group.name}</span>
                  {group.location && (
                    <span className="text-xs font-normal text-muted-foreground">{group.location}</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-0">
                {group.orders.map((order) => {
                  const meta = STATUS_META[order.status];
                  const next = KITCHEN_NEXT[order.status];
                  return (
                    <div key={order.id} className="border-t border-border p-4 first:border-t-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-foreground">{order.orderNumber}</p>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.badge}`}>
                          {order.status === "preparing" && <Flame className="size-3" />}
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-xs">
                        <Clock className="size-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{formatTime(order.placedAt)}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className={elapsedClass(elapsedMinutes(order.placedAt))}>
                          {elapsedLabel(elapsedMinutes(order.placedAt))}
                        </span>
                      </p>

                      <ul className="mt-2 space-y-1 text-sm">
                        {order.items.map((item) => (
                          <li key={item.id}>
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-semibold text-foreground">{item.quantity}×</span>
                              <span className="text-foreground">
                                {item.itemNameSnapshot}
                                {item.variantNameSnapshot && ` (${item.variantNameSnapshot})`}
                              </span>
                            </div>
                            {item.addons.length > 0 && (
                              <p className="pl-5 text-xs text-muted-foreground">
                                + {item.addons.map((a) => `${a.nameSnapshot} x${a.quantity}`).join(", ")}
                              </p>
                            )}
                            {item.notes && <p className="pl-5 text-xs italic text-muted-foreground">{item.notes}</p>}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className={next ? "" : "flex-1"}
                          loading={printingId === order.id}
                          onClick={() => printKot(order)}
                          title="Print kitchen ticket"
                        >
                          {printingId !== order.id && <Printer className="size-3.5" />}
                          {!next && "Print KOT"}
                        </Button>
                        {next && (
                          <Button
                            size="sm"
                            className="flex-1"
                            loading={updatingId === order.id}
                            onClick={() => advance(order)}
                          >
                            {updatingId === order.id ? "Updating..." : `Mark ${next}`}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
