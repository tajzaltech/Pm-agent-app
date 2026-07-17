import { redirect } from "next/navigation";

import { redirectPath, type RouteSearchParams } from "@/lib/utils/route-redirect";

export default async function AnalyticsRedirect({ searchParams }: { searchParams: Promise<RouteSearchParams> }) {
  redirect(redirectPath("/insights", await searchParams));
}
