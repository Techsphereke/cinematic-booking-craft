
-- Create app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'client');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create services table (admin can edit rates)
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 150.00,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Seed services
INSERT INTO public.services (name, slug, description, hourly_rate, icon) VALUES
  ('Photography', 'photography', 'Professional photography capturing life''s most meaningful moments with precision and artistry.', 150.00, 'camera'),
  ('Videography', 'videography', 'Cinematic videography that tells your story in stunning visual narratives.', 200.00, 'video'),
  ('Event Hosting', 'event-hosting', 'Professional MC and hosting services to elevate your event experience.', 180.00, 'mic'),
  ('Event Planning', 'event-planning', 'End-to-end event planning and coordination for flawless execution.', 120.00, 'calendar');

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_ref TEXT NOT NULL UNIQUE,
  client_user_id UUID,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  event_type TEXT NOT NULL,
  service_id UUID REFERENCES public.services(id),
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_hours NUMERIC(5,2),
  attendees INTEGER,
  location TEXT NOT NULL,
  special_notes TEXT,
  hourly_rate NUMERIC(10,2) NOT NULL,
  estimated_total NUMERIC(10,2) NOT NULL,
  deposit_amount NUMERIC(10,2) NOT NULL,
  remaining_balance NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_deposit' CHECK (status IN ('pending_deposit','deposit_paid','fully_paid','cancelled','completed')),
  stripe_deposit_session_id TEXT,
  stripe_balance_session_id TEXT,
  stripe_deposit_payment_intent TEXT,
  stripe_balance_payment_intent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blocked_dates table
CREATE TABLE public.blocked_dates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocked_date DATE NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create projects table (client delivery)
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id),
  client_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  preview_gallery_urls TEXT[] DEFAULT '{}',
  preview_video_url TEXT,
  full_gallery_urls TEXT[] DEFAULT '{}',
  full_video_url TEXT,
  watermarked BOOLEAN NOT NULL DEFAULT true,
  content_locked BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','preview_ready','fully_unlocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create portfolio table
CREATE TABLE public.portfolio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('weddings','corporate','birthdays','hosting')),
  image_url TEXT NOT NULL,
  video_url TEXT,
  description TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Seed portfolio items
INSERT INTO public.portfolio (title, category, image_url, description, featured, sort_order) VALUES
  ('Elegance in Gold', 'weddings', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800', 'A stunning outdoor wedding ceremony at sunset', true, 1),
  ('Corporate Summit 2024', 'corporate', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', 'Full coverage of the annual London tech summit', false, 2),
  ('Royal Birthday Gala', 'birthdays', 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800', 'Luxury 40th birthday celebration at The Savoy', true, 3),
  ('Grand Charity Gala', 'hosting', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800', 'Hosted and filmed the annual charity gala evening', false, 4);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;

-- Security definer function for role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles RLS
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User roles RLS
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Services RLS (public read, admin write)
CREATE POLICY "Public can view services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Admins can manage services" ON public.services FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Bookings RLS
CREATE POLICY "Anyone can create booking" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Clients view own bookings" ON public.bookings FOR SELECT USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage all bookings" ON public.bookings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Blocked dates RLS
CREATE POLICY "Public can view blocked dates" ON public.blocked_dates FOR SELECT USING (true);
CREATE POLICY "Admins manage blocked dates" ON public.blocked_dates FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Projects RLS
CREATE POLICY "Clients view own projects" ON public.projects FOR SELECT USING (client_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage all projects" ON public.projects FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Portfolio RLS (public read, admin write)
CREATE POLICY "Public can view portfolio" ON public.portfolio FOR SELECT USING (true);
CREATE POLICY "Admins manage portfolio" ON public.portfolio FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Booking ref generator
CREATE OR REPLACE FUNCTION public.generate_booking_ref()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'JTS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6));
END;
$$;

-- Timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
