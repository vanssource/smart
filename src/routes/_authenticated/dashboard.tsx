import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowDownRight, ArrowUpRight, Lock, Search, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { useEffect } from "react"; // Tambahkan ini di bagian import
import { useQueryClient } from "@tanstack/react-query"; // Tambahkan ini

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Kita buat channel untuk memantau tabel sumbernya (stock_prices)
    const channel = supabase
      .channel("realtime-dashboard-updates")
      .on(
        "postgres_changes",
        {
          event: "*", // Mendengarkan INSERT, UPDATE, atau DELETE
          schema: "public",
          table: "stock_prices", // Tetap pantau tabel sumber ini
        },
        (payload) => {
          console.log("Ada data baru di stock_prices, melakukan refresh data...");
          // Ini otomatis membuat query "latest-prices" jalan ulang
          queryClient.invalidateQueries({ queryKey: ["latest-prices"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const [q, setQ] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: stocks = [] } = useQuery({
    queryKey: ["stocks"],
    queryFn: async () => {
      const { data } = await supabase.from("stocks").select("*").order("code");
      return data ?? [];
    },
  });

  const { data: dashboardData = [] } = useQuery({
    queryKey: ["stock-dashboard"],
    queryFn: async () => {
      // 1. Ambil harga terbaru dari realtime_price
      const { data: realTimeData, error: rtError } = await supabase
        .from("realtime_price")
        .select("code, price"); // price di sini adalah last_price

      // 2. Ambil data dashboard (untuk prev_close dan info lainnya)
      const { data: viewData, error: viewError } = await supabase
        .from("view_stock_dashboard")
        .select("code, prev_close");

      if (rtError || viewError) throw rtError || viewError;

      // 3. Gabungkan keduanya
      // Kita buat Map untuk akses cepat ke prev_close berdasarkan kode
      const viewMap = new Map(viewData.map((item) => [item.code, item.prev_close]));

      return realTimeData.map((rt) => ({
        code: rt.code,
        last_price: rt.price, // Ambil harga terbaru dari tabel realtime
        prev_close: viewMap.get(rt.code) || 0, // Ambil prev_close dari view
      }));
    },
  });

  const priceMap = useMemo(() => {
    const m = new Map();
    dashboardData.forEach((p) => {
      if (p.code) {
        m.set(p.code, {
          last: Number(p.last_price || 0),
          prev: Number(p.prev_close || 0),
        });
      }
    });
    return m;
  }, [dashboardData]);

  const isPremium = profile?.tier === "premium";

  const filtered = stocks.filter(
    (s) =>
      s.code.toLowerCase().includes(q.toLowerCase()) ||
      s.name.toLowerCase().includes(q.toLowerCase()),
  );

  // 1. Fungsi helper yang lebih kuat
  const calculateChange = (last, prev) => {
    // Paksa menjadi angka (Number) untuk mengantisipasi data string dari database
    const lastNum = Number(last);
    const prevNum = Number(prev);

    // Jika harga kemarin (prevNum) adalah 0 atau tidak valid, kembalikan 0.
    // Ini mencegah pembagian dengan nol yang menyebabkan Infinity.
    if (!prevNum || prevNum <= 0) return 0;

    return ((lastNum - prevNum) / prevNum) * 100;
  };

  // 2. Gunakan di dalam useMemo dengan perbaikan filter
  const gainers = useMemo(() => {
    return (
      [...stocks]
        .map((s) => ({ ...s, p: priceMap.get(s.code) }))
        .filter((s) => s.p) // Pastikan data harga dari priceMap ada
        .map((s) => ({
          ...s,
          // Hitung persentase dengan fungsi helper yang sudah diperkuat
          chg: calculateChange(s.p!.last, s.p!.prev),
        }))
        // Filter hanya saham yang benar-benar naik (> 0)
        // DAN pastikan hasilnya angka yang valid (bukan Infinity/NaN)
        .filter((s) => s.chg > 0 && s.chg <= 20 && isFinite(s.chg))
        .sort((a, b) => b.chg - a.chg)
        .slice(0, 3)
    );
  }, [stocks, priceMap]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">
          Halo, {profile?.display_name ?? "Trader"} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          {stocks.length} saham tersedia • Tier:{" "}
          <span className={isPremium ? "text-gold font-medium" : ""}>
            {profile?.tier ?? "free"}
          </span>
        </p>
      </div>

      {/* Top gainers */}
      <div className="grid gap-4 md:grid-cols-3">
        {gainers.map((g) => {
          // GANTIKAN: Jangan hitung manual lagi.
          // Gunakan g.chg yang sudah dihitung di useMemo (sudah aman dari Infinity)
          const up = g.chg >= 0;

          return (
            <Link key={g.code} to="/stocks/$code" params={{ code: g.code }}>
              <Card className="border-border/60 bg-card-gradient transition-all hover:border-primary/50 hover:shadow-glow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-display text-2xl font-bold">{g.code}</div>
                      <div className="text-xs text-muted-foreground">{g.name}</div>
                    </div>

                    <div
                      className={`flex items-center gap-1 text-sm font-semibold ${up ? "text-bull" : "text-bear"}`}
                    >
                      {up ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      {/* Tampilkan angka dari g.chg */}
                      {g.chg.toFixed(2)}%
                    </div>
                  </div>
                  <div className="mt-3 font-display text-xl">
                    Rp {g.p!.last.toLocaleString("id-ID")}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Search + list */}
      <Card className="border-border/60 bg-card-gradient">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="font-display text-xl">Daftar Saham IDX</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari BBCA, TLKM…"
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
                  <th className="px-3 py-3">Kode</th>
                  <th className="px-3 py-3">Nama</th>
                  <th className="px-3 py-3">Sektor</th>
                  <th className="px-3 py-3 text-right">Harga</th>
                  <th className="px-3 py-3 text-right">Change</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const p = priceMap.get(s.code);
                  const chg = p ? ((p.last - p.prev) / p.prev) * 100 : null;
                  const locked = s.is_premium && !isPremium;
                  return (
                    <tr key={s.code} className="border-b border-border/40 hover:bg-secondary/40">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 font-mono font-semibold">
                          {s.code}
                          {s.is_premium && (
                            <Badge variant="secondary" className="bg-gold/20 text-gold text-[10px]">
                              PRO
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{s.name}</td>
                      <td className="px-3 py-3">
                        <Badge variant="outline">{s.sector}</Badge>
                      </td>
                      <td className="px-3 py-3 text-right font-mono">
                        {p ? `Rp ${p.last.toLocaleString("id-ID")}` : "—"}
                      </td>
                      <td
                        className={`px-3 py-3 text-right font-mono ${chg == null ? "" : chg >= 0 ? "text-bull" : "text-bear"}`}
                      >
                        {chg == null ? "—" : `${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%`}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {locked ? (
                          <Link
                            to="/pricing"
                            className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
                          >
                            <Lock className="h-3 w-3" /> Upgrade
                          </Link>
                        ) : (
                          <Link
                            to="/stocks/$code"
                            params={{ code: s.code }}
                            className="text-xs text-primary hover:underline"
                          >
                            Analisa →
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
