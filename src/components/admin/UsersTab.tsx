import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, ShieldOff, Trash2, Users, RefreshCw } from "lucide-react";

interface UserRecord {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: string;
}

export default function UsersTab({ inputCls }: { inputCls: string }) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, created_at");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");

    if (!profiles) { setLoading(false); return; }

    const merged: UserRecord[] = profiles.map(p => {
      const roleRow = roles?.find(r => r.user_id === p.user_id);
      return {
        id: p.user_id,
        email: "",
        full_name: p.full_name,
        created_at: p.created_at,
        role: roleRow?.role || "client",
      };
    });
    setUsers(merged);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const changeRole = async (userId: string, newRole: "admin" | "client") => {
    setUpdating(userId);
    await supabase.from("user_roles").update({ role: newRole }).eq("user_id", userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    setUpdating(null);
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Remove this user's portal access? Their bookings will remain.")) return;
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("profiles").delete().eq("user_id", userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={24} /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-body text-xs text-muted-foreground tracking-widest">
          {users.length} registered users · {users.filter(u => u.role === "admin").length} admins
        </p>
        <button onClick={fetchUsers} className="flex items-center gap-2 border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all px-4 py-2 font-body text-xs tracking-widest uppercase">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="border border-border bg-card p-4 flex items-center justify-between gap-4 hover:border-primary/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="font-display text-lg text-primary">
                  {(user.full_name || "?").charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-body text-sm text-foreground">{user.full_name || "Unnamed User"}</p>
                <p className="font-body text-[10px] text-muted-foreground tracking-widest">ID: {user.id.slice(0, 8)}...</p>
                <p className="font-body text-[10px] text-muted-foreground">
                  Joined {new Date(user.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-body text-[10px] tracking-widest uppercase px-2.5 py-1 border flex items-center gap-1 ${
                user.role === "admin"
                  ? "border-primary/40 text-primary bg-primary/10"
                  : "border-border text-muted-foreground"
              }`}>
                {user.role === "admin" ? <Shield size={9} /> : <Users size={9} />}
                {user.role}
              </span>
              {updating === user.id ? (
                <Loader2 size={14} className="animate-spin text-primary" />
              ) : user.role === "admin" ? (
                <button
                  onClick={() => changeRole(user.id, "client")}
                  className="font-body text-[10px] tracking-widest uppercase px-3 py-1.5 border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all"
                >
                  <ShieldOff size={10} className="inline mr-1" />Demote
                </button>
              ) : (
                <button
                  onClick={() => changeRole(user.id, "admin")}
                  className="font-body text-[10px] tracking-widest uppercase px-3 py-1.5 border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all"
                >
                  <Shield size={10} className="inline mr-1" />Promote
                </button>
              )}
              <button onClick={() => deleteUser(user.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1.5">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="border border-border bg-card p-16 text-center">
            <Users className="text-muted-foreground mx-auto mb-3" size={28} />
            <p className="font-body text-xs text-muted-foreground">No registered users yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
