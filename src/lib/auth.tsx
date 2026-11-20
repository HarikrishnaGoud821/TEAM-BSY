import { useQuery } from "@tanstack/react-query";
import { apiFetch, getAuthToken } from "@/lib/api";

export type AppRole =
  | "admin"
  | "mentor"
  | "treasurer"
  | "volunteer"
  | "member"
  | "viewer";

export type Me = {
  id: string;
  email: string | null;
  profile: {
    full_name: string;
    mobile: string | null;
    village: string | null;
    mandal: string | null;
    district: string | null;
    pincode: string | null;
  } | null;
  roles: AppRole[];
};

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    staleTime: 60_000,
    queryFn: async (): Promise<Me | null> => {
      if (!getAuthToken()) {
        return null;
      }

      const response = await apiFetch<{
        id: string;
        email: string | null;
        profile: Me["profile"];
        roles: string[];
      }>("/auth/me");

      return {
        id: response.id,
        email: response.email,
        profile: response.profile,
        roles: response.roles as AppRole[],
      };
    },
  });
}

export const can = (
  me: Me | null | undefined,
  roles: AppRole[],
) => !!me && me.roles.some((role) => roles.includes(role));

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Admin",
  mentor: "Mentor",
  treasurer: "Treasurer",
  volunteer: "Volunteer",
  member: "Member",
  viewer: "Viewer",
};

export const primaryRole = (
  me: Me | null | undefined,
): AppRole => {
  const order: AppRole[] = [
    "admin",
    "treasurer",
    "mentor",
    "volunteer",
    "member",
    "viewer",
  ];

  return order.find((role) => me?.roles.includes(role)) ?? "member";
};