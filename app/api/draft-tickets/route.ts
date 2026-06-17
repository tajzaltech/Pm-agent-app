import { listActivity, listDraftTickets } from "@/lib/server/pm-agent-data";

export async function GET() {
  return Response.json({
    tickets: listDraftTickets(),
    activity: listActivity(),
  });
}
