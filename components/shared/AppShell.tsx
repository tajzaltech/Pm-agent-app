"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/shared/Sidebar";
import { TopNav } from "@/components/shared/TopNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isTicketChat = pathname.startsWith("/chat/ticket/");

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {!isTicketChat && <Sidebar />}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <TopNav />
        <main className={`flex min-h-0 flex-1 flex-col overflow-hidden ${isTicketChat ? "pt-0" : "pt-11 lg:pt-0"}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
