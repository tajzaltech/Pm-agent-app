"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/shared/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullChat = pathname.startsWith("/chat");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {!isFullChat && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute bottom-[-80px] right-[-80px] size-[520px] rounded-full bg-violet-300/25 blur-[120px] animate-blob dark:opacity-40" />
          <div className="absolute bottom-[10%] right-[15%] size-[320px] rounded-full bg-indigo-200/20 blur-[100px] animate-blob animation-delay-2000 dark:opacity-30" />
        </div>
      )}
      {!isFullChat && <Sidebar />}
      <main className={cn("relative flex min-h-0 flex-1 flex-col overflow-hidden", isFullChat ? "pt-0" : "pt-14 lg:pt-0")}>
        {children}
      </main>
    </div>
  );
}
