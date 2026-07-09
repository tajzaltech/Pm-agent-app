"use client";

import { toast } from "sonner";
import {
  CheckCircle,
  EyeOff,
  Pencil,
  Send,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTicketStore } from "@/lib/store/tickets";
import type { Ticket } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TicketActionsBarProps {
  ticket: Ticket;
  editMode: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveDraft: () => void;
  onSaveAccept: () => void;
  className?: string;
}

export function TicketActionsBar({
  ticket,
  editMode,
  onEdit,
  onCancelEdit,
  onSaveDraft,
  onSaveAccept,
  className,
}: TicketActionsBarProps) {
  const { acceptSendToDev, acceptNonTechnical, reject, ignore } = useTicketStore();

  if (ticket.status !== "pending") return null;

  if (editMode) {
    return (
      <div className={cn("border-t bg-card px-4 py-3 flex flex-wrap items-center gap-2 shrink-0", className)}>
        <Button variant="outline" size="sm" onClick={onCancelEdit}>Cancel</Button>
        <Button variant="outline" size="sm" onClick={onSaveDraft}>Save draft</Button>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 ml-auto" onClick={onSaveAccept}>
          Save & send to Dev
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("border-t bg-card px-3 py-2.5 flex flex-wrap items-center gap-1.5 shrink-0", className)}>
      <ActionBtn
        icon={Send}
        label="Accept & send to Dev"
        className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
        onClick={() => {
          acceptSendToDev(ticket.id);
          toast.success("Sent to Dev pipeline");
        }}
      />
      <ActionBtn
        icon={CheckCircle}
        label="Accept (non-technical)"
        onClick={() => {
          acceptNonTechnical(ticket.id);
          toast.success("Closed without dev work");
        }}
      />
      <ActionBtn icon={Pencil} label="Edit" onClick={onEdit} />
      <ActionBtn
        icon={XCircle}
        label="Reject"
        className="text-red-600 border-red-200 hover:bg-red-50"
        onClick={() => {
          reject(ticket.id);
          toast.error("Rejected");
        }}
      />
      <ActionBtn
        icon={EyeOff}
        label="Ignore"
        onClick={() => {
          ignore(ticket.id);
          toast.info("Ignored — kept out of rejection stats");
        }}
      />
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button variant="outline" size="sm" className={cn("h-8 gap-1.5 text-xs", className)} onClick={onClick}>
      <Icon className="size-3.5" /> {label}
    </Button>
  );
}
