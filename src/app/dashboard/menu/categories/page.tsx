"use client";

import { useEffect, useState, FormEvent } from "react";
import { toast } from "react-toastify";
import { LayoutGrid, Loader2, Pencil, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import VendorNav from "@/components/layout/VendorNav";
import { listCategories, listItems, createCategory, updateCategory, deleteCategory, MenuCategory } from "@/services/menuService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// A stable color per category (derived from its id) so a category's swatch
// never shifts on refresh, without needing an actual color/image field on
// the model.
const SWATCHES = [
  "bg-brand-50 text-brand-600",
  "bg-blue-50 text-blue-600",
  "bg-amber-50 text-amber-600",
  "bg-green-50 text-green-600",
  "bg-pink-50 text-pink-600",
  "bg-teal-50 text-teal-600",
  "bg-purple-50 text-purple-600",
  "bg-orange-50 text-orange-600",
];

function swatchFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return SWATCHES[hash % SWATCHES.length];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MenuCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  function refresh() {
    return Promise.all([listCategories(), listItems()])
      .then(([cats, items]) => {
        setCategories(cats);
        const counts: Record<string, number> = {};
        items.forEach((i) => {
          counts[i.categoryId] = (counts[i.categoryId] || 0) + 1;
        });
        setItemCounts(counts);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, []);

  function startEdit(c: MenuCategory) {
    setEditingId(c.id);
    setName(c.name);
    setDescription(c.description || "");
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await updateCategory(editingId, { name, description: description || undefined });
        toast.success("Category updated");
      } else {
        await createCategory({ name, description: description || undefined, sortOrder: categories.length });
        toast.success("Category added");
      }
      resetForm();
      await refresh();
    } catch {
      toast.error(editingId ? "Could not update category" : "Could not add category");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteTarget.id);
      toast.success("Category deleted");
      if (editingId === deleteTarget.id) resetForm();
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not delete category";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell title="Menu categories" nav={<VendorNav />}>
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="size-4 text-muted-foreground" />
              Categories
            </CardTitle>
            <Badge tone="brand">{categories.length}</Badge>
          </CardHeader>
          <CardContent className={categories.length > 0 ? "" : "p-0"}>
            {loading ? (
              <div className="flex items-center gap-2 p-1 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading...
              </div>
            ) : categories.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No categories yet — add one to get started.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className={`group relative rounded-xl border p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card ${
                      editingId === c.id ? "border-brand-400 ring-2 ring-brand-100" : "border-border bg-surface-card"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${swatchFor(c.id)}`}>
                        <UtensilsCrossed className="size-4.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">{c.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.description || "No description"}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge tone="neutral">
                        {itemCounts[c.id] || 0} item{itemCounts[c.id] === 1 ? "" : "s"}
                      </Badge>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(c)}
                          title="Edit category"
                          className="flex size-7 items-center justify-center rounded-md text-brand-700 hover:bg-brand-50"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          title="Delete category"
                          className="flex size-7 items-center justify-center rounded-md text-danger hover:bg-red-50"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{editingId ? "Edit category" : "Add category"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Name</label>
                <Input required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" loading={submitting} className="flex-1">
                  {!submitting && <Plus className="size-4" />}
                  {submitting ? "Saving..." : editingId ? "Update category" : "Add category"}
                </Button>
                {editingId && (
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this category?"
          description={`"${deleteTarget.name}" will be permanently removed. This is blocked if any menu items still use it.`}
          confirmLabel="Delete category"
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AppShell>
  );
}
