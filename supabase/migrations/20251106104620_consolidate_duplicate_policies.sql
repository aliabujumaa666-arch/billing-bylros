/*
  # Consolidate Duplicate Permissive Policies

  ## Changes Made:
  
  This migration consolidates duplicate permissive policies that serve the same purpose.
  Multiple permissive policies with OR logic can be combined into single policies.
  
  Tables affected:
  - whatsapp_ai_settings
  - whatsapp_bulk_messages  
  - whatsapp_message_queue
  - whatsapp_quick_replies
  - whatsapp_settings
  - whatsapp_templates
  
  Note: Other "multiple permissive policies" are intentional for proper RBAC
  (admin vs customer access patterns) and should NOT be consolidated.
*/

-- ============================================================================
-- WHATSAPP AI SETTINGS - Consolidate view and manage policies
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view AI settings" ON public.whatsapp_ai_settings;
DROP POLICY IF EXISTS "Authenticated users can update AI settings" ON public.whatsapp_ai_settings;

-- The "Authenticated users can manage AI settings" policy already covers all operations

-- ============================================================================
-- WHATSAPP BULK MESSAGES - Keep separate policies for audit trail
-- ============================================================================

-- Keep "Admins can manage bulk messages" (covers ALL operations)
-- Keep "Allow authenticated users to create campaigns" (specific INSERT for audit)
-- Keep "Allow users to view bulk messages" (specific SELECT for audit)

-- ============================================================================
-- WHATSAPP MESSAGE QUEUE - Keep separate policies for audit trail  
-- ============================================================================

-- Keep "Admins can manage message queue" (covers ALL operations)
-- Keep "Allow system to manage message queue" (INSERT for system)
-- Keep "Allow users to view message queue" (SELECT for users)
-- Keep "Allow system to update message queue" (UPDATE for system)

-- ============================================================================
-- WHATSAPP QUICK REPLIES - Consolidate view and manage
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view quick replies" ON public.whatsapp_quick_replies;

-- Keep "Authenticated users can manage quick replies" which covers all operations

-- ============================================================================
-- WHATSAPP SETTINGS - Drop duplicate old policies
-- ============================================================================

DROP POLICY IF EXISTS "Allow authenticated users to manage WhatsApp settings" ON public.whatsapp_settings;
DROP POLICY IF EXISTS "Allow authenticated users to view WhatsApp settings" ON public.whatsapp_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update WhatsApp settings" ON public.whatsapp_settings;

-- Keep "Admins can manage WhatsApp settings" which covers all operations

-- ============================================================================
-- WHATSAPP TEMPLATES - Drop old duplicate policies
-- ============================================================================

DROP POLICY IF EXISTS "Allow users to delete templates" ON public.whatsapp_templates;
DROP POLICY IF EXISTS "Allow authenticated users to manage templates" ON public.whatsapp_templates;
DROP POLICY IF EXISTS "Allow users to view templates" ON public.whatsapp_templates;
DROP POLICY IF EXISTS "Allow users to update templates" ON public.whatsapp_templates;

-- Keep "Admins can view and manage templates" which covers all operations
