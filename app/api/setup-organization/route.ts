import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/),
  owner_user_id: z.string().uuid(),
  phone: z.string().max(20).optional(),
  city: z.string().max(80).optional(),
});

export async function POST(request: Request) {
  // Internal server-to-server route — requires service role key as Bearer token
  const authHeader = request.headers.get("authorization") ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || authHeader !== `Bearer ${serviceKey}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return NextResponse.json({ error: "Configuração ausente" }, { status: 500 });

  try {
    const response = await fetch(`${baseUrl}/functions/v1/setup-organization`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(parsed.data),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.ok ? response.status : 500 });
  } catch {
    return NextResponse.json({ error: "Falha ao configurar organização" }, { status: 502 });
  }
}
