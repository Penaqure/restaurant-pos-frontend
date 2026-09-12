"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Eye, Loader2, QrCode } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import VendorNav from "@/components/layout/VendorNav";
import { listOrders, Order } from "@/services/orderService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const STATUS_STYLES: Record<string, string> = {
  placed: "bg-blue-50 text-blue-700",
  preparing: "bg-amber-50 text-amber-700",
  ready: "bg-purple-50 text-purple-700",
  served: "bg-teal-50 text-teal-700",
  completed: "bg-green-50 text-green-700",
  cancelled: "bg-black/5 text-muted-foreground",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell title="Orders" nav={<VendorNav />}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-4 text-muted-foreground" />
            Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading...
            </div>
          ) : orders.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No orders yet.</p>
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
                  {orders.map((o) => (
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
                        <Link href={`/dashboard/orders/${o.id}`}>
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
      </Card>
    </AppShell>
  );
}
