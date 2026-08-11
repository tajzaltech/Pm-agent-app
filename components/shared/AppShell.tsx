"use client";

import { usePathname } from "next/navigation";

import { ChatHistorySidebar } from "@/components/chat/ChatHistorySidebar";
import { TicketBreadcrumb } from "@/components/chat/TicketBreadcrumb";
import { Sidebar } from "@/components/shared/Sidebar";
import { TopNav } from "@/components/shared/TopNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // The conversation rail sits beside the nav rail rather than inside <main>,
  // so it runs the full height of the window instead of starting below TopNav.
  const onChat = pathname === "/chat" || pathname.startsWith("/chat/");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      {onChat && <ChatHistorySidebar />}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <TopNav left={onChat ? <TicketBreadcrumb /> : null} />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden pt-11 lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
