/*
  # Fix Public Booking Security

  1. Security Issue Fixed
    - `public_site_visit_bookings` table: Previous policy allowed anonymous users to read ALL bookings
    - This exposed sensitive customer information (names, emails, phones, addresses) to anyone
  
  2. Changes Made
    - Drop the overly permissive "Anyone can read bookings by ID" policy
    - Create new restrictive policy:
      - Only authenticated users (admins) can read bookings
      - Anonymous users can still INSERT bookings (submit requests)
      - But cannot read back any booking data
  
  3. Rationale
    - Public bookings are one-time submissions by non-logged-in users
    - Once submitted, only admin staff should access this data
    - This prevents enumeration attacks and protects customer privacy
  
  4. Impact
    - Prevents unauthorized access to sensitive booking data
    - Maintains functionality for public booking submission
    - Protects customer privacy
*/

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can read bookings by ID" ON public_site_visit_bookings;

-- Only authenticated users (admins) can read bookings
CREATE POLICY "Authenticated users can read bookings"
  ON public_site_visit_bookings
  FOR SELECT
  TO authenticated
  USING (true);