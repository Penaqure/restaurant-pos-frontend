"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { ArrowRightLeft, Loader2, Plus, Printer, Receipt, X } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import VendorNav from "@/components/layout/VendorNav";
import { useAuth } from "@/context/AuthContext";
import { getOrder, updateOrderStatus, transferOrderTable, openOrderKotPdf, Order, OrderStatus } from "@/services/orderService";
import { generateBillFromOrder } from "@/services/billService";
import { listTables, RestaurantTable } from "@/services/tableService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import AddItemsModal from "@/components/orders/AddItemsModal";

const FLOW: OrderStatus[] = ["placed", "preparing", "ready", "served", "completed"];
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: "preparing",
  preparing: "ready",
  ready: "served",
  served: "completed",
};
// Once an order is served it can no longer be cancelled (mirrors
// ORDER_STATUS_TRANSITIONS on the backend, which only allows served -> completed).
const CANCELLABLE_STATUSES: OrderStatus[] = ["placed", "preparing", "ready"];

export default function OrderDetailPage(props: PageProps<"/dashboard/orders/[orderId]">) {
  const { orderId } = use(props.params);
  const router = useRouter();
  const { user } = useAuth();
  // Mirrors the backend's canBill gate -- waiters can't generate bills at all.
  const canBill = user?.role === "owner" || user?.role === "manager" || user?.role === "cashier";
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [billing, setBilling] = useState(false);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [targetTableId, setTargetTableId] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [addingItems, setAddingItems] = useState(false);
  const [printingKot, setPrintingKot] = useState(false);

  function refresh() {
    return getOrder(orderId)
      .then(setOrder)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
    listTables().then(setTables).catch(() => {});
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

  async function handleTransfer() {
    if (!order || !targetTableId) return;
    setTransferring(true);
    try {
      const updated = await transferOrderTable(order.id, targetTableId);
      setOrder(updated);
      setTargetTableId("");
      toast.success(`Order moved to ${updated.table?.name}`);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(message || "Could not move order");
    } finally {
      setTransferring(false);
    }
  }

  async function printKot() {
    if (!order) return;
    setPrintingKot(true);
    try {
      await openOrderKotPdf(order.id);
    } catch {
      toast.error("Could not open kitchen ticket");
    } finally {
      setPrintingKot(false);
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
  const canCancel = CANCELLABLE_STATUSES.includes(order.status);
  const canMoveTable = order.orderType === "dine_in" && !isTerminal;
  const canGenerateBill = order.status === "completed" && canBill;
  const hasSidebar = canMoveTable || canGenerateBill;

  return (
    <AppShell title={order.orderNumber} nav={<VendorNav />}>
      <div className={hasSidebar ? "grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start" : "grid gap-6"}>
      <div className="space-y-6">
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
              {canCancel && (
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

        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" loading={printingKot} onClick={printKot}>
                {!printingKot && <Printer className="size-3.5" />}
                Print KOT
              </Button>
              {!isTerminal && (
                <Button variant="secondary" size="sm" onClick={() => setAddingItems(true)}>
                  <Plus className="size-3.5" />
                  Add items
                </Button>
              )}
            </div>
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

      {hasSidebar && (
        <div className="space-y-6">
          {canMoveTable && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="size-4 text-muted-foreground" />
                  Move to another table
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Select value={targetTableId} onChange={(e) => setTargetTableId(e.target.value)} className="flex-1">
                    <option value="">Select a table</option>
                    {tables
                      .filter((t) => t.id !== order.table?.id)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                          {t.location ? ` (${t.location})` : ""} — {t.status}
                        </option>
                      ))}
                  </Select>
                  <Button onClick={handleTransfer} loading={transferring} disabled={!targetTableId}>
                    {transferring ? "Moving..." : "Move"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {canGenerateBill && (
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
        </div>
      )}
      </div>

      {addingItems && (
        <AddItemsModal orderId={order.id} onClose={() => setAddingItems(false)} onAdded={refresh} />
      )}
    </AppShell>
  );
}
