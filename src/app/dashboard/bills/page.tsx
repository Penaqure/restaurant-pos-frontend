"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, Receipt } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import VendorNav from "@/components/layout/VendorNav";
import { listBills, Bill } from "@/services/billService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";

const PAYMENT_STYLES: Record<Bill["paymentStatus"], string> = {
  unpaid: "bg-red-50 text-red-700",
  partial: "bg-amber-50 text-amber-700",
  paid: "bg-green-50 text-green-700",
  refunded: "bg-black/5 text-muted-foreground",
};

const PAGE_SIZE = 10;

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    listBills()
      .then(setBills)
      .finally(() => setLoading(false));
  }, []);

  const pageCount = Math.max(1, Math.ceil(bills.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visibleBills = bills.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <AppShell title="Bills" nav={<VendorNav />}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="size-4 text-muted-foreground" />
            Bills
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading...
            </div>
          ) : bills.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No bills yet.</p>
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
