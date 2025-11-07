/*
  # Enhance WhatsApp Message Queue with Retry Logic
  
  1. Changes to `whatsapp_message_queue` table
    - Add `retry_count` (integer) - Number of retry attempts
    - Add `max_retries` (integer) - Maximum allowed retries (default 3)
    - Add `last_retry_at` (timestamptz) - Timestamp of last retry attempt
    - Add `delivery_status` (text) - Detailed delivery status from API
    - Add `metadata` (jsonb) - Additional tracking data
  
  2. Changes to `whatsapp_bulk_messages` table
    - Add `pending_count` (integer) - Messages in pending status
    - Add `skipped_count` (integer) - Messages that were skipped
    - Add `started_at` (timestamptz) - When campaign started sending
    - Add `completed_at` (timestamptz) - When campaign completed
  
  3. Indexes
    - Add indexes for efficient querying by retry status
    - Add indexes for scheduled message processing
  
  4. Functions
    - Create function to update campaign counts automatically
*/

-- Add new columns to whatsapp_message_queue
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_message_queue' AND column_name = 'retry_count'
  ) THEN
    ALTER TABLE whatsapp_message_queue ADD COLUMN retry_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_message_queue' AND column_name = 'max_retries'
  ) THEN
    ALTER TABLE whatsapp_message_queue ADD COLUMN max_retries integer DEFAULT 3;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_message_queue' AND column_name = 'last_retry_at'
  ) THEN
    ALTER TABLE whatsapp_message_queue ADD COLUMN last_retry_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_message_queue' AND column_name = 'delivery_status'
  ) THEN
    ALTER TABLE whatsapp_message_queue ADD COLUMN delivery_status text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_message_queue' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE whatsapp_message_queue ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add new columns to whatsapp_bulk_messages
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_bulk_messages' AND column_name = 'pending_count'
  ) THEN
    ALTER TABLE whatsapp_bulk_messages ADD COLUMN pending_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_bulk_messages' AND column_name = 'skipped_count'
  ) THEN
    ALTER TABLE whatsapp_bulk_messages ADD COLUMN skipped_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_bulk_messages' AND column_name = 'started_at'
  ) THEN
    ALTER TABLE whatsapp_bulk_messages ADD COLUMN started_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_bulk_messages' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE whatsapp_bulk_messages ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

-- Create indexes for efficient retry processing
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_retry 
  ON whatsapp_message_queue(status, retry_count) 
  WHERE status = 'failed' AND retry_count < max_retries;

CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_pending 
  ON whatsapp_message_queue(bulk_message_id, status) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_whatsapp_bulk_scheduled 
  ON whatsapp_bulk_messages(scheduled_at, status) 
  WHERE status = 'scheduled' AND scheduled_at IS NOT NULL;

-- Create function to update campaign counts
CREATE OR REPLACE FUNCTION update_campaign_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE whatsapp_bulk_messages
    SET 
      sent_count = (
        SELECT COUNT(*) 
        FROM whatsapp_message_queue 
        WHERE bulk_message_id = NEW.bulk_message_id AND status = 'sent'
      ),
      failed_count = (
        SELECT COUNT(*) 
        FROM whatsapp_message_queue 
        WHERE bulk_message_id = NEW.bulk_message_id AND status = 'failed'
      ),
      pending_count = (
        SELECT COUNT(*) 
        FROM whatsapp_message_queue 
        WHERE bulk_message_id = NEW.bulk_message_id AND status = 'pending'
      ),
      skipped_count = (
        SELECT COUNT(*) 
        FROM whatsapp_message_queue 
        WHERE bulk_message_id = NEW.bulk_message_id AND status = 'skipped'
      ),
      updated_at = now()
    WHERE id = NEW.bulk_message_id;

    UPDATE whatsapp_bulk_messages
    SET 
      status = CASE
        WHEN (SELECT COUNT(*) FROM whatsapp_message_queue WHERE bulk_message_id = NEW.bulk_message_id AND status = 'pending') = 0
          AND (SELECT COUNT(*) FROM whatsapp_message_queue WHERE bulk_message_id = NEW.bulk_message_id AND status IN ('sent', 'failed', 'skipped')) > 0
        THEN 'sent'
        WHEN (SELECT COUNT(*) FROM whatsapp_message_queue WHERE bulk_message_id = NEW.bulk_message_id AND status IN ('sent', 'pending')) > 0
        THEN 'sending'
        ELSE status
      END,
      completed_at = CASE
        WHEN (SELECT COUNT(*) FROM whatsapp_message_queue WHERE bulk_message_id = NEW.bulk_message_id AND status = 'pending') = 0
        THEN now()
        ELSE completed_at
      END
    WHERE id = NEW.bulk_message_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic count updates
DROP TRIGGER IF EXISTS trigger_update_campaign_counts ON whatsapp_message_queue;
CREATE TRIGGER trigger_update_campaign_counts
  AFTER INSERT OR UPDATE ON whatsapp_message_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_counts();

-- Update existing records to initialize counts
UPDATE whatsapp_bulk_messages bm
SET 
  pending_count = (
    SELECT COUNT(*) 
    FROM whatsapp_message_queue 
    WHERE bulk_message_id = bm.id AND status = 'pending'
  ),
  skipped_count = (
    SELECT COUNT(*) 
    FROM whatsapp_message_queue 
    WHERE bulk_message_id = bm.id AND status = 'skipped'
  );
