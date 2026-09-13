"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, Plus, Store } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import PlatformNav from "@/components/layout/PlatformNav";
import { listVendors, Vendor } from "@/services/vendorService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";

const PLAN_STATUS_TONE: Record<Vendor["planStatus"], "brand" | "success" | "danger"> = {
  trial: "brand",
  active: "success",
  suspended: "danger",
};

const PAGE_SIZE = 10;

export default function PlatformVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    listVendors()
      .then(setVendors)
      .finally(() => setLoading(false));
  }, []);

  const pageCount = Math.max(1, Math.ceil(vendors.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visibleVendors = vendors.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <AppShell title="Vendors" nav={<PlatformNav />}>
      <div className="mb-4 flex justify-end">
        <Link href="/platform/vendors/new">
          <Button>
            <Plus className="size-4" />
            Onboard vendor
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="size-4 text-muted-foreground" />
            Vendors
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading...
            </div>
          ) : vendors.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No vendors yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Contact</th>
                    <th className="px-5 py-3 font-medium">Branches</th>
                    <th className="px-5 py-3 font-medium">Plan</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {visibleVendors.map((v) => (
                    <tr key={v.id} className="border-t border-border">
                      <td className="px-5 py-3">
                        <Link href={`/platform/vendors/${v.id}`} className="font-medium text-brand-700 hover:underline">
                          {v.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{v.contactEmail}</td>
                      <td className="px-5 py-3 text-muted-foreground">{v.branches?.length ?? 0}</td>
                      <td className="px-5 py-3 text-muted-foreground">{v.plan?.name || "—"}</td>
                      <td className="px-5 py-3">
                        <Badge tone={PLAN_STATUS_TONE[v.planStatus]}>{v.planStatus}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/platform/vendors/${v.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="size-3.5" />
                            View
                          </Button>
                        </Link>
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
    </AppShell>
  );
}
