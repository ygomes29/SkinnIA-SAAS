import { subDays } from "date-fns";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  mockAppointments,
  mockAutomationRuns,
  mockClients,
  mockMetrics,
  mockProfessionals,
  mockServices
} from "@/lib/mock-data";
import type { AgentConfig, Appointment, AutomationRun, Client, MetricDaily, Organization, Professional, Service } from "@/types/skinnia";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function getMetricsSummary() {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return mockMetrics.at(-1) ?? null;
  }

  const { data, error } = await supabase
    .from("metrics_daily")
    .select("*")
    .eq("date", todayIsoDate())
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return mockMetrics.at(-1) ?? null;
  }

  return {
    ...data,
    appointments_total: data.appointments_total ?? 0,
    appointments_confirmed: data.appointments_confirmed ?? 0,
    appointments_cancelled: data.appointments_cancelled ?? 0,
    appointments_no_show: data.appointments_no_show ?? 0,
    appointments_completed: data.appointments_completed ?? 0,
    revenue_total: Number(data.revenue_total ?? 0),
    revenue_deposits: Number(data.revenue_deposits ?? 0),
    revenue_lost_no_show: Number(data.revenue_lost_no_show ?? 0),
    new_clients: data.new_clients ?? 0,
    returning_clients: data.returning_clients ?? 0
  } satisfies MetricDaily;
}

export async function getRevenueSeries(days = 7) {
  const supabase = createSupabaseServerClient();
  const minDate = subDays(new Date(), days - 1).toISOString().slice(0, 10);

  if (!supabase) {
    return mockMetrics.slice(-days);
  }

  const { data, error } = await supabase
    .from("metrics_daily")
    .select("*")
    .gte("date", minDate)
    .order("date", { ascending: true });

  if (error || !data || data.length === 0) {
    return mockMetrics.slice(-days);
  }

  return data.map((row) => ({
    ...row,
    appointments_total: row.appointments_total ?? 0,
    appointments_confirmed: row.appointments_confirmed ?? 0,
    appointments_cancelled: row.appointments_cancelled ?? 0,
    appointments_no_show: row.appointments_no_show ?? 0,
    appointments_completed: row.appointments_completed ?? 0,
    revenue_total: Number(row.revenue_total ?? 0),
    revenue_deposits: Number(row.revenue_deposits ?? 0),
    revenue_lost_no_show: Number(row.revenue_lost_no_show ?? 0),
    new_clients: row.new_clients ?? 0,
    returning_clients: row.returning_clients ?? 0
  })) as MetricDaily[];
}

// Single query with joins — no mock enrichment
async function fetchAppointmentsWithJoins(supabase: NonNullable<ReturnType<typeof createSupabaseServerClient>>, filter: Record<string, unknown> = {}) {
  let query = supabase
    .from("appointments")
    .select(`
      id, organization_id, unit_id, professional_id, client_id, service_id,
      start_at, end_at, price, status, payment_status, confirmation_status,
      deposit_required, deposit_amount, source,
      professionals ( name, avatar_url ),
      clients ( name, phone ),
      services ( name, color, duration_minutes )
    `);

  if (filter.gte_start) query = query.gte("start_at", filter.gte_start as string);
  if (filter.lte_start) query = query.lte("start_at", filter.lte_start as string);
  if (filter.limit) query = query.limit(filter.limit as number);

  return query.order("start_at", { ascending: true });
}

function mapAppointmentRow(item: Record<string, unknown>): Appointment {
  const prof = item.professionals as Record<string, string> | null;
  const client = item.clients as Record<string, string> | null;
  const svc = item.services as Record<string, unknown> | null;

  return {
    id: item.id as string,
    organization_id: item.organization_id as string,
    unit_id: item.unit_id as string | undefined,
    professional_id: item.professional_id as string,
    client_id: item.client_id as string,
    service_id: item.service_id as string,
    professional_name: prof?.name ?? "Profissional",
    professional_avatar: prof?.avatar_url ?? "",
    client_name: client?.name ?? "Cliente",
    service_name: svc?.name as string ?? "Serviço",
    service_color: svc?.color as string ?? "#EC4899",
    start_at: item.start_at as string,
    end_at: item.end_at as string,
    price: Number(item.price),
    status: item.status as Appointment["status"],
    payment_status: (item.payment_status ?? "pending") as Appointment["payment_status"],
    confirmation_status: (item.confirmation_status ?? "pending") as Appointment["confirmation_status"],
    deposit_required: Boolean(item.deposit_required),
    deposit_amount: item.deposit_amount ? Number(item.deposit_amount) : null,
    source: (item.source ?? "panel") as Appointment["source"],
  };
}

export async function getTodayAppointments(): Promise<Appointment[]> {
  const supabase = createSupabaseServerClient();

  if (!supabase) return mockAppointments;

  const start = `${todayIsoDate()}T00:00:00.000Z`;
  const end = `${todayIsoDate()}T23:59:59.999Z`;

  const { data, error } = await fetchAppointmentsWithJoins(supabase, {
    gte_start: start,
    lte_start: end,
  });

  if (error || !data) return mockAppointments;
  if (data.length === 0) return [];

  return data.map((item) => mapAppointmentRow(item as Record<string, unknown>));
}

export async function getAppointments(limit = 100): Promise<Appointment[]> {
  const supabase = createSupabaseServerClient();

  if (!supabase) return mockAppointments.slice(0, limit);

  const { data, error } = await fetchAppointmentsWithJoins(supabase, { limit });

  if (error || !data) return mockAppointments.slice(0, limit);
  if (data.length === 0) return [];

  return data.map((item) => mapAppointmentRow(item as Record<string, unknown>));
}

export async function getReactivationCandidates(): Promise<Client[]> {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return mockClients.filter((client) => client.last_appointment_at);
  }

  const cutoffStart = subDays(new Date(), 35).toISOString();
  const cutoffEnd = subDays(new Date(), 25).toISOString();

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .gte("last_appointment_at", cutoffStart)
    .lte("last_appointment_at", cutoffEnd)
    .order("last_appointment_at", { ascending: true })
    .limit(8);

  if (error || !data) {
    return mockClients.filter((client) => client.last_appointment_at);
  }

  if (data.length === 0) return [];

  return data.map((client) => ({
    ...client,
    tags: client.tags ?? [],
    total_appointments: client.total_appointments ?? 0,
    total_spent: Number(client.total_spent ?? 0),
    ltv: Number(client.ltv ?? 0),
    status: client.status ?? "active"
  })) as Client[];
}

export async function getClients(): Promise<Client[]> {
  const supabase = createSupabaseServerClient();

  if (!supabase) return mockClients;

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) return mockClients;
  if (data.length === 0) return [];

  return data.map((client) => ({
    ...client,
    tags: client.tags ?? [],
    total_appointments: client.total_appointments ?? 0,
    total_spent: Number(client.total_spent ?? 0),
    ltv: Number(client.ltv ?? 0),
    status: client.status ?? "active"
  })) as Client[];
}

export async function getAutomationRuns(): Promise<AutomationRun[]> {
  const supabase = createSupabaseServerClient();

  if (!supabase) return mockAutomationRuns;

  const { data, error } = await supabase
    .from("automation_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return mockAutomationRuns;
  if (data.length === 0) return [];

  return data.map((row) => ({
    ...row,
    status: row.status ?? "success",
    created_at: row.created_at ?? new Date().toISOString()
  })) as AutomationRun[];
}

export async function getProfessionals(): Promise<Professional[]> {
  const supabase = createSupabaseServerClient();

  if (!supabase) return mockProfessionals;

  const { data, error } = await supabase
    .from("professionals")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error || !data) return mockProfessionals;
  if (data.length === 0) return [];

  return data.map((row) => ({
    ...row,
    is_active: row.is_active ?? true,
    working_hours: row.working_hours ?? {},
    blocked_times: row.blocked_times ?? []
  })) as Professional[];
}

export async function getOrganization(): Promise<Organization | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: ou } = await supabase
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!ou) return null;

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", ou.organization_id)
    .single();

  if (error || !data) return null;
  return data as Organization;
}

export async function getAgentConfigs(): Promise<AgentConfig[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: ou } = await supabase
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!ou) return [];

  const { data, error } = await supabase
    .from("agent_configs")
    .select("*")
    .eq("organization_id", ou.organization_id)
    .order("agent_key");

  if (error || !data) return [];
  return data as AgentConfig[];
}

export async function getMessageTemplates() {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: ou } = await supabase
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!ou) return [];

  const { data, error } = await supabase
    .from("message_templates")
    .select("id, key, title, body, variables")
    .eq("organization_id", ou.organization_id)
    .order("key");

  if (error || !data) return [];
  return data as { id: string; key: string; title: string; body: string; variables: string[] }[];
}

export async function getServices(): Promise<Service[]> {
  const supabase = createSupabaseServerClient();

  if (!supabase) return mockServices;

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error || !data) return mockServices;
  if (data.length === 0) return [];

  return data.map((row) => ({
    ...row,
    price: Number(row.price),
    deposit_required: row.deposit_required ?? false,
    deposit_amount: row.deposit_amount ? Number(row.deposit_amount) : null,
    deposit_pct: row.deposit_pct ? Number(row.deposit_pct) : null,
    cancellation_penalty_pct: row.cancellation_penalty_pct
      ? Number(row.cancellation_penalty_pct)
      : null,
    is_active: row.is_active ?? true
  })) as Service[];
}
