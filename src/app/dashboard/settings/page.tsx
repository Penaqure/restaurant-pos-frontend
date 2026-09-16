"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import { Building2, Loader2, Receipt, Save, Store, Upload } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import VendorNav from "@/components/layout/VendorNav";
import { useAuth } from "@/context/AuthContext";
import {
  getBillingSettings,
  updateBillingSettings,
  BillingSettings,
  getBrandingSettings,
  updateBrandingSettings,
  uploadBrandingLogo,
  BrandingSettings,
} from "@/services/vendorSettingsService";
import { BILL_PDF_SIZES, BillPdfSize } from "@/services/billService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/api\/?$/, "");

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<BillingSettings | null>(null);
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    Promise.all([getBillingSettings(), getBrandingSettings()])
      .then(([billing, brand]) => {
        setSettings(billing);
        setBranding(brand);
        setForbidden(false);
      })
      .catch((err) => {
        if (err?.response?.status === 403) setForbidden(true);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await updateBillingSettings(settings);
      setSettings(updated);
      toast.success("Billing settings saved — applied to every branch.");
    } catch {
      toast.error("Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBranding() {
    if (!branding) return;
    setSavingBranding(true);
    try {
      const updated = await updateBrandingSettings({ name: branding.name, brandColor: branding.brandColor });
      setBranding(updated);
      await refreshUser();
      toast.success("Branding saved");
    } catch {
      toast.error("Could not save branding");
    } finally {
      setSavingBranding(false);
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { logoUrl } = await uploadBrandingLogo(file);
      setBranding((b) => (b ? { ...b, logoUrl } : b));
      await refreshUser();
      toast.success("Logo updated");
    } catch {
      toast.error("Could not upload logo");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (user && user.role !== "owner") {
    return (
      <AppShell title="Settings" nav={<VendorNav />}>
        <p className="text-sm text-muted-foreground">
          Your role doesn&apos;t have access to settings. Ask an owner if you need this.
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Settings" nav={<VendorNav />}>
      {forbidden ? (
        <p className="text-sm text-muted-foreground">
          Your role doesn&apos;t have access to settings. Ask an owner if you need this.
        </p>
      ) : loading || !settings || !branding ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading...
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="size-4 text-muted-foreground" />
              Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Your logo and brand color show up across the dashboard sidebar, printed bills, and the customer-facing
              QR order page.
            </p>

            <div className="flex items-center gap-4">
              <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-foreground/5 text-muted-foreground">
                {branding.logoUrl ? (
                  <Image
                    src={`${API_ORIGIN}${branding.logoUrl}`}
                    alt={branding.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <Building2 className="size-6" />
                )}
              </div>
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={uploadingLogo}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {!uploadingLogo && <Upload className="size-3.5" />}
                  {branding.logoUrl ? "Replace logo" : "Upload logo"}
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleLogoChange} />
                <p className="mt-1 text-xs text-muted-foreground">PNG/JPG/WEBP, up to 5MB.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Restaurant name</label>
                <Input
                  value={branding.name}
                  onChange={(e) => setBranding({ ...branding, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Brand color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.brandColor}
                    onChange={(e) => setBranding({ ...branding, brandColor: e.target.value })}
                    className="size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
                  />
                  <Input
                    value={branding.brandColor}
                    onChange={(e) => setBranding({ ...branding, brandColor: e.target.value })}
                    className="font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveBranding} loading={savingBranding}>
                <Save className="size-4" />
                Save branding
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="size-4 text-muted-foreground" />
              Bill &amp; invoice printing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">
              These settings apply to every branch, so all your outlets print bills the same way.
            </p>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Default paper size</label>
              <p className="mb-1.5 text-xs text-muted-foreground">
                Used automatically when printing or viewing a bill. Staff can still pick a different size for a
                one-off print.
              </p>
              <Select
                value={settings.defaultBillSize}
                onChange={(e) => setSettings({ ...settings, defaultBillSize: e.target.value as BillPdfSize })}
                className="max-w-xs"
              >
                {BILL_PDF_SIZES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="billShowLogo"
                type="checkbox"
                checked={settings.billShowLogo}
                onChange={(e) => setSettings({ ...settings, billShowLogo: e.target.checked })}
                className="size-4 accent-brand-600"
              />
              <label htmlFor="billShowLogo" className="text-sm text-foreground">
                Show restaurant logo on bills
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="billShowGst"
                type="checkbox"
                checked={settings.billShowGst}
                onChange={(e) => setSettings({ ...settings, billShowGst: e.target.checked })}
                className="size-4 accent-brand-600"
              />
              <label htmlFor="billShowGst" className="text-sm text-foreground">
                Show GST rate breakdown on bills
              </label>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Footer note</label>
              <p className="mb-1.5 text-xs text-muted-foreground">
                Printed at the bottom of every bill, e.g. a thank-you message or return policy. Leave blank for the
                default message.
              </p>
              <Input
                value={settings.billFooterNote || ""}
                onChange={(e) => setSettings({ ...settings, billFooterNote: e.target.value })}
                placeholder="Thank you for dining with us!"
                maxLength={280}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} loading={saving}>
                <Save className="size-4" />
                Save changes
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      )}
    </AppShell>
  );
}
