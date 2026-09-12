"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff, Minus, Plus, X } from "lucide-react";
import { MenuItem } from "@/services/menuService";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/api\/?$/, "");

export type CartAddon = { addonId: string; name: string; price: number; quantity: number };
export type CartLine = {
  key: string;
  menuItemId: string;
  name: string;
  variantId?: string;
  variantName?: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
  addons: CartAddon[];
};

export default function ItemPickerModal({
  item,
  onClose,
  onAdd,
}: {
  item: MenuItem;
  onClose: () => void;
  onAdd: (line: CartLine) => void;
}) {
  const defaultVariant = item.variants.find((v) => v.isDefault) || item.variants[0];
  const [variantId, setVariantId] = useState(defaultVariant?.id || "");
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const variant = item.variants.find((v) => v.id === variantId);
  const unitPrice = variant ? Number(variant.price) : Number(item.basePrice);
  const selectedAddons = item.addons.filter((a) => addonIds.includes(a.id));
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + Number(a.price), 0);
  const lineTotal = (unitPrice + addonsTotal) * quantity;

  function toggleAddon(id: string) {
    setAddonIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  function handleAdd() {
    onAdd({
      key: `${item.id}-${variantId}-${addonIds.sort().join(",")}-${Date.now()}`,
      menuItemId: item.id,
      name: item.name,
      variantId: variant?.id,
      variantName: variant?.name,
      unitPrice,
      quantity,
      notes: notes || undefined,
      addons: selectedAddons.map((a) => ({ addonId: a.id, name: a.name, price: Number(a.price), quantity: 1 })),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl bg-surface-card p-5 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/5 text-muted-foreground">
              {item.imageUrl ? (
                <Image src={`${API_ORIGIN}${item.imageUrl}`} alt={item.name} fill unoptimized className="object-cover" />
              ) : (
                <ImageOff className="size-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-sm border ${
                    item.isVeg ? "border-green-600 bg-green-600" : "border-red-600 bg-red-600"
                  }`}
                />
                <h3 className="text-base font-semibold text-foreground">{item.name}</h3>
              </div>
              <p className="font-mono text-xs text-muted-foreground">₹{item.basePrice}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-black/5"
          >
            <X className="size-4" />
          </button>
        </div>

        {item.variants.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Variant</p>
            {item.variants.map((v) => (
              <label key={v.id} className="flex items-center justify-between text-sm text-foreground">
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="variant"
                    checked={variantId === v.id}
                    onChange={() => setVariantId(v.id)}
                    className="accent-brand-600"
                  />
                  {v.name}
                </span>
                <span className="font-mono">₹{v.price}</span>
              </label>
            ))}
          </div>
        )}

        {item.addons.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Add-ons</p>
            {item.addons.map((a) => (
              <label key={a.id} className="flex items-center justify-between text-sm text-foreground">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={addonIds.includes(a.id)}
                    onChange={() => toggleAddon(a.id)}
                    className="accent-brand-600"
                  />
                  {a.name}
                </span>
                <span className="font-mono">+₹{a.price}</span>
              </label>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Quantity</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-black/5"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-6 text-center text-sm text-foreground">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-black/5"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </div>

        <Input
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-3 py-1.5"
        />

        <div className="mt-4 flex items-center justify-between">
          <button onClick={onClose} className="text-sm text-muted-foreground hover:underline">
            Cancel
          </button>
          <Button onClick={handleAdd}>Add · ₹{lineTotal.toFixed(2)}</Button>
        </div>
      </div>
    </div>
  );
}
