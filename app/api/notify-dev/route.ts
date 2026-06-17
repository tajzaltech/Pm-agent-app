import { NextRequest, NextResponse } from "next/server";
import { getDraftTicketById } from "@/lib/server/pm-agent-data";

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    ticketId: string;
    assigneeName: string;
    assigneeEmail: string;
    tool: string;
    externalId?: string;
    branchName: string;
  };

  const ticket = getDraftTicketById(body.ticketId);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const specUrl = `${req.nextUrl.origin}/dev/${ticket.id}`;

  // Build the email HTML (in production: send via Resend/SendGrid)
  const emailPayload = {
    to: body.assigneeEmail,
    subject: `[PM-Agent] New ticket assigned: ${ticket.draftTitle}`,
    specUrl,
    ticket: {
      id: ticket.id,
      title: ticket.draftTitle,
      description: ticket.draftDescription,
      scope: ticket.scope,
      classification: ticket.classification,
      acceptanceCriteria: ticket.acceptanceCriteria,
      suggestedApproach: ticket.suggestedApproach,
      codeRefs: ticket.codeRefs,
    },
    assigneeName: body.assigneeName,
    tool: body.tool,
    externalId: body.externalId,
    branchName: body.branchName,
  };

  // Log email (replace with real email provider in production)
  console.log("[notify-dev] Email would be sent:", JSON.stringify(emailPayload, null, 2));

  return NextResponse.json({ success: true, specUrl, emailPayload });
}
