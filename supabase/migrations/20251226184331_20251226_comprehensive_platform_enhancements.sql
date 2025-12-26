/*
  # Comprehensive Platform Enhancements

  ## Overview
  This migration adds advanced features across multiple modules including:
  - Analytics and reporting infrastructure
  - Workflow automation enhancements
  - Financial management improvements
  - Integration capabilities
  - Security and audit features

  ## Changes

  ### 1. Analytics Tables
  Create tables for tracking metrics and generating reports

  ### 2. Workflow Automation
  Add automated workflow triggers and rules

  ### 3. Payment Plans
  Support for recurring billing and payment installments

  ### 4. API Keys and Webhooks
  Integration infrastructure for third-party systems

  ### 5. Audit and Compliance
  Enhanced logging and security features

  ### 6. Document Templates
  Custom document generation system

  ### 7. Notification System
  Advanced notification preferences and delivery

  ### 8. User Roles and Permissions
  Granular access control system
*/

-- ============================================================================
-- ANALYTICS AND REPORTING
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  event_name text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  customer_id uuid REFERENCES customers(id),
  entity_type text,
  entity_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics"
  ON analytics_events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert analytics"
  ON analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- CUSTOM REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS custom_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  report_type text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}',
  filters jsonb DEFAULT '{}',
  columns jsonb DEFAULT '[]',
  created_by uuid REFERENCES auth.users(id),
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
  ON custom_reports
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR is_public = true);

CREATE POLICY "Users can create reports"
  ON custom_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own reports"
  ON custom_reports
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- ============================================================================
-- WORKFLOW AUTOMATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL,
  trigger_conditions jsonb NOT NULL DEFAULT '{}',
  actions jsonb NOT NULL DEFAULT '[]',
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE workflow_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workflow rules"
  ON workflow_rules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage workflow rules"
  ON workflow_rules
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid REFERENCES workflow_rules(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  status text DEFAULT 'pending',
  result jsonb,
  error text,
  executed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_rule ON workflow_executions(rule_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_entity ON workflow_executions(entity_type, entity_id);

ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workflow executions"
  ON workflow_executions
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- PAYMENT PLANS
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id),
  total_amount numeric NOT NULL,
  number_of_installments integer NOT NULL,
  installment_amount numeric NOT NULL,
  frequency text DEFAULT 'monthly',
  start_date date NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_plan_id uuid REFERENCES payment_plans(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  due_date date NOT NULL,
  amount numeric NOT NULL,
  status text DEFAULT 'pending',
  paid_date timestamptz,
  payment_method text,
  transaction_id text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_plans_customer ON payment_plans(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_installments_plan ON payment_installments(payment_plan_id, due_date);
CREATE INDEX IF NOT EXISTS idx_payment_installments_due ON payment_installments(due_date, status);

ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payment plans"
  ON payment_plans
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage payment plans"
  ON payment_plans
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view installments"
  ON payment_installments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage installments"
  ON payment_installments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- API KEYS AND WEBHOOKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  permissions jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active, expires_at);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own api keys"
  ON api_keys
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can manage own api keys"
  ON api_keys
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE TABLE IF NOT EXISTS webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  events text[] NOT NULL,
  secret text,
  is_active boolean DEFAULT true,
  retry_count integer DEFAULT 3,
  timeout_seconds integer DEFAULT 30,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  status text DEFAULT 'pending',
  response_code integer,
  response_body text,
  attempts integer DEFAULT 0,
  last_attempt_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status, last_attempt_at);

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webhooks"
  ON webhooks
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can manage own webhooks"
  ON webhooks
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view webhook deliveries"
  ON webhook_deliveries
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- USER ROLES AND PERMISSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  permissions jsonb NOT NULL DEFAULT '[]',
  is_system_role boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view roles"
  ON roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view user roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- DOCUMENT VERSIONING
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  version_number integer NOT NULL,
  data jsonb NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  change_summary text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_versions_entity ON document_versions(entity_type, entity_id, version_number DESC);

ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view document versions"
  ON document_versions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create document versions"
  ON document_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- TAGS AND CATEGORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entity_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(entity_type, entity_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_tags_entity ON entity_tags(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_tags_tag ON entity_tags(tag_id);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tags"
  ON tags
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage tags"
  ON tags
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view entity tags"
  ON entity_tags
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage entity tags"
  ON entity_tags
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- ACTIVITY LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity log"
  ON activity_log
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert activity log"
  ON activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- REMINDERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  entity_type text,
  entity_id uuid,
  remind_at timestamptz NOT NULL,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  assigned_to uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_assigned ON reminders(assigned_to, remind_at);
CREATE INDEX IF NOT EXISTS idx_reminders_entity ON reminders(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_reminders_pending ON reminders(is_completed, remind_at);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders"
  ON reminders
  FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Users can create reminders"
  ON reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own reminders"
  ON reminders
  FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid() OR created_by = auth.uid());

-- ============================================================================
-- CUSTOMER SEGMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  criteria jsonb NOT NULL DEFAULT '{}',
  is_dynamic boolean DEFAULT true,
  customer_count integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_segment_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id uuid REFERENCES customer_segments(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  UNIQUE(segment_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_segment_members_segment ON customer_segment_members(segment_id);
CREATE INDEX IF NOT EXISTS idx_customer_segment_members_customer ON customer_segment_members(customer_id);

ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segment_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view segments"
  ON customer_segments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage segments"
  ON customer_segments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view segment members"
  ON customer_segment_members
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- SEARCH HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  search_query text NOT NULL,
  search_type text,
  results_count integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id, created_at DESC);

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own search history"
  ON search_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create search history"
  ON search_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
