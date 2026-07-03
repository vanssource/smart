"""
SahamSmart Python Worker
------------------------
Scraping harga harian saham IDX dari Yahoo Finance, menghitung indikator
teknikal (RSI, MACD, Bollinger, SMA, EMA, Stochastic, ADX, ATR), menyimpan
ke Supabase, lalu mengirim sinyal ke grup Telegram.

Jadwalkan via cron/systemd/Railway/Fly.io setiap hari trading jam 08:45 WIB.

Install:
    pip install yfinance pandas pandas-ta supabase python-telegram-bot requests

Env vars yang dibutuhkan:
    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY   # service role — jangan pernah expose ke frontend
    TELEGRAM_BOT_TOKEN
    TELEGRAM_CHAT_ID            # id grup / channel target sinyal
"""

from __future__ import annotations

import os
import time
from datetime import datetime, timezone

import pandas as pd
import pandas_ta as ta
import requests
import yfinance as yf
from supabase import Client, create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
TG_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
TG_CHAT = os.environ.get("TELEGRAM_CHAT_ID")

sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def load_stocks() -> list[dict]:
    """Ambil daftar saham dari tabel `stocks`. Isi tabel dulu dengan seluruh
    kode IDX yang mau dipantau (misal 800+ saham)."""
    res = sb.table("stocks").select("code, is_premium").execute()
    return res.data or []


def fetch_prices(code: str, period: str = "1y") -> pd.DataFrame:
    """yfinance memakai suffix .JK untuk saham IDX."""
    ticker = yf.Ticker(f"{code}.JK")
    df = ticker.history(period=period, auto_adjust=False)
    df = df.rename(columns=str.lower)
    df.index = df.index.tz_localize(None) if df.index.tz else df.index
    return df


def upsert_prices(code: str, df: pd.DataFrame) -> int:
    if df.empty:
        return 0
    rows = [
        {
            "code": code,
            "date": d.strftime("%Y-%m-%d"),
            "open": float(r["open"]),
            "high": float(r["high"]),
            "low": float(r["low"]),
            "close": float(r["close"]),
            "volume": int(r["volume"]) if pd.notna(r["volume"]) else None,
        }
        for d, r in df.iterrows()
        if pd.notna(r["close"])
    ]
    # upsert bertahap untuk hindari payload raksasa
    for i in range(0, len(rows), 500):
        sb.table("stock_prices").upsert(rows[i : i + 500], on_conflict="code,date").execute()
    return len(rows)


def compute_indicators(df: pd.DataFrame) -> dict | None:
    if len(df) < 30:
        return None
    close = df["close"]
    rsi = ta.rsi(close, length=14)
    macd = ta.macd(close, fast=12, slow=26, signal=9)
    bb = ta.bbands(close, length=20, std=2)
    stoch = ta.stoch(df["high"], df["low"], close, k=14, d=3)
    adx = ta.adx(df["high"], df["low"], close, length=14)
    atr = ta.atr(df["high"], df["low"], close, length=14)

    def last(s):
        return float(s.dropna().iloc[-1]) if s is not None and not s.dropna().empty else None

    return {
        "rsi14": last(rsi),
        "macd": last(macd["MACD_12_26_9"]) if macd is not None else None,
        "macd_signal": last(macd["MACDs_12_26_9"]) if macd is not None else None,
        "macd_hist": last(macd["MACDh_12_26_9"]) if macd is not None else None,
        "sma20": last(ta.sma(close, length=20)),
        "sma50": last(ta.sma(close, length=50)),
        "sma200": last(ta.sma(close, length=200)),
        "ema12": last(ta.ema(close, length=12)),
        "ema26": last(ta.ema(close, length=26)),
        "bb_upper": last(bb["BBU_20_2.0"]) if bb is not None else None,
        "bb_middle": last(bb["BBM_20_2.0"]) if bb is not None else None,
        "bb_lower": last(bb["BBL_20_2.0"]) if bb is not None else None,
        "stoch_k": last(stoch["STOCHk_14_3_3"]) if stoch is not None else None,
        "stoch_d": last(stoch["STOCHd_14_3_3"]) if stoch is not None else None,
        "adx": last(adx["ADX_14"]) if adx is not None else None,
        "atr": last(atr),
    }


def generate_signal(code: str, close: float, ind: dict) -> dict | None:
    """Confluence sederhana: skor -3..+3."""
    score = 0
    reasons = []

    if ind.get("rsi14") is not None:
        if ind["rsi14"] < 30:
            score += 1; reasons.append("RSI oversold")
        elif ind["rsi14"] > 70:
            score -= 1; reasons.append("RSI overbought")

    if ind.get("macd_hist") is not None:
        if ind["macd_hist"] > 0:
            score += 1; reasons.append("MACD histogram positif")
        else:
            score -= 1; reasons.append("MACD histogram negatif")

    if ind.get("sma20") and ind.get("sma50"):
        if close > ind["sma20"] > ind["sma50"]:
            score += 1; reasons.append("harga > SMA20 > SMA50")
        elif close < ind["sma20"] < ind["sma50"]:
            score -= 1; reasons.append("harga < SMA20 < SMA50")

    signal = "buy" if score >= 2 else "sell" if score <= -2 else "hold"
    atr = ind.get("atr") or (close * 0.02)
    return {
        "code": code,
        "signal_date": datetime.now(timezone.utc).date().isoformat(),
        "signal": signal,
        "reason": ", ".join(reasons) or "netral",
        "target_price": round(close + 2 * atr, 2) if signal == "buy" else round(close - 2 * atr, 2),
        "stop_loss": round(close - atr, 2) if signal == "buy" else round(close + atr, 2),
        "confidence": round(min(abs(score) / 3, 1.0), 2),
    }


def send_telegram(signals: list[dict]) -> None:
    if not (TG_TOKEN and TG_CHAT and signals):
        return
    buys = [s for s in signals if s["signal"] == "buy"]
    sells = [s for s in signals if s["signal"] == "sell"]
    lines = [f"📊 *SahamSmart · {datetime.now().strftime('%d %b %Y')}*", ""]
    if buys:
        lines.append("🟢 *BUY*")
        for s in buys[:10]:
            lines.append(f"• `{s['code']}` — target Rp {int(s['target_price']):,} · SL Rp {int(s['stop_loss']):,} · {int(s['confidence']*100)}%")
        lines.append("")
    if sells:
        lines.append("🔴 *SELL*")
        for s in sells[:10]:
            lines.append(f"• `{s['code']}` — SL Rp {int(s['stop_loss']):,} · {int(s['confidence']*100)}%")
    text = "\n".join(lines)
    requests.post(
        f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage",
        json={"chat_id": TG_CHAT, "text": text, "parse_mode": "Markdown"},
        timeout=15,
    )


def run() -> None:
    stocks = load_stocks()
    print(f"[worker] processing {len(stocks)} stocks")
    all_signals: list[dict] = []

    for i, s in enumerate(stocks, 1):
        code = s["code"]
        try:
            df = fetch_prices(code)
            upsert_prices(code, df)
            ind = compute_indicators(df)
            if ind is None:
                continue

            sb.table("stock_indicators").upsert({
                **ind,
                "code": code,
                "as_of": datetime.now(timezone.utc).date().isoformat(),
                "is_premium_indicator": bool(s.get("is_premium")),
            }, on_conflict="code").execute()

            last_close = float(df["close"].dropna().iloc[-1])
            sig = generate_signal(code, last_close, ind)
            if sig and sig["signal"] != "hold":
                sig["is_premium"] = bool(s.get("is_premium"))
                sb.table("signals").upsert(sig, on_conflict="code,signal_date").execute()
                all_signals.append(sig)

            print(f"[worker] {i}/{len(stocks)} {code} ok")
            time.sleep(0.3)  # ramah rate limit Yahoo
        except Exception as e:
            print(f"[worker] {code} error: {e}")

    send_telegram(all_signals)
    print(f"[worker] done — {len(all_signals)} signals sent")


if __name__ == "__main__":
    run()
