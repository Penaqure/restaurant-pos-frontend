"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, ClipboardList, CreditCard, PackageX, Users2 } from "lucide-react";
import { useNotifications, AppNotification, NotificationType } from "@/context/NotificationContext";

const ICONS: Record<NotificationType, typeof Bell> = {
  "order:placed": ClipboardList,
  "order:status_changed": ClipboardList,
  "payment:received": CreditCard,
  "menu:item_unavailable": PackageX,
  "tables:low_availability": Users2,
};

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function NotificationRow({ n, onClick }: { n: AppNotification; onClick: () => void }) {
  const Icon = ICONS[n.type];
  const body = (
    <div
      className={`flex gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-black/[0.02] ${
        n.read ? "" : "bg-brand-50/60"
      }`}
    >
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{n.title}</p>
        <p className="truncate text-xs text-muted-foreground">{n.message}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</p>
      </div>
      {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-600" />}
    </div>
  );
  return n.link ? (
    <Link href={n.link} onClick={onClick}>
      {body}
    </Link>
  ) : (
    <div onClick={onClick}>{body}</div>
  );
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
        className="relative flex size-9 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-black/5"
      >
        <Bell className="size-4.5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-2 w-80 max-w-[90vw] rounded-xl border border-border bg-surface-card shadow-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              {notifications.length > 0 && (
                <button onClick={markAllRead} className="text-xs font-medium text-brand-700 hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
              ) : (
                notifications.map((n) => (
                  <NotificationRow
                    key={n.id}
                    n={n}
                    onClick={() => {
                      markRead(n.id);
                      setOpen(false);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
