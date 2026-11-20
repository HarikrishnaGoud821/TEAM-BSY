import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus } from "lucide-react";
import { AppShell, EmptyState, StatusBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { can, useMe } from "@/lib/auth";
import { expenseCode, fmtDate, inr } from "@/lib/format";
import { apiFetch } from "@/lib/api";

type ExpenseListItem = {
  id: string;
  serial_no: number;
  shop_name: string;
  status: string;
  amount: number;
  category: string;
  purpose: string;
  mentor_name: string;
  expense_date: string;
};

export const Route = createFileRoute("/_authenticated/expenses/")({
  head: () => ({ meta: [{ title: "Expenses — TEAM BSY" }] }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const { data: me } = useMe();
  const [status, setStatus] = useState("ALL");

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => apiFetch<ExpenseListItem[]>("/expenses"),
  });

  const rows = data.filter(
    (e) => status === "ALL" || e.status === status,
  );

  const totalAmount = data.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const pendingAmount = data
    .filter((e) => e.status === "PENDING")
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const approvedAmount = data
    .filter((e) => e.status === "APPROVED")
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <AppShell
      title="Expenses & Money Usage"
      actions={
        can(me, ["admin", "mentor"]) && (
          <Button asChild variant="hero" size="sm">
            <Link to="/expenses/new">
              <Plus /> Add expense
            </Link>
          </Button>
        )
      }
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-card">
          <div className="text-sm text-muted-foreground">Total Expenses</div>
          <div className="mt-2 font-display text-2xl font-bold">{inr(totalAmount)}</div>
          <div className="text-xs text-muted-foreground">{data.length} records</div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-card">
          <div className="text-sm text-muted-foreground">Pending Amount</div>
          <div className="mt-2 font-display text-2xl font-bold">{inr(pendingAmount)}</div>
          <div className="text-xs text-muted-foreground">Awaiting approval</div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-card">
          <div className="text-sm text-muted-foreground">Approved Amount</div>
          <div className="mt-2 font-display text-2xl font-bold">{inr(approvedAmount)}</div>
          <div className="text-xs text-muted-foreground">Approved expenses</div>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
              status === s
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card"
            }`}
          >
            {s === "ALL" ? "All" : s[0] + s.slice(1).toLowerCase()}{" "}
            {s !== "ALL" && `(${data.filter((e) => e.status === s).length})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      ) : isError ? (
        <EmptyState
          title="Could not load expenses"
          text={error instanceof Error ? error.message : "Please try again."}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No expenses"
          text="Every rupee spent is recorded here with the shop bill."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((e) => (
            <Link
              key={e.id}
              to="/expenses/$id"
              params={{ id: e.id }}
              className="rounded-xl border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/50"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {expenseCode(e.serial_no)}
                  </div>
                  <div className="mt-1 font-display font-semibold">
                    {e.shop_name}
                  </div>
                </div>
                <StatusBadge status={e.status} />
              </div>

              <div className="mt-3 font-display text-2xl font-bold">
                {inr(e.amount)}
              </div>

              <div className="mt-1 text-sm text-muted-foreground">
                {e.category} · {e.purpose}
              </div>

              <div className="mt-3 flex justify-between border-t pt-3 text-xs text-muted-foreground">
                <span>{e.mentor_name}</span>
                <span>{fmtDate(e.expense_date)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}