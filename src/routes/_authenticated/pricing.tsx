import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/pricing")({ component: Pricing });

const plans = [
  {
    name: "Free", price: "Rp 0", period: "/selamanya",
    features: ["10 saham blue-chip", "Indikator dasar (RSI, MACD, SMA)", "Sinyal harian saham free", "Watchlist personal"],
    cta: "Paket Saat Ini", disabled: true,
  },
  {
    name: "Premium", price: "Rp 99.000", period: "/bulan", featured: true,
    features: ["Seluruh 800+ saham IDX", "Semua indikator (Bollinger, Stochastic, ADX, ATR)", "Sinyal premium eksklusif", "Notifikasi Telegram prioritas", "Backtest & alert kustom"],
    cta: "Upgrade Sekarang",
  },
];

function Pricing() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs">
          <Sparkles className="h-3.5 w-3.5 text-gold" /> Upgrade untuk analisa lengkap
        </div>
        <h1 className="mt-4 font-display text-4xl font-bold">Pilih paket yang cocok</h1>
        <p className="mt-2 text-muted-foreground">Mulai gratis, upgrade kapan saja.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((p) => (
          <Card key={p.name} className={`relative border-border/60 bg-card-gradient ${p.featured ? "border-gold/50 shadow-glow" : ""}`}>
            {p.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-black">
                PALING POPULER
              </div>
            )}
            <CardHeader>
              <CardTitle className="font-display text-2xl">{p.name}</CardTitle>
              <div className="mt-2">
                <span className="font-display text-4xl font-bold">{p.price}</span>
                <span className="text-muted-foreground">{p.period}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`mt-0.5 h-4 w-4 flex-shrink-0 ${p.featured ? "text-gold" : "text-primary"}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`mt-6 w-full ${p.featured ? "bg-gold text-black hover:bg-gold/90" : ""}`}
                variant={p.featured ? "default" : "outline"}
                disabled={p.disabled}
              >
                {p.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
