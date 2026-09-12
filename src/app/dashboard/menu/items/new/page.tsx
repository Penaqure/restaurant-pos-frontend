"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Plus, Trash2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import VendorNav from "@/components/layout/VendorNav";
import {
  listCategories,
  listTaxRates,
  createItem,
  MenuCategory,
  TaxRate,
} from "@/services/menuService";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

type VariantRow = { name: string; price: string; isDefault: boolean };
type AddonRow = { name: string; price: string };

export default function NewMenuItemPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [isVeg, setIsVeg] = useState(true);
  const [taxRateId, setTaxRateId] = useState("");
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [addons, setAddons] = useState<AddonRow[]>([]);

  useEffect(() => {
    // Functional updaters only fill in a default when the field is still
    // empty, so this can't clobber a selection the user already made -- e.g.
    // if this effect re-fires (React Strict Mode) after the user picked an
    // option in the gap between the first fetch resolving and the second.
    listCategories().then((cats) => {
      setCategories(cats);
      setCategoryId((prev) => prev || cats[0]?.id || "");
    });
    listTaxRates().then((rates) => {
      setTaxRates(rates);
      const def = rates.find((r) => r.isDefault);
      if (def) setTaxRateId((prev) => prev || def.id);
    });
  }, []);

  function updateVariant(i: number, patch: Partial<VariantRow>) {
    setVariants((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function updateAddon(i: number, patch: Partial<AddonRow>) {
    setAddons((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!categoryId) {
      toast.error("Add a category first");
      return;
    }
    setSubmitting(true);
    try {
      const item = await createItem({
        categoryId,
        name,
        description: description || undefined,
        basePrice: Number(basePrice),
        isVeg,
        taxRateId: taxRateId || undefined,
        variants: variants
          .filter((v) => v.name && v.price !== "")
          .map((v) => ({ name: v.name, price: Number(v.price), isDefault: v.isDefault })),
        addons: addons.filter((a) => a.name && a.price !== "").map((a) => ({ name: a.name, price: Number(a.price) })),
      });
      toast.success("Item created");
      router.push(`/dashboard/menu/items/${item.id}`);
    } catch {
      toast.error("Could not create item");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="New menu item" nav={<VendorNav />}>
      <Card className="max-w-2xl">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Category</label>
                <Select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  {categories.length === 0 && <option value="">No categories yet</option>}
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Tax rate</label>
                <Select value={taxRateId} onChange={(e) => setTaxRateId(e.target.value)}>
                  <option value="">Vendor default</option>
                  {taxRates.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.ratePercent}%)
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Name</label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Base price (₹)</label>
                <Input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <input
                  id="isVeg"
                  type="checkbox"
                  checked={isVeg}
                  onChange={(e) => setIsVeg(e.target.checked)}
                  className="size-4 accent-brand-600"
                />
                <label htmlFor="isVeg" className="text-sm text-foreground">
                  Vegetarian
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Variants (optional)</h3>
                <button
                  type="button"
                  onClick={() => setVariants((v) => [...v, { name: "", price: "", isDefault: v.length === 0 }])}
                  className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline"
                >
                  <Plus className="size-3.5" />
                  Add variant
                </button>
              </div>
              {variants.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="e.g. Half"
                    value={v.name}
                    onChange={(e) => updateVariant(i, { name: e.target.value })}
                    className="flex-1 py-1.5"
                  />
                  <Input
                    placeholder="Price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={v.price}
                    onChange={(e) => updateVariant(i, { price: e.target.value })}
                    className="w-28 py-1.5"
                  />
                  <button
                    type="button"
                    onClick={() => setVariants((rows) => rows.filter((_, idx) => idx !== i))}
                    className="flex size-8 shrink-0 items-center justify-center rounded-md text-danger hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Add-ons (optional)</h3>
                <button
                  type="button"
                  onClick={() => setAddons((a) => [...a, { name: "", price: "" }])}
                  className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline"
                >
                  <Plus className="size-3.5" />
                  Add add-on
                </button>
              </div>
              {addons.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="e.g. Extra Cheese"
                    value={a.name}
                    onChange={(e) => updateAddon(i, { name: e.target.value })}
                    className="flex-1 py-1.5"
                  />
                  <Input
                    placeholder="Price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={a.price}
                    onChange={(e) => updateAddon(i, { price: e.target.value })}
                    className="w-28 py-1.5"
                  />
                  <button
                    type="button"
                    onClick={() => setAddons((rows) => rows.filter((_, idx) => idx !== i))}
                    className="flex size-8 shrink-0 items-center justify-center rounded-md text-danger hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>

            <Button type="submit" loading={submitting} disabled={categories.length === 0}>
              {submitting ? "Creating..." : "Create item"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
