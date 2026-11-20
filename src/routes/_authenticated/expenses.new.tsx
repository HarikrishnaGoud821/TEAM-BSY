import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Camera, Plus, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { AppShell, EmptyState } from "@/components/AppShell";
import { F } from "@/components/DonorFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { can, useMe } from "@/lib/auth";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/expenses/new")({
  head: () => ({ meta: [{ title: "Add Expense — TEAM BSY" }] }),
  component: NewExpense,
});

export const CATEGORIES = ["Decoration", "Food & Prasadam", "Sound & Lights", "Pooja Items", "Transport", "Printing", "Rent", "Other"];
const MAX_FILE = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
type Item = { name: string; qty: string; price: string };

function NewExpense() {
  const { data: me, isLoading } = useMe();
  const navigate = useNavigate();
  const [f, setF] = useState({
    category: "Decoration", purpose: "", description: "", notes: "", date: new Date().toISOString().slice(0, 10),
    shop_name: "", shop_owner: "", shop_contact: "", shop_address: "", village: "Damganpur", mandal: "", district: "", pincode: "",
    payment_method: "CASH", payment_reference: "",
  });
  const [items, setItems] = useState<Item[]>([{ name: "", qty: "1", price: "" }]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isLoading) return <AppShell title="Add Expense"><div /></AppShell>;
  if (!can(me, ["admin", "mentor"])) return <AppShell title="Add Expense"><EmptyState title="Only Mentors and Admins can record expenses" /></AppShell>;

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const total = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0);

  function pickFile(fl: File | undefined) {
    if (!fl) return;
    if (!TYPES.includes(fl.type)) return void toast.error("Use a JPG, PNG, WEBP photo or a PDF");
    if (fl.size > MAX_FILE) return void toast.error("File must be under 5 MB");
    setFile(fl);
    setPreview(fl.type.startsWith("image/") ? URL.createObjectURL(fl) : null);
  }

  async function save() {
    if (!me) return;
    if (f.shop_name.trim().length < 2) return void toast.error("Enter the shop name");
    if (f.purpose.trim().length < 2) return void toast.error("Enter the purpose");
    const valid = items.filter((i) => i.name.trim());
    if (!valid.length) return void toast.error("Add at least one item");
    if (valid.some((i) => !(Number(i.qty) > 0) || !(Number(i.price) >= 0) || i.price === "")) return void toast.error("Each item needs a quantity and price");
    if (f.payment_method !== "CASH" && !f.payment_reference.trim()) return void toast.error("Enter the UPI / bank reference number");
    if (!file) return void toast.error("Attach a photo of the shop receipt");
    if (f.pincode && !/^\d{6}$/.test(f.pincode)) return void toast.error("Pincode must be 6 digits");
    setBusy(true);
    try {
      const payload = {
        expense_date: f.date,
        category: f.category,
        purpose: f.purpose.trim(),
        description: f.description || null,
        notes: f.notes || null,
        shop_name: f.shop_name.trim(),
        shop_owner: f.shop_owner || null,
        shop_contact: f.shop_contact || null,
        shop_address: f.shop_address || null,
        village: f.village || null,
        mandal: f.mandal || null,
        district: f.district || null,
        pincode: f.pincode || null,
        payment_method: f.payment_method,
        payment_reference: f.payment_reference.trim() || null,
        items: valid.map((i) => ({
          item_name: i.name.trim(),
          quantity: Number(i.qty),
          unit_price: Number(i.price),
        })),
      };

      const formData = new FormData();
      formData.append(
        "expense",
        new Blob([JSON.stringify(payload)], { type: "application/json" }),
      );
      formData.append("receipt", file);

      const exp = await apiFetch<{ id: string }>("/expenses", {
        method: "POST",
        body: formData,
      });

      toast.success("Expense submitted for approval");
      navigate({ to: "/expenses/$id", params: { id: exp.id } });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save the expense. Please try again.",
      );
    } finally { setBusy(false); }
  }

  const card = "rounded-xl border bg-card p-5 shadow-card";
  return (
    <AppShell title="Add Expense">
      <div className="mx-auto max-w-3xl space-y-5">
        <section className={card}>
          <h3 className="mb-4 font-semibold">What was it for?</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Category"><select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={f.category} onChange={set("category")}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></F>
            <F label="Date"><Input type="date" value={f.date} onChange={set("date")} /></F>
            <F label="Purpose *" className="sm:col-span-2"><Input placeholder="e.g. Ganesh mandap decoration" value={f.purpose} onChange={set("purpose")} /></F>
            <F label="Description" className="sm:col-span-2"><Textarea rows={2} value={f.description} onChange={set("description")} /></F>
          </div>
        </section>

        <section className={card}>
          <h3 className="mb-4 font-semibold">Shop details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Shop name *"><Input value={f.shop_name} onChange={set("shop_name")} /></F>
            <F label="Owner name"><Input value={f.shop_owner} onChange={set("shop_owner")} /></F>
            <F label="Contact number"><Input inputMode="numeric" maxLength={10} value={f.shop_contact} onChange={set("shop_contact")} /></F>
            <F label="Address"><Input value={f.shop_address} onChange={set("shop_address")} /></F>
            <F label="Village"><Input value={f.village} onChange={set("village")} /></F>
            <F label="Mandal"><Input value={f.mandal} onChange={set("mandal")} /></F>
            <F label="District"><Input value={f.district} onChange={set("district")} /></F>
            <F label="Pincode"><Input inputMode="numeric" maxLength={6} value={f.pincode} onChange={set("pincode")} /></F>
          </div>
        </section>

        <section className={card}>
          <h3 className="mb-4 font-semibold">Items purchased</h3>
          <div className="space-y-2">
            <div className="hidden grid-cols-[1fr_80px_110px_100px_36px] gap-2 text-xs font-semibold text-muted-foreground sm:grid"><span>Item</span><span>Qty</span><span>Unit price</span><span className="text-right">Total</span><span /></div>
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-[1fr_70px_100px_36px] items-center gap-2 sm:grid-cols-[1fr_80px_110px_100px_36px]">
                <Input placeholder="Item name" value={it.name} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                <Input inputMode="decimal" value={it.qty} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, qty: e.target.value.replace(/[^\d.]/g, "") } : x))} />
                <Input inputMode="decimal" placeholder="₹" value={it.price} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, price: e.target.value.replace(/[^\d.]/g, "") } : x))} />
                <span className="hidden text-right text-sm font-semibold sm:block">{inr((Number(it.qty) || 0) * (Number(it.price) || 0))}</span>
                <Button variant="ghost" size="icon" aria-label="Remove item" disabled={items.length === 1} onClick={() => setItems(items.filter((_, j) => j !== i))}><Trash2 /></Button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setItems([...items, { name: "", qty: "1", price: "" }])}><Plus /> Add item</Button>
            <div className="text-right"><div className="text-xs text-muted-foreground">Total</div><div className="font-display text-2xl font-bold text-primary">{inr(total)}</div></div>
          </div>
        </section>

        <section className={card}>
          <h3 className="mb-4 font-semibold">Payment & proof</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Paid by"><select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={f.payment_method} onChange={set("payment_method")}>
              <option value="CASH">Cash</option><option value="UPI">UPI</option><option value="BANK_TRANSFER">Bank transfer</option><option value="OTHER">Other</option></select></F>
            {f.payment_method !== "CASH" && <F label="Transaction / reference no. *"><Input value={f.payment_reference} onChange={set("payment_reference")} /></F>}
          </div>
          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center hover:border-primary">
            {preview ? <img src={preview} alt="Shop receipt preview" className="max-h-64 rounded-lg object-contain" /> : file ? <span className="font-medium">{file.name}</span> : <Camera className="h-8 w-8 text-primary" />}
            <span className="text-sm font-semibold">{file ? "Tap to replace" : "Take photo or upload shop receipt *"}</span>
            <span className="text-xs text-muted-foreground">JPG, PNG, WEBP or PDF · max 5 MB</span>
            <input type="file" accept="image/*,application/pdf" capture="environment" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
          </label>
          <div className="mt-4"><F label="Notes"><Textarea rows={2} value={f.notes} onChange={set("notes")} /></F></div>
        </section>

        <Button variant="hero" size="xl" className="w-full" disabled={busy} onClick={save}>{busy ? "Submitting…" : `Submit ${inr(total)} for approval`}</Button>
      </div>
    </AppShell>
  );
}
