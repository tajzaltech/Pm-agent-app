"use client";

import { useEffect } from "react";

import { hydrateWorkspace } from "@/lib/api-client/hydrate";
import { getSession } from "@/lib/api-client/session";
import { useAuthStore } from "@/lib/store/auth";
import { useAuthHydrated } from "@/lib/store/use-auth-hydrated";

export function ApiHydrator() {
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const workspaceId = useAuthStore((s) => s.workspaceId);

  useEffect(() => {
    if (!hydrated || !isAuthenticated || !getSession().accessToken) return;
    void hydrateWorkspace();
  }, [hydrated, isAuthenticated, workspaceId]);

  return null;
}
