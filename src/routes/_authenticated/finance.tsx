import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { AppShell, EmptyState, StatCard } from "@/components/AppShell";
import { can, useMe } from "@/lib/auth";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/finance")({
  head: () => ({ meta: [{ title: "Finance — TEAM BSY" }] }),
  component: Finance,
});

function Finance() {
  const { data: me } = useMe();
  const [year, setYear] = useState(new Date().getFullYear());
  const allowed = can(me, ["admin", "treasurer"]);
  const { data } = useQuery({
    queryKey: ["finance", year], enabled: allowed,
    queryFn: async () => {
      const [c, e] = await Promise.all([
        apiFetch<Contribution[]>(`/contributions?year=${year}`),
        apiFetch<Expense[]>(`/expenses?year=${year}`),
      ]);
      return {
        c: c.filter((item) => item.payment_status === "SUCCESS"),
        e,
      };
    },
  });
  if (!allowed) return <AppShell title="Finance"><EmptyState title="Finance is for Admins and Treasurers" /></AppShell>;
  const c = data?.c ?? [], e = (data?.e ?? []).filter((x) => x.status === "APPROVED");
  const income = c.reduce((s, x) => s + Number(x.amount), 0), spent = e.reduce((s, x) => s + Number(x.amount), 0);
  const group = <T extends { amount: number | string }>(a: T[], k: (x: T) => string) =>
    Object.entries(a.reduce<Record<string, number>>((m, x) => { m[k(x)] = (m[k(x)] ?? 0) + Number(x.amount); return m; }, {})).sort((a, b) => b[1] - a[1]);

  const Breakdown = ({ title, rows, total }: { title: string; rows: [string, number][]; total: number }) => (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">No data</p> : rows.map(([k, v]) => (
        <div key={k} className="py-1.5">
          <div className="flex justify-between text-sm"><span>{k}</span><span className="font-semibold">{inr(v)}</span></div>
          <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${total ? (v / total) * 100 : 0}%` }} /></div>
        </div>
      ))}
    </div>
  );

  return (
    <AppShell title="Finance" actions={<select className="h-9 rounded-md border bg-card px-3 text-sm" value={year} onChange={(ev) => setYear(Number(ev.target.value))}>
      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => <option key={y}>{y}</option>)}</select>}>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard tone="brand" label="Total income" value={inr(income)} hint={`${c.length} contributions`} />
        <StatCard label="Approved expenses" value={inr(spent)} hint={`${e.length} vouchers`} />
        <StatCard tone="ink" label="Balance" value={inr(income - spent)} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Breakdown title="Expenses by category" rows={group(e, (x) => x.category)} total={spent} />
        <Breakdown title="Expenses by mentor" rows={group(e, (x) => x.mentor_name)} total={spent} />
        <Breakdown title="Income by method" rows={group(c, (x) => (x.payment_method === "CASH" ? "Cash" : "Online"))} total={income} />
        <Breakdown title="Income by purpose" rows={group(c, (x) => x.purpose || "General")} total={income} />
      </div>
    </AppShell>
  );
}

type Contribution = {
  amount: number | string;
  payment_method: string;
  payment_status: string;
  purpose: string | null;
};

type Expense = {
  amount: number | string;
  category: string;
  mentor_name: string;
  status: string;
};
