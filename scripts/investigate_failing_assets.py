import sqlite3
import yfinance as yf

conn = sqlite3.connect("backend/optivest_dev.db")
c = conn.cursor()

print("--- ASSET TABLE ROWS FOR LTIM.NS AND BROADCOM ---")
c.execute("SELECT id, symbol, company_name, exchange, country, tier FROM assets WHERE symbol IN ('LTIM.NS', 'BROADCOM', 'AVGO')")
for r in c.fetchall():
    print(r)

print("\n--- YFINANCE SEARCH FOR LTIMINDTREE ALTERNATIVES ---")
test_tickers = ["LTIM.NS", "LTI.NS", "LTIMINDTREE.NS", "LTIM.BO", "540005.BO"]
for t in test_tickers:
    df = yf.download(t, period="1mo", progress=False)
    if not df.empty and "Close" in df.columns and len(df.dropna()) > 0:
        print(f"SUCCESS: {t} returned {len(df)} rows. Recent close: {df['Close'].iloc[-1].item():.2f}")
    else:
        print(f"FAILED: {t}")

print("\n--- YFINANCE SEARCH FOR BROADCOM / AVGO ---")
df_avgo = yf.download("AVGO", period="1mo", progress=False)
if not df_avgo.empty and "Close" in df_avgo.columns:
    print(f"SUCCESS: AVGO returned {len(df_avgo)} rows. Recent close: {df_avgo['Close'].iloc[-1].item():.2f}")

conn.close()
