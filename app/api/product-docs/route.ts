import { addProductDoc, listProductDocs } from "@/lib/server/pm-agent-data";

interface ProductDocBody {
  name?: string;
  size?: string;
  type?: string;
}

export async function GET() {
  return Response.json({ docs: listProductDocs() });
}

export async function POST(request: Request) {
  let body: ProductDocBody;
  try {
    body = (await request.json()) as ProductDocBody;
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!body.name || !body.size || !body.type) {
    return Response.json({ error: "name, size, and type are required" }, { status: 400 });
  }

  const doc = addProductDoc({
    name: body.name,
    size: body.size,
    type: body.type,
  });

  return Response.json({ ok: true, doc }, { status: 201 });
}
