import { ingestSourceTicket, normalizeFreshdeskPayload } from "@/lib/server/pm-agent-data";

function isAuthorized(request: Request) {
  const expected = process.env.FRESHDESK_WEBHOOK_SECRET;
  if (!expected) return true;

  const provided =
    request.headers.get("x-pm-agent-secret") ||
    request.headers.get("x-freshdesk-webhook-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  return provided === expected;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Invalid Freshdesk webhook secret" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const normalized = normalizeFreshdeskPayload(payload);
  const result = ingestSourceTicket(normalized);

  return Response.json(
    {
      ok: true,
      duplicate: result.duplicate,
      ticket: result.ticket,
    },
    { status: result.duplicate ? 200 : 201 }
  );
}
