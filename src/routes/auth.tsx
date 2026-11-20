
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  apiFetch,
  setAuthToken,
  getAuthToken,
  clearAuthToken,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MOBILE_RE } from "@/lib/format";

type AuthResponse = {
  token: string;
  id: string;
  email: string;
  profile: {
    full_name: string;
    mobile: string;
    village: string | null;
    mandal: string | null;
    district: string | null;
    pincode: string | null;
  } | null;
  roles: string[];
};

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: "signup" } =>
    s["mode"] === "signup" ? { mode: "signup" } : {},
  head: () => ({
    meta: [
      { title: "Sign in — TEAM BSY" },
      {
        name: "description",
        content: "Sign in to TEAM BSY to contribute and view your receipts.",
      },
      { property: "og:title", content: "Sign in — TEAM BSY" },
      {
        property: "og:description",
        content: "Sign in to TEAM BSY to contribute and view your receipts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(
    search.mode === "signup" ? "signup" : "signin",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!getAuthToken()) return;

    apiFetch("/auth/me")
      .then(() => navigate({ to: "/dashboard" }))
      .catch(() => clearAuthToken());
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    try {
      let response: AuthResponse;

      if (mode === "signup") {
        if (name.trim().length < 2) {
          throw new Error("Enter your full name");
        }

        if (!MOBILE_RE.test(mobile)) {
          throw new Error("Enter a valid 10-digit mobile number");
        }

        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters");
        }

        response = await apiFetch<AuthResponse>("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            fullName: name.trim(),
            mobile,
            email: email.trim(),
            password,
          }),
        });
      } else {
        response = await apiFetch<AuthResponse>("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        });
      }

      setAuthToken(response.token);

      await queryClient.invalidateQueries({ queryKey: ["me"] });

      toast.success(
        mode === "signup"
          ? "Account created successfully!"
          : "Signed in successfully!",
      );

      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col items-center justify-center bg-ink-gradient p-12 text-ink-foreground lg:flex">
        <img
          src="/bsy-logo.png"
          alt="TEAM BSY logo"
          className="h-64 w-64 rounded-full object-contain shadow-glow"
        />
        <h2 className="mt-8 text-4xl font-extrabold">TEAM BSY</h2>
        <p className="mt-2 text-sm uppercase tracking-[0.3em] text-gold">
          Basweshwara Youth · Damganpur
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <img
            src="/bsy-logo.png"
            alt=""
            className="mx-auto mb-6 h-20 w-20 rounded-full lg:hidden"
          />

          <h1 className="text-2xl font-bold">
            {mode === "signin" ? "Welcome back" : "Join TEAM BSY"}
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to continue"
              : "Create your member account"}
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-6 w-full"
            disabled
          >
            Google sign-in coming soon
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="n">Full name</Label>
                  <Input
                    id="n"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="m">Mobile</Label>
                  <Input
                    id="m"
                    inputMode="numeric"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) =>
                      setMobile(e.target.value.replace(/\D/g, ""))
                    }
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="e">Email</Label>
              <Input
                id="e"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p">Password</Label>
              <Input
                id="p"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              variant="hero"
              className="w-full"
              size="lg"
              disabled={busy}
            >
              {busy
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New here? " : "Already a member? "}
            <button
              className="font-semibold text-primary"
              onClick={() =>
                setMode(mode === "signin" ? "signup" : "signin")
              }
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
