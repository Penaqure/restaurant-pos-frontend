"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-toastify";
import { Building2, CreditCard, Globe, Loader2, Power, ShieldAlert, Store, Trash2, Upload, Users } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import PlatformNav from "@/components/layout/PlatformNav";
import {
  getVendor,
  updateVendor,
  deleteVendor,
  uploadVendorLogo,
  listPlans,
  Vendor,
  SubscriptionPlan,
  CURRENCY_OPTIONS,
  COUNTRY_OPTIONS,
  TIMEZONE_OPTIONS,
} from "@/services/vendorService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import UsageBar from "@/components/ui/UsageBar";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/api\/?$/, "");

const PLAN_STATUS_TONE: Record<Vendor["planStatus"], "brand" | "success" | "danger"> = {
  trial: "brand",
  active: "success",
  suspended: "danger",
};

export default function VendorDetailPage(props: PageProps<"/platform/vendors/[vendorId]">) {
  const { vendorId } = use(props.params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"disable" | "delete" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    contactEmail: "",
    contactPhone: "",
    gstin: "",
    brandColor: "#c81e1e",
    planId: "",
    planStatus: "trial" as Vendor["planStatus"],
    currency: "INR",
    country: "IN",
    timezone: "Asia/Kolkata",
    invoicePrefix: "INV",
    defaultTaxRatePercent: "0",
  });

  function refresh() {
    return Promise.all([getVendor(vendorId), listPlans()]).then(([v, p]) => {
      setVendor(v);
      setPlans(p);
      setForm({
        name: v.name,
        contactEmail: v.contactEmail,
        contactPhone: v.contactPhone || "",
        gstin: v.gstin || "",
        brandColor: v.brandColor,
        planId: v.planId || "",
        planStatus: v.planStatus,
        currency: v.currency,
        country: v.country,
        timezone: v.timezone,
        invoicePrefix: v.invoicePrefix,
        defaultTaxRatePercent: v.defaultTaxRatePercent,
      });
      setLoading(false);
    });
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateVendor(vendorId, {
        name: form.name,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone || undefined,
        gstin: form.gstin || undefined,
        brandColor: form.brandColor,
        planId: form.planId || null,
        planStatus: form.planStatus,
        currency: form.currency,
        country: form.country,
        timezone: form.timezone,
        invoicePrefix: form.invoicePrefix,
        defaultTaxRatePercent: Number(form.defaultTaxRatePercent),
      });
      toast.success("Vendor updated");
      await refresh();
    } catch {
      toast.error("Could not update vendor");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadVendorLogo(vendorId, file);
      toast.success("Logo updated");
      await refresh();
    } catch {
      toast.error("Could not upload logo");
    }
  }

  async function handleEnable() {
    try {
      await updateVendor(vendorId, { isActive: true });
      toast.success("Vendor re-enabled");
      await refresh();
    } catch {
      toast.error("Could not enable vendor");
    }
  }

  async function handleConfirmDisable() {
    setActionLoading(true);
    try {
      await updateVendor(vendorId, { isActive: false });
      toast.success("Vendor disabled — all its users are now blocked from logging in");
      setConfirmAction(null);
      await refresh();
    } catch {
      toast.error("Could not disable vendor");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirmDelete() {
    setActionLoading(true);
    try {
      await deleteVendor(vendorId);
      toast.success("Vendor deleted");
      router.push("/platform");
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Could not delete vendor";
      toast.error(message);
      setActionLoading(false);
      setConfirmAction(null);
    }
  }

  if (loading || !vendor) {
    return (
      <AppShell title="Vendor" nav={<PlatformNav />}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading...
        </div>
      </AppShell>
    );
  }

  const selectedPlan = plans.find((p) => p.id === form.planId);
  const effectiveMaxUsers = selectedPlan?.maxUsers ?? vendor.plan?.maxUsers;
  const effectiveMaxBranches = selectedPlan?.maxBranches ?? vendor.plan?.maxBranches;

  return (
    <AppShell title={vendor.name} nav={<PlatformNav />}>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="size-4 text-muted-foreground" />
              Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-black/5 text-muted-foreground">
                {vendor.logoUrl ? (
                  <Image src={`${API_ORIGIN}${vendor.logoUrl}`} alt={vendor.name} fill unoptimized className="object-cover" />
                ) : (
                  <Building2 className="size-6" />
                )}
              </div>
              <div>
                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="size-3.5" />
                  {vendor.logoUrl ? "Replace logo" : "Upload logo"}
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleLogoChange} />
                <p className="mt-1 text-xs text-muted-foreground">Shown in the vendor&apos;s sidebar. PNG/JPG/WEBP, up to 5MB.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Store name</label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Brand color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.brandColor}
                    onChange={(e) => setForm((f) => ({ ...f, brandColor: e.target.value }))}
                    className="size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
                  />
                  <Input
                    value={form.brandColor}
                    onChange={(e) => setForm((f) => ({ ...f, brandColor: e.target.value }))}
                    className="font-mono uppercase"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Contact email</label>
                <Input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Contact phone</label>
                <Input
                  value={form.contactPhone}
                  onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground">GSTIN</label>
                <Input value={form.gstin} onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value }))} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-4 text-muted-foreground" />
              Regional &amp; billing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Country</label>
                <Select value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}>
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-muted-foreground">
                  Drives tax formatting on bills — India shows GST split as CGST/SGST.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Currency</label>
                <Select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Timezone</label>
                <Select value={form.timezone} onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}>
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Invoice prefix</label>
                <Input
                  value={form.invoicePrefix}
                  onChange={(e) => setForm((f) => ({ ...f, invoicePrefix: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Default tax rate (%)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.defaultTaxRatePercent}
                  onChange={(e) => setForm((f) => ({ ...f, defaultTaxRatePercent: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-4 text-muted-foreground" />
              Plan &amp; limits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Plan</label>
                <Select
                  value={form.planId}
                  onChange={(e) => setForm((f) => ({ ...f, planId: e.target.value }))}
                >
                  <option value="">No plan (unrestricted)</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.maxUsers} users, {p.maxBranches} branches
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Plan status</label>
                <Select
                  value={form.planStatus}
                  onChange={(e) => setForm((f) => ({ ...f, planStatus: e.target.value as Vendor["planStatus"] }))}
                >
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Current status:</span>
              <Badge tone={PLAN_STATUS_TONE[vendor.planStatus]}>{vendor.planStatus}</Badge>
            </div>

            {effectiveMaxUsers !== undefined && effectiveMaxBranches !== undefined ? (
              <div className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-2">
                <UsageBar used={vendor.userCount ?? 0} max={effectiveMaxUsers} label="Staff accounts" />
                <UsageBar used={vendor.branches?.length ?? 0} max={effectiveMaxBranches} label="Branches" />
              </div>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="size-3.5" />
                No plan assigned — this vendor currently has no user/branch limit.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-between gap-3">
            <Badge tone={vendor.isActive ? "success" : "danger"}>{vendor.isActive ? "Active" : "Disabled"}</Badge>
            <Button onClick={handleSave} loading={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-danger">
              <ShieldAlert className="size-4" />
              Danger zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {vendor.isActive ? "Disable this vendor" : "Vendor is disabled"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {vendor.isActive
                    ? "Immediately blocks every user of this vendor from logging in, without deleting any data."
                    : "All users of this vendor are currently blocked from logging in."}
                </p>
              </div>
              {vendor.isActive ? (
                <Button variant="secondary" className="shrink-0" onClick={() => setConfirmAction("disable")}>
                  <Power className="size-4" />
                  Disable
                </Button>
              ) : (
                <Button className="shrink-0" onClick={handleEnable}>
                  <Power className="size-4" />
                  Enable
                </Button>
              )}
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Delete this vendor</p>
                <p className="text-xs text-muted-foreground">
                  Permanently removes the vendor, its branches, staff, and menu. Blocked if it has any orders on record.
                </p>
              </div>
              <Button variant="danger" className="shrink-0" onClick={() => setConfirmAction("delete")}>
                <Trash2 className="size-4" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>

      {confirmAction === "disable" && (
        <ConfirmDialog
          title="Disable this vendor?"
          description={`${vendor.name} and all ${vendor.userCount ?? 0} of its user(s) will be immediately signed out and unable to log in. You can re-enable it anytime.`}
          confirmLabel="Disable vendor"
          loading={actionLoading}
          onConfirm={handleConfirmDisable}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === "delete" && (
        <ConfirmDialog
          title="Delete this vendor?"
          description={`This permanently deletes ${vendor.name}, its branches, staff, and menu data. This cannot be undone.`}
          confirmLabel="Delete vendor"
          loading={actionLoading}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </AppShell>
  );
}
