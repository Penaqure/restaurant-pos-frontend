"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { ArrowRightLeft, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { transferOrderTable, Order } from "@/services/orderService";
import type { RestaurantTable } from "@/services/tableService";

export default function MoveOrderModal({
  order,
  tables,
  onClose,
  onMoved,
}: {
  order: Order;
  tables: RestaurantTable[];
  onClose: () => void;
  onMoved: () => void;
}) {
  const [targetTableId, setTargetTableId] = useState("");
  const [moving, setMoving] = useState(false);

  const otherTables = tables.filter((t) => t.id !== order.table?.id);

  async function handleMove() {
    if (!targetTableId) return;
    setMoving(true);
    try {
      await transferOrderTable(order.id, targetTableId);
      toast.success(`Order ${order.orderNumber} moved`);
      onMoved();
      onClose();
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(message || "Could not move order");
    } finally {
      setMoving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xs rounded-xl bg-surface-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Move order {order.orderNumber}</h3>
            <p className="text-xs text-muted-foreground">Currently on {order.table?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/5"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 space-y-1.5">
          <label className="text-sm font-medium text-foreground">Move to</label>
          {otherTables.length === 0 ? (
            <p className="text-sm text-muted-foreground">No other tables available.</p>
          ) : (
            <Select value={targetTableId} onChange={(e) => setTargetTableId(e.target.value)}>
              <option value="">Select a table</option>
              {otherTables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.location ? ` (${t.location})` : ""} — {t.status}
                </option>
              ))}
            </Select>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleMove} loading={moving} disabled={!targetTableId} className="flex-1">
            <ArrowRightLeft className="size-4" />
            Move
          </Button>
        </div>
      </div>
    </div>
  );
}
