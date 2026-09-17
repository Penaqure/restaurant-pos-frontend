"use client";

import { use, useEffect, useState, FormEvent } from "react";
import { toast } from "react-toastify";
import { FileText, Loader2, Printer } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import VendorNav from "@/components/layout/VendorNav";
import { useAuth } from "@/context/AuthContext";
import { getBill, openBillPdf, Bill, BillPdfSize, BILL_PDF_SIZES } from "@/services/billService";
import { listPayments, recordPayment, voidPayment, Payment, PaymentMethod } from "@/services/paymentService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

const PAYMENT_STATUS_STYLES: Record<Bill["paymentStatus"], string> = {
  unpaid: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  partial: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  paid: "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  refunded: "bg-foreground/5 text-muted-foreground",
};

// India's GST is conventionally shown split into CGST + SGST (each half the
// combined rate); everywhere else just gets a plain tax line at the full rate.
function taxDisplayRows(bill: Bill) {
  return bill.taxBreakdown.flatMap((t, i) => {
    if (bill.vendor.country === "IN") {
      const halfRate = t.ratePercent / 2;
      const halfTax = t.taxAmount / 2;
      return [
        { key: `${i}-cgst`, label: `CGST ${halfRate}% on ₹${t.taxableAmount}`, amount: halfTax },
        { key: `${i}-sgst`, label: `SGST ${halfRate}% on ₹${t.taxableAmount}`, amount: halfTax },
      ];
    }
    return [{ key: `${i}-tax`, label: `Tax ${t.ratePercent}% on ₹${t.taxableAmount}`, amount: t.taxAmount }];
  });
}

export default function BillDetailPage(props: PageProps<"/dashboard/bills/[billId]">) {
  const { billId } = use(props.params);
  const { user } = useAuth();
  const [bill, setBill] = useState<Bill | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [pdfSize, setPdfSize] = useState<BillPdfSize | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [amount, setAmount] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (pdfSize === null && user?.vendor?.defaultBillSize) {
      // One-time default once the vendor's setting loads in; pdfSize stays
      // freely editable afterwards (the print-size dropdown below), so this
      // can't be computed as plain derived state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPdfSize(user.vendor.defaultBillSize as BillPdfSize);
    }
  }, [pdfSize, user]);

  function refresh() {
    return Promise.all([getBill(billId), listPayments(billId)]).then(([b, p]) => {
      setBill(b);
      setPayments(p);
      setAmount(b.balanceDue);
      setLoading(false);
    });
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billId]);

  async function handleRecordPayment(e: FormEvent) {
    e.preventDefault();
    setRecording(true);
    try {
      await recordPayment({
        billId,
        method,
        amount: Number(amount),
        referenceNumber: referenceNumber || undefined,
      });
      toast.success("Payment recorded");
      setReferenceNumber("");
      setCashReceived("");
      await refresh();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Could not record payment";
      toast.error(message);
    } finally {
      setRecording(false);
    }
  }

  async function handleVoid(id: string) {
    try {
      await voidPayment(id);
      toast.success("Payment voided");
      await refresh();
    } catch {
      toast.error("Could not void payment");
    }
  }

  async function handleOpenPdf() {
    setOpening(true);
    try {
      await openBillPdf(billId, pdfSize || undefined);
    } catch {
      toast.error("Could not open PDF");
    } finally {
      setOpening(false);
    }
  }

  if (loading || !bill) {
    return (
      <AppShell title="Bill" backHref="/dashboard/bills" nav={<VendorNav />}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={bill.billNumber} backHref="/dashboard/bills" nav={<VendorNav />}>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {bill.order.items.map((item) => (
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
                </li>
              ))}
            </ul>

            <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono">₹{bill.subtotal}</span>
              </div>
              {Number(bill.discountAmount) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Discount {bill.discount && `(${bill.discount.code})`}</span>
                  <span className="font-mono">-₹{bill.discountAmount}</span>
                </div>
              )}
              {taxDisplayRows(bill).map((row) => (
                <div key={row.key} className="flex justify-between text-muted-foreground">
                  <span>{row.label}</span>
                  <span className="font-mono">₹{row.amount.toFixed(2)}</span>
                </div>
              ))}
              {Number(bill.roundOffAmount) !== 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Round off</span>
                  <span className="font-mono">₹{bill.roundOffAmount}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-1 font-semibold text-foreground">
                <span>Total</span>
                <span className="font-mono">₹{bill.totalAmount}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Paid</span>
                <span className="font-mono">₹{bill.amountPaid}</span>
              </div>
              <div className="flex justify-between font-semibold text-foreground">
                <span>Balance due</span>
                <span className="font-mono">₹{bill.balanceDue}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  Order {bill.order.orderNumber}
                  {bill.order.table && ` · Table ${bill.order.table.name}`}
                </p>
                <p className="text-xs text-muted-foreground/70">Generated by {bill.generator.firstName}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs capitalize ${PAYMENT_STATUS_STYLES[bill.paymentStatus]}`}
                >
                  {bill.paymentStatus}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={pdfSize || "a4"}
                  onChange={(e) => setPdfSize(e.target.value as BillPdfSize)}
                  className="w-auto py-1.5 text-xs"
                >
                  {BILL_PDF_SIZES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
                <Button onClick={handleOpenPdf} loading={opening} className="flex-1">
                  {!opening && <Printer className="size-4" />}
                  {opening ? "Opening..." : "View / print"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length > 0 && (
                <ul className="mb-3 divide-y divide-border">
                  {payments.map((p) => (
                    <li
                      key={p.id}
                      className={`flex items-center justify-between py-2 text-sm ${p.status === "void" ? "opacity-40" : ""}`}
                    >
                      <span className="text-foreground">
                        <span className="capitalize">{p.method}</span>
                        {p.referenceNumber && <span className="text-muted-foreground"> · {p.referenceNumber}</span>}
                        {p.status === "void" && <span className="text-muted-foreground"> (voided)</span>}
                      </span>
                      <span className="flex items-center gap-3 font-mono">
                        ₹{p.amount}
                        {p.status === "recorded" && (
                          <button
                            onClick={() => handleVoid(p.id)}
                            className="rounded px-1.5 py-0.5 font-sans text-xs text-danger hover:bg-danger/10"
                          >
                            Void
                          </button>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {Number(bill.balanceDue) > 0 && bill.status !== "void" && (
                <form onSubmit={handleRecordPayment} className="space-y-2">
                  <Select
                    value={method}
                    onChange={(e) => {
                      setMethod(e.target.value as PaymentMethod);
                      setCashReceived("");
                    }}
                    className="py-1.5"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="wallet">Wallet</option>
                    <option value="other">Other</option>
                  </Select>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Amount to record</label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="py-1.5"
                    />
                  </div>
                  {method !== "cash" && (
                    <Input
                      placeholder="Reference no."
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      className="py-1.5"
                    />
                  )}

                  {method === "cash" && (
                    <div className="space-y-2 rounded-lg border border-border bg-foreground/[0.02] p-2.5">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Cash received from customer</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g. 200"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          className="py-1.5"
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Change to return</span>
                        <span className="font-mono font-semibold text-foreground">
                          ₹{Math.max(0, Number(cashReceived || 0) - Number(amount || 0)).toFixed(2)}
                        </span>
                      </div>
                      {cashReceived !== "" && Number(cashReceived) < Number(amount || 0) && (
                        <p className="text-xs text-danger">Cash received is less than the amount being recorded.</p>
                      )}
                    </div>
                  )}

                  <Button type="submit" size="sm" loading={recording} className="w-full">
                    {recording ? "Recording..." : "Record payment"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
