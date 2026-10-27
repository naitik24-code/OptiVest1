import sqlite3
import os
import requests

db_path = os.path.join("backend", "optivest_dev.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("=========================================================")
print("          OPTIVEST AI — ASSET UNIVERSE AUDIT             ")
print("=========================================================\n")

# Table counts for tables storing asset information
asset_tables = [
    "assets",
    "asset_metadata",
    "market_prices",
    "price_cache",
    "holdings",
    "paper_positions",
    "watchlist_items"
]

print("--- 5 & 6. TABLES STORING ASSET INFORMATION AND ROW COUNTS ---")
for t in asset_tables:
    try:
        cursor.execute(f"SELECT COUNT(*) FROM {t}")
        cnt = cursor.fetchone()[0]
        print(f"Table `{t}`: {cnt} rows")
    except Exception as e:
        print(f"Table `{t}`: Error ({e})")

print("\n--- 1. TOTAL ASSETS IN DATABASE ---")
cursor.execute("SELECT COUNT(*) FROM assets")
total_assets_db = cursor.fetchone()[0]
print(f"Total rows in `assets` table: {total_assets_db}")

cursor.execute("SELECT tier, COUNT(*) FROM assets GROUP BY tier")
tiers = cursor.fetchall()
print("Breakdown by Tier:")
for tier, count in tiers:
    print(f"  - {tier}: {count}")

print("\n--- 2. TOTAL ASSETS WITH HISTORICAL PRICE DATA ---")
cursor.execute("SELECT COUNT(DISTINCT symbol) FROM market_prices")
assets_with_prices = cursor.fetchone()[0]
cursor.execute("SELECT COUNT(*) FROM market_prices")
total_prices_count = cursor.fetchone()[0]
print(f"Unique symbols in `market_prices` table: {assets_with_prices}")
print(f"Total price records in `market_prices` table: {total_prices_count}")

print("\n--- 3. TOTAL ASSETS VISIBLE THROUGH API ---")
import sys
sys.path.insert(0, "backend")
from app.core.security import create_access_token
from app.models.user import User
from app.db.session import SessionLocal

db = SessionLocal()
u = db.query(User).first()
if u:
    token = create_access_token(str(u.id))
    headers = {"Authorization": f"Bearer {token}"}
else:
    headers = {}
db.close()

api_assets_count = 0
try:
    resp = requests.get("http://localhost:8000/api/v1/assets", headers=headers, timeout=5)
    if resp.status_code == 200:
        data = resp.json()
        items = data.get("data", [])
        api_assets_count = len(items)
        print(f"API `/api/v1/assets` returned: {api_assets_count} assets")
    else:
        print(f"API `/api/v1/assets` returned status {resp.status_code}")
except Exception as e:
    print(f"API Query error: {e}")

print("\n--- 4. TOTAL ASSETS VISIBLE IN FRONTEND DEFAULT SEARCH ---")
search_count = 0
try:
    resp_search = requests.get("http://localhost:8000/api/v1/market/search", params={"q": ""}, headers=headers, timeout=5)
    if resp_search.status_code == 200:
        data = resp_search.json()
        items = data.get("data", [])
        search_count = len(items)
        print(f"API `/api/v1/market/search?q=` returned: {search_count} assets")
except Exception as e:
    print(f"Market search API error: {e}")

conn.close()
