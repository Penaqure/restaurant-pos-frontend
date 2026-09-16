"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LayoutGrid,
  UtensilsCrossed,
  Grid3x3,
  ShoppingCart,
  ClipboardList,
  ChefHat,
  Receipt,
  Percent,
  BarChart3,
  Users,
  Building2,
  Settings,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Mirrors each route's actual backend role gate (see the corresponding
// routes/*.js authorizeRoles calls) so staff never see a nav item that just
// 403s when clicked. Omitting `roles` means every role can see it.
//
// Grouped (and ordered within each group) by how often it's touched during
// a shift: daily front-of-house operations first, then menu setup, then
// reporting, then the admin-only staff/branch management at the bottom --
// rather than the previous flat list, which put menu setup ahead of the
// screens staff actually live in during service.
const sections: { label: string; links: { href: string; label: string; icon: typeof LayoutDashboard; roles?: string[] }[] }[] = [
  {
    label: "Operations",
    links: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/pos", label: "POS", icon: ShoppingCart, roles: ["owner", "manager", "cashier"] },
      { href: "/dashboard/kitchen", label: "Kitchen", icon: ChefHat, roles: ["owner", "manager", "kitchen"] },
      { href: "/dashboard/orders", label: "Orders", icon: ClipboardList, roles: ["owner", "manager", "cashier", "waiter"] },
      { href: "/dashboard/tables", label: "Tables", icon: Grid3x3, roles: ["owner", "manager", "cashier", "waiter"] },
      { href: "/dashboard/bills", label: "Bills", icon: Receipt, roles: ["owner", "manager", "cashier"] },
    ],
  },
  {
    label: "Menu",
    links: [
      { href: "/dashboard/menu/categories", label: "Categories", icon: LayoutGrid, roles: ["owner", "manager", "cashier", "waiter"] },
      { href: "/dashboard/menu/items", label: "Menu items", icon: UtensilsCrossed, roles: ["owner", "manager", "cashier", "waiter"] },
      { href: "/dashboard/discounts", label: "Discounts", icon: Percent, roles: ["owner", "manager", "cashier"] },
    ],
  },
  {
    label: "Insights",
    links: [{ href: "/dashboard/reports", label: "Reports", icon: BarChart3, roles: ["owner", "manager"] }],
  },
  {
    label: "Manage",
    links: [
      { href: "/dashboard/staff", label: "Staff", icon: Users, roles: ["owner", "manager"] },
      { href: "/dashboard/branches", label: "Branches", icon: Building2, roles: ["owner"] },
      { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["owner"] },
    ],
  },
];

export default function VendorNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const visibleSections = sections
    .map((section) => ({
      ...section,
      links: section.links.filter((link) => !link.roles || (user && link.roles.includes(user.role))),
    }))
    .filter((section) => section.links.length > 0);

  return (
    <div className="space-y-4">
      {visibleSections.map((section) => (
        <div key={section.label}>
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {section.label}
          </p>
          <ul className="space-y-1">
            {section.links.map((link) => {
              const active =
                pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(`${link.href}/`));
              const Icon = link.icon;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                        : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                    }`}
                  >
                    <Icon className={`size-4.5 shrink-0 ${active ? "text-brand-600" : "text-muted-foreground"}`} />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
