
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { apiFetch, getAuthToken, clearAuthToken } from "@/lib/api";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const token = getAuthToken();

    if (!token) {
      throw redirect({ to: "/auth" });
    }

    try {
      const user = await apiFetch<{
        id: string;
        email: string;
        profile: {
          full_name: string;
          mobile: string | null;
          village: string | null;
          mandal: string | null;
          district: string | null;
          pincode: string | null;
        } | null;
        roles: string[];
      }>("/auth/me");

      return { user };
    } catch {
      clearAuthToken();
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <Outlet />,
});
