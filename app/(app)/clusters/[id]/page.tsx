import { redirect } from "next/navigation";

export default async function ClusterDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/triage?cluster=${id}`);
}
