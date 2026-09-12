"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Printer, X } from "lucide-react";
import Button from "@/components/ui/Button";
import type { RestaurantTable } from "@/services/tableService";

export default function TableQrModal({ table, onClose }: { table: RestaurantTable; onClose: () => void }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  // window.location.origin, not an env var -- this modal always renders
  // from the same site a customer's phone will hit, in dev or prod alike.
  const orderUrl = typeof window !== "undefined" ? `${window.location.origin}/order/${table.id}` : "";

  function handleDownload() {
    const canvas = wrapperRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `table-${table.name}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div
      className="qr-print-modal fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="w-full max-w-xs rounded-xl bg-surface-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Table {table.name}</h3>
            <p className="text-xs text-muted-foreground">Scan to view the menu and order</p>
          </div>
          <button
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-black/5"
          >
            <X className="size-4" />
          </button>
        </div>

        <div ref={wrapperRef} className="mt-4 flex justify-center rounded-lg border border-border bg-white p-4 print:border-none">
          {orderUrl && <QRCodeCanvas value={orderUrl} size={200} level="M" />}
        </div>

        <p className="mt-3 break-all text-center text-xs text-muted-foreground">{orderUrl}</p>

        <div className="mt-4 flex gap-2 print:hidden">
          <Button variant="secondary" onClick={handleDownload} className="flex-1">
            <Download className="size-4" />
            Download
          </Button>
          <Button variant="secondary" onClick={() => window.print()} className="flex-1">
            <Printer className="size-4" />
            Print
          </Button>
        </div>
      </div>
    </div>
  );
}
