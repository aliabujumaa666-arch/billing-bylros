/*
  # Keyboard Shortcuts Settings System

  ## Overview
  Adds database table and RLS policies to enable users to customize keyboard shortcuts.

  ## 1. New Table

  ### `keyboard_shortcuts`
  - `id` (uuid, primary key) - Unique shortcut identifier
  - `user_id` (uuid, foreign key) - Reference to auth.users (null for global defaults)
  - `shortcut_key` (text) - The keyboard key (e.g., 'd', 'c', 'q')
  - `ctrl_key` (boolean) - Whether Ctrl/Cmd key is required
  - `shift_key` (boolean) - Whether Shift key is required
  - `alt_key` (boolean) - Whether Alt key is required
  - `action` (text) - The action to perform (e.g., 'navigate:dashboard', 'navigate:customers')
  - `description` (text) - Human-readable description of the shortcut
  - `is_enabled` (boolean) - Whether the shortcut is active
  - `is_custom` (boolean) - Whether this is a user-customized shortcut (vs system default)
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security
  - Enable RLS on keyboard_shortcuts table
  - Users can view their own shortcuts and global defaults
  - Users can insert/update/delete only their own shortcuts
  - Admins can manage all shortcuts

  ## 3. Indexes
  - Index on user_id for fast user-specific lookups
  - Index on action for quick shortcut conflict detection

  ## 4. Default Shortcuts
  - Insert system default shortcuts for common actions
  - These will have user_id = NULL and is_custom = false

  ## 5. Important Notes
  - Each user can override system defaults by creating their own version
  - Shortcut keys are case-insensitive
  - System validates for conflicts (same key combination)
  - NULL user_id means it's a global default available to all users
*/

-- Create keyboard_shortcuts table
CREATE TABLE IF NOT EXISTS keyboard_shortcuts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  shortcut_key text NOT NULL,
  ctrl_key boolean DEFAULT false,
  shift_key boolean DEFAULT false,
  alt_key boolean DEFAULT false,
  action text NOT NULL,
  description text NOT NULL,
  is_enabled boolean DEFAULT true,
  is_custom boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, shortcut_key, ctrl_key, shift_key, alt_key)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_keyboard_shortcuts_user_id 
ON keyboard_shortcuts(user_id);

CREATE INDEX IF NOT EXISTS idx_keyboard_shortcuts_action 
ON keyboard_shortcuts(action);

CREATE INDEX IF NOT EXISTS idx_keyboard_shortcuts_enabled 
ON keyboard_shortcuts(is_enabled) WHERE is_enabled = true;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_keyboard_shortcuts_updated_at 
BEFORE UPDATE ON keyboard_shortcuts
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE keyboard_shortcuts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Users can view their own shortcuts and global defaults
CREATE POLICY "Users can view own shortcuts and defaults"
ON keyboard_shortcuts FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR user_id IS NULL
);

-- Policy: Users can insert their own shortcuts
CREATE POLICY "Users can insert own shortcuts"
ON keyboard_shortcuts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own shortcuts
CREATE POLICY "Users can update own shortcuts"
ON keyboard_shortcuts FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own shortcuts
CREATE POLICY "Users can delete own shortcuts"
ON keyboard_shortcuts FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Insert default system shortcuts (available to all users)
INSERT INTO keyboard_shortcuts (user_id, shortcut_key, ctrl_key, shift_key, alt_key, action, description, is_custom)
VALUES
  (NULL, 'd', true, false, false, 'navigate:dashboard', 'Go to Dashboard', false),
  (NULL, 'c', true, false, false, 'navigate:customers', 'Go to Customers', false),
  (NULL, 'q', true, false, false, 'navigate:quotes', 'Go to Quotes', false),
  (NULL, 'o', true, false, false, 'navigate:orders', 'Go to Orders', false),
  (NULL, 'i', true, false, false, 'navigate:invoices', 'Go to Invoices', false),
  (NULL, 's', true, false, false, 'navigate:visits', 'Go to Site Visits', false),
  (NULL, 'v', true, false, false, 'navigate:visits', 'Go to Site Visits', false),
  (NULL, 'p', true, false, false, 'navigate:production-workflow', 'Go to Production Workflow', false),
  (NULL, 'n', true, false, false, 'navigate:inventory', 'Go to Inventory', false),
  (NULL, 'k', true, false, false, 'navigate:calendar', 'Go to Calendar', false),
  (NULL, 't', true, false, false, 'navigate:installation-tasks', 'Go to Installation Tasks', false),
  (NULL, 'w', true, false, false, 'navigate:warranty-feedback', 'Go to Warranty & Feedback', false),
  (NULL, 'h', true, false, false, 'navigate:knowledge-base', 'Go to Knowledge Base', false),
  (NULL, 'f', true, false, false, 'navigate:faq-management', 'Go to FAQs', false),
  (NULL, 'm', true, false, false, 'navigate:messages', 'Go to Messages', false)
ON CONFLICT (user_id, shortcut_key, ctrl_key, shift_key, alt_key) DO NOTHING;