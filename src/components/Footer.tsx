import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Instagram, Youtube, Clock, ChevronRight } from "lucide-react";
import jtsLogo from "@/assets/jts-logo.png";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Get a Quote", href: "/quote" },
  { label: "Book Now", href: "/booking" },
  { label: "Client Portal", href: "/portal" },
];

export default function Footer() {
  return (
    <footer className="bg-foreground relative overflow-hidden">
      {/* Brand diagonal texture */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: "repeating-linear-gradient(-45deg, hsl(15,83%,50%) 0px, hsl(15,83%,50%) 1px, transparent 1px, transparent 60px)"
      }} />
      {/* Glow orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Top bar — CTA strip */}
        <div className="border-b border-white/8 px-6 md:px-12 py-10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="font-body text-primary text-[10px] tracking-[0.4em] uppercase mb-2">Limited Dates Available</p>
              <h3 className="font-display text-3xl md:text-4xl text-white">
                Ready to book your event?
              </h3>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link to="/booking" className="font-body text-xs tracking-[0.25em] uppercase px-8 py-3.5 bg-primary text-white hover:bg-primary-light transition-all duration-300 shadow-brand">
                Book Now
              </Link>
              <Link to="/quote" className="font-body text-xs tracking-[0.25em] uppercase px-8 py-3.5 border border-white/20 text-white/70 hover:border-primary hover:text-primary transition-all duration-300">
                Free Quote
              </Link>
            </div>
          </div>
        </div>

        {/* Main footer grid */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Brand col */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-4 mb-6">
              <img src={jtsLogo} alt="JT Studios" className="h-16 w-auto drop-shadow-2xl" />
              <div>
                <p className="font-display text-white text-xl tracking-wider leading-tight">JT Studios</p>
                <p className="font-body text-primary text-[9px] tracking-[0.35em] uppercase">& Events</p>
              </div>
            </div>
            <p className="font-body text-white/35 text-xs leading-relaxed max-w-xs mb-8">
              UK's premier cinematic event studio. We capture your story through photography, videography, hosting, and event planning — crafted with excellence.
            </p>
            {/* Contact */}
            <div className="space-y-3">
              <a href="tel:+447916843781" className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded border border-white/10 group-hover:border-primary flex items-center justify-center transition-all">
                  <Phone size={12} className="text-white/30 group-hover:text-primary transition-colors" />
                </div>
                <span className="font-body text-xs text-white/35 group-hover:text-white/70 transition-colors">+44 7916 843781</span>
              </a>
              <a href="mailto:info@jtstudios.events" className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded border border-white/10 group-hover:border-primary flex items-center justify-center transition-all">
                  <Mail size={12} className="text-white/30 group-hover:text-primary transition-colors" />
                </div>
                <span className="font-body text-xs text-white/35 group-hover:text-white/70 transition-colors">info@jtstudios.events</span>
              </a>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded border border-white/10 flex items-center justify-center">
                  <MapPin size={12} className="text-white/30" />
                </div>
                <span className="font-body text-xs text-white/35">UK Nationwide · Travel Available</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="md:col-span-2">
            <p className="font-body text-[9px] tracking-[0.35em] uppercase text-primary mb-6">Services</p>
            <ul className="space-y-3">
              {["Photography", "Videography", "Event Hosting", "Event Planning"].map((s) => (
                <li key={s}>
                  <Link to="/services" className="font-body text-xs text-white/35 hover:text-primary transition-colors flex items-center gap-1.5 group">
                    <div className="w-1 h-1 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation */}
          <div className="md:col-span-2">
            <p className="font-body text-[9px] tracking-[0.35em] uppercase text-primary mb-6">Navigate</p>
            <ul className="space-y-3">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link to={l.href} className="font-body text-xs text-white/35 hover:text-primary transition-colors flex items-center gap-1.5 group">
                    <div className="w-1 h-1 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Why us + hours */}
          <div className="md:col-span-4">
            <p className="font-body text-[9px] tracking-[0.35em] uppercase text-primary mb-6">Why JT Studios</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { num: "80+", label: "Events" },
                { num: "5★", label: "Rating" },
                { num: "30%", label: "Deposit" },
                { num: "24hr", label: "Response" },
              ].map((s) => (
                <div key={s.label} className="border border-white/8 p-3 text-center hover:border-primary/30 transition-colors">
                  <p className="font-display text-2xl text-primary">{s.num}</p>
                  <p className="font-body text-[9px] text-white/30 tracking-widest uppercase">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="border border-white/8 p-4 flex items-center gap-3">
              <Clock size={16} className="text-primary flex-shrink-0" />
              <div>
                <p className="font-body text-[9px] tracking-widest uppercase text-white/30 mb-0.5">Availability</p>
                <p className="font-body text-xs text-white/50">Mon – Sun · Flexible Hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 px-6 md:px-12 py-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-body text-[10px] text-white/20 tracking-widest">
              © {new Date().getFullYear()} JT Studios & Events · All Rights Reserved · United Kingdom
            </p>
            <div className="flex items-center gap-6">
              <a href="https://www.instagram.com/jt_studios_events" target="_blank" rel="noopener noreferrer" className="font-body text-[10px] text-white/20 hover:text-primary transition-colors tracking-widest uppercase flex items-center gap-1.5">
                <Instagram size={12} /> Instagram
              </a>
              <a href="https://youtube.com/@jtstudiosevents" target="_blank" rel="noopener noreferrer" className="font-body text-[10px] text-white/20 hover:text-primary transition-colors tracking-widest uppercase flex items-center gap-1.5">
                <Youtube size={12} /> YouTube
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
