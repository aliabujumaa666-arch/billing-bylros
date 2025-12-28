/*
  # Security and Performance Optimization - Part 5: Fix Function Search Paths
  
  1. Function Search Path Security
    - Set search_path to 'public' for all functions
    - Prevents search path manipulation attacks
    - Ensures functions always reference correct schema
    
  2. Functions Fixed
    - update_pdf_template_updated_at
    - increment_template_usage
    - set_quote_valid_until
    - refresh_dashboard_stats
    - refresh_recent_activity
    - set_request_number
    - update_email_campaign_updated_at
    
  Note: This is Part 5 of a multi-part security and performance optimization.
*/

-- Fix update_pdf_template_updated_at function
CREATE OR REPLACE FUNCTION public.update_pdf_template_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix increment_template_usage function
CREATE OR REPLACE FUNCTION public.increment_template_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.pdf_templates
  SET usage_count = usage_count + 1,
      last_used_at = now()
  WHERE id = NEW.template_id;
  RETURN NEW;
END;
$$;

-- Fix set_quote_valid_until function
CREATE OR REPLACE FUNCTION public.set_quote_valid_until()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.valid_until IS NULL THEN
    NEW.valid_until := NEW.created_at + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$;

-- Fix refresh_dashboard_stats function
CREATE OR REPLACE FUNCTION public.refresh_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.dashboard_stats;
END;
$$;

-- Fix refresh_recent_activity function
CREATE OR REPLACE FUNCTION public.refresh_recent_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.recent_activity;
END;
$$;

-- Fix set_request_number function
CREATE OR REPLACE FUNCTION public.set_request_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.request_number IS NULL THEN
    NEW.request_number := 'REQ-' || LPAD(nextval('public.customer_requests_number_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Fix update_email_campaign_updated_at function
CREATE OR REPLACE FUNCTION public.update_email_campaign_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;