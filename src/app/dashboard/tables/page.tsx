"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { ArrowRightLeft, Ban, CheckCircle2, Clock, Pencil, Plus, QrCode, RefreshCw, Sparkles, Trash2, UserRound, Users } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import VendorNav from "@/components/layout/VendorNav";
import { useAuth } from "@/context/AuthContext";
import { listTables, createTable, updateTable, updateTableStatus, deleteTable, RestaurantTable } from "@/services/tableService";
import { listOrders, updateOrderStatus, Order, OrderStatus } from "@/services/orderService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import TableQrModal from "@/components/tables/TableQrModal";
import MoveOrderModal from "@/components/tables/MoveOrderModal";

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

// Orders in these statuses still occupy the table -- served/completed/cancelled
// orders no longer need tracking here (mirrors releaseTableIfIdle on the backend).
const ACTIVE_ORDER_STATUSES: OrderStatus[] = ["placed", "preparing", "ready", "served"];
// Once an order is served it can no longer be cancelled (mirrors
// ORDER_STATUS_TRANSITIONS on the backend), so it's excluded here too.
const CANCELLABLE_ORDER_STATUSES: OrderStatus[] = ["placed", "preparing", "ready"];

const UNASSIGNED_LOCATION = "Unassigned";

function groupByLocation(tables: RestaurantTable[]) {
  const byLocation = new Map<string, RestaurantTable[]>();
  for (const table of tables) {
    const key = table.location || UNASSIGNED_LOCATION;
    if (!byLocation.has(key)) byLocation.set(key, []);
    byLocation.get(key)!.push(table);
  }
  for (const list of byLocation.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }
  return Array.from(byLocation.entries())
    .map(([location, list]) => ({ location, tables: list }))
    .sort((a, b) => {
      if (a.location === UNASSIGNED_LOCATION) return 1;
      if (b.location === UNASSIGNED_LOCATION) return -1;
      return a.location.localeCompare(b.location, undefined, { numeric: true });
    });
}

export default function TablesPage() {
  const { user } = useAuth();
  // Mirrors the backend's canManageTables gate (owner/manager only) so
  // waiters/cashiers never see an add/edit/delete control that just 403s.
  const canManage = user?.role === "owner" || user?.role === "manager";
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [activeOrdersByTable, setActiveOrdersByTable] = useState<Record<string, Order[]>>({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("4");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RestaurantTable | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [qrTarget, setQrTarget] = useState<RestaurantTable | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [cancelingOrder, setCancelingOrder] = useState(false);
  const [moveTarget, setMoveTarget] = useState<Order | null>(null);

  function refresh() {
    return Promise.all([listTables(), listOrders()])
      .then(([fetchedTables, orders]) => {
        setTables(fetchedTables);
        const byTable: Record<string, Order[]> = {};
        for (const order of orders) {
          if (!order.table || !ACTIVE_ORDER_STATUSES.includes(order.status)) continue;
          (byTable[order.table.id] ||= []).push(order);
        }
        setActiveOrdersByTable(byTable);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
    // Keep occupancy and per-table order counts fresh while staff have this
    // screen open, so it reflects orders other staff are placing/clearing.
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, []);

  const statusCounts = useMemo(() => {
    const counts: Record<Status, number> = { available: 0, occupied: 0, reserved: 0, cleaning: 0 };
    tables.forEach((t) => counts[t.status]++);
    return counts;
  }, [tables]);

  const locationGroups = useMemo(() => groupByLocation(tables), [tables]);

  function startEdit(t: RestaurantTable) {
    setEditingId(t.id);
    setName(t.name);
    setLocation(t.location || "");
    setCapacity(String(t.capacity));
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setLocation("");
    setCapacity("4");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await updateTable(editingId, { name, capacity: Number(capacity), location });
        toast.success("Table updated");
      } else {
        await createTable({ name, capacity: Number(capacity), location });
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
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(message || "Could not update table");
    }
  }

  async function handleConfirmCancelOrder() {
    if (!cancelTarget) return;
    setCancelingOrder(true);
    try {
      await updateOrderStatus(cancelTarget.id, "cancelled");
      toast.success(`Order ${cancelTarget.orderNumber} cancelled`);
      setCancelTarget(null);
      await refresh();
    } catch {
      toast.error("Could not cancel order");
    } finally {
      setCancelingOrder(false);
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
      <div className={canManage ? "grid gap-6 md:grid-cols-[2fr_1fr]" : ""}>
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
            <div className="space-y-6">
              {locationGroups.map((group) => (
                <div key={group.location}>
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                    {group.location}
                    <span className="text-xs font-normal text-muted-foreground">
                      {group.tables.length} table{group.tables.length === 1 ? "" : "s"}
                    </span>
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                    {group.tables.map((t) => {
                      const meta = STATUS_META[t.status];
                      const Icon = meta.icon;
                      const tableOrders = activeOrdersByTable[t.id] || [];
                      const cancellableOrder = tableOrders.find((o) => CANCELLABLE_ORDER_STATUSES.includes(o.status));
                      return (
                        <div
                          key={t.id}
                          className={`relative rounded-xl border shadow-soft transition-transform hover:-translate-y-0.5 ${meta.card} ${
                            editingId === t.id ? "ring-2 ring-brand-400" : ""
                          }`}
                        >
                          {tableOrders.length > 0 && (
                            <span className="absolute left-2 top-2 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                              {tableOrders.length} order{tableOrders.length === 1 ? "" : "s"}
                            </span>
                          )}
                          <Link href={`/dashboard/pos?tableId=${t.id}`} className="block w-full p-4 pt-7 text-left" title="Take an order for this table">
                            <p className="text-lg font-bold">{t.name}</p>
                            <p className="flex items-center gap-1 text-xs opacity-80">
                              <Users className="size-3" /> Seats {t.capacity}
                            </p>
                            <p className="mt-2.5 flex items-center gap-1 text-xs font-semibold">
                              <Icon className="size-3.5" />
                              {meta.label}
                            </p>
                          </Link>
                          <div className="flex flex-wrap justify-end gap-1 px-3 pb-3">
                            <button
                              onClick={() => cycleStatus(t)}
                              disabled={tableOrders.length > 0}
                              title={
                                tableOrders.length > 0
                                  ? "Status is locked while this table has an active order"
                                  : `Mark as ${STATUS_META[NEXT_STATUS[t.status]].label}`
                              }
                              className="flex size-7 items-center justify-center rounded-md bg-white/60 text-current hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/60"
                            >
                              <RefreshCw className="size-3.5" />
                            </button>
                            <button
                              onClick={() => setQrTarget(t)}
                              title="Show QR code"
                              className="flex size-7 items-center justify-center rounded-md bg-white/60 text-current hover:bg-white"
                            >
                              <QrCode className="size-3.5" />
                            </button>
                            {tableOrders[0] && (
                              <button
                                onClick={() => setMoveTarget(tableOrders[0])}
                                title={`Move order ${tableOrders[0].orderNumber} to another table`}
                                className="flex size-7 items-center justify-center rounded-md bg-white/60 text-current hover:bg-white"
                              >
                                <ArrowRightLeft className="size-3.5" />
                              </button>
                            )}
                            {cancellableOrder && (
                              <button
                                onClick={() => setCancelTarget(cancellableOrder)}
                                title={`Cancel order ${cancellableOrder.orderNumber}`}
                                className="flex size-7 items-center justify-center rounded-md bg-white/60 text-current hover:bg-white hover:text-danger"
                              >
                                <Ban className="size-3.5" />
                              </button>
                            )}
                            {canManage && (
                              <>
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
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {canManage && (
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
                  <label className="text-sm font-medium text-foreground">Location</label>
                  <Input
                    list="table-location-suggestions"
                    placeholder="e.g. AC - 1st Floor"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                  <datalist id="table-location-suggestions">
                    <option value="AC" />
                    <option value="Non-AC" />
                    <option value="Ground Floor" />
                    <option value="1st Floor" />
                    <option value="2nd Floor" />
                    <option value="Terrace" />
                    <option value="Outdoor" />
                  </datalist>
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
        )}
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

      {cancelTarget && (
        <ConfirmDialog
          title="Cancel this order?"
          description={`Order ${cancelTarget.orderNumber} on ${cancelTarget.table?.name} will be cancelled.`}
          confirmLabel="Cancel order"
          loading={cancelingOrder}
          onConfirm={handleConfirmCancelOrder}
          onCancel={() => setCancelTarget(null)}
        />
      )}

      {qrTarget && <TableQrModal table={qrTarget} onClose={() => setQrTarget(null)} />}

      {moveTarget && (
        <MoveOrderModal order={moveTarget} tables={tables} onClose={() => setMoveTarget(null)} onMoved={refresh} />
      )}
    </AppShell>
  );
}
