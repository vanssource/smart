import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio, TrendingUp } from "lucide-react";
import React from "react";
import { AlertTriangle, Clock3, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/_authenticated/signals")({ component: SignalsPage });

function SignalsPage() {
  const marketStatus = React.useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Minggu, 6 = Sabtu

    // Deteksi akhir pekan
    if (dayOfWeek === 0 || dayOfWeek === 6) return "WEEKEND";

    const wibHours = (now.getUTCHours() + 7) % 24;
    const wibMinutes = now.getUTCMinutes();
    const currentTime = wibHours * 60 + wibMinutes;

    const openTime = 8 * 60 + 30; // 08:30

    if (currentTime >= openTime) return "TODAY";
    return "WAITING";
  }, []);

  const isMarketReady = marketStatus === "TODAY";

  // Ganti bagian useQuery di SignalsPage:
  const { data: signals = [], isLoading } = useQuery({
    queryKey: ["signals-daily"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("latest_trading_signals")
        .select("*")
        .order("confidence", { ascending: false });

      if (error) throw error;

      return data ?? [];
    },
    enabled: isMarketReady,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const displayedSignals = React.useMemo(() => {
    const seen = new Set();
    return signals
      .filter((s) => {
        if (seen.has(s.code)) return false;
        seen.add(s.code);
        return true;
      })
      .slice(0, 10);
  }, [signals]);

  const lastUpdated = React.useMemo(() => {
    if (signals.length === 0) return null;
    const date = signals[0].created_at || signals[0].signal_date;
    return date
      ? new Date(date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      : null;
  }, [signals]);

  const Disclaimer = () => (
    <div className="w-full rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-8 w-8 shrink-0 text-amber-500/80" />
        <div className="text-sm leading-snug text-muted-foreground">
          <p className="mb-1 font-bold text-amber-600/90 uppercase tracking-wide">Penting:</p>
          <p className="italic">
            Hasil screening bukan ajakan beli/jual. Keputusan investasi adalah tanggung jawab
            pribadi.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 1. NOTIFIKASI STATUS (Selalu di atas) */}
      <div>
        {marketStatus === "WEEKEND" ? (
          <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400/40 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-orange-500/15 p-6 shadow-xl">
            {/* Background Decoration */}
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-yellow-300/10 blur-3xl" />

            <div className="relative flex items-start gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20">
                <AlertTriangle className="h-9 w-9 text-amber-400" />
              </div>

              <div className="flex-1">
                <div className="mb-2 inline-flex items-center rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
                  Bursa Tutup
                </div>

                <h2 className="text-2xl font-bold text-white">Bursa Efek Indonesia Sedang Libur</h2>

                <p className="mt-2 max-w-2xl text-base leading-7 text-slate-300">
                  Hari ini merupakan <span className="font-semibold text-white">akhir pekan</span>,
                  sehingga perdagangan saham tidak berlangsung. Seluruh sinyal harian akan
                  diperbarui kembali pada hari bursa berikutnya.
                </p>

                <div className="mt-5 inline-flex items-center rounded-xl border border-amber-400/30 bg-black/20 px-4 py-3">
                  <Clock3 className="mr-3 h-5 w-5 text-amber-300" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Jadwal Berikutnya
                    </p>
                    <p className="font-semibold text-white">Senin • 08:30 WIB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : marketStatus === "WAITING" ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 shadow-sm flex gap-4 items-start">
            <AlertTriangle className="h-6 w-6 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <p className="font-bold text-amber-500 text-lg">Sistem Screening Sedang Berjalan</p>
              <p className="text-sm text-amber-500/80 mt-1">
                Data pasar sedang diproses. Rekomendasi terbaru tersedia pukul{" "}
                <span className="font-bold">08:30 WIB</span>.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5 shadow-sm flex gap-4 items-start">
            <TrendingUp className="h-6 w-6 shrink-0 text-blue-400 mt-0.5" />
            <div>
              <p className="font-bold text-blue-400 text-lg">Update Sinyal Hari Ini</p>
              <p className="text-sm text-blue-100/70 mt-1">
                Algoritma kami telah memproses konfluensi indikator. Pantau pergerakan harga secara
                real-time.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer (Mobile Only) */}
      <div className="md:hidden">
        <Disclaimer />
      </div>

      {/* Header + Disclaimer Desktop */}
      <div className="mt-2 md:mt-0">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          {/* Judul */}
          <div className="flex items-center gap-3 md:pt-11">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Radio className="h-5 w-5" />
            </div>

            <div>
              <h1 className="font-display text-3xl font-bold">Sinyal Harian</h1>

              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Rekomendasi otomatis berbasis confluence indikator teknikal.
                </p>

                {lastUpdated && (
                  <Badge variant="outline" className="text-[10px] py-0">
                    Update: {lastUpdated} WIB
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Only */}
          <div className="hidden md:block md:max-w-[400px]">
            <Disclaimer />
          </div>
        </div>
      </div>

      <Card className="border-border/60 bg-card-gradient">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            {marketStatus === "WAITING" ? "Sinyal Saat Ini" : "Strong Recommendation"} (
            {marketStatus === "WAITING" ? 0 : displayedSignals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {isLoading ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Memuat data...</p>
            ) : marketStatus === "WAITING" ? (
              <div className="py-12 text-center">
                <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500/50" />
                <p className="text-sm text-muted-foreground">
                  Pasar tutup. Daftar saham akan tersedia kembali setelah sistem selesai melakukan
                  screening pagi hari pukul 08.30.
                </p>
              </div>
            ) : marketStatus === "WEEKEND" ? (
              <div className="py-12 text-center">
                <CalendarDays className="mx-auto mb-3 h-10 w-10 text-slate-500/60" />
                <p className="text-sm font-medium text-muted-foreground">
                  Bursa Efek Indonesia sedang libur akhir pekan.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Rekomendasi sinyal harian akan kembali diperbarui pada hari bursa berikutnya.
                </p>
              </div>
            ) : displayedSignals.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Belum ada saham yang memenuhi kriteria screening hari ini.
              </p>
            ) : (
              displayedSignals.map((s) => {
                const tone = s.signal === "buy" ? "bull" : s.signal === "sell" ? "bear" : "muted";
                return (
                  <Link key={s.id} to="/stocks/$code" params={{ code: s.code }}>
                    <div
                      className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 transition-all hover:shadow-glow ${
                        tone === "bull" ? "border-bull/40 hover:border-bull" : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display text-lg font-bold">{s.code}</span>
                            {s.is_premium && <Badge className="bg-gold/20 text-gold">PRO</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground">{s.reason}</div>
                        </div>
                      </div>

                      <div className="flex w-full justify-between gap-4 text-xs md:w-auto md:justify-start md:gap-6">
                        <div className="text-center md:text-left">
                          <div className="text-muted-foreground">Entry Range</div>
                          <div className="font-mono font-bold text-primary">
                            {Number(s.entry_low).toLocaleString("id-ID")} -{" "}
                            {Number(s.entry_high).toLocaleString("id-ID")}
                          </div>
                        </div>
                        <div className="text-center md:text-left">
                          <div className="text-muted-foreground">Target</div>
                          <div className="font-mono text-bull font-bold">
                            {Number(s.target_price).toLocaleString("id-ID")}
                          </div>
                        </div>
                        <div className="text-center md:text-left">
                          <div className="text-muted-foreground">Stop</div>
                          <div className="font-mono text-bear font-bold">
                            {Number(s.stop_loss).toLocaleString("id-ID")}
                          </div>
                        </div>
                        <div className="text-center md:text-left">
                          <div className="text-muted-foreground">Confidence</div>
                          <div className="font-mono font-bold">
                            {Math.round(Number(s.confidence))}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
