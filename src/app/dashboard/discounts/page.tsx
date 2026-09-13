"use client";

import { useEffect, useState, FormEvent } from "react";
import { toast } from "react-toastify";
import { Loader2, Pencil, Percent, Plus, Trash2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import VendorNav from "@/components/layout/VendorNav";
import { useAuth } from "@/context/AuthContext";
import { listDiscounts, createDiscount, updateDiscount, deleteDiscount, Discount } from "@/services/discountService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 10;

export default function DiscountsPage() {
  const { user } = useAuth();
  // Mirrors the backend's canManage gate -- cashier can view discounts but
  // not create/edit/delete them.
  const canManage = user?.role === "owner" || user?.role === "manager";
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "flat">("percentage");
  const [value, setValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [page, setPage] = useState(1);

  function refresh() {
    return listDiscounts()
      .then((data) => {
        setDiscounts(data);
        setForbidden(false);
      })
      .catch((err) => {
        if (err?.response?.status === 403) setForbidden(true);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, []);

  function startEdit(d: Discount) {
    setEditingId(d.id);
    setCode(d.code);
    setType(d.type);
    setValue(d.value);
    setMinOrderAmount(d.minOrderAmount);
  }

  function resetForm() {
    setEditingId(null);
    setCode("");
    setType("percentage");
    setValue("");
    setMinOrderAmount("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await updateDiscount(editingId, {
          value: Number(value),
          minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
        });
        toast.success("Discount updated");
      } else {
        await createDiscount({
          code,
          type,
          value: Number(value),
          minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
        });
        toast.success("Discount created");
      }
      resetForm();
      await refresh();
    } catch {
      toast.error(editingId ? "Could not update discount" : "Could not create discount");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDiscount(deleteTarget.id);
      toast.success("Discount deleted");
      if (editingId === deleteTarget.id) resetForm();
      setDeleteTarget(null);
      await refresh();
    } catch {
      toast.error("Could not delete discount");
    } finally {
      setDeleting(false);
    }
  }

  if (forbidden) {
    return (
      <AppShell title="Discounts" nav={<VendorNav />}>
        <p className="text-sm text-muted-foreground">
          Your role doesn&apos;t have access to discounts. Ask an owner, manager, or cashier if you need this.
        </p>
      </AppShell>
    );
  }

  const pageCount = Math.max(1, Math.ceil(discounts.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visibleDiscounts = discounts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <AppShell title="Discounts" nav={<VendorNav />}>
      <div className={canManage ? "grid gap-6 md:grid-cols-[2fr_1fr]" : ""}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="size-4 text-muted-foreground" />
              Discount codes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading...
              </div>
            ) : discounts.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No discount codes yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Code</th>
                      <th className="px-5 py-3 font-medium">Value</th>
                      <th className="px-5 py-3 font-medium">Min order</th>
                      <th className="px-5 py-3 font-medium">Used</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleDiscounts.map((d) => (
                      <tr key={d.id} className={`border-t border-border ${editingId === d.id ? "bg-brand-50/50" : ""}`}>
                        <td className="px-5 py-3 font-medium text-foreground">{d.code}</td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {d.type === "percentage" ? `${d.value}%` : `₹${d.value}`}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">₹{d.minOrderAmount}</td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {d.usageCount}
                          {d.usageLimit ? ` / ${d.usageLimit}` : ""}
                        </td>
                        {canManage && (
                          <td className="px-5 py-3">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => startEdit(d)}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-brand-700 hover:bg-brand-50"
                              >
                                <Pencil className="size-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => setDeleteTarget(d)}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-danger hover:bg-red-50"
                              >
                                <Trash2 className="size-3.5" />
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
          <Pagination page={safePage} pageCount={pageCount} onPageChange={setPage} />
        </Card>

        {canManage && (
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>{editingId ? "Edit discount code" : "Add discount code"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Code</label>
                  <Input
                    required
                    disabled={!!editingId}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Type</label>
                  <Select
                    disabled={!!editingId}
                    value={type}
                    onChange={(e) => setType(e.target.value as "percentage" | "flat")}
                  >
                    <option value="percentage">Percentage off</option>
                    <option value="flat">Flat amount off</option>
                  </Select>
                  {editingId && <p className="text-xs text-muted-foreground">Code and type can&apos;t be changed after creation.</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Value {type === "percentage" ? "(%)" : "(₹)"}
                  </label>
                  <Input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Minimum order amount (₹)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" loading={submitting} className="flex-1">
                    {!submitting && <Plus className="size-4" />}
                    {submitting ? "Saving..." : editingId ? "Update discount" : "Add discount"}
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
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this discount code?"
          description={`"${deleteTarget.code}" will be permanently removed and can no longer be applied to bills.`}
          confirmLabel="Delete discount"
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AppShell>
  );
}
