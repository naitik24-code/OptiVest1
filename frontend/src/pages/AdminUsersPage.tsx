import React, { useState, useEffect, useCallback } from 'react';
import { Users, ShieldCheck, ShieldAlert, RefreshCw, Search, UserCheck, UserX } from 'lucide-react';

const getH = (): HeadersInit => {
  const t = localStorage.getItem('access_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

interface UserRecord {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  created_at?: string;
}

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/users', { headers: getH() });
      if (res.ok) {
        const data = await res.json();
        // Handle both array response and envelope response
        const list = Array.isArray(data) ? data : (data.data ?? []);
        setUsers(list);
      }
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter((u) => {
    const matchSearch =
      search === '' ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const activeCount = users.filter((u) => u.is_active !== false).length;

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">User Control Panel</h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">Platform-wide user registry — roles, access levels, and registration telemetry</p>
        </div>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--primary)] text-[13px] font-bold text-[var(--text-main)] rounded-[8px] flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[var(--primary)]' : ''}`} />
          <span>Refresh Registry</span>
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',   value: users.length,  color: 'text-[var(--text-main)]', bg: 'bg-[var(--surface2)]', icon: Users },
          { label: 'Active',        value: activeCount,   color: 'text-[var(--success)]', bg: 'bg-[var(--success)]/10', icon: UserCheck },
          { label: 'Administrators',value: adminCount,    color: 'text-[var(--primary)]', bg: 'bg-[var(--primary)]/10', icon: ShieldCheck },
          { label: 'Restricted',    value: users.length - activeCount, color: 'text-[var(--danger)]', bg: 'bg-[var(--danger)]/10', icon: UserX },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="inst-card p-[20px] flex items-center gap-4">
              <div className={`w-[44px] h-[44px] rounded-[10px] ${item.bg} border border-[var(--border-color)] flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div>
                <div className={`text-[24px] font-bold font-mono ${item.color}`}>{item.value}</div>
                <div className="text-[11px] uppercase font-bold text-[var(--text-muted)] tracking-wider mt-[4px]">{item.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Filter / Search Bar ── */}
      <div className="inst-card p-[16px] flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-[var(--border-color)] rounded-[8px] pl-10 pr-4 py-2.5 text-[14px] text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors"
          />
        </div>
        <div className="flex items-center gap-1 bg-background border border-[var(--border-color)] rounded-[8px] p-1">
          {(['ALL', 'USER', 'ADMIN'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-4 py-1.5 text-[12px] font-bold rounded-[6px] transition-all cursor-pointer ${
                roleFilter === r
                  ? 'bg-[var(--primary)] text-[#08090b]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ── User Table ── */}
      <div className="inst-card p-[24px]">
        <h3 className="text-[14px] font-bold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3 mb-4">
          <ShieldCheck className="w-4 h-4 text-[var(--primary)]" />
          <span>Registered Users ({filtered.length})</span>
        </h3>

        {loading ? (
          <div className="py-12 text-center flex flex-col items-center gap-3 text-[var(--text-muted)]">
            <RefreshCw className="w-5 h-5 animate-spin text-[var(--primary)]" />
            <span className="text-[13px]">Loading user registry...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
            <p className="text-[14px] text-[var(--text-muted)]">
              {users.length === 0 ? 'No users found in registry.' : 'No results match your search.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase text-[10px] font-mono tracking-wider">
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] font-mono">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-background transition-colors">
                    <td className="py-4 px-4 font-bold text-[var(--text-main)]">
                      {user.full_name || user.email.split('@')[0]}
                    </td>
                    <td className="py-4 px-4 text-[var(--text-muted)]">{user.email}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-[4px] text-[10px] font-bold uppercase flex items-center gap-1.5 w-fit ${
                        user.role === 'ADMIN'
                          ? 'bg-[var(--primary-dim)] text-[var(--primary)] border border-[rgba(255,90,31,0.3)]'
                          : 'bg-[var(--surface2)] text-[var(--text-muted)] border border-[var(--border-color)]'
                      }`}>
                        {user.role === 'ADMIN'
                          ? <ShieldCheck className="w-3 h-3" />
                          : <ShieldAlert className="w-3 h-3" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`flex items-center gap-2 text-[10px] font-bold uppercase ${
                        user.is_active !== false ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${user.is_active !== false ? 'bg-[var(--success)] shadow-[0_0_8px_rgba(23,217,140,0.6)]' : 'bg-[var(--danger)]'}`} />
                        {user.is_active !== false ? 'ACTIVE' : 'RESTRICTED'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[var(--text-muted)]">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;
