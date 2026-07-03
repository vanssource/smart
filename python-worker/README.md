# SahamSmart Python Worker

Worker eksternal untuk **scraping Yahoo Finance**, **menghitung indikator
teknikal**, **menyimpan ke Supabase**, dan **mengirim sinyal ke Telegram**
setiap hari jam 08:45 WIB.

> Runtime Lovable (Cloudflare Worker) tidak bisa menjalankan Python/pandas,
> jadi worker ini di-host di VPS / Railway / Fly.io / GitHub Actions kamu.

## Install

```bash
pip install yfinance pandas pandas-ta supabase python-telegram-bot requests
```

## Environment Variables

```bash
export SUPABASE_URL="https://<project-ref>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"   # dari Lovable Cloud → View Backend → API Keys
export TELEGRAM_BOT_TOKEN="123456:ABC..."               # dari @BotFather
export TELEGRAM_CHAT_ID="-1001234567890"                # id grup/channel target
```

## Isi tabel `stocks` dengan seluruh saham IDX

Sebelum menjalankan worker untuk pertama kali, isi tabel `stocks` dengan
seluruh kode IDX (± 800 saham) yang mau dipantau. Contoh SQL:

```sql
INSERT INTO stocks (code, name, sector) VALUES
  ('WSKT', 'Waskita Karya', 'Konstruksi'),
  ('BRIS', 'Bank Syariah Indonesia', 'Perbankan'),
  ...
ON CONFLICT (code) DO NOTHING;
```

## Jalankan manual

```bash
python scraper.py
```

## Jadwalkan setiap hari trading jam 08:45 WIB

### Opsi A — cron (Linux VPS)

`/etc/cron.d/sahamsmart` (server timezone = Asia/Jakarta):

```
45 8 * * 1-5 root cd /opt/sahamsmart && /usr/bin/python3 scraper.py >> /var/log/sahamsmart.log 2>&1
```

### Opsi B — GitHub Actions

`.github/workflows/daily-signal.yml`:

```yaml
name: Daily Signal
on:
  schedule:
    - cron: "45 1 * * 1-5"   # 08:45 WIB = 01:45 UTC
  workflow_dispatch:
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.11" }
      - run: pip install yfinance pandas pandas-ta supabase python-telegram-bot requests
      - run: python python-worker/scraper.py
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
```

### Opsi C — Railway / Fly.io

Deploy folder ini sebagai worker service dan gunakan built-in scheduler
(`railway.toml` / `fly.toml`) dengan cron `45 1 * * 1-5` (UTC).

## Indikator yang dihitung

RSI(14), MACD(12,26,9), Bollinger(20,2), SMA(20/50/200), EMA(12/26),
Stochastic(14,3,3), ADX(14), ATR(14).

## Logika sinyal

Confluence sederhana (skor −3..+3):
- RSI < 30 → +1, RSI > 70 → −1
- MACD histogram positif → +1, negatif → −1
- Close > SMA20 > SMA50 → +1, sebaliknya → −1

Skor ≥ +2 → **BUY**, ≤ −2 → **SELL**, selebihnya **HOLD**. Target price &
stop loss dihitung berbasis ATR.

Silakan tuning `generate_signal()` sesuai strategi kamu.
