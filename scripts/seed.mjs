/**
 * Seed script — Studio Lumi (dados de demonstração)
 * Executa via: node scripts/seed.mjs
 *
 * Requer .env.local com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Ler .env.local manualmente
const envPath = resolve(__dirname, "../.env.local");
const envLines = readFileSync(envPath, "utf-8").split("\n");
const env = {};
for (const line of envLines) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) env[key.trim()] = rest.join("=").trim();
}

const SUPABASE_URL = env["NEXT_PUBLIC_SUPABASE_URL"];
const SERVICE_ROLE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados no .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const ORG_ID   = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const UNIT_ID  = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const USER_ID  = "11111111-1111-1111-1111-111111111111";
const OU_ID    = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const PRO_ANA  = "dddddddd-dddd-dddd-dddd-dddddddddddd";
const PRO_CARLA = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
const SVC_LASH = "ffffffff-ffff-ffff-ffff-ffffffffffff";
const SVC_HID  = "99999999-9999-9999-9999-999999999999";
const CLI_MARINA = "12121212-1212-1212-1212-121212121212";
const CLI_BIANCA = "13131313-1313-1313-1313-131313131313";
const APT_1    = "14141414-1414-1414-1414-141414141414";
const APT_2    = "15151515-1515-1515-1515-151515151515";
const PAY_1    = "16161616-1616-1616-1616-161616161616";
const THREAD_1 = "17171717-1717-1717-1717-171717171717";
const MSG_1    = "18181818-1818-1818-1818-181818181818";
const MSG_2    = "19191919-1919-1919-1919-191919191919";

async function step(label, fn) {
  process.stdout.write(`  ${label}... `);
  try {
    await fn();
    console.log("✓");
  } catch (err) {
    console.log(`✗ ${err.message}`);
  }
}

async function upsert(table, data, onConflict) {
  const opts = onConflict ? { onConflict } : {};
  const { error } = await supabase.from(table).upsert(data, { ignoreDuplicates: true, ...opts });
  if (error) throw error;
}

async function main() {
  console.log("\n🌱 Aplicando seed — Studio Lumi\n");

  // 1. Auth user
  await step("auth.users — owner@skinnia.local", async () => {
    const { data: existing } = await supabase.auth.admin.getUserById(USER_ID);
    if (existing?.user) { return; } // já existe
    const { error } = await supabase.auth.admin.createUser({
      email: "owner@skinnia.local",
      password: "SkinnIA123!",
      email_confirm: true,
      user_metadata: { name: "Owner SkinnIA" },
      app_metadata: { provider: "email", providers: ["email"] }
    });
    // Se a API não aceitar UUID customizado, tentamos com .id (versão mais recente do Supabase admin)
    if (error && error.message.includes("id")) {
      // Criar sem ID fixo — checar se existe pelo email
      const { data: list } = await supabase.auth.admin.listUsers();
      const match = list?.users?.find(u => u.email === "owner@skinnia.local");
      if (!match) throw error;
    } else if (error) {
      throw error;
    }
  });

  // 2. Organization
  await step("organizations — Studio Lumi", async () => {
    await upsert("organizations", [{
      id: ORG_ID,
      name: "Studio Lumi",
      slug: "studio-lumi",
      plan: "pro",
      whatsapp_instance: "skinnia-studio-lumi",
      whatsapp_status: "connected",
      timezone: "America/Sao_Paulo",
      settings: { city: "Belo Horizonte", org_type: "studio", agent_name: "Luna", tone: "premium" },
      trial_ends_at: null
    }]);
  });

  // 3. Unit
  await step("units — Matriz Savassi", async () => {
    await upsert("units", [{
      id: UNIT_ID,
      organization_id: ORG_ID,
      name: "Matriz Savassi",
      address: "Rua dos Inconfidentes, 321",
      city: "Belo Horizonte",
      state: "MG",
      phone: "+55 31 99999-1111",
      working_hours: {
        monday: { start: "09:00", end: "19:00" },
        tuesday: { start: "09:00", end: "19:00" },
        wednesday: { start: "09:00", end: "19:00" },
        thursday: { start: "09:00", end: "19:00" },
        friday: { start: "09:00", end: "19:00" },
        saturday: { start: "09:00", end: "15:00" }
      }
    }]);
  });

  // 4. organization_users (precisa do user_id correto do auth)
  await step("organization_users — owner vinculado", async () => {
    // Buscar user_id real (pode ter sido criado sem UUID customizado)
    const { data: list } = await supabase.auth.admin.listUsers();
    const owner = list?.users?.find(u => u.email === "owner@skinnia.local");
    const realUserId = owner?.id ?? USER_ID;

    const { error } = await supabase.from("organization_users").upsert([{
      id: OU_ID,
      organization_id: ORG_ID,
      user_id: realUserId,
      unit_id: UNIT_ID,
      role: "owner"
    }], { ignoreDuplicates: true, onConflict: "organization_id,user_id" });
    if (error && !error.message.includes("duplicate")) throw error;
  });

  // 5. Professionals
  await step("professionals — Ana, Carla", async () => {
    const now = new Date();
    const workAna = { monday: { start: "09:00", end: "18:00" }, tuesday: { start: "09:00", end: "18:00" }, wednesday: { start: "09:00", end: "18:00" }, thursday: { start: "09:00", end: "18:00" }, friday: { start: "09:00", end: "18:00" } };
    const workCarla = { monday: { start: "10:00", end: "19:00" }, tuesday: { start: "10:00", end: "19:00" }, wednesday: { start: "10:00", end: "19:00" }, thursday: { start: "10:00", end: "19:00" }, friday: { start: "10:00", end: "19:00" }, saturday: { start: "09:00", end: "14:00" } };
    await upsert("professionals", [
      { id: PRO_ANA, organization_id: ORG_ID, unit_id: UNIT_ID, name: "Ana", phone: "+55 31 98888-1001", commission_pct: 12, working_hours: workAna },
      { id: PRO_CARLA, organization_id: ORG_ID, unit_id: UNIT_ID, name: "Carla", phone: "+55 31 98888-1002", commission_pct: 15, working_hours: workCarla }
    ]);
  });

  // 6. Services
  await step("services — Lash Lifting, Hidratação Premium", async () => {
    await upsert("services", [
      { id: SVC_LASH, organization_id: ORG_ID, name: "Lash Lifting", category: "lash", duration_minutes: 90, price: 180, deposit_required: true, deposit_amount: 50, color: "#EC4899" },
      { id: SVC_HID, organization_id: ORG_ID, name: "Hidratação Premium", category: "cabelo", duration_minutes: 60, price: 140, deposit_required: false, deposit_amount: null, color: "#8B5CF6" }
    ]);
  });

  // 7. service_professionals
  await step("service_professionals — vínculos", async () => {
    const { error } = await supabase.from("service_professionals").upsert([
      { organization_id: ORG_ID, service_id: SVC_LASH, professional_id: PRO_ANA },
      { organization_id: ORG_ID, service_id: SVC_LASH, professional_id: PRO_CARLA },
      { organization_id: ORG_ID, service_id: SVC_HID, professional_id: PRO_ANA }
    ], { ignoreDuplicates: true, onConflict: "service_id,professional_id" });
    if (error && !error.message.includes("duplicate")) throw error;
  });

  // 8. Clients
  await step("clients — Marina Souza, Bianca Araujo", async () => {
    const now = new Date();
    const d31 = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000).toISOString();
    const d14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    await upsert("clients", [
      { id: CLI_MARINA, organization_id: ORG_ID, name: "Marina Souza", phone: "+55 31 98888-1111", tags: ["vip", "lash"], preferred_professional_id: PRO_ANA, last_appointment_at: d31, total_appointments: 8, total_spent: 1240, ltv: 1240, status: "active" },
      { id: CLI_BIANCA, organization_id: ORG_ID, name: "Bianca Araujo", phone: "+55 31 97777-2222", tags: ["cabelo"], preferred_professional_id: PRO_CARLA, last_appointment_at: d14, total_appointments: 3, total_spent: 420, ltv: 420, status: "active" }
    ]);
  });

  // 9. client_tags
  await step("client_tags", async () => {
    const { error } = await supabase.from("client_tags").upsert([
      { organization_id: ORG_ID, name: "vip", color: "#EC4899" },
      { organization_id: ORG_ID, name: "lash", color: "#8B5CF6" },
      { organization_id: ORG_ID, name: "cabelo", color: "#14B8A6" }
    ], { ignoreDuplicates: true, onConflict: "organization_id,name" });
    if (error && !error.message.includes("duplicate")) throw error;
  });

  // 10. Appointments
  await step("appointments — 2 agendamentos", async () => {
    const now = new Date();
    const h = (n) => {
      const d = new Date(now);
      d.setMinutes(0, 0, 0);
      d.setHours(d.getHours() + n);
      return d.toISOString();
    };
    await upsert("appointments", [
      { id: APT_1, organization_id: ORG_ID, unit_id: UNIT_ID, professional_id: PRO_ANA, client_id: CLI_MARINA, service_id: SVC_LASH, start_at: h(3), end_at: h(5), status: "confirmed", price: 180, deposit_required: true, deposit_amount: 50, payment_status: "paid", confirmation_status: "confirmed", source: "whatsapp" },
      { id: APT_2, organization_id: ORG_ID, unit_id: UNIT_ID, professional_id: PRO_CARLA, client_id: CLI_BIANCA, service_id: SVC_HID, start_at: h(5), end_at: h(6), status: "pending_payment", price: 140, deposit_required: false, deposit_amount: null, payment_status: "pending", confirmation_status: "pending", source: "panel" }
    ]);
  });

  // 11. Payments
  await step("payments — sinal Marina", async () => {
    const paid = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    await upsert("payments", [{
      id: PAY_1, organization_id: ORG_ID, appointment_id: APT_1, client_id: CLI_MARINA,
      amount: 50, type: "deposit", method: "pix", status: "paid",
      provider: "mercadopago", provider_payment_id: "mp-payment-1",
      provider_payment_intent: "mp-intent-1", paid_at: paid
    }]);
  });

  // 12. Conversation threads
  await step("conversation_threads — Marina", async () => {
    const lastMsg = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { error } = await supabase.from("conversation_threads").upsert([{
      id: THREAD_1, organization_id: ORG_ID, client_id: CLI_MARINA,
      phone: "+55 31 98888-1111", status: "bot", current_agent: "agendamento",
      context: { last_intent: "schedule" }, last_message_at: lastMsg
    }], { ignoreDuplicates: true, onConflict: "organization_id,phone_normalized,channel" });
    if (error && !error.message.includes("duplicate")) throw error;
  });

  // 13. Messages
  await step("messages — conversa Marina", async () => {
    await upsert("messages", [
      { id: MSG_1, thread_id: THREAD_1, organization_id: ORG_ID, direction: "inbound", content: "quero agendar lash para sexta", message_type: "text", agent: "router" },
      { id: MSG_2, thread_id: THREAD_1, organization_id: ORG_ID, direction: "outbound", content: "Encontrei horários disponíveis com a Ana. Responda 1, 2 ou 3.", message_type: "text", agent: "agendamento" }
    ]);
  });

  // 14. automation_runs
  await step("automation_runs", async () => {
    const { error } = await supabase.from("automation_runs").insert([
      { organization_id: ORG_ID, workflow_name: "SkinnIA — Roteador Central", trigger_type: "webhook", status: "success", duration_ms: 420 },
      { organization_id: ORG_ID, workflow_name: "SkinnIA — Cobrança de Sinal", trigger_type: "internal", status: "running", duration_ms: 3200 }
    ]);
    if (error && !error.message.includes("duplicate") && !error.message.includes("23505")) throw error;
  });

  // 15. notification_logs
  await step("notification_logs", async () => {
    const { error } = await supabase.from("notification_logs").insert([{
      organization_id: ORG_ID, client_id: CLI_MARINA, appointment_id: APT_1,
      type: "reminder_24h", status: "sent",
      content: "Oi Marina! Passando para confirmar seu horário amanhã."
    }]);
    if (error && !error.message.includes("duplicate") && !error.message.includes("23505")) throw error;
  });

  // 16. metrics_daily
  await step("metrics_daily — ontem e hoje", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const { error } = await supabase.from("metrics_daily").upsert([
      { organization_id: ORG_ID, unit_id: UNIT_ID, date: yesterday, appointments_total: 15, appointments_confirmed: 12, appointments_cancelled: 1, appointments_no_show: 0, appointments_completed: 11, revenue_total: 2540, revenue_deposits: 270, revenue_lost_no_show: 0, new_clients: 2, returning_clients: 10 },
      { organization_id: ORG_ID, unit_id: UNIT_ID, date: today, appointments_total: 13, appointments_confirmed: 10, appointments_cancelled: 1, appointments_no_show: 1, appointments_completed: 7, revenue_total: 2210, revenue_deposits: 240, revenue_lost_no_show: 180, new_clients: 2, returning_clients: 8 }
    ], { onConflict: "organization_id,unit_id,date" });
    if (error) throw error;
  });

  // 17. agent_configs
  await step("agent_configs — Luna, Luna Financeiro", async () => {
    const { error } = await supabase.from("agent_configs").upsert([
      { organization_id: ORG_ID, agent_key: "atendimento", name: "Luna", tone: "premium", is_active: true, prompt_overrides: { handoff: "human" } },
      { organization_id: ORG_ID, agent_key: "financeiro", name: "Luna Financeiro", tone: "objetivo", is_active: true, prompt_overrides: {} }
    ], { ignoreDuplicates: true, onConflict: "organization_id,agent_key" });
    if (error && !error.message.includes("duplicate")) throw error;
  });

  // 18. message_templates
  await step("message_templates — lembrete, sinal", async () => {
    const { error } = await supabase.from("message_templates").upsert([
      { organization_id: ORG_ID, key: "reminder_24h", title: "Lembrete 24h", body: "Oi {nome}! Passando para lembrar do seu atendimento de {servico} amanhã às {hora}.", variables: ["nome", "servico", "hora"] },
      { organization_id: ORG_ID, key: "pix_deposit", title: "Cobrança de sinal", body: "Seu horário foi pré-reservado. Pague o sinal de {valor} via Pix para confirmar.", variables: ["valor"] }
    ], { ignoreDuplicates: true, onConflict: "organization_id,key" });
    if (error && !error.message.includes("duplicate")) throw error;
  });

  console.log("\n✅ Seed concluído!\n");
  console.log("   Login de demonstração: owner@skinnia.local / SkinnIA123!");
  console.log("   Org: Studio Lumi | 2 profissionais | 2 serviços | 2 clientes | 2 agendamentos\n");
}

main().catch((err) => {
  console.error("\n❌ Erro fatal:", err.message);
  process.exit(1);
});
