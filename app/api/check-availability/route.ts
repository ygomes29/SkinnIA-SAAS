import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveOrgContext } from "@/lib/api/resolve-org";

const bodySchema = z.object({
  professional_id: z.string().uuid(),
  service_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  unit_id: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const { ctx, err } = await resolveOrgContext();
  if (err) return err;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return NextResponse.json({ slots: [] });

  try {
    const response = await fetch(`${baseUrl}/functions/v1/check-availability`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
      },
      body: JSON.stringify({ ...parsed.data, organization_id: ctx.orgId }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Falha ao consultar disponibilidade" }, { status: 502 });
  }
}
