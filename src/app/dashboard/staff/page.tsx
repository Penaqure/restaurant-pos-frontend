"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { toast } from "react-toastify";
import { Loader2, Pencil, Plus, Power, UserPlus, Users } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import VendorNav from "@/components/layout/VendorNav";
import { useAuth } from "@/context/AuthContext";
import { listStaff, createStaff, updateStaff, StaffMember } from "@/services/staffService";
import { listRoles, Role } from "@/services/roleService";
import { listBranches, Branch } from "@/services/branchService";
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

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  roleId: "",
  branchId: "",
  password: "",
};

export default function StaffPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [statusTarget, setStatusTarget] = useState<StaffMember | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StaffMember["status"] | "all">("all");
  const [sort, setSort] = useState<SortOption>("name-asc");

  function refresh() {
    return Promise.all([listStaff(), listRoles(), listBranches()])
      .then(([s, r, b]) => {
        setStaff(s);
        setRoles(r);
        setBranches(b);
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

  function startEdit(s: StaffMember) {
    setEditingId(s.id);
    setForm({
      firstName: s.firstName,
      lastName: s.lastName || "",
      email: s.email,
      phone: s.phone || "",
      roleId: s.roleId,
      branchId: s.branchId || "",
      password: "",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await updateStaff(editingId, {
          firstName: form.firstName,
          lastName: form.lastName || undefined,
          phone: form.phone || undefined,
          roleId: form.roleId,
          branchId: form.branchId || null,
          ...(form.password && { password: form.password }),
        });
        toast.success("Staff member updated");
      } else {
        await createStaff({
          firstName: form.firstName,
          lastName: form.lastName || undefined,
          email: form.email,
          phone: form.phone || undefined,
          roleId: form.roleId,
          branchId: form.branchId || undefined,
          password: form.password,
        });
        toast.success("Staff member added");
      }
      resetForm();
      await refresh();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (editingId ? "Could not update staff member" : "Could not add staff member");
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmToggleStatus() {
    if (!statusTarget) return;
    setStatusLoading(true);
    const nextStatus = statusTarget.status === "active" ? "inactive" : "active";
    try {
      await updateStaff(statusTarget.id, { status: nextStatus });
      toast.success(nextStatus === "active" ? "Staff member reactivated" : "Staff member deactivated");
      setStatusTarget(null);
      await refresh();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not update staff member";
      toast.error(message);
    } finally {
      setStatusLoading(false);
    }
  }

  function updateAndResetPage<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = staff.filter((s) => {
      if (roleFilter !== "all" && s.role.name !== roleFilter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (
        query &&
        !`${s.firstName} ${s.lastName}`.toLowerCase().includes(query) &&
        !s.email.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });

    result.sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      return sort === "name-desc" ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB);
    });
    return result;
  }, [staff, search, roleFilter, statusFilter, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredStaff.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visibleStaff = filteredStaff.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const roleOptions = Array.from(new Set(staff.map((s) => s.role.name)));

  if (forbidden) {
    return (
      <AppShell title="Staff" nav={<VendorNav />}>
        <p className="text-sm text-muted-foreground">
          Your role doesn&apos;t have access to staff management. Ask an owner or manager if you need this.
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Staff" nav={<VendorNav />}>
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          {user?.vendor?.planLimits && (
            <Card>
              <CardContent>
                <UsageBar used={user.vendor.userCount} max={user.vendor.planLimits.maxUsers} label="Staff accounts used" />
              </CardContent>
            </Card>
          )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              Staff
            </CardTitle>
            <Badge tone="brand">{staff.length} member{staff.length === 1 ? "" : "s"}</Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 border-b border-border sm:flex-row sm:flex-wrap sm:items-center">
            <SearchInput
              value={search}
              onChange={(e) => updateAndResetPage(setSearch, e.target.value)}
              placeholder="Search name or email..."
              className="sm:max-w-xs sm:flex-1"
            />
            <Select value={roleFilter} onChange={(e) => updateAndResetPage(setRoleFilter, e.target.value)} className="sm:w-auto">
              <option value="all">All roles</option>
              {roleOptions.map((r) => (
                <option key={r} value={r} className="capitalize">
                  {r}
                </option>
              ))}
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => updateAndResetPage(setStatusFilter, e.target.value as StaffMember["status"] | "all")}
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
            ) : staff.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No staff yet — add one to get started.</p>
            ) : filteredStaff.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No staff match your search/filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Email</th>
                      <th className="px-5 py-3 font-medium">Role</th>
                      <th className="px-5 py-3 font-medium">Branch</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleStaff.map((s) => (
                      <tr key={s.id} className={`border-t border-border ${editingId === s.id ? "bg-brand-50/50 dark:bg-brand-500/10" : ""}`}>
                        <td className="px-5 py-3 font-medium text-foreground">
                          {s.firstName} {s.lastName}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{s.email}</td>
                        <td className="px-5 py-3">
                          <Badge tone="neutral">{s.role.name}</Badge>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{s.branch?.name || "All branches"}</td>
                        <td className="px-5 py-3">
                          <Badge tone={s.status === "active" ? "success" : "danger"}>{s.status}</Badge>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => startEdit(s)}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-brand-700 hover:bg-brand-500/10 dark:text-brand-300"
                            >
                              <Pencil className="size-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => setStatusTarget(s)}
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ${
                                s.status === "active" ? "text-danger hover:bg-danger/10" : "text-brand-700 hover:bg-brand-500/10 dark:text-brand-300"
                              }`}
                            >
                              <Power className="size-3.5" />
                              {s.status === "active" ? "Deactivate" : "Reactivate"}
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
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="size-4 text-muted-foreground" />
              {editingId ? "Edit staff member" : "Add staff member"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">First name</label>
                  <Input
                    required
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Last name</label>
                  <Input
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input
                  required
                  type="email"
                  disabled={!!editingId}
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
                {editingId && <p className="text-xs text-muted-foreground">Login email can&apos;t be changed.</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Phone</label>
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Role</label>
                <Select required value={form.roleId} onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}>
                  <option value="">Select a role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id} className="capitalize">
                      {r.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Branch</label>
                <Select value={form.branchId} onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}>
                  <option value="">All branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {editingId ? "Reset password (optional)" : "Temporary password"}
                </label>
                <Input
                  required={!editingId}
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder={editingId ? "Leave blank to keep current password" : undefined}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" loading={submitting} className="flex-1">
                  {!submitting && <Plus className="size-4" />}
                  {submitting ? "Saving..." : editingId ? "Update staff member" : "Add staff member"}
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
          title={statusTarget.status === "active" ? "Deactivate this staff member?" : "Reactivate this staff member?"}
          description={
            statusTarget.status === "active"
              ? `${statusTarget.firstName} ${statusTarget.lastName} will immediately lose access and be unable to log in. You can reactivate them anytime.`
              : `${statusTarget.firstName} ${statusTarget.lastName} will be able to log in again.`
          }
          confirmLabel={statusTarget.status === "active" ? "Deactivate" : "Reactivate"}
          danger={statusTarget.status === "active"}
          loading={statusLoading}
          onConfirm={handleConfirmToggleStatus}
          onCancel={() => setStatusTarget(null)}
        />
      )}
    </AppShell>
  );
}
