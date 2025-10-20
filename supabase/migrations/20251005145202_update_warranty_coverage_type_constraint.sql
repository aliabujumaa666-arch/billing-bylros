/*
  # Update Warranty Coverage Type Constraint

  1. Changes
    - Drop existing coverage_type check constraint
    - Create new constraint with user-friendly coverage type values
    - Allows: Standard, Extended, Premium, Limited, Full, Parts Only, Labor Only

  2. Rationale
    - Frontend form uses user-friendly names (Standard, Extended, Premium, Limited)
    - Database constraint was using technical names (full, limited, parts_only, labor_only)
    - This mismatch was causing warranty creation to fail
*/

-- Drop the old constraint
ALTER TABLE warranties DROP CONSTRAINT IF EXISTS warranties_coverage_type_check;

-- Add new constraint with user-friendly values
ALTER TABLE warranties ADD CONSTRAINT warranties_coverage_type_check 
  CHECK (coverage_type IN ('Standard', 'Extended', 'Premium', 'Limited', 'Full', 'Parts Only', 'Labor Only'));
