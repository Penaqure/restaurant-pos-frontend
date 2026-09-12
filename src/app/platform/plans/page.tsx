"use client";

import { useEffect, useState, FormEvent } from "react";
import { toast } from "react-toastify";
import { CreditCard, Loader2, Plus, Trash2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import PlatformNav from "@/components/layout/PlatformNav";
import { listPlans, createPlan, updatePlan, deletePlan, SubscriptionPlan } from "@/services/vendorService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const emptyForm = {
  name: "",
  priceMonthly: "0",
  billingCycle: "monthly",
  maxBranches: "1",
  maxUsers: "5",
  isActive: true,
};

export default function PlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SubscriptionPlan | null>(null);
  const [deleting, setDeleting] = useState(false);

  function refresh() {
    return listPlans()
      .then(setPlans)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, []);

  function startEdit(plan: SubscriptionPlan) {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      priceMonthly: plan.priceMonthly,
      billingCycle: plan.billingCycle,
      maxBranches: String(plan.maxBranches),
      maxUsers: String(plan.maxUsers),
      isActive: plan.isActive,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      name: form.name,
      priceMonthly: Number(form.priceMonthly),
      billingCycle: form.billingCycle,
      maxBranches: Number(form.maxBranches),
      maxUsers: Number(form.maxUsers),
      isActive: form.isActive,
    };
    try {
      if (editingId) {
        await updatePlan(editingId, payload);
        toast.success("Plan updated");
      } else {
        await createPlan(payload);
        toast.success("Plan created");
      }
      resetForm();
      await refresh();
    } catch {
      toast.error(editingId ? "Could not update plan" : "Could not create plan");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { vendorsAffected } = await deletePlan(deleteTarget.id);
      toast.success(
        vendorsAffected > 0
          ? `Plan deleted — ${vendorsAffected} vendor(s) are now unassigned from a plan`
          : "Plan deleted"
      );
      if (editingId === deleteTarget.id) resetForm();
      setDeleteTarget(null);
      await refresh();
    } catch {
      toast.error("Could not delete plan");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell title="Subscription plans" nav={<PlatformNav />}>
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-4 text-muted-foreground" />
              Plans
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading...
              </div>
            ) : plans.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No plans yet — create one to get started.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Price</th>
                      <th className="px-5 py-3 font-medium">Branches</th>
                      <th className="px-5 py-3 font-medium">Users</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((p) => (
                      <tr key={p.id} className="border-t border-border">
                        <td className="px-5 py-3 font-medium text-foreground">{p.name}</td>
                        <td className="px-5 py-3 font-mono text-muted-foreground">
                          ₹{Number(p.priceMonthly).toFixed(0)}/{p.billingCycle === "yearly" ? "yr" : "mo"}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{p.maxBranches}</td>
                        <td className="px-5 py-3 text-muted-foreground">{p.maxUsers}</td>
                        <td className="px-5 py-3">
                          <Badge tone={p.isActive ? "success" : "neutral"}>{p.isActive ? "active" : "inactive"}</Badge>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => startEdit(p)}
                              className="rounded-md px-2 py-1 text-brand-700 hover:bg-brand-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteTarget(p)}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-danger hover:bg-red-50"
                            >
                              <Trash2 className="size-3.5" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="@container h-fit">
          <CardHeader>
            <CardTitle>{editingId ? "Edit plan" : "New plan"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Name</label>
                <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Price (₹)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.priceMonthly}
                    onChange={(e) => setForm((f) => ({ ...f, priceMonthly: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Billing cycle</label>
                  <Select
                    value={form.billingCycle}
                    onChange={(e) => setForm((f) => ({ ...f, billingCycle: e.target.value }))}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Max branches</label>
                  <Input
                    type="number"
                    min="1"
                    value={form.maxBranches}
                    onChange={(e) => setForm((f) => ({ ...f, maxBranches: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Max users</label>
                  <Input
                    type="number"
                    min="1"
                    value={form.maxUsers}
                    onChange={(e) => setForm((f) => ({ ...f, maxUsers: e.target.value }))}
                  />
                </div>
              </div>
              {editingId && (
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="size-4 accent-brand-600"
                  />
                  Active
                </label>
              )}
              <div className="flex gap-2">
                <Button type="submit" loading={submitting} className="flex-1">
                  {!submitting && <Plus className="size-4" />}
                  {submitting ? "Saving..." : editingId ? "Update plan" : "Create plan"}
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
          title="Delete this plan?"
          description={`"${deleteTarget.name}" will be permanently removed. Any vendor currently on it falls back to no plan (unrestricted) rather than losing access.`}
          confirmLabel="Delete plan"
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AppShell>
  );
}
