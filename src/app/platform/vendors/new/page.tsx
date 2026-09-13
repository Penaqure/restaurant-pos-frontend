"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import AppShell from "@/components/layout/AppShell";
import PlatformNav from "@/components/layout/PlatformNav";
import { createVendor, CURRENCY_OPTIONS, COUNTRY_OPTIONS, TIMEZONE_OPTIONS } from "@/services/vendorService";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

const initialForm = {
  vendorName: "",
  contactEmail: "",
  contactPhone: "",
  gstin: "",
  branchName: "",
  currency: "INR",
  country: "IN",
  timezone: "Asia/Kolkata",
  invoicePrefix: "INV",
  defaultTaxRatePercent: "0",
  ownerFirstName: "",
  ownerLastName: "",
  ownerEmail: "",
  ownerPassword: "",
};

type FormState = typeof initialForm;

export default function NewVendorPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createVendor({
        ...form,
        defaultTaxRatePercent: Number(form.defaultTaxRatePercent),
      });
      toast.success("Vendor onboarded");
      router.push("/platform");
    } catch {
      toast.error("Could not create vendor");
    } finally {
      setSubmitting(false);
    }
  }

  const textFields: { key: keyof FormState; label: string; required?: boolean; type?: string }[] = [
    { key: "vendorName", label: "Restaurant / vendor name", required: true },
    { key: "contactEmail", label: "Contact email", required: true, type: "email" },
    { key: "contactPhone", label: "Contact phone" },
    { key: "gstin", label: "GSTIN" },
    { key: "branchName", label: "First branch name" },
  ];

  const ownerFields: { key: keyof FormState; label: string; required?: boolean; type?: string }[] = [
    { key: "ownerFirstName", label: "Owner first name", required: true },
    { key: "ownerLastName", label: "Owner last name" },
    { key: "ownerEmail", label: "Owner login email", required: true, type: "email" },
    { key: "ownerPassword", label: "Owner temporary password", required: true, type: "password" },
  ];

  return (
    <AppShell title="Onboard a vendor" nav={<PlatformNav />}>
      <Card className="max-w-xl">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {textFields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{f.label}</label>
                <Input type={f.type || "text"} required={f.required} value={form[f.key]} onChange={update(f.key)} />
              </div>
            ))}

            <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Country</label>
                <Select value={form.country} onChange={update("country")}>
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Currency</label>
                <Select value={form.currency} onChange={update("currency")}>
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Timezone</label>
                <Select value={form.timezone} onChange={update("timezone")}>
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Invoice prefix</label>
                <Input value={form.invoicePrefix} onChange={update("invoicePrefix")} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Default tax rate (%)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.defaultTaxRatePercent}
                  onChange={update("defaultTaxRatePercent")}
                />
              </div>
            </div>

            <div className="space-y-4 border-t border-border pt-4">
              {ownerFields.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{f.label}</label>
                  <Input type={f.type || "text"} required={f.required} value={form[f.key]} onChange={update(f.key)} />
                </div>
              ))}
            </div>

            <Button type="submit" loading={submitting}>
              {submitting ? "Creating..." : "Create vendor"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
