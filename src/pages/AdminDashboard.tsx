import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Calendar, Users, PoundSterling, BookOpen, Settings, Lock, Unlock,
  ChevronDown, Plus, Trash2, Loader2, CheckCircle, XCircle,
} from "lucide-react";

interface Booking {
  id: string;
  booking_ref: string;
  full_name: string;
  email: string;
  event_type: string;
  event_date: string;
  status: string;
  estimated_total: number;
  deposit_amount: number;
  remaining_balance: number;
  services?: { name: string } | null;
}

interface Service {
  id: string;
  name: string;
  hourly_rate: number;
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

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"overview" | "bookings" | "services" | "dates">("overview");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [blockedDates, setBlockedDates] = useState<{ id: string; blocked_date: string; reason: string | null }[]>([]);
  const [newDate, setNewDate] = useState("");
  const [newDateReason, setNewDateReason] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/");
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    supabase.from("bookings").select("*, services(name)").order("created_at", { ascending: false })
      .then(({ data }) => setBookings(data || []));
    supabase.from("services").select("*").order("name")
      .then(({ data }) => setServices(data || []));
    supabase.from("blocked_dates").select("*").order("blocked_date")
      .then(({ data }) => setBlockedDates(data || []));
  }, [isAdmin]);

  const updateBookingStatus = async (id: string, status: string) => {
    setUpdating(id);
    await supabase.from("bookings").update({ status }).eq("id", id);
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
    setUpdating(null);
  };

  const updateServiceRate = async (id: string, rate: number) => {
    await supabase.from("services").update({ hourly_rate: rate }).eq("id", id);
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, hourly_rate: rate } : s));
  };

  const addBlockedDate = async () => {
    if (!newDate) return;
    const { data } = await supabase.from("blocked_dates").insert({ blocked_date: newDate, reason: newDateReason || null }).select().single();
    if (data) setBlockedDates((prev) => [...prev, data]);
    setNewDate("");
    setNewDateReason("");
  };

  const removeBlockedDate = async (id: string) => {
    await supabase.from("blocked_dates").delete().eq("id", id);
    setBlockedDates((prev) => prev.filter((d) => d.id !== id));
  };

  const totalRevenue = bookings.filter((b) => b.status === "fully_paid" || b.status === "completed")
    .reduce((sum, b) => sum + (b.estimated_total || 0), 0);
  const depositsReceived = bookings.filter((b) => b.status === "deposit_paid" || b.status === "fully_paid" || b.status === "completed")
    .reduce((sum, b) => sum + (b.deposit_amount || 0), 0);

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const month = date.toLocaleString("en-GB", { month: "short" });
    const count = bookings.filter((b) => {
      const d = new Date(b.event_date);
      return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    }).length;
    return { month, bookings: count };
  });

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-28 pb-24">
        <div className="mb-10">
          <p className="font-body text-primary text-xs tracking-[0.4em] uppercase mb-2">Admin</p>
          <h1 className="font-display text-5xl text-foreground">Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-border overflow-x-auto">
          {(["overview", "bookings", "services", "dates"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`font-body text-xs tracking-[0.2em] uppercase px-6 py-3 border-b-2 whitespace-nowrap transition-all duration-300 ${
                tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "overview" ? "Overview" : t === "bookings" ? "Bookings" : t === "services" ? "Services & Rates" : "Blocked Dates"}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Bookings", value: bookings.length, icon: BookOpen, color: "text-foreground" },
                { label: "Total Revenue", value: `£${totalRevenue.toFixed(0)}`, icon: PoundSterling, color: "text-primary" },
                { label: "Deposits In", value: `£${depositsReceived.toFixed(0)}`, icon: PoundSterling, color: "text-blue-400" },
                { label: "Pending Deposit", value: bookings.filter((b) => b.status === "pending_deposit").length, icon: Calendar, color: "text-yellow-400" },
              ].map((stat) => (
                <div key={stat.label} className="border border-border bg-card p-6">
                  <stat.icon className={`${stat.color} mb-3`} size={20} />
                  <p className={`font-display text-3xl ${stat.color} mb-1`}>{stat.value}</p>
                  <p className="font-body text-xs text-muted-foreground tracking-widest">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="border border-border bg-card p-6">
              <p className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Monthly Bookings (Last 6 Months)</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0 }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontFamily: "Montserrat" }}
                  />
                  <Bar dataKey="bookings" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* BOOKINGS */}
        {tab === "bookings" && (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div key={booking.id} className="border border-border bg-card p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-body text-xs text-primary">{booking.booking_ref}</span>
                      <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 ${statusClass[booking.status] || ""}`}>
                        {statusLabel[booking.status] || booking.status}
                      </span>
                    </div>
                    <p className="font-display text-xl text-foreground">{booking.full_name}</p>
                    <p className="font-body text-xs text-muted-foreground">{booking.event_type} · {booking.event_date} · £{booking.estimated_total?.toFixed(2)}</p>
                    {booking.services && <p className="font-body text-xs text-primary mt-0.5">{booking.services.name}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {updating === booking.id ? (
                      <Loader2 size={14} className="animate-spin text-primary" />
                    ) : (
                      <select
                        value={booking.status}
                        onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                        className="bg-input border border-border text-foreground font-body text-xs px-3 py-2 focus:outline-none focus:border-primary"
                      >
                        {statusOptions.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SERVICES */}
        {tab === "services" && (
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.id} className="border border-border bg-card p-6 flex items-center justify-between gap-4">
                <p className="font-display text-xl text-foreground">{service.name}</p>
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

        {/* BLOCKED DATES */}
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
              {blockedDates.length === 0 && (
                <p className="font-body text-xs text-muted-foreground text-center py-8">No dates blocked.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
