"""Confluence features. Raw prints are not enough."""
from __future__ import annotations
import numpy as np
import pandas as pd

def rsi(close: pd.Series, n: int = 14) -> pd.Series:
    d = close.diff()
    up = d.clip(lower=0).ewm(alpha=1 / n, adjust=False).mean()
    dn = (-d.clip(upper=0)).ewm(alpha=1 / n, adjust=False).mean()
    rs = up / dn.replace(0, np.nan)
    return 100 - (100 / (1 + rs))

def macd_hist(close: pd.Series) -> pd.Series:
    ema12 = close.ewm(span=12, adjust=False).mean()
    ema26 = close.ewm(span=26, adjust=False).mean()
    macd = ema12 - ema26
    return macd - macd.ewm(span=9, adjust=False).mean()

def add_technicals(df: pd.DataFrame) -> pd.DataFrame:
    o, h, l, c = df["Open"], df["High"], df["Low"], df["Close"]
    body = (c - o).abs()
    rng = (h - l).replace(0, np.nan)
    prev_o, prev_c = o.shift(1), c.shift(1)
    out = df.copy()
    out["bull_engulf"] = ((c > o) & (prev_c < prev_o) & (c >= prev_o) & (o <= prev_c)).astype(int)
    out["bear_engulf"] = ((c < o) & (prev_c > prev_o) & (c <= prev_o) & (o >= prev_c)).astype(int)
    out["doji"] = (body / rng < 0.12).astype(int)
    lower = np.minimum(o, c) - l
    out["hammer"] = ((lower > 2 * body) & ((h - np.maximum(o, c)) < body)).astype(int)
    out["sma20"] = out["Close"].rolling(20).mean()
    out["sma50"] = out["Close"].rolling(50).mean()
    out["rsi14"] = rsi(out["Close"])
    out["macd_h"] = macd_hist(out["Close"])
    out["breakout"] = (out["Close"] > out["sma20"]) & (out["sma20"] > out["sma50"])
    out["rsi_os"] = (out["rsi14"] < 32).astype(int)
    out["rsi_ob"] = (out["rsi14"] > 68).astype(int)
    return out

def add_confluence(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    for col, default in {"insider_buy":0.0,"insider_sell":0.0,"news":0.0,"hype":0.0,"macro_bull":0.0,"eightk":0.0}.items():
        if col not in out:
            out[col] = default
    out["Insider_Buy_x_News_Sentiment"] = out["insider_buy"] * out["news"].clip(lower=0)
    out["RSI_Oversold_x_Retail_Hype"] = out["rsi_os"] * out["hype"]
    out["Macro_Bullish_x_Technical_Breakout"] = out["macro_bull"] * out["breakout"].astype(int)
    out["Sell_x_Weak_Tape"] = out["insider_sell"] * (~out["breakout"]).astype(int)
    out["Filing_x_Breakout"] = (out["eightk"] > 0).astype(int) * out["breakout"].astype(int)
    out["confluence"] = (
        18 * out["Insider_Buy_x_News_Sentiment"].clip(0, 3)
        + 14 * out["Macro_Bullish_x_Technical_Breakout"]
        + 10 * out["Filing_x_Breakout"]
        + 8 * out["breakout"].astype(int)
        + 6 * (out["rsi14"].fillna(50) / 100)
        - 16 * out["Sell_x_Weak_Tape"].clip(0, 3)
        - 8 * out["rsi_ob"]
    ).clip(0, 100)
    return out

def label_forward(df: pd.DataFrame, horizon: int = 5, hurdle: float = 0.012) -> pd.Series:
    fwd = df["Close"].shift(-horizon) / df["Close"] - 1
    return (fwd > hurdle).astype(int)
