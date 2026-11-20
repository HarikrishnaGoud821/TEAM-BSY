import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Receipt, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TEAM BSY — Basweshwara Youth, Damganpur" },
      { name: "description", content: "Contribute online, get instant receipts and follow every rupee at TEAM BSY, Damganpur." },
      { property: "og:title", content: "TEAM BSY — Basweshwara Youth, Damganpur" },
      { property: "og:description", content: "Contribute online, get instant receipts and follow every rupee." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-ink-gradient text-ink-foreground">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-6 py-16 text-center">
        <img src="/bsy-logo.png" alt="TEAM BSY — Basweshwara Youth, Damganpur" className="h-44 w-44 rounded-full object-contain shadow-glow" />
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-gold">Basweshwara Youth · Damganpur</p>
        <h1 className="mt-3 text-5xl font-extrabold md:text-6xl">TEAM BSY</h1>
        <p className="mt-4 max-w-xl text-lg opacity-80">
          Contribute online, get an official receipt instantly, and see exactly how every rupee is used.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="hero" size="xl"><Link to="/auth">Sign in</Link></Button>
          <Button asChild variant="outline" size="xl" className="border-gold/40 bg-transparent text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground">
            <Link to="/auth" search={{ mode: "signup" }}>Create account</Link>
          </Button>
        </div>
        <div className="mt-16 grid w-full gap-4 md:grid-cols-3">
          {[
            { icon: HandCoins, t: "Pay securely", d: "UPI, QR, cards and netbanking through Razorpay." },
            { icon: Receipt, t: "Instant receipts", d: "Numbered official receipts you can print or download." },
            { icon: ShieldCheck, t: "Full transparency", d: "Every expense recorded with shop bill proof." },
          ].map((f) => (
            <div key={f.t} className="rounded-xl border border-ink-foreground/10 bg-ink-foreground/5 p-6 text-left">
              <f.icon className="h-6 w-6 text-primary" />
              <div className="mt-3 font-display font-semibold">{f.t}</div>
              <div className="mt-1 text-sm opacity-70">{f.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
