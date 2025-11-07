/*
  # Security Fix Part 9: Fix Function Search Path Issues

  1. Update Functions with Secure Search Path
    - Add SECURITY DEFINER and set search_path for all functions
    - Prevents search_path manipulation attacks
  
  2. Functions Fixed
    - generate_request_number
    - set_request_number
    - update_customer_requests_updated_at
    - generate_receipt_number
    - set_page_published_at
    - generate_slug
    - update_campaign_counts
  
  3. Notes
    - Sets search_path to empty to prevent privilege escalation
    - All table references must be schema-qualified
*/

-- Fix generate_request_number function
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TEXT
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  request_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.customer_requests
  WHERE request_number ~ '^REQ-[0-9]+$';
  
  request_num := 'REQ-' || LPAD(next_number::TEXT, 6, '0');
  RETURN request_num;
END;
$$;

-- Fix set_request_number function
CREATE OR REPLACE FUNCTION set_request_number()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.request_number IS NULL THEN
    NEW.request_number := generate_request_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Fix update_customer_requests_updated_at function
CREATE OR REPLACE FUNCTION update_customer_requests_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Fix generate_receipt_number function
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  receipt_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.receipts
  WHERE receipt_number ~ '^RCT-[0-9]+$';
  
  receipt_num := 'RCT-' || LPAD(next_number::TEXT, 6, '0');
  RETURN receipt_num;
END;
$$;

-- Fix set_page_published_at function
CREATE OR REPLACE FUNCTION set_page_published_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_published = true AND OLD.is_published = false THEN
    NEW.published_at := now();
  ELSIF NEW.is_published = false THEN
    NEW.published_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix generate_slug function - drop and recreate with correct signature
DROP FUNCTION IF EXISTS generate_slug(text);
CREATE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(input_text, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$;

-- Fix update_campaign_counts function
CREATE OR REPLACE FUNCTION update_campaign_counts()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.whatsapp_bulk_messages
    SET 
      sent_count = (
        SELECT COUNT(*) 
        FROM public.whatsapp_message_queue 
        WHERE bulk_message_id = NEW.bulk_message_id AND status = 'sent'
      ),
      failed_count = (
        SELECT COUNT(*) 
        FROM public.whatsapp_message_queue 
        WHERE bulk_message_id = NEW.bulk_message_id AND status = 'failed'
      ),
      pending_count = (
        SELECT COUNT(*) 
        FROM public.whatsapp_message_queue 
        WHERE bulk_message_id = NEW.bulk_message_id AND status = 'pending'
      ),
      skipped_count = (
        SELECT COUNT(*) 
        FROM public.whatsapp_message_queue 
        WHERE bulk_message_id = NEW.bulk_message_id AND status = 'skipped'
      ),
      updated_at = now()
    WHERE id = NEW.bulk_message_id;

    UPDATE public.whatsapp_bulk_messages
    SET 
      status = CASE
        WHEN (SELECT COUNT(*) FROM public.whatsapp_message_queue WHERE bulk_message_id = NEW.bulk_message_id AND status = 'pending') = 0
          AND (SELECT COUNT(*) FROM public.whatsapp_message_queue WHERE bulk_message_id = NEW.bulk_message_id AND status IN ('sent', 'failed', 'skipped')) > 0
        THEN 'sent'
        WHEN (SELECT COUNT(*) FROM public.whatsapp_message_queue WHERE bulk_message_id = NEW.bulk_message_id AND status IN ('sent', 'pending')) > 0
        THEN 'sending'
        ELSE status
      END,
      completed_at = CASE
        WHEN (SELECT COUNT(*) FROM public.whatsapp_message_queue WHERE bulk_message_id = NEW.bulk_message_id AND status = 'pending') = 0
        THEN now()
        ELSE completed_at
      END
    WHERE id = NEW.bulk_message_id;
  END IF;

  RETURN NEW;
END;
$$;
