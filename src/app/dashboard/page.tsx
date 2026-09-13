"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import AppShell from "@/components/layout/AppShell";
import VendorNav from "@/components/layout/VendorNav";
import { useAuth } from "@/context/AuthContext";
import { listStaff } from "@/services/staffService";
import { getSummary, ReportSummary, getMyActivity, MyActivity } from "@/services/reportService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import UsageBar from "@/components/ui/UsageBar";
import {
  Building2,
  ChevronRight,
  IndianRupee,
  ReceiptText,
  ShoppingCart,
  ClipboardList,
  ChefHat,
  Grid3x3,
  Wallet,
  TrendingUp,
  Users,
  Loader2,
} from "lucide-react";

const CAN_VIEW_STAFF = new Set(["owner", "manager"]);
const CAN_VIEW_ANALYTICS = new Set(["owner", "manager"]);
const CAN_VIEW_MY_ACTIVITY = new Set(["waiter", "cashier"]);

const AXIS_STYLE = { fontSize: 12, fill: "#6b7280" };

function currency(n: number) {
  return `₹${n.toFixed(2)}`;
}

function formatShortDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

const QUICK_LINKS = [
  { href: "/dashboard/pos", label: "POS", icon: ShoppingCart, roles: ["owner", "manager", "cashier"] as string[] | undefined },
  { href: "/dashboard/kitchen", label: "Kitchen", icon: ChefHat, roles: ["owner", "manager", "kitchen"] },
  { href: "/dashboard/orders", label: "Orders", icon: ClipboardList, roles: ["owner", "manager", "cashier", "waiter"] },
  { href: "/dashboard/tables", label: "Tables", icon: Grid3x3, roles: ["owner", "manager", "cashier", "waiter"] },
  { href: "/dashboard/bills", label: "Bills", icon: ReceiptText, roles: ["owner", "manager", "cashier"] },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [staffCount, setStaffCount] = useState<number | null>(null);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [myActivity, setMyActivity] = useState<MyActivity | null>(null);
  const [myActivityLoading, setMyActivityLoading] = useState(true);
  const canViewStaff = !!user && CAN_VIEW_STAFF.has(user.role);
  const canViewAnalytics = !!user && CAN_VIEW_ANALYTICS.has(user.role);
  const canViewMyActivity = !!user && CAN_VIEW_MY_ACTIVITY.has(user.role);

  useEffect(() => {
    if (!canViewStaff) return;
    listStaff()
      .then((s) => setStaffCount(s.length))
      .catch(() => {});
  }, [canViewStaff]);

  useEffect(() => {
    if (!canViewAnalytics) {
      setSummaryLoading(false);
      return;
    }
    getSummary(7)
      .then(setSummary)
      .catch(() => {})
      .finally(() => setSummaryLoading(false));
  }, [canViewAnalytics]);

  useEffect(() => {
    if (!canViewMyActivity) {
      setMyActivityLoading(false);
      return;
    }
    getMyActivity(7)
      .then(setMyActivity)
      .catch(() => {})
      .finally(() => setMyActivityLoading(false));
  }, [canViewMyActivity]);

  const visibleLinks = QUICK_LINKS.filter((l) => !l.roles || (user && l.roles.includes(user.role)));
  const weekSales = summary?.dailySales.reduce((sum, d) => sum + d.sales, 0) ?? 0;
  const weekOrders = summary?.dailySales.reduce((sum, d) => sum + d.orders, 0) ?? 0;
  const todayAvg = summary && summary.today.orders > 0 ? summary.today.sales / summary.today.orders : 0;
  const trendData = summary?.dailySales.map((d) => ({ ...d, label: formatShortDate(d.date) })) ?? [];

  const kpis = summary
    ? [
        { label: "Today's sales", value: currency(summary.today.sales), icon: IndianRupee, tint: "bg-green-50 text-green-600" },
        { label: "Today's bills", value: String(summary.today.orders), icon: ReceiptText, tint: "bg-blue-50 text-blue-600" },
        { label: "Avg order today", value: currency(todayAvg), icon: TrendingUp, tint: "bg-purple-50 text-purple-600" },
        { label: "7-day sales", value: currency(weekSales), icon: Wallet, tint: "bg-amber-50 text-amber-600" },
      ]
    : [];

  return (
    <AppShell title={user?.vendor?.name || "Dashboard"} nav={<VendorNav />}>
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-muted-foreground shadow-soft">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Building2 className="size-4.5" />
        </span>
        <span>
          Signed in to <span className="font-medium text-foreground">{user?.vendor?.name}</span>
          {user?.branch ? (
            <>
              {" "}
              &middot; branch <span className="font-medium text-foreground">{user.branch.name}</span>
            </>
          ) : (
            " · all branches"
          )}
        </span>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {visibleLinks.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="h-full transition-colors hover:border-brand-300 hover:bg-brand-50/30">
              <CardContent className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <l.icon className="size-4.5" />
                </span>
                <p className="text-sm font-medium text-foreground">{l.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {canViewAnalytics && (
        <div className="mb-6 space-y-4">
          {summaryLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading analytics...
            </div>
          ) : summary ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Sales trend (7 days)</CardTitle>
                  <Link href="/dashboard/reports">
                    <Button variant="ghost" size="sm">
                      Full reports
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="h-56">
                  {weekOrders === 0 ? (
                    <p className="text-sm text-muted-foreground">No sales recorded in the last 7 days.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trendData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="#e5e7eb" strokeWidth={1} />
                        <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                        <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `₹${v}`} />
                        <Tooltip
                          cursor={{ fill: "#f3f4f6" }}
                          formatter={(value) => [currency(Number(value)), "Sales"]}
                          labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ""}
                        />
                        <Bar dataKey="sales" fill="#2a78d6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      )}

      {canViewMyActivity && (
        <div className="mb-6">
          {myActivityLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading your activity...
            </div>
          ) : myActivity ? (
            <MyActivitySection activity={myActivity} showBills={user?.role === "cashier"} />
          ) : null}
        </div>
      )}

      {canViewStaff && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Users className="size-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">Staff</p>
                <p className="text-xs text-muted-foreground">
                  {staffCount === null ? "Loading..." : `${staffCount} member${staffCount === 1 ? "" : "s"}`} — add,
                  edit, or deactivate logins for your team.
                </p>
                {user?.vendor?.planLimits && staffCount !== null && (
                  <div className="mt-2 max-w-40">
                    <UsageBar used={staffCount} max={user.vendor.planLimits.maxUsers} label="Plan usage" />
                  </div>
                )}
              </div>
              <Link href="/dashboard/staff">
                <Button variant="secondary" size="sm">
                  Manage
                  <ChevronRight className="size-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {user?.role === "owner" && user.vendor && (
            <Card>
              <CardContent className="flex items-center gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Building2 className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">Branches</p>
                  <p className="text-xs text-muted-foreground">
                    {user.vendor.branchCount} branch{user.vendor.branchCount === 1 ? "" : "es"} — manage locations for
                    your outlets.
                  </p>
                  {user.vendor.planLimits && (
                    <div className="mt-2 max-w-40">
                      <UsageBar used={user.vendor.branchCount} max={user.vendor.planLimits.maxBranches} label="Plan usage" />
                    </div>
                  )}
                </div>
                <Link href="/dashboard/branches">
                  <Button variant="secondary" size="sm">
                    Manage
                    <ChevronRight className="size-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </AppShell>
  );
}

const ORDER_TYPE_LABELS: Record<string, string> = { dine_in: "Dine in", takeaway: "Takeaway", delivery: "Delivery" };

function MyActivitySection({ activity, showBills }: { activity: MyActivity; showBills: boolean }) {
  const { ordersCreated, billsGenerated } = activity;
  const orderTrend = ordersCreated.dailyTrend.map((d) => ({ ...d, label: formatShortDate(d.date) }));
  const billTrend = billsGenerated.dailyTrend.map((d) => ({ ...d, label: formatShortDate(d.date) }));
  const hasOrderActivity = orderTrend.some((d) => d.orders > 0);
  const hasBillActivity = billTrend.some((d) => d.orders > 0);

  const kpis = [
    { label: "Your orders today", value: String(ordersCreated.today.orders), icon: ClipboardList, tint: "bg-blue-50 text-blue-600" },
    { label: "Your order value today", value: currency(ordersCreated.today.sales), icon: IndianRupee, tint: "bg-green-50 text-green-600" },
    ...(showBills
      ? [
          { label: "Your bills today", value: String(billsGenerated.today.orders), icon: ReceiptText, tint: "bg-purple-50 text-purple-600" },
          { label: "Your collections today", value: currency(billsGenerated.today.sales), icon: Wallet, tint: "bg-amber-50 text-amber-600" },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-foreground">Your activity</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your orders (7 days)</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            {!hasOrderActivity ? (
              <p className="text-sm text-muted-foreground">No orders taken in the last 7 days.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e5e7eb" strokeWidth={1} />
                  <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                  <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                  <Tooltip cursor={{ fill: "#f3f4f6" }} formatter={(value) => [value, "Orders"]} />
                  <Bar dataKey="orders" fill="#2a78d6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {showBills ? (
          <Card>
            <CardHeader>
              <CardTitle>Your bills (7 days)</CardTitle>
            </CardHeader>
            <CardContent className="h-56">
              {!hasBillActivity ? (
                <p className="text-sm text-muted-foreground">No bills generated in the last 7 days.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={billTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#e5e7eb" strokeWidth={1} />
                    <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                    <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip cursor={{ fill: "#f3f4f6" }} formatter={(value) => [currency(Number(value)), "Sales"]} />
                    <Bar dataKey="sales" fill="#5a3ff0" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        ) : ordersCreated.orderTypes.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Your orders by type</CardTitle>
            </CardHeader>
            <CardContent className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={ordersCreated.orderTypes.map((t) => ({ ...t, label: ORDER_TYPE_LABELS[t.type] || t.type }))}
                  margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} stroke="#e5e7eb" strokeWidth={1} />
                  <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="label" tick={AXIS_STYLE} axisLine={false} tickLine={false} width={72} />
                  <Tooltip cursor={{ fill: "#f3f4f6" }} formatter={(value) => [value, "Orders"]} />
                  <Bar dataKey="orders" fill="#2a78d6" radius={[0, 4, 4, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {showBills && billsGenerated.paymentMethods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payments you collected</CardTitle>
          </CardHeader>
          <CardContent className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={billsGenerated.paymentMethods.map((m) => ({
                  ...m,
                  label: m.method[0].toUpperCase() + m.method.slice(1),
                }))}
                margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} stroke="#e5e7eb" strokeWidth={1} />
                <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <YAxis type="category" dataKey="label" tick={AXIS_STYLE} axisLine={false} tickLine={false} width={64} />
                <Tooltip cursor={{ fill: "#f3f4f6" }} formatter={(value) => [currency(Number(value)), "Amount"]} />
                <Bar dataKey="amount" fill="#1baf7a" radius={[0, 4, 4, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
