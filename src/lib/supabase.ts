import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string;
          location: string | null;
          status: 'Lead' | 'Quoted' | 'Ordered' | 'Delivered' | 'Installed';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
      };
      quotes: {
        Row: {
          id: string;
          customer_id: string;
          quote_number: string;
          items: any[];
          subtotal: number;
          vat_amount: number;
          discount: number;
          total: number;
          remarks: string | null;
          status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
          valid_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['quotes']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['quotes']['Insert']>;
      };
      site_visits: {
        Row: {
          id: string;
          customer_id: string;
          visit_date: string;
          location: string;
          remarks: string | null;
          status: 'Scheduled' | 'Completed' | 'Cancelled';
          payment_required: boolean;
          payment_amount: number;
          payment_status: 'Unpaid' | 'Paid';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['site_visits']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['site_visits']['Insert']>;
      };
      orders: {
        Row: {
          id: string;
          customer_id: string;
          quote_id: string | null;
          order_number: string;
          order_date: string;
          delivery_date: string | null;
          installation_date: string | null;
          status: 'Confirmed' | 'In Production' | 'Delivered' | 'Installed';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      invoices: {
        Row: {
          id: string;
          customer_id: string;
          order_id: string | null;
          invoice_number: string;
          total_amount: number;
          deposit_paid: number;
          payment_before_delivery: number;
          balance: number;
          status: 'Unpaid' | 'Partial' | 'Paid';
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>;
      };
      payments: {
        Row: {
          id: string;
          invoice_id: string;
          amount: number;
          payment_date: string;
          payment_method: 'Cash' | 'Card' | 'Bank Transfer' | 'PayPal' | 'Stripe';
          reference: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
      };
      attachments: {
        Row: {
          id: string;
          entity_type: 'customer' | 'quote' | 'order' | 'invoice';
          entity_id: string;
          file_name: string;
          file_url: string;
          file_type: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['attachments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['attachments']['Insert']>;
      };
      keyboard_shortcuts: {
        Row: {
          id: string;
          user_id: string | null;
          shortcut_key: string;
          ctrl_key: boolean;
          shift_key: boolean;
          alt_key: boolean;
          action: string;
          description: string;
          is_enabled: boolean;
          is_custom: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['keyboard_shortcuts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['keyboard_shortcuts']['Insert']>;
      };
      customer_requests: {
        Row: {
          id: string;
          request_number: string;
          customer_name: string;
          phone: string;
          email: string;
          project_description: string;
          preferred_date: string | null;
          status: 'New' | 'Under Review' | 'Converted to Quote' | 'Rejected' | 'Completed';
          priority: 'Low' | 'Medium' | 'High' | 'Urgent';
          assigned_to: string | null;
          customer_id: string | null;
          quote_id: string | null;
          admin_notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customer_requests']['Row'], 'id' | 'request_number' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['customer_requests']['Insert']>;
      };
      request_attachments: {
        Row: {
          id: string;
          request_id: string;
          file_name: string;
          file_url: string;
          file_type: string;
          file_size: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['request_attachments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['request_attachments']['Insert']>;
      };
    };
  };
};
