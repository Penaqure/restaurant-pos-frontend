"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, Plus, Store } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import PlatformNav from "@/components/layout/PlatformNav";
import { listVendors, Vendor } from "@/services/vendorService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";

const PLAN_STATUS_TONE: Record<Vendor["planStatus"], "brand" | "success" | "danger"> = {
  trial: "brand",
  active: "success",
  suspended: "danger",
};

const SORT_OPTIONS = [
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "branches-desc", label: "Most branches" },
] as const;
type SortOption = (typeof SORT_OPTIONS)[number]["value"];

const PAGE_SIZE = 10;

export default function PlatformVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Vendor["planStatus"] | "all">("all");
  const [sort, setSort] = useState<SortOption>("name-asc");

  useEffect(() => {
    listVendors()
      .then(setVendors)
      .finally(() => setLoading(false));
  }, []);

  function updateAndResetPage<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  const filteredVendors = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = vendors.filter((v) => {
      if (statusFilter !== "all" && v.planStatus !== statusFilter) return false;
      if (
        query &&
        !v.name.toLowerCase().includes(query) &&
        !v.contactEmail.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });
    result.sort((a, b) => {
      if (sort === "branches-desc") return (b.branches?.length ?? 0) - (a.branches?.length ?? 0);
      return sort === "name-desc" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
    });
    return result;
  }, [vendors, search, statusFilter, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredVendors.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visibleVendors = filteredVendors.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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
        <CardContent className="flex flex-col gap-3 border-b border-border sm:flex-row sm:flex-wrap sm:items-center">
          <SearchInput
            value={search}
            onChange={(e) => updateAndResetPage(setSearch, e.target.value)}
            placeholder="Search name or email..."
            className="sm:max-w-xs sm:flex-1"
          />
          <Select
            value={statusFilter}
            onChange={(e) => updateAndResetPage(setStatusFilter, e.target.value as Vendor["planStatus"] | "all")}
            className="sm:w-auto"
          >
            <option value="all">All plan statuses</option>
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
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
          ) : vendors.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No vendors yet.</p>
          ) : filteredVendors.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No vendors match your search/filters.</p>
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
