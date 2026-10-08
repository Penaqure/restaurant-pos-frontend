import axiosInstance from "@/lib/axiosInstance";

export type AuditLogEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string } | null;
};

export type AuditLogPage = {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listAuditLog(params: { from?: string; to?: string; action?: string; page?: number }) {
  const { data } = await axiosInstance.get<AuditLogPage>("/audit-log", { params });
  return data;
}
