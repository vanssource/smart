import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, BarChart3, Bell, LineChart, Radio, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteDisclaimer } from "@/components/site-disclaimer";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "SahamSmart — Analisa Saham IDX dengan Indikator Teknikal" },
      { name: "description", content: "Sinyal beli-jual harian, indikator teknikal lengkap (RSI, MACD, Bollinger), watchlist personal, dan notifikasi Telegram." },
    ],
  }),
});

const features = [
  { icon: LineChart, title: "Chart Harga Real-time", desc: "Data harga harian seluruh saham IDX dari Yahoo Finance, langsung dari database." },
  { icon: Activity, title: "Indikator Teknikal Akurat", desc: "RSI, MACD, Bollinger Bands, Stochastic, ADX, ATR — dihitung dengan pandas-ta." },
  { icon: Radio, title: "Sinyal Harian 08:45 WIB", desc: "Notifikasi Telegram otomatis setiap pagi sebelum bursa buka." },
  { icon: BarChart3, title: "Watchlist Personal", desc: "Pantau saham favoritmu dan dapatkan snapshot indikator dalam satu klik." },
  { icon: ShieldCheck, title: "Free & Premium Tier", desc: "Mulai gratis dengan 10 saham blue-chip. Upgrade untuk akses seluruh IDX + sinyal premium." },
  { icon: Sparkles, title: "AI-Assisted Analysis", desc: "Rekomendasi beli/jual dengan target price dan stop loss berbasis confluence indikator." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-hero text-foreground">
      {/* Nav */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary shadow-glow">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-semibold">SahamSmart</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth"><Button variant="ghost">Masuk</Button></Link>
          <Link to="/auth"><Button className="shadow-glow">Mulai Gratis</Button></Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 grid-lines opacity-30" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <Bell className="h-3.5 w-3.5 text-primary" /> Sinyal harian dikirim otomatis ke Telegram jam 08:45 WIB
          </div>
          <h1 className="mt-6 font-display text-5xl font-bold leading-tight md:text-7xl">
            Analisa Saham IDX <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Cerdas & Otomatis</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Semua indikator teknikal yang kamu butuhkan dalam satu dashboard. Data langsung dari Yahoo Finance,
            dihitung dengan Python, dan disajikan real-time.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/auth"><Button size="lg" className="shadow-glow">Mulai Analisa Gratis</Button></Link>
            <Link to="/auth"><Button size="lg" variant="outline">Lihat Demo Dashboard</Button></Link>
          </div>
          <div className="mt-16 grid grid-cols-3 gap-6 text-left md:grid-cols-3">
            {[
              { k: "800+", v: "Saham IDX" },
              { k: "12+", v: "Indikator Teknikal" },
              { k: "08:45", v: "Sinyal Telegram Harian" },
            ].map((s) => (
              <div key={s.v} className="rounded-2xl border border-border bg-card-gradient p-6 backdrop-blur">
                <div className="font-display text-3xl font-bold text-primary">{s.k}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="font-display text-3xl font-bold md:text-4xl">Semua yang trader butuhkan</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">Dari data mentah sampai keputusan trading, semua sudah otomatis.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-border bg-card-gradient p-6 transition-all hover:border-primary/50 hover:shadow-glow">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-card-gradient p-10 text-center shadow-glow md:p-16">
          <div className="absolute inset-0 grid-lines opacity-20" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold md:text-5xl">Siap trading lebih cerdas?</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Daftar gratis. Tanpa kartu kredit. Upgrade kapan saja untuk akses seluruh IDX & sinyal premium.
            </p>
            <Link to="/auth"><Button size="lg" className="mt-8 shadow-glow">Buat Akun Gratis</Button></Link>
          </div>
        </div>
      </section>

      <SiteDisclaimer />

      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} SahamSmart. Analisa saham IDX cerdas.
        </div>
      </footer>
    </div>
  );
}
