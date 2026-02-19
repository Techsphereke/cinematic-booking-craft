import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { MessageSquare, Phone, Mail, Send, CheckCircle, Loader2, Calendar, Users, MapPin, PoundSterling } from "lucide-react";

const serviceOptions = ["Photography", "Videography", "Event Hosting", "Event Planning", "Multiple Services (Bundle)"];
const eventTypes = [
  "Wedding", "Corporate Event", "Birthday Celebration", "Anniversary",
  "Live Show / Performance", "Charity Gala", "Product Launch", "Conference",
  "Award Ceremony", "Private Party", "Other",
];
const budgetRanges = [
  "Under £500", "£500 – £1,000", "£1,000 – £2,500",
  "£2,500 – £5,000", "£5,000 – £10,000", "£10,000+", "Flexible / TBD",
];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }),
};

export default function Quote() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    event_type: "",
    service_interest: "",
    event_date: "",
    guests_estimate: "",
    location: "",
    budget_range: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.phone || !form.service_interest || !form.message) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("quote_requests").insert({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        event_type: form.event_type || "Not specified",
        service_interest: form.service_interest,
        event_date: form.event_date || null,
        guests_estimate: form.guests_estimate ? parseInt(form.guests_estimate) : null,
        location: form.location || null,
        budget_range: form.budget_range || null,
        message: form.message,
      });
      if (error) throw error;

      // Send confirmation emails (fire & forget)
      const clientHtml = `
        <div style="font-family:'Montserrat',sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:40px;border:1px solid #e8e0d4;">
          <h2 style="font-family:'Cormorant Garamond',serif;color:#7a5a1e;">Quote Request Received</h2>
          <p style="color:#444;font-size:14px;">Dear ${form.full_name},</p>
          <p style="color:#444;font-size:14px;">Thank you for reaching out to <strong>JT Studios & Events</strong>. We've received your quote request and our team will review it and respond within <strong>24–48 hours</strong>.</p>
          <table style="width:100%;border-collapse:collapse;margin:24px 0;">
            <tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Service Interest</td><td style="padding:8px 0;font-size:12px;border-bottom:1px solid #eee;">${form.service_interest}</td></tr>
            ${form.event_type ? `<tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Event Type</td><td style="padding:8px 0;font-size:12px;border-bottom:1px solid #eee;">${form.event_type}</td></tr>` : ''}
            ${form.event_date ? `<tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Approximate Date</td><td style="padding:8px 0;font-size:12px;border-bottom:1px solid #eee;">${form.event_date}</td></tr>` : ''}
            ${form.budget_range ? `<tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Budget Range</td><td style="padding:8px 0;font-size:12px;border-bottom:1px solid #eee;">${form.budget_range}</td></tr>` : ''}
          </table>
          <p style="color:#444;font-size:13px;">A member of our team will be in touch shortly. In the meantime, feel free to contact us at <a href="mailto:bookings@jtstudios.events" style="color:#7a5a1e;">bookings@jtstudios.events</a> or call <strong>+44 7916 843781</strong>.</p>
          <p style="color:#888;font-size:12px;margin-top:32px;">JT Studios & Events</p>
        </div>`;

      const adminHtml = `
        <div style="font-family:'Montserrat',sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:40px;border:1px solid #e8e0d4;">
          <h2 style="font-family:'Cormorant Garamond',serif;color:#7a5a1e;">New Quote Request</h2>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Name</td><td style="padding:8px 0;font-size:12px;border-bottom:1px solid #eee;">${form.full_name}</td></tr>
            <tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Email</td><td style="padding:8px 0;font-size:12px;border-bottom:1px solid #eee;">${form.email}</td></tr>
            <tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Phone</td><td style="padding:8px 0;font-size:12px;border-bottom:1px solid #eee;">${form.phone}</td></tr>
            <tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Service</td><td style="padding:8px 0;font-size:12px;border-bottom:1px solid #eee;">${form.service_interest}</td></tr>
            ${form.event_type ? `<tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Event Type</td><td style="padding:8px 0;font-size:12px;border-bottom:1px solid #eee;">${form.event_type}</td></tr>` : ''}
            ${form.event_date ? `<tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Date</td><td style="padding:8px 0;font-size:12px;border-bottom:1px solid #eee;">${form.event_date}</td></tr>` : ''}
            ${form.location ? `<tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Location</td><td style="padding:8px 0;font-size:12px;border-bottom:1px solid #eee;">${form.location}</td></tr>` : ''}
            ${form.budget_range ? `<tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Budget</td><td style="padding:8px 0;font-size:12px;border-bottom:1px solid #eee;">${form.budget_range}</td></tr>` : ''}
            ${form.guests_estimate ? `<tr><td style="padding:8px 0;color:#888;font-size:12px;border-bottom:1px solid #eee;">Guests</td><td style="padding:8px 0;font-size:12px;border-bottom:1px solid #eee;">${form.guests_estimate}</td></tr>` : ''}
          </table>
          <p style="font-size:12px;color:#444;"><strong>Message:</strong><br/>${form.message}</p>
        </div>`;

      Promise.all([
        supabase.functions.invoke("send-email", {
          body: { to: form.email, subject: "Quote Request Received — JT Studios & Events", html: clientHtml },
        }),
        supabase.functions.invoke("send-email", {
          body: { to: "bookings@jtstudios.events", subject: `New Quote Request — ${form.full_name} — ${form.service_interest}`, html: adminHtml },
        }),
      ]).catch(console.error);

      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="min-h-screen flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-lg"
          >
            <div className="w-20 h-20 border border-primary flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="text-primary" size={36} />
            </div>
            <h2 className="font-display text-5xl text-foreground mb-4">Quote Received</h2>
            <div className="gold-line mx-auto mb-6" />
            <p className="font-body text-muted-foreground leading-relaxed mb-8">
              Thank you for reaching out. Our team will review your request and get back to you within <span className="text-primary">24–48 hours</span> with a personalised quote and next steps.
            </p>
            <div className="space-y-3 text-left border border-border p-6 bg-card mb-8">
              <p className="font-body text-xs tracking-[0.3em] uppercase text-primary mb-3">What happens next?</p>
              {[
                "We review your event requirements",
                "A JT Studios representative contacts you directly",
                "We prepare a detailed, personalised quote",
                "You decide how to proceed — no obligation",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="font-display text-primary text-lg leading-none">{i + 1}.</span>
                  <p className="font-body text-xs text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
            <a href="/" className="font-body text-xs tracking-[0.3em] uppercase border border-primary text-primary px-10 py-4 hover:bg-primary hover:text-primary-foreground transition-all duration-300 inline-block">
              Back to Home
            </a>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar />

      {/* ANIMATED HEADER */}
      <div className="relative pt-32 pb-16 text-center px-6 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.12, 0.05] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            className="absolute -top-20 left-1/4 w-96 h-96 rounded-full bg-primary blur-3xl"
          />
          <motion.div
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.08, 0.04, 0.08] }}
            transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 2 }}
            className="absolute top-0 right-1/4 w-64 h-64 rounded-full bg-primary blur-3xl"
          />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="font-body text-primary text-xs tracking-[0.4em] uppercase mb-4 relative z-10"
        >
          Let's Talk
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="font-display text-6xl md:text-7xl text-foreground mb-4 relative z-10"
        >
          Request a Quote
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="font-body text-muted-foreground text-sm max-w-xl mx-auto relative z-10"
        >
          Tell us about your vision and we'll craft a personalised proposal. No commitment required — just a conversation.
        </motion.p>
      </div>

      {/* CONTACT CHIPS */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Phone, label: "Call Us", value: "+44 7916 843781", href: "tel:+447916843781" },
            { icon: Mail, label: "Email Us", value: "info@jtstudios.events", href: "mailto:info@jtstudios.events" },
            { icon: MessageSquare, label: "Response Time", value: "Within 24–48 hours", href: "#form" },
          ].map((item, i) => (
            <motion.a
              key={item.label}
              href={item.href}
              custom={i}
              initial="hidden"
              whileInView="visible"
              variants={fadeUp}
              viewport={{ once: true }}
              className="flex items-center gap-4 border border-border bg-card p-5 hover:border-primary transition-all duration-300 group"
            >
              <div className="w-10 h-10 border border-primary flex items-center justify-center group-hover:bg-primary transition-all duration-300">
                <item.icon size={16} className="text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <div>
                <p className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground">{item.label}</p>
                <p className="font-body text-sm text-foreground">{item.value}</p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>

      {/* FORM */}
      <div id="form" className="max-w-7xl mx-auto px-6 md:px-12 pb-24 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="border border-border p-8 bg-card"
          >
            <h3 className="font-display text-2xl text-foreground mb-6">Your Details</h3>
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
                <label className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Phone Number *</label>
                <input name="phone" type="tel" value={form.phone} onChange={handleChange} required
                  className="w-full bg-input border border-border text-foreground px-4 py-3 font-body text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
            </div>
          </motion.div>

          {/* Event Details */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            viewport={{ once: true }}
            className="border border-border p-8 bg-card"
          >
            <h3 className="font-display text-2xl text-foreground mb-6">Event Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Service Required *</label>
                <select name="service_interest" value={form.service_interest} onChange={handleChange} required
                  className="w-full bg-input border border-border text-foreground px-4 py-3 font-body text-sm focus:outline-none focus:border-primary transition-colors">
                  <option value="">Select a service</option>
                  {serviceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Event Type</label>
                <select name="event_type" value={form.event_type} onChange={handleChange}
                  className="w-full bg-input border border-border text-foreground px-4 py-3 font-body text-sm focus:outline-none focus:border-primary transition-colors">
                  <option value="">Select event type</option>
                  {eventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 flex items-center gap-2">
                  <Calendar size={12} /> Approximate Event Date
                </label>
                <input name="event_date" type="date" value={form.event_date} onChange={handleChange}
                  className="w-full bg-input border border-border text-foreground px-4 py-3 font-body text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 flex items-center gap-2">
                  <Users size={12} /> Estimated Guests
                </label>
                <input name="guests_estimate" type="number" value={form.guests_estimate} onChange={handleChange} min="1"
                  placeholder="e.g. 100"
                  className="w-full bg-input border border-border text-foreground px-4 py-3 font-body text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 flex items-center gap-2">
                  <MapPin size={12} /> Event Location
                </label>
                <input name="location" value={form.location} onChange={handleChange}
                  placeholder="City, Venue or Region"
                  className="w-full bg-input border border-border text-foreground px-4 py-3 font-body text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 flex items-center gap-2">
                  <PoundSterling size={12} /> Budget Range
                </label>
                <select name="budget_range" value={form.budget_range} onChange={handleChange}
                  className="w-full bg-input border border-border text-foreground px-4 py-3 font-body text-sm focus:outline-none focus:border-primary transition-colors">
                  <option value="">Select budget range</option>
                  {budgetRanges.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Tell Us About Your Event *</label>
                <textarea name="message" value={form.message} onChange={handleChange} required rows={5}
                  placeholder="Describe your event vision, specific requirements, timeline, or anything you'd like us to know..."
                  className="w-full bg-input border border-border text-foreground px-4 py-3 font-body text-sm focus:outline-none focus:border-primary transition-colors resize-none" />
              </div>
            </div>
          </motion.div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-5 bg-primary text-primary-foreground font-body text-xs tracking-[0.3em] uppercase hover:bg-primary-light transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {loading ? "Sending Request..." : "Send Quote Request"}
          </motion.button>
        </form>

        {/* SIDEBAR */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="border border-border bg-card p-6 sticky top-24"
          >
            <p className="font-body text-xs tracking-[0.3em] uppercase text-primary mb-6">Why Choose JT Studios?</p>
            <div className="space-y-5">
              {[
                { title: "Personalised Service", desc: "Every event is unique — we tailor our approach to your specific vision and needs." },
                { title: "Transparent Pricing", desc: "No hidden fees. Clear, honest quotes with a simple 50% deposit structure." },
                { title: "UK-Wide Coverage", desc: "Based in the UK and available to travel nationwide for your event." },
                { title: "One-on-One Consultation", desc: "Your quote includes a free consultation call with our team to align on every detail." },
                { title: "Experienced Professionals", desc: "80+ events captured with consistently 5-star client satisfaction." },
              ].map((item, i) => (
                <div key={i} className="border-l border-primary pl-4">
                  <p className="font-body text-sm text-foreground mb-1">{item.title}</p>
                  <p className="font-body text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
