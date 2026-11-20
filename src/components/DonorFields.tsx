import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type DonorForm = {
  donorName: string; donorMobile: string; purpose: string; notes: string;
  village: string; mandal: string; district: string; pincode: string;
};
export const emptyDonor = (p?: Partial<DonorForm>): DonorForm => ({
  donorName: "", donorMobile: "", purpose: "", notes: "", village: "Damganpur", mandal: "", district: "", pincode: "", ...p,
});

export function DonorFields({ value, onChange }: { value: DonorForm; onChange: (v: DonorForm) => void }) {
  const set = (k: keyof DonorForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [k]: k === "donorMobile" || k === "pincode" ? e.target.value.replace(/\D/g, "") : e.target.value });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <F label="Donor name *"><Input value={value.donorName} onChange={set("donorName")} maxLength={100} /></F>
      <F label="Mobile *"><Input inputMode="numeric" maxLength={10} value={value.donorMobile} onChange={set("donorMobile")} /></F>
      <F label="Purpose" className="sm:col-span-2"><Input placeholder="e.g. Ganesh Chaturthi" value={value.purpose} onChange={set("purpose")} maxLength={150} /></F>
      <F label="Village"><Input value={value.village} onChange={set("village")} /></F>
      <F label="Mandal"><Input value={value.mandal} onChange={set("mandal")} /></F>
      <F label="District"><Input value={value.district} onChange={set("district")} /></F>
      <F label="Pincode"><Input inputMode="numeric" maxLength={6} value={value.pincode} onChange={set("pincode")} /></F>
      <F label="Notes" className="sm:col-span-2"><Textarea rows={2} value={value.notes} onChange={set("notes")} maxLength={500} /></F>
    </div>
  );
}

export function F({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className ?? ""}`}><Label>{label}</Label>{children}</div>;
}

export function AmountPicker({ amount, setAmount }: { amount: string; setAmount: (v: string) => void }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 rounded-xl border bg-card px-5 py-4 shadow-card">
        <span className="font-display text-3xl font-bold text-primary">₹</span>
        <input
          aria-label="Amount"
          inputMode="decimal"
          className="w-full bg-transparent font-display text-4xl font-bold outline-none"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
          placeholder="0"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {[100, 500, 1000, 2000, 5000].map((v) => (
          <button key={v} type="button" onClick={() => setAmount(String(v))}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${amount === String(v) ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary"}`}>
            ₹{v.toLocaleString("en-IN")}
          </button>
        ))}
      </div>
    </div>
  );
}

export function validateDonor(amount: string, d: DonorForm): string | null {
  const n = Number(amount);
  if (!n || n < 1) return "Enter an amount of at least ₹1";
  if (n > 1_000_000) return "Amount is too large";
  if (d.donorName.trim().length < 2) return "Enter the donor's name";
  if (!/^[6-9]\d{9}$/.test(d.donorMobile)) return "Enter a valid 10-digit mobile number";
  if (d.pincode && !/^\d{6}$/.test(d.pincode)) return "Pincode must be 6 digits";
  return null;
}
