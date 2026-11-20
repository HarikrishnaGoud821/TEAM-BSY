import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, Printer, X } from "lucide-react";
import { AppShell, EmptyState, StatusBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { can, useMe } from "@/lib/auth";
import { expenseCode, fmtDate, fmtDateTime, inr } from "@/lib/format";
import { apiFetch, apiFetchBlob } from "@/lib/api";

type ExpenseItem = {
  id: string;
  expense_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

type ExpenseDetailData = {
  id: string;
  serial_no: number;
  mentor_id: string;
  mentor_name: string;
  mentor_mobile: string | null;
  amount: number;
  expense_date: string;
  category: string;
  purpose: string;
  description: string | null;
  notes: string | null;
  shop_name: string;
  shop_owner: string | null;
  shop_contact: string | null;
  shop_address: string | null;
  village: string | null;
  mandal: string | null;
  district: string | null;
  pincode: string | null;
  payment_method: string;
  payment_reference: string | null;
  receipt_file_key: string | null;
  receipt_file_name: string | null;
  receipt_content_type: string | null;
  receipt_uploaded_at: string | null;
  status: string;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  items: ExpenseItem[];
};

export const Route = createFileRoute("/_authenticated/expenses/$id")({
  head: () => ({ meta: [{ title: "Expense Voucher — TEAM BSY" }] }),
  component: ExpenseDetail,
});

function ExpenseDetail() {
  const { id } = Route.useParams();
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const { data: e, isLoading, isError, error } = useQuery({
    queryKey: ["expense", id],
    queryFn: () => apiFetch<ExpenseDetailData>(`/expenses/${id}`),
  });

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    setReceiptUrl(null);

    if (e?.receipt_file_key) {
      apiFetchBlob(`/expenses/${id}/receipt`)
        .then((blob) => {
          if (cancelled) return;
          objectUrl = URL.createObjectURL(blob);
          setReceiptUrl(objectUrl);
        })
        .catch((err) => {
          if (!cancelled) {
            toast.error(
              err instanceof Error ? err.message : "Could not load receipt.",
            );
          }
        });
    }

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, e?.receipt_file_key]);

  const back = (
    <Button asChild variant="ghost" size="sm">
      <Link to="/expenses"><ArrowLeft /> Back</Link>
    </Button>
  );

  async function decide(status: "APPROVED" | "REJECTED") {
    if (status === "REJECTED" && reason.trim().length < 3) {
      toast.error("Give a reason for rejecting");
      return;
    }

    setBusy(true);

    try {
      await apiFetch(`/expenses/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          rejection_reason: status === "REJECTED" ? reason.trim() : null,
        }),
      });

      toast.success(
        status === "APPROVED" ? "Expense approved" : "Expense rejected",
      );

      await qc.invalidateQueries({ queryKey: ["expense", id] });
      await qc.invalidateQueries({ queryKey: ["expenses"] });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not update expense.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) {
    return (
      <AppShell title="Expense" actions={back}>
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </AppShell>
    );
  }

  if (isError || !e) {
    return (
      <AppShell title="Expense" actions={back}>
        <EmptyState
          title="Could not load expense"
          text={error instanceof Error ? error.message : "Expense not found"}
        />
      </AppShell>
    );
  }

  const items = e.items ?? [];

  return (
    <AppShell
      title={`Expense ${expenseCode(e.serial_no)}`}
      actions={
        <div className="flex gap-2">
          {back}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer /> Print voucher
          </Button>
        </div>
      }
    >
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_380px]">
        <div className="print-area overflow-hidden rounded-2xl border bg-card shadow-card">
          <div className="flex items-center gap-4 bg-ink-gradient px-6 py-5 text-ink-foreground">
            <img
              src="/bsy-logo.png"
              alt="TEAM BSY logo"
              className="h-14 w-14 rounded-full"
            />
            <div className="flex-1">
              <div className="font-display text-xl font-bold">
                TEAM BSY · Expense Voucher
              </div>
              <div className="text-xs tracking-[0.2em] text-gold">
                BASWESHWARA YOUTH · DAMGANPUR
              </div>
            </div>
            <StatusBadge status={e.status} />
          </div>

          <div className="space-y-6 p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Info k="Voucher" v={expenseCode(e.serial_no)} />
              <Info k="Date" v={fmtDate(e.expense_date)} />
              <Info k="Category" v={e.category} />
              <Info
                k="Mentor"
                v={`${e.mentor_name}${e.mentor_mobile ? " · " + e.mentor_mobile : ""}`}
              />
              <Info k="Purpose" v={e.purpose} />
              <Info
                k="Payment"
                v={`${e.payment_method.replace("_", " ")}${e.payment_reference ? " · " + e.payment_reference : ""}`}
              />
            </div>

            <div className="rounded-xl bg-muted/50 p-4">
              <div className="font-semibold">{e.shop_name}</div>
              <div className="text-sm text-muted-foreground">
                {[
                  e.shop_owner,
                  e.shop_contact,
                  e.shop_address,
                  e.village,
                  e.mandal,
                  e.district,
                  e.pincode,
                ].filter(Boolean).join(" · ") || "—"}
              </div>
            </div>

            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2">Item</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-t">
                    <td className="py-2">{i.item_name}</td>
                    <td>{Number(i.quantity)}</td>
                    <td>{inr(i.unit_price)}</td>
                    <td className="text-right font-medium">
                      {inr(i.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2">
                  <td colSpan={3} className="py-3 font-semibold">Total</td>
                  <td className="text-right font-display text-xl font-bold text-primary">
                    {inr(e.amount)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {e.description && (
              <p className="text-sm"><b>Description:</b> {e.description}</p>
            )}
            {e.notes && (
              <p className="text-sm"><b>Notes:</b> {e.notes}</p>
            )}

            <div className="border-t pt-4 text-sm">
              {e.status === "PENDING" ? (
                <span className="text-muted-foreground">
                  Awaiting admin approval
                </span>
              ) : (
                <span>
                  {e.status === "APPROVED" ? "Approved" : "Rejected"} by{" "}
                  <b>{e.reviewed_by_name}</b> on {fmtDateTime(e.reviewed_at)}
                  {e.rejection_reason && (
                    <> — <i>{e.rejection_reason}</i></>
                  )}
                </span>
              )}
              <div className="mt-1 text-xs text-muted-foreground">
                Shop receipt: {e.receipt_file_name ?? "not attached"}{" "}
                {e.receipt_uploaded_at &&
                  `(uploaded ${fmtDateTime(e.receipt_uploaded_at)})`}
              </div>
            </div>
          </div>
        </div>

        <div className="no-print space-y-4">
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <h3 className="mb-3 font-semibold">Shop receipt</h3>
            {receiptUrl ? (
              e.receipt_content_type?.startsWith("image/") ? (
                <a href={receiptUrl} target="_blank" rel="noreferrer">
                  <img
                    src={receiptUrl}
                    alt="Shop receipt"
                    className="w-full rounded-lg border"
                  />
                </a>
              ) : (
                <Button asChild variant="outline" className="w-full">
                  <a href={receiptUrl} target="_blank" rel="noreferrer">
                    Open PDF
                  </a>
                </Button>
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                {e.receipt_file_key ? "Loading receipt…" : "No receipt attached."}
              </p>
            )}
          </div>

          {can(me, ["admin"]) && (
            <div className="rounded-xl border bg-card p-4 shadow-card">
              <h3 className="mb-3 font-semibold">Review</h3>
              <Textarea
                placeholder="Reason (required to reject)"
                value={reason}
                onChange={(ev) => setReason(ev.target.value)}
                rows={3}
              />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  variant="destructive"
                  disabled={busy}
                  onClick={() => decide("REJECTED")}
                >
                  <X /> Reject
                </Button>
                <Button
                  variant="success"
                  disabled={busy}
                  onClick={() => decide("APPROVED")}
                >
                  <Check /> Approve
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{k}</div>
      <div className="font-medium">{v}</div>
    </div>
  );
}