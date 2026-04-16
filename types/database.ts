export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan: "trial" | "starter" | "pro" | "enterprise";
          whatsapp_instance: string | null;
          whatsapp_status: string | null;
          timezone: string | null;
          settings: Record<string, unknown> | null;
          trial_ends_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
      };
      professionals: {
        Row: {
          id: string;
          organization_id: string;
          unit_id: string | null;
          user_id: string | null;
          name: string;
          bio: string | null;
          avatar_url: string | null;
          phone: string | null;
          commission_pct: number | null;
          is_active: boolean | null;
          working_hours: Record<string, unknown> | null;
          blocked_times: unknown[] | null;
          created_at: string | null;
        };
      };
      services: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          category: string | null;
          duration_minutes: number;
          price: number;
          deposit_required: boolean | null;
          deposit_amount: number | null;
          deposit_pct: number | null;
          cancellation_policy_hours: number | null;
          cancellation_penalty_pct: number | null;
          is_active: boolean | null;
          color: string | null;
          created_at: string | null;
        };
      };
      clients: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          phone: string;
          email: string | null;
          birthdate: string | null;
          notes: string | null;
          tags: string[] | null;
          preferred_professional_id: string | null;
          last_appointment_at: string | null;
          total_appointments: number | null;
          total_spent: number | null;
          ltv: number | null;
          status: "active" | "inactive" | "blocked" | null;
          source: string | null;
          created_at: string | null;
        };
      };
      appointments: {
        Row: {
          id: string;
          organization_id: string;
          unit_id: string | null;
          professional_id: string;
          client_id: string;
          service_id: string;
          start_at: string;
          end_at: string;
          status:
            | "draft"
            | "pending_payment"
            | "confirmed"
            | "cancelled"
            | "completed"
            | "no_show"
            | "refunded";
          price: number;
          deposit_required: boolean | null;
          deposit_amount: number | null;
          payment_status:
            | "pending"
            | "partial"
            | "paid"
            | "refunded"
            | "cancelled"
            | null;
          confirmation_status:
            | "pending"
            | "confirmed"
            | "declined"
            | "no_response"
            | null;
          source: "whatsapp" | "panel" | "site" | "link" | "api" | null;
          reminder_sent_at: string | null;
          confirmed_at: string | null;
          notes: string | null;
          internal_notes: string | null;
          cancelled_at: string | null;
          cancellation_reason: string | null;
          completed_at: string | null;
          no_show_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
      };
      metrics_daily: {
        Row: {
          id: string;
          organization_id: string;
          unit_id: string | null;
          date: string;
          appointments_total: number | null;
          appointments_confirmed: number | null;
          appointments_cancelled: number | null;
          appointments_no_show: number | null;
          appointments_completed: number | null;
          revenue_total: number | null;
          revenue_deposits: number | null;
          revenue_lost_no_show: number | null;
          new_clients: number | null;
          returning_clients: number | null;
        };
      };
      automation_runs: {
        Row: {
          id: string;
          organization_id: string;
          workflow_name: string;
          trigger_type: string | null;
          related_id: string | null;
          status: "running" | "success" | "error" | "skipped" | null;
          input: Record<string, unknown> | null;
          output: Record<string, unknown> | null;
          error: string | null;
          duration_ms: number | null;
          created_at: string | null;
        };
      };
    };
  };
}
