"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { TeamMember, UserRole } from "@/lib/types";
import { canRemoveMember } from "@/lib/utils/team-rbac";

function normalizeRole(role: string): UserRole {
  if (role === "owner" || role === "admin" || role === "user") return role;
  return "user";
}

function normalizeMember(member: TeamMember): TeamMember {
  return { ...member, role: normalizeRole(member.role) };
}

interface TeamStore {
  members: TeamMember[];
  currentUserId: string;
  addMember: (member: TeamMember) => void;
  removeMember: (id: string) => boolean;
  getCurrentUser: () => TeamMember | undefined;
  canRemove: (targetId: string) => boolean;
}

export const useTeamStore = create<TeamStore>()(
  persist(
    (set, get) => ({
      members: [],
      currentUserId: "",

      getCurrentUser: () => get().members.find((m) => m.id === get().currentUserId),

      canRemove: (targetId) => {
        const actor = get().getCurrentUser();
        const target = get().members.find((m) => m.id === targetId);
        if (!actor || !target) return false;
        if (actor.id === target.id) return false;
        return canRemoveMember(actor.role, target.role);
      },

      addMember: (member) => {
        set((s) => ({ members: [...s.members, member] }));
        void import("@/lib/api-client").then(({ api }) =>
          api.inviteMember(member.email, member.role, member.name).catch(() => undefined),
        );
      },

      removeMember: (id) => {
        if (!get().canRemove(id)) return false;
        set((s) => ({ members: s.members.filter((m) => m.id !== id) }));
        void import("@/lib/api-client").then(({ api }) => api.removeMember(id).catch(() => undefined));
        return true;
      },
    }),
    {
      name: "pm-agent-team-v2",
      merge: (persisted, current) => {
        const p = persisted as Partial<TeamStore>;
        const members = (p.members?.length ? p.members : current.members).map(normalizeMember);
        return {
          ...current,
          ...p,
          members,
          currentUserId: p.currentUserId ?? current.currentUserId,
        };
      },
    }
  )
);

export function buildInviteMember(email: string, role: UserRole): TeamMember {
  const local = email.split("@")[0] ?? "member";
  const name = local
    .split(/[._-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
  return {
    id: `u${Date.now()}`,
    name: name || "New member",
    email,
    role,
    status: "invited",
    avatarInitials: name.slice(0, 2).toUpperCase() || "NM",
  };
}
