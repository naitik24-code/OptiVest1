import sqlite3
import os
import requests

db_path = os.path.join("backend", "optivest_dev.db")
if not os.path.exists(db_path):
    db_path = "optivest_dev.db"

print(f"Connecting to database at: {os.path.abspath(db_path)}\n")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("=========================================================")
print("             ACTUAL ASSET UNIVERSE AUDIT                 ")
print("=========================================================\n")

# 5 & 6. List every table and its row count
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [row[0] for row in cursor.fetchall()]

print("--- TABLE COUNTS ---")
for t in sorted(tables):
    try:
        cursor.execute(f"SELECT COUNT(*) FROM {t}")
        count = cursor.fetchone()[0]
        print(f"Table: {t:<35} | Row Count: {count}")
    except Exception as e:
        print(f"Table: {t:<35} | Error: {e}")

print("\n--- ASSET UNIVERSE AUDIT QUESTIONS ---")

# 1. Total assets in database
cursor.execute("SELECT COUNT(*) FROM assets")
total_assets_db = cursor.fetchone()[0]
print(f"1. Total Assets in `assets` table: {total_assets_db}")

# 2. Total assets with historical price data
cursor.execute("SELECT COUNT(DISTINCT asset_id) FROM market_prices")
assets_with_prices = cursor.fetchone()[0]
cursor.execute("SELECT COUNT(DISTINCT symbol) FROM market_prices")
symbols_with_prices = cursor.fetchone()[0]
print(f"2. Assets with historical price data in `market_prices`: {assets_with_prices} unique asset_ids ({symbols_with_prices} unique symbols)")

# Break down assets by tier
try:
    cursor.execute("SELECT tier, COUNT(*) FROM assets GROUP BY tier")
    tier_counts = cursor.fetchall()
    print("\n   Asset Tier Breakdown:")
    for tier, count in tier_counts:
        print(f"    - Tier: {tier:<20} | Count: {count}")
except Exception as e:
    print(f"   Tier breakdown error: {e}")

# 3. Total assets visible through API
api_count = "N/A"
api_limit_param = None
try:
    resp = requests.get("http://localhost:8000/api/v1/assets", timeout=5)
    if resp.status_code == 200:
        data = resp.json()
        if isinstance(data, list):
            api_count = len(data)
        elif isinstance(data, dict):
            api_count = len(data.get("items", data.get("assets", [])))
    print(f"\n3. Total Assets returned by API (/api/v1/assets): {api_count}")
except Exception as ex:
    print(f"\n3. API check error: {ex}")

# 4. Check Frontend limit / pagination in API endpoint
try:
    resp_limit = requests.get("http://localhost:8000/api/v1/assets?limit=500", timeout=5)
    if resp_limit.status_code == 200:
        data = resp_limit.json()
        if isinstance(data, list):
            print(f"   API response with ?limit=500: {len(data)} assets")
        elif isinstance(data, dict):
            items = data.get("items", data.get("assets", []))
            print(f"   API response with ?limit=500: {len(items)} assets")
except Exception as ex:
    pass

conn.close()
