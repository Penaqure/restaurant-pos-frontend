"use client";

import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { AlertTriangle, CheckCircle2, Download, Upload, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { downloadBlob } from "@/lib/exportCsv";
import { importCategories, importItems, downloadImportSample, ImportResult } from "@/services/menuService";

const COPY = {
  categories: {
    title: "Import categories",
    columns: "name (required), description, sortOrder, isActive",
    note: "A row whose name matches an existing category updates it instead of creating a duplicate.",
    run: importCategories,
  },
  items: {
    title: "Import menu items",
    columns: "category (required), name (required), description, basePrice (required), isVeg, isAvailable, sortOrder, taxRate",
    note: "category and taxRate are matched by name — unknown categories are created automatically. A row whose category + name matches an existing item updates it instead of creating a duplicate.",
    run: importItems,
  },
} as const;

export default function ImportMenuModal({
  kind,
  onClose,
  onImported,
}: {
  kind: "categories" | "items";
  onClose: () => void;
  onImported: () => void;
}) {
  const copy = COPY[kind];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [downloadingSample, setDownloadingSample] = useState<"csv" | "json" | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleDownloadSample(format: "csv" | "json") {
    setDownloadingSample(format);
    try {
      const blob = await downloadImportSample(kind, format);
      downloadBlob(`menu-${kind}-sample.${format}`, blob);
    } catch {
      toast.error("Could not download sample file");
    } finally {
      setDownloadingSample(null);
    }
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      const data = await copy.run(file);
      setResult(data);
      if (data.errors.length === 0) {
        toast.success(`${data.created} created, ${data.updated} updated`);
      } else {
        toast.warning(`Imported with ${data.errors.length} row error${data.errors.length === 1 ? "" : "s"}`);
      }
      onImported();
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || "Could not import file");
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-surface-card p-5 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">{copy.title}</h3>
            <p className="text-xs text-muted-foreground">Upload a CSV or JSON file</p>
          </div>
          <button
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/5"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-border bg-foreground/[0.02] p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Columns</p>
            <p className="mt-0.5 font-mono">{copy.columns}</p>
            <p className="mt-2">{copy.note}</p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="flex-1"
              loading={downloadingSample === "csv"}
              onClick={() => handleDownloadSample("csv")}
            >
              {downloadingSample !== "csv" && <Download className="size-3.5" />}
              Sample CSV
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="flex-1"
              loading={downloadingSample === "json"}
              onClick={() => handleDownloadSample("json")}
            >
              {downloadingSample !== "json" && <Download className="size-3.5" />}
              Sample JSON
            </Button>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setResult(null);
              }}
              className="block w-full rounded-md border border-border bg-surface-card text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-xs file:font-medium file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-500/15 dark:file:text-brand-300 dark:hover:file:bg-brand-500/25"
            />
          </div>

          {result && (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone="success">{result.created} created</Badge>
                <Badge tone="brand">{result.updated} updated</Badge>
                {typeof result.categoriesCreated === "number" && result.categoriesCreated > 0 && (
                  <Badge tone="neutral">{result.categoriesCreated} new categories</Badge>
                )}
                {result.errors.length > 0 && <Badge tone="danger">{result.errors.length} errors</Badge>}
              </div>
              {result.errors.length === 0 ? (
                <p className="flex items-center gap-1.5 text-xs text-green-700">
                  <CheckCircle2 className="size-3.5" />
                  All {result.totalRows} rows imported successfully.
                </p>
              ) : (
                <div className="max-h-36 space-y-1 overflow-y-auto text-xs">
                  {result.errors.map((e, i) => (
                    <p key={i} className="flex items-start gap-1.5 text-danger">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                      Row {e.row}: {e.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          {result ? (
            <>
              <Button variant="secondary" onClick={reset} className="flex-1">
                Import another file
              </Button>
              <Button onClick={onClose} className="flex-1">
                Done
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleImport} loading={importing} disabled={!file} className="flex-1">
                {!importing && <Upload className="size-4" />}
                Import
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
