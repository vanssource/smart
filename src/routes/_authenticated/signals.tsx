import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio } from "lucide-react";
import React from "react";

export const Route = createFileRoute("/_authenticated/signals")({ component: SignalsPage });

function SignalsPage() {
  // Ganti dari .from("signals") ke .rpc('get_trading_signals')
  const { data: signals = [] } = useQuery({
    queryKey: ["signals-dynamic"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_trading_signals");
      if (error) {
        console.error("RPC Error:", error); // Lihat error spesifik di sini
        throw error;
      }
      console.log("Data diterima React:", data); // Lihat apakah data masuk ke sini
      return data ?? [];
    },
  });

  const uniqueSignals = React.useMemo(() => {
    const seen = new Set();
    return signals.filter((s) => {
      if (seen.has(s.code)) return false;
      seen.add(s.code);
      return true;
    });
  }, [signals]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
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

      <Card className="border-border/60 bg-card-gradient">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            Semua Sinyal ({uniqueSignals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {uniqueSignals.map((s) => {
              const tone = s.signal === "buy" ? "bull" : s.signal === "sell" ? "bear" : "muted";
              return (
                <Link key={s.id} to="/stocks/$code" params={{ code: s.code }}>
                  <div
                    className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 transition-all hover:shadow-glow ${
                      tone === "bull"
                        ? "border-bull/40 hover:border-bull"
                        : tone === "bear"
                          ? "border-bear/40 hover:border-bear"
                          : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`grid h-12 w-12 place-items-center rounded-lg font-display text-xs font-bold ${
                          tone === "bull"
                            ? "bg-bull/20 text-bull"
                            : tone === "bear"
                              ? "bg-bear/20 text-bear"
                              : "bg-secondary"
                        }`}
                      >
                        {s.signal.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-lg font-bold">{s.code}</span>
                          {s.is_premium && <Badge className="bg-gold/20 text-gold">PRO</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">{s.reason}</div>
                      </div>
                    </div>
                    <div className="flex gap-6 text-xs">
                      <div>
                        <div className="text-muted-foreground">Target</div>
                        <div className="font-mono text-bull">
                          {Number(s.target_price).toLocaleString("id-ID")}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Stop</div>
                        <div className="font-mono text-bear">
                          {Number(s.stop_loss).toLocaleString("id-ID")}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Confidence</div>
                        <div className="font-mono">{Math.round(Number(s.confidence) * 100)}%</div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
            {uniqueSignals.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Belum ada sinyal. Worker Python akan mengirim sinyal jam 08:45 WIB.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
