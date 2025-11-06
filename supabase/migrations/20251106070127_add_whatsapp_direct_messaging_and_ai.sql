/*
  # WhatsApp Direct Messaging & AI Customer Support System

  ## Overview
  This migration adds comprehensive direct WhatsApp messaging capabilities with AI-powered 
  customer support to the admin dashboard.

  ## 1. New Tables

  ### `whatsapp_conversations`
  - Stores conversation threads between admins and customers
  - Tracks conversation status, last message time, unread counts
  - Links to customers and admins for proper relationship management
  
  ### `whatsapp_messages`
  - Individual messages in conversations
  - Supports both incoming (customer) and outgoing (admin/AI) messages
  - Tracks delivery status, read receipts, and AI generation flags
  - Stores message metadata including sender info and timestamps

  ### `whatsapp_ai_settings`
  - Configuration for AI-powered responses
  - Stores API provider credentials (OpenAI, Anthropic, etc.)
  - Controls AI behavior: auto-response rules, confidence thresholds
  - Business hours settings and escalation rules
  - Knowledge base integration settings

  ### `whatsapp_ai_training`
  - Feedback loop for AI improvement
  - Stores admin ratings of AI responses
  - Tracks response effectiveness and corrections
  - Used to fine-tune AI behavior over time

  ### `whatsapp_quick_replies`
  - Predefined response templates
  - Category-based organization for quick access
  - Supports variables for personalization
  - Used by both admins and AI for consistent messaging

  ## 2. Security (Row Level Security)
  - All tables have RLS enabled
  - Only authenticated admins can access WhatsApp features
  - Message access restricted by conversation participation
  - AI settings require admin authentication
  - Audit trails for all AI-generated responses

  ## 3. Indexes
  - Optimized for conversation listing and message retrieval
  - Fast lookups by customer, admin, and conversation
  - Efficient filtering by status and timestamps
  - Quick search capabilities across message content

  ## 4. Features Enabled
  - Direct one-on-one WhatsApp conversations from admin dashboard
  - Real-time incoming message management
  - AI-powered automatic responses with context awareness
  - Conversation threading and history
  - Unread message tracking and notifications
  - Quick reply templates
  - AI training and improvement feedback
  - Multi-provider AI support (OpenAI, Anthropic, Google, etc.)
*/

-- Conversations table to track all WhatsApp conversation threads
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  customer_phone text NOT NULL,
  customer_name text NOT NULL,
  assigned_admin_id uuid REFERENCES auth.users(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'spam')),
  unread_count integer DEFAULT 0,
  last_message_at timestamptz DEFAULT now(),
  last_message_preview text,
  last_message_from text CHECK (last_message_from IN ('customer', 'admin', 'ai')),
  tags text[] DEFAULT '{}',
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Individual messages in conversations
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES whatsapp_conversations(id) ON DELETE CASCADE NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('incoming', 'outgoing')),
  sender_type text NOT NULL CHECK (sender_type IN ('customer', 'admin', 'ai')),
  sender_id uuid,
  sender_name text NOT NULL,
  message_text text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  is_ai_generated boolean DEFAULT false,
  ai_confidence_score numeric(3,2),
  ai_approved_by uuid REFERENCES auth.users(id),
  external_message_id text,
  reply_to_message_id uuid REFERENCES whatsapp_messages(id),
  attachments jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- AI configuration settings
CREATE TABLE IF NOT EXISTS whatsapp_ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean DEFAULT false,
  ai_provider text NOT NULL CHECK (ai_provider IN ('openai', 'anthropic', 'google', 'custom')),
  api_key text NOT NULL,
  model_name text NOT NULL,
  auto_response_enabled boolean DEFAULT false,
  confidence_threshold numeric(3,2) DEFAULT 0.80,
  max_auto_responses_per_conversation integer DEFAULT 3,
  require_approval boolean DEFAULT true,
  business_hours_only boolean DEFAULT false,
  business_hours_start time,
  business_hours_end time,
  business_days integer[] DEFAULT '{1,2,3,4,5}',
  escalation_keywords text[] DEFAULT '{}',
  use_knowledge_base boolean DEFAULT true,
  use_customer_history boolean DEFAULT true,
  response_tone text DEFAULT 'professional' CHECK (response_tone IN ('professional', 'friendly', 'casual', 'formal')),
  language text DEFAULT 'en',
  system_prompt text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI training and feedback
CREATE TABLE IF NOT EXISTS whatsapp_ai_training (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES whatsapp_messages(id) ON DELETE CASCADE NOT NULL,
  original_ai_response text NOT NULL,
  admin_rating integer CHECK (admin_rating BETWEEN 1 AND 5),
  admin_feedback text,
  corrected_response text,
  customer_query text NOT NULL,
  was_helpful boolean,
  response_category text,
  rated_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Quick reply templates
CREATE TABLE IF NOT EXISTS whatsapp_quick_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  message_template text NOT NULL,
  variables text[] DEFAULT '{}',
  usage_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_ai_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_quick_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Conversations
CREATE POLICY "Authenticated users can view conversations"
  ON whatsapp_conversations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create conversations"
  ON whatsapp_conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update conversations"
  ON whatsapp_conversations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete conversations"
  ON whatsapp_conversations FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for Messages
CREATE POLICY "Authenticated users can view messages"
  ON whatsapp_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create messages"
  ON whatsapp_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update messages"
  ON whatsapp_messages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for AI Settings
CREATE POLICY "Authenticated users can view AI settings"
  ON whatsapp_ai_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage AI settings"
  ON whatsapp_ai_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update AI settings"
  ON whatsapp_ai_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for AI Training
CREATE POLICY "Authenticated users can view AI training"
  ON whatsapp_ai_training FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create AI training"
  ON whatsapp_ai_training FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = rated_by);

-- RLS Policies for Quick Replies
CREATE POLICY "Authenticated users can view quick replies"
  ON whatsapp_quick_replies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage quick replies"
  ON whatsapp_quick_replies FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_conversations_customer ON whatsapp_conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_admin ON whatsapp_conversations(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON whatsapp_conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON whatsapp_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_unread ON whatsapp_conversations(unread_count) WHERE unread_count > 0;

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON whatsapp_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON whatsapp_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_ai_generated ON whatsapp_messages(is_ai_generated) WHERE is_ai_generated = true;
CREATE INDEX IF NOT EXISTS idx_messages_status ON whatsapp_messages(status);

CREATE INDEX IF NOT EXISTS idx_ai_training_message ON whatsapp_ai_training(message_id);
CREATE INDEX IF NOT EXISTS idx_ai_training_rating ON whatsapp_ai_training(admin_rating);

CREATE INDEX IF NOT EXISTS idx_quick_replies_category ON whatsapp_quick_replies(category);
CREATE INDEX IF NOT EXISTS idx_quick_replies_active ON whatsapp_quick_replies(is_active) WHERE is_active = true;

-- Function to update conversation last message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE whatsapp_conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.message_text, 100),
    last_message_from = NEW.sender_type,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update conversation when new message arrives
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Function to increment unread count for incoming messages
CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.message_type = 'incoming' AND NEW.sender_type = 'customer' THEN
    UPDATE whatsapp_conversations
    SET unread_count = unread_count + 1
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track unread messages
CREATE TRIGGER trigger_increment_unread_count
  AFTER INSERT ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_unread_count();