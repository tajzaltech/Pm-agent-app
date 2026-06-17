import { ingestSourceTicket } from "@/lib/server/pm-agent-data";
import type { Ticket } from "@/lib/types";

interface GenericWebhookBody {
  provider?: Ticket["source"];
  externalId?: string;
  subject?: string;
  body?: string;
  customerName?: string;
  customerEmail?: string;
  customerPlan?: Ticket["customer"]["plan"];
  internalNotes?: string;
}

export async function POST(request: Request) {
  let body: GenericWebhookBody;
  try {
    body = (await request.json()) as GenericWebhookBody;
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const result = ingestSourceTicket({
    provider: body.provider ?? "webhook",
    externalId: body.externalId,
    subject: body.subject,
    body: body.body,
    customerName: body.customerName,
    customerEmail: body.customerEmail,
    customerPlan: body.customerPlan,
    internalNotes: body.internalNotes,
    rawPayload: body,
  });

  return Response.json(
    {
      ok: true,
      duplicate: result.duplicate,
      ticket: result.ticket,
    },
    { status: result.duplicate ? 200 : 201 }
  );
}
