import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio, TrendingUp } from "lucide-react";
import React from "react";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/signals")({ component: SignalsPage });

function SignalsPage() {
  const marketStatus = React.useMemo(() => {
    const now = new Date();
    const wibHours = (now.getUTCHours() + 7) % 24;
    const wibMinutes = now.getUTCMinutes();
    const currentTime = wibHours * 60 + wibMinutes;

    const openTime = 8 * 60 + 30; // 08:30

    // LOGIKA BARU:
    // 1. Jika sudah jam 08.30 sampai 23.59 = SINYAL HARI INI
    // 2. Jika masih dini hari (00.00 - 08.29) = MENUNGGU UPDATE PAGI
    if (currentTime >= openTime) return "TODAY";
    return "WAITING";
  }, []);

  const isMarketReady = marketStatus === "TODAY";

  const { data: signals = [], isLoading } = useQuery({
    queryKey: ["signals-dynamic"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_trading_signals");
      if (error) throw error;
      return data ?? [];
    },
    enabled: true,
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
        {marketStatus === "WAITING" ? (
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
              // SAAT DINI HARI: Tampilkan pesan informatif, daftar saham disembunyikan
              <div className="py-12 text-center">
                <AlertTriangle className="h-10 w-10 text-amber-500/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Pasar tutup. Daftar saham akan tersedia kembali setelah sistem selesai melakukan
                  screening pagi hari.
                </p>
              </div>
            ) : displayedSignals.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Belum ada sinyal yang memenuhi kriteria saat ini.
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
