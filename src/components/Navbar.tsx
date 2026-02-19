import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import jtsLogo from "@/assets/jts-logo.png";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Get a Quote", href: "/quote" },
  { label: "Book Now", href: "/booking" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-lg"
          : "bg-background/80 backdrop-blur-sm border-b border-border/40"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img src={jtsLogo} alt="JT Studios & Events" className="h-12 w-auto" />
          <div className="hidden sm:block">
            <p className="font-display text-foreground text-sm tracking-[0.3em] uppercase leading-none">JT Studios</p>
            <p className="font-body text-primary text-[10px] tracking-[0.4em] uppercase leading-none mt-0.5">& Events</p>
          </div>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                to={link.href}
                className={`font-body text-xs tracking-[0.2em] uppercase transition-colors duration-300 ${
                  location.pathname === link.href
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                } ${link.label === "Book Now" ? "border border-primary text-primary px-4 py-2 hover:bg-primary hover:text-primary-foreground" : ""}`}
              >
                {link.label}
              </Link>
            </li>
          ))}
          {user ? (
            <li className="flex items-center gap-3">
              <Link
                to={isAdmin ? "/admin" : "/portal"}
                className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                <User size={14} />
                {isAdmin ? "Admin" : "Portal"}
              </Link>
              <button
                onClick={signOut}
                className="font-body text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut size={14} />
              </button>
            </li>
          ) : (
            <li>
              <Link to="/auth" className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                <User size={14} />
                Login
              </Link>
            </li>
          )}
        </ul>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/98 backdrop-blur-md border-b border-border"
          >
            <ul className="px-6 py-6 space-y-4">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className={`block font-body text-sm tracking-[0.2em] uppercase py-2 transition-colors ${
                      location.pathname === link.href ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {user ? (
                <>
                  <li>
                    <Link to={isAdmin ? "/admin" : "/portal"} className="block font-body text-sm tracking-[0.2em] uppercase py-2 text-primary">
                      {isAdmin ? "Admin Dashboard" : "Client Portal"}
                    </Link>
                  </li>
                  <li>
                    <button onClick={signOut} className="font-body text-sm text-muted-foreground py-2">Sign Out</button>
                  </li>
                </>
              ) : (
                <li>
                  <Link to="/auth" className="block font-body text-sm tracking-[0.2em] uppercase py-2 text-muted-foreground">
                    Login / Register
                  </Link>
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
