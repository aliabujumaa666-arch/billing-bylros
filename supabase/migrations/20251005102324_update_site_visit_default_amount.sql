/*
  # Update Site Visit Booking Default Amount

  1. Changes
    - Update default amount for public_site_visit_bookings from 100.00 to 300.00
  
  2. Notes
    - Site visit fee is AED 300.00
    - This amount will be refunded once customer confirms the order
*/

-- Update default amount for new bookings
ALTER TABLE public_site_visit_bookings 
  ALTER COLUMN amount SET DEFAULT 300.00;