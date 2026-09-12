"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Loader2, Receipt, Save } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import VendorNav from "@/components/layout/VendorNav";
import { useAuth } from "@/context/AuthContext";
import { getBillingSettings, updateBillingSettings, BillingSettings } from "@/services/vendorSettingsService";
import { BILL_PDF_SIZES, BillPdfSize } from "@/services/billService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<BillingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    getBillingSettings()
      .then((s) => {
        setSettings(s);
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
      ) : loading || !settings ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading...
        </div>
      ) : (
        <Card className="max-w-xl">
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
      )}
    </AppShell>
  );
}
