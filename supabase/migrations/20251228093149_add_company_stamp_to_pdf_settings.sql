/*
  # Add Company Stamp and Info to PDF Settings

  1. Updates
    - Adds company_stamp_url field to store the URL of the company stamp/seal image
    - Adds show_company_stamp boolean to control stamp visibility
    - Adds company_info_text field for additional company information below terms
    - Adds show_company_info boolean to control company info visibility
    - These fields will be added to the terms section of PDF settings

  2. Usage
    - Company stamp will be displayed below terms & conditions
    - Company info text will be shown alongside or below the stamp
    - Both are optional and configurable per document type
*/

-- Add company stamp and info fields to brand_settings for PDF customization
DO $$
BEGIN
  -- Check if pdf_settings column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brand_settings' AND column_name = 'pdf_settings'
  ) THEN
    -- Update existing PDF settings to include company stamp fields
    UPDATE brand_settings
    SET pdf_settings = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            COALESCE(pdf_settings, '{}'::jsonb),
            '{quotes,terms,companyStampUrl}',
            '""'::jsonb,
            true
          ),
          '{quotes,terms,showCompanyStamp}',
          'false'::jsonb,
          true
        ),
        '{quotes,terms,companyInfoText}',
        '""'::jsonb,
        true
      ),
      '{quotes,terms,showCompanyInfo}',
      'false'::jsonb,
      true
    )
    WHERE pdf_settings IS NOT NULL;

    -- Also update for other document types
    UPDATE brand_settings
    SET pdf_settings = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            COALESCE(pdf_settings, '{}'::jsonb),
            '{invoices,terms,companyStampUrl}',
            '""'::jsonb,
            true
          ),
          '{invoices,terms,showCompanyStamp}',
          'false'::jsonb,
          true
        ),
        '{invoices,terms,companyInfoText}',
        '""'::jsonb,
        true
      ),
      '{invoices,terms,showCompanyInfo}',
      'false'::jsonb,
      true
    )
    WHERE pdf_settings IS NOT NULL;

    UPDATE brand_settings
    SET pdf_settings = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            COALESCE(pdf_settings, '{}'::jsonb),
            '{orders,terms,companyStampUrl}',
            '""'::jsonb,
            true
          ),
          '{orders,terms,showCompanyStamp}',
          'false'::jsonb,
          true
        ),
        '{orders,terms,companyInfoText}',
        '""'::jsonb,
        true
      ),
      '{orders,terms,showCompanyInfo}',
      'false'::jsonb,
      true
    )
    WHERE pdf_settings IS NOT NULL;

    UPDATE brand_settings
    SET pdf_settings = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            COALESCE(pdf_settings, '{}'::jsonb),
            '{warranties,terms,companyStampUrl}',
            '""'::jsonb,
            true
          ),
          '{warranties,terms,showCompanyStamp}',
          'false'::jsonb,
          true
        ),
        '{warranties,terms,companyInfoText}',
        '""'::jsonb,
        true
      ),
      '{warranties,terms,showCompanyInfo}',
      'false'::jsonb,
      true
    )
    WHERE pdf_settings IS NOT NULL;

    UPDATE brand_settings
    SET pdf_settings = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            COALESCE(pdf_settings, '{}'::jsonb),
            '{siteVisits,terms,companyStampUrl}',
            '""'::jsonb,
            true
          ),
          '{siteVisits,terms,showCompanyStamp}',
          'false'::jsonb,
          true
        ),
        '{siteVisits,terms,companyInfoText}',
        '""'::jsonb,
        true
      ),
      '{siteVisits,terms,showCompanyInfo}',
      'false'::jsonb,
      true
    )
    WHERE pdf_settings IS NOT NULL;
  END IF;
END $$;
