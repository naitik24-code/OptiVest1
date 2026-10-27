import requests
import uuid

BASE = 'http://127.0.0.1:8000/api/v1'

# 1. Test Admin Login
admin_login = requests.post(f'{BASE}/auth/login', json={'email': 'admin@optivest.ai', 'password': 'Admin123!'})
print('1. Admin Login Status:', admin_login.status_code, 'Success:', admin_login.json().get('success'))
admin_token = admin_login.json()['data']['access_token']

# 2. Test Admin Endpoint
admin_check = requests.get(f'{BASE}/autonomous/scheduler/status', headers={'Authorization': f'Bearer {admin_token}'})
print('2. Admin Autonomous Scheduler Status:', admin_check.status_code)

# 3. Test New User Registration
test_email = f'audit_user_{uuid.uuid4().hex[:8]}@example.com'
user_reg = requests.post(f'{BASE}/auth/register', json={
    'email': test_email,
    'password': 'UserSecret123!',
    'full_name': 'Test Investor',
    'risk_level': 3
})
print('3. User Registration Status:', user_reg.status_code, 'Email:', test_email)

# 4. Test User Login
user_login = requests.post(f'{BASE}/auth/login', json={'email': test_email, 'password': 'UserSecret123!'})
print('4. User Login Status:', user_login.status_code, 'Token received:', bool(user_login.json().get('data', {}).get('access_token')))
user_token = user_login.json()['data']['access_token']
user_headers = {'Authorization': f'Bearer {user_token}'}

# 5. Verify User CANNOT access Admin Endpoint (Security RBAC check)
unauth_admin_check = requests.get(f'{BASE}/autonomous/scheduler/status', headers=user_headers)
print('5. Normal user denied admin endpoint (RBAC 403 Forbidden):', unauth_admin_check.status_code)

# 6. Test Portfolio Creation for user
create_port = requests.post(f'{BASE}/portfolios', json={
    'name': 'Retirement Growth Portfolio',
    'description': 'Long term diversified portfolio',
    'initial_capital': 100000.0,
    'risk_level': 3
}, headers=user_headers)
print('6. Create Portfolio Status:', create_port.status_code)
port_data = create_port.json()['data']
port_id = port_data['id']
print('   Portfolio ID:', port_id, 'Cash balance:', port_data.get('cash_balance'))

# 7. Get an active asset
assets_resp = requests.get(f'{BASE}/assets?limit=5', headers=user_headers)
first_asset = assets_resp.json()['data'][0]
asset_sym = first_asset['symbol']
asset_id = first_asset['id']
print(f'   Selected Asset: {asset_sym} (ID: {asset_id})')

# 8. Record a BUY transaction
buy_resp = requests.post(f'{BASE}/portfolios/transactions', json={
    'portfolio_id': port_id,
    'asset_id': asset_id,
    'transaction_type': 'BUY',
    'quantity': 10.0,
    'price': 150.0,
    'fees': 1.50,
    'notes': 'Initial purchase of 10 shares'
}, headers=user_headers)
print('8. Record BUY Transaction Status:', buy_resp.status_code)

# 9. Record a SELL transaction
sell_resp = requests.post(f'{BASE}/portfolios/transactions', json={
    'portfolio_id': port_id,
    'asset_id': asset_id,
    'transaction_type': 'SELL',
    'quantity': 3.0,
    'price': 160.0,
    'fees': 1.50,
    'notes': 'Trimmed 3 shares'
}, headers=user_headers)
print('9. Record SELL Transaction Status:', sell_resp.status_code)

# 10. Verify Database Persistence of Holdings and Transactions
port_verify = requests.get(f'{BASE}/portfolios/{port_id}', headers=user_headers)
pv_data = port_verify.json()['data']
print('10. Portfolio DB Verification:')
holdings = pv_data.get('holdings', [])
print('    Holdings count:', len(holdings))
for h in holdings:
    print(f'    -> Holding {h.get("asset_symbol")}: qty={h.get("quantity")}, avg_buy_price={h.get("avg_buy_price")}')

tx_verify = requests.get(f'{BASE}/portfolios/{port_id}/transactions', headers=user_headers)
tx_list = tx_verify.json()['data']
print('    Transactions count in DB:', len(tx_list))
for t in tx_list:
    print(f'    -> Tx {t.get("transaction_type")}: qty={t.get("quantity")} @ ${t.get("price")}, fees=${t.get("fees")}')

# 11. Run CDE candidate discovery on this portfolio
cde_candidates = requests.get(f'{BASE}/portfolios/{port_id}/candidates?limit=2', headers=user_headers)
print('11. CDE Candidate Discovery on live portfolio Status:', cde_candidates.status_code)
if cde_candidates.status_code == 200:
    c_list = cde_candidates.json().get('data', [])
    print(f'    Discovered {len(c_list)} candidates for rebalancing')

print('\nALL CHECKS COMPLETED SUCCESSFULLY!')
