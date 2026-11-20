import { apiFetch } from "@/lib/api";
import type { AppRole } from "@/lib/auth";

export type AdminUser = {
  id: string;
  email: string;
  full_name: string | null;
  mobile: string | null;
  village: string | null;
  created_at: string;
  active: boolean;
  roles: AppRole[];
};

export type AdminAuditLog = {
  id: string;
  user_id: string | null;
  who: string;
  action: string;
  entity: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

export const adminApi = {
  users: () => apiFetch<AdminUser[]>("/admin/users"),

  addRole: (userId: string, role: AppRole) =>
    apiFetch<void>(`/admin/users/${encodeURIComponent(userId)}/roles/${role}`, {
      method: "POST",
    }),

  removeRole: (userId: string, role: AppRole) =>
    apiFetch<void>(`/admin/users/${encodeURIComponent(userId)}/roles/${role}`, {
      method: "DELETE",
    }),

  setUserActive: (userId: string, active: boolean) =>
    apiFetch<void>(`/admin/users/${encodeURIComponent(userId)}/active`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    }),

  audit: () => apiFetch<AdminAuditLog[]>("/admin/audit?size=300"),
};
