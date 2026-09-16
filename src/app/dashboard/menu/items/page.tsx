"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, ImageOff, Loader2, Plus, Upload } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import VendorNav from "@/components/layout/VendorNav";
import { useAuth } from "@/context/AuthContext";
import { listCategories, listItems, MenuCategory, MenuItem } from "@/services/menuService";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import SearchInput from "@/components/ui/SearchInput";
import { Badge } from "@/components/ui/Badge";
import ImportMenuModal from "@/components/menu/ImportMenuModal";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/api\/?$/, "");

type VegFilter = "all" | "veg" | "non-veg";

const SORT_OPTIONS = [
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;
type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export default function MenuItemsPage() {
  const { user } = useAuth();
  // Mirrors the backend's canManageMenu gate (owner/manager only) -- the item
  // detail page is pure edit/delete UI with no read-only mode, so other
  // roles never get a link into it.
  const canManage = user?.role === "owner" || user?.role === "manager";
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");
  const [vegFilter, setVegFilter] = useState<VegFilter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("name-asc");
  const [showImport, setShowImport] = useState(false);

  function refresh() {
    return Promise.all([listItems(), listCategories()])
      .then(([i, c]) => {
        setItems(i);
        setCategories(c);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, []);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = items.filter((item) => {
      if (activeCategory !== "all" && item.categoryId !== activeCategory) return false;
      if (vegFilter === "veg" && !item.isVeg) return false;
      if (vegFilter === "non-veg" && item.isVeg) return false;
      if (query && !item.name.toLowerCase().includes(query)) return false;
      return true;
    });
    result.sort((a, b) => {
      switch (sort) {
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "price-asc":
          return Number(a.basePrice) - Number(b.basePrice);
        case "price-desc":
          return Number(b.basePrice) - Number(a.basePrice);
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return result;
  }, [items, activeCategory, vegFilter, search, sort]);

  return (
    <AppShell title="Menu items" nav={<VendorNav />}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="sm:max-w-xs"
          />
          <Select value={sort} onChange={(e) => setSort(e.target.value as SortOption)} className="sm:w-auto">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        {canManage && (
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="secondary" className="flex-1 sm:flex-none" onClick={() => setShowImport(true)}>
              <Upload className="size-4" />
              Import
            </Button>
            <Link href="/dashboard/menu/items/new" className="flex-1 sm:flex-none">
              <Button className="w-full">
                <Plus className="size-4" />
                New item
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
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
        <span className="mx-1 h-4 w-px bg-border" />
        {(["all", "veg", "non-veg"] as VegFilter[]).map((v) => (
          <button
            key={v}
            onClick={() => setVegFilter(v)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              vegFilter === v
                ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                : "border-border bg-surface-card text-muted-foreground hover:border-brand-300"
            }`}
          >
            {v !== "all" && (
              <span
                className={`inline-block size-2 rounded-sm border ${
                  v === "veg" ? "border-green-600 bg-green-600" : "border-red-600 bg-red-600"
                }`}
              />
            )}
            {v === "non-veg" ? "Non-veg" : v}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading...
        </div>
      ) : visibleItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">No items match these filters.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {visibleItems.map((item) => (
            <div
              key={item.id}
              className={`overflow-hidden rounded-xl border border-border bg-surface-card shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card ${
                !item.isAvailable ? "opacity-60" : ""
              }`}
            >
              <div className="relative aspect-square w-full bg-foreground/5 text-muted-foreground">
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
                {!item.isAvailable && (
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    Unavailable
                  </span>
                )}
              </div>
              <div className="p-2.5">
                <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                <p className="truncate text-xs text-muted-foreground">{item.category?.name}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-mono text-xs text-foreground">₹{item.basePrice}</span>
                  {(item.variants.length > 0 || item.addons.length > 0) && (
                    <Badge tone="neutral" className="text-[10px]">
                      {item.variants.length + item.addons.length}
                    </Badge>
                  )}
                </div>
                {canManage && (
                  <Link href={`/dashboard/menu/items/${item.id}`} className="mt-1.5 block">
                    <Button variant="secondary" size="sm" className="w-full">
                      <Eye className="size-3.5" />
                      View
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showImport && <ImportMenuModal kind="items" onClose={() => setShowImport(false)} onImported={refresh} />}
    </AppShell>
  );
}
