import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowDown, Camera, Video, Mic, CalendarDays, Star, Phone, Mail, Quote } from "lucide-react";
import Navbar from "@/components/Navbar";
import heroBg from "@/assets/hero-bg.jpg";
import servicePhotography from "@/assets/service-photography.jpg";
import serviceVideography from "@/assets/service-videography.jpg";
import serviceHosting from "@/assets/service-hosting.jpg";
import servicePlanning from "@/assets/service-planning.jpg";
import jtsLogo from "@/assets/jts-logo.png";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Get a Quote", href: "/quote" },
  { label: "Book Now", href: "/booking" },
];

const services = [
  { icon: Camera, title: "Photography", rate: "£150/hr", image: servicePhotography, href: "/services#photography" },
  { icon: Video, title: "Videography", rate: "£200/hr", image: serviceVideography, href: "/services#videography" },
  { icon: Mic, title: "Event Hosting", rate: "£180/hr", image: serviceHosting, href: "/services#hosting" },
  { icon: CalendarDays, title: "Event Planning", rate: "£120/hr", image: servicePlanning, href: "/services#planning" },
];

const testimonials = [
  {
    name: "Amara O.",
    event: "Wedding, London",
    text: "JT Studios exceeded every expectation. The photos were breathtaking — our guests still talk about how beautifully the day was captured.",
    stars: 5,
  },
  {
    name: "Marcus P.",
    event: "Corporate Summit, Birmingham",
    text: "Professional from start to finish. The highlight reel they delivered made our entire company look world-class.",
    stars: 5,
  },
  {
    name: "Sophia K.",
    event: "Birthday Gala, Manchester",
    text: "The hosting alone made the night. JT Studios turned our event into an unforgettable cinematic experience.",
    stars: 5,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  }),
};

export default function Index() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <div className="bg-background min-h-screen overflow-x-hidden">
      <Navbar />

      {/* ─── HERO ─── */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Parallax BG */}
        <motion.div style={{ y, scale }} className="absolute inset-0">
          <img src={heroBg} alt="JT Studios hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 hero-overlay" />
          {/* animated grain overlay */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")", backgroundRepeat: "repeat", backgroundSize: "128px" }} />
        </motion.div>

        {/* Floating orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0], opacity: [0.06, 0.15, 0.06] }}
            transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-primary blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -20, 0], y: [0, 30, 0], opacity: [0.04, 0.1, 0.04] }}
            transition={{ repeat: Infinity, duration: 16, ease: "easeInOut", delay: 3 }}
            className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-primary blur-3xl"
          />
        </div>

        <motion.div style={{ opacity }} className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center mb-6"
          >
            <img src={jtsLogo} alt="JT Studios Logo" className="h-24 w-auto animate-float drop-shadow-2xl" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.8em" }}
            animate={{ opacity: 1, letterSpacing: "0.4em" }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="font-body text-primary text-xs uppercase tracking-[0.4em] mb-6"
          >
            UK's Premium Studio & Events
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-6xl md:text-8xl lg:text-9xl text-foreground leading-[0.9] mb-8"
          >
            We Capture<br />
            <span className="text-gold-gradient italic">Your Story.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="font-body text-muted-foreground text-sm md:text-base tracking-widest max-w-xl mx-auto mb-12"
          >
            Photography · Videography · Event Hosting · Event Planning
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/booking"
              className="font-body text-xs tracking-[0.3em] uppercase px-10 py-4 bg-primary text-primary-foreground hover:bg-primary-light transition-all duration-300 shadow-gold"
            >
              Book Your Event
            </Link>
            <Link
              to="/quote"
              className="font-body text-xs tracking-[0.3em] uppercase px-10 py-4 border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            >
              Get a Quote
            </Link>
            <Link
              to="/portfolio"
              className="font-body text-xs tracking-[0.3em] uppercase px-10 py-4 border border-foreground/30 text-foreground hover:border-primary hover:text-primary transition-all duration-300"
            >
              View Portfolio
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-muted-foreground"
        >
          <ArrowDown size={20} />
        </motion.div>
      </section>

      {/* ─── STATS STRIP ─── */}
      <section className="py-16 border-y border-border bg-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/3 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
          {[
            { num: "80+", label: "Events Captured" },
            { num: "5★", label: "Average Rating" },
            { num: "4", label: "Specialist Services" },
            { num: "UK", label: "Based & Travelling" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              variants={fadeUp}
              viewport={{ once: true }}
            >
              <p className="font-display text-4xl text-primary mb-1 animate-shimmer">{stat.num}</p>
              <p className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── SERVICES PREVIEW ─── */}
      <section className="section-padding max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-body text-primary text-xs tracking-[0.4em] uppercase mb-4"
          >
            What We Offer
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="font-display text-5xl md:text-6xl text-foreground"
          >
            Our Services
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              variants={fadeUp}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
              className="group relative overflow-hidden aspect-[3/4] cursor-pointer"
            >
              <img
                src={service.image}
                alt={service.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              {/* shimmer on hover */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: "linear-gradient(135deg, transparent 30%, hsl(43 74% 60% / 0.07) 50%, transparent 70%)" }}
              />
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <service.icon className="text-primary mb-3" size={24} />
                <h3 className="font-display text-2xl text-foreground mb-1">{service.title}</h3>
                <p className="font-body text-primary text-sm tracking-widest">{service.rate}</p>
                <Link
                  to={service.href}
                  className="mt-4 font-body text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100 duration-300"
                >
                  Learn More →
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/services"
            className="font-body text-xs tracking-[0.3em] uppercase border border-primary text-primary px-10 py-4 hover:bg-primary hover:text-primary-foreground transition-all duration-300 inline-block"
          >
            All Services & Pricing
          </Link>
        </div>
      </section>

      {/* ─── QUOTE BANNER ─── */}
      <section className="py-20 bg-card border-y border-border relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ x: [-50, 50, -50], opacity: [0.04, 0.1, 0.04] }}
            transition={{ repeat: Infinity, duration: 20, ease: "easeInOut" }}
            className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-primary to-transparent"
          />
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Quote className="text-primary mx-auto mb-6" size={32} />
            <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
              Need a Custom Package?
            </h2>
            <p className="font-body text-muted-foreground text-sm mb-8 max-w-lg mx-auto">
              Bundle services for discounted rates. Share your vision and we'll craft a tailored proposal — no obligation, just a conversation.
            </p>
            <Link
              to="/quote"
              className="font-body text-sm tracking-[0.3em] uppercase px-12 py-5 bg-primary text-primary-foreground hover:bg-primary-light transition-all duration-300 shadow-gold inline-block"
            >
              Request a Free Quote
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <p className="font-body text-primary text-xs tracking-[0.4em] uppercase mb-4">Client Words</p>
            <h2 className="font-display text-5xl text-foreground">What They Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                variants={fadeUp}
                viewport={{ once: true }}
                className="glass-card p-8 border border-border hover:border-primary/30 transition-all duration-500 group"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} size={12} className="text-primary fill-primary" />
                  ))}
                </div>
                <p className="font-display text-lg text-foreground italic leading-relaxed mb-6">"{t.text}"</p>
                <div>
                  <p className="font-body text-sm text-foreground font-medium">{t.name}</p>
                  <p className="font-body text-xs text-muted-foreground tracking-widest">{t.event}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 px-6 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          viewport={{ once: true }}
        >
          <span className="gold-line mx-auto mb-8 block" />
          <h2 className="font-display text-5xl md:text-6xl text-foreground mb-6">
            Ready to Create<br />
            <span className="text-gold-gradient italic">Something Unforgettable?</span>
          </h2>
          <p className="font-body text-muted-foreground text-sm tracking-wider max-w-lg mx-auto mb-10">
            Book your session today. A 30% deposit secures your date — full balance due on completion.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/booking"
              className="font-body text-sm tracking-[0.3em] uppercase px-14 py-5 bg-primary text-primary-foreground hover:bg-primary-light transition-all duration-300 shadow-gold inline-block"
            >
              Book Now
            </Link>
            <Link
              to="/quote"
              className="font-body text-sm tracking-[0.3em] uppercase px-14 py-5 border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 inline-block"
            >
              Get a Quote First
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border py-12 px-6 bg-card">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={jtsLogo} alt="JT Studios" className="h-12 w-auto" />
              <p className="font-display text-foreground tracking-widest">JT Studios & Events</p>
            </div>
            <p className="font-body text-muted-foreground text-xs leading-relaxed">
              Premium cinematic photography, videography, and event services across the UK.
            </p>
          </div>
          <div>
            <p className="font-body text-xs tracking-[0.3em] uppercase text-primary mb-4">Navigation</p>
            <ul className="space-y-2">
              {[...navLinks, { label: "Client Portal", href: "/portal" }].map((l) => (
                <li key={l.href}>
                  <Link to={l.href} className="font-body text-xs text-muted-foreground hover:text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-body text-xs tracking-[0.3em] uppercase text-primary mb-4">Contact</p>
            <div className="space-y-2">
              <a href="tel:+447916843781" className="flex items-center gap-2 font-body text-xs text-muted-foreground hover:text-primary transition-colors">
                <Phone size={12} />
                +44 7916 843781
              </a>
              <a href="mailto:info@jtstudios.events" className="flex items-center gap-2 font-body text-xs text-muted-foreground hover:text-primary transition-colors">
                <Mail size={12} />
                info@jtstudios.events
              </a>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border text-center">
          <p className="font-body text-xs text-muted-foreground tracking-widest">
            © {new Date().getFullYear()} JT Studios & Events · All Rights Reserved · UK Based
          </p>
        </div>
      </footer>
    </div>
  );
}
