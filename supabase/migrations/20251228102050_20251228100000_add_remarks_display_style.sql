/*
  # Add Remarks Display Style Setting

  1. Changes
    - Adds `remarksStyle` field to the `remarks` object in pdf_templates
    - Updates all existing records to use 'bordered' as default style
    - Provides three style options: 'simple', 'bordered', 'box'

  2. Migration Details
    - Updates pdf_templates table to include remarksStyle in remarks object
    - Sets default value to 'bordered' for consistency
*/

-- Update pdf_templates to include remarksStyle in settings
UPDATE pdf_templates
SET settings = jsonb_set(
  settings,
  '{remarks,remarksStyle}',
  '"bordered"'::jsonb,
  true
)
WHERE settings->'remarks' IS NOT NULL;
