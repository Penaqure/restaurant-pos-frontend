"use client";

import { useState } from "react";
import { Undo2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function RefundDialog({
  maxAmount,
  currencyCode,
  loading = false,
  onConfirm,
  onCancel,
}: {
  // The most this specific payment can still be refunded for -- the
  // backend caps it the same way, this just pre-fills a sane default and
  // gives an immediate error instead of a round trip for an over-ask.
  maxAmount: number;
  currencyCode?: string;
  loading?: boolean;
  onConfirm: (amount: number, notes: string) => void;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState(String(maxAmount));
  const [notes, setNotes] = useState("");
  const amountNumber = Number(amount);
  const invalid = !(amountNumber > 0) || amountNumber > maxAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-xl bg-surface-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-danger dark:bg-red-500/15">
            <Undo2 className="size-4.5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Refund payment</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Up to {formatCurrency(maxAmount, currencyCode)} can be refunded on this payment.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Amount to refund</label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            max={maxAmount}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="py-1.5"
          />
          {invalid && amount !== "" && (
            <p className="text-xs text-danger">Must be between 0 and {formatCurrency(maxAmount, currencyCode)}.</p>
          )}
        </div>
        <div className="mt-3 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Reason (optional)</label>
          <Input
            placeholder="e.g. item returned"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="py-1.5"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => onConfirm(amountNumber, notes)}
            disabled={invalid}
            loading={loading}
          >
            Refund
          </Button>
        </div>
      </div>
    </div>
  );
}
