import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, EmptyState } from "@/components/AppShell";
import { can, useMe } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { adminApi } from "@/lib/admin-api";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({ meta: [{ title: "Audit Log — TEAM BSY" }] }),
  component: Audit,
});

function Audit() {
  const { data: me } = useMe();
  const ok = can(me, ["admin"]);
  const { data = [], isLoading } = useQuery({
    queryKey: ["audit"], enabled: ok,
    queryFn: adminApi.audit,
  });
  if (!ok) return <AppShell title="Audit Log"><EmptyState title="Admins only" /></AppShell>;
  return (
    <AppShell title="Audit Log">
      {isLoading ? <div className="h-64 animate-pulse rounded-xl bg-muted" /> : data.length === 0 ? <EmptyState title="No activity yet" /> : (
        <div className="rounded-xl border bg-card shadow-card">
          {data.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-3 border-t px-5 py-3 text-sm first:border-t-0">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="font-semibold">{a.who}</span>
              <span>{a.action}</span>
              <span className="text-muted-foreground">{Object.entries((a.details as Record<string, unknown>) ?? {}).filter(([, v]) => v != null).map(([k, v]) => `${k}: ${v}`).join(" · ")}</span>
              <span className="ml-auto text-xs text-muted-foreground">{fmtDateTime(a.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
