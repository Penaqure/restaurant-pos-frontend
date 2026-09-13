"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import { ImageOff, Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { listCategories, listItems, MenuCategory, MenuItem } from "@/services/menuService";
import { addOrderItems } from "@/services/orderService";
import ItemPickerModal, { CartLine } from "@/components/pos/ItemPickerModal";
import Button from "@/components/ui/Button";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/api\/?$/, "");

export default function AddItemsModal({
  orderId,
  onClose,
  onAdded,
}: {
  orderId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");
  const [pickerItem, setPickerItem] = useState<MenuItem | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listCategories().then(setCategories);
    listItems().then(setItems);
  }, []);

  const visibleItems = items.filter((i) => i.isAvailable && (activeCategory === "all" || i.categoryId === activeCategory));

  function addToCart(line: CartLine) {
    setCart((c) => [...c, line]);
  }
  function removeFromCart(key: string) {
    setCart((c) => c.filter((l) => l.key !== key));
  }
  function updateQuantity(key: string, delta: number) {
    setCart((c) => c.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, l.quantity + delta) } : l)));
  }

  const estimatedTotal = cart.reduce(
    (sum, l) => sum + (l.unitPrice + l.addons.reduce((s, a) => s + a.price, 0)) * l.quantity,
    0
  );

  async function handleSubmit() {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      await addOrderItems(
        orderId,
        cart.map((l) => ({
          menuItemId: l.menuItemId,
          variantId: l.variantId,
          quantity: l.quantity,
          notes: l.notes,
          addons: l.addons.map((a) => ({ addonId: a.addonId, quantity: a.quantity })),
        }))
      );
      toast.success("Items added to order");
      onAdded();
      onClose();
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(message || "Could not add items");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-surface-card shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Add items to order</h3>
            <p className="text-xs text-muted-foreground">New items go back to the kitchen for preparation.</p>
          </div>
          <button
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-black/5"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden sm:flex-row">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory("all")}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeCategory === "all"
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-border bg-surface-card text-muted-foreground hover:border-brand-300"
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeCategory === c.id
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-border bg-surface-card text-muted-foreground hover:border-brand-300"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {visibleItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setPickerItem(item)}
                  className="overflow-hidden rounded-xl border border-border bg-surface-card text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card"
                >
                  <div className="relative aspect-square w-full bg-black/5 text-muted-foreground">
                    {item.imageUrl ? (
                      <Image
                        src={`${API_ORIGIN}${item.imageUrl}`}
                        alt={item.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageOff className="size-6" />
                      </div>
                    )}
                    <span
                      className={`absolute left-1.5 top-1.5 inline-block size-2.5 rounded-sm border bg-surface-card ${
                        item.isVeg ? "border-green-600" : "border-red-600"
                      }`}
                    >
                      <span className={`block size-full scale-[0.55] rounded-[1px] ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                    </span>
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">₹{item.basePrice}</p>
                  </div>
                </button>
              ))}
              {visibleItems.length === 0 && <p className="text-sm text-muted-foreground">No items in this category.</p>}
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col border-t border-border p-4 sm:w-64 sm:border-l sm:border-t-0">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShoppingCart className="size-4 text-muted-foreground" />
              New items
            </p>
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-xs text-muted-foreground">No items yet.</p>
              ) : (
                <ul className="space-y-3">
                  {cart.map((l) => (
                    <li key={l.key} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground">
                          {l.name}
                          {l.variantName && <span className="text-muted-foreground"> ({l.variantName})</span>}
                        </span>
                        <button
                          onClick={() => removeFromCart(l.key)}
                          className="flex size-6 items-center justify-center rounded text-danger hover:bg-red-50"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                      {l.addons.length > 0 && (
                        <p className="text-xs text-muted-foreground">+ {l.addons.map((a) => a.name).join(", ")}</p>
                      )}
                      <div className="mt-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(l.key, -1)}
                            className="flex size-6 items-center justify-center rounded border border-border text-muted-foreground hover:bg-black/5"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-4 text-center text-xs text-foreground">{l.quantity}</span>
                          <button
                            onClick={() => updateQuantity(l.key, 1)}
                            className="flex size-6 items-center justify-center rounded border border-border text-muted-foreground hover:bg-black/5"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">
                          ₹{((l.unitPrice + l.addons.reduce((s, a) => s + a.price, 0)) * l.quantity).toFixed(2)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
              <span className="text-muted-foreground">Estimated subtotal</span>
              <span className="font-mono font-medium text-foreground">₹{estimatedTotal.toFixed(2)}</span>
            </div>
            <Button onClick={handleSubmit} loading={submitting} disabled={cart.length === 0} className="mt-3 w-full">
              {submitting ? "Adding..." : "Add to order"}
            </Button>
          </div>
        </div>
      </div>

      {pickerItem && <ItemPickerModal item={pickerItem} onClose={() => setPickerItem(null)} onAdd={addToCart} />}
    </div>
  );
}
