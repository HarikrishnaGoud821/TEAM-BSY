import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { AppShell, EmptyState, StatusBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { can, useMe } from "@/lib/auth";
import { contribCode, fmtDate, inr } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/contributions")({
  head: () => ({ meta: [{ title: "Contributions — TEAM BSY" }] }),
  component: ContributionsPage,
});

const PAGE = 25;
interface Contribution {
  id: string;
  serial_no: number | null;
  receipt_number: string | null;
  donation_date: string;
  donor_name: string | null;
  donor_mobile: string | null;
  amount: number;
  payment_method: string | null;
  payment_status: string;
  purpose: string | null;
  village: string | null;
  mandal: string | null;
  district: string | null;
  pincode: string | null;
  entered_by_name: string | null;
  payment_id: string | null;
}

function ContributionsPage() {
  const { data: me } = useMe();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [method, setMethod] = useState("ALL");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [page, setPage] = useState(0);

  const { data = [], isLoading } = useQuery<Contribution[]>({
    queryKey: ["contributions", year],
    queryFn: () =>
      apiFetch<Contribution[]>(
        `/contributions${year !== "ALL" ? `?year=${encodeURIComponent(year)}` : ""}`
      ),
  });

  const rows = useMemo(() => data.filter((c) =>
    (status === "ALL" || c.payment_status === status) &&
    (method === "ALL" || (method === "CASH" ? c.payment_method === "CASH" : c.payment_method !== "CASH")) &&
    (!q || [c.donor_name, c.donor_mobile, c.receipt_number, c.purpose, c.village].some((v) => v?.toLowerCase().includes(q.toLowerCase())))
  ), [data, q, status, method]);
  const total = rows.filter((r) => r.payment_status === "SUCCESS").reduce((s, r) => s + Number(r.amount), 0);

  function exportCsv() {
    const head = ["Receipt", "Contribution", "Date", "Donor", "Mobile", "Amount", "Method", "Status", "Purpose", "Village", "Mandal", "District", "Pincode", "Entered by", "Payment ID"];
    const lines = rows.map((r) => [r.receipt_number, contribCode(r.serial_no), r.donation_date, r.donor_name, r.donor_mobile, r.amount, r.payment_method, r.payment_status, r.purpose, r.village, r.mandal, r.district, r.pincode, r.entered_by_name, r.payment_id]
      .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `team-bsy-contributions-${year}.csv`; a.click();
  }

  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));
  const sel = "h-9 rounded-md border bg-card px-3 text-sm";

  return (
    <AppShell title={can(me, ["admin", "mentor", "treasurer"]) ? "Contributions" : "My Payments"} actions={
      <div className="flex gap-2">
        {can(me, ["admin", "mentor"]) && <Button asChild variant="outline" size="sm"><Link to="/cash"><Plus /> Cash</Link></Button>}
        <Button asChild variant="hero" size="sm"><Link to="/pay"><Plus /> Pay online</Link></Button>
      </div>}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input placeholder="Search donor, mobile, receipt…" className="h-9 max-w-xs bg-card" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        <select className={sel} value={year} onChange={(e) => { setYear(e.target.value); setPage(0); }}>
          {years.map((y) => <option key={y}>{y}</option>)}<option value="ALL">All years</option>
        </select>
        <select className={sel} value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
          <option value="ALL">All statuses</option><option>SUCCESS</option><option>PENDING</option><option>FAILED</option>
        </select>
        <select className={sel} value={method} onChange={(e) => { setMethod(e.target.value); setPage(0); }}>
          <option value="ALL">Cash & online</option><option value="CASH">Cash</option><option value="ONLINE">Online</option>
        </select>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{rows.length} records · <b className="text-foreground">{inr(total)}</b> collected</span>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!rows.length}><Download /> CSV</Button>
        </div>
      </div>
      {isLoading ? <div className="h-64 animate-pulse rounded-xl bg-muted" /> : rows.length === 0 ? (
        <EmptyState title="No contributions yet" text="Contributions will show here once recorded." action={<Button asChild variant="hero"><Link to="/pay">Make a contribution</Link></Button>} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                <tr>{["Receipt", "Date", "Donor", "Purpose", "Method", "Amount", "Status", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.slice(page * PAGE, page * PAGE + PAGE).map((c) => (
                  <tr key={c.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{c.receipt_number ?? contribCode(c.serial_no)}</td>
                    <td className="px-4 py-3">{fmtDate(c.donation_date)}</td>
                    <td className="px-4 py-3"><div className="font-medium">{c.donor_name}</div><div className="text-xs text-muted-foreground">{c.donor_mobile} · {c.village ?? ""}</div></td>
                    <td className="px-4 py-3">{c.purpose ?? "—"}</td>
                    <td className="px-4 py-3">{c.payment_method === "CASH" ? "Cash" : c.payment_method === "QR" ? "QR / UPI" : "Online"}</td>
                    <td className="px-4 py-3 font-semibold">{inr(c.amount)}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.payment_status} /></td>
                    <td className="px-4 py-3 text-right">{c.payment_status === "SUCCESS" && <Link to="/receipts/$id" params={{ id: c.id }} className="font-semibold text-primary">Receipt</Link>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > PAGE && (
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={(page + 1) * PAGE >= rows.length} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
