import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Save, Trash2, Loader2, Lock, Unlock, FolderOpen, X } from "lucide-react";

interface Booking {
  id: string;
  booking_ref: string;
  full_name: string;
  event_type: string;
  event_date: string;
  client_user_id: string | null;
  status: string;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  booking_id: string | null;
  client_user_id: string;
  content_locked: boolean;
  status: string;
  preview_gallery_urls: string[] | null;
  full_gallery_urls: string[] | null;
  preview_video_url: string | null;
  full_video_url: string | null;
}

const emptyProject = {
  title: "", description: "", booking_id: "", preview_gallery_urls: "", full_gallery_urls: "", preview_video_url: "", full_video_url: "", content_locked: true,
};

export default function ProjectsTab({ bookings, inputCls }: { bookings: Booking[]; inputCls: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newProject, setNewProject] = useState({ ...emptyProject });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    supabase.from("projects").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setProjects(data || []); setLoading(false); });
  }, []);

  const eligibleBookings = bookings.filter(b => b.client_user_id && ["deposit_paid", "fully_paid", "completed"].includes(b.status));

  const handleBookingSelect = (bookingId: string) => {
    const b = eligibleBookings.find(b => b.id === bookingId) || null;
    setSelectedBooking(b);
    setNewProject(p => ({ ...p, booking_id: bookingId }));
  };

  const addProject = async () => {
    if (!newProject.title || !selectedBooking?.client_user_id) return;
    setSaving(true);
    const parseUrls = (s: string) => s.split("\n").map(u => u.trim()).filter(Boolean);
    const { data } = await supabase.from("projects").insert({
      title: newProject.title,
      description: newProject.description || null,
      booking_id: newProject.booking_id || null,
      client_user_id: selectedBooking.client_user_id,
      content_locked: newProject.content_locked,
      preview_gallery_urls: parseUrls(newProject.preview_gallery_urls),
      full_gallery_urls: parseUrls(newProject.full_gallery_urls),
      preview_video_url: newProject.preview_video_url || null,
      full_video_url: newProject.full_video_url || null,
      status: "delivered",
    }).select().single();
    if (data) setProjects(prev => [data, ...prev]);
    setNewProject({ ...emptyProject });
    setSelectedBooking(null);
    setShowAdd(false);
    setSaving(false);
  };

  const toggleLock = async (id: string, locked: boolean) => {
    await supabase.from("projects").update({ content_locked: locked }).eq("id", id);
    setProjects(prev => prev.map(p => p.id === id ? { ...p, content_locked: locked } : p));
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    await supabase.from("projects").delete().eq("id", id);
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={24} /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-body text-xs text-muted-foreground tracking-widest">{projects.length} projects · Deliver content to clients after events</p>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-[0.2em] uppercase px-5 py-2 hover:bg-primary-light transition-all">
          <Plus size={12} /> Add Project
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="border border-primary/40 bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-body text-xs tracking-[0.3em] uppercase text-primary">New Project Delivery</p>
              <button onClick={() => setShowAdd(false)}><X size={14} className="text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Link to Booking</label>
                <select className={inputCls} value={newProject.booking_id} onChange={e => handleBookingSelect(e.target.value)}>
                  <option value="">— Select Booking —</option>
                  {eligibleBookings.map(b => (
                    <option key={b.id} value={b.id}>{b.booking_ref} · {b.full_name} · {b.event_type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Project Title *</label>
                <input className={inputCls} placeholder="e.g. Sarah & James Wedding Gallery" value={newProject.title} onChange={e => setNewProject(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Description</label>
                <input className={inputCls} placeholder="Brief description..." value={newProject.description} onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Preview Gallery URLs (one per line)</label>
                <textarea className={`${inputCls} resize-none`} rows={3} placeholder="https://..." value={newProject.preview_gallery_urls} onChange={e => setNewProject(p => ({ ...p, preview_gallery_urls: e.target.value }))} />
              </div>
              <div>
                <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Full Gallery URLs (one per line)</label>
                <textarea className={`${inputCls} resize-none`} rows={3} placeholder="https://..." value={newProject.full_gallery_urls} onChange={e => setNewProject(p => ({ ...p, full_gallery_urls: e.target.value }))} />
              </div>
              <div>
                <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Preview Video URL</label>
                <input className={inputCls} placeholder="https://..." value={newProject.preview_video_url} onChange={e => setNewProject(p => ({ ...p, preview_video_url: e.target.value }))} />
              </div>
              <div>
                <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Full Video URL</label>
                <input className={inputCls} placeholder="https://..." value={newProject.full_video_url} onChange={e => setNewProject(p => ({ ...p, full_video_url: e.target.value }))} />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="content-locked" checked={newProject.content_locked} onChange={e => setNewProject(p => ({ ...p, content_locked: e.target.checked }))} className="accent-primary" />
                <label htmlFor="content-locked" className="font-body text-xs text-muted-foreground">Lock content (requires full payment to unlock)</label>
              </div>
            </div>
            {selectedBooking && (
              <div className="border border-primary/20 bg-primary/5 p-3 flex items-center gap-3">
                <FolderOpen size={14} className="text-primary" />
                <p className="font-body text-xs text-muted-foreground">Delivering to: <span className="text-foreground">{selectedBooking.full_name}</span> · {selectedBooking.event_type}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={addProject} disabled={saving || !newProject.title || !selectedBooking}
                className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-widest uppercase px-6 py-2 hover:bg-primary-light transition-all disabled:opacity-50">
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Deliver Project
              </button>
              <button onClick={() => setShowAdd(false)} className="border border-border text-muted-foreground font-body text-xs tracking-widest uppercase px-4 py-2 transition-all">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {projects.map((project) => {
          const booking = bookings.find(b => b.id === project.booking_id);
          return (
            <div key={project.id} className="border border-border bg-card p-5 hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h4 className="font-display text-xl text-foreground">{project.title}</h4>
                    {project.content_locked ? (
                      <span className="flex items-center gap-1 font-body text-[10px] tracking-widest uppercase text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5"><Lock size={9} /> Locked</span>
                    ) : (
                      <span className="flex items-center gap-1 font-body text-[10px] tracking-widest uppercase text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5"><Unlock size={9} /> Unlocked</span>
                    )}
                  </div>
                  {project.description && <p className="font-body text-xs text-muted-foreground">{project.description}</p>}
                  {booking && <p className="font-body text-[10px] text-primary/70 mt-1 tracking-widest">{booking.booking_ref} · {booking.full_name} · {booking.event_type}</p>}
                  <div className="flex gap-4 mt-2">
                    <span className="font-body text-[10px] text-muted-foreground">{(project.preview_gallery_urls?.length || 0)} preview · {(project.full_gallery_urls?.length || 0)} full photos</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleLock(project.id, !project.content_locked)}
                    className={`font-body text-[10px] tracking-widest uppercase px-3 py-2 border transition-all ${
                      project.content_locked ? "border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10" : "border-green-400/30 text-green-400 hover:bg-green-400/10"
                    }`}
                  >
                    {project.content_locked ? <><Lock size={10} className="inline mr-1" />Lock</> : <><Unlock size={10} className="inline mr-1" />Unlock</>}
                  </button>
                  <button onClick={() => deleteProject(project.id)} className="text-muted-foreground hover:text-destructive transition-colors p-2">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {projects.length === 0 && (
          <div className="border border-border bg-card p-16 text-center">
            <FolderOpen className="text-muted-foreground mx-auto mb-3" size={28} />
            <p className="font-body text-xs text-muted-foreground">No projects yet. Add a project to a completed booking above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
