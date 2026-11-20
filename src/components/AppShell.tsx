import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, HandCoins, Receipt, Wallet, Landmark, Users, ScrollText, LogOut, Menu, X, CreditCard, Banknote, MessageCircle,
} from "lucide-react";
import { clearAuthToken } from "@/lib/api";
import { can, primaryRole, ROLE_LABEL, useMe, type AppRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; roles?: AppRole[] };
const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/chat", label: "Group chat", icon: MessageCircle },
  { to: "/pay", label: "Make Contribution", icon: CreditCard },
  { to: "/cash", label: "Collect Cash", icon: Banknote, roles: ["admin", "mentor"] },
  { to: "/contributions", label: "Contributions", icon: HandCoins },
  { to: "/expenses", label: "Expenses", icon: Receipt, roles: ["admin", "mentor", "treasurer"] },
  { to: "/finance", label: "Finance", icon: Landmark, roles: ["admin", "treasurer"] },
  { to: "/users", label: "Users", icon: Users, roles: ["admin"] },
  { to: "/audit", label: "Audit Log", icon: ScrollText, roles: ["admin"] },
];

export function AppShell({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  const { data: me } = useMe();
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const qc = useQueryClient();
  const navigate = useNavigate();
  const items = NAV.filter((n) => !n.roles || can(me, n.roles));

  async function signOut() {
  await qc.cancelQueries();
  clearAuthToken();
  qc.clear();
  navigate({ to: "/auth", replace: true });
}

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 py-5">
        <img src="/bsy-logo.png" alt="TEAM BSY logo" className="h-11 w-11 rounded-full object-contain ring-2 ring-gold/60" />
        <div className="leading-tight">
          <div className="font-display text-lg font-bold text-sidebar-accent-foreground">TEAM BSY</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-gold">Basweshwara Youth</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map((n) => {
          const active = path === n.to || path.startsWith(n.to + "/");
          return (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 text-sm">
          <div className="truncate font-semibold text-sidebar-accent-foreground">{me?.profile?.full_name || me?.email}</div>
          <div className="text-xs text-gold">{ROLE_LABEL[primaryRole(me)]}</div>
        </div>
        <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="no-print fixed inset-y-0 left-0 hidden w-64 lg:block">{sidebar}</aside>
      {open && (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64">{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-30 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            {open ? <X /> : <Menu />}
          </button>
          <h1 className="flex-1 text-xl font-bold">{title}</h1>
          {actions}
        </header>
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = "default" }: {
  label: string; value: ReactNode; hint?: string; icon?: typeof LayoutDashboard; tone?: "default" | "brand" | "ink";
}) {
  return (
    <div className={cn(
      "rounded-xl border p-5 shadow-card",
      tone === "brand" && "border-transparent bg-brand text-primary-foreground",
      tone === "ink" && "border-transparent bg-ink-gradient text-ink-foreground",
      tone === "default" && "bg-card",
    )}>
      <div className="flex items-center justify-between">
        <span className={cn("text-xs font-semibold uppercase tracking-wider", tone === "default" ? "text-muted-foreground" : "opacity-80")}>{label}</span>
        {Icon && <Icon className="h-4 w-4 opacity-70" />}
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
      {hint && <div className={cn("mt-1 text-xs", tone === "default" ? "text-muted-foreground" : "opacity-80")}>{hint}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    SUCCESS: "bg-success/15 text-success", APPROVED: "bg-success/15 text-success",
    PENDING: "bg-warning/25 text-warning-foreground",
    FAILED: "bg-destructive/15 text-destructive", REJECTED: "bg-destructive/15 text-destructive",
  };
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", map[status] ?? "bg-muted text-muted-foreground")}>{status}</span>;
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed bg-card p-10 text-center">
      <img src="/bsy-logo.png" alt="" className="mx-auto mb-3 h-12 w-12 rounded-full opacity-60 grayscale" />
      <div className="font-display font-semibold">{title}</div>
      {text && <p className="mt-1 text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
