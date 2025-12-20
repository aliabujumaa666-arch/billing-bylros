/*
  # PDF Templates System

  ## Overview
  Adds a comprehensive template management system for PDF customization settings.
  Users can save, load, and share PDF configuration templates across different document types.

  ## 1. New Tables

  ### `pdf_templates`
  Stores reusable PDF configuration templates
  - `id` (uuid, primary key): Unique identifier
  - `name` (text): Template name
  - `description` (text): Template description
  - `document_type` (text): Document type (quotes, invoices, orders, warranties, siteVisits, global)
  - `is_default` (boolean): Whether this is the default template for this document type
  - `is_global` (boolean): Whether this template can be used across all document types
  - `settings` (jsonb): Complete PDF settings configuration
  - `preview_image` (text): Optional base64 preview image
  - `tags` (text[]): Searchable tags for organization
  - `created_by` (uuid): User who created the template
  - `created_at` (timestamptz): Creation timestamp
  - `updated_at` (timestamptz): Last update timestamp
  - `usage_count` (integer): Number of times template has been applied

  ## 2. Security
  - Enable RLS on `pdf_templates` table
  - Users can read all templates
  - Users can create templates
  - Users can update/delete only their own templates
  - System default templates are read-only

  ## 3. Features
  - Save current PDF settings as a named template
  - Load templates to apply to any document type
  - Copy settings between document types
  - Export/import templates as JSON
  - Track template usage analytics
  - Default system templates for common use cases
*/

-- Create pdf_templates table
CREATE TABLE IF NOT EXISTS pdf_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  document_type text NOT NULL CHECK (document_type IN ('quotes', 'invoices', 'orders', 'warranties', 'siteVisits', 'global')),
  is_default boolean DEFAULT false,
  is_global boolean DEFAULT false,
  is_system boolean DEFAULT false,
  settings jsonb NOT NULL,
  preview_image text,
  tags text[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  usage_count integer DEFAULT 0,
  UNIQUE(name, created_by)
);

-- Enable RLS
ALTER TABLE pdf_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all templates"
  ON pdf_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create templates"
  ON pdf_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by AND is_system = false);

CREATE POLICY "Users can update own templates"
  ON pdf_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by AND is_system = false)
  WITH CHECK (auth.uid() = created_by AND is_system = false);

CREATE POLICY "Users can delete own templates"
  ON pdf_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by AND is_system = false);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pdf_templates_document_type ON pdf_templates(document_type);
CREATE INDEX IF NOT EXISTS idx_pdf_templates_created_by ON pdf_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_pdf_templates_is_default ON pdf_templates(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_pdf_templates_tags ON pdf_templates USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_pdf_templates_usage_count ON pdf_templates(usage_count DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pdf_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS pdf_templates_updated_at ON pdf_templates;
CREATE TRIGGER pdf_templates_updated_at
  BEFORE UPDATE ON pdf_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_pdf_template_updated_at();

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_template_usage(template_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE pdf_templates
  SET usage_count = usage_count + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert system default templates
INSERT INTO pdf_templates (name, description, document_type, is_default, is_global, is_system, settings, tags, created_by)
VALUES
  (
    'Professional Red',
    'Classic professional design with red accents, perfect for corporate documents',
    'global',
    true,
    true,
    true,
    '{
      "fonts": {"headerFont": "helvetica", "bodyFont": "helvetica", "headerFontSize": 22, "bodyFontSize": 9, "tableFontSize": 8, "footerFontSize": 8},
      "colors": {"tableHeaderBg": "#bb2738", "tableHeaderText": "#ffffff", "tableRowAlternate": "#f8fafc", "tableBorder": "#e2e8f0", "accentColor": "#bb2738", "textPrimary": "#1e293b", "textSecondary": "#475569"},
      "layout": {"marginTop": 10, "marginRight": 10, "marginBottom": 10, "marginLeft": 10, "headerHeight": 42, "footerHeight": 27, "contentSpacing": 8},
      "logo": {"showLogo": true, "logoPosition": "left", "logoWidth": 20, "logoHeight": 20},
      "header": {"showHeader": true, "headerStyle": "letterhead", "showCompanyInfo": true, "headerTextColor": "#000000", "showTagline": false},
      "footer": {"showFooter": true, "footerText": "Thank you for your business!", "showPageNumbers": true, "showGenerationDate": true, "footerStyle": "gradient"},
      "watermark": {"enableWatermark": false, "watermarkText": "DRAFT", "watermarkOpacity": 0.1, "watermarkAngle": 45, "watermarkFontSize": 80},
      "terms": {"termsTitle": "TERMS & CONDITIONS", "termsContent": [], "termsStyle": "bordered", "showTerms": true},
      "sections": {"showQuoteDetails": true, "showCustomerInfo": true, "showItemsTable": true, "showTotals": true, "showRemarks": true, "showTerms": true},
      "table": {"showItemNumbers": true, "showLocation": true, "showType": true, "showDimensions": true, "showQuantity": true, "showArea": true, "showChargeableArea": true, "showUnitPrice": true, "showTotal": true, "tableStyle": "striped", "headerAlignment": "center", "numberAlignment": "center", "textAlignment": "left", "amountAlignment": "right"}
    }'::jsonb,
    ARRAY['professional', 'red', 'corporate', 'default'],
    NULL
  ),
  (
    'Ocean Blue',
    'Fresh and modern blue theme, ideal for tech and innovation-focused businesses',
    'global',
    false,
    true,
    true,
    '{
      "fonts": {"headerFont": "helvetica", "bodyFont": "helvetica", "headerFontSize": 22, "bodyFontSize": 9, "tableFontSize": 8, "footerFontSize": 8},
      "colors": {"tableHeaderBg": "#0369a1", "tableHeaderText": "#ffffff", "tableRowAlternate": "#f0f9ff", "tableBorder": "#bae6fd", "accentColor": "#0369a1", "textPrimary": "#0f172a", "textSecondary": "#475569"},
      "layout": {"marginTop": 10, "marginRight": 10, "marginBottom": 10, "marginLeft": 10, "headerHeight": 55, "footerHeight": 27, "contentSpacing": 8},
      "logo": {"showLogo": true, "logoPosition": "left", "logoWidth": 40, "logoHeight": 40},
      "header": {"showHeader": true, "headerStyle": "gradient", "showCompanyInfo": true, "headerTextColor": "#ffffff", "showTagline": true},
      "footer": {"showFooter": true, "footerText": "Thank you for your business!", "showPageNumbers": true, "showGenerationDate": true, "footerStyle": "gradient"},
      "watermark": {"enableWatermark": false, "watermarkText": "DRAFT", "watermarkOpacity": 0.1, "watermarkAngle": 45, "watermarkFontSize": 80},
      "terms": {"termsTitle": "TERMS & CONDITIONS", "termsContent": [], "termsStyle": "bordered", "showTerms": true},
      "sections": {"showQuoteDetails": true, "showCustomerInfo": true, "showItemsTable": true, "showTotals": true, "showRemarks": true, "showTerms": true},
      "table": {"showItemNumbers": true, "showLocation": true, "showType": true, "showDimensions": true, "showQuantity": true, "showArea": true, "showChargeableArea": true, "showUnitPrice": true, "showTotal": true, "tableStyle": "striped", "headerAlignment": "center", "numberAlignment": "center", "textAlignment": "left", "amountAlignment": "right"}
    }'::jsonb,
    ARRAY['modern', 'blue', 'tech', 'fresh'],
    NULL
  ),
  (
    'Minimalist',
    'Clean and simple design with minimal colors, perfect for understated elegance',
    'global',
    false,
    true,
    true,
    '{
      "fonts": {"headerFont": "helvetica", "bodyFont": "helvetica", "headerFontSize": 20, "bodyFontSize": 9, "tableFontSize": 8, "footerFontSize": 8},
      "colors": {"tableHeaderBg": "#334155", "tableHeaderText": "#ffffff", "tableRowAlternate": "#f8fafc", "tableBorder": "#e2e8f0", "accentColor": "#334155", "textPrimary": "#0f172a", "textSecondary": "#64748b"},
      "layout": {"marginTop": 15, "marginRight": 15, "marginBottom": 15, "marginLeft": 15, "headerHeight": 50, "footerHeight": 25, "contentSpacing": 10},
      "logo": {"showLogo": true, "logoPosition": "center", "logoWidth": 35, "logoHeight": 35},
      "header": {"showHeader": true, "headerStyle": "simple", "showCompanyInfo": true, "headerTextColor": "#0f172a", "showTagline": false},
      "footer": {"showFooter": true, "footerText": "", "showPageNumbers": true, "showGenerationDate": true, "footerStyle": "simple"},
      "watermark": {"enableWatermark": false, "watermarkText": "DRAFT", "watermarkOpacity": 0.05, "watermarkAngle": 45, "watermarkFontSize": 80},
      "terms": {"termsTitle": "TERMS & CONDITIONS", "termsContent": [], "termsStyle": "simple", "showTerms": true},
      "sections": {"showQuoteDetails": true, "showCustomerInfo": true, "showItemsTable": true, "showTotals": true, "showRemarks": false, "showTerms": true},
      "table": {"showItemNumbers": true, "showLocation": true, "showType": true, "showDimensions": true, "showQuantity": true, "showArea": true, "showChargeableArea": true, "showUnitPrice": true, "showTotal": true, "tableStyle": "plain", "headerAlignment": "left", "numberAlignment": "right", "textAlignment": "left", "amountAlignment": "right"}
    }'::jsonb,
    ARRAY['minimalist', 'clean', 'simple', 'elegant'],
    NULL
  ),
  (
    'Bold & Modern',
    'Eye-catching design with bold headers and modern typography',
    'global',
    false,
    true,
    true,
    '{
      "fonts": {"headerFont": "helvetica", "bodyFont": "helvetica", "headerFontSize": 26, "bodyFontSize": 10, "tableFontSize": 9, "footerFontSize": 8},
      "colors": {"tableHeaderBg": "#dc2626", "tableHeaderText": "#ffffff", "tableRowAlternate": "#fef2f2", "tableBorder": "#fecaca", "accentColor": "#dc2626", "textPrimary": "#1e293b", "textSecondary": "#64748b"},
      "layout": {"marginTop": 8, "marginRight": 8, "marginBottom": 8, "marginLeft": 8, "headerHeight": 60, "footerHeight": 30, "contentSpacing": 6},
      "logo": {"showLogo": true, "logoPosition": "left", "logoWidth": 45, "logoHeight": 45},
      "header": {"showHeader": true, "headerStyle": "gradient", "showCompanyInfo": true, "headerTextColor": "#ffffff", "showTagline": true},
      "footer": {"showFooter": true, "footerText": "Powered by Excellence", "showPageNumbers": true, "showGenerationDate": true, "footerStyle": "gradient"},
      "watermark": {"enableWatermark": false, "watermarkText": "CONFIDENTIAL", "watermarkOpacity": 0.1, "watermarkAngle": 45, "watermarkFontSize": 100},
      "terms": {"termsTitle": "IMPORTANT TERMS", "termsContent": [], "termsStyle": "box", "showTerms": true},
      "sections": {"showQuoteDetails": true, "showCustomerInfo": true, "showItemsTable": true, "showTotals": true, "showRemarks": true, "showTerms": true},
      "table": {"showItemNumbers": true, "showLocation": true, "showType": true, "showDimensions": true, "showQuantity": true, "showArea": true, "showChargeableArea": true, "showUnitPrice": true, "showTotal": true, "tableStyle": "grid", "headerAlignment": "center", "numberAlignment": "center", "textAlignment": "left", "amountAlignment": "right"}
    }'::jsonb,
    ARRAY['bold', 'modern', 'eye-catching', 'vibrant'],
    NULL
  );

-- Add helpful comment
COMMENT ON TABLE pdf_templates IS 'Stores reusable PDF configuration templates that users can save, load, and share across document types';
