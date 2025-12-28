/*
  # Add Comprehensive All-Time Dashboard Statistics

  1. Updates
    - Expands dashboard_stats materialized view to include comprehensive all-time statistics
    - Adds accepted quotes, rejected quotes, draft quotes counts
    - Adds completed orders, cancelled orders, delivered orders counts
    - Adds paid invoices count (separate from revenue)
    - Adds cancelled invoices count
    - Adds completed site visits, cancelled site visits counts
    - Adds total support tickets and closed tickets counts
    - Adds total value metrics for various statuses
  
  2. Security
    - Maintains existing RLS policies
    - View remains accessible to authenticated users only
*/

-- Drop and recreate the dashboard_stats materialized view with expanded metrics
DROP MATERIALIZED VIEW IF EXISTS dashboard_stats CASCADE;

CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT
  -- Customer Metrics
  (SELECT COUNT(*) FROM customers) as total_customers,
  (SELECT COUNT(*) FROM customers WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_customers_30d,
  
  -- Quote Metrics
  (SELECT COUNT(*) FROM quotes) as total_quotes,
  (SELECT COUNT(*) FROM quotes WHERE status = 'pending') as pending_quotes,
  (SELECT COUNT(*) FROM quotes WHERE status = 'Draft') as draft_quotes,
  (SELECT COUNT(*) FROM quotes WHERE status = 'Accepted') as accepted_quotes,
  (SELECT COUNT(*) FROM quotes WHERE status = 'Rejected') as rejected_quotes,
  (SELECT COUNT(*) FROM quotes WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_quotes_30d,
  (SELECT COALESCE(SUM(total), 0) FROM quotes WHERE status = 'pending') as pending_quotes_value,
  (SELECT COALESCE(SUM(total), 0) FROM quotes WHERE status = 'Accepted') as accepted_quotes_value,
  (SELECT COALESCE(SUM(total), 0) FROM quotes) as total_quotes_value,
  
  -- Invoice Metrics
  (SELECT COUNT(*) FROM invoices) as total_invoices,
  (SELECT COUNT(*) FROM invoices WHERE status = 'pending') as pending_invoices,
  (SELECT COUNT(*) FROM invoices WHERE status = 'overdue') as overdue_invoices,
  (SELECT COUNT(*) FROM invoices WHERE status = 'paid') as paid_invoices,
  (SELECT COUNT(*) FROM invoices WHERE status = 'Partial') as partial_invoices,
  (SELECT COUNT(*) FROM invoices WHERE status = 'cancelled') as cancelled_invoices,
  (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'pending') as pending_invoices_value,
  (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'overdue') as overdue_invoices_value,
  (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'paid') as total_revenue,
  (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'paid' AND created_at >= CURRENT_DATE - INTERVAL '30 days') as revenue_30d,
  (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'Partial') as partial_revenue,
  (SELECT COALESCE(SUM(total_amount), 0) FROM invoices) as total_invoices_value,
  
  -- Order Metrics
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'in_progress') as in_progress_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'In Production') as in_production_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'Delivered') as delivered_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'completed') as completed_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'cancelled') as cancelled_orders,
  (SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_orders_30d,
  
  -- Site Visit Metrics
  (SELECT COUNT(*) FROM site_visits) as total_site_visits,
  (SELECT COUNT(*) FROM site_visits WHERE status = 'scheduled') as scheduled_visits,
  (SELECT COUNT(*) FROM site_visits WHERE status = 'Scheduled') as scheduled_visits_cap,
  (SELECT COUNT(*) FROM site_visits WHERE status = 'completed') as completed_visits,
  (SELECT COUNT(*) FROM site_visits WHERE status = 'cancelled') as cancelled_visits,
  (SELECT COUNT(*) FROM site_visits WHERE visit_date::date = CURRENT_DATE) as today_visits,
  (SELECT COUNT(*) FROM site_visits WHERE visit_date::date >= CURRENT_DATE) as upcoming_visits,
  
  -- Support Ticket Metrics
  (SELECT COUNT(*) FROM support_tickets) as total_tickets,
  (SELECT COUNT(*) FROM support_tickets WHERE status = 'open') as open_tickets,
  (SELECT COUNT(*) FROM support_tickets WHERE status = 'closed') as closed_tickets,
  (SELECT COUNT(*) FROM support_tickets WHERE priority = 'high' AND status != 'closed') as high_priority_tickets,
  
  -- Message Metrics
  (SELECT COUNT(*) FROM messages) as total_messages,
  (SELECT COUNT(*) FROM messages WHERE is_read = false) as unread_messages,
  
  NOW() as last_updated;

CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats_updated ON dashboard_stats(last_updated);

-- Grant permissions
ALTER MATERIALIZED VIEW dashboard_stats OWNER TO postgres;
GRANT SELECT ON dashboard_stats TO authenticated;

-- Update the refresh function
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
END;
$$;
