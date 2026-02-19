
-- Fix the "Clients view own bookings" policy that references auth.users directly
-- This causes "permission denied for table users" errors for all booking operations

DROP POLICY IF EXISTS "Clients view own bookings" ON public.bookings;

CREATE POLICY "Clients view own bookings"
ON public.bookings
FOR SELECT
USING (
  (email = auth.email()) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Also ensure authenticated clients can view bookings by their user_id
DROP POLICY IF EXISTS "Clients view own bookings by user_id" ON public.bookings;

CREATE POLICY "Clients view own bookings by user_id"
ON public.bookings
FOR SELECT
USING (
  (client_user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)
);
