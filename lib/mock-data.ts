import type {
  Appointment,
  AutomationRun,
  Client,
  MetricDaily,
  Organization,
  Professional,
  Service
} from "@/types/skinnia";

export const mockOrganization: Organization = {
  id: "org-demo",
  name: "SkinnIA Studio",
  slug: "skinnia-studio",
  plan: "pro",
  whatsapp_instance: "skinnia-demo",
  whatsapp_status: "connected",
  timezone: "America/Sao_Paulo",
  settings: {
    tone: "premium",
    city: "Belo Horizonte"
  },
  trial_ends_at: null,
  created_at: "2026-01-10T10:00:00.000Z",
  updated_at: "2026-04-15T08:00:00.000Z"
};

export const mockProfessionals: Professional[] = [
  {
    id: "prof-ana",
    organization_id: "org-demo",
    name: "Ana",
    is_active: true,
    avatar_url: "",
    phone: "5531999990001",
    working_hours: {},
    blocked_times: []
  },
  {
    id: "prof-carla",
    organization_id: "org-demo",
    name: "Carla",
    is_active: true,
    avatar_url: "",
    phone: "5531999990002",
    working_hours: {},
    blocked_times: []
  }
];

export const mockServices: Service[] = [
  {
    id: "service-lash",
    organization_id: "org-demo",
    name: "Lash Lifting",
    duration_minutes: 90,
    price: 180,
    deposit_required: true,
    deposit_amount: 50,
    deposit_pct: 27.78,
    cancellation_policy_hours: 24,
    cancellation_penalty_pct: 100,
    is_active: true,
    color: "#EC4899"
  },
  {
    id: "service-hidratacao",
    organization_id: "org-demo",
    name: "Hidratação Premium",
    duration_minutes: 60,
    price: 140,
    deposit_required: false,
    is_active: true,
    color: "#8B5CF6"
  }
];

export const mockMetrics: MetricDaily[] = [
  {
    id: "metric-1",
    organization_id: "org-demo",
    date: "2026-04-09",
    appointments_total: 14,
    appointments_confirmed: 11,
    appointments_cancelled: 1,
    appointments_no_show: 0,
    appointments_completed: 10,
    revenue_total: 2180,
    revenue_deposits: 250,
    revenue_lost_no_show: 0,
    new_clients: 2,
    returning_clients: 8
  },
  {
    id: "metric-2",
    organization_id: "org-demo",
    date: "2026-04-10",
    appointments_total: 16,
    appointments_confirmed: 12,
    appointments_cancelled: 2,
    appointments_no_show: 1,
    appointments_completed: 11,
    revenue_total: 2470,
    revenue_deposits: 320,
    revenue_lost_no_show: 120,
    new_clients: 3,
    returning_clients: 9
  },
  {
    id: "metric-3",
    organization_id: "org-demo",
    date: "2026-04-11",
    appointments_total: 11,
    appointments_confirmed: 9,
    appointments_cancelled: 1,
    appointments_no_show: 0,
    appointments_completed: 9,
    revenue_total: 1890,
    revenue_deposits: 180,
    revenue_lost_no_show: 0,
    new_clients: 1,
    returning_clients: 7
  },
  {
    id: "metric-4",
    organization_id: "org-demo",
    date: "2026-04-12",
    appointments_total: 10,
    appointments_confirmed: 8,
    appointments_cancelled: 0,
    appointments_no_show: 1,
    appointments_completed: 8,
    revenue_total: 1640,
    revenue_deposits: 90,
    revenue_lost_no_show: 95,
    new_clients: 1,
    returning_clients: 7
  },
  {
    id: "metric-5",
    organization_id: "org-demo",
    date: "2026-04-13",
    appointments_total: 18,
    appointments_confirmed: 15,
    appointments_cancelled: 1,
    appointments_no_show: 1,
    appointments_completed: 13,
    revenue_total: 2960,
    revenue_deposits: 400,
    revenue_lost_no_show: 135,
    new_clients: 4,
    returning_clients: 10
  },
  {
    id: "metric-6",
    organization_id: "org-demo",
    date: "2026-04-14",
    appointments_total: 15,
    appointments_confirmed: 13,
    appointments_cancelled: 1,
    appointments_no_show: 0,
    appointments_completed: 12,
    revenue_total: 2540,
    revenue_deposits: 270,
    revenue_lost_no_show: 0,
    new_clients: 2,
    returning_clients: 10
  },
  {
    id: "metric-7",
    organization_id: "org-demo",
    date: "2026-04-15",
    appointments_total: 13,
    appointments_confirmed: 10,
    appointments_cancelled: 1,
    appointments_no_show: 1,
    appointments_completed: 7,
    revenue_total: 2210,
    revenue_deposits: 240,
    revenue_lost_no_show: 180,
    new_clients: 2,
    returning_clients: 8
  }
];

export const mockAppointments: Appointment[] = [
  {
    id: "appt-1",
    organization_id: "org-demo",
    professional_id: "prof-ana",
    client_id: "client-1",
    service_id: "service-lash",
    professional_name: "Ana",
    professional_avatar: "",
    client_name: "Marina Souza",
    service_name: "Lash Lifting",
    service_color: "#EC4899",
    start_at: "2026-04-15T12:00:00.000Z",
    end_at: "2026-04-15T13:30:00.000Z",
    price: 180,
    status: "confirmed",
    payment_status: "paid",
    confirmation_status: "confirmed",
    deposit_required: true,
    deposit_amount: 50,
    source: "whatsapp"
  },
  {
    id: "appt-2",
    organization_id: "org-demo",
    professional_id: "prof-carla",
    client_id: "client-2",
    service_id: "service-hidratacao",
    professional_name: "Carla",
    professional_avatar: "",
    client_name: "Bianca Araujo",
    service_name: "Hidratação Premium",
    service_color: "#8B5CF6",
    start_at: "2026-04-15T14:00:00.000Z",
    end_at: "2026-04-15T15:00:00.000Z",
    price: 140,
    status: "pending_payment",
    payment_status: "pending",
    confirmation_status: "pending",
    deposit_required: false,
    source: "panel"
  },
  {
    id: "appt-3",
    organization_id: "org-demo",
    professional_id: "prof-ana",
    client_id: "client-3",
    service_id: "service-hidratacao",
    professional_name: "Ana",
    professional_avatar: "",
    client_name: "Camila Reis",
    service_name: "Hidratação Premium",
    service_color: "#14B8A6",
    start_at: "2026-04-15T16:30:00.000Z",
    end_at: "2026-04-15T17:30:00.000Z",
    price: 140,
    status: "draft",
    payment_status: "pending",
    confirmation_status: "pending",
    deposit_required: false,
    source: "whatsapp"
  },
  {
    id: "appt-4",
    organization_id: "org-demo",
    professional_id: "prof-carla",
    client_id: "client-4",
    service_id: "service-lash",
    professional_name: "Carla",
    professional_avatar: "",
    client_name: "Patricia Lima",
    service_name: "Lash Lifting",
    service_color: "#EC4899",
    start_at: "2026-04-16T15:00:00.000Z",
    end_at: "2026-04-16T16:30:00.000Z",
    price: 180,
    status: "confirmed",
    payment_status: "paid",
    confirmation_status: "pending",
    deposit_required: true,
    deposit_amount: 50,
    source: "whatsapp"
  },
  {
    id: "appt-5",
    organization_id: "org-demo",
    professional_id: "prof-ana",
    client_id: "client-2",
    service_id: "service-hidratacao",
    professional_name: "Ana",
    professional_avatar: "",
    client_name: "Bianca Araujo",
    service_name: "Hidratação Premium",
    service_color: "#8B5CF6",
    start_at: "2026-04-17T13:00:00.000Z",
    end_at: "2026-04-17T14:00:00.000Z",
    price: 140,
    status: "confirmed",
    payment_status: "paid",
    confirmation_status: "confirmed",
    deposit_required: false,
    source: "panel"
  },
  {
    id: "appt-6",
    organization_id: "org-demo",
    professional_id: "prof-carla",
    client_id: "client-1",
    service_id: "service-hidratacao",
    professional_name: "Carla",
    professional_avatar: "",
    client_name: "Marina Souza",
    service_name: "Hidratação Premium",
    service_color: "#14B8A6",
    start_at: "2026-04-18T11:30:00.000Z",
    end_at: "2026-04-18T12:30:00.000Z",
    price: 140,
    status: "completed",
    payment_status: "paid",
    confirmation_status: "confirmed",
    deposit_required: false,
    source: "api"
  }
];

export const mockClients: Client[] = [
  {
    id: "client-1",
    organization_id: "org-demo",
    name: "Marina Souza",
    phone: "+55 31 98888-1111",
    tags: ["vip", "lash"],
    preferred_professional_id: "prof-ana",
    total_appointments: 8,
    total_spent: 1240,
    ltv: 1240,
    last_appointment_at: "2026-03-15T16:00:00.000Z",
    status: "active"
  },
  {
    id: "client-2",
    organization_id: "org-demo",
    name: "Bianca Araujo",
    phone: "+55 31 97777-2222",
    tags: ["cabelo"],
    preferred_professional_id: "prof-carla",
    total_appointments: 3,
    total_spent: 420,
    ltv: 420,
    last_appointment_at: "2026-04-01T18:00:00.000Z",
    status: "active"
  },
  {
    id: "client-3",
    organization_id: "org-demo",
    name: "Camila Reis",
    phone: "+55 31 96666-3333",
    tags: ["reativacao"],
    preferred_professional_id: "prof-ana",
    total_appointments: 5,
    total_spent: 760,
    ltv: 760,
    last_appointment_at: "2026-03-12T14:00:00.000Z",
    status: "active"
  },
  {
    id: "client-4",
    organization_id: "org-demo",
    name: "Patricia Lima",
    phone: "+55 31 95555-4444",
    tags: ["nail", "pix"],
    preferred_professional_id: "prof-carla",
    total_appointments: 11,
    total_spent: 1530,
    ltv: 1530,
    last_appointment_at: "2026-02-28T17:00:00.000Z",
    status: "inactive"
  }
];

export const mockAutomationRuns: AutomationRun[] = [
  {
    id: "auto-1",
    organization_id: "org-demo",
    workflow_name: "SkinnIA — Roteador Central",
    trigger_type: "webhook",
    status: "success",
    duration_ms: 420,
    created_at: "2026-04-15T11:45:00.000Z"
  },
  {
    id: "auto-2",
    organization_id: "org-demo",
    workflow_name: "SkinnIA — Cobrança de Sinal",
    trigger_type: "internal",
    status: "running",
    duration_ms: 3200,
    created_at: "2026-04-15T11:55:00.000Z"
  },
  {
    id: "auto-3",
    organization_id: "org-demo",
    workflow_name: "SkinnIA — Lembretes",
    trigger_type: "schedule",
    status: "error",
    error: "Webhook Evolution API indisponível",
    duration_ms: 890,
    created_at: "2026-04-15T10:10:00.000Z"
  }
];
