
-- Drop all existing bookings RLS policies (all are incorrectly RESTRICTIVE)
DROP POLICY IF EXISTS "Admins manage all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can create booking" ON public.bookings;
DROP POLICY IF EXISTS "Clients view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Clients view own bookings by user_id" ON public.bookings;

-- Recreate as PERMISSIVE policies (default AS PERMISSIVE)

-- Anyone can insert a booking (guests and logged-in users)
CREATE POLICY "Anyone can create booking"
  ON public.bookings
  FOR INSERT
  WITH CHECK (true);

-- Clients can view their own bookings by email
CREATE POLICY "Clients view own bookings by email"
  ON public.bookings
  FOR SELECT
  USING ((email = auth.email()) OR has_role(auth.uid(), 'admin'::app_role));

-- Clients can view their own bookings by user_id
CREATE POLICY "Clients view own bookings by user_id"
  ON public.bookings
  FOR SELECT
  USING ((client_user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Admins can do everything
CREATE POLICY "Admins manage all bookings"
  ON public.bookings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
