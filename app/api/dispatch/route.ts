import { NextRequest, NextResponse } from "next/server";
import { getDraftTicketById } from "@/lib/server/pm-agent-data";

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    ticketId?: string;
    branchName?: string;
    agentType?: string;
    webhookUrl?: string;
  };

  const { ticketId, branchName, agentType, webhookUrl } = body;

  if (!ticketId || !webhookUrl) {
    return NextResponse.json({ error: "ticketId and webhookUrl are required" }, { status: 400 });
  }

  const ticket = getDraftTicketById(ticketId);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const payload = {
    ticket_id: ticket.id,
    title: ticket.draftTitle,
    description: ticket.draftDescription,
    suggested_approach: ticket.suggestedApproach,
    acceptance_criteria: ticket.acceptanceCriteria,
    scope: ticket.scope,
    classification: ticket.classification,
    code_refs: ticket.codeRefs.map((r) => ({
      file_path: r.filePath,
      function_name: r.functionName,
      line_start: r.lineStart,
      line_end: r.lineEnd,
      snippet: r.snippet,
      language: r.language,
    })),
    branch_name: branchName ?? `fix/${ticketId}`,
    agent_type: agentType ?? "claude-code",
    dispatched_at: new Date().toISOString(),
    source_ticket: {
      id: ticket.originalTicketId,
      subject: ticket.originalSubject,
      customer: ticket.customer.name,
      plan: ticket.customer.plan,
    },
  };

  try {
    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "PM-Agent/1.0" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });

    if (!webhookRes.ok) {
      return NextResponse.json(
        { error: `Webhook returned ${webhookRes.status}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, branch: branchName, dispatched_at: payload.dispatched_at });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
