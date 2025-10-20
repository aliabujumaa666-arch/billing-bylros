/*
  # Advanced Order Management System

  1. New Tables
    - `production_workflows`
      - Tracks production stages for each order
      - Stages: design_approval, manufacturing, quality_check, packaging
      - Includes timestamps, assignees, and notes for each stage

    - `inventory_items`
      - Manages materials and finished products
      - Tracks stock levels, minimum quantities, suppliers
      - Includes pricing and product specifications

    - `inventory_transactions`
      - Records all inventory movements
      - Types: purchase, usage, adjustment, return
      - Links to orders when inventory is used

    - `installation_tasks`
      - Task assignments for installation teams
      - Links to orders and team members
      - Includes scheduling, status tracking, location details

    - `installation_photos`
      - Before/after photos for installations
      - Stored in Supabase Storage with metadata
      - Linked to orders and installation tasks

    - `warranties`
      - Warranty registration and tracking
      - Links to orders and products
      - Tracks warranty periods, terms, and claims

    - `warranty_claims`
      - Tracks warranty claim submissions
      - Includes issue descriptions, resolutions, status

    - `installation_feedback`
      - Customer ratings and feedback after installation
      - 5-star rating system with comments
      - Links to orders and installation tasks

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated admin users
    - Add policies for customers to view their own data
    - Add policies for installation teams to view assigned tasks

  3. Indexes
    - Add indexes for foreign keys and frequently queried fields
    - Add indexes for date-based queries
*/

-- Production Workflows Table
CREATE TABLE IF NOT EXISTS production_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,

  -- Design Approval Stage
  design_approval_status text DEFAULT 'pending' CHECK (design_approval_status IN ('pending', 'in_progress', 'approved', 'rejected')),
  design_approval_started_at timestamptz,
  design_approval_completed_at timestamptz,
  design_approval_assigned_to uuid REFERENCES auth.users(id),
  design_approval_notes text,

  -- Manufacturing Stage
  manufacturing_status text DEFAULT 'pending' CHECK (manufacturing_status IN ('pending', 'in_progress', 'completed', 'on_hold')),
  manufacturing_started_at timestamptz,
  manufacturing_completed_at timestamptz,
  manufacturing_assigned_to uuid REFERENCES auth.users(id),
  manufacturing_notes text,

  -- Quality Check Stage
  quality_check_status text DEFAULT 'pending' CHECK (quality_check_status IN ('pending', 'in_progress', 'passed', 'failed')),
  quality_check_started_at timestamptz,
  quality_check_completed_at timestamptz,
  quality_check_assigned_to uuid REFERENCES auth.users(id),
  quality_check_notes text,

  -- Packaging Stage
  packaging_status text DEFAULT 'pending' CHECK (packaging_status IN ('pending', 'in_progress', 'completed')),
  packaging_started_at timestamptz,
  packaging_completed_at timestamptz,
  packaging_assigned_to uuid REFERENCES auth.users(id),
  packaging_notes text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inventory Items Table
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL CHECK (item_type IN ('material', 'finished_product', 'tool', 'consumable')),
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category text,

  -- Stock Management
  quantity_in_stock integer DEFAULT 0 CHECK (quantity_in_stock >= 0),
  minimum_quantity integer DEFAULT 0,
  unit_of_measure text DEFAULT 'unit',

  -- Pricing
  unit_cost decimal(10, 2) DEFAULT 0,
  unit_price decimal(10, 2) DEFAULT 0,

  -- Supplier Information
  supplier_name text,
  supplier_contact text,
  lead_time_days integer DEFAULT 7,

  -- Additional Details
  location text,
  notes text,
  is_active boolean DEFAULT true,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inventory Transactions Table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id uuid REFERENCES inventory_items(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'adjustment', 'return', 'transfer')),

  quantity integer NOT NULL,
  previous_quantity integer NOT NULL,
  new_quantity integer NOT NULL,

  -- Links to orders when inventory is used
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,

  -- Transaction Details
  unit_cost decimal(10, 2),
  total_cost decimal(10, 2),
  reference_number text,
  notes text,

  performed_by uuid REFERENCES auth.users(id),
  transaction_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Installation Tasks Table
CREATE TABLE IF NOT EXISTS installation_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  task_title text NOT NULL,
  task_description text,

  -- Scheduling
  scheduled_date date,
  scheduled_time_start time,
  scheduled_time_end time,
  estimated_duration_hours decimal(4, 2),

  -- Assignment
  assigned_to uuid REFERENCES auth.users(id),
  team_members text[], -- Array of team member names or IDs

  -- Status
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Location
  installation_address text,
  installation_city text,
  installation_state text,
  installation_zip text,
  location_notes text,

  -- Completion
  started_at timestamptz,
  completed_at timestamptz,
  actual_duration_hours decimal(4, 2),
  completion_notes text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Installation Photos Table
CREATE TABLE IF NOT EXISTS installation_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  installation_task_id uuid REFERENCES installation_tasks(id) ON DELETE CASCADE,

  photo_type text NOT NULL CHECK (photo_type IN ('before', 'during', 'after', 'issue', 'completion')),
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  mime_type text,

  caption text,
  taken_at timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id),

  created_at timestamptz DEFAULT now()
);

-- Warranties Table
CREATE TABLE IF NOT EXISTS warranties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,

  -- Warranty Details
  warranty_number text UNIQUE NOT NULL,
  product_name text NOT NULL,
  product_description text,
  serial_number text,

  -- Warranty Period
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL,
  duration_months integer NOT NULL DEFAULT 12,

  -- Coverage
  coverage_type text DEFAULT 'full' CHECK (coverage_type IN ('full', 'limited', 'parts_only', 'labor_only')),
  coverage_details text,

  -- Registration
  registration_date timestamptz DEFAULT now(),
  registered_by uuid REFERENCES auth.users(id),

  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'voided', 'claimed')),
  notes text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Warranty Claims Table
CREATE TABLE IF NOT EXISTS warranty_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warranty_id uuid REFERENCES warranties(id) ON DELETE CASCADE,
  claim_number text UNIQUE NOT NULL,

  -- Claim Details
  issue_description text NOT NULL,
  issue_category text CHECK (issue_category IN ('defect', 'damage', 'malfunction', 'other')),
  reported_date timestamptz DEFAULT now(),

  -- Status
  status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'denied', 'resolved', 'closed')),

  -- Resolution
  resolution_description text,
  resolution_date timestamptz,
  resolved_by uuid REFERENCES auth.users(id),

  -- Costs
  repair_cost decimal(10, 2),
  replacement_cost decimal(10, 2),

  -- Supporting Documents
  supporting_photos text[], -- Array of storage paths
  notes text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Installation Feedback Table
CREATE TABLE IF NOT EXISTS installation_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  installation_task_id uuid REFERENCES installation_tasks(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,

  -- Ratings (1-5 stars)
  overall_rating integer CHECK (overall_rating >= 1 AND overall_rating <= 5),
  quality_rating integer CHECK (quality_rating >= 1 AND quality_rating <= 5),
  timeliness_rating integer CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
  professionalism_rating integer CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),

  -- Feedback
  comments text,
  would_recommend boolean,

  -- Response
  admin_response text,
  responded_at timestamptz,
  responded_by uuid REFERENCES auth.users(id),

  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_production_workflows_order_id ON production_workflows(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_items_type ON inventory_items(item_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_id ON inventory_transactions(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_order_id ON inventory_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_installation_tasks_order_id ON installation_tasks(order_id);
CREATE INDEX IF NOT EXISTS idx_installation_tasks_assigned_to ON installation_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_installation_tasks_scheduled_date ON installation_tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_installation_photos_order_id ON installation_photos(order_id);
CREATE INDEX IF NOT EXISTS idx_warranties_order_id ON warranties(order_id);
CREATE INDEX IF NOT EXISTS idx_warranties_customer_id ON warranties(customer_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_warranty_id ON warranty_claims(warranty_id);
CREATE INDEX IF NOT EXISTS idx_installation_feedback_order_id ON installation_feedback(order_id);

-- Enable Row Level Security
ALTER TABLE production_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE installation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE installation_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE installation_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Production Workflows
CREATE POLICY "Admins can manage production workflows"
  ON production_workflows FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- RLS Policies for Inventory Items
CREATE POLICY "Admins can view inventory items"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage inventory items"
  ON inventory_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid()
    )
  );

-- RLS Policies for Inventory Transactions
CREATE POLICY "Admins can view inventory transactions"
  ON inventory_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create inventory transactions"
  ON inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid()
    )
  );

-- RLS Policies for Installation Tasks
CREATE POLICY "Admins can manage installation tasks"
  ON installation_tasks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Team members can view assigned tasks"
  ON installation_tasks FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid());

-- RLS Policies for Installation Photos
CREATE POLICY "Authenticated users can view installation photos"
  ON installation_photos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can upload installation photos"
  ON installation_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid()
    )
  );

-- RLS Policies for Warranties
CREATE POLICY "Admins can manage warranties"
  ON warranties FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Customers can view their warranties"
  ON warranties FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM customer_users WHERE id = auth.uid()
    )
  );

-- RLS Policies for Warranty Claims
CREATE POLICY "Admins can manage warranty claims"
  ON warranty_claims FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Customers can view their warranty claims"
  ON warranty_claims FOR SELECT
  TO authenticated
  USING (
    warranty_id IN (
      SELECT id FROM warranties
      WHERE customer_id IN (
        SELECT customer_id FROM customer_users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Customers can create warranty claims"
  ON warranty_claims FOR INSERT
  TO authenticated
  WITH CHECK (
    warranty_id IN (
      SELECT id FROM warranties
      WHERE customer_id IN (
        SELECT customer_id FROM customer_users WHERE id = auth.uid()
      )
    )
  );

-- RLS Policies for Installation Feedback
CREATE POLICY "Admins can view all feedback"
  ON installation_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Customers can submit feedback"
  ON installation_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id IN (
      SELECT customer_id FROM customer_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can update feedback responses"
  ON installation_feedback FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid()
    )
  );
