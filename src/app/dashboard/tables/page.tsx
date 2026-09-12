"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { toast } from "react-toastify";
import { CheckCircle2, Clock, Pencil, Plus, QrCode, Sparkles, Trash2, UserRound, Users } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import VendorNav from "@/components/layout/VendorNav";
import { listTables, createTable, updateTable, updateTableStatus, deleteTable, RestaurantTable } from "@/services/tableService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import TableQrModal from "@/components/tables/TableQrModal";

type Status = RestaurantTable["status"];

const STATUS_META: Record<Status, { card: string; chip: string; icon: typeof CheckCircle2; label: string }> = {
  available: { card: "bg-green-50 border-green-200 text-green-700", chip: "bg-green-500", icon: CheckCircle2, label: "Available" },
  occupied: { card: "bg-red-50 border-red-200 text-red-700", chip: "bg-red-500", icon: UserRound, label: "Occupied" },
  reserved: { card: "bg-amber-50 border-amber-200 text-amber-700", chip: "bg-amber-500", icon: Clock, label: "Reserved" },
  cleaning: { card: "bg-black/5 border-border text-muted-foreground", chip: "bg-gray-400", icon: Sparkles, label: "Cleaning" },
};

const NEXT_STATUS: Record<Status, Status> = {
  available: "cleaning",
  cleaning: "reserved",
  reserved: "occupied",
  occupied: "available",
};

export default function TablesPage() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("4");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RestaurantTable | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [qrTarget, setQrTarget] = useState<RestaurantTable | null>(null);

  function refresh() {
    return listTables()
      .then(setTables)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, []);

  const statusCounts = useMemo(() => {
    const counts: Record<Status, number> = { available: 0, occupied: 0, reserved: 0, cleaning: 0 };
    tables.forEach((t) => counts[t.status]++);
    return counts;
  }, [tables]);

  function startEdit(t: RestaurantTable) {
    setEditingId(t.id);
    setName(t.name);
    setCapacity(String(t.capacity));
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setCapacity("4");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await updateTable(editingId, { name, capacity: Number(capacity) });
        toast.success("Table updated");
      } else {
        await createTable({ name, capacity: Number(capacity) });
        toast.success("Table added");
      }
      resetForm();
      await refresh();
    } catch {
      toast.error(editingId ? "Could not update table" : "Could not add table (owner/manager only)");
    } finally {
      setSubmitting(false);
    }
  }

  async function cycleStatus(t: RestaurantTable) {
    try {
      await updateTableStatus(t.id, NEXT_STATUS[t.status]);
      await refresh();
    } catch {
      toast.error("Could not update table");
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTable(deleteTarget.id);
      toast.success("Table deleted");
      if (editingId === deleteTarget.id) resetForm();
      setDeleteTarget(null);
      await refresh();
    } catch {
      toast.error("Could not delete table");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell title="Tables" nav={<VendorNav />}>
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div>
          {!loading && tables.length > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(Object.keys(STATUS_META) as Status[]).map((s) => {
                const meta = STATUS_META[s];
                const Icon = meta.icon;
                return (
                  <Card key={s}>
                    <CardContent className="flex items-center gap-2.5 p-3">
                      <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-white ${meta.chip}`}>
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-lg font-semibold leading-tight text-foreground">{statusCounts[s]}</p>
                        <p className="truncate text-xs text-muted-foreground">{meta.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : tables.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tables yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {tables.map((t) => {
                const meta = STATUS_META[t.status];
                const Icon = meta.icon;
                return (
                  <div
                    key={t.id}
                    className={`relative rounded-xl border shadow-soft transition-transform hover:-translate-y-0.5 ${meta.card} ${
                      editingId === t.id ? "ring-2 ring-brand-400" : ""
                    }`}
                  >
                    <button onClick={() => cycleStatus(t)} className="block w-full p-4 pr-24 text-left" title="Click to cycle status">
                      <p className="text-lg font-bold">{t.name}</p>
                      <p className="flex items-center gap-1 text-xs opacity-80">
                        <Users className="size-3" /> Seats {t.capacity}
                      </p>
                      <p className="mt-2.5 flex items-center gap-1 text-xs font-semibold">
                        <Icon className="size-3.5" />
                        {meta.label}
                      </p>
                    </button>
                    <div className="absolute right-2 top-2 flex gap-1">
                      <button
                        onClick={() => setQrTarget(t)}
                        title="Show QR code"
                        className="flex size-7 items-center justify-center rounded-md bg-white/60 text-current hover:bg-white"
                      >
                        <QrCode className="size-3.5" />
                      </button>
                      <button
                        onClick={() => startEdit(t)}
                        title="Edit table"
                        className="flex size-7 items-center justify-center rounded-md bg-white/60 text-current hover:bg-white"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(t)}
                        title="Delete table"
                        className="flex size-7 items-center justify-center rounded-md bg-white/60 text-current hover:bg-white hover:text-danger"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{editingId ? "Edit table" : "Add table"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Name</label>
                <Input required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Capacity</label>
                <Input type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" loading={submitting} className="flex-1">
                  {!submitting && <Plus className="size-4" />}
                  {submitting ? "Saving..." : editingId ? "Update table" : "Add table"}
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
          title="Delete this table?"
          description={`"${deleteTarget.name}" will be permanently removed.`}
          confirmLabel="Delete table"
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {qrTarget && <TableQrModal table={qrTarget} onClose={() => setQrTarget(null)} />}
    </AppShell>
  );
}
