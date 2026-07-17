"use client";

import { useEffect, useState } from "react";

import { useAuthStore } from "@/lib/store/auth";

export function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    void Promise.resolve(useAuthStore.persist.rehydrate()).then(() => {
      if (active) setHydrated(true);
    });

    return () => {
      active = false;
    };
  }, []);

  return hydrated;
}
