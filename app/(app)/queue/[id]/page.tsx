import { redirect } from "next/navigation";

export default async function QueueTicketRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/chat/ticket/${encodeURIComponent(id)}`);
}
