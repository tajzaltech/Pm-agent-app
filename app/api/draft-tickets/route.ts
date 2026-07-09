import { addDraftTicketFromChat, listActivity, listDraftTickets } from "@/lib/server/pm-agent-data";
import type { Ticket } from "@/lib/types";

export async function GET() {
  return Response.json({
    tickets: listDraftTickets(),
    activity: listActivity(),
  });
}

export async function POST(request: Request) {
  let body: Ticket;
  try {
    body = (await request.json()) as Ticket;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.id || body.source !== "pm_chat" || body.status !== "pending") {
    return Response.json({ error: "Invalid chat draft ticket" }, { status: 400 });
  }

  const result = addDraftTicketFromChat(body);
  return Response.json(result, { status: result.duplicate ? 200 : 201 });
}
