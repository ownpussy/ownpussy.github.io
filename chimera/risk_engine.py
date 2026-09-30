"""1% risk, limit-only, 3% daily kill. Paper by default."""
from __future__ import annotations
from dataclasses import dataclass

@dataclass
class RiskConfig:
    equity: float = 2000.0
    risk_pct: float = 0.01
    daily_kill_pct: float = 0.03
    stop_pct: float = 0.05
    paper: bool = True

def position_notional(cfg: RiskConfig, stop_pct: float | None = None) -> float:
    stop = stop_pct or cfg.stop_pct
    if stop <= 0:
        return 0.0
    return (cfg.equity * cfg.risk_pct) / stop

def shares_for(price: float, cfg: RiskConfig, stop_pct: float | None = None) -> float:
    if price <= 0:
        return 0.0
    return round(position_notional(cfg, stop_pct) / price, 6)

def limit_price(last: float, side: str, slack: float = 0.0015) -> float:
    if side == "buy":
        return round(last * (1 - slack), 4)
    return round(last * (1 + slack), 4)

def kill_switch(equity_now: float, equity_open: float, cfg: RiskConfig) -> bool:
    if equity_open <= 0:
        return True
    return (equity_now / equity_open - 1) <= -cfg.daily_kill_pct

def dynamic_threshold(win_rate_20: float) -> float:
    if win_rate_20 > 0.60:
        return 0.65
    if win_rate_20 < 0.50:
        return 0.80
    return 0.72
