"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { toast } from "react-toastify";
import { Building2, Loader2, MapPin, Pencil, Plus, Power, Trash2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import VendorNav from "@/components/layout/VendorNav";
import { useAuth } from "@/context/AuthContext";
import { listBranches, createBranch, updateBranch, deleteBranch, Branch } from "@/services/branchService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import UsageBar from "@/components/ui/UsageBar";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";

const SORT_OPTIONS = [
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
] as const;
type SortOption = (typeof SORT_OPTIONS)[number]["value"];

const PAGE_SIZE = 10;

const emptyForm = { name: "", address: "", city: "", phone: "", gstin: "" };

export default function BranchesPage() {
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Branch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sort, setSort] = useState<SortOption>("name-asc");

  function refresh() {
    return listBranches()
      .then(setBranches)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, []);

  function startEdit(b: Branch) {
    setEditingId(b.id);
    setForm({ name: b.name, address: b.address || "", city: b.city || "", phone: b.phone || "", gstin: b.gstin || "" });
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
      address: form.address || undefined,
      city: form.city || undefined,
      phone: form.phone || undefined,
      gstin: form.gstin || undefined,
    };
    try {
      if (editingId) {
        await updateBranch(editingId, payload);
        toast.success("Branch updated");
      } else {
        await createBranch(payload);
        toast.success("Branch added");
      }
      resetForm();
      await refresh();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (editingId ? "Could not update branch" : "Could not add branch");
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmToggleStatus() {
    if (!statusTarget) return;
    setActionLoading(true);
    const nextActive = !statusTarget.isActive;
    try {
      await updateBranch(statusTarget.id, { isActive: nextActive });
      toast.success(nextActive ? "Branch reactivated" : "Branch deactivated");
      setStatusTarget(null);
      await refresh();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Could not update branch";
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await deleteBranch(deleteTarget.id);
      toast.success("Branch deleted");
      if (editingId === deleteTarget.id) resetForm();
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Could not delete branch";
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  }

  const filteredBranches = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = branches.filter((b) => {
      if (statusFilter !== "all" && (statusFilter === "active") !== b.isActive) return false;
      if (
        query &&
        !b.name.toLowerCase().includes(query) &&
        !(b.city || "").toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });
    result.sort((a, b) => (sort === "name-desc" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)));
    return result;
  }, [branches, search, statusFilter, sort]);

  if (user && user.role !== "owner") {
    return (
      <AppShell title="Branches" nav={<VendorNav />}>
        <p className="text-sm text-muted-foreground">Only the owner can manage branches.</p>
      </AppShell>
    );
  }

  function updateAndResetPage<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  const planLimits = user?.vendor?.planLimits;
  const pageCount = Math.max(1, Math.ceil(filteredBranches.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visibleBranches = filteredBranches.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <AppShell title="Branches" nav={<VendorNav />}>
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          {planLimits && (
            <Card>
              <CardContent>
                <UsageBar used={user?.vendor?.branchCount ?? branches.length} max={planLimits.maxBranches} label="Branches used" />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground" />
                Branches
              </CardTitle>
              <Badge tone="brand">{branches.length} branch{branches.length === 1 ? "" : "es"}</Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 border-b border-border sm:flex-row sm:flex-wrap sm:items-center">
              <SearchInput
                value={search}
                onChange={(e) => updateAndResetPage(setSearch, e.target.value)}
                placeholder="Search name or city..."
                className="sm:max-w-xs sm:flex-1"
              />
              <Select
                value={statusFilter}
                onChange={(e) => updateAndResetPage(setStatusFilter, e.target.value as "all" | "active" | "inactive")}
                className="sm:w-auto"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
              <Select value={sort} onChange={(e) => setSort(e.target.value as SortOption)} className="sm:w-auto">
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </CardContent>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading...
                </div>
              ) : branches.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No branches yet — add one to get started.</p>
              ) : filteredBranches.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No branches match your search/filters.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3 font-medium">Name</th>
                        <th className="px-5 py-3 font-medium">Location</th>
                        <th className="px-5 py-3 font-medium">Phone</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {visibleBranches.map((b) => (
                        <tr key={b.id} className={`border-t border-border ${editingId === b.id ? "bg-brand-50/50" : ""}`}>
                          <td className="px-5 py-3 font-medium text-foreground">{b.name}</td>
                          <td className="px-5 py-3 text-muted-foreground">
                            {b.address || b.city ? (
                              <span className="flex items-center gap-1">
                                <MapPin className="size-3.5 shrink-0" />
                                {[b.address, b.city].filter(Boolean).join(", ")}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">{b.phone || "—"}</td>
                          <td className="px-5 py-3">
                            <Badge tone={b.isActive ? "success" : "danger"}>{b.isActive ? "active" : "inactive"}</Badge>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => startEdit(b)}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-brand-700 hover:bg-brand-50"
                              >
                                <Pencil className="size-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => setStatusTarget(b)}
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ${
                                  b.isActive ? "text-danger hover:bg-red-50" : "text-brand-700 hover:bg-brand-50"
                                }`}
                              >
                                <Power className="size-3.5" />
                                {b.isActive ? "Deactivate" : "Reactivate"}
                              </button>
                              <button
                                onClick={() => setDeleteTarget(b)}
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
            <Pagination page={safePage} pageCount={pageCount} onPageChange={setPage} />
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{editingId ? "Edit branch" : "Add branch"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Name</label>
                <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Address</label>
                <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">City</label>
                <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Phone</label>
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">GSTIN</label>
                <Input value={form.gstin} onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" loading={submitting} className="flex-1">
                  {!submitting && <Plus className="size-4" />}
                  {submitting ? "Saving..." : editingId ? "Update branch" : "Add branch"}
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

      {statusTarget && (
        <ConfirmDialog
          title={statusTarget.isActive ? "Deactivate this branch?" : "Reactivate this branch?"}
          description={
            statusTarget.isActive
              ? `"${statusTarget.name}" will be hidden from new order/table selection. Its history is kept.`
              : `"${statusTarget.name}" will be available for new orders and tables again.`
          }
          confirmLabel={statusTarget.isActive ? "Deactivate" : "Reactivate"}
          danger={statusTarget.isActive}
          loading={actionLoading}
          onConfirm={handleConfirmToggleStatus}
          onCancel={() => setStatusTarget(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete this branch?"
          description={`"${deleteTarget.name}" will be permanently removed. Blocked if it has any orders on record — deactivate it instead to keep the history.`}
          confirmLabel="Delete branch"
          loading={actionLoading}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AppShell>
  );
}
