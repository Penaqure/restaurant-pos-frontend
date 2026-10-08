"use client";

import { useEffect, useState } from "react";
import { History, Loader2, ShieldAlert } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import VendorNav from "@/components/layout/VendorNav";
import { listAuditLog, AuditLogEntry } from "@/services/auditLogService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Pagination from "@/components/ui/Pagination";

// Matches the dotted action strings controllers write (see auditService.js
// call sites) -- not meant to be an exhaustive enum, just a readable label
// for the ones most likely to show up; anything else falls back to the raw
// action string.
const ACTION_LABELS: Record<string, string> = {
  "payment.recorded": "Payment recorded",
  "payment.voided": "Payment voided",
  "payment.refunded": "Payment refunded",
  "discount.created": "Discount created",
  "discount.updated": "Discount updated",
  "discount.deleted": "Discount deleted",
  "staff.role_or_status_changed": "Staff role/status changed",
  "menu_item.price_changed": "Menu item price changed",
  "order.cancelled": "Order cancelled",
};

function describe(entry: AuditLogEntry): string {
  const m = entry.metadata || {};
  switch (entry.action) {
    case "payment.recorded":
      return `${m.method} · ${m.amount}`;
    case "payment.voided":
      return `${m.amount}`;
    case "payment.refunded":
      return `${m.amount}`;
    case "discount.created":
    case "discount.updated":
    case "discount.deleted":
      return String(m.code ?? "");
    case "staff.role_or_status_changed": {
      const before = m.before as Record<string, unknown> | undefined;
      const after = m.after as Record<string, unknown> | undefined;
      return `${before?.status ?? ""}/${before?.roleId ? "role" : ""} → ${after?.status ?? ""}`;
    }
    case "menu_item.price_changed":
      return `${m.name}: ${m.before} → ${m.after}`;
    case "order.cancelled":
      return String(m.orderNumber ?? "");
    default:
      return "";
  }
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    // Flips back to true on every filter/page change, before the refetch
    // below resolves -- keeps the loading indicator honest.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    listAuditLog({ from: from || undefined, to: to || undefined, page })
      .then((data) => {
        setEntries(data.entries);
        setTotal(data.total);
        setPageSize(data.pageSize);
      })
      .catch((err) => {
        if (err?.response?.status === 403) setForbidden(true);
      })
      .finally(() => setLoading(false));
  }, [from, to, page]);

  return (
    <AppShell title="Audit log" nav={<VendorNav />}>
      {forbidden ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldAlert className="size-4" />
          Only the owner can view the audit log.
        </p>
      ) : (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <History className="size-4 text-muted-foreground" />
              Audit log
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="date"
                value={from}
                onChange={(e) => {
                  setPage(1);
                  setFrom(e.target.value);
                }}
                className="w-auto py-1.5 text-xs"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                value={to}
                onChange={(e) => {
                  setPage(1);
                  setTo(e.target.value);
                }}
                className="w-auto py-1.5 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading...
              </div>
            ) : entries.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No activity in this range.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">When</th>
                      <th className="py-2 pr-4 font-medium">Who</th>
                      <th className="py-2 pr-4 font-medium">Action</th>
                      <th className="py-2 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 pr-4 whitespace-nowrap text-foreground">
                          {entry.user ? `${entry.user.firstName} ${entry.user.lastName}` : "—"}
                        </td>
                        <td className="py-2 pr-4 whitespace-nowrap text-foreground">
                          {ACTION_LABELS[entry.action] || entry.action}
                        </td>
                        <td className="py-2 text-muted-foreground">{describe(entry)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
          <Pagination page={page} pageCount={Math.max(1, Math.ceil(total / pageSize))} onPageChange={setPage} />
        </Card>
      )}
    </AppShell>
  );
}
