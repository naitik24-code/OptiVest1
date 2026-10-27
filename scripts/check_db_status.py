import sqlite3
import os

db_path = r'e:\NAITIK PATHAK\PROJECT\StockProject\backend\optivest_dev.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
tables = [r[0] for r in cursor.fetchall() if not r[0].startswith('sqlite_')]

print(f"Database File: {db_path}")
print(f"File Size: {os.path.getsize(db_path) / (1024*1024):.2f} MB")
print(f"Total Tables: {len(tables)}\n")
print(f"{'Table Name':32} | {'Row Count':>10}")
print("-" * 45)

for t in tables:
    try:
        cursor.execute(f"SELECT COUNT(*) FROM \"{t}\";")
        cnt = cursor.fetchone()[0]
        print(f"{t:32} | {cnt:>10}")
    except Exception as e:
        print(f"{t:32} | Error: {e}")

# Inspect recent users, portfolios, holdings, and transactions
print("\n" + "=" * 45)
print("RECENT DATA AUDIT")
print("=" * 45)

cursor.execute("SELECT email, role, created_at FROM users ORDER BY created_at DESC LIMIT 3;")
print("\nLatest Users:")
for u in cursor.fetchall():
    print(f"  - Email: {u[0]}, Role: {u[1]}, Created: {u[2]}")

cursor.execute("SELECT id, name, created_at FROM portfolios ORDER BY created_at DESC LIMIT 3;")
print("\nLatest Portfolios:")
for p in cursor.fetchall():
    print(f"  - ID: {p[0]}, Name: {p[1]}, Created: {p[2]}")

cursor.execute("SELECT asset_id, quantity, average_buy_price FROM holdings ORDER BY created_at DESC LIMIT 3;")
print("\nLatest Holdings:")
for h in cursor.fetchall():
    print(f"  - Asset ID: {h[0]}, Qty: {h[1]}, Avg Buy Price: {h[2]}")

cursor.execute("SELECT transaction_type, quantity, price, fees, executed_at FROM transactions ORDER BY executed_at DESC LIMIT 3;")
print("\nLatest Transactions (Ledger):")
for tx in cursor.fetchall():
    print(f"  - Type: {tx[0]}, Qty: {tx[1]}, Price: ${tx[2]}, Fees: ${tx[3]}, Date: {tx[4]}")

conn.close()
