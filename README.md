# PULSE + Chimera (paper)

Phone: https://ownpussy.github.io/

FLOW tab is the desk. You should not need to leave the app.

- Lots of insider buys + new 8-Ks = BUY FLOW
- Lots of sells = SELL-OFF, start a 21-day clock, do not buy
- Clock hits 0, look again. Only buy if heat turned back up

Chimera is a paper GitHub Actions desk. It writes pulse_data.json. It does not live-trade unless PAPER=0 and Alpaca keys exist.

## CROSS-REFERENCE RISKS & OVERFITTING

Multi-factor models love historical noise. Insider_Buy_x_News_Sentiment looks brilliant on a year when mega-cap Form 4s lined up with a bull tape and garbage in the next. Walk-forward is required; a single 5-year fit is a story, not a test.

SEC filings are late. Form 4 can land two business days after the trade. An 8-K can print after the gap. If the model treats the filing timestamp as the trade timestamp it is leaking the future. Chimera uses filing dates only, and the phone card is a snapshot, not a fill.

GDELT, Reddit, and Finnhub are messy. Mentions are not signed economic value. Retail hype on a broken chart is how accounts die. Hype never overrides a sell-off clock.

HMM regimes flip. Three states on daily SPY will call HIGH_VOL after one ugly week and then sit in cash through the bounce. That is the point of the filter. It will also whipsaw. Do not loosen it after two missed longs.

LightGBM on 14 names and a handful of interaction terms will overfit the book. min_child_samples=40 and a weekly retrain are brakes, not magic. If rolling 20-trade win rate drops under 50%, the threshold goes to 80% and size stays at 1% risk.

Data that costs $0 is delayed, sparse, or both. Yahoo gaps. EDGAR rate-limits. FRED and Finnhub need keys. If a source is missing the desk must fail closed (no buy), not invent a number.

This is not advice. Default is paper. A 3% daily kill switch cancels the session. Limit orders only.
