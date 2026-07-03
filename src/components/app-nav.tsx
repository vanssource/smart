import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, LayoutDashboard, Radio, Sparkles, LogOut, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AppNav() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.user.id)
        .maybeSingle();
      return data;
    },
  });

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/signals", label: "Sinyal Harian", icon: Radio },
    { to: "/pricing", label: "Upgrade", icon: Sparkles },
  ] as const;

  async function logout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary shadow-glow">
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">SahamSmart</span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const active = path.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors md:px-3 ${
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <l.icon className="h-4 w-4" />
                {/* Tambahkan 'hidden md:inline' agar label teks hanya muncul di layar besar */}
                <span className="hidden md:inline">{l.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          {profile && (
            <Badge
              variant={profile.tier === "premium" ? "default" : "secondary"}
              className={profile.tier === "premium" ? "bg-gold text-black" : ""}
            >
              {profile.tier === "premium" ? "Premium" : "Free"}
            </Badge>
          )}
          <span className="hidden text-sm text-muted-foreground md:inline">
            {profile?.display_name ?? profile?.email}
          </span>
          <Button variant="ghost" size="icon" onClick={logout} aria-label="Keluar">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
