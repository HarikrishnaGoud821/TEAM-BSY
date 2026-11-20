import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Banknote } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { AppShell, EmptyState } from "@/components/AppShell";
import { AmountPicker, DonorFields, emptyDonor, F, validateDonor } from "@/components/DonorFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { can, useMe } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/cash")({
  head: () => ({ meta: [{ title: "Collect Cash — TEAM BSY" }] }),
  component: CashPage,
});

function CashPage() {
  const { data: me, isLoading } = useMe();
  const [amount, setAmount] = useState("");
  const [donor, setDonor] = useState(emptyDonor());
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  if (isLoading) return <AppShell title="Collect Cash"><div /></AppShell>;
  if (!can(me, ["admin", "mentor"]))
    return <AppShell title="Collect Cash"><EmptyState title="Not available" text="Only Admins and Mentors can record cash. Members can contribute online." /></AppShell>;

  async function save() {
    const err = validateDonor(amount, donor);
    if (err) return void toast.error(err);
    if (!me) return;

    setBusy(true);

    try {
      const data = await apiFetch<{ id: string; receipt_number: string }>(
        "/contributions/cash",
        {
          method: "POST",
          body: JSON.stringify({
            amount: Number(amount),
            donorName: donor.donorName.trim(),
            donorMobile: donor.donorMobile.trim(),
            purpose: donor.purpose || null,
            notes: donor.notes || null,
            village: donor.village || null,
            mandal: donor.mandal || null,
            district: donor.district || null,
            pincode: donor.pincode || null,
            donationDate: date,
          }),
        }
      );

      toast.success("Cash contribution recorded — receipt generated");

      navigate({
        to: "/receipts/$id",
        params: { id: data.id },
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save the cash contribution."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Collect Cash">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3 rounded-xl bg-accent p-4 text-accent-foreground">
          <Banknote className="h-5 w-5" />
          <p className="text-sm">Record physical cash you have received. A numbered receipt is created immediately.</p>
        </div>
        <AmountPicker amount={amount} setAmount={setAmount} />
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <DonorFields value={donor} onChange={setDonor} />
          <div className="mt-4 max-w-xs"><F label="Date received"><Input type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} /></F></div>
        </div>
        <Button variant="hero" size="xl" className="w-full" disabled={busy} onClick={save}>
          {busy ? "Saving…" : "Save & generate receipt"}
        </Button>
      </div>
    </AppShell>
  );
}
