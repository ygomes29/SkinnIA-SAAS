import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveOrgContext } from "@/lib/api/resolve-org";

const schema = z.object({
  client_ids: z.array(z.string().uuid()).min(1).max(100),
});

export async function POST(request: Request) {
  const { ctx, err } = await resolveOrgContext();
  if (err) return err;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const webhookUrl = `${process.env.N8N_WEBHOOK_BASE ?? "http://localhost:5678/webhook"}/reactivation-manual`;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.N8N_API_KEY ? { "X-N8N-API-KEY": process.env.N8N_API_KEY } : {}),
      },
      body: JSON.stringify({
        organization_id: ctx.orgId,
        client_ids: parsed.data.client_ids,
      }),
    });

    if (!response.ok) throw new Error(`n8n respondeu ${response.status}`);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Falha ao acionar workflow" }, { status: 502 });
  }
}
