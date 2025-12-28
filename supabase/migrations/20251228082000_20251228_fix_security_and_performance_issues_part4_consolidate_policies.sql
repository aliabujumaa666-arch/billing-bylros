/*
  # Security and Performance Optimization - Part 4: Consolidate Multiple Permissive Policies
  
  1. Policy Consolidation
    - Remove duplicate/overlapping permissive policies
    - Keep one clear, comprehensive policy per action
    - Improves policy evaluation performance
    
  2. Tables Affected
    - api_keys, customer_segments, customer_users, entity_tags
    - messages, notification_preferences, payment_installments
    - payment_plans, tags, warranty_claims, webhooks
    - whatsapp_bulk_messages, whatsapp_message_queue, workflow_rules
    
  Note: This is Part 4 of a multi-part security and performance optimization.
*/

-- API Keys: Keep comprehensive "manage" policy, drop redundant "view" policy
DROP POLICY IF EXISTS "Users can view own api keys" ON public.api_keys;
-- Keep: "Users can manage own api keys"

-- Customer Segments: Keep comprehensive "manage" policy, drop redundant "view" policy
DROP POLICY IF EXISTS "Users can view segments" ON public.customer_segments;
-- Keep: "Users can manage segments"

-- Customer Users: Keep admin policy as it's more restrictive
DROP POLICY IF EXISTS "Users can create own customer user record" ON public.customer_users;
-- Keep: "Admins can create customer portal accounts"

-- Entity Tags: Keep comprehensive "manage" policy, drop redundant "view" policy
DROP POLICY IF EXISTS "Users can view entity tags" ON public.entity_tags;
-- Keep: "Users can manage entity tags"

-- Messages: Consolidate into single comprehensive policy
DROP POLICY IF EXISTS "Customers can view own messages" ON public.messages;
-- Keep: "Users can view messages" (already covers both cases)

-- Notification Preferences: Consolidate SELECT policies
DROP POLICY IF EXISTS "Customers can view own preferences" ON public.notification_preferences;
-- Keep: "Users can view preferences"

-- Notification Preferences: Consolidate UPDATE policies
DROP POLICY IF EXISTS "Customers can update own preferences" ON public.notification_preferences;
-- Keep: "Users can update preferences"

-- Payment Installments: Keep comprehensive "manage" policy, drop redundant "view" policy
DROP POLICY IF EXISTS "Users can view installments" ON public.payment_installments;
-- Keep: "Users can manage installments"

-- Payment Plans: Keep comprehensive "manage" policy, drop redundant "view" policy
DROP POLICY IF EXISTS "Users can view payment plans" ON public.payment_plans;
-- Keep: "Users can manage payment plans"

-- Tags: Keep comprehensive "manage" policy, drop redundant "view" policy
DROP POLICY IF EXISTS "Users can view tags" ON public.tags;
-- Keep: "Users can manage tags"

-- Warranty Claims: Consolidate into single comprehensive policy
DROP POLICY IF EXISTS "Customers can view their warranty claims" ON public.warranty_claims;
-- Keep: "Users can view warranty claims" (covers both customer and admin views)

-- Webhooks: Keep comprehensive "manage" policy, drop redundant "view" policy
DROP POLICY IF EXISTS "Users can view own webhooks" ON public.webhooks;
-- Keep: "Users can manage own webhooks"

-- WhatsApp Bulk Messages: Consolidate duplicate view policies
DROP POLICY IF EXISTS "Allow users to view bulk messages" ON public.whatsapp_bulk_messages;
-- Keep: "Users can view bulk messages"

-- WhatsApp Message Queue: Keep one SELECT policy
DROP POLICY IF EXISTS "Allow users to view message queue" ON public.whatsapp_message_queue;
-- Keep: "Users can view message queue"

-- WhatsApp Message Queue: Keep system update policy, drop user update policy
DROP POLICY IF EXISTS "Users can update message queue" ON public.whatsapp_message_queue;
-- Keep: "Allow system to update message queue"

-- Workflow Rules: Keep comprehensive "manage" policy, drop redundant "view" policy
DROP POLICY IF EXISTS "Users can view workflow rules" ON public.workflow_rules;
-- Keep: "Users can manage workflow rules"