import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import {
  Calendar, PoundSterling, BookOpen, Settings, Plus, Trash2, Loader2,
  MessageSquare, Mail, Phone, Eye, RefreshCw, CheckCircle, XCircle, Clock,
  TrendingUp, Users, ChevronRight, Edit2, Save, X, UserPlus, Briefcase, Image, Star,
} from "lucide-react";

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

const statusOptions = ["pending_deposit", "deposit_paid", "fully_paid", "cancelled", "completed"];
const statusLabel: Record<string, string> = {
  pending_deposit: "Deposit Pending",
  deposit_paid: "Deposit Paid",
  fully_paid: "Fully Paid",
  cancelled: "Cancelled",
  completed: "Completed",
};
const statusClass: Record<string, string> = {
  pending_deposit: "status-pending",
  deposit_paid: "status-deposit",
  fully_paid: "status-paid",
  cancelled: "status-cancelled",
  completed: "status-completed",
};
const quoteStatusOptions = ["new", "contacted", "quoted", "booked", "declined"];
const quoteStatusLabel: Record<string, string> = {
  new: "New", contacted: "Contacted", quoted: "Quoted", booked: "Booked", declined: "Declined",
};

type TabType = "overview" | "bookings" | "quotes" | "services" | "staff" | "portfolio" | "dates";

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

const emptyService = { name: "", slug: "", hourly_rate: 150, description: "", icon: "" };
const emptyStaff = { full_name: "", role: "", email: "", phone: "", bio: "", avatar_url: "" };
const emptyPortfolio = { title: "", category: "Photography", description: "", image_url: "", video_url: "", featured: false };
const portfolioCategories = ["Photography", "Videography", "Event Hosting", "Event Planning", "Wedding", "Corporate", "Other"];

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabType>("overview");
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

  // Service editing state
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editServiceData, setEditServiceData] = useState<Partial<Service>>({});
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({ ...emptyService });
  const [savingService, setSavingService] = useState(false);

  // Staff state
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editStaffData, setEditStaffData] = useState<Partial<StaffMember>>({});
  const [newStaff, setNewStaff] = useState({ ...emptyStaff });
  const [savingStaff, setSavingStaff] = useState(false);

  // Portfolio state
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

  // SERVICE CRUD
  const startEditService = (service: Service) => {
    setEditingServiceId(service.id);
    setEditServiceData({ ...service });
  };

  const saveEditService = async () => {
    if (!editingServiceId) return;
    setSavingService(true);
    await supabase.from("services").update({
      name: editServiceData.name,
      slug: editServiceData.slug || editServiceData.name?.toLowerCase().replace(/\s+/g, '-'),
      hourly_rate: editServiceData.hourly_rate,
      description: editServiceData.description,
      icon: editServiceData.icon,
    }).eq("id", editingServiceId);
    setServices((prev) => prev.map((s) => s.id === editingServiceId ? { ...s, ...editServiceData } as Service : s));
    setEditingServiceId(null);
    setSavingService(false);
  };

  const addService = async () => {
    if (!newService.name) return;
    setSavingService(true);
    const slug = newService.slug || newService.name.toLowerCase().replace(/\s+/g, '-');
    const { data } = await supabase.from("services").insert({
      name: newService.name,
      slug,
      hourly_rate: newService.hourly_rate,
      description: newService.description || null,
      icon: newService.icon || null,
    }).select().single();
    if (data) setServices((prev) => [...prev, data]);
    setNewService({ ...emptyService });
    setShowAddService(false);
    setSavingService(false);
  };

  const deleteService = async (id: string) => {
    if (!confirm("Delete this service? This cannot be undone.")) return;
    await supabase.from("services").delete().eq("id", id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  // STAFF CRUD
  const startEditStaff = (member: StaffMember) => {
    setEditingStaffId(member.id);
    setEditStaffData({ ...member });
  };

  const saveEditStaff = async () => {
    if (!editingStaffId) return;
    setSavingStaff(true);
    await supabase.from("staff").update({
      full_name: editStaffData.full_name,
      role: editStaffData.role,
      email: editStaffData.email,
      phone: editStaffData.phone,
      bio: editStaffData.bio,
      avatar_url: editStaffData.avatar_url,
      active: editStaffData.active,
    }).eq("id", editingStaffId);
    setStaff((prev) => prev.map((s) => s.id === editingStaffId ? { ...s, ...editStaffData } as StaffMember : s));
    setEditingStaffId(null);
    setSavingStaff(false);
  };

  const addStaff = async () => {
    if (!newStaff.full_name || !newStaff.role) return;
    setSavingStaff(true);
    const { data } = await supabase.from("staff").insert({
      full_name: newStaff.full_name,
      role: newStaff.role,
      email: newStaff.email || null,
      phone: newStaff.phone || null,
      bio: newStaff.bio || null,
      avatar_url: newStaff.avatar_url || null,
      active: true,
    }).select().single();
    if (data) setStaff((prev) => [...prev, data]);
    setNewStaff({ ...emptyStaff });
    setShowAddStaff(false);
    setSavingStaff(false);
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

  // PORTFOLIO CRUD
  const addPortfolioItem = async () => {
    if (!newPortfolioItem.title || !newPortfolioItem.image_url) return;
    setSavingPortfolio(true);
    const { data } = await supabase.from("portfolio").insert({
      title: newPortfolioItem.title,
      category: newPortfolioItem.category,
      description: newPortfolioItem.description || null,
      image_url: newPortfolioItem.image_url,
      video_url: newPortfolioItem.video_url || null,
      featured: newPortfolioItem.featured,
      sort_order: portfolio.length,
    }).select().single();
    if (data) setPortfolio((prev) => [...prev, data]);
    setNewPortfolioItem({ ...emptyPortfolio });
    setShowAddPortfolio(false);
    setSavingPortfolio(false);
  };

  const startEditPortfolio = (item: PortfolioItem) => {
    setEditingPortfolioId(item.id);
    setEditPortfolioData({ ...item });
  };

  const saveEditPortfolio = async () => {
    if (!editingPortfolioId) return;
    setSavingPortfolio(true);
    await supabase.from("portfolio").update({
      title: editPortfolioData.title,
      category: editPortfolioData.category,
      description: editPortfolioData.description,
      image_url: editPortfolioData.image_url,
      video_url: editPortfolioData.video_url || null,
      featured: editPortfolioData.featured,
    }).eq("id", editingPortfolioId);
    setPortfolio((prev) => prev.map((p) => p.id === editingPortfolioId ? { ...p, ...editPortfolioData } as PortfolioItem : p));
    setEditingPortfolioId(null);
    setSavingPortfolio(false);
  };

  const togglePortfolioFeatured = async (id: string, featured: boolean) => {
    await supabase.from("portfolio").update({ featured }).eq("id", id);
    setPortfolio((prev) => prev.map((p) => p.id === id ? { ...p, featured } : p));
  };

  const deletePortfolioItem = async (id: string) => {
    if (!confirm("Delete this portfolio item? This cannot be undone.")) return;
    await supabase.from("portfolio").delete().eq("id", id);
    setPortfolio((prev) => prev.filter((p) => p.id !== id));
  };

  // Analytics
  const totalRevenue = bookings.filter((b) => b.status === "fully_paid" || b.status === "completed").reduce((s, b) => s + (b.estimated_total || 0), 0);
  const depositsReceived = bookings.filter((b) => ["deposit_paid", "fully_paid", "completed"].includes(b.status)).reduce((s, b) => s + (b.deposit_amount || 0), 0);
  const pendingBalance = bookings.filter((b) => b.status === "deposit_paid").reduce((s, b) => s + (b.remaining_balance || 0), 0);
  const newQuotes = quotes.filter((q) => q.status === "new").length;

  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const month = date.toLocaleString("en-GB", { month: "short" });
    const revenue = bookings.filter((b) => {
      const d = new Date(b.event_date);
      return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear()
        && (b.status === "fully_paid" || b.status === "completed");
    }).reduce((s, b) => s + (b.estimated_total || 0), 0);
    const count = bookings.filter((b) => {
      const d = new Date(b.event_date);
      return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    }).length;
    return { month, revenue, bookings: count };
  });

  const serviceDistribution = services.map((s) => ({
    name: s.name,
    value: bookings.filter((b) => b.services?.name === s.name).length,
  })).filter((s) => s.value > 0);

  const COLORS = ["hsl(15, 83%, 50%)", "hsl(15, 83%, 35%)", "hsl(15, 83%, 65%)", "hsl(20, 60%, 40%)"];

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  const tabs: { key: TabType; label: string; icon: any; badge?: number }[] = [
    { key: "overview", label: "Overview", icon: TrendingUp },
    { key: "bookings", label: "Bookings", icon: BookOpen, badge: bookings.filter(b => b.status === "pending_deposit").length || undefined },
    { key: "quotes", label: "Quotes", icon: MessageSquare, badge: newQuotes || undefined },
    { key: "services", label: "Services", icon: Briefcase },
    { key: "staff", label: "Team", icon: Users },
    { key: "portfolio", label: "Portfolio", icon: Image },
    { key: "dates", label: "Calendar", icon: Calendar },
  ];

  const inputCls = "w-full bg-input border border-border text-foreground font-body text-sm px-3 py-2 focus:outline-none focus:border-primary placeholder:text-muted-foreground/50";

  return (
    <div className="bg-background min-h-screen">
      <Navbar />

      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-[0.03]" style={{ background: "radial-gradient(circle, hsl(43,74%,60%), transparent)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-[0.03]" style={{ background: "radial-gradient(circle, hsl(43,74%,60%), transparent)" }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-28 pb-24 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <p className="font-body text-primary text-xs tracking-[0.4em] uppercase mb-2">Admin Portal</p>
            <h1 className="font-display text-5xl md:text-6xl text-foreground">Dashboard</h1>
            <p className="font-body text-muted-foreground text-xs mt-2 tracking-widest">
              {bookings.length} bookings · {quotes.length} quote requests · {staff.filter(s => s.active).length} active staff
            </p>
          </div>
          <button
            onClick={fetchAll}
            disabled={refreshing}
            className="flex items-center gap-2 border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all px-4 py-2 font-body text-xs tracking-widest uppercase"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-border overflow-x-auto scrollbar-none">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase px-5 py-3 border-b-2 whitespace-nowrap transition-all duration-300 ${
                tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon size={12} />
              {t.label}
              {t.badge ? (
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Bookings", value: bookings.length, icon: BookOpen, color: "text-foreground", sub: `${bookings.filter(b => b.status === "pending_deposit").length} deposit pending` },
                { label: "Total Revenue", value: `£${totalRevenue.toFixed(0)}`, icon: PoundSterling, color: "text-primary", sub: "From completed events" },
                { label: "Deposits In", value: `£${depositsReceived.toFixed(0)}`, icon: TrendingUp, color: "text-blue-400", sub: `£${pendingBalance.toFixed(0)} balance due` },
                { label: "New Quotes", value: newQuotes, icon: MessageSquare, color: "text-yellow-400", sub: `${quotes.length} total requests` },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="border border-border bg-card p-6 hover:border-primary/30 transition-all group"
                >
                  <stat.icon className={`${stat.color} mb-3 group-hover:scale-110 transition-transform`} size={20} />
                  <p className={`font-display text-3xl ${stat.color} mb-1`}>{stat.value}</p>
                  <p className="font-body text-xs text-muted-foreground tracking-widest mb-1">{stat.label}</p>
                  <p className="font-body text-[10px] text-muted-foreground/60">{stat.sub}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 border border-border bg-card p-6">
                <p className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Revenue (6 Months)</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthlyRevenue}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontFamily: "Montserrat" }} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} name="Revenue (£)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="border border-border bg-card p-6">
                <p className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">By Service</p>
                {serviceDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={serviceDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                        {serviceDistribution.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="font-body text-xs text-muted-foreground text-center py-16">No booking data yet</p>
                )}
                <div className="space-y-1 mt-2">
                  {serviceDistribution.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="font-body text-[10px] text-muted-foreground">{s.name} ({s.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border bg-card p-6">
                <p className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Recent Bookings</p>
                <div className="space-y-3">
                  {bookings.slice(0, 5).map((b) => (
                    <div key={b.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="font-body text-sm text-foreground">{b.full_name}</p>
                        <p className="font-body text-xs text-muted-foreground">{b.event_type} · {b.event_date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-body text-sm text-primary">£{b.estimated_total?.toFixed(0)}</p>
                        <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 ${statusClass[b.status] || ""}`}>
                          {statusLabel[b.status]}
                        </span>
                      </div>
                    </div>
                  ))}
                  {bookings.length === 0 && <p className="font-body text-xs text-muted-foreground text-center py-4">No bookings yet</p>}
                </div>
              </div>
              <div className="border border-border bg-card p-6">
                <p className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Recent Quotes</p>
                <div className="space-y-3">
                  {quotes.slice(0, 5).map((q) => (
                    <div key={q.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="font-body text-sm text-foreground">{q.full_name}</p>
                        <p className="font-body text-xs text-muted-foreground">{q.service_interest}</p>
                      </div>
                      <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 ${
                        q.status === "new" ? "status-pending" : q.status === "booked" ? "status-paid" : q.status === "declined" ? "status-cancelled" : "status-deposit"
                      }`}>
                        {quoteStatusLabel[q.status]}
                      </span>
                    </div>
                  ))}
                  {quotes.length === 0 && <p className="font-body text-xs text-muted-foreground text-center py-4">No quotes yet</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── BOOKINGS ── */}
        {tab === "bookings" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-3 max-h-[80vh] overflow-y-auto pr-1">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                  className={`border bg-card p-4 cursor-pointer transition-all hover:border-primary/50 ${
                    selectedBooking?.id === booking.id ? "border-primary" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-body text-xs text-primary">{booking.booking_ref}</span>
                    <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 ${statusClass[booking.status] || ""}`}>
                      {statusLabel[booking.status]}
                    </span>
                  </div>
                  <p className="font-display text-lg text-foreground">{booking.full_name}</p>
                  <p className="font-body text-xs text-muted-foreground">{booking.event_type} · {booking.event_date}</p>
                  <p className="font-body text-sm text-primary mt-1">£{booking.estimated_total?.toFixed(2)}</p>
                </div>
              ))}
              {bookings.length === 0 && <p className="font-body text-xs text-muted-foreground text-center py-8">No bookings yet.</p>}
            </div>

            <div className="lg:col-span-3">
              {selectedBooking ? (
                <motion.div
                  key={selectedBooking.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border border-border bg-card p-6 sticky top-24 space-y-6"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-body text-xs text-primary tracking-widest mb-1">{selectedBooking.booking_ref}</p>
                      <h3 className="font-display text-3xl text-foreground">{selectedBooking.full_name}</h3>
                    </div>
                    <span className={`font-body text-[10px] tracking-widest uppercase px-3 py-1 ${statusClass[selectedBooking.status]}`}>
                      {statusLabel[selectedBooking.status]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {[
                      { label: "Email", value: selectedBooking.email, icon: Mail },
                      { label: "Phone", value: selectedBooking.phone, icon: Phone },
                      { label: "Event Type", value: selectedBooking.event_type, icon: BookOpen },
                      { label: "Date", value: selectedBooking.event_date, icon: Calendar },
                      { label: "Time", value: `${selectedBooking.start_time} – ${selectedBooking.end_time}`, icon: Clock },
                      { label: "Location", value: selectedBooking.location, icon: Settings },
                    ].map((item) => (
                      <div key={item.label} className="border border-border p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <item.icon size={10} className="text-muted-foreground" />
                          <p className="font-body text-[10px] tracking-widest uppercase text-muted-foreground">{item.label}</p>
                        </div>
                        <p className="font-body text-foreground text-sm">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border border-primary/20 bg-primary/5 p-4 space-y-2">
                    <p className="font-body text-xs tracking-widest uppercase text-primary mb-2">Financials</p>
                    {[
                      { label: "Estimated Total", value: `£${selectedBooking.estimated_total?.toFixed(2)}`, highlight: false },
                      { label: "Deposit (30%)", value: `£${selectedBooking.deposit_amount?.toFixed(2)}`, highlight: true },
                      { label: "Remaining Balance", value: `£${selectedBooking.remaining_balance?.toFixed(2)}`, highlight: false },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between font-body text-sm">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className={row.highlight ? "text-primary font-medium" : "text-foreground"}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {selectedBooking.special_notes && (
                    <div className="border border-border p-4">
                      <p className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Special Notes</p>
                      <p className="font-body text-xs text-foreground leading-relaxed">{selectedBooking.special_notes}</p>
                    </div>
                  )}

                  <div>
                    <p className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Update Status</p>
                    <div className="flex flex-wrap gap-2">
                      {statusOptions.map((s) => (
                        <button
                          key={s}
                          onClick={() => updateBookingStatus(selectedBooking.id, s)}
                          disabled={updating === selectedBooking.id || selectedBooking.status === s}
                          className={`font-body text-[10px] tracking-widest uppercase px-3 py-2 transition-all border ${
                            selectedBooking.status === s
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                          }`}
                        >
                          {updating === selectedBooking.id ? <Loader2 size={10} className="animate-spin" /> : statusLabel[s]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <a href={`mailto:${selectedBooking.email}`} className="flex-1 flex items-center justify-center gap-2 border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all py-2 font-body text-xs tracking-widest">
                      <Mail size={12} /> Email Client
                    </a>
                    <a href={`tel:${selectedBooking.phone}`} className="flex-1 flex items-center justify-center gap-2 border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all py-2 font-body text-xs tracking-widest">
                      <Phone size={12} /> Call Client
                    </a>
                  </div>
                </motion.div>
              ) : (
                <div className="border border-border bg-card p-16 text-center">
                  <ChevronRight className="text-muted-foreground mx-auto mb-3" size={24} />
                  <p className="font-body text-xs text-muted-foreground">Select a booking to view details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── QUOTE REQUESTS ── */}
        {tab === "quotes" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-3 max-h-[80vh] overflow-y-auto pr-1">
              {quotes.map((quote) => (
                <div
                  key={quote.id}
                  onClick={() => setSelectedQuote(quote)}
                  className={`border bg-card p-4 cursor-pointer transition-all hover:border-primary/50 ${
                    selectedQuote?.id === quote.id ? "border-primary" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-body text-[10px] tracking-widest uppercase text-muted-foreground">
                      {new Date(quote.created_at).toLocaleDateString("en-GB")}
                    </span>
                    <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 ${
                      quote.status === "new" ? "status-pending" : quote.status === "booked" ? "status-paid" : quote.status === "declined" ? "status-cancelled" : "status-deposit"
                    }`}>
                      {quoteStatusLabel[quote.status]}
                    </span>
                  </div>
                  <p className="font-display text-lg text-foreground">{quote.full_name}</p>
                  <p className="font-body text-xs text-muted-foreground">{quote.service_interest} · {quote.event_type}</p>
                  {quote.budget_range && <p className="font-body text-xs text-primary mt-1">{quote.budget_range}</p>}
                </div>
              ))}
              {quotes.length === 0 && <p className="font-body text-xs text-muted-foreground text-center py-8">No quote requests yet.</p>}
            </div>

            <div className="lg:col-span-3">
              {selectedQuote ? (
                <motion.div
                  key={selectedQuote.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border border-border bg-card p-6 sticky top-24 space-y-5"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-display text-3xl text-foreground">{selectedQuote.full_name}</h3>
                    <span className={`font-body text-[10px] tracking-widest uppercase px-3 py-1 ${
                      selectedQuote.status === "new" ? "status-pending" : selectedQuote.status === "booked" ? "status-paid" : selectedQuote.status === "declined" ? "status-cancelled" : "status-deposit"
                    }`}>
                      {quoteStatusLabel[selectedQuote.status]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {[
                      { label: "Email", value: selectedQuote.email },
                      { label: "Phone", value: selectedQuote.phone },
                      { label: "Service Interest", value: selectedQuote.service_interest },
                      { label: "Event Type", value: selectedQuote.event_type },
                      ...(selectedQuote.event_date ? [{ label: "Event Date", value: selectedQuote.event_date }] : []),
                      ...(selectedQuote.guests_estimate ? [{ label: "Guests", value: String(selectedQuote.guests_estimate) }] : []),
                      ...(selectedQuote.location ? [{ label: "Location", value: selectedQuote.location }] : []),
                      ...(selectedQuote.budget_range ? [{ label: "Budget", value: selectedQuote.budget_range }] : []),
                    ].map((item) => (
                      <div key={item.label} className="border border-border p-3">
                        <p className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1">{item.label}</p>
                        <p className="font-body text-foreground text-sm">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border border-border p-4">
                    <p className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Client Message</p>
                    <p className="font-body text-xs text-foreground leading-relaxed">{selectedQuote.message}</p>
                  </div>

                  <div>
                    <p className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Admin Notes</p>
                    <textarea
                      defaultValue={selectedQuote.admin_notes || ""}
                      onBlur={(e) => updateQuoteNotes(selectedQuote.id, e.target.value)}
                      rows={3}
                      placeholder="Add internal notes..."
                      className="w-full bg-input border border-border text-foreground px-3 py-2 font-body text-xs focus:outline-none focus:border-primary resize-none"
                    />
                  </div>

                  <div>
                    <p className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Update Status</p>
                    <div className="flex flex-wrap gap-2">
                      {quoteStatusOptions.map((s) => (
                        <button
                          key={s}
                          onClick={() => updateQuoteStatus(selectedQuote.id, s)}
                          className={`font-body text-[10px] tracking-widest uppercase px-3 py-2 transition-all border ${
                            selectedQuote.status === s
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                          }`}
                        >
                          {quoteStatusLabel[s]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <a href={`mailto:${selectedQuote.email}?subject=Re: Your Quote Request — JT Studios & Events`}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary-light transition-all py-3 font-body text-xs tracking-widest">
                      <Mail size={12} /> Reply by Email
                    </a>
                    <a href={`tel:${selectedQuote.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all py-3 font-body text-xs tracking-widest">
                      <Phone size={12} /> Call
                    </a>
                  </div>
                </motion.div>
              ) : (
                <div className="border border-border bg-card p-16 text-center">
                  <MessageSquare className="text-muted-foreground mx-auto mb-3" size={24} />
                  <p className="font-body text-xs text-muted-foreground">Select a quote request to view details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SERVICES ── */}
        {tab === "services" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-body text-xs text-muted-foreground tracking-widest">Manage your service offerings and hourly rates.</p>
              <button
                onClick={() => setShowAddService(!showAddService)}
                className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-[0.2em] uppercase px-5 py-2 hover:bg-primary-light transition-all"
              >
                <Plus size={12} /> Add Service
              </button>
            </div>

            {/* Add Service Form */}
            <AnimatePresence>
              {showAddService && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border border-primary/40 bg-card p-6 space-y-4"
                >
                  <p className="font-body text-xs tracking-[0.3em] uppercase text-primary">New Service</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Service Name *</label>
                      <input className={inputCls} placeholder="e.g. Wedding Photography" value={newService.name} onChange={e => setNewService(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Hourly Rate (£) *</label>
                      <input className={inputCls} type="number" placeholder="150" value={newService.hourly_rate} onChange={e => setNewService(p => ({ ...p, hourly_rate: parseFloat(e.target.value) }))} />
                    </div>
                    <div>
                      <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Icon (emoji)</label>
                      <input className={inputCls} placeholder="📸" value={newService.icon} onChange={e => setNewService(p => ({ ...p, icon: e.target.value }))} />
                    </div>
                    <div>
                      <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Slug (auto-generated if empty)</label>
                      <input className={inputCls} placeholder="wedding-photography" value={newService.slug} onChange={e => setNewService(p => ({ ...p, slug: e.target.value }))} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Description</label>
                      <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Service description..." value={newService.description} onChange={e => setNewService(p => ({ ...p, description: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={addService} disabled={savingService || !newService.name}
                      className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-widest uppercase px-6 py-2 hover:bg-primary-light transition-all disabled:opacity-50">
                      {savingService ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save Service
                    </button>
                    <button onClick={() => setShowAddService(false)} className="border border-border text-muted-foreground hover:text-foreground font-body text-xs tracking-widest uppercase px-4 py-2 transition-all">
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Service List */}
            <div className="space-y-3">
              {services.map((service) => (
                <div key={service.id} className="border border-border bg-card hover:border-primary/30 transition-all">
                  {editingServiceId === service.id ? (
                    <div className="p-6 space-y-4">
                      <p className="font-body text-xs tracking-[0.3em] uppercase text-primary">Editing: {service.name}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Service Name</label>
                          <input className={inputCls} value={editServiceData.name || ""} onChange={e => setEditServiceData(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div>
                          <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Hourly Rate (£)</label>
                          <input className={inputCls} type="number" value={editServiceData.hourly_rate || 0} onChange={e => setEditServiceData(p => ({ ...p, hourly_rate: parseFloat(e.target.value) }))} />
                        </div>
                        <div>
                          <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Icon (emoji)</label>
                          <input className={inputCls} value={editServiceData.icon || ""} onChange={e => setEditServiceData(p => ({ ...p, icon: e.target.value }))} />
                        </div>
                        <div>
                          <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Slug</label>
                          <input className={inputCls} value={editServiceData.slug || ""} onChange={e => setEditServiceData(p => ({ ...p, slug: e.target.value }))} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Description</label>
                          <textarea className={`${inputCls} resize-none`} rows={2} value={editServiceData.description || ""} onChange={e => setEditServiceData(p => ({ ...p, description: e.target.value }))} />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={saveEditService} disabled={savingService}
                          className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-widest uppercase px-6 py-2 hover:bg-primary-light transition-all disabled:opacity-50">
                          {savingService ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                        </button>
                        <button onClick={() => setEditingServiceId(null)} className="border border-border text-muted-foreground hover:text-foreground font-body text-xs tracking-widest uppercase px-4 py-2 transition-all">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {service.icon && <span className="text-2xl">{service.icon}</span>}
                        <div>
                          <p className="font-display text-xl text-foreground">{service.name}</p>
                          {service.description && <p className="font-body text-xs text-muted-foreground mt-0.5 max-w-md">{service.description}</p>}
                          <p className="font-body text-xs text-muted-foreground/50 mt-0.5">/{service.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-display text-2xl text-primary">£{service.hourly_rate}</p>
                          <p className="font-body text-[10px] text-muted-foreground">per hour</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEditService(service)} className="text-muted-foreground hover:text-primary transition-colors p-2">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => deleteService(service.id)} className="text-muted-foreground hover:text-destructive transition-colors p-2">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {services.length === 0 && (
                <div className="border border-border bg-card p-12 text-center">
                  <Briefcase className="text-muted-foreground mx-auto mb-3" size={24} />
                  <p className="font-body text-xs text-muted-foreground">No services yet. Add your first service above.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STAFF / TEAM ── */}
        {tab === "staff" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-body text-xs text-muted-foreground tracking-widest">
                {staff.filter(s => s.active).length} active · {staff.filter(s => !s.active).length} inactive team members
              </p>
              <button
                onClick={() => setShowAddStaff(!showAddStaff)}
                className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-[0.2em] uppercase px-5 py-2 hover:bg-primary-light transition-all"
              >
                <UserPlus size={12} /> Add Member
              </button>
            </div>

            {/* Add Staff Form */}
            <AnimatePresence>
              {showAddStaff && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border border-primary/40 bg-card p-6 space-y-4"
                >
                  <p className="font-body text-xs tracking-[0.3em] uppercase text-primary">New Team Member</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Full Name *</label>
                      <input className={inputCls} placeholder="e.g. James Thompson" value={newStaff.full_name} onChange={e => setNewStaff(p => ({ ...p, full_name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Role / Title *</label>
                      <input className={inputCls} placeholder="e.g. Lead Photographer" value={newStaff.role} onChange={e => setNewStaff(p => ({ ...p, role: e.target.value }))} />
                    </div>
                    <div>
                      <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Email</label>
                      <input className={inputCls} type="email" placeholder="team@jtstudios.com" value={newStaff.email} onChange={e => setNewStaff(p => ({ ...p, email: e.target.value }))} />
                    </div>
                    <div>
                      <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Phone</label>
                      <input className={inputCls} placeholder="+44 7xxx xxxxxx" value={newStaff.phone} onChange={e => setNewStaff(p => ({ ...p, phone: e.target.value }))} />
                    </div>
                    <div>
                      <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Avatar URL</label>
                      <input className={inputCls} placeholder="https://..." value={newStaff.avatar_url} onChange={e => setNewStaff(p => ({ ...p, avatar_url: e.target.value }))} />
                    </div>
                    <div>
                      <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Bio</label>
                      <input className={inputCls} placeholder="Short bio..." value={newStaff.bio} onChange={e => setNewStaff(p => ({ ...p, bio: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={addStaff} disabled={savingStaff || !newStaff.full_name || !newStaff.role}
                      className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-widest uppercase px-6 py-2 hover:bg-primary-light transition-all disabled:opacity-50">
                      {savingStaff ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Add Member
                    </button>
                    <button onClick={() => setShowAddStaff(false)} className="border border-border text-muted-foreground hover:text-foreground font-body text-xs tracking-widest uppercase px-4 py-2 transition-all">
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Staff List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staff.map((member) => (
                <div key={member.id} className={`border bg-card transition-all ${member.active ? "border-border hover:border-primary/30" : "border-border/40 opacity-60"}`}>
                  {editingStaffId === member.id ? (
                    <div className="p-5 space-y-3">
                      <p className="font-body text-xs tracking-[0.3em] uppercase text-primary">Editing</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Full Name</label>
                          <input className={inputCls} value={editStaffData.full_name || ""} onChange={e => setEditStaffData(p => ({ ...p, full_name: e.target.value }))} />
                        </div>
                        <div>
                          <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Role</label>
                          <input className={inputCls} value={editStaffData.role || ""} onChange={e => setEditStaffData(p => ({ ...p, role: e.target.value }))} />
                        </div>
                        <div>
                          <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Email</label>
                          <input className={inputCls} value={editStaffData.email || ""} onChange={e => setEditStaffData(p => ({ ...p, email: e.target.value }))} />
                        </div>
                        <div>
                          <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Phone</label>
                          <input className={inputCls} value={editStaffData.phone || ""} onChange={e => setEditStaffData(p => ({ ...p, phone: e.target.value }))} />
                        </div>
                        <div className="col-span-2">
                          <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Bio</label>
                          <input className={inputCls} value={editStaffData.bio || ""} onChange={e => setEditStaffData(p => ({ ...p, bio: e.target.value }))} />
                        </div>
                        <div className="col-span-2">
                          <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Avatar URL</label>
                          <input className={inputCls} value={editStaffData.avatar_url || ""} onChange={e => setEditStaffData(p => ({ ...p, avatar_url: e.target.value }))} />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={saveEditStaff} disabled={savingStaff}
                          className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-widest uppercase px-5 py-2 hover:bg-primary-light transition-all disabled:opacity-50">
                          {savingStaff ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                        </button>
                        <button onClick={() => setEditingStaffId(null)} className="border border-border text-muted-foreground font-body text-xs tracking-widest uppercase px-4 py-2 transition-all">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-display text-xl text-primary">{member.full_name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-display text-lg text-foreground">{member.full_name}</p>
                            <p className="font-body text-xs text-primary tracking-widest">{member.role}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => toggleStaffActive(member.id, !member.active)}
                              className={`font-body text-[9px] tracking-widest uppercase px-2 py-1 transition-all border ${
                                member.active ? "border-green-500/40 text-green-400 hover:border-red-500/40 hover:text-red-400" : "border-muted text-muted-foreground hover:border-green-500/40 hover:text-green-400"
                              }`}
                            >
                              {member.active ? "Active" : "Inactive"}
                            </button>
                            <button onClick={() => startEditStaff(member)} className="text-muted-foreground hover:text-primary transition-colors p-1.5">
                              <Edit2 size={12} />
                            </button>
                            <button onClick={() => deleteStaff(member.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1.5">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        {member.bio && <p className="font-body text-xs text-muted-foreground mt-1.5 leading-relaxed">{member.bio}</p>}
                        <div className="flex flex-wrap gap-3 mt-2">
                          {member.email && <a href={`mailto:${member.email}`} className="font-body text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1"><Mail size={10} />{member.email}</a>}
                          {member.phone && <a href={`tel:${member.phone}`} className="font-body text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1"><Phone size={10} />{member.phone}</a>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {staff.length === 0 && (
                <div className="col-span-2 border border-border bg-card p-12 text-center">
                  <Users className="text-muted-foreground mx-auto mb-3" size={24} />
                  <p className="font-body text-xs text-muted-foreground">No team members yet. Add your first team member above.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PORTFOLIO ── */}
        {tab === "portfolio" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-body text-xs text-muted-foreground tracking-widest">
                {portfolio.length} items · {portfolio.filter(p => p.featured).length} featured
              </p>
              <button
                onClick={() => setShowAddPortfolio(!showAddPortfolio)}
                className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-[0.2em] uppercase px-5 py-2 hover:bg-primary-light transition-all"
              >
                <Plus size={12} /> Add Item
              </button>
            </div>

            {/* Add Portfolio Form */}
            <AnimatePresence>
              {showAddPortfolio && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border border-primary/40 bg-card p-6 space-y-4"
                >
                  <p className="font-body text-xs tracking-[0.3em] uppercase text-primary">New Portfolio Item</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Title *</label>
                      <input className={inputCls} placeholder="e.g. Sarah & James Wedding" value={newPortfolioItem.title} onChange={e => setNewPortfolioItem(p => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div>
                      <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Category</label>
                      <select className={inputCls} value={newPortfolioItem.category} onChange={e => setNewPortfolioItem(p => ({ ...p, category: e.target.value }))}>
                        {portfolioCategories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Image URL * (direct image link)</label>
                      <input className={inputCls} placeholder="https://images.unsplash.com/..." value={newPortfolioItem.image_url} onChange={e => setNewPortfolioItem(p => ({ ...p, image_url: e.target.value }))} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Video URL (optional — YouTube/Vimeo embed)</label>
                      <input className={inputCls} placeholder="https://www.youtube.com/embed/..." value={newPortfolioItem.video_url} onChange={e => setNewPortfolioItem(p => ({ ...p, video_url: e.target.value }))} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Description</label>
                      <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Brief description..." value={newPortfolioItem.description} onChange={e => setNewPortfolioItem(p => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="featured-new" checked={newPortfolioItem.featured} onChange={e => setNewPortfolioItem(p => ({ ...p, featured: e.target.checked }))} className="accent-primary" />
                      <label htmlFor="featured-new" className="font-body text-xs text-muted-foreground">Featured on homepage</label>
                    </div>
                  </div>
                  {/* Image preview */}
                  {newPortfolioItem.image_url && (
                    <div className="mt-2">
                      <img src={newPortfolioItem.image_url} alt="Preview" className="h-32 w-auto object-cover border border-border" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={addPortfolioItem} disabled={savingPortfolio || !newPortfolioItem.title || !newPortfolioItem.image_url}
                      className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-widest uppercase px-6 py-2 hover:bg-primary-light transition-all disabled:opacity-50">
                      {savingPortfolio ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Add to Portfolio
                    </button>
                    <button onClick={() => setShowAddPortfolio(false)} className="border border-border text-muted-foreground hover:text-foreground font-body text-xs tracking-widest uppercase px-4 py-2 transition-all">
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Portfolio Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolio.map((item) => (
                <div key={item.id} className="border border-border bg-card hover:border-primary/30 transition-all overflow-hidden">
                  {editingPortfolioId === item.id ? (
                    <div className="p-5 space-y-3">
                      <p className="font-body text-xs tracking-[0.3em] uppercase text-primary">Editing</p>
                      <div className="space-y-3">
                        <div>
                          <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Title</label>
                          <input className={inputCls} value={editPortfolioData.title || ""} onChange={e => setEditPortfolioData(p => ({ ...p, title: e.target.value }))} />
                        </div>
                        <div>
                          <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Category</label>
                          <select className={inputCls} value={editPortfolioData.category || "Photography"} onChange={e => setEditPortfolioData(p => ({ ...p, category: e.target.value }))}>
                            {portfolioCategories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Image URL</label>
                          <input className={inputCls} value={editPortfolioData.image_url || ""} onChange={e => setEditPortfolioData(p => ({ ...p, image_url: e.target.value }))} />
                        </div>
                        <div>
                          <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Video URL</label>
                          <input className={inputCls} value={editPortfolioData.video_url || ""} onChange={e => setEditPortfolioData(p => ({ ...p, video_url: e.target.value }))} />
                        </div>
                        <div>
                          <label className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1 block">Description</label>
                          <textarea className={`${inputCls} resize-none`} rows={2} value={editPortfolioData.description || ""} onChange={e => setEditPortfolioData(p => ({ ...p, description: e.target.value }))} />
                        </div>
                        <div className="flex items-center gap-3">
                          <input type="checkbox" id={`featured-${item.id}`} checked={editPortfolioData.featured || false} onChange={e => setEditPortfolioData(p => ({ ...p, featured: e.target.checked }))} className="accent-primary" />
                          <label htmlFor={`featured-${item.id}`} className="font-body text-xs text-muted-foreground">Featured</label>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={saveEditPortfolio} disabled={savingPortfolio}
                          className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-widest uppercase px-5 py-2 hover:bg-primary-light transition-all disabled:opacity-50">
                          {savingPortfolio ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                        </button>
                        <button onClick={() => setEditingPortfolioId(null)} className="border border-border text-muted-foreground font-body text-xs tracking-widest uppercase px-4 py-2 transition-all">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="relative aspect-video overflow-hidden">
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                        {item.featured && (
                          <div className="absolute top-2 left-2 bg-primary text-white font-body text-[9px] tracking-widest uppercase px-2 py-1 flex items-center gap-1">
                            <Star size={8} fill="white" /> Featured
                          </div>
                        )}
                        {item.video_url && (
                          <div className="absolute top-2 right-2 bg-black/60 text-white font-body text-[9px] px-2 py-1 flex items-center gap-1">
                            ▶ Video
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-display text-lg text-foreground leading-tight">{item.title}</p>
                            <p className="font-body text-[10px] text-primary tracking-widest uppercase">{item.category}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => togglePortfolioFeatured(item.id, !item.featured)} title={item.featured ? "Remove from featured" : "Set as featured"}
                              className={`p-1.5 transition-colors ${item.featured ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
                              <Star size={12} fill={item.featured ? "currentColor" : "none"} />
                            </button>
                            <button onClick={() => startEditPortfolio(item)} className="text-muted-foreground hover:text-primary transition-colors p-1.5">
                              <Edit2 size={12} />
                            </button>
                            <button onClick={() => deletePortfolioItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1.5">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        {item.description && <p className="font-body text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{item.description}</p>}
                      </div>
                    </>
                  )}
                </div>
              ))}
              {portfolio.length === 0 && (
                <div className="col-span-3 border border-border bg-card p-16 text-center">
                  <Image className="text-muted-foreground mx-auto mb-3" size={28} />
                  <p className="font-body text-xs text-muted-foreground">No portfolio items yet. Add your first piece above.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── BLOCKED DATES ── */}
        {tab === "dates" && (
          <div className="space-y-4">
            <div className="border border-border bg-card p-6">
              <p className="font-body text-xs tracking-[0.2em] uppercase text-primary mb-4">Block a Date</p>
              <div className="flex flex-col md:flex-row gap-3">
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                  className="bg-input border border-border text-foreground font-body text-sm px-4 py-2 focus:outline-none focus:border-primary" />
                <input type="text" value={newDateReason} onChange={(e) => setNewDateReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="flex-1 bg-input border border-border text-foreground font-body text-sm px-4 py-2 focus:outline-none focus:border-primary" />
                <button onClick={addBlockedDate} className="flex items-center gap-2 bg-primary text-primary-foreground font-body text-xs tracking-[0.2em] uppercase px-6 py-2 hover:bg-primary-light transition-all">
                  <Plus size={12} /> Block Date
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {blockedDates.map((bd) => (
                <div key={bd.id} className="border border-border bg-card p-4 flex items-center justify-between">
                  <div>
                    <p className="font-body text-sm text-foreground">
                      {new Date(bd.blocked_date + 'T00:00:00').toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </p>
                    {bd.reason && <p className="font-body text-xs text-muted-foreground">{bd.reason}</p>}
                  </div>
                  <button onClick={() => removeBlockedDate(bd.id)} className="text-muted-foreground hover:text-destructive transition-colors p-2">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {blockedDates.length === 0 && <p className="font-body text-xs text-muted-foreground text-center py-8">No dates blocked.</p>}
            </div>
          </div>
        )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
