import type { RoleName } from "@prisma/client";

// Central permission map. Add new roles/permissions here only —
// every server action/route must check through can(), never inline role checks.
const PERMISSIONS = {
  SUPER_ADMIN: ["*"],
  ADMIN: [
    "service:read", "service:write",
    "subservice:read", "subservice:write",
    "listing:read", "listing:write",
    "inquiry:read", "inquiry:write",
    "user:read",
  ],
  STAFF: ["listing:read", "inquiry:read", "inquiry:write"],
} satisfies Record<RoleName, string[]>;

export function can(role: RoleName, permission: string): boolean {
  const granted = PERMISSIONS[role] ?? [];
  return granted.includes("*") || granted.includes(permission);
}

export function requireRole(role: RoleName | undefined, allowed: RoleName[]): boolean {
  if (!role) return false;
  return allowed.includes(role);
}
