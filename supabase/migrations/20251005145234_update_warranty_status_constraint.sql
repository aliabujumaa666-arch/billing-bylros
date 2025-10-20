/*
  # Update Warranty Status Constraint

  1. Changes
    - Drop existing status check constraint
    - Create new constraint with additional status value
    - Allows: active, expired, voided, claimed, cancelled

  2. Rationale
    - Frontend displays 'cancelled' as a status option
    - Database constraint only allowed 'voided'
    - Adding 'cancelled' as an alias to support both naming conventions
*/

-- Drop the old constraint
ALTER TABLE warranties DROP CONSTRAINT IF EXISTS warranties_status_check;

-- Add new constraint with additional status value
ALTER TABLE warranties ADD CONSTRAINT warranties_status_check 
  CHECK (status IN ('active', 'expired', 'voided', 'claimed', 'cancelled'));
