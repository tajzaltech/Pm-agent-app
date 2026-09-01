"use client";

import { create } from "zustand";
import type { Cluster } from "@/lib/types";

interface ClusterStore {
  clusters: Cluster[];
}

export const useClusterStore = create<ClusterStore>(() => ({
  clusters: [],
}));
