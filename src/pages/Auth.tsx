import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, ArrowLeft, Camera, Video, Mic, CalendarDays } from "lucide-react";
import jtsLogo from "@/assets/jts-logo.png";
import heroBg from "@/assets/hero-bg.jpg";

type Mode = "login" | "signup" | "reset";

const floatingIcons = [
  { Icon: Camera, x: "10%", y: "20%", delay: 0 },
  { Icon: Video, x: "85%", y: "15%", delay: 1.5 },
  { Icon: Mic, x: "78%", y: "75%", delay: 0.8 },
  { Icon: CalendarDays, x: "12%", y: "72%", delay: 2.2 },
];

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/portal");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "A confirmation link has been sent to your email." });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: "Password reset email sent" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const modeConfig = {
    login: {
      title: "Welcome Back",
      subtitle: "Sign in to your client portal",
      cta: "Sign In",
    },
    signup: {
      title: "Create Account",
      subtitle: "Join as a client to access your projects",
      cta: "Create Account",
    },
    reset: {
      title: "Reset Password",
      subtitle: "Enter your email to receive a reset link",
      cta: "Send Reset Email",
    },
  };

  const current = modeConfig[mode];

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* ── LEFT PANEL — Cinematic BG ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={heroBg} alt="JT Studios" className="absolute inset-0 w-full h-full object-cover" />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/70 to-black/85" />
        {/* Brand diagonal lines */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: "repeating-linear-gradient(45deg, hsl(15,83%,50%) 0px, hsl(15,83%,50%) 1px, transparent 1px, transparent 50px)"
        }} />
        {/* Orange glow orbs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.35, 0.15] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-primary blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.1, 0.25, 0.1] }}
          transition={{ repeat: Infinity, duration: 12, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-1/3 right-1/5 w-48 h-48 rounded-full bg-primary blur-3xl pointer-events-none"
        />

        {/* Floating service icons */}
        {floatingIcons.map(({ Icon, x, y, delay }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, -12, 0] }}
            transition={{ delay, duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-12 h-12 rounded-full border border-primary/30 bg-black/40 backdrop-blur-sm flex items-center justify-center"
            style={{ left: x, top: y }}
          >
            <Icon size={18} className="text-primary" />
          </motion.div>
        ))}

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img src={jtsLogo} alt="JT Studios" className="h-14 w-auto drop-shadow-2xl" />
            <div>
              <p className="font-display text-white text-xl tracking-wider">JT Studios</p>
              <p className="font-body text-primary text-[9px] tracking-[0.35em] uppercase">& Events</p>
            </div>
          </Link>

          {/* Tagline */}
          <div>
            <div className="w-16 h-0.5 bg-primary mb-6" />
            <h2 className="font-display text-5xl text-white leading-[1.05] mb-5">
              Capture Every<br />
              <span className="text-brand-gradient italic">Moment.</span>
            </h2>
            <p className="font-body text-white/50 text-xs tracking-wider leading-relaxed max-w-sm">
              Access your projects, view deliverables, track bookings, and manage your event portfolio — all in one place.
            </p>

            {/* Services list */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              {["Photography", "Videography", "Event Hosting", "Event Planning"].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary" />
                  <span className="font-body text-white/40 text-[10px] tracking-widest uppercase">{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <p className="font-body text-white/20 text-[10px] tracking-widest">
            © {new Date().getFullYear()} JT Studios & Events · UK
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL — Auth Form ── */}
      <div className="w-full lg:w-1/2 flex flex-col bg-background relative overflow-hidden">
        {/* Subtle grain texture */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }} />

        {/* Top nav — mobile logo & back */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4 lg:px-12">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <img src={jtsLogo} alt="JT Studios" className="h-10 w-auto" />
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors ml-auto"
          >
            <ArrowLeft size={12} />
            Back to site
          </Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-8 py-8 lg:px-16">
          <div className="w-full max-w-md">

            {/* Logo — desktop (above form) */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="hidden lg:flex justify-center mb-10"
            >
              <div className="w-16 h-16 border border-primary/30 flex items-center justify-center bg-primary/5">
                <span className="font-display text-primary text-2xl">JT</span>
              </div>
            </motion.div>

            {/* Mode header */}
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="text-center mb-8"
              >
                <div className="w-10 h-0.5 bg-primary mx-auto mb-5" />
                <h1 className="font-display text-4xl md:text-5xl text-foreground mb-2">
                  {current.title}
                </h1>
                <p className="font-body text-muted-foreground text-xs tracking-widest">
                  {current.subtitle}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Form */}
            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {mode === "signup" && (
                  <div>
                    <label className="block font-body text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2">
                      Full Name
                    </label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Your full name"
                      className="w-full bg-muted border border-border text-foreground px-4 py-3.5 font-body text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-body text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full bg-muted border border-border text-foreground px-4 py-3.5 font-body text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                  />
                </div>

                {mode !== "reset" && (
                  <div>
                    <label className="block font-body text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPwd ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        placeholder="••••••••"
                        className="w-full bg-muted border border-border text-foreground px-4 py-3.5 font-body text-sm focus:outline-none focus:border-primary transition-colors pr-12 placeholder:text-muted-foreground/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary text-primary-foreground font-body text-xs tracking-[0.35em] uppercase hover:bg-primary-light transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-brand"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {current.cta}
                </button>

                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-4 font-body text-[10px] text-muted-foreground tracking-widest uppercase">
                      or
                    </span>
                  </div>
                </div>

                {/* Mode switchers */}
                <div className="space-y-2 text-center">
                  {mode === "login" && (
                    <>
                      <button
                        type="button"
                        onClick={() => setMode("signup")}
                        className="block w-full font-body text-xs text-muted-foreground hover:text-primary transition-colors py-1"
                      >
                        Don't have an account?{" "}
                        <span className="text-primary font-medium">Register here</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode("reset")}
                        className="block w-full font-body text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                      >
                        Forgot your password?
                      </button>
                    </>
                  )}
                  {mode === "signup" && (
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="font-body text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      Already have an account?{" "}
                      <span className="text-primary font-medium">Sign in</span>
                    </button>
                  )}
                  {mode === "reset" && (
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="flex items-center gap-1.5 font-body text-xs text-muted-foreground hover:text-primary transition-colors mx-auto"
                    >
                      <ArrowLeft size={12} /> Back to login
                    </button>
                  )}
                </div>
              </motion.form>
            </AnimatePresence>

            {/* Bottom note */}
            <p className="text-center font-body text-[10px] text-muted-foreground/40 tracking-wider mt-8">
              By continuing, you agree to our{" "}
              <span className="hover:text-primary cursor-pointer transition-colors">Terms</span>{" "}
              &{" "}
              <span className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
