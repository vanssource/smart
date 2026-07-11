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
import {
  Activity,
  ShieldAlert,
  AlertTriangle,
  CalendarDays,
  CircleOff,
  CircleAlert,
} from "lucide-react";

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

  const [sortConfig, setSortConfig] = useState<{
    key: "last" | "chg";
    direction: "asc" | "desc";
  }>({ key: "chg", direction: "desc" }); // Default: Change tertinggi

  const filtered = useMemo(() => {
    let data = [...stocks]
      .map((s) => ({ ...s, p: priceMap.get(s.code) }))
      .filter(
        (s) =>
          s.code.toLowerCase().includes(q.toLowerCase()) ||
          s.name.toLowerCase().includes(q.toLowerCase()),
      )
      .map((s) => ({
        ...s,
        last: s.p?.last || 0,
        chg: s.p ? ((s.p.last - s.p.prev) / s.p.prev) * 100 : null,
      }));

    // Logika Pengurutan
    data.sort((a, b) => {
      const valA =
        sortConfig.key === "chg"
          ? (a.chg ?? -Infinity)
          : sortConfig.key === "last"
            ? a.last
            : a.code;
      const valB =
        sortConfig.key === "chg"
          ? (b.chg ?? -Infinity)
          : sortConfig.key === "last"
            ? b.last
            : b.code;

      if (sortConfig.direction === "asc") return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });

    return data;
  }, [stocks, priceMap, q, sortConfig]);

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
    return [...stocks]
      .map((s) => ({ ...s, p: priceMap.get(s.code) }))
      .filter((s) => s.p && s.p.prev > 0) // Filter data harga valid
      .map((s) => {
        const chg = calculateChange(s.p!.last, s.p!.prev);
        const nominalChg = s.p!.last - s.p!.prev; // Hitung nominal Rupiah
        return { ...s, chg, nominalChg };
      })
      .filter((s) => s.chg > 0 && s.chg <= 20 && isFinite(s.chg))
      .sort((a, b) => b.chg - a.chg)
      .slice(0, 3);
  }, [stocks, priceMap]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start pb-8 border-b border-border/40 gap-8">
        {/* Sisi Kiri: Halo, Subtitle, & Info Bar */}
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
              Halo, <span className="text-bull">{profile?.display_name ?? "Trader"}</span>
            </h1>

            {/* Ikon Activity dengan indikator Live */}
            <div className="relative flex items-center justify-center">
              <Activity className="h-8 w-8 text-bull/80 stroke-[1.5]" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bull opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-bull"></span>
              </span>
            </div>
          </div>

          <p className="text-lg text-muted-foreground max-w-lg">
            Selamat datang kembali. Analisa pasar real-time Anda sudah siap dipantau.
          </p>

          {/* Info Bar */}
          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/50 border border-border/50">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bull opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-bull"></span>
              </div>
              <span className="text-xs font-medium text-foreground/80">
                {stocks.length} Saham Terpantau
              </span>
            </div>
            <div className="text-xs font-medium text-muted-foreground px-2">
              Akun: <span className="text-foreground uppercase">{profile?.tier ?? "Free"}</span>
            </div>
          </div>
        </div>

        {/* Sisi Kanan: Disclaimer */}
        <div className="shrink-0 w-full md:w-auto">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/30 max-w-md w-full">
            <div className="mt-0.5 shrink-0">
              <ShieldAlert className="h-6 w-6 text-amber-500" />
            </div>
            <div className="space-y-1.5">
              {/* Judul: Dinaikkan menjadi text-xs agar lebih jelas */}
              <p className="text-s font-bold uppercase tracking-widest text-amber-600">
                Catatan Penting
              </p>
              {/* Teks utama: Dinaikkan menjadi text-sm agar lebih lega dan mudah dibaca */}
              <p className="text-sm leading-relaxed text-foreground/80 font-medium">
                Seluruh data di SahamSmart bersifat informatif untuk tujuan analisis teknikal.
                Keputusan investasi sepenuhnya menjadi tanggung jawab pengguna.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <AlertTriangle className="mt-1 h-8 w-8 text-amber-400 shrink-0" />

          <div className="flex-1">
            <Badge className="gap-2 bg-red-500 text-white hover:bg-red-500">
              <CircleAlert className="h-3.5 w-3.5" />
              PASAR TUTUP
            </Badge>

            <h3 className="mt-2 text-lg font-bold">
              Bursa Efek Indonesia sedang libur akhir pekan
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Harga saham dan persentase perubahan yang ditampilkan merupakan
              <span className="font-semibold text-foreground">
                {" "}
                harga penutupan hari bursa terakhir.
              </span>
            </p>

            <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-border bg-background/60 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Hari perdagangan terakhir
                </p>
                <p className="font-semibold text-foreground">Jumat, 10 Juli 2026 • 17:00 WIB</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top gainers */}
      <div className="grid gap-4 md:grid-cols-3">
        {gainers.map((g) => {
          const up = g.chg >= 0;
          return (
            <Link key={g.code} to="/stocks/$code" params={{ code: g.code }}>
              <Card className="border-border/60 bg-card-gradient transition-all hover:border-primary/50 hover:shadow-glow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-display text-2xl font-bold">{g.code}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[100px]">
                        {g.name}
                      </div>
                    </div>

                    {/* Persentase dijadikan highlight utama */}
                    <div className={`text-right ${up ? "text-bull" : "text-bear"}`}>
                      <div className="font-display text-xl font-bold">
                        {up ? "+" : ""}
                        {g.chg.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    {/* Harga terakhir */}
                    <div className="font-display text-lg">{g.p!.last.toLocaleString("id-ID")}</div>

                    {/* Nominal Rupiah dibuat kecil di bawah */}
                    <div className={`text-s font-medium ${up ? "text-bull" : "text-bear"}`}>
                      {up ? "+" : ""}
                      {g.nominalChg.toLocaleString("id-ID")}
                    </div>
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

                  {/* Klik untuk urutkan harga */}
                  <th
                    className="px-3 py-3 text-right cursor-pointer hover:text-primary"
                    onClick={() =>
                      setSortConfig({
                        key: "last",
                        direction:
                          sortConfig.key === "last" && sortConfig.direction === "desc"
                            ? "asc"
                            : "desc",
                      })
                    }
                  >
                    Harga{" "}
                    {sortConfig.key === "last" ? (sortConfig.direction === "desc" ? "▼" : "▲") : ""}
                  </th>

                  {/* Klik untuk urutkan persentase */}
                  <th
                    className="px-3 py-3 text-right cursor-pointer hover:text-primary"
                    onClick={() =>
                      setSortConfig({
                        key: "chg",
                        direction:
                          sortConfig.key === "chg" && sortConfig.direction === "desc"
                            ? "asc"
                            : "desc",
                      })
                    }
                  >
                    Change{" "}
                    {sortConfig.key === "chg" ? (sortConfig.direction === "desc" ? "▼" : "▲") : ""}
                  </th>

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
                        {p ? `${p.last.toLocaleString("id-ID")}` : "—"}
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
