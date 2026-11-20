export const inr = (n: number | string | null | undefined) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(
    Number(n ?? 0),
  );

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const fmtDateTime = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

export const contribCode = (serial: number | null | undefined) =>
  `BSY-${String(serial ?? 0).padStart(6, "0")}`;
export const expenseCode = (serial: number | null | undefined) =>
  `EXP-${String(serial ?? 0).padStart(5, "0")}`;

const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
  "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
function two(n: number) { return n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? " " + ones[n % 10] : ""}`; }
function three(n: number) {
  const h = Math.floor(n / 100), r = n % 100;
  return [h ? `${ones[h]} Hundred` : "", r ? two(r) : ""].filter(Boolean).join(" ");
}
/** Indian numbering system (lakh, crore). */
export function amountInWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  if (rupees === 0 && paise === 0) return "Zero Rupees Only";
  const parts: string[] = [];
  let n = rupees;
  const crore = Math.floor(n / 1e7); n %= 1e7;
  const lakh = Math.floor(n / 1e5); n %= 1e5;
  const thousand = Math.floor(n / 1e3); n %= 1e3;
  if (crore) parts.push(`${two(crore) || three(crore)} Crore`);
  if (lakh) parts.push(`${two(lakh)} Lakh`);
  if (thousand) parts.push(`${two(thousand)} Thousand`);
  if (n) parts.push(three(n));
  let s = parts.join(" ") + " Rupees";
  if (paise) s += ` and ${two(paise)} Paise`;
  return s + " Only";
}

export const MOBILE_RE = /^[6-9]\d{9}$/;
export const PINCODE_RE = /^\d{6}$/;
