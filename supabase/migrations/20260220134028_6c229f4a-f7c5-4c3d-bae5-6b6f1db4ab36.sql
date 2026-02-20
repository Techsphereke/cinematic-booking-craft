-- Drop the broken restrictive INSERT policy on bookings
DROP POLICY IF EXISTS "Anyone can create booking" ON public.bookings;

-- Create a proper PERMISSIVE INSERT policy that allows anyone (logged in or not) to create a booking
CREATE POLICY "Anyone can create booking"
ON public.bookings
FOR INSERT
WITH CHECK (true);