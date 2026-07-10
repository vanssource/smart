import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react"; // Tambahkan baris ini
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/stocks/$code")({ component: StockDetail });

function StockDetail() {
  const { code } = useParams({ from: "/_authenticated/stocks/$code" });
  const [range, setRange] = useState<"3D" | "7D" | "14D" | "1M" | "3M" | "6M" | "1Y">("1Y");

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("profiles")
        .select("tier")
        .eq("id", u.user!.id)
        .maybeSingle();
      return data;
    },
  });

  // Ganti bagian query 'stock' di StockDetail
  const { data: stock } = useQuery({
    queryKey: ["stock", code],
    queryFn: async () => {
      // Kita ambil data dari view agar punya akses ke prev_close yang benar
      const { data } = await supabase
        .from("view_stock_dashboard")
        .select("*")
        .eq("code", code)
        .maybeSingle();
      return data;
    },
  });

  const { data: prices = [] } = useQuery({
    queryKey: ["prices", code],
    queryFn: async () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const { data } = await supabase
        .from("stock_prices")
        .select("date, open, high, low, close, volume")
        .eq("code", code)
        .gte("date", oneYearAgo.toISOString().split("T")[0])
        .order("date", { ascending: true });

      return (data ?? []).map((r) => ({
        ...r,
        close: Number(r.close),
        open: Number(r.open),
        high: Number(r.high),
        low: Number(r.low),
      }));
    },
  });

  const { data: indicators } = useQuery({
    queryKey: ["indicators", code],
    queryFn: async () => {
      const { data } = await supabase
        .from("stock_indicators")
        .select("*")
        .eq("code", code)
        .maybeSingle();
      return data;
    },
  });

  const { data: signal } = useQuery({
    queryKey: ["signal-latest", code],
    queryFn: async () => {
      const { data } = await supabase
        .from("signals")
        .select("*")
        .eq("code", code)
        .order("signal_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // Tambahkan query ini di dalam komponen StockDetail
  const { data: livePrice } = useQuery({
    queryKey: ["live-price", code],
    queryFn: async () => {
      const { data } = await supabase
        .from("realtime_price")
        .select("price")
        .eq("code", code)
        .single();
      return data?.price ?? 0;
    },
    refetchInterval: 5000, // Auto-refresh harga setiap 5 detik agar selalu real-time
  });

  // 1. Fungsi helper (taruh di atas sebelum komponen atau di dalam komponen)
  const calculateChange = (last: number, prev: number) => {
    const l = Number(last);
    const p = Number(prev);

    // Jika tidak ada data pembanding, jangan hitung
    if (!p || p === 0) return 0;

    return ((l - p) / p) * 100;
  };

  // Ganti bagian perhitungan di dalam StockDetail ini:

  // 2. Tentukan data harga
  const lastHistory = prices[prices.length - 1]; // Data terakhir (biasanya penutupan terakhir)
  const penutupanKemarin = prices[prices.length - 2]; // Data hari sebelumnya

  // Di dalam StockDetail, ganti bagian perhitungan harga:

  // 1. Harga Terakhir (Live atau dari database)
  const last = livePrice > 0 ? livePrice : (stock?.last_price ?? 0);

  // 2. Harga Penutupan Kemarin (Ambil langsung dari database, bukan tebak dari array)
  const prevClose = stock?.prev_close ?? 0;

  // 3. Hitung persentase (Fungsi calculateChange tetap sama)
  const chg = calculateChange(last, prevClose);
  const up = chg >= 0;

  // 4. Status Premium
  const isPremium = profile?.tier === "premium";
  // const last = livePrice > 0 ? livePrice : (prices[prices.length - 1]?.close ?? 0);
  // const prev = prices[prices.length - 2]?.close ?? last;
  // const chg = calculateChange(currentPrice, prevClose);
  // const up = chg >= 0;

  const getPriceLabel = () => {
    const hours = new Date().getHours();

    // Logika testing:
    // Paksa jadi "Harga Penutupan" jika jam saat ini adalah 00:52 (hanya untuk tes)
    // Atau gunakan logika bursa yang benar:
    const isMarketOpen = hours >= 9 && hours < 17;

    // console.log("Jam sekarang:", hours); // Lihat ini di inspect element console

    return isMarketOpen ? "Harga Sekarang" : "Harga Penutupan";
  };

  // Ganti bagian useMemo atau buat useMemo ini di dalam StockDetail
  const chartData = useMemo(() => {
    const data = [...prices];
    if (livePrice > 0) {
      data.push({
        date: new Date().toISOString().split("T")[0],
        close: livePrice,
        isLive: true, // Flag penting untuk mendeteksi data live
      });
    }
    return data;
  }, [prices, livePrice]);

  if (stock?.is_premium && !isPremium) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="border-gold/40 bg-card-gradient">
          <CardContent className="p-10 text-center">
            <Lock className="mx-auto h-10 w-10 text-gold" />
            <h2 className="mt-4 font-display text-2xl font-bold">Saham Premium</h2>
            <p className="mt-2 text-muted-foreground">
              {code} tersedia untuk member Premium. Upgrade untuk akses seluruh saham IDX + sinyal
              premium.
            </p>
            <Link to="/pricing">
              <Button className="mt-6 bg-gold text-black hover:bg-gold/90">Upgrade Sekarang</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredPrices = useMemo(() => {
    const data = [...prices];
    if (data.length === 0) return [];

    const now = new Date();
    let cutoffDate = new Date();

    switch (range) {
      case "3D":
        cutoffDate.setDate(now.getDate() - 3);
        break;
      case "7D":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "14D":
        cutoffDate.setDate(now.getDate() - 14);
        break;
      case "1M":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "3M":
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case "6M":
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case "1Y":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const filtered = data.filter((d) => new Date(d.date) >= cutoffDate);

    if (livePrice > 0) {
      filtered.push({
        date: new Date().toISOString().split("T")[0],
        close: livePrice,
        isLive: true,
      });
    }
    return filtered;
  }, [prices, range, livePrice]);

  // 3. Hitung persentase dan nominal Rupiah
  const nominalChange = last - prevClose; // Tambahkan ini

  return (
    <div className="space-y-6">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        {/* Bagian kiri: Kode Saham & Nama */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl font-bold">{code}</h1>
            {stock?.is_premium && <Badge className="bg-gold/20 text-gold">PRO</Badge>}
          </div>
          <p className="mt-1 text-muted-foreground">
            {stock?.name} • {stock?.sector}
          </p>
        </div>

        {/* BAGIAN HEADER (Tampilan Harga Baru) */}
        <div className="text-left md:text-right w-full md:w-auto">
          {/* Fungsi getPriceLabel akan menentukan apakah muncul "Harga Sekarang" atau "Harga Penutupan" */}
          <div className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
            {getPriceLabel()}
          </div>

          <div className="font-display text-4xl font-bold mt-1">{last.toLocaleString("id-ID")}</div>

          {/* Tampilan Perubahan (Rupiah + Persen) */}
          <div
            className={`mt-2 flex items-center justify-start md:justify-end gap-3 font-semibold ${up ? "text-bull" : "text-bear"}`}
          >
            <span className="flex items-center gap-1 text-sm">
              {up ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {up ? "+" : ""}
              {Math.abs(nominalChange).toLocaleString("id-ID")}
            </span>

            <span className="text-sm opacity-90">({chg.toFixed(2)}%)</span>
          </div>
        </div>
      </div>

      {/* Signal card */}
      {signal && (
        <Card
          className={`border-2 ${signal.signal === "buy" ? "border-bull/50" : signal.signal === "sell" ? "border-bear/50" : "border-border"} bg-card-gradient`}
        >
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Sinyal hari ini</div>
              <div
                className={`mt-1 font-display text-2xl font-bold ${
                  signal.signal === "buy"
                    ? "text-bull"
                    : signal.signal === "sell"
                      ? "text-bear"
                      : "text-foreground"
                }`}
              >
                {signal.signal.toUpperCase()}
              </div>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">{signal.reason}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Target</div>
                <div className="font-mono font-semibold text-bull">
                  {Number(signal.target_price).toLocaleString("id-ID")}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Stop Loss</div>
                <div className="font-mono font-semibold text-bear">
                  {Number(signal.stop_loss).toLocaleString("id-ID")}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Confidence</div>
                <div className="font-mono font-semibold">
                  {Math.round(Number(signal.confidence) * 100)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      <Card className="border-border/60 bg-card-gradient">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-display text-lg">Chart Harga</CardTitle>
          <div className="flex gap-1 rounded-md border p-1">
            {["3D", "7D", "14D", "1M", "3M", "6M", "1Y"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r as any)}
                className={`px-3 py-1 text-xs font-medium rounded-sm ${
                  range === r ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer>
              <AreaChart data={filteredPrices}>
                {" "}
                {/* Gunakan filteredPrices */}
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--bull)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--bull)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  minTickGap={40}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  domain={["auto", "auto"]}
                  width={57}
                  dx={-10}
                  tickFormatter={(v) => v.toLocaleString("id-ID")}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [` ${v.toLocaleString("id-ID")}`, "Price"]}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke="var(--bull)"
                  strokeWidth={2}
                  fill="url(#g1)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Indicators */}
      <div>
        <h2 className="font-display text-xl font-semibold">Indikator Teknikal</h2>
        {indicators ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <IndCard
              label="RSI (14)"
              value={indicators.rsi14}
              tone={rsiTone(Number(indicators.rsi14))}
              hint={rsiHint(Number(indicators.rsi14))}
            />
            <IndCard
              label="MACD"
              value={indicators.macd}
              tone={Number(indicators.macd_hist) >= 0 ? "bull" : "bear"}
              hint={Number(indicators.macd_hist) >= 0 ? "Momentum positif" : "Momentum negatif"}
            />
            <IndCard
              label="SMA 20"
              value={indicators.sma20}
              hint={last > Number(indicators.sma20) ? "Di atas MA20" : "Di bawah MA20"}
              tone={last > Number(indicators.sma20) ? "bull" : "bear"}
            />
            <IndCard
              label="SMA 50"
              value={indicators.sma50}
              hint={
                last > Number(indicators.sma50) ? "Uptrend jk. menengah" : "Downtrend jk. menengah"
              }
              tone={last > Number(indicators.sma50) ? "bull" : "bear"}
            />
            <IndCard
              label="SMA 200"
              value={indicators.sma200}
              hint={
                last > Number(indicators.sma200) ? "Bullish jk. panjang" : "Bearish jk. panjang"
              }
              tone={last > Number(indicators.sma200) ? "bull" : "bear"}
            />
            <IndCard label="Bollinger Upper" value={indicators.bb_upper} />
            <IndCard label="Bollinger Lower" value={indicators.bb_lower} />
            <IndCard label="ATR" value={indicators.atr} hint="Volatilitas rata-rata" />
            <IndCard
              label="Stochastic %K"
              value={indicators.stoch_k}
              tone={
                Number(indicators.stoch_k) > 80
                  ? "bear"
                  : Number(indicators.stoch_k) < 20
                    ? "bull"
                    : "neutral"
              }
            />
            <IndCard label="Stochastic %D" value={indicators.stoch_d} />
            <IndCard
              label="ADX"
              value={indicators.adx}
              hint={Number(indicators.adx) > 25 ? "Trend kuat" : "Trend lemah"}
            />
            <IndCard
              label="EMA 12 / 26"
              value={`${Number(indicators.ema12).toFixed(0)} / ${Number(indicators.ema26).toFixed(0)}`}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Belum ada snapshot indikator. Worker Python akan mengisinya.
          </p>
        )}
      </div>
    </div>
  );
}

function rsiTone(v: number): "bull" | "bear" | "neutral" {
  if (v >= 70) return "bear";
  if (v <= 30) return "bull";
  return "neutral";
}
function rsiHint(v: number) {
  if (v >= 70) return "Overbought";
  if (v <= 30) return "Oversold";
  return "Netral";
}

function IndCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: unknown;
  hint?: string;
  tone?: "bull" | "bear" | "neutral";
}) {
  const toneClass =
    tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : "text-foreground";
  return (
    <div className="rounded-xl border border-border/60 bg-card-gradient p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-xl font-semibold ${toneClass}`}>
        {value == null ? "—" : typeof value === "number" ? value.toFixed(2) : String(value)}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
