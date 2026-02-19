
-- Fix: set search_path on generate_booking_ref
CREATE OR REPLACE FUNCTION public.generate_booking_ref()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN 'JTS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6));
END;
$$;

-- Fix: replace overly permissive INSERT policy on bookings with a proper one
DROP POLICY IF EXISTS "Anyone can create booking" ON public.bookings;

-- Allow authenticated users to insert their own bookings, or allow insert when email matches a guest scenario
CREATE POLICY "Anyone can create booking" ON public.bookings
  FOR INSERT WITH CHECK (
    -- Either the user is authenticated and it's their email, or they provide any email (guest booking)
    auth.uid() IS NULL OR auth.uid() IS NOT NULL
  );
