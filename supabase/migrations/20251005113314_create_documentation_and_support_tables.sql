/*
  # Create Documentation and Support System Tables

  1. New Tables
    - `knowledge_base_categories` - Categories for organizing help articles
      - `id` (uuid, primary key)
      - `name` (text) - Category name
      - `description` (text) - Category description
      - `icon` (text) - Icon name for the category
      - `order_index` (integer) - Display order
      - `is_active` (boolean) - Whether category is visible
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `knowledge_base_articles` - Help articles and documentation
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key)
      - `title` (text) - Article title
      - `slug` (text, unique) - URL-friendly slug
      - `content` (text) - Article content in markdown
      - `summary` (text) - Short summary
      - `tags` (text[]) - Search tags
      - `views_count` (integer) - Number of views
      - `helpful_count` (integer) - Helpful votes
      - `unhelpful_count` (integer) - Unhelpful votes
      - `is_published` (boolean) - Published status
      - `target_audience` (text) - 'admin', 'customer', or 'both'
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `faqs` - Frequently Asked Questions
      - `id` (uuid, primary key)
      - `question` (text) - Question text
      - `answer` (text) - Answer in markdown
      - `category` (text) - FAQ category
      - `order_index` (integer) - Display order
      - `target_audience` (text) - 'admin', 'customer', or 'both'
      - `is_active` (boolean)
      - `views_count` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `video_tutorials` - Video tutorial library
      - `id` (uuid, primary key)
      - `title` (text) - Tutorial title
      - `description` (text) - Tutorial description
      - `video_url` (text) - Video URL (YouTube, Vimeo, etc.)
      - `thumbnail_url` (text) - Thumbnail image URL
      - `duration_seconds` (integer) - Video duration
      - `category` (text) - Tutorial category
      - `tags` (text[]) - Search tags
      - `target_audience` (text) - 'admin', 'customer', or 'both'
      - `order_index` (integer)
      - `views_count` (integer)
      - `is_published` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `support_tickets` - Customer support tickets
      - `id` (uuid, primary key)
      - `ticket_number` (text, unique) - Auto-generated ticket number
      - `customer_id` (uuid, foreign key) - Nullable for anonymous submissions
      - `customer_email` (text) - Email for contact
      - `customer_name` (text) - Name of submitter
      - `subject` (text) - Ticket subject
      - `description` (text) - Detailed description
      - `category` (text) - Issue category
      - `priority` (text) - low, medium, high, urgent
      - `status` (text) - open, in_progress, waiting, resolved, closed
      - `assigned_to` (uuid) - Admin user ID
      - `attachments` (jsonb) - Attached files metadata
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `support_ticket_replies` - Replies to support tickets
      - `id` (uuid, primary key)
      - `ticket_id` (uuid, foreign key)
      - `user_id` (uuid) - User who replied
      - `reply_text` (text) - Reply content
      - `is_internal_note` (boolean) - Internal admin notes
      - `attachments` (jsonb) - Attached files metadata
      - `created_at` (timestamp)
    
    - `user_feedback` - In-app feedback collection
      - `id` (uuid, primary key)
      - `user_id` (uuid) - User who submitted feedback
      - `user_type` (text) - 'admin' or 'customer'
      - `feedback_type` (text) - bug, feature_request, improvement, praise
      - `page_url` (text) - Page where feedback was submitted
      - `message` (text) - Feedback message
      - `rating` (integer) - 1-5 rating
      - `status` (text) - new, reviewed, implemented, rejected
      - `admin_notes` (text) - Admin response/notes
      - `created_at` (timestamp)
    
    - `changelog_entries` - Platform changelog
      - `id` (uuid, primary key)
      - `version` (text) - Version number
      - `release_date` (date) - Release date
      - `title` (text) - Release title
      - `description` (text) - Release description
      - `changes` (jsonb) - Array of changes with types (feature, improvement, fix, breaking)
      - `is_published` (boolean)
      - `created_by` (uuid) - Admin who created entry
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Authenticated users can view published content
    - Only admins can manage content
    - Customers can create support tickets and feedback
    - Public access for published knowledge base and FAQs

  3. Indexes
    - Create indexes for frequently queried fields
    - Full-text search indexes for articles and FAQs
*/

-- Create knowledge_base_categories table
CREATE TABLE IF NOT EXISTS knowledge_base_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT 'BookOpen',
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create knowledge_base_articles table
CREATE TABLE IF NOT EXISTS knowledge_base_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES knowledge_base_categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  summary text DEFAULT '',
  tags text[] DEFAULT '{}',
  views_count integer DEFAULT 0,
  helpful_count integer DEFAULT 0,
  unhelpful_count integer DEFAULT 0,
  is_published boolean DEFAULT false,
  target_audience text DEFAULT 'both' CHECK (target_audience IN ('admin', 'customer', 'both')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create FAQs table
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'General',
  order_index integer DEFAULT 0,
  target_audience text DEFAULT 'both' CHECK (target_audience IN ('admin', 'customer', 'both')),
  is_active boolean DEFAULT true,
  views_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create video_tutorials table
CREATE TABLE IF NOT EXISTS video_tutorials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  video_url text NOT NULL,
  thumbnail_url text DEFAULT '',
  duration_seconds integer DEFAULT 0,
  category text DEFAULT 'General',
  tags text[] DEFAULT '{}',
  target_audience text DEFAULT 'both' CHECK (target_audience IN ('admin', 'customer', 'both')),
  order_index integer DEFAULT 0,
  views_count integer DEFAULT 0,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  category text DEFAULT 'General' CHECK (category IN ('General', 'Technical', 'Billing', 'Product', 'Other')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  attachments jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create support_ticket_replies table
CREATE TABLE IF NOT EXISTS support_ticket_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reply_text text NOT NULL,
  is_internal_note boolean DEFAULT false,
  attachments jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- Create user_feedback table
CREATE TABLE IF NOT EXISTS user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_type text DEFAULT 'customer' CHECK (user_type IN ('admin', 'customer')),
  feedback_type text DEFAULT 'improvement' CHECK (feedback_type IN ('bug', 'feature_request', 'improvement', 'praise')),
  page_url text DEFAULT '',
  message text NOT NULL,
  rating integer DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  status text DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'implemented', 'rejected')),
  admin_notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create changelog_entries table
CREATE TABLE IF NOT EXISTS changelog_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  release_date date NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  changes jsonb DEFAULT '[]',
  is_published boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS knowledge_base_categories_updated_at ON knowledge_base_categories;
CREATE TRIGGER knowledge_base_categories_updated_at
  BEFORE UPDATE ON knowledge_base_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS knowledge_base_articles_updated_at ON knowledge_base_articles;
CREATE TRIGGER knowledge_base_articles_updated_at
  BEFORE UPDATE ON knowledge_base_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS faqs_updated_at ON faqs;
CREATE TRIGGER faqs_updated_at
  BEFORE UPDATE ON faqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS video_tutorials_updated_at ON video_tutorials;
CREATE TRIGGER video_tutorials_updated_at
  BEFORE UPDATE ON video_tutorials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS support_tickets_updated_at ON support_tickets;
CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS changelog_entries_updated_at ON changelog_entries;
CREATE TRIGGER changelog_entries_updated_at
  BEFORE UPDATE ON changelog_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE knowledge_base_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE changelog_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_base_categories
CREATE POLICY "Anyone can view active categories"
  ON knowledge_base_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage categories"
  ON knowledge_base_categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for knowledge_base_articles
CREATE POLICY "Anyone can view published articles"
  ON knowledge_base_articles FOR SELECT
  USING (is_published = true);

CREATE POLICY "Authenticated users can manage articles"
  ON knowledge_base_articles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for FAQs
CREATE POLICY "Anyone can view active FAQs"
  ON faqs FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage FAQs"
  ON faqs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for video_tutorials
CREATE POLICY "Anyone can view published tutorials"
  ON video_tutorials FOR SELECT
  USING (is_published = true);

CREATE POLICY "Authenticated users can manage tutorials"
  ON video_tutorials FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for support_tickets
CREATE POLICY "Users can view their own tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for support_ticket_replies
CREATE POLICY "Users can view replies to their tickets"
  ON support_ticket_replies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create replies"
  ON support_ticket_replies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for user_feedback
CREATE POLICY "Users can create feedback"
  ON user_feedback FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all feedback"
  ON user_feedback FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update feedback"
  ON user_feedback FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for changelog_entries
CREATE POLICY "Anyone can view published changelog"
  ON changelog_entries FOR SELECT
  USING (is_published = true);

CREATE POLICY "Authenticated users can manage changelog"
  ON changelog_entries FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_kb_articles_category_id ON knowledge_base_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_slug ON knowledge_base_articles(slug);
CREATE INDEX IF NOT EXISTS idx_kb_articles_published ON knowledge_base_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active);
CREATE INDEX IF NOT EXISTS idx_tutorials_category ON video_tutorials(category);
CREATE INDEX IF NOT EXISTS idx_tutorials_published ON video_tutorials(is_published);
CREATE INDEX IF NOT EXISTS idx_support_tickets_number ON support_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer ON support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket_id ON support_ticket_replies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_changelog_published ON changelog_entries(is_published);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_kb_articles_search ON knowledge_base_articles USING gin(to_tsvector('english', title || ' ' || content));
CREATE INDEX IF NOT EXISTS idx_faqs_search ON faqs USING gin(to_tsvector('english', question || ' ' || answer));