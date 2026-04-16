import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  organization_id: z.string().uuid().optional(),
  client_ids: z.array(z.string().uuid()).default([])
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const webhookUrl = `${process.env.N8N_WEBHOOK_BASE ?? "http://localhost:5678/webhook"}/reactivation-manual`;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.N8N_API_KEY ? { "X-N8N-API-KEY": process.env.N8N_API_KEY } : {})
      },
      body: JSON.stringify(parsed.data)
    });

    if (!response.ok) {
      throw new Error(`n8n respondeu ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Falha ao acionar workflow"
      },
      { status: 502 }
    );
  }
}
