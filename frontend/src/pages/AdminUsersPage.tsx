import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
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
    <div className="space-y-6 max-w-7xl">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Founder Console &bull; RBAC &amp; User Registry</span>
          </div>
          <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
            User Control Panel
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Platform-wide user registry — roles, access levels, and registration telemetry.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-main)] rounded-lg flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',   value: users.length,  color: 'text-[var(--text-main)]', icon: Users },
          { label: 'Active',        value: activeCount,   color: 'text-emerald-400',         icon: UserCheck },
          { label: 'Administrators',value: adminCount,    color: 'text-amber-400',           icon: ShieldCheck },
          { label: 'Restricted',    value: users.length - activeCount, color: 'text-red-400', icon: UserX },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center shrink-0">
                <Icon className={`w-4.5 h-4.5 ${item.color}`} />
              </div>
              <div>
                <div className={`text-xl font-extrabold font-mono ${item.color}`}>{item.value}</div>
                <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">{item.label}</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── Filter / Search Bar ── */}
      <Card className="p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg pl-9 pr-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg p-1">
          {(['ALL', 'USER', 'ADMIN'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                roleFilter === r
                  ? 'bg-amber-500 text-white shadow'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </Card>

      {/* ── User Table ── */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3 mb-3">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Registered Users ({filtered.length})</span>
        </h3>

        {loading ? (
          <div className="py-12 text-center flex flex-col items-center gap-3 text-[var(--text-muted)]">
            <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
            <span className="text-xs">Loading user registry...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
            <p className="text-sm text-[var(--text-muted)]">
              {users.length === 0 ? 'No users found in registry.' : 'No results match your search.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase text-[10px] font-mono">
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] font-mono">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-[var(--text-main)]">
                      {user.full_name || user.email.split('@')[0]}
                    </td>
                    <td className="py-3 px-3 text-[var(--text-muted)]">{user.email}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-fit ${
                        user.role === 'ADMIN'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-color)]'
                      }`}>
                        {user.role === 'ADMIN'
                          ? <ShieldCheck className="w-2.5 h-2.5" />
                          : <ShieldAlert className="w-2.5 h-2.5" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${
                        user.is_active !== false ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.is_active !== false ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                        {user.is_active !== false ? 'ACTIVE' : 'RESTRICTED'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[var(--text-muted)]">
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
      </Card>
    </div>
  );
};

export default AdminUsersPage;
