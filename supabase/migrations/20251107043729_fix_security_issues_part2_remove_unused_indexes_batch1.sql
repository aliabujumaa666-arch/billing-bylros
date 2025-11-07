/*
  # Security Fix Part 2: Remove Unused Indexes - Batch 1

  1. Remove Unused Indexes
    - Removes indexes that have not been used to improve write performance
    - Reduces storage overhead
    - Part 1 of 3: Brand, changelog, installation, inventory, production, support indexes
  
  2. Notes
    - Indexes can be recreated if needed in the future
    - This improves INSERT/UPDATE/DELETE performance
*/

-- Brand and changelog indexes
DROP INDEX IF EXISTS idx_brand_settings_updated_by;
DROP INDEX IF EXISTS idx_changelog_entries_created_by;

-- Installation related indexes
DROP INDEX IF EXISTS idx_installation_feedback_installation_task_id;
DROP INDEX IF EXISTS idx_installation_feedback_responded_by;
DROP INDEX IF EXISTS idx_installation_photos_installation_task_id;
DROP INDEX IF EXISTS idx_installation_photos_uploaded_by;

-- Inventory indexes
DROP INDEX IF EXISTS idx_inventory_transactions_performed_by;

-- Production workflow indexes
DROP INDEX IF EXISTS idx_production_workflows_design_approval_assigned_to;
DROP INDEX IF EXISTS idx_production_workflows_manufacturing_assigned_to;
DROP INDEX IF EXISTS idx_production_workflows_packaging_assigned_to;
DROP INDEX IF EXISTS idx_production_workflows_quality_check_assigned_to;

-- Support ticket indexes
DROP INDEX IF EXISTS idx_support_ticket_replies_user_id;
DROP INDEX IF EXISTS idx_support_tickets_assigned_to;

-- Feedback and warranty indexes
DROP INDEX IF EXISTS idx_user_feedback_user_id;
DROP INDEX IF EXISTS idx_warranties_registered_by;
DROP INDEX IF EXISTS idx_warranty_claims_resolved_by;
