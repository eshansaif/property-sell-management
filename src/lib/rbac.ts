import type { RoleName } from "@prisma/client";

// Central permission map. Add new roles/permissions here only —
// every server action/route must check through can(), never inline role checks.
const PERMISSIONS: Record<RoleName, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: [
    "service:read", "service:write",
    "subservice:read", "subservice:write",
    "listing:read", "listing:write",
    "inquiry:read", "inquiry:write",
    "user:read", "user:write",
    "settings:read", "settings:write",
  ],
  STAFF: ["listing:read", "inquiry:read", "inquiry:write"],
};

export function can(role: RoleName | undefined | null, permission: string): boolean {
  if (!role) return false;
  const granted = PERMISSIONS[role] ?? [];
  return granted.includes("*") || granted.includes(permission);
}

/** Admins can manage Admin/Staff accounts; only Super Admins can manage Super Admins. */
export function canManageRole(actor: RoleName | undefined | null, target: RoleName): boolean {
  if (!actor) return false;
  if (actor === "SUPER_ADMIN") return true;
  if (actor === "ADMIN") return target !== "SUPER_ADMIN";
  return false;
}

export const ROLE_LABELS: Record<RoleName, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  STAFF: "Staff",
};
