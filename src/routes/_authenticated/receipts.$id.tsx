import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, Printer, Share2, ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { AppShell, EmptyState, StatusBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { amountInWords, contribCode, fmtDate, fmtDateTime, inr } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/receipts/$id")({
  head: () => ({ meta: [{ title: "Receipt — TEAM BSY" }] }),
  component: ReceiptPage,
});

interface ReceiptContribution {
  id: string;
  serial_no: number | null;
  receipt_number: string | null;
  donation_date: string;
  donor_name: string;
  donor_mobile: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  purpose: string | null;
  village: string | null;
  mandal: string | null;
  district: string | null;
  pincode: string | null;
  entered_by_name: string | null;
  payment_id: string | null;
  order_id: string | null;
  updated_at: string;
}
function ReceiptPage() {
  const { id } = Route.useParams();
  const { data: c, isLoading } = useQuery<ReceiptContribution>({
    queryKey: ["contribution", id],
    queryFn: () =>
      apiFetch<ReceiptContribution>(
        `/contributions/${encodeURIComponent(id)}`
      ),
  });

  const back = <Button asChild variant="ghost" size="sm"><Link to="/contributions"><ArrowLeft /> Back</Link></Button>;
  if (isLoading) return <AppShell title="Receipt" actions={back}><div className="mx-auto h-[600px] max-w-3xl animate-pulse rounded-xl bg-muted" /></AppShell>;
  if (!c) return <AppShell title="Receipt" actions={back}><EmptyState title="Receipt not found" /></AppShell>;
  if (c.payment_status !== "SUCCESS" || !c.receipt_number)
    return <AppShell title="Receipt" actions={back}><EmptyState title="No receipt yet" text={`This payment is ${c.payment_status.toLowerCase()}. A receipt is issued only after payment is confirmed.`} /></AppShell>;

  const share = async () => {
    const text = `TEAM BSY receipt ${c.receipt_number}: ${inr(c.amount)} from ${c.donor_name}`;
    if (navigator.share) await navigator.share({ title: "TEAM BSY Receipt", text, url: location.href }).catch(() => {});
    else { await navigator.clipboard.writeText(`${text} — ${location.href}`); }
  };

  const rows: [string, string][] = [
    ["Donor name", c.donor_name], ["Mobile", c.donor_mobile],
    ["Purpose", c.purpose || "General contribution"], ["Donation date", fmtDate(c.donation_date)],
    ["Payment method", c.payment_method === "CASH" ? "Cash" : c.payment_method === "QR" ? "UPI / QR (Razorpay)" : "Online (Razorpay)"],
    ...(c.payment_id ? [["Razorpay payment ID", c.payment_id] as [string, string]] : []),
    ...(c.order_id ? [["Razorpay order ID", c.order_id] as [string, string]] : []),
    ["Village", c.village || "—"], ["Mandal", c.mandal || "—"], ["District", c.district || "—"], ["Pincode", c.pincode || "—"],
    ["Received / entered by", c.entered_by_name || "Online"],
  ];

  return (
    <AppShell title="Receipt" actions={<div className="flex gap-2">{back}
      <Button variant="outline" size="sm" onClick={share}><Share2 /> Share</Button>
      <Button variant="outline" size="sm" onClick={() => window.print()}><Printer /> Print</Button>
      <Button variant="hero" size="sm" onClick={() => window.print()}><Download /> PDF</Button></div>}>
      <p className="no-print mx-auto mb-3 max-w-3xl text-xs text-muted-foreground">To download, choose "Save as PDF" in the print dialog.</p>
      <div className="print-area mx-auto max-w-3xl overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="flex items-center gap-5 bg-ink-gradient px-8 py-6 text-ink-foreground">
          <img src="/bsy-logo.png" alt="TEAM BSY logo" className="h-20 w-20 rounded-full object-contain" />
          <div className="flex-1">
            <div className="font-display text-3xl font-extrabold">TEAM BSY</div>
            <div className="text-sm font-semibold tracking-[0.2em] text-gold">BASWESHWARA YOUTH · DAMGANPUR</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase opacity-70">Contribution Receipt</div>
            <div className="font-display text-lg font-bold">{c.receipt_number}</div>
            <div className="text-xs opacity-70">{contribCode(c.serial_no)}</div>
          </div>
        </div>
        <div className="h-1 bg-brand" />
        <div className="p-8">
          <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl bg-accent p-5">
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground">Amount received</div>
              <div className="font-display text-4xl font-extrabold text-primary">{inr(c.amount)}</div>
              <div className="mt-1 text-sm italic">{amountInWords(Number(c.amount))}</div>
            </div>
            <StatusBadge status={c.payment_status} />
          </div>
          <dl className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {rows.map(([k, v]) => (
              <div key={k} className="border-b border-dashed pb-2">
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="break-all font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-10 flex items-end justify-between">
            <div className="relative grid h-24 w-24 place-items-center rounded-full border-4 border-double border-primary/70 text-center text-[9px] font-bold uppercase leading-tight text-primary rotate-[-12deg]">
              TEAM BSY<br />Damganpur<br />Official
            </div>
            <div className="text-center">
              <div className="font-display text-xl italic text-ink">Team BSY</div>
              <div className="mt-1 w-48 border-t pt-1 text-xs text-muted-foreground">Authorised signatory</div>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground">Generated {fmtDateTime(c.updated_at)} · Thank you for supporting TEAM BSY.</p>
        </div>
      </div>
    </AppShell>
  );
}
