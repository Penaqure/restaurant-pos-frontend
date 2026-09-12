"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-toastify";
import { ImageOff, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import VendorNav from "@/components/layout/VendorNav";
import {
  getItem,
  updateItem,
  deleteItem,
  uploadItemImage,
  addVariant,
  updateVariant,
  deleteVariant,
  addAddon,
  updateAddon,
  deleteAddon,
  listCategories,
  listTaxRates,
  MenuItem,
  MenuCategory,
  TaxRate,
} from "@/services/menuService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/api\/?$/, "");

const emptyVariantForm = { name: "", price: "", isDefault: false };
const emptyAddonForm = { name: "", price: "" };

export default function MenuItemDetailPage(props: PageProps<"/dashboard/menu/items/[itemId]">) {
  const { itemId } = use(props.params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [item, setItem] = useState<MenuItem | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [detailsForm, setDetailsForm] = useState({
    name: "",
    description: "",
    basePrice: "",
    categoryId: "",
    taxRateId: "",
    isVeg: true,
  });

  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [variantForm, setVariantForm] = useState(emptyVariantForm);
  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
  const [addonForm, setAddonForm] = useState(emptyAddonForm);
  const [deleteItemConfirm, setDeleteItemConfirm] = useState(false);
  const [deletingItem, setDeletingItem] = useState(false);

  function refresh() {
    return getItem(itemId).then((data) => {
      setItem(data);
      setDetailsForm({
        name: data.name,
        description: data.description || "",
        basePrice: data.basePrice,
        categoryId: data.categoryId,
        taxRateId: data.taxRateId || "",
        isVeg: data.isVeg,
      });
      setLoading(false);
    });
  }

  useEffect(() => {
    refresh();
    listCategories().then(setCategories);
    listTaxRates().then(setTaxRates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    setSaving(true);
    try {
      await updateItem(item.id, {
        name: detailsForm.name,
        description: detailsForm.description || undefined,
        basePrice: Number(detailsForm.basePrice),
        categoryId: detailsForm.categoryId,
        taxRateId: detailsForm.taxRateId || undefined,
        isVeg: detailsForm.isVeg,
      });
      toast.success("Item updated");
      await refresh();
    } catch {
      toast.error("Could not update item");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailability() {
    if (!item) return;
    await updateItem(item.id, { isAvailable: !item.isAvailable });
    toast.success(item.isAvailable ? "Marked unavailable" : "Marked available");
    refresh();
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !item) return;
    try {
      await uploadItemImage(item.id, file);
      toast.success("Image updated");
      refresh();
    } catch {
      toast.error("Could not upload image");
    }
  }

  function startEditVariant(v: MenuItem["variants"][number]) {
    setEditingVariantId(v.id);
    setVariantForm({ name: v.name, price: v.price, isDefault: v.isDefault });
  }
  function resetVariantForm() {
    setEditingVariantId(null);
    setVariantForm(emptyVariantForm);
  }
  async function handleSubmitVariant(e: React.FormEvent) {
    e.preventDefault();
    if (!item || !variantForm.name || variantForm.price === "") return;
    try {
      if (editingVariantId) {
        await updateVariant(item.id, editingVariantId, {
          name: variantForm.name,
          price: Number(variantForm.price),
          isDefault: variantForm.isDefault,
        });
        toast.success("Variant updated");
      } else {
        await addVariant(item.id, { name: variantForm.name, price: Number(variantForm.price) });
        toast.success("Variant added");
      }
      resetVariantForm();
      refresh();
    } catch {
      toast.error(editingVariantId ? "Could not update variant" : "Could not add variant");
    }
  }

  function startEditAddon(a: MenuItem["addons"][number]) {
    setEditingAddonId(a.id);
    setAddonForm({ name: a.name, price: a.price });
  }
  function resetAddonForm() {
    setEditingAddonId(null);
    setAddonForm(emptyAddonForm);
  }
  async function handleSubmitAddon(e: React.FormEvent) {
    e.preventDefault();
    if (!item || !addonForm.name || addonForm.price === "") return;
    try {
      if (editingAddonId) {
        await updateAddon(item.id, editingAddonId, { name: addonForm.name, price: Number(addonForm.price) });
        toast.success("Add-on updated");
      } else {
        await addAddon(item.id, { name: addonForm.name, price: Number(addonForm.price) });
        toast.success("Add-on added");
      }
      resetAddonForm();
      refresh();
    } catch {
      toast.error(editingAddonId ? "Could not update add-on" : "Could not add add-on");
    }
  }

  async function handleConfirmDeleteItem() {
    if (!item) return;
    setDeletingItem(true);
    try {
      await deleteItem(item.id);
      toast.success("Item deleted");
      router.push("/dashboard/menu/items");
    } catch {
      toast.error("Could not delete item");
      setDeletingItem(false);
    }
  }

  if (loading || !item) {
    return (
      <AppShell title="Menu item" nav={<VendorNav />}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={item.name} nav={<VendorNav />}>
      <div className="grid max-w-3xl gap-6">
        <Card>
          <CardContent className="flex gap-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-black/5 text-muted-foreground">
              {item.imageUrl ? (
                <Image
                  src={`${API_ORIGIN}${item.imageUrl}`}
                  alt={item.name}
                  width={96}
                  height={96}
                  className="h-24 w-24 object-cover"
                  unoptimized
                />
              ) : (
                <ImageOff className="size-6" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {item.isAvailable ? "Available" : "Unavailable"} on POS
                </p>
                <button
                  onClick={() => setDeleteItemConfirm(true)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-danger hover:bg-red-50"
                >
                  <Trash2 className="size-3.5" />
                  Delete item
                </button>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="size-3.5" />
                  {item.imageUrl ? "Replace image" : "Upload image"}
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
                <Button variant="secondary" size="sm" onClick={toggleAvailability}>
                  {item.isAvailable ? "Mark unavailable" : "Mark available"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Item details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveDetails} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Category</label>
                  <Select
                    required
                    value={detailsForm.categoryId}
                    onChange={(e) => setDetailsForm((f) => ({ ...f, categoryId: e.target.value }))}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Tax rate</label>
                  <Select
                    value={detailsForm.taxRateId}
                    onChange={(e) => setDetailsForm((f) => ({ ...f, taxRateId: e.target.value }))}
                  >
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
                <Input
                  required
                  value={detailsForm.name}
                  onChange={(e) => setDetailsForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Input
                  value={detailsForm.description}
                  onChange={(e) => setDetailsForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Base price (₹)</label>
                  <Input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={detailsForm.basePrice}
                    onChange={(e) => setDetailsForm((f) => ({ ...f, basePrice: e.target.value }))}
                  />
                </div>
                <div className="flex items-end gap-2 pb-2">
                  <input
                    id="isVeg"
                    type="checkbox"
                    checked={detailsForm.isVeg}
                    onChange={(e) => setDetailsForm((f) => ({ ...f, isVeg: e.target.checked }))}
                    className="size-4 accent-brand-600"
                  />
                  <label htmlFor="isVeg" className="text-sm text-foreground">
                    Vegetarian
                  </label>
                </div>
              </div>

              <Button type="submit" loading={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Variants</CardTitle>
          </CardHeader>
          <CardContent>
            {item.variants.length > 0 && (
              <ul className="mb-3 divide-y divide-border">
                {item.variants.map((v) => (
                  <li key={v.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-foreground">
                      {v.name} {v.isDefault && <span className="text-xs text-muted-foreground">(default)</span>}
                    </span>
                    <span className="flex items-center gap-3 font-mono">
                      ₹{v.price}
                      <span className="flex gap-1 font-sans">
                        <button
                          onClick={() => startEditVariant(v)}
                          className="rounded px-1.5 py-0.5 text-xs text-brand-700 hover:bg-brand-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteVariant(item.id, v.id).then(refresh)}
                          className="rounded px-1.5 py-0.5 text-xs text-danger hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={handleSubmitVariant} className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="e.g. Half"
                  value={variantForm.name}
                  onChange={(e) => setVariantForm((f) => ({ ...f, name: e.target.value }))}
                  className="flex-1 py-1.5"
                />
                <Input
                  placeholder="Price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={variantForm.price}
                  onChange={(e) => setVariantForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-28 py-1.5"
                />
                <Button type="submit" variant="secondary" size="sm">
                  {editingVariantId ? "Save" : <Plus className="size-3.5" />}
                  {editingVariantId ? "" : "Add"}
                </Button>
                {editingVariantId && (
                  <Button type="button" variant="ghost" size="sm" onClick={resetVariantForm}>
                    Cancel
                  </Button>
                )}
              </div>
              {editingVariantId && (
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={variantForm.isDefault}
                    onChange={(e) => setVariantForm((f) => ({ ...f, isDefault: e.target.checked }))}
                    className="size-3.5 accent-brand-600"
                  />
                  Default variant
                </label>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add-ons</CardTitle>
          </CardHeader>
          <CardContent>
            {item.addons.length > 0 && (
              <ul className="mb-3 divide-y divide-border">
                {item.addons.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-foreground">{a.name}</span>
                    <span className="flex items-center gap-3 font-mono">
                      ₹{a.price}
                      <span className="flex gap-1 font-sans">
                        <button
                          onClick={() => startEditAddon(a)}
                          className="rounded px-1.5 py-0.5 text-xs text-brand-700 hover:bg-brand-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteAddon(item.id, a.id).then(refresh)}
                          className="rounded px-1.5 py-0.5 text-xs text-danger hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={handleSubmitAddon} className="flex items-center gap-2">
              <Input
                placeholder="e.g. Extra Cheese"
                value={addonForm.name}
                onChange={(e) => setAddonForm((f) => ({ ...f, name: e.target.value }))}
                className="flex-1 py-1.5"
              />
              <Input
                placeholder="Price"
                type="number"
                min="0"
                step="0.01"
                value={addonForm.price}
                onChange={(e) => setAddonForm((f) => ({ ...f, price: e.target.value }))}
                className="w-28 py-1.5"
              />
              <Button type="submit" variant="secondary" size="sm">
                {editingAddonId ? "Save" : <Plus className="size-3.5" />}
                {editingAddonId ? "" : "Add"}
              </Button>
              {editingAddonId && (
                <Button type="button" variant="ghost" size="sm" onClick={resetAddonForm}>
                  Cancel
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {deleteItemConfirm && (
        <ConfirmDialog
          title="Delete this item?"
          description={`"${item.name}" and all its variants and add-ons will be permanently removed.`}
          confirmLabel="Delete item"
          loading={deletingItem}
          onConfirm={handleConfirmDeleteItem}
          onCancel={() => setDeleteItemConfirm(false)}
        />
      )}
    </AppShell>
  );
}
