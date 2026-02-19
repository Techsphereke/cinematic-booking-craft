import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowDown, Camera, Video, Mic, CalendarDays, Star, Phone, Mail, ChevronRight, Play } from "lucide-react";
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
  { icon: Camera, title: "Photography", rate: "£150/hr", image: servicePhotography, href: "/services#photography", desc: "Cinematic stills that tell your story forever." },
  { icon: Video, title: "Videography", rate: "£200/hr", image: serviceVideography, href: "/services#videography", desc: "High-definition film production for every moment." },
  { icon: Mic, title: "Event Hosting", rate: "£180/hr", image: serviceHosting, href: "/services#hosting", desc: "Dynamic MCs who command any room with energy." },
  { icon: CalendarDays, title: "Event Planning", rate: "£120/hr", image: servicePlanning, href: "/services#planning", desc: "Flawless coordination from vision to execution." },
];

const testimonials = [
  {
    name: "Amara O.",
    event: "Wedding · London",
    text: "JT Studios exceeded every expectation. The photos were breathtaking — our guests still talk about how beautifully the day was captured.",
    stars: 5,
  },
  {
    name: "Marcus P.",
    event: "Corporate Summit · Birmingham",
    text: "Professional from start to finish. The highlight reel they delivered made our entire company look world-class.",
    stars: 5,
  },
  {
    name: "Sophia K.",
    event: "Birthday Gala · Manchester",
    text: "The hosting alone made the night. JT Studios turned our event into an unforgettable cinematic experience.",
    stars: 5,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function Index() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);

  return (
    <div className="bg-background min-h-screen overflow-x-hidden">
      <Navbar />

      {/* ─── HERO ─── */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Parallax BG */}
        <motion.div style={{ y, scale }} className="absolute inset-0">
          <img src={heroBg} alt="JT Studios hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 hero-overlay" />
          {/* diagonal brand stripe */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: "repeating-linear-gradient(45deg, hsl(15,83%,50%) 0px, hsl(15,83%,50%) 1px, transparent 1px, transparent 40px)"
          }} />
        </motion.div>

        {/* Floating orbs — brand orange */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ x: [0, 40, 0], y: [0, -30, 0], opacity: [0.04, 0.14, 0.04] }}
            transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/5 w-96 h-96 rounded-full bg-primary blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -25, 0], y: [0, 35, 0], opacity: [0.03, 0.09, 0.03] }}
            transition={{ repeat: Infinity, duration: 18, ease: "easeInOut", delay: 4 }}
            className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-primary blur-3xl"
          />
        </div>

        <motion.div style={{ opacity }} className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center mb-8"
          >
            <div className="relative inline-block">
              <img src={jtsLogo} alt="JT Studios Logo" className="h-28 w-auto animate-float drop-shadow-2xl" />
              {/* glow ring */}
              <div className="absolute inset-0 rounded-full" style={{ boxShadow: "0 0 60px hsl(15,83%,50%,0.3)" }} />
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, letterSpacing: "1em" }}
            animate={{ opacity: 1, letterSpacing: "0.5em" }}
            transition={{ duration: 1.4, delay: 0.2 }}
            className="font-body text-primary text-[10px] uppercase tracking-[0.5em] mb-5"
          >
            UK's Premier Event Studio
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 70 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-6xl md:text-8xl lg:text-[9rem] text-white leading-[0.88] mb-8"
          >
            We Capture<br />
            <span className="text-brand-gradient italic">Your Story.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.85 }}
            className="font-body text-white/70 text-xs md:text-sm tracking-widest max-w-xl mx-auto mb-12"
          >
            Photography · Videography · Event Hosting · Event Planning
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/booking"
              className="font-body text-xs tracking-[0.3em] uppercase px-10 py-4 bg-primary text-white hover:bg-primary-light transition-all duration-300 shadow-brand inline-block"
            >
              Book Your Event
            </Link>
            <Link
              to="/quote"
              className="font-body text-xs tracking-[0.3em] uppercase px-10 py-4 border border-white/60 text-white hover:border-primary hover:text-primary transition-all duration-300 inline-block"
            >
              Free Quote
            </Link>
            <Link
              to="/portfolio"
              className="font-body text-xs tracking-[0.3em] uppercase px-10 py-4 border border-white/30 text-white/70 hover:border-primary hover:text-primary transition-all duration-300 inline-block"
            >
              View Portfolio
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50"
        >
          <span className="font-body text-[9px] tracking-[0.3em] uppercase">Scroll</span>
          <ArrowDown size={16} />
        </motion.div>
      </section>

      {/* ─── STATS STRIP ─── */}
      <section className="py-0 border-y border-border bg-foreground relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4">
          {[
            { num: "80+", label: "Events Captured" },
            { num: "5★", label: "Average Rating" },
            { num: "4", label: "Expert Services" },
            { num: "UK", label: "Based & Travelling" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              variants={fadeUp}
              viewport={{ once: true }}
              className="py-10 px-8 text-center border-r border-white/10 last:border-r-0 hover:bg-primary/10 transition-colors duration-300"
            >
              <p className="font-display text-5xl text-primary mb-2 animate-shimmer">{stat.num}</p>
              <p className="font-body text-[10px] tracking-[0.25em] uppercase text-white/50">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── SERVICES ─── */}
      <section className="section-padding max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="w-16 h-0.5 bg-primary mx-auto mb-6 origin-left"
          />
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-body text-primary text-[10px] tracking-[0.45em] uppercase mb-4"
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

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              variants={fadeUp}
              custom={i}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="group relative overflow-hidden aspect-[3/4] cursor-pointer rounded-sm"
            >
              <img
                src={service.image}
                alt={service.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />
              {/* orange accent bar at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <div className="mb-4 w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                  <service.icon className="text-primary group-hover:text-white transition-colors duration-300" size={18} />
                </div>
                <h3 className="font-display text-2xl text-white mb-1">{service.title}</h3>
                <p className="font-body text-primary text-xs tracking-widest mb-2">{service.rate}</p>
                <p className="font-body text-white/60 text-xs leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-400 mb-3">{service.desc}</p>
                <Link
                  to={service.href}
                  className="font-body text-[10px] tracking-[0.2em] uppercase text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  Explore <ChevronRight size={12} />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center mt-12">
          <Link
            to="/services"
            className="btn-outline"
          >
            All Services & Pricing
          </Link>
        </div>
      </section>

      {/* ─── WHY CHOOSE US ─── */}
      <section className="py-20 bg-foreground relative overflow-hidden">
        {/* orange accent blobs */}
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="w-16 h-0.5 bg-primary mb-6" />
              <p className="font-body text-primary text-[10px] tracking-[0.45em] uppercase mb-4">Why JT Studios</p>
              <h2 className="font-display text-5xl md:text-6xl text-white mb-8 leading-tight">
                We Don't Just<br />
                <span className="text-brand-gradient italic">Shoot Events.</span><br />
                We Create Legacies.
              </h2>
              <p className="font-body text-white/60 text-sm leading-relaxed mb-10">
                With over 80 events captured across the UK, JT Studios brings cinematic excellence, creative vision, and meticulous attention to every booking. From intimate birthdays to large-scale corporate productions — your story deserves to be told beautifully.
              </p>
              <Link to="/booking" className="btn-primary">
                Secure Your Date
              </Link>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { num: "30%", label: "Deposit Only", desc: "Secure your date with just 30% upfront" },
                { num: "24hr", label: "Response Time", desc: "We respond to every quote within 24 hours" },
                { num: "100%", label: "Satisfaction", desc: "Every client gets a dedicated team" },
                { num: "UK", label: "Nationwide", desc: "We travel anywhere across the UK" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  variants={fadeUp}
                  custom={i}
                  className="border border-white/10 p-6 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 rounded-sm"
                >
                  <p className="font-display text-4xl text-primary mb-2">{item.num}</p>
                  <p className="font-body text-xs text-white tracking-widest uppercase mb-2">{item.label}</p>
                  <p className="font-body text-[11px] text-white/40 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── PROCESS ─── */}
      <section className="section-padding max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="w-16 h-0.5 bg-primary mx-auto mb-6" />
          <p className="font-body text-primary text-[10px] tracking-[0.45em] uppercase mb-4">How It Works</p>
          <h2 className="font-display text-5xl text-foreground">Book in 4 Simple Steps</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* connector line */}
          <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
          {[
            { step: "01", label: "Get a Quote", desc: "Tell us about your event. We'll craft a personalised proposal within 24 hours." },
            { step: "02", label: "Book & Deposit", desc: "Confirm your date with a 30% deposit. Simple, secure, and instant." },
            { step: "03", label: "We Create", desc: "Our team arrives and works their magic — you focus on enjoying your event." },
            { step: "04", label: "Receive & Relive", desc: "Your cinematic deliverables arrive beautifully edited and ready to share." },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              custom={i}
              initial="hidden"
              whileInView="visible"
              variants={fadeUp}
              viewport={{ once: true }}
              className="relative text-center p-8 border border-border hover:border-primary/40 hover:bg-accent/30 transition-all duration-300 rounded-sm group"
            >
              <div className="w-20 h-20 rounded-full border-2 border-primary/30 group-hover:border-primary flex items-center justify-center mx-auto mb-6 transition-colors duration-300">
                <span className="font-display text-3xl text-primary">{item.step}</span>
              </div>
              <h3 className="font-display text-xl text-foreground mb-3">{item.label}</h3>
              <p className="font-body text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── QUOTE CTA BANNER ─── */}
      <section className="py-24 relative overflow-hidden bg-primary">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "repeating-linear-gradient(-45deg, white 0px, white 1px, transparent 1px, transparent 30px)"
        }} />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto px-6 text-center relative z-10"
        >
          <p className="font-body text-white/70 text-[10px] tracking-[0.45em] uppercase mb-4">No Obligation</p>
          <h2 className="font-display text-5xl md:text-6xl text-white mb-6">
            Need a Custom Package?
          </h2>
          <p className="font-body text-white/70 text-sm mb-10 max-w-lg mx-auto leading-relaxed">
            Bundle services together for discounted rates. Share your vision and we'll craft a tailored proposal — completely free, no strings attached.
          </p>
          <Link
            to="/quote"
            className="font-body text-xs tracking-[0.3em] uppercase px-12 py-5 bg-white text-primary hover:bg-white/90 transition-all duration-300 inline-block shadow-brand-lg"
          >
            Request a Free Quote
          </Link>
        </motion.div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="w-16 h-0.5 bg-primary mx-auto mb-6" />
            <p className="font-body text-primary text-[10px] tracking-[0.45em] uppercase mb-4">Client Words</p>
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
                className="glass-card p-8 border border-border hover:border-primary/40 transition-all duration-500 group rounded-sm"
              >
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} size={14} className="text-primary fill-primary" />
                  ))}
                </div>
                <div className="w-8 h-0.5 bg-primary/40 mb-5" />
                <p className="font-display text-xl text-foreground italic leading-relaxed mb-6">"{t.text}"</p>
                <div className="border-t border-border pt-4">
                  <p className="font-body text-sm text-foreground font-medium">{t.name}</p>
                  <p className="font-body text-[10px] text-muted-foreground tracking-widest uppercase mt-1">{t.event}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── URGENCY CTA ─── */}
      <section className="py-24 px-6 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          viewport={{ once: true }}
        >
          <div className="w-16 h-0.5 bg-primary mx-auto mb-10" />
          <p className="font-body text-primary text-[10px] tracking-[0.45em] uppercase mb-6">Limited Availability</p>
          <h2 className="font-display text-5xl md:text-7xl text-foreground mb-6 leading-tight">
            Ready to Create<br />
            <span className="text-brand-gradient italic">Something Unforgettable?</span>
          </h2>
          <p className="font-body text-muted-foreground text-sm tracking-wider max-w-lg mx-auto mb-4">
            Dates fill fast — especially weekends and peak season. Secure yours today.
          </p>
          <p className="font-body text-primary text-xs tracking-widest uppercase mb-12">
            30% deposit · Full balance on completion · Flexible packages
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/booking"
              className="font-body text-sm tracking-[0.3em] uppercase px-14 py-5 bg-primary text-white hover:bg-primary-light transition-all duration-300 shadow-brand inline-block"
            >
              Book Now — Secure Your Date
            </Link>
            <Link
              to="/quote"
              className="font-body text-sm tracking-[0.3em] uppercase px-14 py-5 border border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300 inline-block"
            >
              Get a Free Quote First
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border py-16 px-6 bg-foreground">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <img src={jtsLogo} alt="JT Studios" className="h-14 w-auto" />
              <div>
                <p className="font-display text-white text-lg tracking-wider">JT Studios</p>
                <p className="font-body text-white/40 text-[10px] tracking-widest uppercase">& Events</p>
              </div>
            </div>
            <p className="font-body text-white/40 text-xs leading-relaxed max-w-xs">
              Premium cinematic photography, videography, and event services across the UK. Creating legacies, one frame at a time.
            </p>
          </div>
          <div>
            <p className="font-body text-[10px] tracking-[0.3em] uppercase text-primary mb-6">Navigation</p>
            <ul className="space-y-3">
              {[...navLinks, { label: "Client Portal", href: "/portal" }].map((l) => (
                <li key={l.href}>
                  <Link to={l.href} className="font-body text-xs text-white/40 hover:text-primary transition-colors flex items-center gap-1 group">
                    <ChevronRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-body text-[10px] tracking-[0.3em] uppercase text-primary mb-6">Get in Touch</p>
            <div className="space-y-4">
              <a href="tel:+447916843781" className="flex items-center gap-3 font-body text-xs text-white/40 hover:text-primary transition-colors group">
                <div className="w-8 h-8 rounded-full border border-white/10 group-hover:border-primary flex items-center justify-center transition-colors">
                  <Phone size={12} className="group-hover:text-primary" />
                </div>
                +44 7916 843781
              </a>
              <a href="mailto:info@jtstudios.events" className="flex items-center gap-3 font-body text-xs text-white/40 hover:text-primary transition-colors group">
                <div className="w-8 h-8 rounded-full border border-white/10 group-hover:border-primary flex items-center justify-center transition-colors">
                  <Mail size={12} className="group-hover:text-primary" />
                </div>
                info@jtstudios.events
              </a>
            </div>
            <div className="mt-8">
              <Link
                to="/booking"
                className="font-body text-[10px] tracking-[0.3em] uppercase px-6 py-3 bg-primary text-white hover:bg-primary-light transition-all duration-300 inline-block"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="font-body text-[10px] text-white/25 tracking-widest">
            © {new Date().getFullYear()} JT Studios & Events · All Rights Reserved · UK Based
          </p>
        </div>
      </footer>
    </div>
  );
}
