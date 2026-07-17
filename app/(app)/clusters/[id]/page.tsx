import { redirect } from "next/navigation";

import { redirectPath, type RouteSearchParams } from "@/lib/utils/route-redirect";

export default async function ClusterDetailRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<RouteSearchParams>;
}) {
  const { id } = await params;
  redirect(redirectPath("/pipeline", await searchParams, { cluster: id }));
}
