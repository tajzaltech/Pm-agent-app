"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { usePmChatStore } from "@/lib/store/pm-chat";
import type { Ticket } from "@/lib/types";

export function useAskPmAgent() {
  const router = useRouter();
  const openChat = usePmChatStore((s) => s.openChat);

  return (ticket: Ticket, opts?: { silent?: boolean }) => {
    openChat({ ticketId: ticket.id });
    if (!opts?.silent) {
      toast.success("Opening PM Agent with ticket context", {
        description: ticket.draftTitle.slice(0, 72),
        duration: 2800,
      });
    }
    router.push(`/chat/ticket/${ticket.id}`);
  };
}
