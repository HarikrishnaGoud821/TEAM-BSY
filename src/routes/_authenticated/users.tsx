import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, EmptyState } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { can, ROLE_LABEL, useMe, type AppRole } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { adminApi } from "@/lib/admin-api";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({ meta: [{ title: "Users — TEAM BSY" }] }),
  component: Users,
});

const ROLES: AppRole[] = ["admin", "mentor", "treasurer", "volunteer", "member", "viewer"];

function Users() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const isAdmin = can(me, ["admin"]);
  const { data = [], isLoading } = useQuery({
    queryKey: ["users"], enabled: isAdmin,
    queryFn: adminApi.users,
  });
  if (!isAdmin) return <AppShell title="Users"><EmptyState title="Admins only" /></AppShell>;

  async function toggle(uid: string, role: AppRole, has: boolean) {
    if (uid === me?.id && role === "admin") return void toast.error("You can't remove your own admin role");
    try {
      if (has) await adminApi.removeRole(uid, role);
      else await adminApi.addRole(uid, role);
    } catch (error) {
      return void toast.error(error instanceof Error ? error.message : "Could not change role");
    }
    toast.success(`${ROLE_LABEL[role]} ${has ? "removed" : "added"}`);
    qc.invalidateQueries({ queryKey: ["users"] });
  }
  async function setActive(uid: string, active: boolean) {
    try {
      await adminApi.setUserActive(uid, active);
      await qc.invalidateQueries({ queryKey: ["users"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update");
    }
  }

  const rows = data.filter((u) => !q || [u.full_name, u.mobile, u.village].some((v) => v?.toLowerCase().includes(q.toLowerCase())));
  return (
    <AppShell title="Users & Roles">
      <Input placeholder="Search name, mobile, village…" className="mb-4 max-w-xs bg-card" value={q} onChange={(e) => setQ(e.target.value)} />
      {isLoading ? <div className="h-64 animate-pulse rounded-xl bg-muted" /> : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Roles (tap to toggle)</th><th className="px-4 py-3">Status</th></tr></thead>
            <tbody>{rows.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-3"><div className="font-medium">{u.full_name || "—"}</div><div className="text-xs text-muted-foreground">{u.mobile ?? ""}</div></td>
                <td className="px-4 py-3">{fmtDate(u.created_at)}</td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{ROLES.map((r) => {
                  const has = u.roles.includes(r);
                  return <button key={r} onClick={() => toggle(u.id, r, has)} className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${has ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:border-primary"}`}>{ROLE_LABEL[r]}</button>;
                })}</div></td>
                <td className="px-4 py-3"><button onClick={() => setActive(u.id, !u.active)} disabled={u.id === me?.id} className={`text-xs font-semibold ${u.active ? "text-success" : "text-destructive"}`}>{u.active ? "Active" : "Inactive"}</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
