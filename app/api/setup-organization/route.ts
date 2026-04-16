import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  owner_user_id: z.string().uuid(),
  phone: z.string().optional(),
  city: z.string().optional()
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!baseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes." },
      { status: 500 }
    );
  }

  const response = await fetch(`${baseUrl}/functions/v1/setup-organization`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`
    },
    body: JSON.stringify(parsed.data)
  });

  const data = await response.json();

  return NextResponse.json(data, { status: response.status });
}
