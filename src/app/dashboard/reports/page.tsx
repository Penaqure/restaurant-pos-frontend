"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import {
  Ban,
  Building2,
  Clock,
  Download,
  Eye,
  IndianRupee,
  Landmark,
  Loader2,
  ReceiptText,
  Tag,
  TrendingUp,
  Trophy,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import VendorNav from "@/components/layout/VendorNav";
import { getAnalytics, Analytics } from "@/services/reportService";
import { buildAnalyticsCsv, downloadCsv } from "@/lib/exportCsv";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";

// Fixed hue per payment method / order type (categorical identity) -- from
// the validated default palette, slots assigned in a stable order so an
// identity's color never shifts when the set present changes.
const METHOD_COLORS: Record<string, string> = {
  cash: "#2a78d6",
  card: "#eb6834",
  upi: "#1baf7a",
  wallet: "#eda100",
  other: "#e87ba4",
};

const ORDER_TYPE_COLORS: Record<string, string> = {
  dine_in: "#2a78d6",
  takeaway: "#1baf7a",
  delivery: "#eb6834",
};

const AXIS_STYLE = { fontSize: 12, fill: "#6b7280" };
const DAY_OPTIONS = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
];

function formatShortDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function formatHour(h: number) {
  const period = h < 12 ? "am" : "pm";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}${period}`;
}

function currency(n: number) {
  return `₹${n.toFixed(2)}`;
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function ReportsPage() {
  const [days, setDays] = useState(30);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAnalytics(days)
      .then((data) => {
        setAnalytics(data);
        setForbidden(false);
      })
      .catch((err) => {
        if (err?.response?.status === 403) setForbidden(true);
      })
      .finally(() => setLoading(false));
  }, [days]);

  function handleExport() {
    if (!analytics) return;
    const csv = buildAnalyticsCsv(analytics);
    downloadCsv(`report-${analytics.range.since}-${days}d.csv`, csv);
  }

  return (
    <AppShell title="Reports" nav={<VendorNav />}>
      {!forbidden && (
        <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
          <Select value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-auto py-1.5">
            {DAY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Button variant="secondary" onClick={handleExport} disabled={!analytics}>
            <Download className="size-4" />
            Export CSV
          </Button>
        </div>
      )}

      {forbidden ? (
        <p className="text-sm text-muted-foreground">
          Your role doesn&apos;t have access to reports. Ask an owner or manager if you need this.
        </p>
      ) : loading || !analytics ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading...
        </div>
      ) : (
        <ReportsBody analytics={analytics} />
      )}
    </AppShell>
  );
}

function ReportsBody({ analytics }: { analytics: Analytics }) {
  const {
    overview,
    dailySales,
    paymentMethods,
    orderTypes,
    topItems,
    categorySales,
    peakHours,
    discounts,
    branchSales,
    staffPerformance,
  } = analytics;

  const dailyChartData = dailySales.map((d) => ({ ...d, label: formatShortDate(d.date) }));
  const hasPaymentData = paymentMethods.length > 0;
  const hasOrderTypeData = orderTypes.length > 0;
  const hasTopItems = topItems.length > 0;
  const hasCategoryData = categorySales.length > 0;
  const hasPeakHourData = peakHours.some((h) => h.orders > 0);
  const hasDiscountData = discounts.length > 0;
  const hasStaffData = staffPerformance.length > 0;
  const hasMultiBranch = branchSales.length > 1;
  const cancelledRate = overview.totalOrdersPlaced > 0 ? (overview.cancelledOrders / overview.totalOrdersPlaced) * 100 : 0;

  const kpis = [
    { label: "Total sales", value: currency(overview.sales), icon: IndianRupee, tint: "bg-green-50 text-green-600" },
    { label: "Bills generated", value: String(overview.orders), icon: ReceiptText, tint: "bg-blue-50 text-blue-600" },
    { label: "Avg order value", value: currency(overview.avgOrderValue), icon: TrendingUp, tint: "bg-purple-50 text-purple-600" },
    { label: "Tax collected", value: currency(overview.taxCollected), icon: Landmark, tint: "bg-amber-50 text-amber-600" },
    { label: "Discount given", value: currency(overview.discountGiven), icon: Tag, tint: "bg-pink-50 text-pink-600" },
    {
      label: "Cancelled orders",
      value: `${overview.cancelledOrders} (${cancelledRate.toFixed(1)}%)`,
      icon: Ban,
      tint: "bg-red-50 text-red-600",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${k.tint}`}>
                <k.icon className="size-4.5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs leading-tight text-muted-foreground">{k.label}</p>
                <p className="mt-0.5 truncate font-mono text-lg font-semibold text-foreground">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales trend</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#e5e7eb" strokeWidth={1} />
                <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  cursor={{ fill: "#f3f4f6" }}
                  formatter={(value, name) => [
                    name === "sales" ? currency(Number(value)) : value,
                    name === "sales" ? "Sales" : "Orders",
                  ]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ""}
                />
                <Bar dataKey="sales" fill="#2a78d6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payments by method</CardTitle>
          </CardHeader>
          <CardContent className={hasPaymentData ? "h-64" : undefined}>
            {!hasPaymentData ? (
              <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={paymentMethods.map((m) => ({ ...m, label: m.method[0].toUpperCase() + m.method.slice(1) }))}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} stroke="#e5e7eb" strokeWidth={1} />
                  <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                  <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip cursor={{ fill: "#f3f4f6" }} formatter={(value) => [currency(Number(value)), "Amount"]} />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {paymentMethods.map((m) => (
                      <Cell key={m.method} fill={METHOD_COLORS[m.method] || "#6b7280"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="size-4 text-muted-foreground" />
              Sales by order type
            </CardTitle>
          </CardHeader>
          <CardContent className={hasOrderTypeData ? "h-56" : undefined}>
            {!hasOrderTypeData ? (
              <p className="text-sm text-muted-foreground">No completed orders yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={orderTypes.map((t) => ({ ...t, label: t.type.replace("_", " ") }))}
                  margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} stroke="#e5e7eb" strokeWidth={1} />
                  <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={AXIS_STYLE}
                    axisLine={false}
                    tickLine={false}
                    width={64}
                    className="capitalize"
                  />
                  <Tooltip cursor={{ fill: "#f3f4f6" }} formatter={(value) => [currency(Number(value)), "Sales"]} />
                  <Bar dataKey="sales" radius={[0, 4, 4, 0]} maxBarSize={28}>
                    {orderTypes.map((t) => (
                      <Cell key={t.type} fill={ORDER_TYPE_COLORS[t.type] || "#6b7280"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              Peak hours
            </CardTitle>
          </CardHeader>
          <CardContent className={hasPeakHourData ? "h-56" : undefined}>
            {!hasPeakHourData ? (
              <p className="text-sm text-muted-foreground">No billed orders yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={peakHours.map((h) => ({ ...h, label: formatHour(h.hour) }))}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} stroke="#e5e7eb" strokeWidth={1} />
                  <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} interval={3} />
                  <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                  <Tooltip cursor={{ fill: "#f3f4f6" }} formatter={(value) => [value, "Orders"]} />
                  <Bar dataKey="orders" fill="#5a3ff0" radius={[3, 3, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-4 text-muted-foreground" />
              Top-selling items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!hasTopItems ? (
              <p className="p-6 text-sm text-muted-foreground">No completed orders yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Item</th>
                      <th className="whitespace-nowrap px-5 py-3 font-medium">Qty sold</th>
                      <th className="px-5 py-3 font-medium">Revenue</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {topItems.map((item) => (
                      <tr key={item.menuItemId} className="border-t border-border">
                        <td className="px-5 py-3 font-medium text-foreground">{item.name}</td>
                        <td className="px-5 py-3 text-muted-foreground">{item.quantity}</td>
                        <td className="px-5 py-3 font-mono text-muted-foreground">{currency(item.revenue)}</td>
                        <td className="px-5 py-3 text-right">
                          <Link href={`/dashboard/menu/items/${item.menuItemId}`}>
                            <Button variant="ghost" size="sm" className="whitespace-nowrap">
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

        <Card>
          <CardHeader>
            <CardTitle>Sales by category</CardTitle>
          </CardHeader>
          <CardContent className={hasCategoryData ? "" : undefined}>
            {!hasCategoryData ? (
              <p className="text-sm text-muted-foreground">No completed orders yet.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={categorySales}
                    margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid horizontal={false} stroke="#e5e7eb" strokeWidth={1} />
                    <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                    <YAxis type="category" dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} width={88} />
                    <Tooltip cursor={{ fill: "#f3f4f6" }} formatter={(value) => [currency(Number(value)), "Revenue"]} />
                    <Bar dataKey="revenue" fill="#2a78d6" radius={[0, 4, 4, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {hasMultiBranch && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground" />
              Sales by branch
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Branch</th>
                    <th className="px-5 py-3 font-medium">Bills</th>
                    <th className="px-5 py-3 font-medium">Sales</th>
                    <th className="px-5 py-3 font-medium">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {branchSales.map((b) => {
                    const total = branchSales.reduce((sum, x) => sum + x.sales, 0);
                    const pct = total > 0 ? (b.sales / total) * 100 : 0;
                    return (
                      <tr key={b.branchId} className="border-t border-border">
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-2 font-medium text-foreground">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                              <Building2 className="size-3.5" />
                            </span>
                            {b.branchName}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{b.orders}</td>
                        <td className="px-5 py-3 font-mono text-muted-foreground">{currency(b.sales)}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-black/5">
                              <div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="size-4 text-muted-foreground" />
              Discount usage
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!hasDiscountData ? (
              <p className="p-6 text-sm text-muted-foreground">No discounts applied yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Code</th>
                      <th className="px-5 py-3 font-medium">Times used</th>
                      <th className="px-5 py-3 font-medium">Total discount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discounts.map((d) => (
                      <tr key={d.code} className="border-t border-border">
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-2 font-medium text-foreground">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-pink-50 text-pink-600">
                              <Tag className="size-3.5" />
                            </span>
                            {d.code}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{d.timesUsed}</td>
                        <td className="px-5 py-3 font-mono text-muted-foreground">{currency(d.totalDiscount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              Staff performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!hasStaffData ? (
              <p className="p-6 text-sm text-muted-foreground">No completed orders yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Staff</th>
                      <th className="px-5 py-3 font-medium">Orders</th>
                      <th className="px-5 py-3 font-medium">Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffPerformance.map((s) => (
                      <tr key={s.userId} className="border-t border-border">
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-2 font-medium text-foreground">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700">
                              {initialsOf(s.name)}
                            </span>
                            {s.name}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{s.orders}</td>
                        <td className="px-5 py-3 font-mono text-muted-foreground">{currency(s.sales)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
