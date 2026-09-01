"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProductDoc {
  id?: string;
  name: string;
  size: string;
  type: string;
}

interface ProductDocsStore {
  docs: ProductDoc[];
  addDoc: (file: ProductDoc) => void;
  removeDoc: (name: string) => void;
}

export const useProductDocsStore = create<ProductDocsStore>()(
  persist(
    (set) => ({
      docs: [],
      addDoc: (file) =>
        set((state) => ({
          docs: state.docs.some((doc) => doc.name === file.name)
            ? state.docs
            : [...state.docs, file],
        })),
      removeDoc: (name) =>
        set((state) => ({
          docs: state.docs.filter((doc) => doc.name !== name && doc.id !== name),
        })),
    }),
    { name: "pm-agent-product-docs" }
  )
);
