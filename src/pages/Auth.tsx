import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";

type Mode = "login" | "signup" | "reset";

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

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-12 h-12 border border-primary flex items-center justify-center mx-auto mb-6">
              <span className="font-display text-primary text-xl">JT</span>
            </div>
            <h1 className="font-display text-4xl text-foreground mb-2">
              {mode === "login" ? "Welcome Back" : mode === "signup" ? "Create Account" : "Reset Password"}
            </h1>
            <p className="font-body text-muted-foreground text-xs tracking-widest">
              {mode === "login" ? "Sign in to your client portal" : mode === "signup" ? "Join as a client to access your projects" : "Enter your email to reset your password"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="border border-border bg-card p-8 space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Full Name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full bg-input border border-border text-foreground px-4 py-3 font-body text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-input border border-border text-foreground px-4 py-3 font-body text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {mode !== "reset" && (
              <div>
                <label className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full bg-input border border-border text-foreground px-4 py-3 font-body text-sm focus:outline-none focus:border-primary transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-primary-foreground font-body text-xs tracking-[0.3em] uppercase hover:bg-primary-light transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Email"}
            </button>

            <div className="pt-4 text-center space-y-2">
              {mode === "login" && (
                <>
                  <button type="button" onClick={() => setMode("signup")} className="block w-full font-body text-xs text-muted-foreground hover:text-primary transition-colors">
                    Don't have an account? Register
                  </button>
                  <button type="button" onClick={() => setMode("reset")} className="block w-full font-body text-xs text-muted-foreground hover:text-primary transition-colors">
                    Forgot password?
                  </button>
                </>
              )}
              {mode !== "login" && (
                <button type="button" onClick={() => setMode("login")} className="font-body text-xs text-muted-foreground hover:text-primary transition-colors">
                  Back to login
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
