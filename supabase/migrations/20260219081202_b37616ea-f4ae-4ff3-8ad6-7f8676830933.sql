
-- Create quote_requests table for client quote inquiries
CREATE TABLE IF NOT EXISTS public.quote_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  event_type TEXT NOT NULL,
  service_interest TEXT NOT NULL,
  event_date TEXT,
  guests_estimate INTEGER,
  location TEXT,
  budget_range TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a quote request (public form)
CREATE POLICY "Anyone can submit a quote request"
  ON public.quote_requests
  FOR INSERT
  WITH CHECK (true);

-- Only admins can view all quote requests
CREATE POLICY "Admins can view all quote requests"
  ON public.quote_requests
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update quote requests
CREATE POLICY "Admins can update quote requests"
  ON public.quote_requests
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to update updated_at
CREATE TRIGGER update_quote_requests_updated_at
  BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
