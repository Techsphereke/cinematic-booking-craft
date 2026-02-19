import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Save, Trash2, Loader2, Lock, Unlock, FolderOpen, X, Upload, Image, Video, File, Check } from "lucide-react";

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

interface UploadState {
  file: File;
  progress: number;
  done: boolean;
  error: string | null;
}

const emptyProject = { title: "", description: "", booking_id: "", content_locked: true };

export default function ProjectsTab({ bookings, inputCls }: { bookings: Booking[]; inputCls: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newProject, setNewProject] = useState({ ...emptyProject });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadState[]>([]);
  const [uploadType, setUploadType] = useState<"preview" | "full">("preview");
  const [uploadedCounts, setUploadedCounts] = useState<Record<string, { preview: number; full: number }>>({});
  const previewRef = useRef<HTMLInputElement>(null);
  const fullRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("projects").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setProjects(data || []); setLoading(false); });
  }, []);

  useEffect(() => {
    // Load file counts for each project
    projects.forEach(async (p) => {
      const [previewRes, fullRes] = await Promise.all([
        supabase.storage.from("project-files").list(`${p.id}/preview`),
        supabase.storage.from("project-files").list(`${p.id}/full`),
      ]);
      setUploadedCounts(prev => ({
        ...prev,
        [p.id]: {
          preview: previewRes.data?.length || 0,
          full: fullRes.data?.length || 0,
        }
      }));
    });
  }, [projects]);

  const eligibleBookings = bookings.filter(b => b.client_user_id && ["deposit_paid", "fully_paid", "completed"].includes(b.status));

  const handleBookingSelect = (bookingId: string) => {
    const b = eligibleBookings.find(b => b.id === bookingId) || null;
    setSelectedBooking(b);
    setNewProject(p => ({ ...p, booking_id: bookingId }));
  };

  const addProject = async () => {
    if (!newProject.title || !selectedBooking?.client_user_id) return;
    setSaving(true);
    const { data } = await supabase.from("projects").insert({
      title: newProject.title,
      description: newProject.description || null,
      booking_id: newProject.booking_id || null,
      client_user_id: selectedBooking.client_user_id,
      content_locked: newProject.content_locked,
      preview_gallery_urls: [],
      full_gallery_urls: [],
      preview_video_url: null,
      full_video_url: null,
      status: "delivered",
    }).select().single();
    if (data) {
      setProjects(prev => [data, ...prev]);
      setSelectedProject(data);
    }
    setNewProject({ ...emptyProject });
    setSelectedBooking(null);
    setShowAdd(false);
    setSaving(false);
  };

  const toggleLock = async (id: string, locked: boolean) => {
    await supabase.from("projects").update({ content_locked: locked }).eq("id", id);
    setProjects(prev => prev.map(p => p.id === id ? { ...p, content_locked: locked } : p));
    if (selectedProject?.id === id) setSelectedProject(prev => prev ? { ...prev, content_locked: locked } : prev);
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Delete this project? All uploaded files will also be removed.")) return;
    // Remove storage files
    const [previewList, fullList] = await Promise.all([
      supabase.storage.from("project-files").list(`${id}/preview`),
      supabase.storage.from("project-files").list(`${id}/full`),
    ]);
    const allFiles = [
      ...(previewList.data || []).map(f => `${id}/preview/${f.name}`),
      ...(fullList.data || []).map(f => `${id}/full/${f.name}`),
    ];
    if (allFiles.length > 0) await supabase.storage.from("project-files").remove(allFiles);
    await supabase.from("projects").delete().eq("id", id);
    setProjects(prev => prev.filter(p => p.id !== id));
    if (selectedProject?.id === id) setSelectedProject(null);
  };

  const uploadFiles = async (files: FileList | null, type: "preview" | "full") => {
    if (!files || !selectedProject) return;
    const fileArray = Array.from(files);
    const states: UploadState[] = fileArray.map(f => ({ file: f, progress: 0, done: false, error: null }));
    setUploadingFiles(states);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const path = `${selectedProject.id}/${type}/${Date.now()}-${file.name}`;
      setUploadingFiles(prev => prev.map((s, idx) => idx === i ? { ...s, progress: 30 } : s));
      const { error } = await supabase.storage.from("project-files").upload(path, file, { upsert: false });
      if (error) {
        setUploadingFiles(prev => prev.map((s, idx) => idx === i ? { ...s, error: error.message, progress: 0 } : s));
      } else {
        setUploadingFiles(prev => prev.map((s, idx) => idx === i ? { ...s, progress: 100, done: true } : s));
        // Update counts
        setUploadedCounts(prev => ({
          ...prev,
          [selectedProject.id]: {
            ...prev[selectedProject.id],
            [type]: (prev[selectedProject.id]?.[type] || 0) + 1,
          }
        }));
      }
    }
    setTimeout(() => setUploadingFiles([]), 2500);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={24} /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-body text-xs text-zinc-400 tracking-widest">{projects.length} projects · Link deliverables to client bookings</p>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-[0.2em] uppercase px-5 py-2.5 hover:bg-primary-light transition-all rounded-sm">
          <Plus size={12} /> New Project
        </button>
      </div>

      {/* Add Project Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="border border-primary/30 rounded-xl p-6 space-y-4 bg-zinc-950">
            <div className="flex items-center justify-between">
              <p className="font-body text-xs tracking-[0.3em] uppercase text-primary">Create Project Delivery</p>
              <button onClick={() => setShowAdd(false)}><X size={14} className="text-zinc-500" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Link to Booking *</label>
                <select className={inputCls} value={newProject.booking_id} onChange={e => handleBookingSelect(e.target.value)}>
                  <option value="">— Select eligible booking —</option>
                  {eligibleBookings.map(b => <option key={b.id} value={b.id}>{b.booking_ref} · {b.full_name} · {b.event_type}</option>)}
                </select>
                {eligibleBookings.length === 0 && <p className="font-body text-[10px] text-amber-400 mt-1">No eligible bookings (need deposit_paid, fully_paid or completed status)</p>}
              </div>
              <div>
                <label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Project Title *</label>
                <input className={inputCls} placeholder="e.g. Sarah & James Wedding Gallery" value={newProject.title} onChange={e => setNewProject(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Description</label>
                <input className={inputCls} placeholder="Brief description for the client..." value={newProject.description} onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="content-locked" checked={newProject.content_locked} onChange={e => setNewProject(p => ({ ...p, content_locked: e.target.checked }))} className="accent-primary" />
                <label htmlFor="content-locked" className="font-body text-xs text-zinc-400">Start locked (preview only until full payment)</label>
              </div>
            </div>
            {selectedBooking && (
              <div className="border border-primary/20 bg-primary/5 rounded-lg p-3 flex items-center gap-3">
                <FolderOpen size={14} className="text-primary" />
                <p className="font-body text-xs text-zinc-400">Delivering to: <span className="text-zinc-100">{selectedBooking.full_name}</span> · {selectedBooking.event_type} · {selectedBooking.event_date}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={addProject} disabled={saving || !newProject.title || !selectedBooking}
                className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-widest uppercase px-6 py-2.5 hover:bg-primary-light transition-all disabled:opacity-50 rounded-sm">
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Create Project
              </button>
              <button onClick={() => setShowAdd(false)} className="border border-zinc-700 text-zinc-400 font-body text-xs tracking-widest uppercase px-4 py-2.5 rounded-sm">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project list + upload panel */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* List */}
        <div className="xl:col-span-2 space-y-3">
          {projects.map((project) => {
            const booking = bookings.find(b => b.id === project.booking_id);
            const counts = uploadedCounts[project.id];
            return (
              <div key={project.id}
                onClick={() => setSelectedProject(selectedProject?.id === project.id ? null : project)}
                className={`border rounded-xl p-5 cursor-pointer transition-all hover:border-zinc-600 ${selectedProject?.id === project.id ? "border-primary bg-primary/5" : "border-zinc-800 bg-zinc-950"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-display text-lg text-zinc-100">{project.title}</h4>
                      {project.content_locked
                        ? <span className="flex items-center gap-1 font-body text-[9px] tracking-widest uppercase text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full"><Lock size={8} /> Locked</span>
                        : <span className="flex items-center gap-1 font-body text-[9px] tracking-widest uppercase text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full"><Unlock size={8} /> Unlocked</span>}
                    </div>
                    {project.description && <p className="font-body text-xs text-zinc-500 line-clamp-1">{project.description}</p>}
                    {booking && <p className="font-body text-[10px] text-primary/70 mt-1 tracking-widest">{booking.booking_ref} · {booking.full_name}</p>}
                    <div className="flex gap-3 mt-2">
                      <span className="font-body text-[10px] text-zinc-500 flex items-center gap-1"><Image size={9} /> {counts?.preview || 0} preview · {counts?.full || 0} full</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); toggleLock(project.id, !project.content_locked); }}
                      className={`font-body text-[9px] tracking-widest uppercase px-2.5 py-1.5 rounded-sm border transition-all ${project.content_locked ? "border-amber-400/30 text-amber-400 hover:bg-amber-400/10" : "border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10"}`}>
                      {project.content_locked ? <><Lock size={9} className="inline mr-1" />Lock</> : <><Unlock size={9} className="inline mr-1" />Unlock</>}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }} className="text-zinc-600 hover:text-red-400 transition-colors p-1.5 rounded-sm hover:bg-zinc-800">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {projects.length === 0 && (
            <div className="border border-dashed border-zinc-800 rounded-xl p-14 text-center">
              <FolderOpen className="text-zinc-600 mx-auto mb-3" size={28} />
              <p className="font-body text-xs text-zinc-500">No projects yet. Create a project linked to a completed booking.</p>
            </div>
          )}
        </div>

        {/* Upload panel */}
        <div className="xl:col-span-3">
          {selectedProject ? (
            <motion.div key={selectedProject.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
              className="border border-zinc-800 rounded-xl bg-zinc-950 sticky top-[88px]">
              <div className="p-5 border-b border-zinc-800">
                <h4 className="font-display text-xl text-zinc-100 mb-0.5">{selectedProject.title}</h4>
                <p className="font-body text-[10px] text-zinc-500 tracking-widest">Upload files for this project · Files are stored securely in the cloud</p>
              </div>
              <div className="p-5 space-y-5">
                {/* Type selector */}
                <div className="flex gap-2">
                  {(["preview", "full"] as const).map((t) => (
                    <button key={t} onClick={() => setUploadType(t)}
                      className={`flex-1 py-2 rounded-lg font-body text-xs tracking-wider uppercase border transition-all ${uploadType === t ? "bg-primary/15 border-primary/40 text-primary" : "border-zinc-800 text-zinc-500 hover:border-zinc-700"}`}>
                      {t === "preview" ? <><Lock size={10} className="inline mr-1.5" />Preview Files</> : <><Unlock size={10} className="inline mr-1.5" />Full Resolution</>}
                    </button>
                  ))}
                </div>

                {/* Upload area */}
                <div
                  className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:border-primary/40 transition-all cursor-pointer group"
                  onClick={() => uploadType === "preview" ? previewRef.current?.click() : fullRef.current?.click()}>
                  <Upload size={28} className="mx-auto mb-3 text-zinc-600 group-hover:text-primary transition-colors" />
                  <p className="font-body text-sm text-zinc-300 mb-1">Drop files or click to upload</p>
                  <p className="font-body text-[10px] text-zinc-600 tracking-widest">
                    {uploadType === "preview" ? "JPEG, PNG, MP4 — Watermarked previews (visible before payment)" : "JPEG, PNG, MP4, ZIP — Full resolution (unlocked after full payment)"}
                  </p>
                </div>
                <input ref={previewRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={e => uploadFiles(e.target.files, "preview")} />
                <input ref={fullRef} type="file" multiple accept="image/*,video/*,.zip" className="hidden" onChange={e => uploadFiles(e.target.files, "full")} />

                {/* Upload progress */}
                <AnimatePresence>
                  {uploadingFiles.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                      {uploadingFiles.map((u, i) => (
                        <div key={i} className="flex items-center gap-3 bg-zinc-900 rounded-lg px-4 py-3">
                          <File size={14} className="text-zinc-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-xs text-zinc-300 truncate">{u.file.name}</p>
                            {!u.done && !u.error && (
                              <div className="mt-1.5 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${u.progress}%` }} />
                              </div>
                            )}
                            {u.error && <p className="font-body text-[10px] text-red-400 mt-0.5">{u.error}</p>}
                          </div>
                          {u.done && <Check size={14} className="text-emerald-400 flex-shrink-0" />}
                          {u.error && <X size={14} className="text-red-400 flex-shrink-0" />}
                          {!u.done && !u.error && <Loader2 size={14} className="animate-spin text-primary flex-shrink-0" />}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* File counts */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Preview Files", count: uploadedCounts[selectedProject.id]?.preview || 0, locked: true, desc: "Visible to client (watermarked)" },
                    { label: "Full Files", count: uploadedCounts[selectedProject.id]?.full || 0, locked: false, desc: "Unlocked after full payment" },
                  ].map((item) => (
                    <div key={item.label} className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 text-center">
                      {item.locked ? <Lock size={16} className="text-amber-400 mx-auto mb-2" /> : <Unlock size={16} className="text-emerald-400 mx-auto mb-2" />}
                      <p className="font-display text-2xl text-zinc-100">{item.count}</p>
                      <p className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mt-0.5">{item.label}</p>
                      <p className="font-body text-[9px] text-zinc-600 mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Lock/unlock toggle */}
                <div className={`rounded-xl border p-4 ${selectedProject.content_locked ? "bg-amber-500/5 border-amber-500/20" : "bg-emerald-500/5 border-emerald-500/20"}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-body text-xs text-zinc-300 mb-0.5">Content Access</p>
                      <p className="font-body text-[10px] text-zinc-500">{selectedProject.content_locked ? "Client sees preview only. Unlock when fully paid." : "Client has full access and can download all files."}</p>
                    </div>
                    <button
                      onClick={() => toggleLock(selectedProject.id, !selectedProject.content_locked)}
                      className={`flex items-center gap-2 font-body text-xs tracking-wider uppercase px-4 py-2 rounded-sm transition-all ${selectedProject.content_locked ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25" : "bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25"}`}>
                      {selectedProject.content_locked ? <><Unlock size={11} /> Unlock Now</> : <><Lock size={11} /> Lock</>}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="border border-dashed border-zinc-800 rounded-xl p-16 text-center">
              <FolderOpen className="text-zinc-700 mx-auto mb-3" size={32} />
              <p className="font-body text-xs text-zinc-600">Select a project to manage its files</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
