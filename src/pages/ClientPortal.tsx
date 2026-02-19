import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import jtsLogo from "@/assets/jts-logo.png";
import {
  Lock, Unlock, Download, Eye, Play, PoundSterling, Loader2,
  CalendarDays, Clock, MapPin, CheckCircle2, Sparkles,
  ImageIcon, Video, ChevronRight, User, LogOut, Home,
  FolderOpen, CreditCard, Menu, X, Upload, FileUp, Check,
  Trash2, AlertCircle,
} from "lucide-react";

interface ProjectFile {
  name: string;
  url: string;
  size: number;
  type: "preview" | "full";
  isVideo: boolean;
}

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

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending_deposit: { label: "Deposit Pending", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: Clock },
  deposit_paid: { label: "Deposit Paid", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: CheckCircle2 },
  fully_paid: { label: "Fully Paid", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-500/15 text-red-400 border-red-500/30", icon: Lock },
  completed: { label: "Completed", color: "bg-primary/15 text-primary border-primary/30", icon: Sparkles },
};

type PortalTab = "bookings" | "projects";

export default function ClientPortal() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<PortalTab>("bookings");
  const [paying, setPaying] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [projectFiles, setProjectFiles] = useState<Record<string, ProjectFile[]>>({});
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<{ url: string; locked: boolean } | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("bookings").select("*").eq("client_user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setBookings(data || []));
    supabase.from("projects").select("*").eq("client_user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setProjects(data || []); });
  }, [user]);

  // Load files from storage for a project
  const loadProjectFiles = async (project: Project) => {
    if (projectFiles[project.id]) return;
    setLoadingFiles(true);
    const type = project.content_locked ? "preview" : "full";
    const { data: files } = await supabase.storage.from("project-files").list(`${project.id}/${type}`);
    if (files) {
      const fileList: ProjectFile[] = await Promise.all(files.map(async (f) => {
        const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(`${project.id}/${type}/${f.name}`);
        // Get signed URL for download
        const { data: signed } = await supabase.storage.from("project-files").createSignedUrl(`${project.id}/${type}/${f.name}`, 3600);
        return {
          name: f.name,
          url: signed?.signedUrl || urlData.publicUrl,
          size: f.metadata?.size || 0,
          type: type as "preview" | "full",
          isVideo: f.name.match(/\.(mp4|mov|webm|avi)$/i) !== null,
        };
      }));
      setProjectFiles(prev => ({ ...prev, [project.id]: fileList }));
    }
    setLoadingFiles(false);
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    loadProjectFiles(project);
  };

  const payBalance = async (bookingId: string, amount: number) => {
    setPaying(bookingId);
    try {
      const { data, error } = await supabase.functions.invoke("create-booking-payment", {
        body: { booking_id: bookingId, amount: Math.round(amount * 100), deposit: false },
      });
      if (error || !data?.url) throw new Error("Payment setup failed");
      if (window.top) window.top.location.href = data.url;
      else window.open(data.url, "_blank");
    } catch {
      alert("Payment setup failed. Please try again.");
    } finally {
      setPaying(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  const displayName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Client";
  const unlockedProjects = projects.filter(p => !p.content_locked).length;

  const navItems = [
    { key: "bookings" as PortalTab, label: "My Bookings", icon: CalendarDays, badge: bookings.length },
    { key: "projects" as PortalTab, label: "My Projects", icon: FolderOpen, badge: projects.length },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(30,10%,7%)", fontFamily: "Montserrat, sans-serif" }}>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6"
            onClick={() => setLightboxUrl(null)}>
            <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-10" onClick={() => setLightboxUrl(null)}><X size={24} /></button>
            <div className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
              <img
                src={lightboxUrl.url}
                alt="Preview"
                className={`max-w-full max-h-[85vh] object-contain rounded-xl select-none ${lightboxUrl.locked ? "opacity-70 blur-[1px]" : ""}`}
                onContextMenu={e => e.preventDefault()}
                draggable={false}
              />
              {lightboxUrl.locked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <img src={jtsLogo} alt="JT Studios Watermark" className="w-24 h-24 object-contain opacity-70 drop-shadow-2xl" />
                  <span className="font-body text-xs tracking-[0.4em] uppercase text-white/50 mt-3">Watermarked Preview</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SIDEBAR ── */}
      <aside className={`${sidebarOpen ? "w-72" : "w-16"} flex-shrink-0 border-r flex flex-col transition-all duration-300 relative z-30`}
        style={{ background: "hsl(30,8%,10%)", borderColor: "hsl(30,8%,15%)" }}>
        {/* Logo + toggle */}
        <div className={`flex items-center gap-3 p-5 border-b ${!sidebarOpen ? "justify-center" : ""}`} style={{ borderColor: "hsl(30,8%,15%)" }}>
          {sidebarOpen && (
            <div className="flex-1">
              <p className="font-display text-xl text-primary tracking-widest leading-none">JT Studios</p>
              <p className="font-body text-[9px] tracking-[0.3em] uppercase mt-0.5" style={{ color: "hsl(30,15%,45%)" }}>Client Portal</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg transition-colors" style={{ color: "hsl(30,15%,45%)" }}>
            {sidebarOpen ? <ChevronRight size={14} /> : <Menu size={14} />}
          </button>
        </div>

        {/* Welcome card */}
        {sidebarOpen && (
          <div className="p-4 m-4 rounded-xl border" style={{ background: "hsl(30,10%,13%)", borderColor: "hsl(30,8%,18%)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <span className="font-display text-lg text-primary">{displayName.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="font-body text-sm text-stone-100">{displayName}</p>
                <p className="font-body text-[9px] tracking-widest uppercase text-primary">Client</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg p-2" style={{ background: "hsl(30,10%,16%)" }}>
                <p className="font-display text-xl text-stone-100">{bookings.length}</p>
                <p className="font-body text-[8px] tracking-widest uppercase" style={{ color: "hsl(30,15%,45%)" }}>Bookings</p>
              </div>
              <div className="rounded-lg p-2" style={{ background: "hsl(30,10%,16%)" }}>
                <p className="font-display text-xl text-stone-100">{projects.length}</p>
                <p className="font-body text-[8px] tracking-widest uppercase" style={{ color: "hsl(30,15%,45%)" }}>Projects</p>
              </div>
              <div className="rounded-lg p-2" style={{ background: "hsl(30,10%,16%)" }}>
                <p className="font-display text-xl text-primary">{unlockedProjects}</p>
                <p className="font-body text-[8px] tracking-widest uppercase" style={{ color: "hsl(30,15%,45%)" }}>Unlocked</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-2 px-3 space-y-1">
          {navItems.map((item) => {
            const active = tab === item.key;
            return (
              <button key={item.key} onClick={() => setTab(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${active ? "bg-primary/15 text-primary" : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/50"} ${!sidebarOpen ? "justify-center" : ""}`}>
                <item.icon size={16} className="flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="font-body text-xs tracking-wider flex-1 text-left">{item.label}</span>
                    {item.badge > 0 && <span className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center ${active ? "bg-primary text-primary-foreground" : "bg-stone-700 text-stone-300"}`}>{item.badge}</span>}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom links */}
        <div className={`border-t p-4 space-y-1 ${!sidebarOpen ? "flex flex-col items-center" : ""}`} style={{ borderColor: "hsl(30,8%,15%)" }}>
          {sidebarOpen ? (
            <>
              <a href="/" className="flex items-center gap-2 text-stone-400 hover:text-stone-100 transition-colors font-body text-xs py-2 px-2 rounded-lg hover:bg-stone-800/50">
                <Home size={14} /> Back to Website
              </a>
              <button onClick={() => { signOut(); navigate("/"); }} className="w-full flex items-center gap-2 text-stone-400 hover:text-red-400 transition-colors font-body text-xs py-2 px-2 rounded-lg hover:bg-stone-800/50">
                <LogOut size={14} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <a href="/" title="Back to Website" className="text-stone-500 hover:text-stone-200 transition-colors p-2 block"><Home size={16} /></a>
              <button onClick={() => { signOut(); navigate("/"); }} title="Sign Out" className="text-stone-500 hover:text-red-400 transition-colors p-2 block"><LogOut size={16} /></button>
            </>
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 backdrop-blur-xl border-b px-8 py-5 flex items-center justify-between" style={{ background: "hsl(30,10%,7%,0.9)", borderColor: "hsl(30,8%,14%)" }}>
          <div>
            <p className="font-body text-[9px] tracking-[0.3em] uppercase mb-0.5" style={{ color: "hsl(30,15%,45%)" }}>
              {tab === "bookings" ? "Event Bookings" : "Project Deliveries"}
            </p>
            <h1 className="font-display text-2xl text-stone-100">
              {tab === "bookings" ? `Welcome back, ${displayName}` : "Your Projects"}
            </h1>
          </div>
          {tab === "bookings" && (
            <a href="/booking" className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-wider uppercase px-5 py-2.5 hover:bg-primary-light transition-all rounded-sm">
              <CalendarDays size={12} /> Book New Event
            </a>
          )}
        </header>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>

              {/* ── BOOKINGS ── */}
              {tab === "bookings" && (
                <div className="space-y-4">
                  {bookings.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-20 text-center" style={{ borderColor: "hsl(30,8%,20%)", background: "hsl(30,10%,10%)" }}>
                      <CalendarDays className="mx-auto mb-4" size={48} style={{ color: "hsl(30,15%,30%)" }} />
                      <p className="font-display text-2xl text-stone-300 mb-2">No bookings yet</p>
                      <p className="font-body text-stone-500 text-sm mb-8">Book your first event and it'll appear here.</p>
                      <a href="/booking" className="font-body text-xs tracking-[0.2em] uppercase border border-primary text-primary px-8 py-3 hover:bg-primary hover:text-primary-foreground transition-all rounded-sm inline-block">Book an Event</a>
                    </div>
                  ) : bookings.map((booking, i) => {
                    const sc = statusConfig[booking.status] || { label: booking.status, color: "", icon: Clock };
                    const StatusIcon = sc.icon;
                    return (
                      <motion.div key={booking.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className="rounded-2xl border overflow-hidden group transition-all" style={{ borderColor: "hsl(30,8%,16%)", background: "hsl(30,10%,10%)" }}>
                        {/* Color stripe based on status */}
                        <div className={`h-1 w-full ${booking.status === "fully_paid" || booking.status === "completed" ? "bg-emerald-500" : booking.status === "deposit_paid" ? "bg-blue-500" : booking.status === "cancelled" ? "bg-red-500" : "bg-amber-500"}`} />
                        <div className="p-6">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3 flex-wrap">
                                <span className="font-body text-xs text-primary/70 tracking-widest">{booking.booking_ref}</span>
                                <span className={`font-body text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full border flex items-center gap-1 ${sc.color}`}>
                                  <StatusIcon size={9} /> {sc.label}
                                </span>
                              </div>
                              <p className="font-display text-2xl text-stone-100 mb-3">{booking.event_type}</p>
                              <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-1.5" style={{ color: "hsl(30,15%,45%)" }}>
                                  <CalendarDays size={12} />
                                  <span className="font-body text-xs">{new Date(booking.event_date).toLocaleDateString("en-GB", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}</span>
                                </div>
                                <div className="flex items-center gap-1.5" style={{ color: "hsl(30,15%,45%)" }}>
                                  <Clock size={12} />
                                  <span className="font-body text-xs">{booking.start_time} – {booking.end_time}</span>
                                </div>
                                {booking.location && (
                                  <div className="flex items-center gap-1.5" style={{ color: "hsl(30,15%,45%)" }}>
                                    <MapPin size={12} />
                                    <span className="font-body text-xs">{booking.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                              <div className="text-right">
                                <p className="font-body text-[9px] tracking-widest uppercase mb-1" style={{ color: "hsl(30,15%,45%)" }}>Total Value</p>
                                <p className="font-display text-3xl text-stone-100">£{booking.estimated_total?.toFixed(0)}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-center">
                                <div className="rounded-xl px-4 py-2.5 border" style={{ background: "hsl(30,10%,13%)", borderColor: "hsl(30,8%,18%)" }}>
                                  <p className="font-body text-[8px] tracking-widest uppercase mb-1" style={{ color: "hsl(30,15%,45%)" }}>Deposit</p>
                                  <p className="font-body text-sm text-primary">£{booking.deposit_amount?.toFixed(0)}</p>
                                </div>
                                <div className="rounded-xl px-4 py-2.5 border" style={{ background: "hsl(30,10%,13%)", borderColor: "hsl(30,8%,18%)" }}>
                                  <p className="font-body text-[8px] tracking-widest uppercase mb-1" style={{ color: "hsl(30,15%,45%)" }}>Balance</p>
                                  <p className={`font-body text-sm ${booking.remaining_balance > 0 ? "text-amber-400" : "text-emerald-400"}`}>£{booking.remaining_balance?.toFixed(0)}</p>
                                </div>
                              </div>
                              {booking.status === "deposit_paid" && (
                                <button onClick={() => payBalance(booking.id, booking.remaining_balance)} disabled={paying === booking.id}
                                  className="w-full font-body text-xs tracking-[0.2em] uppercase px-5 py-3 bg-primary text-primary-foreground hover:bg-primary-light transition-all flex items-center justify-center gap-2 rounded-sm">
                                  {paying === booking.id ? <Loader2 size={12} className="animate-spin" /> : <CreditCard size={12} />}
                                  Pay Balance £{booking.remaining_balance?.toFixed(2)}
                                </button>
                              )}
                              {(booking.status === "fully_paid" || booking.status === "completed") && (
                                <div className="flex items-center gap-1.5 text-emerald-400 font-body text-xs">
                                  <Check size={12} /> Fully Paid
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* ── PROJECTS ── */}
              {tab === "projects" && (
                <div>
                  {projects.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-20 text-center" style={{ borderColor: "hsl(30,8%,20%)", background: "hsl(30,10%,10%)" }}>
                      <FolderOpen className="mx-auto mb-4" size={48} style={{ color: "hsl(30,15%,30%)" }} />
                      <p className="font-display text-2xl text-stone-300 mb-2">No projects yet</p>
                      <p className="font-body text-stone-500 text-sm max-w-sm mx-auto">Once your event is complete, your deliverables will appear here — photos, videos & highlight reels.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                      {/* Project list */}
                      <div className="xl:col-span-2 space-y-3">
                        {projects.map((project, i) => (
                          <motion.button key={project.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                            onClick={() => handleSelectProject(project)}
                            className={`w-full text-left rounded-2xl border overflow-hidden transition-all ${selectedProject?.id === project.id ? "border-primary" : "hover:border-stone-600"}`}
                            style={{ background: "hsl(30,10%,10%)", borderColor: selectedProject?.id === project.id ? undefined : "hsl(30,8%,16%)" }}>
                            <div className={`h-0.5 w-full ${project.content_locked ? "bg-amber-500/60" : "bg-emerald-500"}`} />
                            <div className="p-5">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="font-display text-lg text-stone-100 leading-tight">{project.title}</h4>
                                {project.content_locked
                                  ? <Lock size={12} className="text-amber-400 flex-shrink-0 mt-1" />
                                  : <Unlock size={12} className="text-emerald-400 flex-shrink-0 mt-1" />}
                              </div>
                              {project.description && <p className="font-body text-[11px] text-stone-500 line-clamp-2 mb-3">{project.description}</p>}
                              <div className="flex items-center justify-between">
                                <span className={`font-body text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full border ${project.content_locked ? "bg-amber-500/10 text-amber-400 border-amber-500/25" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"}`}>
                                  {project.content_locked ? "Preview Only" : "Full Access"}
                                </span>
                                <ChevronRight size={12} className="text-stone-600" />
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>

                      {/* Project detail */}
                      <div className="xl:col-span-3">
                        <AnimatePresence mode="wait">
                          {selectedProject ? (
                            <motion.div key={selectedProject.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                              className="rounded-2xl border overflow-hidden sticky top-[88px]"
                              style={{ background: "hsl(30,10%,10%)", borderColor: "hsl(30,8%,16%)" }}>
                              {/* Project header */}
                              <div className={`p-6 border-b ${selectedProject.content_locked ? "bg-amber-500/5" : "bg-emerald-500/5"}`} style={{ borderColor: "hsl(30,8%,16%)" }}>
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <h3 className="font-display text-3xl text-stone-100 mb-1">{selectedProject.title}</h3>
                                    {selectedProject.description && <p className="font-body text-xs text-stone-500">{selectedProject.description}</p>}
                                  </div>
                                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-body text-[9px] tracking-widest uppercase ${selectedProject.content_locked ? "bg-amber-500/10 text-amber-400 border-amber-500/25" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"}`}>
                                    {selectedProject.content_locked ? <><Lock size={10} /> Locked</> : <><Unlock size={10} /> Unlocked</>}
                                  </span>
                                </div>
                              </div>

                              <div className="p-6 space-y-6">
                                {/* Files from storage */}
                                {loadingFiles ? (
                                  <div className="flex items-center justify-center py-8">
                                    <Loader2 size={20} className="animate-spin text-primary" />
                                  </div>
                                ) : projectFiles[selectedProject.id]?.length > 0 ? (
                                  <div>
                                    <div className="flex items-center justify-between mb-3">
                                      <p className="font-body text-[10px] tracking-[0.25em] uppercase text-stone-400">
                                        {selectedProject.content_locked ? "Watermarked Preview" : "Full Resolution Files"}
                                      </p>
                                      {!selectedProject.content_locked && (
                                        <span className="font-body text-[9px] text-emerald-400 tracking-widest">{projectFiles[selectedProject.id]?.filter(f => !f.isVideo).length} photos · {projectFiles[selectedProject.id]?.filter(f => f.isVideo).length} videos</span>
                                      )}
                                    </div>
                                    {/* Image grid */}
                                    <div className="grid grid-cols-3 gap-2">
                                      {projectFiles[selectedProject.id]?.filter(f => !f.isVideo).slice(0, 6).map((file, j) => (
                                         <div key={j} className="relative aspect-square overflow-hidden rounded-xl group cursor-pointer border" style={{ borderColor: "hsl(30,8%,18%)" }}
                                          onClick={() => setLightboxUrl({ url: file.url, locked: selectedProject.content_locked })}>
                                          <img src={file.url} alt={file.name} onContextMenu={e => e.preventDefault()} draggable={false} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 select-none ${selectedProject.content_locked ? "opacity-60 blur-[2px]" : ""}`} />
                                          {selectedProject.content_locked ? (
                                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center rounded-xl gap-2">
                                              {/* Centered logo watermark */}
                                              <img src={jtsLogo} alt="JT Studios Watermark" className="w-10 h-10 object-contain opacity-80 drop-shadow-lg" />
                                              <span className="font-body text-[7px] tracking-[0.25em] uppercase text-white/60">Preview</span>
                                            </div>
                                          ) : (
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl gap-2">
                                              <button onClick={(e) => { e.stopPropagation(); setLightboxUrl({ url: file.url, locked: false }); }} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors">
                                                <Eye size={14} className="text-white" />
                                              </button>
                                              <a href={file.url} download={file.name} onClick={e => e.stopPropagation()} className="w-8 h-8 bg-primary/80 rounded-full flex items-center justify-center hover:bg-primary transition-colors">
                                                <Download size={14} className="text-white" />
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                    {/* Video files */}
                                    {projectFiles[selectedProject.id]?.filter(f => f.isVideo).map((file, j) => (
                                      <div key={j} className="mt-3 rounded-xl border overflow-hidden" style={{ borderColor: "hsl(30,8%,18%)", background: "hsl(30,10%,13%)" }}>
                                        {selectedProject.content_locked ? (
                                          <div className="flex items-center gap-4 p-4">
                                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                              <Video size={20} className="text-amber-400" />
                                            </div>
                                            <div>
                                              <p className="font-body text-sm text-stone-300">{file.name}</p>
                                              <p className="font-body text-xs text-amber-400">Locked — Pay balance to unlock</p>
                                            </div>
                                            <Lock size={14} className="text-amber-400 ml-auto" />
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-4 p-4">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                              <Play size={20} className="text-primary" />
                                            </div>
                                            <div className="flex-1">
                                              <p className="font-body text-sm text-stone-200">{file.name}</p>
                                              <p className="font-body text-xs text-stone-500">Video file · HD quality</p>
                                            </div>
                                            <a href={file.url} download={file.name} className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-wider uppercase px-4 py-2 rounded-sm hover:bg-primary-light transition-all">
                                              <Download size={12} /> Download
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                    {/* Download all button */}
                                    {!selectedProject.content_locked && projectFiles[selectedProject.id]?.length > 1 && (
                                      <div className="mt-4 pt-4 border-t" style={{ borderColor: "hsl(30,8%,16%)" }}>
                                        <p className="font-body text-[10px] text-stone-500 tracking-widest mb-2">Download individual files using the buttons above</p>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  /* Fallback to URL-based gallery */
                                  (selectedProject.preview_gallery_urls?.length > 0 || selectedProject.full_gallery_urls?.length > 0) && (
                                    <div>
                                      <div className="flex items-center justify-between mb-3">
                                        <p className="font-body text-[10px] tracking-[0.25em] uppercase text-stone-400">
                                          {selectedProject.content_locked ? "Watermarked Preview" : "Full Gallery"}
                                        </p>
                                      </div>
                                      <div className="grid grid-cols-3 gap-2">
                                        {(selectedProject.content_locked
                                          ? selectedProject.preview_gallery_urls
                                          : selectedProject.full_gallery_urls.length > 0
                                            ? selectedProject.full_gallery_urls
                                            : selectedProject.preview_gallery_urls
                                        ).slice(0, 6).map((url, j) => (
                                          <div key={j} className="relative aspect-square overflow-hidden rounded-xl group border cursor-pointer" style={{ borderColor: "hsl(30,8%,18%)" }}
                                            onClick={() => setLightboxUrl({ url, locked: selectedProject.content_locked })}>
                                            <img src={url} alt={`Photo ${j + 1}`} onContextMenu={e => e.preventDefault()} draggable={false} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 select-none ${selectedProject.content_locked ? "opacity-60 blur-[2px]" : ""}`} />
                                            {selectedProject.content_locked ? (
                                              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center rounded-xl gap-2">
                                                <img src={jtsLogo} alt="JT Studios Watermark" className="w-10 h-10 object-contain opacity-80 drop-shadow-lg" />
                                                <span className="font-body text-[7px] tracking-[0.25em] uppercase text-white/60">Preview</span>
                                              </div>
                                            ) : (
                                              <a href={url} download className="absolute inset-0 bg-black/0 group-hover:bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded-xl">
                                                <Download size={18} className="text-primary" />
                                              </a>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )
                                )}

                                {/* Video (URL-based fallback) */}
                                {!projectFiles[selectedProject.id]?.some(f => f.isVideo) && (selectedProject.full_video_url || selectedProject.preview_video_url) && !selectedProject.content_locked && (
                                  <div>
                                    <p className="font-body text-[10px] tracking-[0.25em] uppercase text-stone-400 mb-3">Highlight Video</p>
                                    <a href={selectedProject.full_video_url || selectedProject.preview_video_url || "#"} target="_blank" rel="noopener noreferrer"
                                      className="flex items-center gap-4 rounded-xl border p-4 hover:border-primary/40 transition-all group" style={{ background: "hsl(30,10%,13%)", borderColor: "hsl(30,8%,18%)" }}>
                                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                        <Play size={16} className="text-primary-foreground ml-0.5" />
                                      </div>
                                      <div>
                                        <p className="font-body text-sm text-stone-200">Watch Highlight Reel</p>
                                        <p className="font-body text-xs text-stone-500">HD quality · Full resolution</p>
                                      </div>
                                      <ChevronRight size={14} className="text-primary ml-auto group-hover:translate-x-1 transition-transform" />
                                    </a>
                                  </div>
                                )}

                                {/* Locked CTA */}
                                {selectedProject.content_locked && (
                                  <div className="rounded-xl border p-6" style={{ background: "hsl(30,5%,8%)", borderColor: "hsl(40,60%,45%,0.2)" }}>
                                    <div className="flex items-start gap-4">
                                      <div className="w-11 h-11 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                                        <Lock size={16} className="text-amber-400" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-display text-lg text-stone-200 mb-1">Full Content Locked</p>
                                        <p className="font-body text-xs text-stone-500 leading-relaxed mb-4">
                                          Full-resolution gallery and HD videos are locked. Pay your remaining balance to instantly unlock everything and enable downloads.
                                        </p>
                                        <button onClick={() => setTab("bookings")}
                                          className="font-body text-xs tracking-[0.2em] uppercase px-6 py-3 bg-primary text-primary-foreground hover:bg-primary-light transition-all flex items-center gap-2 rounded-sm">
                                          <CreditCard size={12} /> Pay Remaining Balance
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* No content yet */}
                                {!loadingFiles && !projectFiles[selectedProject.id]?.length && !selectedProject.preview_gallery_urls?.length && !selectedProject.full_gallery_urls?.length && (
                                  <div className="rounded-xl border border-dashed p-10 text-center" style={{ borderColor: "hsl(30,8%,20%)" }}>
                                    <AlertCircle className="mx-auto mb-3 text-stone-600" size={28} />
                                    <p className="font-body text-xs text-stone-500">Content is being prepared. Check back soon.</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                              className="rounded-2xl border border-dashed p-20 text-center" style={{ borderColor: "hsl(30,8%,20%)", background: "hsl(30,10%,10%)" }}>
                              <FolderOpen className="mx-auto mb-4" size={40} style={{ color: "hsl(30,15%,25%)" }} />
                              <p className="font-body text-xs text-stone-500">Select a project to view its content</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
