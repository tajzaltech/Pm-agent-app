import type { UserRole } from "@/lib/types";

/** Owner > Admin > User */
export function canRemoveMember(actorRole: UserRole, targetRole: UserRole): boolean {
  if (actorRole === "owner") return targetRole === "admin" || targetRole === "user";
  if (actorRole === "admin") return targetRole === "user";
  return false;
}

export function inviteableRoles(actorRole: UserRole): UserRole[] {
  if (actorRole === "owner") return ["admin", "user"];
  if (actorRole === "admin") return ["user"];
  return [];
}

export function roleLabel(role: UserRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
