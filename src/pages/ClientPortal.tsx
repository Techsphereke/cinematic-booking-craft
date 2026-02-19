import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CostCalculator from "@/components/CostCalculator";
import {
  Lock, Unlock, Download, Eye, Play, PoundSterling, Loader2,
  CalendarDays, Clock, MapPin, ArrowRight, CheckCircle2, Sparkles,
  ImageIcon, Video, ChevronRight, User
} from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string | null;
  preview_gallery_urls: string[];
  preview_video_url: string | null;
  full_gallery_urls: string[];
  full_video_url: string | null;
  content_locked: boolean;
  status: string;
  booking_id: string | null;
}

interface Booking {
  id: string;
  booking_ref: string;
  event_type: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  status: string;
  estimated_total: number;
  deposit_amount: number;
  remaining_balance: number;
  full_name: string;
}

const statusConfig: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  pending_deposit: { label: "Deposit Pending", cls: "status-pending", icon: Clock },
  deposit_paid: { label: "Deposit Paid", cls: "status-deposit", icon: CheckCircle2 },
  fully_paid: { label: "Fully Paid", cls: "status-paid", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", cls: "status-cancelled", icon: Lock },
  completed: { label: "Completed", cls: "status-completed", icon: Sparkles },
};

export default function ClientPortal() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<"bookings" | "projects">("bookings");
  const [paying, setPaying] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("bookings").select("*").eq("client_user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setBookings(data || []));
    supabase.from("projects").select("*").eq("client_user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setProjects(data || []));
  }, [user]);

  const payBalance = async (bookingId: string, amount: number) => {
    setPaying(bookingId);
    try {
      const { data, error } = await supabase.functions.invoke("create-booking-payment", {
        body: { booking_id: bookingId, amount: Math.round(amount * 100), deposit: false },
      });
      if (error || !data?.url) throw new Error("Payment setup failed");
      if (window.top) {
        window.top.location.href = data.url;
      } else {
        window.open(data.url, "_blank");
      }
    } catch {
      alert("Payment setup failed. Please try again.");
    } finally {
      setPaying(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  const displayName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Client";

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Navbar />

      {/* Hero header */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background pointer-events-none" />
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-32 pb-14 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <User size={18} className="text-primary" />
                </div>
                <p className="font-body text-primary text-xs tracking-[0.35em] uppercase">Client Portal</p>
              </div>
              <h1 className="font-display text-4xl md:text-6xl text-foreground">
                Welcome back,<br />
                <span className="text-primary">{displayName}</span>
              </h1>
            </div>
            <div className="flex gap-6 md:gap-10 text-center pb-1">
              <div>
                <p className="font-display text-3xl text-foreground">{bookings.length}</p>
                <p className="font-body text-[10px] text-muted-foreground tracking-widest uppercase mt-1">Bookings</p>
              </div>
              <div className="w-px bg-border" />
              <div>
                <p className="font-display text-3xl text-foreground">{projects.length}</p>
                <p className="font-body text-[10px] text-muted-foreground tracking-widest uppercase mt-1">Projects</p>
              </div>
              <div className="w-px bg-border" />
              <div>
                <p className="font-display text-3xl text-primary">
                  {projects.filter(p => !p.content_locked).length}
                </p>
                <p className="font-body text-[10px] text-muted-foreground tracking-widest uppercase mt-1">Unlocked</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-10 pb-24 flex-1 w-full">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-border">
          {(["bookings", "projects"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`font-body text-xs tracking-[0.2em] uppercase px-6 py-3 border-b-2 transition-all duration-300 flex items-center gap-2 ${
                tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "bookings" ? <CalendarDays size={12} /> : <ImageIcon size={12} />}
              {t === "bookings" ? "My Bookings" : "My Projects"}
              {t === "projects" && projects.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] flex items-center justify-center font-bold">
                  {projects.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* BOOKINGS TAB */}
        {tab === "bookings" && (
          <AnimatePresence mode="wait">
            <motion.div key="bookings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {bookings.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-border">
                  <CalendarDays className="text-muted-foreground/30 mx-auto mb-4" size={48} />
                  <p className="font-display text-2xl text-foreground mb-2">No bookings yet</p>
                  <p className="font-body text-muted-foreground text-sm mb-8">Book your first event and it'll appear here.</p>
                  <a href="/booking" className="font-body text-xs tracking-[0.2em] uppercase border border-primary text-primary px-8 py-3 hover:bg-primary hover:text-primary-foreground transition-all">
                    Book an Event
                  </a>
                </div>
              ) : bookings.map((booking, i) => {
                const sc = statusConfig[booking.status] || { label: booking.status, cls: "", icon: Clock };
                const StatusIcon = sc.icon;
                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="border border-border bg-card hover:border-primary/30 transition-all duration-300 group"
                  >
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <span className="font-body text-xs text-primary/70 tracking-widest">{booking.booking_ref}</span>
                            <span className={`font-body text-[10px] tracking-widest uppercase px-2.5 py-1 flex items-center gap-1 ${sc.cls}`}>
                              <StatusIcon size={9} />
                              {sc.label}
                            </span>
                          </div>
                          <p className="font-display text-2xl text-foreground mb-2">{booking.event_type}</p>
                          <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <CalendarDays size={12} />
                              <span className="font-body text-xs">
                                {new Date(booking.event_date).toLocaleDateString("en-GB", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Clock size={12} />
                              <span className="font-body text-xs">{booking.start_time} – {booking.end_time}</span>
                            </div>
                            {booking.location && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <MapPin size={12} />
                                <span className="font-body text-xs">{booking.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <div className="text-right">
                            <p className="font-body text-[10px] text-muted-foreground tracking-widest uppercase mb-1">Total Value</p>
                            <p className="font-display text-3xl text-foreground">£{booking.estimated_total?.toFixed(0)}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="border border-border px-3 py-2">
                              <p className="font-body text-[9px] text-muted-foreground uppercase tracking-widest">Deposit</p>
                              <p className="font-body text-sm text-primary">£{booking.deposit_amount?.toFixed(0)}</p>
                            </div>
                            <div className="border border-border px-3 py-2">
                              <p className="font-body text-[9px] text-muted-foreground uppercase tracking-widest">Balance</p>
                              <p className={`font-body text-sm ${booking.remaining_balance > 0 ? "text-yellow-400" : "text-green-400"}`}>
                                £{booking.remaining_balance?.toFixed(0)}
                              </p>
                            </div>
                          </div>
                          {booking.status === "deposit_paid" && (
                            <button
                              onClick={() => payBalance(booking.id, booking.remaining_balance)}
                              disabled={paying === booking.id}
                              className="w-full font-body text-xs tracking-[0.2em] uppercase px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary-light transition-all flex items-center justify-center gap-2"
                            >
                              {paying === booking.id ? <Loader2 size={12} className="animate-spin" /> : <PoundSterling size={12} />}
                              Pay Balance £{booking.remaining_balance?.toFixed(2)}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}

        {/* PROJECTS TAB */}
        {tab === "projects" && (
          <AnimatePresence mode="wait">
            <motion.div key="projects" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {projects.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-border">
                  <ImageIcon className="text-muted-foreground/30 mx-auto mb-4" size={48} />
                  <p className="font-display text-2xl text-foreground mb-2">No projects yet</p>
                  <p className="font-body text-muted-foreground text-sm max-w-sm mx-auto">
                    Once your event is complete, your deliverables will appear here — photos, videos & highlight reels.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Project list */}
                  <div className="lg:col-span-1 space-y-3">
                    {projects.map((project, i) => (
                      <motion.button
                        key={project.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        onClick={() => setSelectedProject(project)}
                        className={`w-full text-left border bg-card p-4 transition-all duration-300 hover:border-primary/50 ${
                          selectedProject?.id === project.id ? "border-primary" : "border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-display text-lg text-foreground leading-tight">{project.title}</h4>
                          {project.content_locked ? (
                            <Lock size={12} className="text-yellow-400 flex-shrink-0 mt-1" />
                          ) : (
                            <Unlock size={12} className="text-green-400 flex-shrink-0 mt-1" />
                          )}
                        </div>
                        {project.description && (
                          <p className="font-body text-[11px] text-muted-foreground line-clamp-2">{project.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 ${
                            project.content_locked
                              ? "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20"
                              : "text-green-400 bg-green-400/10 border border-green-400/20"
                          }`}>
                            {project.content_locked ? "Preview Only" : "Full Access"}
                          </span>
                          <ChevronRight size={12} className="text-muted-foreground" />
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Project detail */}
                  <div className="lg:col-span-2">
                    <AnimatePresence mode="wait">
                      {selectedProject ? (
                        <motion.div
                          key={selectedProject.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="border border-border bg-card sticky top-24"
                        >
                          {/* Project header */}
                          <div className={`p-6 border-b border-border ${selectedProject.content_locked ? "bg-yellow-400/5" : "bg-green-400/5"}`}>
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-display text-3xl text-foreground mb-1">{selectedProject.title}</h3>
                                {selectedProject.description && (
                                  <p className="font-body text-xs text-muted-foreground">{selectedProject.description}</p>
                                )}
                              </div>
                              {selectedProject.content_locked ? (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 border border-yellow-400/30 bg-yellow-400/10">
                                  <Lock size={11} className="text-yellow-400" />
                                  <span className="font-body text-[10px] tracking-widest uppercase text-yellow-400">Locked</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 border border-green-400/30 bg-green-400/10">
                                  <Unlock size={11} className="text-green-400" />
                                  <span className="font-body text-[10px] tracking-widest uppercase text-green-400">Unlocked</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="p-6 space-y-6">
                            {/* Gallery */}
                            {(selectedProject.preview_gallery_urls.length > 0 || selectedProject.full_gallery_urls.length > 0) && (
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <p className="font-body text-xs tracking-[0.25em] uppercase text-muted-foreground">
                                    {selectedProject.content_locked ? "Watermarked Preview" : "Full Gallery"}
                                  </p>
                                  {!selectedProject.content_locked && (
                                    <span className="font-body text-[10px] text-green-400 tracking-widest">
                                      {(selectedProject.full_gallery_urls.length || selectedProject.preview_gallery_urls.length)} photos
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  {(selectedProject.content_locked
                                    ? selectedProject.preview_gallery_urls
                                    : selectedProject.full_gallery_urls.length > 0
                                      ? selectedProject.full_gallery_urls
                                      : selectedProject.preview_gallery_urls
                                  ).slice(0, 6).map((url, j) => (
                                    <div key={j} className="relative aspect-square overflow-hidden border border-border group">
                                      <img src={url} alt={`Photo ${j + 1}`} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${selectedProject.content_locked ? "opacity-60" : ""}`} />
                                      {selectedProject.content_locked ? (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                                          <Lock size={16} className="text-yellow-400" />
                                        </div>
                                      ) : (
                                        <a href={url} download className="absolute inset-0 bg-black/0 group-hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                          <Download size={18} className="text-primary" />
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Video */}
                            {(selectedProject.full_video_url || selectedProject.preview_video_url) && !selectedProject.content_locked && (
                              <div>
                                <p className="font-body text-xs tracking-[0.25em] uppercase text-muted-foreground mb-3">Highlight Video</p>
                                <a
                                  href={selectedProject.full_video_url || selectedProject.preview_video_url || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 border border-primary/30 bg-primary/5 px-5 py-4 hover:bg-primary/10 hover:border-primary transition-all group"
                                >
                                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                    <Play size={14} className="text-primary-foreground ml-0.5" />
                                  </div>
                                  <div>
                                    <p className="font-body text-sm text-foreground">Watch Highlight Reel</p>
                                    <p className="font-body text-xs text-muted-foreground">HD quality · Full resolution</p>
                                  </div>
                                  <ArrowRight size={14} className="text-primary ml-auto group-hover:translate-x-1 transition-transform" />
                                </a>
                              </div>
                            )}

                            {/* Locked CTA */}
                            {selectedProject.content_locked && (
                              <div className="border border-yellow-400/20 bg-gradient-to-br from-yellow-400/5 to-transparent p-6">
                                <div className="flex items-start gap-4">
                                  <div className="w-10 h-10 rounded-full bg-yellow-400/15 flex items-center justify-center flex-shrink-0">
                                    <Lock size={16} className="text-yellow-400" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-display text-lg text-foreground mb-2">Full Content Locked</p>
                                    <p className="font-body text-xs text-muted-foreground leading-relaxed mb-4">
                                      Full-resolution gallery and HD highlight video are locked. Pay your remaining balance on the booking to instantly unlock everything.
                                    </p>
                                    <button
                                      onClick={() => setTab("bookings")}
                                      className="font-body text-xs tracking-[0.2em] uppercase px-6 py-3 bg-primary text-primary-foreground hover:bg-primary-light transition-all flex items-center gap-2"
                                    >
                                      <PoundSterling size={12} /> Pay Remaining Balance
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border border-dashed border-border bg-card p-20 text-center"
                        >
                          <ImageIcon className="text-muted-foreground/20 mx-auto mb-4" size={40} />
                          <p className="font-body text-xs text-muted-foreground">Select a project to view its content</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <Footer />
      <CostCalculator />
    </div>
  );
}
