"use client";

import { Sidebar } from "@/components/shared/Sidebar";
import { TopNav } from "@/components/shared/TopNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <TopNav />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden pt-11 lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
