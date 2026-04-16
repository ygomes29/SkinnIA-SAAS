import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) {
    return NextResponse.json({ slots: [] });
  }

  try {
    const response = await fetch(`${baseUrl}/functions/v1/check-availability`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao consultar disponibilidade" },
      { status: 502 }
    );
  }
}
