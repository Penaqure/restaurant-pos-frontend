"use client";

import { useEffect, useState, FormEvent } from "react";
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
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading...
              </div>
            ) : staff.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No staff yet — add one to get started.</p>
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
                    {staff.map((s) => (
                      <tr key={s.id} className={`border-t border-border ${editingId === s.id ? "bg-brand-50/50" : ""}`}>
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
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-brand-700 hover:bg-brand-50"
                            >
                              <Pencil className="size-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => setStatusTarget(s)}
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ${
                                s.status === "active" ? "text-danger hover:bg-red-50" : "text-brand-700 hover:bg-brand-50"
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
