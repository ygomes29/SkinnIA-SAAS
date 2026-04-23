import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import { createAdminClient } from "../_shared/admin.ts";
import { corsHeaders } from "../_shared/cors.ts";

async function verifySignature(payload: string, signature: string | null) {
  const mpSecret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
  const stripeSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature) {
    return false;
  }

  const secret = signature.includes("v1=") ? stripeSecret : mpSecret;
  if (!secret) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const hashBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const computed = Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return signature.includes(computed) || signature.includes(`v1=${computed}`);
}

function normalizeStatus(status: string | undefined) {
  const value = status?.toLowerCase();
  if (value === "approved" || value === "succeeded" || value === "paid") return "paid";
  if (value === "rejected" || value === "failed" || value === "cancelled") return "failed";
  return "pending";
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const rawBody = await request.text();
  const signature =
    request.headers.get("x-signature") ?? request.headers.get("stripe-signature");

  try {
    const isValid = await verifySignature(rawBody, signature);
    if (!isValid) {
      return new Response(JSON.stringify({ ok: true, ignored: "invalid_signature" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const payload = JSON.parse(rawBody);
    const admin = createAdminClient();
    const status = normalizeStatus(payload.status ?? payload.data?.status ?? payload.type);
    const paymentReference =
      payload.payment_intent ??
      payload.data?.id ??
      payload.id ??
      payload.external_reference ??
      payload.metadata?.appointment_id;

    if (!paymentReference) {
      return new Response(JSON.stringify({ ok: true, ignored: "missing_reference" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: payment } = await admin
      .from("payments")
      .select("id, organization_id, appointment_id, provider_payment_id, provider_payment_intent")
      .or(
        `provider_payment_id.eq.${paymentReference},provider_payment_intent.eq.${paymentReference},appointment_id.eq.${paymentReference}`
      )
      .limit(1)
      .maybeSingle();

    if (!payment) {
      return new Response(JSON.stringify({ ok: true, ignored: "payment_not_found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (status === "paid") {
      await admin
        .from("payments")
        .update({
          status: "paid",
          paid_at: new Date().toISOString()
        })
        .eq("id", payment.id);

      await admin
        .from("appointments")
        .update({
          status: "confirmed",
          payment_status: "paid",
          confirmed_at: new Date().toISOString()
        })
        .eq("id", payment.appointment_id);

      await admin.from("appointment_status_history").insert({
        organization_id: payment.organization_id,
        appointment_id: payment.appointment_id,
        from_status: "pending_payment",
        to_status: "confirmed",
        reason: "payment_webhook_confirmed"
      });

      const n8nBase = Deno.env.get("N8N_WEBHOOK_BASE");
      if (n8nBase) {
        await fetch(`${n8nBase}/payment-confirmed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointment_id: payment.appointment_id,
            organization_id: payment.organization_id,
            payment_id: payment.id
          })
        });
      }
    }

    if (status === "failed") {
      await admin
        .from("payments")
        .update({
          status: "failed"
        })
        .eq("id", payment.id);

      const n8nBase = Deno.env.get("N8N_WEBHOOK_BASE");
      if (n8nBase) {
        await fetch(`${n8nBase}/payment-failed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointment_id: payment.appointment_id,
            organization_id: payment.organization_id,
            payment_id: payment.id
          })
        });
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error(error);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
