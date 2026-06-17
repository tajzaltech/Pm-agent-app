import { freshdeskStatus } from "@/lib/server/pm-agent-data";

export async function GET() {
  return Response.json(freshdeskStatus());
}
