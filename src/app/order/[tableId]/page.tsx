"use client";

import { use, useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import {
  CheckCircle2,
  ChefHat,
  ImageOff,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { getPublicMenu, placePublicOrder, PublicMenu, PublicOrderResult } from "@/services/publicOrderService";
import ItemPickerModal, { CartLine } from "@/components/pos/ItemPickerModal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/api\/?$/, "");

export default function PublicOrderPage(props: PageProps<"/order/[tableId]">) {
  const { tableId } = use(props.params);
  const [menu, setMenu] = useState<PublicMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [pickerItem, setPickerItem] = useState<PublicMenu["items"][number] | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<PublicOrderResult | null>(null);

  useEffect(() => {
    getPublicMenu(tableId)
      .then(setMenu)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [tableId]);

  function addToCart(line: CartLine) {
    setCart((c) => [...c, line]);
    setCartOpen(true);
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
  const cartCount = cart.reduce((sum, l) => sum + l.quantity, 0);

  async function handlePlaceOrder() {
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      const result = await placePublicOrder({
        tableId,
        customerName: customerName || undefined,
        items: cart.map((l) => ({
          menuItemId: l.menuItemId,
          variantId: l.variantId,
          quantity: l.quantity,
          notes: l.notes,
          addons: l.addons.map((a) => ({ addonId: a.addonId, quantity: a.quantity })),
        })),
      });
      setPlaced(result);
      setCart([]);
      setCartOpen(false);
    } catch {
      toast.error("Could not place your order. Please tell the staff.");
    } finally {
      setPlacing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Loader2 className="size-6 animate-spin text-brand-600" />
      </div>
    );
  }

  if (notFound || !menu) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-surface px-6 text-center">
        <ChefHat className="size-8 text-muted-foreground" />
        <p className="text-lg font-semibold text-foreground">This QR code is no longer valid</p>
        <p className="text-sm text-muted-foreground">Please ask a staff member for help.</p>
      </div>
    );
  }

  if (placed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface px-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400">
          <CheckCircle2 className="size-8" />
        </span>
        <p className="text-xl font-semibold text-foreground">Order placed!</p>
        <p className="text-sm text-muted-foreground">
          Order {placed.orderNumber} for {placed.tableName} &middot; ₹{placed.totalAmount}
        </p>
        <p className="max-w-xs text-sm text-muted-foreground">
          The kitchen has been notified. A staff member will bring your order out shortly.
        </p>
        <Button variant="secondary" onClick={() => setPlaced(null)} className="mt-2">
          Order more
        </Button>
      </div>
    );
  }

  const visibleItems = menu.items.filter((i) => activeCategory === "all" || i.categoryId === activeCategory);

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="border-b border-border bg-surface-card px-4 py-4" style={{ borderTopColor: menu.vendor.brandColor }}>
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
            {menu.vendor.logoUrl ? (
              <Image
                src={`${API_ORIGIN}${menu.vendor.logoUrl}`}
                alt=""
                width={44}
                height={44}
                unoptimized
                className="size-full object-cover"
              />
            ) : (
              <ChefHat className="size-5" />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">{menu.vendor.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {menu.branch.name} &middot; Table {menu.table.name}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-3">
          <button
            onClick={() => setActiveCategory("all")}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === "all"
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-border bg-surface-card text-muted-foreground hover:border-brand-300"
            }`}
          >
            All
          </button>
          {menu.categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === c.id
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-border bg-surface-card text-muted-foreground hover:border-brand-300"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="space-y-2.5">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setPickerItem(item)}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface-card p-3 text-left shadow-soft transition-colors hover:border-brand-300"
            >
              <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-foreground/5 text-muted-foreground">
                {item.imageUrl ? (
                  <Image src={`${API_ORIGIN}${item.imageUrl}`} alt={item.name} fill unoptimized className="object-cover" />
                ) : (
                  <ImageOff className="size-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-block h-2.5 w-2.5 shrink-0 rounded-sm border ${
                      item.isVeg ? "border-green-600 bg-green-600" : "border-red-600 bg-red-600"
                    }`}
                  />
                  <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                </div>
                {item.description && <p className="truncate text-xs text-muted-foreground">{item.description}</p>}
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {item.variants.length > 0 ? "From " : ""}₹{item.basePrice}
                </p>
              </div>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                <Plus className="size-4" />
              </span>
            </button>
          ))}
          {visibleItems.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No items in this category.</p>
          )}
        </div>
      </div>

      {cartCount > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-lg items-center justify-between rounded-xl bg-brand-600 px-4 py-3.5 text-white shadow-card"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <ShoppingCart className="size-4" />
            {cartCount} item{cartCount === 1 ? "" : "s"}
          </span>
          <span className="font-mono text-sm font-semibold">View cart &middot; ₹{estimatedTotal.toFixed(2)}</span>
        </button>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setCartOpen(false)}>
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-surface-card p-5 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-base font-semibold text-foreground">
                <ShoppingCart className="size-4.5" />
                Your order
              </p>
              <button
                onClick={() => setCartOpen(false)}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/5"
              >
                <X className="size-4" />
              </button>
            </div>

            {cart.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Your cart is empty.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {cart.map((l) => (
                  <li key={l.key} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground">
                        {l.name}
                        {l.variantName && <span className="text-muted-foreground"> ({l.variantName})</span>}
                      </span>
                      <button
                        onClick={() => removeFromCart(l.key)}
                        className="flex size-6 items-center justify-center rounded text-danger hover:bg-danger/10"
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
                          className="flex size-6 items-center justify-center rounded border border-border text-muted-foreground hover:bg-foreground/5"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-4 text-center text-xs text-foreground">{l.quantity}</span>
                        <button
                          onClick={() => updateQuantity(l.key, 1)}
                          className="flex size-6 items-center justify-center rounded border border-border text-muted-foreground hover:bg-foreground/5"
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

            {cart.length > 0 && (
              <>
                <div className="mt-4 space-y-1.5 border-t border-border pt-3">
                  <label className="text-sm font-medium text-foreground">Your name (optional)</label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="So staff can call it out"
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estimated total</span>
                  <span className="font-mono font-medium text-foreground">₹{estimatedTotal.toFixed(2)}</span>
                </div>
                <p className="-mt-1 text-xs text-muted-foreground">Tax is calculated when your order is confirmed.</p>

                <Button onClick={handlePlaceOrder} loading={placing} className="mt-3 w-full" size="lg">
                  {placing ? "Placing order..." : "Place order"}
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {pickerItem && <ItemPickerModal item={pickerItem} onClose={() => setPickerItem(null)} onAdd={addToCart} />}
    </div>
  );
}
