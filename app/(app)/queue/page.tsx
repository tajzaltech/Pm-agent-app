import { redirect } from "next/navigation";

import { redirectPath, type RouteSearchParams } from "@/lib/utils/route-redirect";

export default async function QueueRedirect({ searchParams }: { searchParams: Promise<RouteSearchParams> }) {
  redirect(redirectPath("/pipeline", await searchParams));
}
