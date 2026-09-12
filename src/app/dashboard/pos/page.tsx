"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-toastify";
import { ImageOff, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import VendorNav from "@/components/layout/VendorNav";
import ItemPickerModal, { CartLine } from "@/components/pos/ItemPickerModal";
import { listCategories, listItems, MenuCategory, MenuItem } from "@/services/menuService";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/api\/?$/, "");
import { listTables, RestaurantTable } from "@/services/tableService";
import { createOrder, OrderType } from "@/services/orderService";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

export default function PosPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");
  const [pickerItem, setPickerItem] = useState<MenuItem | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [tableId, setTableId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listCategories().then(setCategories);
    listItems().then(setItems);
    listTables().then(setTables);
  }, []);

  const visibleItems = items.filter((i) => i.isAvailable && (activeCategory === "all" || i.categoryId === activeCategory));

  function addToCart(line: CartLine) {
    setCart((c) => [...c, line]);
  }
  function removeFromCart(key: string) {
    setCart((c) => c.filter((l) => l.key !== key));
  }
  function updateQuantity(key: string, delta: number) {
    setCart((c) =>
      c.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, l.quantity + delta) } : l))
    );
  }

  const estimatedSubtotal = cart.reduce(
    (sum, l) => sum + (l.unitPrice + l.addons.reduce((s, a) => s + a.price, 0)) * l.quantity,
    0
  );

  async function handleSubmit() {
    if (cart.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    if (orderType === "dine_in" && !tableId) {
      toast.error("Select a table for dine-in orders");
      return;
    }
    setSubmitting(true);
    try {
      const order = await createOrder({
        orderType,
        tableId: orderType === "dine_in" ? tableId : undefined,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        items: cart.map((l) => ({
          menuItemId: l.menuItemId,
          variantId: l.variantId,
          quantity: l.quantity,
          notes: l.notes,
          addons: l.addons.map((a) => ({ addonId: a.addonId, quantity: a.quantity })),
        })),
      });
      toast.success(`Order ${order.orderNumber} placed`);
      router.push(`/dashboard/orders/${order.id}`);
    } catch {
      toast.error("Could not place order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Point of sale" nav={<VendorNav />}>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
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

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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

        <Card className="h-fit">
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Order type</label>
              <Select value={orderType} onChange={(e) => setOrderType(e.target.value as OrderType)}>
                <option value="dine_in">Dine-in</option>
                <option value="takeaway">Takeaway</option>
                <option value="delivery">Delivery</option>
              </Select>
            </div>

            {orderType === "dine_in" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Table</label>
                <Select value={tableId} onChange={(e) => setTableId(e.target.value)}>
                  <option value="">Select a table</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.status})
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {orderType !== "dine_in" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Customer name</label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Phone</label>
                  <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                </div>
              </>
            )}

            <div className="border-t border-border pt-3">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShoppingCart className="size-4 text-muted-foreground" />
                Cart
              </p>
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

            <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
              <span className="text-muted-foreground">Estimated subtotal</span>
              <span className="font-mono font-medium text-foreground">₹{estimatedSubtotal.toFixed(2)}</span>
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">Tax is calculated by the server when the order is placed.</p>

            <Button onClick={handleSubmit} loading={submitting} className="w-full" size="lg">
              {submitting ? "Placing order..." : "Place order"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {pickerItem && (
        <ItemPickerModal item={pickerItem} onClose={() => setPickerItem(null)} onAdd={addToCart} />
      )}
    </AppShell>
  );
}
