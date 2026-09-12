"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Loader2, Receipt, X } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import VendorNav from "@/components/layout/VendorNav";
import { getOrder, updateOrderStatus, Order, OrderStatus } from "@/services/orderService";
import { generateBillFromOrder } from "@/services/billService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const FLOW: OrderStatus[] = ["placed", "preparing", "ready", "served", "completed"];
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: "preparing",
  preparing: "ready",
  ready: "served",
  served: "completed",
};

export default function OrderDetailPage(props: PageProps<"/dashboard/orders/[orderId]">) {
  const { orderId } = use(props.params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [billing, setBilling] = useState(false);

  function refresh() {
    return getOrder(orderId)
      .then(setOrder)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  async function advance() {
    if (!order) return;
    const next = NEXT[order.status];
    if (!next) return;
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, next);
      toast.success(`Order marked ${next}`);
      await refresh();
    } catch {
      toast.error("Could not update order status");
    } finally {
      setUpdating(false);
    }
  }

  async function cancel() {
    if (!order) return;
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, "cancelled");
      toast.success("Order cancelled");
      await refresh();
    } catch {
      toast.error("Could not cancel order");
    } finally {
      setUpdating(false);
    }
  }

  async function handleGenerateBill() {
    if (!order) return;
    setBilling(true);
    try {
      const bill = await generateBillFromOrder(order.id, discountCode || undefined);
      toast.success(`Bill ${bill.billNumber} generated`);
      router.push(`/dashboard/bills/${bill.id}`);
    } catch (err) {
      const response = (err as { response?: { status?: number; data?: { message?: string; billId?: string } } })
        .response;
      if (response?.status === 409 && response.data?.billId) {
        router.push(`/dashboard/bills/${response.data.billId}`);
        return;
      }
      toast.error(response?.data?.message || "Could not generate bill");
    } finally {
      setBilling(false);
    }
  }

  if (loading || !order) {
    return (
      <AppShell title="Order" nav={<VendorNav />}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading...
        </div>
      </AppShell>
    );
  }

  const currentIndex = FLOW.indexOf(order.status);
  const isTerminal = order.status === "completed" || order.status === "cancelled";

  return (
    <AppShell title={order.orderNumber} nav={<VendorNav />}>
      <div className="grid max-w-2xl gap-6">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm capitalize text-muted-foreground">
                  {order.orderType.replace("_", " ")}
                  {order.table && ` · ${order.table.name}`}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {order.creator
                    ? `Placed by ${order.creator.firstName} ${order.creator.lastName}`
                    : `Self-ordered via QR code${order.customerName ? ` by ${order.customerName}` : ""}`}
                </p>
              </div>
              {!isTerminal && (
                <button
                  onClick={cancel}
                  disabled={updating}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-danger hover:bg-red-50 disabled:opacity-50"
                >
                  <X className="size-3.5" />
                  Cancel order
                </button>
              )}
            </div>

            {order.status === "cancelled" ? (
              <p className="mt-4 text-sm font-medium text-muted-foreground">Cancelled</p>
            ) : (
              <div className="mt-4 flex items-center gap-1">
                {FLOW.map((s, i) => (
                  <div key={s} className="flex flex-1 items-center">
                    <div
                      className={`flex-1 rounded-full py-1 text-center text-xs capitalize ${
                        i <= currentIndex ? "bg-brand-600 text-white" : "bg-black/5 text-muted-foreground"
                      }`}
                    >
                      {s}
                    </div>
                    {i < FLOW.length - 1 && <div className="w-1" />}
                  </div>
                ))}
              </div>
            )}

            {!isTerminal && (
              <Button onClick={advance} loading={updating} className="mt-4 w-full">
                {updating ? "Updating..." : `Mark as ${NEXT[order.status]}`}
              </Button>
            )}
          </CardContent>
        </Card>

        {order.status === "completed" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="size-4 text-muted-foreground" />
                Generate bill
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Discount code (optional)"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="flex-1 uppercase"
                />
                <Button onClick={handleGenerateBill} loading={billing}>
                  {billing ? "Generating..." : "Generate bill"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {order.items.map((item) => (
                <li key={item.id} className="py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">
                      {item.quantity}× {item.itemNameSnapshot}
                      {item.variantNameSnapshot && ` (${item.variantNameSnapshot})`}
                    </span>
                    <span className="font-mono text-foreground">₹{item.lineTotal}</span>
                  </div>
                  {item.addons.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      + {item.addons.map((a) => `${a.nameSnapshot} x${a.quantity}`).join(", ")}
                    </p>
                  )}
                  {item.notes && <p className="text-xs text-muted-foreground">Note: {item.notes}</p>}
                </li>
              ))}
            </ul>

            <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono">₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span className="font-mono">₹{order.taxAmount}</span>
              </div>
              <div className="flex justify-between font-semibold text-foreground">
                <span>Total</span>
                <span className="font-mono">₹{order.totalAmount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
