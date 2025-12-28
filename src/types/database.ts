export type OrderStatus = 'Confirmed' | 'In Production' | 'Delivered' | 'Installed';
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type MessageSenderType = 'Admin' | 'Customer';
export type WarrantyStatus = 'Active' | 'Expired' | 'Claimed' | 'Void';
export type WarrantyCoverageType = 'Parts' | 'Labor' | 'Parts and Labor';
export type SiteVisitStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
export type ProductionStatus = 'Pending' | 'In Progress' | 'Quality Check' | 'Completed' | 'On Hold';
export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'PayPal' | 'Stripe' | 'Credit Card';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  quote_id: string | null;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  deposit_amount?: number;
  balance_due?: number;
  order_date: string;
  expected_completion_date?: string;
  completion_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface Quote {
  id: string;
  customer_id: string;
  quote_number: string;
  status: QuoteStatus;
  valid_until?: string;
  items: QuoteItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_percentage?: number;
  discount_amount?: number;
  shipping_amount?: number;
  total_amount: number;
  notes?: string;
  terms?: string;
  minimum_chargeable_area?: number;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Invoice {
  id: string;
  customer_id: string;
  order_id?: string;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  paid_date?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  notes?: string;
  payment_terms?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Message {
  id: string;
  customer_id: string;
  sender_type: MessageSenderType;
  sender_id: string;
  subject?: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  attachments?: any;
  private: boolean;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  customer_id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: string;
  assigned_to?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface SupportTicketReply {
  id: string;
  ticket_id: string;
  user_id: string;
  user_type: 'Admin' | 'Customer';
  message: string;
  attachments?: any;
  created_at: string;
}

export interface Warranty {
  id: string;
  order_id: string;
  customer_id: string;
  warranty_number: string;
  product_description: string;
  serial_number?: string;
  coverage_type: WarrantyCoverageType;
  start_date: string;
  end_date: string;
  status: WarrantyStatus;
  terms: string;
  claim_notes?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  order?: Order;
}

export interface SiteVisit {
  id: string;
  customer_id: string;
  order_id?: string;
  visit_number: string;
  scheduled_date: string;
  scheduled_time: string;
  status: SiteVisitStatus;
  technician_name?: string;
  purpose: string;
  notes?: string;
  completion_notes?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface ProductionTask {
  id: string;
  order_id: string;
  task_name: string;
  description?: string;
  assigned_to?: string;
  status: ProductionStatus;
  priority: 'Low' | 'Medium' | 'High';
  estimated_hours?: number;
  actual_hours?: number;
  start_date?: string;
  due_date?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  order?: Order;
}

export interface InstallationTask {
  id: string;
  order_id: string;
  task_name: string;
  description?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  assigned_to?: string;
  scheduled_date?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  order?: Order;
}

export interface InventoryItem {
  id: string;
  item_name: string;
  item_code: string;
  description?: string;
  category?: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  reorder_level: number;
  supplier?: string;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentReceipt {
  id: string;
  receipt_number: string;
  customer_id: string;
  invoice_id?: string;
  order_id?: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  tags: string[];
  is_published: boolean;
  view_count: number;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface VideoTutorial {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  category: string;
  duration_seconds?: number;
  view_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserFeedback {
  id: string;
  user_id: string;
  user_type: 'Admin' | 'Customer';
  feedback_type: 'Bug' | 'Feature Request' | 'General';
  page_url?: string;
  message: string;
  rating?: number;
  status: 'New' | 'Under Review' | 'Resolved' | 'Dismissed';
  admin_notes?: string;
  created_at: string;
}

export interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  description: string;
  type: 'Feature' | 'Improvement' | 'Bug Fix' | 'Security';
  is_published: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppConversation {
  id: string;
  customer_id: string;
  customer_phone: string;
  customer_name: string;
  assigned_admin_id?: string;
  status: 'Active' | 'Archived' | 'Blocked';
  unread_count: number;
  last_message_at?: string;
  last_message_preview?: string;
  last_message_from?: string;
  tags: string[];
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface CustomerUser {
  id: string;
  customer_id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}
