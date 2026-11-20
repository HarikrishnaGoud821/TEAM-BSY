import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  createPaymentOrder,
  getPaymentConfig,
  markPaymentFailed,
  verifyPayment,
} from "@/lib/payments.functions";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, CreditCard, QrCode } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AmountPicker, DonorFields, emptyDonor, validateDonor } from "@/components/DonorFields";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/auth";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/pay")({
  head: () => ({ meta: [{ title: "Make Contribution — TEAM BSY" }] }),
  component: PayPage,
});

declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open: () => void; on: (e: string, cb: () => void) => void } } }

function loadCheckout() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function PayPage() {
  const { data: me } = useMe();
const { data: cfg, isLoading } = useQuery({
  queryKey: ["pay-config"],
  queryFn: getPaymentConfig,
});
  const [amount, setAmount] = useState("1000");
  const [method, setMethod] = useState<"RAZORPAY" | "QR">("RAZORPAY");
  const [donor, setDonor] = useState(emptyDonor());
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ id: string; amount: number } | null>(null);
  const filled = useRef(false);

  useEffect(() => {
    if (me && !filled.current) {
      filled.current = true;
      setDonor(emptyDonor({
        donorName: me.profile?.full_name ?? "", donorMobile: me.profile?.mobile ?? "",
        village: me.profile?.village ?? "Damganpur", mandal: me.profile?.mandal ?? "",
        district: me.profile?.district ?? "", pincode: me.profile?.pincode ?? "",
      }));
    }
  }, [me]);

  async function pay() {
    const err = validateDonor(amount, donor);
    if (err) return void toast.error(err);
    setBusy(true);
    try {
      if (!(await loadCheckout()) || !window.Razorpay) throw new Error("Could not load Razorpay. Check your connection.");
      const order = await createPaymentOrder({ amount: Number(amount), method, ...donor });
      const rz = new window.Razorpay({
        key: order.keyId, order_id: order.orderId, amount: order.amount, currency: "INR",
        name: "TEAM BSY", description: donor.purpose || "Contribution",
        prefill: { name: donor.donorName, contact: donor.donorMobile, email: me?.email ?? undefined },
        theme: { color: "#E8741E" },
        ...(method === "QR"
  ? {
      config: {
        display: {
          blocks: {
            upi: {
              name: "Pay by UPI / QR",
              instruments: [{ method: "upi" }],
            },
          },
          sequence: ["block.upi"],
          preferences: {
            show_default_blocks: true,
          },
          hide: [
            {
              method: "upi",
              flows: ["collect"],
            },
          ],
        },
      },
    }
  : {}),
        handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const r = await verifyPayment({ razorpayOrderId: resp.razorpay_order_id, razorpayPaymentId: resp.razorpay_payment_id, razorpaySignature: resp.razorpay_signature });
            setDone({ id: r.contributionId, amount: Number(amount) });
          } catch {
            toast.error("We could not verify this payment yet. If money was deducted, it will update automatically shortly.");
          } finally { setBusy(false); }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rz.on("payment.failed", () => { void markPaymentFailed({ orderId: order.orderId }).catch(() => {
  toast.error("Could not update payment status.");
});
 toast.error("Payment failed. You have not been charged."); setBusy(false); });
      rz.open();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment could not start");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <AppShell title="Make Contribution">
        <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 text-center shadow-card">
          <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
          <h2 className="mt-4 text-2xl font-bold">Payment Successful</h2>
          <div className="mt-2 font-display text-4xl font-extrabold text-primary">{inr(done.amount)}</div>
          <p className="mt-2 text-sm text-muted-foreground">Thank you for supporting TEAM BSY.</p>
          <div className="mt-6 grid gap-2">
            <Button asChild variant="hero" size="lg"><Link to="/receipts/$id" params={{ id: done.id }}>View & download receipt</Link></Button>
            <Button variant="outline" onClick={() => { setDone(null); }}>Make another contribution</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Make Contribution">
      <div className="mx-auto max-w-2xl space-y-6">
        {!isLoading && !cfg?.keyId && (
          <div className="rounded-xl border border-warning bg-warning/15 p-4 text-sm">
            Online payments are being set up. Please check back soon.
          </div>
        )}
        <AmountPicker amount={amount} setAmount={setAmount} />
        <div className="grid grid-cols-2 gap-3">
          {([["RAZORPAY", "Direct Payment", "Card, UPI, netbanking", CreditCard], ["QR", "Scan QR / UPI", "Pay from any UPI app", QrCode]] as const).map(([k, t, d, Icon]) => (
            <button key={k} type="button" onClick={() => setMethod(k)}
              className={cn("rounded-xl border bg-card p-4 text-left transition-all", method === k ? "border-primary ring-2 ring-primary/30" : "hover:border-primary/50")}>
              <Icon className="h-5 w-5 text-primary" />
              <div className="mt-2 font-semibold">{t}</div>
              <div className="text-xs text-muted-foreground">{d}</div>
            </button>
          ))}
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-card"><DonorFields value={donor} onChange={setDonor} /></div>
        <Button variant="hero" size="xl" className="w-full" disabled={busy || !cfg?.keyId} onClick={pay}>
          {busy ? "Processing…" : `Pay ${Number(amount) ? inr(Number(amount)) : ""} now`}
        </Button>
        <p className="text-center text-xs text-muted-foreground">Secured by Razorpay. Your receipt is issued only after the payment is verified.</p>
      </div>
    </AppShell>
  );
}
