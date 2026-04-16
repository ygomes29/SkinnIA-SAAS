export type Plan = "trial" | "starter" | "pro" | "enterprise";
export type AppointmentStatus =
  | "draft"
  | "pending_payment"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show"
  | "refunded";

export type PaymentStatus =
  | "pending"
  | "partial"
  | "paid"
  | "refunded"
  | "cancelled";

export type ConfirmationStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "no_response";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  whatsapp_instance?: string | null;
  whatsapp_status?: string | null;
  timezone: string;
  settings: Record<string, unknown>;
  trial_ends_at?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface Professional {
  id: string;
  organization_id: string;
  unit_id?: string | null;
  user_id?: string | null;
  name: string;
  bio?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  commission_pct?: number | null;
  is_active: boolean;
  working_hours?: Record<string, unknown>;
  blocked_times?: unknown[];
  created_at?: string;
}

export interface Service {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  duration_minutes: number;
  price: number;
  deposit_required: boolean;
  deposit_amount?: number | null;
  deposit_pct?: number | null;
  cancellation_policy_hours?: number | null;
  cancellation_penalty_pct?: number | null;
  color?: string | null;
  is_active: boolean;
}

export interface Client {
  id: string;
  organization_id: string;
  name: string;
  phone: string;
  email?: string | null;
  birthdate?: string | null;
  notes?: string | null;
  tags: string[];
  preferred_professional_id?: string | null;
  last_appointment_at?: string | null;
  total_appointments: number;
  total_spent: number;
  ltv: number;
  status: "active" | "inactive" | "blocked";
  source?: string | null;
  avatar_url?: string | null;
}

export interface Appointment {
  id: string;
  organization_id: string;
  professional_id: string;
  client_id: string;
  service_id: string;
  unit_id?: string | null;
  professional_name: string;
  professional_avatar?: string | null;
  client_name: string;
  service_name: string;
  service_color: string;
  start_at: string;
  end_at: string;
  price: number;
  status: AppointmentStatus;
  payment_status: PaymentStatus;
  confirmation_status: ConfirmationStatus;
  deposit_required: boolean;
  deposit_amount?: number | null;
  source: "whatsapp" | "panel" | "site" | "link" | "api";
}

export interface MetricDaily {
  id: string;
  organization_id: string;
  unit_id?: string | null;
  date: string;
  appointments_total: number;
  appointments_confirmed: number;
  appointments_cancelled: number;
  appointments_no_show: number;
  appointments_completed: number;
  revenue_total: number;
  revenue_deposits: number;
  revenue_lost_no_show: number;
  new_clients: number;
  returning_clients: number;
}

export interface AutomationRun {
  id: string;
  organization_id: string;
  workflow_name: string;
  trigger_type?: string | null;
  related_id?: string | null;
  status: "running" | "success" | "error" | "skipped";
  input?: Record<string, unknown> | null;
  output?: Record<string, unknown> | null;
  error?: string | null;
  duration_ms?: number | null;
  created_at: string;
}

export interface ConversationThread {
  id: string;
  organization_id: string;
  client_id?: string | null;
  phone: string;
  channel: string;
  status: "open" | "resolved" | "bot" | "human";
  current_agent?: string | null;
  context: Record<string, unknown>;
  last_message_at?: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  organization_id: string;
  direction: "inbound" | "outbound";
  content?: string | null;
  media_url?: string | null;
  media_type?: string | null;
  message_type: string;
  whatsapp_message_id?: string | null;
  agent?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface AgentActionPayload {
  type: "schedule" | "cancel" | "info" | "payment" | "handoff";
  service_hint?: string;
  date_hint?: string;
  professional_hint?: string;
  [key: string]: unknown;
}

export interface AgentContext {
  organization: Organization;
  client: Client | null;
  thread: ConversationThread;
  message: string;
  history: Message[];
  available_actions: string[];
}

export interface AgentResponse {
  message: string;
  action?: AgentActionPayload;
}

export interface AgentConfig {
  id: string;
  organization_id: string;
  agent_key: string;
  name: string;
  tone?: string | null;
  is_active: boolean;
  prompt_overrides?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}
