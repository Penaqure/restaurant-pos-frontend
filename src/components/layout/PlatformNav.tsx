"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, Store } from "lucide-react";

const links = [
  { href: "/platform", label: "Vendors", icon: Store },
  { href: "/platform/plans", label: "Plans", icon: CreditCard },
];

export default function PlatformNav() {
  const pathname = usePathname();

  return (
    <ul className="space-y-1">
      {links.map((link) => {
        const active =
          pathname === link.href || (link.href !== "/platform" && pathname.startsWith(`${link.href}/`));
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
  );
}
