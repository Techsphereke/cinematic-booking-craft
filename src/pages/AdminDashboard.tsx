import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import ProjectsTab from "@/components/admin/ProjectsTab";
import UsersTab from "@/components/admin/UsersTab";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import {
  Calendar, PoundSterling, BookOpen, Plus, Trash2, Loader2,
  MessageSquare, Mail, Phone, RefreshCw, CheckCircle, XCircle,
  TrendingUp, Users, Edit2, Save, X, UserPlus, Briefcase, Image, Star,
  FolderOpen, Lock, Unlock, Shield, ShieldOff, LayoutDashboard, Settings,
  ChevronLeft, ChevronRight, LogOut, Menu, Clock, Activity, Home,
  FileText, FileSignature, Download,
} from "lucide-react";
import { generateBookingPDF, generateAgreementPDF } from "@/lib/pdfGenerator";

interface Booking {
  id: string;
  booking_ref: string;
  full_name: string;
  email: string;
  phone: string;
  event_type: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  status: string;
  estimated_total: number;
  deposit_amount: number;
  remaining_balance: number;
  special_notes?: string | null;
  client_user_id: string | null;
  services?: { name: string } | null;
}

interface Service {
  id: string;
  name: string;
  slug: string;
  hourly_rate: number;
  description?: string | null;
  icon?: string | null;
}

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  active: boolean;
}

interface QuoteRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  event_type: string;
  service_interest: string;
  event_date?: string | null;
  guests_estimate?: number | null;
  location?: string | null;
  budget_range?: string | null;
  message: string;
  status: string;
  admin_notes?: string | null;
  created_at: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  description?: string | null;
  image_url: string;
  video_url?: string | null;
  featured: boolean;
  sort_order?: number | null;
}

const statusOptions = ["pending_deposit", "deposit_paid", "fully_paid", "cancelled", "completed"];
const statusLabel: Record<string, string> = {
  pending_deposit: "Deposit Pending",
  deposit_paid: "Deposit Paid",
  fully_paid: "Fully Paid",
  cancelled: "Cancelled",
  completed: "Completed",
};
const statusColor: Record<string, string> = {
  pending_deposit: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  deposit_paid: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  fully_paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
  completed: "bg-primary/15 text-primary border-primary/30",
};
const quoteStatusOptions = ["new", "contacted", "quoted", "booked", "declined"];
const quoteStatusLabel: Record<string, string> = { new: "New", contacted: "Contacted", quoted: "Quoted", booked: "Booked", declined: "Declined" };
const portfolioCategories = ["Photography", "Videography", "Event Hosting", "Event Planning", "Wedding", "Corporate", "Other"];

type TabType = "overview" | "bookings" | "quotes" | "projects" | "users" | "services" | "staff" | "portfolio" | "dates";

const emptyService = { name: "", slug: "", hourly_rate: 150, description: "", icon: "" };
const emptyStaff = { full_name: "", role: "", email: "", phone: "", bio: "", avatar_url: "" };
const emptyPortfolio = { title: "", category: "Photography", description: "", image_url: "", video_url: "", featured: false };

export default function AdminDashboard() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabType>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [blockedDates, setBlockedDates] = useState<{ id: string; blocked_date: string; reason: string | null }[]>([]);
  const [newDate, setNewDate] = useState("");
  const [newDateReason, setNewDateReason] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editServiceData, setEditServiceData] = useState<Partial<Service>>({});
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({ ...emptyService });
  const [savingService, setSavingService] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editStaffData, setEditStaffData] = useState<Partial<StaffMember>>({});
  const [newStaff, setNewStaff] = useState({ ...emptyStaff });
  const [savingStaff, setSavingStaff] = useState(false);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [newPortfolioItem, setNewPortfolioItem] = useState({ ...emptyPortfolio });
  const [editingPortfolioId, setEditingPortfolioId] = useState<string | null>(null);
  const [editPortfolioData, setEditPortfolioData] = useState<Partial<PortfolioItem>>({});
  const [savingPortfolio, setSavingPortfolio] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/");
  }, [user, isAdmin, loading, navigate]);

  const fetchAll = async () => {
    if (!isAdmin) return;
    setRefreshing(true);
    const [bRes, sRes, qRes, dRes, stRes, pRes] = await Promise.all([
      supabase.from("bookings").select("*, services(name)").order("created_at", { ascending: false }),
      supabase.from("services").select("*").order("name"),
      supabase.from("quote_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("blocked_dates").select("*").order("blocked_date"),
      supabase.from("staff").select("*").order("full_name"),
      supabase.from("portfolio").select("*").order("sort_order", { ascending: true }),
    ]);
    if (bRes.data) setBookings(bRes.data);
    if (sRes.data) setServices(sRes.data);
    if (qRes.data) setQuotes(qRes.data);
    if (dRes.data) setBlockedDates(dRes.data);
    if (stRes.data) setStaff(stRes.data);
    if (pRes.data) setPortfolio(pRes.data);
    setRefreshing(false);
  };

  useEffect(() => { fetchAll(); }, [isAdmin]);

  const updateBookingStatus = async (id: string, status: string) => {
    setUpdating(id);
    await supabase.from("bookings").update({ status }).eq("id", id);
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
    if (selectedBooking?.id === id) setSelectedBooking((b) => b ? { ...b, status } : b);
    setUpdating(null);
  };

  const updateQuoteStatus = async (id: string, status: string) => {
    await supabase.from("quote_requests").update({ status }).eq("id", id);
    setQuotes((prev) => prev.map((q) => q.id === id ? { ...q, status } : q));
    if (selectedQuote?.id === id) setSelectedQuote((q) => q ? { ...q, status } : q);
  };

  const updateQuoteNotes = async (id: string, notes: string) => {
    await supabase.from("quote_requests").update({ admin_notes: notes }).eq("id", id);
    setQuotes((prev) => prev.map((q) => q.id === id ? { ...q, admin_notes: notes } : q));
  };

  const startEditService = (s: Service) => { setEditingServiceId(s.id); setEditServiceData({ ...s }); };
  const saveEditService = async () => {
    if (!editingServiceId) return;
    setSavingService(true);
    await supabase.from("services").update({ name: editServiceData.name, slug: editServiceData.slug || editServiceData.name?.toLowerCase().replace(/\s+/g, '-'), hourly_rate: editServiceData.hourly_rate, description: editServiceData.description, icon: editServiceData.icon }).eq("id", editingServiceId);
    setServices((prev) => prev.map((s) => s.id === editingServiceId ? { ...s, ...editServiceData } as Service : s));
    setEditingServiceId(null); setSavingService(false);
  };
  const addService = async () => {
    if (!newService.name) return;
    setSavingService(true);
    const { data } = await supabase.from("services").insert({ name: newService.name, slug: newService.slug || newService.name.toLowerCase().replace(/\s+/g, '-'), hourly_rate: newService.hourly_rate, description: newService.description || null, icon: newService.icon || null }).select().single();
    if (data) setServices((prev) => [...prev, data]);
    setNewService({ ...emptyService }); setShowAddService(false); setSavingService(false);
  };
  const deleteService = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    await supabase.from("services").delete().eq("id", id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const startEditStaff = (m: StaffMember) => { setEditingStaffId(m.id); setEditStaffData({ ...m }); };
  const saveEditStaff = async () => {
    if (!editingStaffId) return;
    setSavingStaff(true);
    await supabase.from("staff").update({ full_name: editStaffData.full_name, role: editStaffData.role, email: editStaffData.email, phone: editStaffData.phone, bio: editStaffData.bio, avatar_url: editStaffData.avatar_url, active: editStaffData.active }).eq("id", editingStaffId);
    setStaff((prev) => prev.map((s) => s.id === editingStaffId ? { ...s, ...editStaffData } as StaffMember : s));
    setEditingStaffId(null); setSavingStaff(false);
  };
  const addStaff = async () => {
    if (!newStaff.full_name || !newStaff.role) return;
    setSavingStaff(true);
    const { data } = await supabase.from("staff").insert({ full_name: newStaff.full_name, role: newStaff.role, email: newStaff.email || null, phone: newStaff.phone || null, bio: newStaff.bio || null, avatar_url: newStaff.avatar_url || null, active: true }).select().single();
    if (data) setStaff((prev) => [...prev, data]);
    setNewStaff({ ...emptyStaff }); setShowAddStaff(false); setSavingStaff(false);
  };
  const toggleStaffActive = async (id: string, active: boolean) => {
    await supabase.from("staff").update({ active }).eq("id", id);
    setStaff((prev) => prev.map((s) => s.id === id ? { ...s, active } : s));
  };
  const deleteStaff = async (id: string) => {
    if (!confirm("Remove this team member?")) return;
    await supabase.from("staff").delete().eq("id", id);
    setStaff((prev) => prev.filter((s) => s.id !== id));
  };

  const addBlockedDate = async () => {
    if (!newDate) return;
    const { data } = await supabase.from("blocked_dates").insert({ blocked_date: newDate, reason: newDateReason || null }).select().single();
    if (data) setBlockedDates((prev) => [...prev, data]);
    setNewDate(""); setNewDateReason("");
  };
  const removeBlockedDate = async (id: string) => {
    await supabase.from("blocked_dates").delete().eq("id", id);
    setBlockedDates((prev) => prev.filter((d) => d.id !== id));
  };

  const addPortfolioItem = async () => {
    if (!newPortfolioItem.title || !newPortfolioItem.image_url) return;
    setSavingPortfolio(true);
    const { data } = await supabase.from("portfolio").insert({ title: newPortfolioItem.title, category: newPortfolioItem.category, description: newPortfolioItem.description || null, image_url: newPortfolioItem.image_url, video_url: newPortfolioItem.video_url || null, featured: newPortfolioItem.featured, sort_order: portfolio.length }).select().single();
    if (data) setPortfolio((prev) => [...prev, data]);
    setNewPortfolioItem({ ...emptyPortfolio }); setShowAddPortfolio(false); setSavingPortfolio(false);
  };
  const startEditPortfolio = (item: PortfolioItem) => { setEditingPortfolioId(item.id); setEditPortfolioData({ ...item }); };
  const saveEditPortfolio = async () => {
    if (!editingPortfolioId) return;
    setSavingPortfolio(true);
    await supabase.from("portfolio").update({ title: editPortfolioData.title, category: editPortfolioData.category, description: editPortfolioData.description, image_url: editPortfolioData.image_url, video_url: editPortfolioData.video_url || null, featured: editPortfolioData.featured }).eq("id", editingPortfolioId);
    setPortfolio((prev) => prev.map((p) => p.id === editingPortfolioId ? { ...p, ...editPortfolioData } as PortfolioItem : p));
    setEditingPortfolioId(null); setSavingPortfolio(false);
  };
  const togglePortfolioFeatured = async (id: string, featured: boolean) => {
    await supabase.from("portfolio").update({ featured }).eq("id", id);
    setPortfolio((prev) => prev.map((p) => p.id === id ? { ...p, featured } : p));
  };
  const deletePortfolioItem = async (id: string) => {
    if (!confirm("Delete this portfolio item?")) return;
    await supabase.from("portfolio").delete().eq("id", id);
    setPortfolio((prev) => prev.filter((p) => p.id !== id));
  };

  const totalRevenue = bookings.filter((b) => ["fully_paid", "completed"].includes(b.status)).reduce((s, b) => s + (b.estimated_total || 0), 0);
  const depositsReceived = bookings.filter((b) => ["deposit_paid", "fully_paid", "completed"].includes(b.status)).reduce((s, b) => s + (b.deposit_amount || 0), 0);
  const pendingBalance = bookings.filter((b) => b.status === "deposit_paid").reduce((s, b) => s + (b.remaining_balance || 0), 0);
  const newQuotes = quotes.filter((q) => q.status === "new").length;

  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(); date.setMonth(date.getMonth() - (5 - i));
    const month = date.toLocaleString("en-GB", { month: "short" });
    const revenue = bookings.filter((b) => { const d = new Date(b.event_date); return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear() && ["fully_paid", "completed"].includes(b.status); }).reduce((s, b) => s + (b.estimated_total || 0), 0);
    const count = bookings.filter((b) => { const d = new Date(b.event_date); return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear(); }).length;
    return { month, revenue, bookings: count };
  });

  const serviceDistribution = services.map((s) => ({ name: s.name, value: bookings.filter((b) => b.services?.name === s.name).length })).filter((s) => s.value > 0);
  const COLORS = ["hsl(var(--primary))", "hsl(30,80%,55%)", "hsl(200,70%,55%)", "hsl(280,60%,60%)"];

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  const navItems: { key: TabType; label: string; icon: any; badge?: number }[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "bookings", label: "Bookings", icon: BookOpen, badge: bookings.filter(b => b.status === "pending_deposit").length || undefined },
    { key: "quotes", label: "Quotes", icon: MessageSquare, badge: newQuotes || undefined },
    { key: "projects", label: "Projects", icon: FolderOpen },
    { key: "users", label: "Users", icon: Users },
    { key: "services", label: "Services", icon: Briefcase },
    { key: "staff", label: "Team", icon: UserPlus },
    { key: "portfolio", label: "Portfolio", icon: Image },
    { key: "dates", label: "Blocked Dates", icon: Calendar },
  ];

  const inp = "w-full bg-zinc-900 border border-zinc-700 text-zinc-100 font-body text-sm px-3 py-2.5 focus:outline-none focus:border-primary placeholder:text-zinc-600 rounded-sm transition-colors";

  return (
    <div className="min-h-screen bg-zinc-950 flex" style={{ fontFamily: "Montserrat, sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside className={`${sidebarOpen ? "w-64" : "w-16"} flex-shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col transition-all duration-300 relative z-30`}>
        {/* Logo area */}
        <div className={`flex items-center gap-3 p-5 border-b border-zinc-800 ${sidebarOpen ? "" : "justify-center"}`}>
          {sidebarOpen && (
            <div>
              <p className="font-display text-xl text-primary tracking-widest leading-none">JT Studios</p>
              <p className="font-body text-[9px] text-zinc-500 tracking-[0.3em] uppercase mt-0.5">Admin Console</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`ml-auto p-1.5 rounded-sm hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-all ${!sidebarOpen ? "ml-0" : ""}`}>
            {sidebarOpen ? <ChevronLeft size={14} /> : <Menu size={14} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                title={!sidebarOpen ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all relative group ${
                  active
                    ? "bg-primary/10 text-primary border-r-2 border-primary"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                } ${!sidebarOpen ? "justify-center px-0" : ""}`}
              >
                <item.icon size={16} className="flex-shrink-0" />
                {sidebarOpen && (
                  <span className="font-body text-xs tracking-wider flex-1 text-left">{item.label}</span>
                )}
                {sidebarOpen && item.badge ? (
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center flex-shrink-0">{item.badge}</span>
                ) : null}
                {!sidebarOpen && item.badge ? (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                ) : null}
                {/* Tooltip when collapsed */}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-zinc-100 text-xs rounded-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User info + sign out */}
        <div className={`border-t border-zinc-800 p-4 ${!sidebarOpen ? "flex flex-col items-center gap-2" : ""}`}>
          {sidebarOpen ? (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
                  <Shield size={12} className="text-primary" />
                </div>
                <div className="overflow-hidden">
                  <p className="font-body text-xs text-zinc-100 truncate">{user?.email}</p>
                  <p className="font-body text-[9px] text-primary tracking-widest uppercase">Administrator</p>
                </div>
              </div>
              <a href="/" className="w-full flex items-center gap-2 text-zinc-500 hover:text-zinc-200 transition-colors font-body text-xs py-1.5 mb-1">
                <Home size={12} /> Back to Website
              </a>
              <button onClick={() => { signOut(); navigate("/"); }} className="w-full flex items-center gap-2 text-zinc-500 hover:text-red-400 transition-colors font-body text-xs py-1">
                <LogOut size={12} /> Sign Out
              </button>
            </div>
          ) : (
            <>
              <a href="/" title="Back to Website" className="text-zinc-500 hover:text-zinc-200 transition-colors p-1.5 block">
                <Home size={16} />
              </a>
              <button onClick={() => { signOut(); navigate("/"); }} title="Sign Out" className="text-zinc-500 hover:text-red-400 transition-colors p-1.5 block">
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-8 py-4 flex items-center justify-between">
          <div>
            <p className="font-body text-[10px] text-zinc-500 tracking-[0.3em] uppercase mb-0.5">
              {navItems.find(n => n.key === tab)?.label}
            </p>
            <h1 className="font-display text-2xl text-zinc-100">
              {tab === "overview" && "Dashboard Overview"}
              {tab === "bookings" && "Booking Management"}
              {tab === "quotes" && "Quote Requests"}
              {tab === "projects" && "Project Deliveries"}
              {tab === "users" && "User Management"}
              {tab === "services" && "Services & Pricing"}
              {tab === "staff" && "Team Management"}
              {tab === "portfolio" && "Portfolio"}
              {tab === "dates" && "Blocked Dates"}
            </h1>
          </div>
          <button onClick={fetchAll} disabled={refreshing} className="flex items-center gap-2 border border-zinc-700 text-zinc-400 hover:border-primary hover:text-primary transition-all px-4 py-2 font-body text-xs tracking-widest uppercase rounded-sm">
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>

              {/* ── OVERVIEW ── */}
              {tab === "overview" && (
                <div className="space-y-6">
                  {/* Stat cards */}
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    {[
                      { label: "Total Bookings", value: bookings.length, sub: `${bookings.filter(b => b.status === "pending_deposit").length} awaiting deposit`, icon: BookOpen, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                      { label: "Revenue", value: `£${totalRevenue.toFixed(0)}`, sub: "From completed events", icon: PoundSterling, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
                      { label: "Deposits In", value: `£${depositsReceived.toFixed(0)}`, sub: `£${pendingBalance.toFixed(0)} balance pending`, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                      { label: "New Quotes", value: newQuotes, sub: `${quotes.length} total requests`, icon: MessageSquare, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
                    ].map((stat, i) => (
                      <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        className={`rounded-xl border ${stat.border} ${stat.bg} p-5`}>
                        <div className={`w-9 h-9 rounded-lg ${stat.bg} border ${stat.border} flex items-center justify-center mb-4`}>
                          <stat.icon size={16} className={stat.color} />
                        </div>
                        <p className={`font-display text-3xl ${stat.color} mb-1`}>{stat.value}</p>
                        <p className="font-body text-xs text-zinc-300 tracking-wide mb-1">{stat.label}</p>
                        <p className="font-body text-[10px] text-zinc-500">{stat.sub}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                      <p className="font-body text-xs tracking-[0.2em] uppercase text-zinc-400 mb-5">Revenue — Last 6 Months</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={monthlyRevenue}>
                          <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontFamily: "Montserrat", fontSize: 11 }} />
                          <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} name="Revenue (£)" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                      <p className="font-body text-xs tracking-[0.2em] uppercase text-zinc-400 mb-5">By Service</p>
                      {serviceDistribution.length > 0 ? (
                        <>
                          <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                              <Pie data={serviceDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                                {serviceDistribution.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                              </Pie>
                              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: 11 }} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="space-y-1.5 mt-3">
                            {serviceDistribution.map((s, i) => (
                              <div key={s.name} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                                <span className="font-body text-[10px] text-zinc-400">{s.name} ({s.value})</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : <p className="font-body text-xs text-zinc-500 text-center py-12">No booking data yet</p>}
                    </div>
                  </div>

                  {/* Recent activity */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                      <p className="font-body text-xs tracking-[0.2em] uppercase text-zinc-400 mb-4">Recent Bookings</p>
                      <div className="space-y-3">
                        {bookings.slice(0, 5).map((b) => (
                          <div key={b.id} className="flex items-center justify-between py-2.5 border-b border-zinc-800 last:border-0">
                            <div>
                              <p className="font-body text-sm text-zinc-100">{b.full_name}</p>
                              <p className="font-body text-[10px] text-zinc-500">{b.event_type} · {b.event_date}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-body text-sm text-primary">£{b.estimated_total?.toFixed(0)}</p>
                              <span className={`font-body text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full border ${statusColor[b.status] || ""}`}>{statusLabel[b.status]}</span>
                            </div>
                          </div>
                        ))}
                        {bookings.length === 0 && <p className="font-body text-xs text-zinc-500 text-center py-6">No bookings yet</p>}
                      </div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                      <p className="font-body text-xs tracking-[0.2em] uppercase text-zinc-400 mb-4">Recent Quotes</p>
                      <div className="space-y-3">
                        {quotes.slice(0, 5).map((q) => (
                          <div key={q.id} className="flex items-center justify-between py-2.5 border-b border-zinc-800 last:border-0">
                            <div>
                              <p className="font-body text-sm text-zinc-100">{q.full_name}</p>
                              <p className="font-body text-[10px] text-zinc-500">{q.service_interest}</p>
                            </div>
                            <span className={`font-body text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full border ${q.status === "new" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : q.status === "booked" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : q.status === "declined" ? "bg-red-500/15 text-red-400 border-red-500/30" : "bg-blue-500/15 text-blue-400 border-blue-500/30"}`}>
                              {quoteStatusLabel[q.status]}
                            </span>
                          </div>
                        ))}
                        {quotes.length === 0 && <p className="font-body text-xs text-zinc-500 text-center py-6">No quotes yet</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── BOOKINGS ── */}
              {tab === "bookings" && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-2 space-y-3 max-h-[calc(100vh-160px)] overflow-y-auto pr-1">
                    {bookings.map((b) => (
                      <div key={b.id} onClick={() => setSelectedBooking(b)}
                        className={`bg-zinc-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/50 ${selectedBooking?.id === b.id ? "border-primary" : "border-zinc-800"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-body text-[10px] text-primary tracking-wider">{b.booking_ref}</span>
                          <span className={`font-body text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full border ${statusColor[b.status] || ""}`}>{statusLabel[b.status]}</span>
                        </div>
                        <p className="font-display text-lg text-zinc-100">{b.full_name}</p>
                        <p className="font-body text-xs text-zinc-500 mt-0.5">{b.event_type} · {b.event_date}</p>
                        <p className="font-body text-sm text-primary mt-2">£{b.estimated_total?.toFixed(2)}</p>
                      </div>
                    ))}
                    {bookings.length === 0 && <p className="font-body text-xs text-zinc-500 text-center py-12">No bookings yet.</p>}
                  </div>
                  <div className="lg:col-span-3">
                    {selectedBooking ? (
                      <motion.div key={selectedBooking.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sticky top-[88px] space-y-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-body text-[10px] text-primary tracking-widest mb-1">{selectedBooking.booking_ref}</p>
                            <h3 className="font-display text-3xl text-zinc-100">{selectedBooking.full_name}</h3>
                          </div>
                          <span className={`font-body text-[9px] tracking-widest uppercase px-3 py-1 rounded-full border ${statusColor[selectedBooking.status]}`}>{statusLabel[selectedBooking.status]}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: "Email", value: selectedBooking.email, icon: Mail },
                            { label: "Phone", value: selectedBooking.phone, icon: Phone },
                            { label: "Event", value: selectedBooking.event_type, icon: BookOpen },
                            { label: "Date", value: selectedBooking.event_date, icon: Calendar },
                            { label: "Time", value: `${selectedBooking.start_time} – ${selectedBooking.end_time}`, icon: Clock },
                            { label: "Location", value: selectedBooking.location, icon: FolderOpen },
                          ].map((item) => (
                            <div key={item.label} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                              <div className="flex items-center gap-1.5 mb-1">
                                <item.icon size={9} className="text-zinc-500" />
                                <p className="font-body text-[9px] tracking-widest uppercase text-zinc-500">{item.label}</p>
                              </div>
                              <p className="font-body text-sm text-zinc-200">{item.value}</p>
                            </div>
                          ))}
                        </div>
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                          <p className="font-body text-[10px] tracking-widest uppercase text-primary mb-2">Financials</p>
                          {[{ l: "Estimated Total", v: `£${selectedBooking.estimated_total?.toFixed(2)}` }, { l: "Deposit (30%)", v: `£${selectedBooking.deposit_amount?.toFixed(2)}`, hi: true }, { l: "Remaining Balance", v: `£${selectedBooking.remaining_balance?.toFixed(2)}` }].map((r) => (
                            <div key={r.l} className="flex justify-between font-body text-sm">
                              <span className="text-zinc-400">{r.l}</span>
                              <span className={r.hi ? "text-primary" : "text-zinc-100"}>{r.v}</span>
                            </div>
                          ))}
                        </div>
                        {selectedBooking.special_notes && (
                          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                            <p className="font-body text-[9px] tracking-widest uppercase text-zinc-500 mb-1">Notes</p>
                            <p className="font-body text-xs text-zinc-300 leading-relaxed">{selectedBooking.special_notes}</p>
                          </div>
                        )}
                        <div>
                          <p className="font-body text-[9px] tracking-widest uppercase text-zinc-500 mb-2">Update Status</p>
                          <div className="flex flex-wrap gap-2">
                            {statusOptions.map((s) => (
                              <button key={s} onClick={() => updateBookingStatus(selectedBooking.id, s)} disabled={updating === selectedBooking.id || selectedBooking.status === s}
                                className={`font-body text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-sm transition-all border ${selectedBooking.status === s ? "bg-primary/20 text-primary border-primary/50" : "border-zinc-700 text-zinc-400 hover:border-primary/50 hover:text-primary"}`}>
                                {updating === selectedBooking.id ? <Loader2 size={9} className="animate-spin" /> : statusLabel[s]}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <a href={`mailto:${selectedBooking.email}`} className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all py-2.5 rounded-sm font-body text-xs tracking-wider"><Mail size={12} /> Email</a>
                          <a href={`tel:${selectedBooking.phone}`} className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all py-2.5 rounded-sm font-body text-xs tracking-wider"><Phone size={12} /> Call</a>
                        </div>
                        {/* PDF Actions */}
                        <div className="border-t border-zinc-800 pt-4">
                          <p className="font-body text-[9px] tracking-widest uppercase text-zinc-500 mb-2.5">Documents</p>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => generateBookingPDF(selectedBooking)}
                              className="flex items-center gap-2 border border-zinc-700 text-zinc-300 hover:border-primary hover:text-primary transition-all px-4 py-2 font-body text-xs tracking-wider rounded-sm"
                            >
                              <FileText size={12} />
                              Booking PDF
                            </button>
                            {["deposit_paid", "fully_paid", "completed"].includes(selectedBooking.status) && (
                              <button
                                onClick={() => generateAgreementPDF(selectedBooking)}
                                className="flex items-center gap-2 bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20 transition-all px-4 py-2 font-body text-xs tracking-wider rounded-sm"
                              >
                                <FileSignature size={12} />
                                Service Agreement PDF
                              </button>
                            )}
                          </div>
                          {!["deposit_paid", "fully_paid", "completed"].includes(selectedBooking.status) && (
                            <p className="font-body text-[9px] text-zinc-600 mt-2">Agreement PDF available once deposit is paid</p>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-xl p-20 text-center">
                        <BookOpen className="text-zinc-600 mx-auto mb-3" size={28} />
                        <p className="font-body text-xs text-zinc-500">Select a booking to view details</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── QUOTES ── */}
              {tab === "quotes" && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-2 space-y-3 max-h-[calc(100vh-160px)] overflow-y-auto pr-1">
                    {quotes.map((q) => (
                      <div key={q.id} onClick={() => setSelectedQuote(q)}
                        className={`bg-zinc-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/50 ${selectedQuote?.id === q.id ? "border-primary" : "border-zinc-800"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-body text-[10px] text-zinc-500">{new Date(q.created_at).toLocaleDateString("en-GB")}</span>
                          <span className={`font-body text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full border ${q.status === "new" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : q.status === "booked" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : q.status === "declined" ? "bg-red-500/15 text-red-400 border-red-500/30" : "bg-blue-500/15 text-blue-400 border-blue-500/30"}`}>{quoteStatusLabel[q.status]}</span>
                        </div>
                        <p className="font-display text-lg text-zinc-100">{q.full_name}</p>
                        <p className="font-body text-xs text-zinc-500">{q.service_interest} · {q.event_type}</p>
                        {q.budget_range && <p className="font-body text-xs text-primary mt-1">{q.budget_range}</p>}
                      </div>
                    ))}
                    {quotes.length === 0 && <p className="font-body text-xs text-zinc-500 text-center py-12">No quote requests yet.</p>}
                  </div>
                  <div className="lg:col-span-3">
                    {selectedQuote ? (
                      <motion.div key={selectedQuote.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sticky top-[88px] space-y-5">
                        <div className="flex items-start justify-between">
                          <h3 className="font-display text-3xl text-zinc-100">{selectedQuote.full_name}</h3>
                          <span className={`font-body text-[9px] tracking-widest uppercase px-3 py-1 rounded-full border ${selectedQuote.status === "new" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : selectedQuote.status === "booked" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : selectedQuote.status === "declined" ? "bg-red-500/15 text-red-400 border-red-500/30" : "bg-blue-500/15 text-blue-400 border-blue-500/30"}`}>{quoteStatusLabel[selectedQuote.status]}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: "Email", value: selectedQuote.email },
                            { label: "Phone", value: selectedQuote.phone },
                            { label: "Service", value: selectedQuote.service_interest },
                            { label: "Event Type", value: selectedQuote.event_type },
                            ...(selectedQuote.event_date ? [{ label: "Event Date", value: selectedQuote.event_date }] : []),
                            ...(selectedQuote.guests_estimate ? [{ label: "Guests", value: String(selectedQuote.guests_estimate) }] : []),
                            ...(selectedQuote.location ? [{ label: "Location", value: selectedQuote.location }] : []),
                            ...(selectedQuote.budget_range ? [{ label: "Budget", value: selectedQuote.budget_range }] : []),
                          ].map((item) => (
                            <div key={item.label} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                              <p className="font-body text-[9px] tracking-widest uppercase text-zinc-500 mb-1">{item.label}</p>
                              <p className="font-body text-sm text-zinc-200">{item.value}</p>
                            </div>
                          ))}
                        </div>
                        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                          <p className="font-body text-[9px] tracking-widest uppercase text-zinc-500 mb-2">Client Message</p>
                          <p className="font-body text-xs text-zinc-300 leading-relaxed">{selectedQuote.message}</p>
                        </div>
                        <div>
                          <p className="font-body text-[9px] tracking-widest uppercase text-zinc-500 mb-2">Admin Notes</p>
                          <textarea defaultValue={selectedQuote.admin_notes || ""} onBlur={(e) => updateQuoteNotes(selectedQuote.id, e.target.value)} rows={3} placeholder="Add internal notes..." className={inp + " resize-none"} />
                        </div>
                        <div>
                          <p className="font-body text-[9px] tracking-widest uppercase text-zinc-500 mb-2">Update Status</p>
                          <div className="flex flex-wrap gap-2">
                            {quoteStatusOptions.map((s) => (
                              <button key={s} onClick={() => updateQuoteStatus(selectedQuote.id, s)}
                                className={`font-body text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-sm transition-all border ${selectedQuote.status === s ? "bg-primary/20 text-primary border-primary/50" : "border-zinc-700 text-zinc-400 hover:border-primary/50 hover:text-primary"}`}>
                                {quoteStatusLabel[s]}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <a href={`mailto:${selectedQuote.email}?subject=Re: Your Quote Request — JT Studios & Events`} className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary-light transition-all py-3 rounded-sm font-body text-xs tracking-wider"><Mail size={12} /> Reply by Email</a>
                          <a href={`tel:${selectedQuote.phone}`} className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all py-3 rounded-sm font-body text-xs tracking-wider"><Phone size={12} /> Call</a>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-xl p-20 text-center">
                        <MessageSquare className="text-zinc-600 mx-auto mb-3" size={28} />
                        <p className="font-body text-xs text-zinc-500">Select a quote request to view details</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── PROJECTS ── */}
              {tab === "projects" && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <ProjectsTab bookings={bookings} inputCls={inp} />
                </div>
              )}

              {/* ── USERS ── */}
              {tab === "users" && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <UsersTab inputCls={inp} />
                </div>
              )}

              {/* ── SERVICES ── */}
              {tab === "services" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-body text-xs text-zinc-500 tracking-widest">{services.length} services configured</p>
                    <button onClick={() => setShowAddService(!showAddService)} className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-wider uppercase px-5 py-2.5 hover:bg-primary-light transition-all rounded-sm">
                      <Plus size={12} /> Add Service
                    </button>
                  </div>
                  <AnimatePresence>
                    {showAddService && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="bg-zinc-900 border border-primary/30 rounded-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="font-body text-xs tracking-[0.3em] uppercase text-primary">New Service</p>
                          <button onClick={() => setShowAddService(false)}><X size={14} className="text-zinc-500" /></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Service Name *</label><input className={inp} placeholder="e.g. Wedding Photography" value={newService.name} onChange={e => setNewService(p => ({ ...p, name: e.target.value }))} /></div>
                          <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Hourly Rate (£) *</label><input className={inp} type="number" value={newService.hourly_rate} onChange={e => setNewService(p => ({ ...p, hourly_rate: parseFloat(e.target.value) }))} /></div>
                          <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Icon (emoji)</label><input className={inp} placeholder="📸" value={newService.icon} onChange={e => setNewService(p => ({ ...p, icon: e.target.value }))} /></div>
                          <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Slug</label><input className={inp} placeholder="wedding-photography" value={newService.slug} onChange={e => setNewService(p => ({ ...p, slug: e.target.value }))} /></div>
                          <div className="md:col-span-2"><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Description</label><textarea className={inp + " resize-none"} rows={2} value={newService.description} onChange={e => setNewService(p => ({ ...p, description: e.target.value }))} /></div>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={addService} disabled={savingService || !newService.name} className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-widest uppercase px-6 py-2 hover:bg-primary-light transition-all disabled:opacity-50 rounded-sm">{savingService ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save</button>
                          <button onClick={() => setShowAddService(false)} className="border border-zinc-700 text-zinc-400 hover:text-zinc-100 font-body text-xs tracking-widest uppercase px-4 py-2 transition-all rounded-sm">Cancel</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="space-y-3">
                    {services.map((service) => (
                      <div key={service.id} className="bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all">
                        {editingServiceId === service.id ? (
                          <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Name</label><input className={inp} value={editServiceData.name || ""} onChange={e => setEditServiceData(p => ({ ...p, name: e.target.value }))} /></div>
                              <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Rate (£/hr)</label><input className={inp} type="number" value={editServiceData.hourly_rate || 0} onChange={e => setEditServiceData(p => ({ ...p, hourly_rate: parseFloat(e.target.value) }))} /></div>
                              <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Icon</label><input className={inp} value={editServiceData.icon || ""} onChange={e => setEditServiceData(p => ({ ...p, icon: e.target.value }))} /></div>
                              <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Slug</label><input className={inp} value={editServiceData.slug || ""} onChange={e => setEditServiceData(p => ({ ...p, slug: e.target.value }))} /></div>
                              <div className="col-span-2"><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Description</label><textarea className={inp + " resize-none"} rows={2} value={editServiceData.description || ""} onChange={e => setEditServiceData(p => ({ ...p, description: e.target.value }))} /></div>
                            </div>
                            <div className="flex gap-3">
                              <button onClick={saveEditService} disabled={savingService} className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-widest uppercase px-5 py-2 rounded-sm disabled:opacity-50">{savingService ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save</button>
                              <button onClick={() => setEditingServiceId(null)} className="border border-zinc-700 text-zinc-400 font-body text-xs tracking-widest uppercase px-4 py-2 rounded-sm">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              {service.icon && <span className="text-3xl">{service.icon}</span>}
                              <div>
                                <p className="font-display text-xl text-zinc-100">{service.name}</p>
                                {service.description && <p className="font-body text-xs text-zinc-500 mt-0.5 max-w-md">{service.description}</p>}
                                <p className="font-body text-[10px] text-zinc-600 mt-0.5">/{service.slug}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-display text-2xl text-primary">£{service.hourly_rate}</p>
                                <p className="font-body text-[10px] text-zinc-500">/hr</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => startEditService(service)} className="text-zinc-500 hover:text-primary transition-colors p-2 rounded-sm hover:bg-zinc-800"><Edit2 size={14} /></button>
                                <button onClick={() => deleteService(service.id)} className="text-zinc-500 hover:text-red-400 transition-colors p-2 rounded-sm hover:bg-zinc-800"><Trash2 size={14} /></button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {services.length === 0 && <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-xl p-12 text-center"><Briefcase className="text-zinc-600 mx-auto mb-3" size={24} /><p className="font-body text-xs text-zinc-500">No services yet.</p></div>}
                  </div>
                </div>
              )}

              {/* ── STAFF ── */}
              {tab === "staff" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-body text-xs text-zinc-500 tracking-widest">{staff.filter(s => s.active).length} active · {staff.filter(s => !s.active).length} inactive</p>
                    <button onClick={() => setShowAddStaff(!showAddStaff)} className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-wider uppercase px-5 py-2.5 hover:bg-primary-light transition-all rounded-sm">
                      <UserPlus size={12} /> Add Member
                    </button>
                  </div>
                  <AnimatePresence>
                    {showAddStaff && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="bg-zinc-900 border border-primary/30 rounded-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="font-body text-xs tracking-[0.3em] uppercase text-primary">New Team Member</p>
                          <button onClick={() => setShowAddStaff(false)}><X size={14} className="text-zinc-500" /></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Full Name *</label><input className={inp} placeholder="James Thompson" value={newStaff.full_name} onChange={e => setNewStaff(p => ({ ...p, full_name: e.target.value }))} /></div>
                          <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Role / Title *</label><input className={inp} placeholder="Lead Photographer" value={newStaff.role} onChange={e => setNewStaff(p => ({ ...p, role: e.target.value }))} /></div>
                          <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Email</label><input className={inp} type="email" value={newStaff.email} onChange={e => setNewStaff(p => ({ ...p, email: e.target.value }))} /></div>
                          <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Phone</label><input className={inp} value={newStaff.phone} onChange={e => setNewStaff(p => ({ ...p, phone: e.target.value }))} /></div>
                          <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Avatar URL</label><input className={inp} value={newStaff.avatar_url} onChange={e => setNewStaff(p => ({ ...p, avatar_url: e.target.value }))} /></div>
                          <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Bio</label><input className={inp} value={newStaff.bio} onChange={e => setNewStaff(p => ({ ...p, bio: e.target.value }))} /></div>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={addStaff} disabled={savingStaff || !newStaff.full_name || !newStaff.role} className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-widest uppercase px-6 py-2 hover:bg-primary-light transition-all disabled:opacity-50 rounded-sm">{savingStaff ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Add</button>
                          <button onClick={() => setShowAddStaff(false)} className="border border-zinc-700 text-zinc-400 font-body text-xs tracking-widest uppercase px-4 py-2 rounded-sm">Cancel</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {staff.map((member) => (
                      <div key={member.id} className={`bg-zinc-900 border rounded-xl transition-all ${member.active ? "border-zinc-800 hover:border-zinc-700" : "border-zinc-800/50 opacity-60"}`}>
                        {editingStaffId === member.id ? (
                          <div className="p-5 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Name</label><input className={inp} value={editStaffData.full_name || ""} onChange={e => setEditStaffData(p => ({ ...p, full_name: e.target.value }))} /></div>
                              <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Role</label><input className={inp} value={editStaffData.role || ""} onChange={e => setEditStaffData(p => ({ ...p, role: e.target.value }))} /></div>
                              <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Email</label><input className={inp} value={editStaffData.email || ""} onChange={e => setEditStaffData(p => ({ ...p, email: e.target.value }))} /></div>
                              <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Phone</label><input className={inp} value={editStaffData.phone || ""} onChange={e => setEditStaffData(p => ({ ...p, phone: e.target.value }))} /></div>
                              <div className="col-span-2"><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Bio</label><input className={inp} value={editStaffData.bio || ""} onChange={e => setEditStaffData(p => ({ ...p, bio: e.target.value }))} /></div>
                            </div>
                            <div className="flex gap-3">
                              <button onClick={saveEditStaff} disabled={savingStaff} className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-widest uppercase px-5 py-2 rounded-sm disabled:opacity-50">{savingStaff ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save</button>
                              <button onClick={() => setEditingStaffId(null)} className="border border-zinc-700 text-zinc-400 font-body text-xs tracking-widest uppercase px-4 py-2 rounded-sm">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-5 flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {member.avatar_url ? <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" /> : <span className="font-display text-xl text-primary">{member.full_name.charAt(0)}</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-display text-lg text-zinc-100">{member.full_name}</p>
                                  <p className="font-body text-xs text-primary tracking-widest">{member.role}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => toggleStaffActive(member.id, !member.active)} className={`font-body text-[9px] tracking-widest uppercase px-2 py-1 rounded-sm transition-all border ${member.active ? "border-emerald-500/40 text-emerald-400" : "border-zinc-600 text-zinc-500"}`}>{member.active ? "Active" : "Inactive"}</button>
                                  <button onClick={() => startEditStaff(member)} className="text-zinc-500 hover:text-primary transition-colors p-1.5 rounded-sm hover:bg-zinc-800"><Edit2 size={12} /></button>
                                  <button onClick={() => deleteStaff(member.id)} className="text-zinc-500 hover:text-red-400 transition-colors p-1.5 rounded-sm hover:bg-zinc-800"><Trash2 size={12} /></button>
                                </div>
                              </div>
                              {member.bio && <p className="font-body text-xs text-zinc-500 mt-1.5 leading-relaxed">{member.bio}</p>}
                              <div className="flex gap-3 mt-2">
                                {member.email && <a href={`mailto:${member.email}`} className="font-body text-[10px] text-zinc-500 hover:text-primary flex items-center gap-1"><Mail size={10} />{member.email}</a>}
                                {member.phone && <span className="font-body text-[10px] text-zinc-500 flex items-center gap-1"><Phone size={10} />{member.phone}</span>}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {staff.length === 0 && <div className="col-span-2 bg-zinc-900 border border-dashed border-zinc-800 rounded-xl p-12 text-center"><Users className="text-zinc-600 mx-auto mb-3" size={24} /><p className="font-body text-xs text-zinc-500">No team members yet.</p></div>}
                  </div>
                </div>
              )}

              {/* ── PORTFOLIO ── */}
              {tab === "portfolio" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-body text-xs text-zinc-500 tracking-widest">{portfolio.length} items · {portfolio.filter(p => p.featured).length} featured</p>
                    <button onClick={() => setShowAddPortfolio(!showAddPortfolio)} className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-wider uppercase px-5 py-2.5 hover:bg-primary-light transition-all rounded-sm"><Plus size={12} /> Add Item</button>
                  </div>
                  <AnimatePresence>
                    {showAddPortfolio && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="bg-zinc-900 border border-primary/30 rounded-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="font-body text-xs tracking-[0.3em] uppercase text-primary">New Portfolio Item</p>
                          <button onClick={() => setShowAddPortfolio(false)}><X size={14} className="text-zinc-500" /></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Title *</label><input className={inp} placeholder="e.g. Sarah & James Wedding" value={newPortfolioItem.title} onChange={e => setNewPortfolioItem(p => ({ ...p, title: e.target.value }))} /></div>
                          <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Category</label><select className={inp} value={newPortfolioItem.category} onChange={e => setNewPortfolioItem(p => ({ ...p, category: e.target.value }))}>{portfolioCategories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                          <div className="md:col-span-2"><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Image URL *</label><input className={inp} placeholder="https://images.unsplash.com/..." value={newPortfolioItem.image_url} onChange={e => setNewPortfolioItem(p => ({ ...p, image_url: e.target.value }))} /></div>
                          <div className="md:col-span-2"><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Video URL (optional)</label><input className={inp} placeholder="https://www.youtube.com/embed/..." value={newPortfolioItem.video_url} onChange={e => setNewPortfolioItem(p => ({ ...p, video_url: e.target.value }))} /></div>
                          <div className="md:col-span-2"><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Description</label><textarea className={inp + " resize-none"} rows={2} value={newPortfolioItem.description} onChange={e => setNewPortfolioItem(p => ({ ...p, description: e.target.value }))} /></div>
                          <div className="flex items-center gap-3"><input type="checkbox" id="featured-new" checked={newPortfolioItem.featured} onChange={e => setNewPortfolioItem(p => ({ ...p, featured: e.target.checked }))} className="accent-primary" /><label htmlFor="featured-new" className="font-body text-xs text-zinc-400">Featured on homepage</label></div>
                        </div>
                        {newPortfolioItem.image_url && <img src={newPortfolioItem.image_url} alt="Preview" className="h-32 rounded-lg object-cover border border-zinc-700" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                        <div className="flex gap-3">
                          <button onClick={addPortfolioItem} disabled={savingPortfolio || !newPortfolioItem.title || !newPortfolioItem.image_url} className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-widest uppercase px-6 py-2 hover:bg-primary-light transition-all disabled:opacity-50 rounded-sm">{savingPortfolio ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Add</button>
                          <button onClick={() => setShowAddPortfolio(false)} className="border border-zinc-700 text-zinc-400 font-body text-xs tracking-widest uppercase px-4 py-2 rounded-sm">Cancel</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {portfolio.map((item) => (
                      <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all">
                        {editingPortfolioId === item.id ? (
                          <div className="p-5 space-y-3">
                            <div className="space-y-3">
                              <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Title</label><input className={inp} value={editPortfolioData.title || ""} onChange={e => setEditPortfolioData(p => ({ ...p, title: e.target.value }))} /></div>
                              <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Category</label><select className={inp} value={editPortfolioData.category || "Photography"} onChange={e => setEditPortfolioData(p => ({ ...p, category: e.target.value }))}>{portfolioCategories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                              <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Image URL</label><input className={inp} value={editPortfolioData.image_url || ""} onChange={e => setEditPortfolioData(p => ({ ...p, image_url: e.target.value }))} /></div>
                              <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Video URL</label><input className={inp} value={editPortfolioData.video_url || ""} onChange={e => setEditPortfolioData(p => ({ ...p, video_url: e.target.value }))} /></div>
                              <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Description</label><textarea className={inp + " resize-none"} rows={2} value={editPortfolioData.description || ""} onChange={e => setEditPortfolioData(p => ({ ...p, description: e.target.value }))} /></div>
                              <div className="flex items-center gap-3"><input type="checkbox" id={`feat-${item.id}`} checked={editPortfolioData.featured || false} onChange={e => setEditPortfolioData(p => ({ ...p, featured: e.target.checked }))} className="accent-primary" /><label htmlFor={`feat-${item.id}`} className="font-body text-xs text-zinc-400">Featured</label></div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={saveEditPortfolio} disabled={savingPortfolio} className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-widest uppercase px-5 py-2 rounded-sm disabled:opacity-50">{savingPortfolio ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save</button>
                              <button onClick={() => setEditingPortfolioId(null)} className="border border-zinc-700 text-zinc-400 font-body text-xs tracking-widest uppercase px-4 py-2 rounded-sm">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="relative aspect-video overflow-hidden">
                              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                              {item.featured && <div className="absolute top-2 left-2 bg-primary text-white font-body text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full flex items-center gap-1"><Star size={8} fill="white" /> Featured</div>}
                              {item.video_url && <div className="absolute top-2 right-2 bg-black/60 text-white font-body text-[9px] px-2 py-0.5 rounded-full">▶ Video</div>}
                            </div>
                            <div className="p-4">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="font-display text-lg text-zinc-100">{item.title}</p>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button onClick={() => togglePortfolioFeatured(item.id, !item.featured)} className={`text-[9px] font-body tracking-widest uppercase px-2 py-0.5 rounded-sm border transition-all ${item.featured ? "border-primary/40 text-primary" : "border-zinc-700 text-zinc-500 hover:border-primary/40 hover:text-primary"}`}><Star size={9} className="inline" /></button>
                                  <button onClick={() => startEditPortfolio(item)} className="text-zinc-500 hover:text-primary transition-colors p-1.5 rounded-sm hover:bg-zinc-800"><Edit2 size={12} /></button>
                                  <button onClick={() => deletePortfolioItem(item.id)} className="text-zinc-500 hover:text-red-400 transition-colors p-1.5 rounded-sm hover:bg-zinc-800"><Trash2 size={12} /></button>
                                </div>
                              </div>
                              <span className="font-body text-[9px] text-zinc-500 tracking-widest uppercase bg-zinc-800 px-2 py-0.5 rounded-full">{item.category}</span>
                              {item.description && <p className="font-body text-xs text-zinc-500 mt-2 line-clamp-2">{item.description}</p>}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    {portfolio.length === 0 && <div className="col-span-3 bg-zinc-900 border border-dashed border-zinc-800 rounded-xl p-12 text-center"><Image className="text-zinc-600 mx-auto mb-3" size={24} /><p className="font-body text-xs text-zinc-500">No portfolio items yet.</p></div>}
                  </div>
                </div>
              )}

              {/* ── BLOCKED DATES ── */}
              {tab === "dates" && (
                <div className="space-y-4">
                  <div className="bg-zinc-900 border border-primary/30 rounded-xl p-6 space-y-4">
                    <p className="font-body text-xs tracking-[0.3em] uppercase text-primary">Block a Date</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Date *</label><input type="date" className={inp} value={newDate} onChange={e => setNewDate(e.target.value)} /></div>
                      <div className="md:col-span-2"><label className="font-body text-[10px] tracking-widest uppercase text-zinc-500 mb-1 block">Reason (optional)</label><input className={inp} placeholder="e.g. Fully booked, Holiday" value={newDateReason} onChange={e => setNewDateReason(e.target.value)} /></div>
                    </div>
                    <button onClick={addBlockedDate} disabled={!newDate} className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-widest uppercase px-6 py-2 hover:bg-primary-light transition-all disabled:opacity-50 rounded-sm"><Plus size={12} /> Block Date</button>
                  </div>
                  <div className="space-y-3">
                    {blockedDates.map((d) => (
                      <div key={d.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between hover:border-zinc-700 transition-all">
                        <div>
                          <p className="font-body text-sm text-zinc-100">{new Date(d.blocked_date + 'T12:00:00').toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                          {d.reason && <p className="font-body text-xs text-zinc-500 mt-0.5">{d.reason}</p>}
                        </div>
                        <button onClick={() => removeBlockedDate(d.id)} className="text-zinc-500 hover:text-red-400 transition-colors p-2 rounded-sm hover:bg-zinc-800"><Trash2 size={14} /></button>
                      </div>
                    ))}
                    {blockedDates.length === 0 && <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-xl p-12 text-center"><Calendar className="text-zinc-600 mx-auto mb-3" size={24} /><p className="font-body text-xs text-zinc-500">No blocked dates. Clients can book any available date.</p></div>}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
