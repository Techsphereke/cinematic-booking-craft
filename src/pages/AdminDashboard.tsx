import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  TrendingUp, Users, ChevronRight,
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
  hourly_rate: number;
  description?: string | null;
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

type TabType = "overview" | "bookings" | "quotes" | "services" | "dates";

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabType>("overview");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [blockedDates, setBlockedDates] = useState<{ id: string; blocked_date: string; reason: string | null }[]>([]);
  const [newDate, setNewDate] = useState("");
  const [newDateReason, setNewDateReason] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/");
  }, [user, isAdmin, loading, navigate]);

  const fetchAll = async () => {
    if (!isAdmin) return;
    setRefreshing(true);
    const [bRes, sRes, qRes, dRes] = await Promise.all([
      supabase.from("bookings").select("*, services(name)").order("created_at", { ascending: false }),
      supabase.from("services").select("*").order("name"),
      supabase.from("quote_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("blocked_dates").select("*").order("blocked_date"),
    ]);
    if (bRes.data) setBookings(bRes.data);
    if (sRes.data) setServices(sRes.data);
    if (qRes.data) setQuotes(qRes.data);
    if (dRes.data) setBlockedDates(dRes.data);
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

  const updateServiceRate = async (id: string, rate: number) => {
    await supabase.from("services").update({ hourly_rate: rate }).eq("id", id);
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, hourly_rate: rate } : s));
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

  const COLORS = ["hsl(43, 74%, 60%)", "hsl(43, 74%, 45%)", "hsl(43, 74%, 30%)", "hsl(43, 74%, 75%)"];

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  const tabs: { key: TabType; label: string; badge?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "bookings", label: "Bookings", badge: bookings.filter(b => b.status === "pending_deposit").length || undefined },
    { key: "quotes", label: "Quote Requests", badge: newQuotes || undefined },
    { key: "services", label: "Services & Rates" },
    { key: "dates", label: "Blocked Dates" },
  ];

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-28 pb-24">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="font-body text-primary text-xs tracking-[0.4em] uppercase mb-2">Admin</p>
            <h1 className="font-display text-5xl text-foreground">Dashboard</h1>
          </div>
          <button
            onClick={fetchAll}
            disabled={refreshing}
            className="flex items-center gap-2 border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all px-4 py-2 font-body text-xs tracking-widest uppercase"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-border overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative font-body text-xs tracking-[0.2em] uppercase px-6 py-3 border-b-2 whitespace-nowrap transition-all duration-300 ${
                tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {t.badge ? (
                <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Bookings", value: bookings.length, icon: BookOpen, color: "text-foreground", sub: `${bookings.filter(b => b.status === "pending_deposit").length} pending` },
                { label: "Total Revenue", value: `£${totalRevenue.toFixed(0)}`, icon: PoundSterling, color: "text-primary", sub: "Fully paid" },
                { label: "Deposits In", value: `£${depositsReceived.toFixed(0)}`, icon: TrendingUp, color: "text-blue-400", sub: `£${pendingBalance.toFixed(0)} balance pending` },
                { label: "New Quotes", value: newQuotes, icon: MessageSquare, color: "text-yellow-400", sub: `${quotes.length} total requests` },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="border border-border bg-card p-6 hover:border-primary/30 transition-all"
                >
                  <stat.icon className={`${stat.color} mb-3`} size={20} />
                  <p className={`font-display text-3xl ${stat.color} mb-1`}>{stat.value}</p>
                  <p className="font-body text-xs text-muted-foreground tracking-widest mb-1">{stat.label}</p>
                  <p className="font-body text-[10px] text-muted-foreground/60">{stat.sub}</p>
                </motion.div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 border border-border bg-card p-6">
                <p className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Revenue & Bookings (6 Months)</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthlyRevenue}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0 }} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} name="Revenue (£)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="border border-border bg-card p-6">
                <p className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Bookings by Service</p>
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

            {/* Recent activity */}
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
          </div>
        )}

        {/* ── BOOKINGS ── */}
        {tab === "bookings" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-3">
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

            {/* Booking Detail Panel */}
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
                        <p className="font-body text-foreground">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border border-primary/20 bg-primary/5 p-4 space-y-2">
                    <p className="font-body text-xs tracking-widest uppercase text-primary mb-2">Financials</p>
                    <div className="flex justify-between font-body text-sm">
                      <span className="text-muted-foreground">Estimated Total</span>
                      <span className="text-foreground">£{selectedBooking.estimated_total?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-body text-sm">
                      <span className="text-muted-foreground">Deposit (50%)</span>
                      <span className="text-primary">£{selectedBooking.deposit_amount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-body text-sm">
                      <span className="text-muted-foreground">Remaining Balance</span>
                      <span className="text-foreground">£{selectedBooking.remaining_balance?.toFixed(2)}</span>
                    </div>
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
                <div className="border border-border bg-card p-12 text-center">
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
            <div className="lg:col-span-2 space-y-3">
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
                      quote.status === "new" ? "status-pending" :
                      quote.status === "booked" ? "status-paid" :
                      quote.status === "declined" ? "status-cancelled" : "status-deposit"
                    }`}>
                      {quoteStatusLabel[quote.status]}
                    </span>
                  </div>
                  <p className="font-display text-lg text-foreground">{quote.full_name}</p>
                  <p className="font-body text-xs text-muted-foreground">{quote.service_interest}</p>
                  <p className="font-body text-xs text-muted-foreground">{quote.event_type}</p>
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
                      selectedQuote.status === "new" ? "status-pending" :
                      selectedQuote.status === "booked" ? "status-paid" :
                      selectedQuote.status === "declined" ? "status-cancelled" : "status-deposit"
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
                        <p className="font-body text-foreground">{item.value}</p>
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
                    <a href={`mailto:${selectedQuote.email}`} className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary-light transition-all py-3 font-body text-xs tracking-widest">
                      <Mail size={12} /> Reply by Email
                    </a>
                    <a href={`tel:${selectedQuote.phone}`} className="flex-1 flex items-center justify-center gap-2 border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all py-3 font-body text-xs tracking-widest">
                      <Phone size={12} /> Call
                    </a>
                  </div>
                </motion.div>
              ) : (
                <div className="border border-border bg-card p-12 text-center">
                  <MessageSquare className="text-muted-foreground mx-auto mb-3" size={24} />
                  <p className="font-body text-xs text-muted-foreground">Select a quote request to view details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SERVICES ── */}
        {tab === "services" && (
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.id} className="border border-border bg-card p-6 flex items-center justify-between gap-4">
                <div>
                  <p className="font-display text-xl text-foreground">{service.name}</p>
                  {service.description && <p className="font-body text-xs text-muted-foreground mt-1">{service.description}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-body text-xs text-muted-foreground">£</span>
                  <input
                    type="number"
                    value={service.hourly_rate}
                    onChange={(e) => setServices((prev) => prev.map((s) => s.id === service.id ? { ...s, hourly_rate: parseFloat(e.target.value) } : s))}
                    onBlur={(e) => updateServiceRate(service.id, parseFloat(e.target.value))}
                    className="w-24 bg-input border border-border text-foreground font-body text-sm px-3 py-2 focus:outline-none focus:border-primary"
                  />
                  <span className="font-body text-xs text-muted-foreground">/hr</span>
                </div>
              </div>
            ))}
            <p className="font-body text-xs text-muted-foreground">Changes save automatically on blur.</p>
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
                    <p className="font-body text-sm text-foreground">{new Date(bd.blocked_date).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                    {bd.reason && <p className="font-body text-xs text-muted-foreground">{bd.reason}</p>}
                  </div>
                  <button onClick={() => removeBlockedDate(bd.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {blockedDates.length === 0 && <p className="font-body text-xs text-muted-foreground text-center py-8">No dates blocked.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
