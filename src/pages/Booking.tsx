import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Calendar, Clock, MapPin, Users, PoundSterling, CheckCircle, Loader2 } from "lucide-react";
import CostCalculator from "@/components/CostCalculator";

interface Service {
  id: string;
  name: string;
  slug: string;
  hourly_rate: number;
}

const eventTypes = [
  "Wedding", "Corporate Event", "Birthday Celebration", "Anniversary",
  "Live Show / Performance", "Charity Gala", "Product Launch", "Conference",
  "Award Ceremony", "Private Party", "Other",
];

export default function Booking() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    event_type: "",
    service_id: "",
    event_date: "",
    start_time: "",
    end_time: "",
    attendees: "",
    location: "",
    special_notes: "",
  });

  const selectedService = services.find((s) => s.id === form.service_id);
  const totalHours = (() => {
    if (!form.start_time || !form.end_time) return 0;
    const [sh, sm] = form.start_time.split(":").map(Number);
    const [eh, em] = form.end_time.split(":").map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return Math.max(0, diff / 60);
  })();
  const estimatedTotal = selectedService ? totalHours * selectedService.hourly_rate : 0;
  const depositAmount = estimatedTotal * 0.3;
  const remainingBalance = estimatedTotal - depositAmount;

  useEffect(() => {
    const fetchData = async () => {
      const [servRes, blockedRes] = await Promise.all([
        supabase.from("services").select("*").order("name"),
        supabase.from("blocked_dates").select("blocked_date"),
      ]);
      if (servRes.data) setServices(servRes.data);
      if (blockedRes.data) setBlockedDates(blockedRes.data.map((d) => d.blocked_date));
    };
    fetchData();

    const serviceParam = searchParams.get("service");
    if (serviceParam) {
      setTimeout(() => {
        setServices((prev) => {
          const match = prev.find((s) => s.slug === serviceParam);
          if (match) setForm((f) => ({ ...f, service_id: match.id }));
          return prev;
        });
      }, 500);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      setForm((f) => ({ ...f, email: user.email || "" }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.service_id) return toast({ title: "Please select a service", variant: "destructive" });
    if (totalHours <= 0) return toast({ title: "End time must be after start time", variant: "destructive" });
    if (blockedDates.includes(form.event_date)) {
      return toast({ title: "This date is unavailable. Please choose another date.", variant: "destructive" });
    }

    setLoading(true);
    try {
      // Check existing bookings on that date for this service
      const { data: existing } = await supabase
        .from("bookings")
        .select("id")
        .eq("event_date", form.event_date)
        .eq("service_id", form.service_id)
        .neq("status", "cancelled");

      if (existing && existing.length > 0) {
        toast({ title: "This date is already booked for the selected service. Please choose another date.", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Generate booking ref
      const { data: refData } = await supabase.rpc("generate_booking_ref");
      const ref = refData || `JTS-${Date.now()}`;

      const { data: booking, error } = await supabase.from("bookings").insert({
        booking_ref: ref,
        client_user_id: user?.id || null,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        event_type: form.event_type,
        service_id: form.service_id,
        event_date: form.event_date,
        start_time: form.start_time,
        end_time: form.end_time,
        total_hours: totalHours,
        attendees: form.attendees ? parseInt(form.attendees) : null,
        location: form.location,
        special_notes: form.special_notes || null,
        hourly_rate: selectedService!.hourly_rate,
        estimated_total: estimatedTotal,
        deposit_amount: depositAmount,
        remaining_balance: remainingBalance,
        status: "pending_deposit",
      }).select().single();

      if (error) throw error;

      setBookingRef(ref);
      setSubmitted(true);

      // Send confirmation emails (fire & forget — don't block payment)
      if (booking) {
        const clientEmailHtml = `
          <div style="font-family:'Montserrat',sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:40px;border:1px solid #e8e0d4;">
            <h2 style="font-family:'Cormorant Garamond',serif;color:#7a5a1e;margin-bottom:8px;">Booking Confirmed — ${ref}</h2>
            <p style="color:#444;font-size:14px;">Dear ${form.full_name},</p>
            <p style="color:#444;font-size:14px;">Thank you for booking with <strong>JT Studios & Events</strong>. Your booking has been received and is awaiting your 30% deposit to confirm your date.</p>
            <table style="width:100%;border-collapse:collapse;margin:24px 0;">
              <tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Booking Ref</td><td style="padding:8px 0;font-size:12px;font-weight:600;border-bottom:1px solid #eee;">${ref}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Service</td><td style="padding:8px 0;font-size:12px;border-bottom:1px solid #eee;">${selectedService!.name}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Event Date</td><td style="padding:8px 0;font-size:12px;border-bottom:1px solid #eee;">${form.event_date}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Event Type</td><td style="padding:8px 0;font-size:12px;border-bottom:1px solid #eee;">${form.event_type}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Location</td><td style="padding:8px 0;font-size:12px;border-bottom:1px solid #eee;">${form.location}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Deposit Due (30%)</td><td style="padding:8px 0;font-size:12px;font-weight:600;color:#7a5a1e;border-bottom:1px solid #eee;">£${depositAmount.toFixed(2)}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:12px;">Total Estimated</td><td style="padding:8px 0;font-size:12px;">£${estimatedTotal.toFixed(2)}</td></tr>
            </table>
            <p style="color:#444;font-size:13px;">You will be redirected to our secure payment page to pay your 30% deposit. If not, please contact us at <a href="mailto:bookings@jtstudios.events" style="color:#7a5a1e;">bookings@jtstudios.events</a>.</p>
            <p style="color:#888;font-size:12px;margin-top:32px;">JT Studios & Events · +44 7916 843781</p>
          </div>`;

        const adminEmailHtml = `
          <div style="font-family:'Montserrat',sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:40px;border:1px solid #e8e0d4;">
            <h2 style="font-family:'Cormorant Garamond',serif;color:#7a5a1e;">New Booking — ${ref}</h2>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Client</td><td style="padding:8px 0;font-size:12px;border-bottom:1px solid #eee;">${form.full_name}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Email</td><td style="padding:8px 0;font-size:12px;border-bottom:1px solid #eee;">${form.email}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Phone</td><td style="padding:8px 0;font-size:12px;border-bottom:1px solid #eee;">${form.phone}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Service</td><td style="padding:8px 0;font-size:12px;border-bottom:1px solid #eee;">${selectedService!.name}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Event Date</td><td style="padding:8px 0;font-size:12px;border-bottom:1px solid #eee;">${form.event_date}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Event Type</td><td style="padding:8px 0;font-size:12px;border-bottom:1px solid #eee;">${form.event_type}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Location</td><td style="padding:8px 0;font-size:12px;border-bottom:1px solid #eee;">${form.location}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Deposit (30%)</td><td style="padding:8px 0;font-size:12px;font-weight:600;color:#7a5a1e;border-bottom:1px solid #eee;">£${depositAmount.toFixed(2)}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:12px;">Total</td><td style="padding:8px 0;font-size:12px;">£${estimatedTotal.toFixed(2)}</td></tr>
            </table>
            ${form.special_notes ? `<p style="font-size:12px;color:#444;"><strong>Notes:</strong> ${form.special_notes}</p>` : ''}
          </div>`;

        Promise.all([
          supabase.functions.invoke("send-email", {
            body: { to: form.email, subject: `Booking Confirmed — ${ref} | JT Studios & Events`, html: clientEmailHtml },
          }),
          supabase.functions.invoke("send-email", {
            body: { to: "bookings@jtstudios.events", subject: `New Booking — ${ref} — ${form.full_name}`, html: adminEmailHtml },
          }),
        ]).catch(console.error);
      }

      // Trigger deposit payment
      if (booking) {
        const { data: sessionData, error: stripeError } = await supabase.functions.invoke("create-booking-payment", {
          body: {
            booking_id: booking.id,
            amount: Math.round(depositAmount * 100),
            booking_ref: ref,
            service_name: selectedService!.name,
            deposit: true,
          },
        });

        if (stripeError || !sessionData?.url) {
          toast({ title: "Booking saved! We'll be in touch with payment details." });
          return;
        }

        // Use window.top to break out of preview iframes, fallback to window.open
        if (window.top) {
          window.top.location.href = sessionData.url;
        } else {
          window.open(sessionData.url, "_blank");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Booking failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen px-6">
          <div className="text-center max-w-md">
            <CheckCircle className="text-primary mx-auto mb-6" size={48} />
            <h2 className="font-display text-4xl text-foreground mb-4">Booking Submitted</h2>
            <p className="font-body text-muted-foreground mb-2">Reference: <span className="text-primary">{bookingRef}</span></p>
            <p className="font-body text-muted-foreground text-sm">Redirecting to secure payment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar />

      <div className="pt-32 pb-10 text-center px-6">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-body text-primary text-xs tracking-[0.4em] uppercase mb-4">
          Secure Your Date
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display text-6xl text-foreground mb-4">
          Book Your Event
        </motion.h1>
        <p className="font-body text-muted-foreground text-sm max-w-lg mx-auto">
          Complete the form below. A 30% deposit via Stripe secures your date — remaining balance due on completion.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-12 pb-24 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORM */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="border border-border p-8 bg-card">
            <h3 className="font-display text-2xl text-foreground mb-6">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Full Name *</label>
                <input name="full_name" value={form.full_name} onChange={handleChange} required
                  className="w-full bg-input border border-border text-foreground px-4 py-3 font-body text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required
                  className="w-full bg-input border border-border text-foreground px-4 py-3 font-body text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div className="md:col-span-2">
                <label className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Phone *</label>
                <input name="phone" type="tel" value={form.phone} onChange={handleChange} required
                  className="w-full bg-input border border-border text-foreground px-4 py-3 font-body text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="border border-border p-8 bg-card">
            <h3 className="font-display text-2xl text-foreground mb-6">Event Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Service *</label>
                <select name="service_id" value={form.service_id} onChange={handleChange} required
                  className="w-full bg-input border border-border text-foreground px-4 py-3 font-body text-sm focus:outline-none focus:border-primary transition-colors">
                  <option value="">Select a service</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — £{s.hourly_rate}/hr</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Event Type *</label>
                <select name="event_type" value={form.event_type} onChange={handleChange} required
                  className="w-full bg-input border border-border text-foreground px-4 py-3 font-body text-sm focus:outline-none focus:border-primary transition-colors">
                  <option value="">Select event type</option>
                  {eventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 flex items-center gap-2">
                  <Calendar size={12} /> Event Date *
                </label>
                <input name="event_date" type="date" value={form.event_date} onChange={handleChange} required
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full bg-input border border-border text-foreground px-4 py-3 font-body text-sm focus:outline-none focus:border-primary transition-colors" />
                {blockedDates.includes(form.event_date) && (
                  <p className="text-destructive text-xs mt-1">This date is unavailable</p>
                )}
              </div>
              <div>
                <label className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 flex items-center gap-2">
                  <Users size={12} /> Attendees
                </label>
                <input name="attendees" type="number" value={form.attendees} onChange={handleChange} min="1"
                  className="w-full bg-input border border-border text-foreground px-4 py-3 font-body text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 flex items-center gap-2">
                  <Clock size={12} /> Start Time *
                </label>
                <input name="start_time" type="time" value={form.start_time} onChange={handleChange} required
                  className="w-full bg-input border border-border text-foreground px-4 py-3 font-body text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 flex items-center gap-2">
                  <Clock size={12} /> End Time *
                </label>
                <input name="end_time" type="time" value={form.end_time} onChange={handleChange} required
                  className="w-full bg-input border border-border text-foreground px-4 py-3 font-body text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div className="md:col-span-2">
                <label className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 flex items-center gap-2">
                  <MapPin size={12} /> Event Location *
                </label>
                <input name="location" value={form.location} onChange={handleChange} required
                  placeholder="Venue name, city, postcode"
                  className="w-full bg-input border border-border text-foreground px-4 py-3 font-body text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div className="md:col-span-2">
                <label className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Special Notes</label>
                <textarea name="special_notes" value={form.special_notes} onChange={handleChange} rows={3}
                  placeholder="Any specific requirements, timeline details, or requests..."
                  className="w-full bg-input border border-border text-foreground px-4 py-3 font-body text-sm focus:outline-none focus:border-primary transition-colors resize-none" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-primary text-primary-foreground font-body text-xs tracking-[0.3em] uppercase hover:bg-primary-light transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <PoundSterling size={16} />}
            {loading ? "Processing..." : "Confirm & Pay 30% Deposit"}
          </button>
        </form>

        {/* COST SUMMARY */}
        <div className="space-y-4">
          <div className="border border-border p-6 bg-card sticky top-24">
            <h3 className="font-display text-2xl text-foreground mb-6">Cost Summary</h3>
            <div className="space-y-4">
              {selectedService ? (
                <>
                  <div className="flex justify-between">
                    <span className="font-body text-xs text-muted-foreground">Service</span>
                    <span className="font-body text-xs text-foreground">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-body text-xs text-muted-foreground">Rate</span>
                    <span className="font-body text-xs text-foreground">£{selectedService.hourly_rate}/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-body text-xs text-muted-foreground">Duration</span>
                    <span className="font-body text-xs text-foreground">{totalHours.toFixed(1)} hrs</span>
                  </div>
                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-body text-xs text-muted-foreground">Estimated Total</span>
                      <span className="font-body text-sm text-foreground">£{estimatedTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="font-body text-xs text-primary">30% Deposit (due now)</span>
                      <span className="font-body text-sm text-primary font-medium">£{depositAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-body text-xs text-muted-foreground">Balance (on completion)</span>
                      <span className="font-body text-xs text-muted-foreground">£{remainingBalance.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="font-body text-xs text-muted-foreground">Select a service to see pricing</p>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-border space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle size={12} className="text-primary mt-0.5 flex-shrink-0" />
                <span className="font-body text-xs text-muted-foreground">Secure Stripe payment</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={12} className="text-primary mt-0.5 flex-shrink-0" />
                <span className="font-body text-xs text-muted-foreground">Date locked upon deposit</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={12} className="text-primary mt-0.5 flex-shrink-0" />
                <span className="font-body text-xs text-muted-foreground">Confirmation email sent</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={12} className="text-primary mt-0.5 flex-shrink-0" />
                <span className="font-body text-xs text-muted-foreground">GDPR compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <CostCalculator />
    </div>
  );
}
