import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Lock, Unlock, Download, Eye, Play, PoundSterling, Loader2 } from "lucide-react";

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
  status: string;
  estimated_total: number;
  deposit_amount: number;
  remaining_balance: number;
  full_name: string;
}

export default function ClientPortal() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<"bookings" | "projects">("bookings");
  const [paying, setPaying] = useState<string | null>(null);

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
      window.location.href = data.url;
    } catch {
      alert("Payment setup failed. Please try again.");
    } finally {
      setPaying(null);
    }
  };

  const statusClass = (status: string) => {
    if (status === "pending_deposit") return "status-pending";
    if (status === "deposit_paid") return "status-deposit";
    if (status === "fully_paid") return "status-paid";
    if (status === "cancelled") return "status-cancelled";
    if (status === "completed") return "status-completed";
    return "";
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending_deposit: "Deposit Pending",
      deposit_paid: "Deposit Paid",
      fully_paid: "Fully Paid",
      cancelled: "Cancelled",
      completed: "Completed",
    };
    return map[status] || status;
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 md:px-12 pt-28 pb-24">
        <div className="mb-10">
          <p className="font-body text-primary text-xs tracking-[0.4em] uppercase mb-2">Client Portal</p>
          <h1 className="font-display text-5xl text-foreground">Your Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-border">
          {(["bookings", "projects"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`font-body text-xs tracking-[0.2em] uppercase px-6 py-3 border-b-2 transition-all duration-300 ${
                tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "bookings" ? "My Bookings" : "My Projects"}
            </button>
          ))}
        </div>

        {tab === "bookings" && (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="text-center py-20 border border-border">
                <p className="font-body text-muted-foreground mb-4">No bookings yet.</p>
                <a href="/booking" className="font-body text-xs tracking-[0.2em] uppercase border border-primary text-primary px-8 py-3 hover:bg-primary hover:text-primary-foreground transition-all">
                  Book an Event
                </a>
              </div>
            ) : bookings.map((booking) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-border bg-card p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-body text-xs text-primary">{booking.booking_ref}</span>
                      <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 ${statusClass(booking.status)}`}>
                        {statusLabel(booking.status)}
                      </span>
                    </div>
                    <p className="font-display text-xl text-foreground">{booking.event_type}</p>
                    <p className="font-body text-xs text-muted-foreground mt-1">
                      {new Date(booking.event_date).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-xs text-muted-foreground">Total: £{booking.estimated_total?.toFixed(2)}</p>
                    <p className="font-body text-sm text-primary">Deposit: £{booking.deposit_amount?.toFixed(2)}</p>
                    {booking.status === "deposit_paid" && (
                      <button
                        onClick={() => payBalance(booking.id, booking.remaining_balance)}
                        disabled={paying === booking.id}
                        className="mt-2 font-body text-xs tracking-[0.2em] uppercase px-4 py-2 bg-primary text-primary-foreground hover:bg-primary-light transition-all flex items-center gap-2"
                      >
                        {paying === booking.id ? <Loader2 size={12} className="animate-spin" /> : <PoundSterling size={12} />}
                        Pay Balance £{booking.remaining_balance?.toFixed(2)}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {tab === "projects" && (
          <div className="space-y-6">
            {projects.length === 0 ? (
              <div className="text-center py-20 border border-border">
                <p className="font-body text-muted-foreground">No projects delivered yet. Once your event is complete, your deliverables will appear here.</p>
              </div>
            ) : projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-border bg-card p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-display text-2xl text-foreground">{project.title}</h3>
                      {project.content_locked ? (
                        <span className="flex items-center gap-1 font-body text-[10px] tracking-widest uppercase text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5">
                          <Lock size={10} /> Locked
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-body text-[10px] tracking-widest uppercase text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5">
                          <Unlock size={10} /> Unlocked
                        </span>
                      )}
                    </div>
                    {project.description && (
                      <p className="font-body text-xs text-muted-foreground">{project.description}</p>
                    )}
                  </div>
                </div>

                {/* Preview gallery */}
                {project.preview_gallery_urls.length > 0 && (
                  <div className="mb-4">
                    <p className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3">
                      {project.content_locked ? "Watermarked Preview" : "Full Gallery"}
                    </p>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                      {(project.content_locked ? project.preview_gallery_urls : project.full_gallery_urls.length > 0 ? project.full_gallery_urls : project.preview_gallery_urls)
                        .slice(0, 5).map((url, j) => (
                        <div key={j} className="relative aspect-square overflow-hidden border border-border group">
                          <img src={url} alt={`Preview ${j + 1}`} className="w-full h-full object-cover" />
                          {project.content_locked && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Lock size={14} className="text-muted-foreground" />
                            </div>
                          )}
                          {!project.content_locked && (
                            <a href={url} download className="absolute inset-0 bg-black/0 group-hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                              <Download size={14} className="text-primary" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video */}
                {(project.preview_video_url || project.full_video_url) && !project.content_locked && (
                  <div className="mb-4">
                    <p className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Highlight Video</p>
                    <a
                      href={project.full_video_url || project.preview_video_url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-body text-xs text-primary hover:text-primary-light border border-primary px-4 py-2 transition-colors"
                    >
                      <Play size={12} /> Watch Highlight Reel
                    </a>
                  </div>
                )}

                {project.content_locked && (
                  <div className="mt-4 p-4 border border-yellow-400/20 bg-yellow-400/5">
                    <p className="font-body text-xs text-muted-foreground mb-3">
                      <Lock size={12} className="inline mr-1 text-yellow-400" />
                      Full-resolution gallery and HD video are locked. Pay your remaining balance to unlock everything instantly.
                    </p>
                    <button className="font-body text-xs tracking-[0.2em] uppercase px-6 py-3 bg-primary text-primary-foreground hover:bg-primary-light transition-all flex items-center gap-2">
                      <Eye size={12} /> Unlock Full Content
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
