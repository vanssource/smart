import { AlertTriangle } from "lucide-react";

export function SiteDisclaimer() {
  return (
    <section className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="relative overflow-hidden rounded-2xl border-l-4 border-amber-500/80 bg-amber-500/5 p-6 md:p-8">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-amber-500">
              Disclaimer & Regulatory Compliance
            </h3>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">
              Aplikasi ini bukan platform rekomendasi saham untuk beli/jual, melainkan AI stock screening &amp; risk monitoring platform.
            </span>{" "}
            Seluruh keputusan investasi atau transaksi di pasar modal adalah tanggung jawab pribadi pengguna secara penuh.
            Hasil screening, skor teknikal/flow, dan indikator yang ditampilkan hanyalah hasil pemrosesan algoritma data historis
            dan bukan merupakan ajakan, perintah, atau saran finansial dari pihak pengembang atau OJK. Trading saham mengandung
            risiko kerugian — lakukan riset mandiri sebelum mengambil keputusan.
          </p>
        </div>
      </div>
    </section>
  );
}
