import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, X, Camera, Video, Mic, CalendarDays, Plus, Minus, ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const services = [
  { id: "photography", label: "Photography", Icon: Camera, rate: 150, color: "from-orange-500/20 to-orange-600/10" },
  { id: "videography", label: "Videography", Icon: Video, rate: 200, color: "from-orange-600/20 to-red-600/10" },
  { id: "hosting", label: "Event Hosting", Icon: Mic, rate: 180, color: "from-amber-500/20 to-orange-500/10" },
  { id: "planning", label: "Event Planning", Icon: CalendarDays, rate: 120, color: "from-orange-400/20 to-amber-400/10" },
];

type ServiceHours = Record<string, number>;

export default function CostCalculator() {
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState<ServiceHours>({ photography: 0, videography: 0, hosting: 0, planning: 0 });
  const [step, setStep] = useState<"select" | "result">("select");

  const totalHours = Object.values(hours).reduce((a, b) => a + b, 0);
  const totalCost = services.reduce((acc, s) => acc + s.rate * (hours[s.id] || 0), 0);
  const deposit = Math.round(totalCost * 0.3);
  const hasSelection = totalHours > 0;

  const adjust = (id: string, delta: number) => {
    setHours((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));
  };

  const reset = () => {
    setHours({ photography: 0, videography: 0, hosting: 0, planning: 0 });
    setStep("select");
  };

  return (
    <>
      {/* ── Floating Button ── */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-primary text-primary-foreground shadow-brand-lg px-5 py-3.5 font-body text-xs tracking-[0.2em] uppercase rounded-full hover:bg-primary-light transition-all duration-300 group"
        style={{ boxShadow: "0 8px 32px hsl(15 83% 50% / 0.45), 0 2px 8px rgba(0,0,0,0.2)" }}
      >
        <div className="relative">
          <Calculator size={16} />
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white"
          />
        </div>
        <span>Cost Calculator</span>
      </motion.button>

      {/* ── Backdrop ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* ── Panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col bg-background border-l border-border shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-border bg-foreground">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                  <Calculator size={16} className="text-primary" />
                </div>
                <div>
                  <p className="font-display text-white text-lg leading-tight">Cost Calculator</p>
                  <p className="font-body text-white/40 text-[9px] tracking-[0.25em] uppercase">Estimate your investment</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all"
              >
                <X size={15} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {step === "select" ? (
                  <motion.div
                    key="select"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-7 space-y-4"
                  >
                    <p className="font-body text-muted-foreground text-xs tracking-wider">
                      Select your services and adjust hours to calculate your estimated cost.
                    </p>

                    {services.map((s) => {
                      const hrs = hours[s.id] || 0;
                      const subtotal = hrs * s.rate;
                      return (
                        <div
                          key={s.id}
                          className={`border border-border rounded-sm p-5 bg-gradient-to-br ${s.color} hover:border-primary/40 transition-all duration-300`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center">
                                <s.Icon size={15} className="text-primary" />
                              </div>
                              <div>
                                <p className="font-body text-sm text-foreground font-medium">{s.label}</p>
                                <p className="font-body text-[10px] text-muted-foreground">£{s.rate}/hr</p>
                              </div>
                            </div>
                            {subtotal > 0 && (
                              <p className="font-display text-lg text-primary">£{subtotal.toLocaleString()}</p>
                            )}
                          </div>

                          {/* Hour controls */}
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => adjust(s.id, -1)}
                              disabled={hrs === 0}
                              className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Minus size={13} />
                            </button>
                            <div className="flex-1 text-center">
                              <span className="font-display text-2xl text-foreground">{hrs}</span>
                              <span className="font-body text-xs text-muted-foreground ml-1">hrs</span>
                            </div>
                            <button
                              onClick={() => adjust(s.id, 1)}
                              className="w-8 h-8 rounded-full border border-primary/40 bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-7"
                  >
                    <div className="bg-foreground rounded-sm p-6 mb-6">
                      <div className="w-10 h-0.5 bg-primary mb-4" />
                      <p className="font-body text-white/50 text-[10px] tracking-[0.3em] uppercase mb-2">Your Estimate</p>

                      {/* Line items */}
                      <div className="space-y-2 mb-5 border-b border-white/10 pb-5">
                        {services.filter((s) => (hours[s.id] || 0) > 0).map((s) => (
                          <div key={s.id} className="flex justify-between items-center">
                            <div>
                              <p className="font-body text-white text-xs">{s.label}</p>
                              <p className="font-body text-white/30 text-[10px]">{hours[s.id]}hr × £{s.rate}</p>
                            </div>
                            <p className="font-body text-white/80 text-sm">£{(s.rate * (hours[s.id] || 0)).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="font-body text-white/40 text-xs tracking-widest uppercase">Total Estimated</p>
                          <p className="font-display text-3xl text-primary">£{totalCost.toLocaleString()}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="font-body text-white/30 text-[10px] tracking-widest uppercase">Deposit (30%)</p>
                          <p className="font-body text-white/70 text-sm">£{deposit.toLocaleString()}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="font-body text-white/30 text-[10px] tracking-widest uppercase">On Completion</p>
                          <p className="font-body text-white/70 text-sm">£{(totalCost - deposit).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <p className="font-body text-muted-foreground text-[10px] leading-relaxed mb-6 text-center">
                      This is an estimate. Final pricing is confirmed after consultation. Bundle discounts may apply.
                    </p>

                    <div className="space-y-3">
                      <Link
                        to="/booking"
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-primary-foreground font-body text-xs tracking-[0.3em] uppercase hover:bg-primary-light transition-all duration-300 shadow-brand"
                      >
                        Continue to Book <ArrowRight size={14} />
                      </Link>
                      <Link
                        to="/quote"
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-center gap-2 w-full py-3.5 border border-primary text-primary font-body text-xs tracking-[0.3em] uppercase hover:bg-primary hover:text-white transition-all duration-300"
                      >
                        Get Custom Quote <ChevronRight size={14} />
                      </Link>
                    </div>

                    <button
                      onClick={reset}
                      className="w-full mt-4 font-body text-[10px] text-muted-foreground hover:text-primary transition-colors tracking-widest uppercase"
                    >
                      ← Recalculate
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom CTA */}
            {step === "select" && (
              <div className="px-7 pb-7 pt-4 border-t border-border bg-background">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-body text-[10px] text-muted-foreground tracking-widest uppercase">Running Total</p>
                    <p className="font-display text-2xl text-foreground">£{totalCost.toLocaleString()}</p>
                  </div>
                  <p className="font-body text-xs text-muted-foreground">{totalHours} hrs selected</p>
                </div>
                <button
                  disabled={!hasSelection}
                  onClick={() => setStep("result")}
                  className="w-full py-4 bg-primary text-primary-foreground font-body text-xs tracking-[0.3em] uppercase hover:bg-primary-light transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed shadow-brand flex items-center justify-center gap-2"
                >
                  See Full Breakdown <ChevronRight size={14} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
