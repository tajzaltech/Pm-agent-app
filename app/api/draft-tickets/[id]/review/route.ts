import type { Ticket, TicketStatus } from "@/lib/types";
import { updateDraftStatus } from "@/lib/server/pm-agent-data";

interface ReviewBody {
  action?: "accept" | "reject";
  updates?: Partial<Ticket>;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  let body: ReviewBody;
  try {
    body = (await request.json()) as ReviewBody;
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (body.action !== "accept" && body.action !== "reject") {
    return Response.json({ error: "Action must be accept or reject" }, { status: 400 });
  }

  const status: TicketStatus = body.action === "accept" ? "accepted" : "rejected";
  const ticket = updateDraftStatus(id, status, body.updates);

  if (!ticket) {
    return Response.json({ error: "Draft ticket not found" }, { status: 404 });
  }

  return Response.json({ ok: true, ticket });
}
