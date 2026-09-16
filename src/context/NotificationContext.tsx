"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/api\/?$/, "");
const MAX_NOTIFICATIONS = 50;

export type NotificationType =
  | "order:placed"
  | "order:status_changed"
  | "payment:received"
  | "menu:item_unavailable"
  | "tables:low_availability";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  createdAt: string;
  read: boolean;
};

type OrderPlacedPayload = {
  id: string;
  orderNumber: string;
  table: { id: string; name: string } | null;
  totalAmount: string;
  actorUserId?: string;
};
type OrderStatusChangedPayload = {
  id: string;
  orderNumber: string;
  status: string;
  table: { id: string; name: string } | null;
  actorUserId?: string;
};
type PaymentReceivedPayload = {
  billId: string;
  billNumber: string;
  amount: number;
  method: string;
  actorUserId?: string;
};
type MenuItemUnavailablePayload = { id: string; name: string; categoryName: string | null; actorUserId?: string };
type TablesLowAvailabilityPayload = {
  occupied: number;
  total: number;
  availableCount: number;
  actorUserId?: string;
};

type NotificationContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clear: () => void;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;

    // Notifications are vendor-scoped -- platform super-admins (no vendorId)
    // have nothing to subscribe to.
    if (!user || !user.vendorId) return;
    const currentUserId = user.id;

    // Auth rides the httpOnly cookie on the handshake request rather than a
    // client-supplied token (see notificationService.js on the backend).
    const socket = io(SOCKET_URL, { withCredentials: true, transports: ["websocket"] });
    socketRef.current = socket;

    function push(n: Omit<AppNotification, "id" | "createdAt" | "read">, actorUserId?: string) {
      const isOwnAction = !!actorUserId && actorUserId === currentUserId;
      const notification: AppNotification = {
        ...n,
        id: `${n.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        read: isOwnAction,
      };
      setNotifications((prev) => [notification, ...prev].slice(0, MAX_NOTIFICATIONS));
      // The actor already sees their own success toast at the point of
      // action (e.g. "Order placed" on the POS page) -- toasting this echo
      // of it too would just be a duplicate. Only other staff get toasted.
      if (!isOwnAction) {
        toast.success(`${notification.title} — ${notification.message}`);
      }
    }

    socket.on("order:placed", (payload: OrderPlacedPayload) => {
      push(
        {
          type: "order:placed",
          title: "New order placed",
          message: `${payload.orderNumber}${payload.table ? ` — ${payload.table.name}` : ""} · ₹${payload.totalAmount}`,
          link: `/dashboard/orders/${payload.id}`,
        },
        payload.actorUserId
      );
    });

    socket.on("order:status_changed", (payload: OrderStatusChangedPayload) => {
      push(
        {
          type: "order:status_changed",
          title: `Order ${payload.status}`,
          message: `${payload.orderNumber}${payload.table ? ` — ${payload.table.name}` : ""}`,
          link: `/dashboard/orders/${payload.id}`,
        },
        payload.actorUserId
      );
    });

    socket.on("payment:received", (payload: PaymentReceivedPayload) => {
      push(
        {
          type: "payment:received",
          title: "Payment received",
          message: `₹${payload.amount} (${payload.method}) on ${payload.billNumber}`,
          link: `/dashboard/bills/${payload.billId}`,
        },
        payload.actorUserId
      );
    });

    socket.on("menu:item_unavailable", (payload: MenuItemUnavailablePayload) => {
      push(
        {
          type: "menu:item_unavailable",
          title: "Item marked unavailable",
          message: payload.categoryName ? `${payload.name} — ${payload.categoryName}` : payload.name,
          link: "/dashboard/menu/items",
        },
        payload.actorUserId
      );
    });

    socket.on("tables:low_availability", (payload: TablesLowAvailabilityPayload) => {
      push(
        {
          type: "tables:low_availability",
          title: "Tables running low",
          message: `${payload.occupied}/${payload.total} occupied · ${payload.availableCount} free`,
          link: "/dashboard/tables",
        },
        payload.actorUserId
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }
  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }
  function clear() {
    setNotifications([]);
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, markRead, clear }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationProvider");
  return ctx;
}
