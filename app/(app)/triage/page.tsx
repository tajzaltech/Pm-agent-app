import { redirect } from "next/navigation";

import { firstParam, redirectPath, type RouteSearchParams } from "@/lib/utils/route-redirect";

export default async function TriagePage({ searchParams }: { searchParams: Promise<RouteSearchParams> }) {
  const params = await searchParams;
  const ticketId = firstParam(params.ticket);
  if (ticketId) redirect(`/chat/ticket/${encodeURIComponent(ticketId)}`);
  redirect(redirectPath("/pipeline", params));
}
