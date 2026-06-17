import { NextRequest, NextResponse } from "next/server";
import { getDraftTicketById } from "@/lib/server/pm-agent-data";
import type { DeliveryTool } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    ticketId: string;
    assigneeId: string;
    assigneeName: string;
    tool: DeliveryTool;
  };

  const ticket = getDraftTicketById(body.ticketId);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  // Build the external ticket payload
  const externalId = `${body.tool.toUpperCase().slice(0, 3)}-${Math.floor(Math.random() * 900 + 100)}`;
  const payload = {
    title: ticket.draftTitle,
    description: ticket.draftDescription,
    acceptance_criteria: ticket.acceptanceCriteria,
    suggested_approach: ticket.suggestedApproach,
    code_refs: ticket.codeRefs.map((r) => ({ file: r.filePath, function: r.functionName })),
    scope: ticket.scope,
    classification: ticket.classification,
    assignee: body.assigneeName,
    source_ticket_id: ticket.originalTicketId,
    tool: body.tool,
    external_id: externalId,
  };

  // If a webhook URL is configured, forward it
  // (skipped here; handled by the client store if toolWebhookUrl is set)

  return NextResponse.json({
    success: true,
    externalId,
    externalUrl: `https://${body.tool}.example.com/tickets/${externalId}`,
    payload,
  });
}
