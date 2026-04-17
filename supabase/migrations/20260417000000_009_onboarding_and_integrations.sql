-- Migration 009: Onboarding Progress, Integrations, and Client Import Jobs
-- Created: 2026-04-17
-- Description: Creates tables for user onboarding flow, integration management, and CSV import tracking

-- ============================================
-- TABLE: onboarding_progress
-- Tracks user progress through onboarding steps
-- ============================================
CREATE TABLE IF NOT EXISTS onboarding_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    step text NOT NULL,
    status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    payload jsonb DEFAULT '{}',
    completed_at timestamptz,
    updated_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, step)
);

COMMENT ON TABLE onboarding_progress IS 'Tracks user progress through onboarding steps';
COMMENT ON COLUMN onboarding_progress.step IS 'Onboarding step identifier: business_data, working_hours, team, services, whatsapp, agent, review';
COMMENT ON COLUMN onboarding_progress.payload IS 'Flexible JSON storage for step-specific data';

-- Index for fast lookup by tenant
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_tenant ON onboarding_progress(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_status ON onboarding_progress(status);

-- ============================================
-- TABLE: integrations
-- Manages external service integrations per tenant
-- ============================================
CREATE TABLE IF NOT EXISTS integrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('whatsapp', 'n8n', 'mercadopago', 'stripe', 'email', 'sms')),
    provider text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('connected', 'pending', 'error', 'disconnected')),
    config jsonb DEFAULT '{}',
    last_sync_at timestamptz,
    last_error text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, type, provider)
);

COMMENT ON TABLE integrations IS 'External service integrations per organization';
COMMENT ON COLUMN integrations.type IS 'Integration category: whatsapp, n8n, mercadopago, stripe, email, sms';
COMMENT ON COLUMN integrations.provider IS 'Specific provider: evolution, n8n, mercadopago, stripe, sendgrid, twilio, etc';
COMMENT ON COLUMN integrations.config IS 'Provider-specific configuration (tokens, webhooks, etc)';
COMMENT ON COLUMN integrations.metadata IS 'Additional metadata like webhook URLs, credentials reference';

-- Indexes for integrations
CREATE INDEX IF NOT EXISTS idx_integrations_tenant ON integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(type);

-- ============================================
-- TABLE: client_import_jobs
-- Tracks CSV import jobs for bulk client creation
-- ============================================
CREATE TABLE IF NOT EXISTS client_import_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    file_name text NOT NULL,
    file_size bigint,
    file_hash text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    total_rows int NOT NULL DEFAULT 0,
    imported_rows int NOT NULL DEFAULT 0,
    failed_rows int NOT NULL DEFAULT 0,
    skipped_rows int NOT NULL DEFAULT 0,
    column_mapping jsonb DEFAULT '{}',
    report jsonb DEFAULT '{}',
    error_details text,
    created_by uuid REFERENCES auth.users(id),
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE client_import_jobs IS 'Tracks CSV import jobs for bulk client creation';
COMMENT ON COLUMN client_import_jobs.column_mapping IS 'Maps CSV columns to database fields';
COMMENT ON COLUMN client_import_jobs.report IS 'Detailed import results per row';

-- Indexes for import jobs
CREATE INDEX IF NOT EXISTS idx_client_import_jobs_tenant ON client_import_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_client_import_jobs_status ON client_import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_client_import_jobs_created_at ON client_import_jobs(created_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_import_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: onboarding_progress
CREATE POLICY "Users can view their org onboarding progress"
    ON onboarding_progress FOR SELECT
    USING (private.has_org_access(tenant_id));

CREATE POLICY "Users can manage their org onboarding progress"
    ON onboarding_progress FOR ALL
    USING (private.has_org_role(tenant_id, ARRAY['owner', 'admin', 'manager']));

-- Policy: integrations
CREATE POLICY "Users can view their org integrations"
    ON integrations FOR SELECT
    USING (private.has_org_access(tenant_id));

CREATE POLICY "Users can manage their org integrations"
    ON integrations FOR ALL
    USING (private.has_org_role(tenant_id, ARRAY['owner', 'admin', 'manager']));

-- Policy: client_import_jobs
CREATE POLICY "Users can view their org import jobs"
    ON client_import_jobs FOR SELECT
    USING (private.has_org_access(tenant_id));

CREATE POLICY "Users can create import jobs"
    ON client_import_jobs FOR INSERT
    WITH CHECK (private.has_org_role(tenant_id, ARRAY['owner', 'admin', 'manager', 'staff']));

CREATE POLICY "Users can update their import jobs"
    ON client_import_jobs FOR UPDATE
    USING (private.has_org_role(tenant_id, ARRAY['owner', 'admin', 'manager', 'staff']));

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE TRIGGER set_updated_at_onboarding_progress
    BEFORE UPDATE ON onboarding_progress
    FOR EACH ROW
    EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER set_updated_at_integrations
    BEFORE UPDATE ON integrations
    FOR EACH ROW
    EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER set_updated_at_client_import_jobs
    BEFORE UPDATE ON client_import_jobs
    FOR EACH ROW
    EXECUTE FUNCTION private.set_updated_at();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function: Get onboarding completion status for an organization
CREATE OR REPLACE FUNCTION private.get_onboarding_status(org_id uuid)
RETURNS jsonb AS $$
DECLARE
    total_steps int := 7;
    completed_steps int;
    current_step text;
    result jsonb;
BEGIN
    SELECT COUNT(*) INTO completed_steps
    FROM onboarding_progress
    WHERE tenant_id = org_id AND status = 'completed';

    SELECT step INTO current_step
    FROM onboarding_progress
    WHERE tenant_id = org_id AND status = 'in_progress'
    ORDER BY updated_at DESC
    LIMIT 1;

    result := jsonb_build_object(
        'total_steps', total_steps,
        'completed_steps', completed_steps,
        'current_step', current_step,
        'is_complete', completed_steps >= total_steps,
        'progress_percent', (completed_steps::float / total_steps * 100)::int
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if integration is active
CREATE OR REPLACE FUNCTION private.is_integration_active(org_id uuid, integration_type text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM integrations
        WHERE tenant_id = org_id
        AND type = integration_type
        AND status = 'connected'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION private.get_onboarding_status IS 'Returns onboarding completion status for an organization';
COMMENT ON FUNCTION private.is_integration_active IS 'Checks if a specific integration is active for an organization';
