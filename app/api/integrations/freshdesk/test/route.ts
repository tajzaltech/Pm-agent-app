import { ingestSourceTicket } from "@/lib/server/pm-agent-data";

export async function POST() {
  const result = ingestSourceTicket({
    provider: "freshdesk",
    externalId: `FD-TEST-${Date.now().toString().slice(-5)}`,
    subject: "Checkout webhook creates duplicate charges",
    body:
      "A customer reports that checkout sometimes charges the same order twice after a Stripe webhook timeout. They need this fixed before more enterprise users are affected.",
    customerName: "Test Customer",
    customerEmail: "test.customer@example.com",
    customerPlan: "enterprise",
    internalNotes: "Created from the Freshdesk test integration route.",
  });

  return Response.json({ ok: true, ticket: result.ticket }, { status: 201 });
}
