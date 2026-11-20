import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Banknote, CreditCard, HandCoins, Hourglass, Receipt, Wallet } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { AppShell, EmptyState, StatCard, StatusBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { can, useMe } from "@/lib/auth";
import { fmtDate, inr } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TEAM BSY" }] }),
  component: Dashboard,
});

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function Dashboard() {
  const { data: me } = useMe();
  const [year, setYear] = useState(new Date().getFullYear());
  const staff = can(me, ["admin", "treasurer", "mentor"]);
  const seesExpenses = can(me, ["admin", "treasurer", "mentor"]);

  const { data: contribs = [], isLoading } = useQuery({
    queryKey: ["dash-contrib", year],
    queryFn: () => apiFetch<Contribution[]>(`/contributions?year=${year}`),
  });
  const { data: expenses = [] } = useQuery({
    queryKey: ["dash-exp", year], enabled: seesExpenses,
    queryFn: () => apiFetch<Expense[]>(`/expenses?year=${year}`),
  });

  const ok = contribs.filter((c) => c.payment_status === "SUCCESS");
  const sum = (a: { amount: number | string }[]) => a.reduce((s, x) => s + Number(x.amount), 0);
  const cash = sum(ok.filter((c) => c.payment_method === "CASH"));
  const online = sum(ok) - cash;
  const approvedExp = sum(expenses.filter((e) => e.status === "APPROVED"));
  const pendingExp = expenses.filter((e) => e.status === "PENDING");
  const monthly = MONTHS.map((m, i) => ({
    m,
    collection: sum(ok.filter((c) => new Date(c.donation_date).getMonth() === i)),
    expenses: sum(expenses.filter((e) => e.status === "APPROVED" && new Date(e.expense_date).getMonth() === i)),
  }));
  const byCat = Object.entries(expenses.filter((e) => e.status === "APPROVED").reduce<Record<string, number>>((a, e) => { a[e.category] = (a[e.category] ?? 0) + Number(e.amount); return a; }, {}))
    .map(([name, value]) => ({ name, value }));
  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

  return (
    <AppShell title="Dashboard" actions={
      <select className="h-9 rounded-md border bg-card px-3 text-sm" value={year} onChange={(e) => setYear(Number(e.target.value))}>
        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => <option key={y}>{y}</option>)}
      </select>}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-ink-gradient p-6 text-ink-foreground">
        <div>
          <div className="text-sm text-gold">Namaskaram,</div>
          <div className="font-display text-2xl font-bold">{me?.profile?.full_name || "Welcome"}</div>
          <div className="text-sm opacity-70">{staff ? `TEAM BSY summary for ${year}` : "Thank you for supporting TEAM BSY"}</div>
        </div>
        <Button asChild variant="hero" size="lg"><Link to="/pay"><CreditCard /> Quick Pay</Link></Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard tone="brand" label={staff ? "Total collection" : "You contributed"} value={inr(sum(ok))} hint={`${ok.length} contributions`} icon={HandCoins} />
        <StatCard label="Online" value={inr(online)} icon={CreditCard} />
        <StatCard label="Cash" value={inr(cash)} icon={Banknote} />
        <StatCard label="Pending payments" value={contribs.filter((c) => c.payment_status === "PENDING").length} icon={Hourglass} />
        {seesExpenses && <>
          <StatCard tone="ink" label="Balance" value={inr(sum(ok) - approvedExp)} hint="Collection − approved expenses" icon={Wallet} />
          <StatCard label="Approved expenses" value={inr(approvedExp)} icon={Receipt} />
          <StatCard label="Pending expenses" value={pendingExp.length} hint={inr(sum(pendingExp))} icon={Hourglass} />
        </>}
      </div>

      {isLoading ? <div className="mt-6 h-72 animate-pulse rounded-xl bg-muted" /> : (
        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <div className="rounded-xl border bg-card p-5 shadow-card xl:col-span-2">
            <h3 className="mb-4 font-semibold">Monthly collection{seesExpenses ? " vs expenses" : ""}</h3>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="m" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`} />
                  <Tooltip formatter={(v: number) => inr(v)} cursor={{ fill: "var(--muted)" }} />
                  <Bar dataKey="collection" name="Collection" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                  {seesExpenses && <Bar dataKey="expenses" name="Expenses" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <h3 className="mb-4 font-semibold">{seesExpenses ? "Expense categories" : "Cash vs online"}</h3>
            {(() => {
              const d = seesExpenses ? byCat : [{ name: "Online", value: online }, { name: "Cash", value: cash }].filter((x) => x.value);
              return d.length === 0 ? <p className="py-20 text-center text-sm text-muted-foreground">No data yet</p> : (
                <div className="h-72"><ResponsiveContainer><PieChart>
                  <Pie data={d} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                    {d.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                  </Pie><Tooltip formatter={(v: number) => inr(v)} />
                </PieChart></ResponsiveContainer></div>
              );
            })()}
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Recent contributions</h3><Link to="/contributions" className="text-sm font-semibold text-primary">View all</Link></div>
          {contribs.length === 0 ? <EmptyState title="Nothing yet" /> : contribs.slice(0, 6).map((c) => (
            <div key={c.id} className="flex items-center justify-between border-t py-2.5 text-sm first:border-t-0">
              <div><div className="font-medium">{c.donor_name}</div><div className="text-xs text-muted-foreground">{fmtDate(c.donation_date)} · {c.purpose ?? "General"}</div></div>
              <div className="text-right"><div className="font-semibold">{inr(c.amount)}</div><StatusBadge status={c.payment_status} /></div>
            </div>
          ))}
        </div>
        {seesExpenses && (
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Recent expenses</h3><Link to="/expenses" className="text-sm font-semibold text-primary">View all</Link></div>
            {expenses.length === 0 ? <EmptyState title="No expenses recorded" /> : expenses.slice(0, 6).map((e) => (
              <Link key={e.id} to="/expenses/$id" params={{ id: e.id }} className="flex items-center justify-between border-t py-2.5 text-sm first:border-t-0 hover:bg-muted/30">
                <div><div className="font-medium">{e.shop_name}</div><div className="text-xs text-muted-foreground">{e.category} · {e.mentor_name}</div></div>
                <div className="text-right"><div className="font-semibold">{inr(e.amount)}</div><StatusBadge status={e.status} /></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

type Contribution = {
  id: string;
  amount: number | string;
  payment_method: string;
  payment_status: string;
  donor_name: string;
  donation_date: string;
  purpose: string | null;
  entered_by_name: string | null;
  receipt_number: string | null;
};

type Expense = {
  id: string;
  amount: number | string;
  status: string;
  category: string;
  shop_name: string;
  expense_date: string;
  mentor_name: string;
};
