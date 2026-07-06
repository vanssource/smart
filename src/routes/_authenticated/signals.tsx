import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio } from "lucide-react";
import React from "react";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/signals")({ component: SignalsPage });

function SignalsPage() {
  // 1. Cek apakah sudah jam 08:30 WIB
  const isMarketReady = React.useMemo(() => {
    const now = new Date();
    // Menggunakan getUTCHours() + 7 untuk WIB
    const wibHours = (now.getUTCHours() + 7) % 24;
    const wibMinutes = now.getUTCMinutes();
    return wibHours > 8 || (wibHours === 8 && wibMinutes >= 30);
  }, []);

  const { data: signals = [], isLoading } = useQuery({
    queryKey: ["signals-dynamic"],
    queryFn: async () => {
      // Jangan fetch jika belum jam 08:30
      if (!isMarketReady) return [];
      const { data, error } = await supabase.rpc("get_trading_signals");
      if (error) throw error;
      return data ?? [];
    },
    enabled: isMarketReady, // Query hanya jalan kalau sudah jam 08:30
  });

  const uniqueSignals = React.useMemo(() => {
    const seen = new Set();
    return signals.filter((s) => {
      if (seen.has(s.code)) return false;
      seen.add(s.code);
      return true;
    });
  }, [signals]);

  // Di dalam fungsi SignalsPage, saat memproses data:
  const displayedSignals = React.useMemo(() => {
    // 1. Ambil unique signals
    const seen = new Set();
    const filtered = signals.filter((s) => {
      if (seen.has(s.code)) return false;
      seen.add(s.code);
      return true;
    });

    // 2. Potong jadi 10 saja
    return filtered.slice(0, 10);
  }, [signals]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="order-2 md:order-1 flex items-center gap-3 md:mt-11">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Sinyal Harian</h1>
            <p className="text-sm text-muted-foreground">
              Rekomendasi otomatis berbasis confluence indikator teknikal.
            </p>
          </div>
        </div>

        <div className="order-1 md:order-2 w-full max-w-[400px] rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-sm">
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
      </div>

      <Card className="border-border/60 bg-card-gradient">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            Strong Recommendation ({uniqueSignals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {isLoading ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Memuat data...</p>
            ) : !isMarketReady ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Pasar belum buka. Sinyal harian akan tersedia pada pukul 08:30 WIB.
              </p>
            ) : uniqueSignals.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Belum ada sinyal yang memenuhi kriteria saat ini.
              </p>
            ) : (
              uniqueSignals.map((s) => {
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
