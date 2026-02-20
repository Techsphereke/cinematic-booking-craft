import { CheckCircle, Calendar, UserPlus, Loader2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSuccess() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [showSignup, setShowSignup] = useState(false);
  const [signupForm, setSignupForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signupForm.email,
      password: signupForm.password,
      options: {
        data: { full_name: signupForm.name },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      setDone(true);
      toast({ title: "Account created!", description: "Check your email to verify your account." });
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen px-6 py-24">
        <div className="w-full max-w-md space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <CheckCircle className="text-primary mx-auto mb-6" size={56} />
            <h1 className="font-display text-5xl text-foreground mb-4">Payment Successful</h1>
            <p className="font-body text-muted-foreground text-sm mb-8 leading-relaxed">
              Your deposit has been received. Your date is now secured. You'll receive a confirmation email shortly. The remaining balance is due upon project completion.
            </p>
            <div className="space-y-3">
              <Link
                to="/portal"
                className="block font-body text-xs tracking-[0.3em] uppercase px-10 py-4 bg-primary text-primary-foreground hover:bg-primary-light transition-all"
              >
                View My Bookings
              </Link>
              <Link
                to="/"
                className="block font-body text-xs tracking-[0.3em] uppercase px-10 py-4 border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all"
              >
                Back to Home
              </Link>
            </div>
            <div className="mt-8 p-4 border border-border flex items-center gap-3 text-left">
              <Calendar className="text-primary flex-shrink-0" size={18} />
              <p className="font-body text-xs text-muted-foreground">
                A booking confirmation and receipt have been sent to your email address.
              </p>
            </div>
          </motion.div>

          {/* Account creation prompt for guests */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="border border-primary/30 bg-primary/5 p-6"
            >
              {!showSignup && !done && (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <UserPlus className="text-primary flex-shrink-0" size={20} />
                    <h3 className="font-display text-xl text-foreground">Track Your Booking</h3>
                  </div>
                  <p className="font-body text-xs text-muted-foreground mb-4 leading-relaxed">
                    Create a free account to track your booking status, view your project deliverables, and manage your upcoming events — all in one place.
                  </p>
                  <button
                    onClick={() => setShowSignup(true)}
                    className="w-full font-body text-xs tracking-[0.3em] uppercase px-8 py-3 bg-primary text-primary-foreground hover:bg-primary-light transition-all"
                  >
                    Create Free Account
                  </button>
                  <p className="font-body text-xs text-muted-foreground text-center mt-3">
                    Already have an account?{" "}
                    <Link to="/auth" className="text-primary hover:underline">Sign in</Link>
                  </p>
                </>
              )}

              {showSignup && !done && (
                <form onSubmit={handleSignup} className="space-y-4">
                  <h3 className="font-display text-xl text-foreground mb-4">Create Your Account</h3>
                  <div>
                    <label className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Full Name</label>
                    <input
                      type="text"
                      required
                      value={signupForm.name}
                      onChange={e => setSignupForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full bg-input border border-border text-foreground px-4 py-3 font-body text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={signupForm.email}
                      onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full bg-input border border-border text-foreground px-4 py-3 font-body text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="Use the email from your booking"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={signupForm.password}
                      onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))}
                      className="w-full bg-input border border-border text-foreground px-4 py-3 font-body text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full font-body text-xs tracking-[0.3em] uppercase px-8 py-3 bg-primary text-primary-foreground hover:bg-primary-light transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 size={14} className="animate-spin" />}
                    {loading ? "Creating Account..." : "Create Account"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSignup(false)}
                    className="w-full font-body text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Cancel
                  </button>
                </form>
              )}

              {done && (
                <div className="text-center">
                  <CheckCircle className="text-primary mx-auto mb-3" size={32} />
                  <h3 className="font-display text-xl text-foreground mb-2">Account Created!</h3>
                  <p className="font-body text-xs text-muted-foreground">
                    Check your email to verify your account, then{" "}
                    <Link to="/auth" className="text-primary hover:underline">sign in</Link>{" "}
                    to track your booking.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
