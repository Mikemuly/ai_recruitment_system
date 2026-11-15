// =============================================================
// src/pages/AdminDashboard.jsx — Admin analytics dashboard
// =============================================================
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/shared/Layout';
import { adminAPI } from '../services/api';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import {
  Users, Briefcase, Building2, FileText, TrendingUp, Activity,
  Plus, X, MapPin, Globe, Search
} from 'lucide-react';

const COLORS = ['#16a34a', '#2563eb', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const ROLE_BADGE = {
  admin:     'bg-purple-100 text-purple-700',
  recruiter: 'bg-brand-100 text-brand-700',
  applicant: 'bg-blue-100 text-blue-700',
};

const emptyCompanyForm = {
  name: '',
  industry: '',
  location: 'Nairobi, Kenya',
  website: '',
  size_range: '',
  description: '',
};

const StatCard = ({ icon: Icon, label, value, sub, color = 'brand' }) => {
  const colors = {
    brand:  'bg-brand-50 text-brand-700',
    blue:   'bg-blue-50 text-blue-700',
    amber:  'bg-amber-50 text-amber-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <div className="card flex items-start gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value?.toLocaleString() ?? '—'}</p>
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

function CompanyModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(emptyCompanyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(emptyCompanyForm);
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Company name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await adminAPI.createCompany(form);
      onCreated(res.data.company);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create company');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Add Company</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="form-label">Company name *</label>
            <input className="form-input" value={form.name}
              onChange={e => set('name', e.target.value)} placeholder="e.g. Safaricom PLC" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Industry</label>
              <input className="form-input" value={form.industry}
                onChange={e => set('industry', e.target.value)} placeholder="Technology" />
            </div>
            <div>
              <label className="form-label">Size</label>
              <select className="form-input" value={form.size_range}
                onChange={e => set('size_range', e.target.value)}>
                <option value="">Select size</option>
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="51-200">51-200</option>
                <option value="201-500">201-500</option>
                <option value="500+">500+</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Location</label>
              <input className="form-input" value={form.location}
                onChange={e => set('location', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Website</label>
              <input className="form-input" value={form.website}
                onChange={e => set('website', e.target.value)} placeholder="https://" />
            </div>
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea className="form-input resize-none" rows={3} value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Short company overview..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Create Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OverviewTab({ stats, onAction }) {
  const statusData = stats?.applications_by_status
    ? Object.entries(stats.applications_by_status).map(([name, value]) => ({ name, value }))
    : [];
  const companyData = stats?.top_companies || [];
  const trendData = [
    { month: 'Sep', applications: 12, jobs: 3 },
    { month: 'Oct', applications: 24, jobs: 7 },
    { month: 'Nov', applications: 38, jobs: 10 },
    { month: 'Dec', applications: 29, jobs: 6 },
    { month: 'Jan', applications: 45, jobs: 12 },
    { month: 'Feb', applications: 62, jobs: 15 },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-1">System Overview</h2>
        <p className="text-slate-300 text-sm">RecruitKE AI Recruitment Platform · Kenya</p>
        <div className="flex items-center gap-2 mt-3">
          <Activity size={16} className="text-brand-400" />
          <span className="text-sm text-brand-300 font-medium">
            {stats?.recent_applications_30d || 0} applications in the last 30 days
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}     label="Total Users"    value={stats?.totals?.users}        sub="All roles"      color="blue" />
        <StatCard icon={Building2} label="Companies"      value={stats?.totals?.companies}    sub="Registered"     color="purple" />
        <StatCard icon={Briefcase} label="Active Jobs"    value={stats?.totals?.active_jobs}  sub={`of ${stats?.totals?.jobs} total`} color="brand" />
        <StatCard icon={FileText}  label="Applications"   value={stats?.totals?.applications} sub="All time"       color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="section-title mb-4">Applications by Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
          )}
        </div>

        <div className="card">
          <h3 className="section-title mb-4">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="applications" stroke="#16a34a" strokeWidth={2} dot={false} name="Applications" />
              <Line type="monotone" dataKey="jobs" stroke="#2563eb" strokeWidth={2} dot={false} name="Jobs Posted" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title mb-4">Top Companies by Job Postings</h3>
        {companyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={companyData} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="jobs" fill="#16a34a" radius={[4, 4, 0, 0]} name="Jobs" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No company data</div>
        )}
      </div>

      <div className="card">
        <h3 className="section-title mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Add Company', icon: Building2, color: 'bg-purple-50 text-purple-700', action: 'add-company' },
            { label: 'View Users',  icon: Users,     color: 'bg-blue-50 text-blue-700',     action: 'users' },
            { label: 'All Jobs',    icon: Briefcase, color: 'bg-brand-50 text-brand-700',   action: 'jobs' },
            { label: 'Reports',     icon: TrendingUp,color: 'bg-amber-50 text-amber-700',   action: 'analytics' },
          ].map(a => (
            <button key={a.label} type="button" onClick={() => onAction(a.action)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl ${a.color} hover:opacity-80 transition-opacity`}>
              <a.icon size={20} />
              <span className="text-xs font-medium">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CompaniesTab({ companies, loading, onAdd, onRefresh }) {
  const [search, setSearch] = useState('');
  const filtered = companies.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name?.toLowerCase().includes(q) || c.industry?.toLowerCase().includes(q)
      || c.location?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Companies</h2>
          <p className="text-sm text-slate-500">{companies.length} registered companies</p>
        </div>
        <button type="button" onClick={onAdd} className="btn-primary inline-flex items-center gap-2">
          <Plus size={16} /> Add Company
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="form-input pl-9" placeholder="Search companies..." />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="spinner w-8 h-8" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-slate-400 text-sm">
          No companies found.{' '}
          <button type="button" onClick={onAdd} className="text-brand-600 font-medium hover:underline">
            Add the first one
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="card space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 shrink-0">
                    <Building2 size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{c.name}</h3>
                    <p className="text-xs text-slate-500">{c.industry || 'Industry not set'}</p>
                  </div>
                </div>
                <span className={`badge ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {c.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {c.description && (
                <p className="text-sm text-slate-600 line-clamp-2">{c.description}</p>
              )}
              <div className="flex flex-wrap gap-3 text-xs text-slate-500 pt-1">
                {c.location && (
                  <span className="inline-flex items-center gap-1"><MapPin size={12} />{c.location}</span>
                )}
                {c.website && (
                  <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                    target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-brand-600 hover:underline">
                    <Globe size={12} /> Website
                  </a>
                )}
                {c.size_range && <span>{c.size_range} employees</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button type="button" onClick={onRefresh} className="btn-secondary text-xs">Refresh</button>
      </div>
    </div>
  );
}

function UsersTab({ users, loading, onRefresh }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchesSearch = !q
      || u.full_name?.toLowerCase().includes(q)
      || u.email?.toLowerCase().includes(q)
      || u.company?.name?.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">All Users</h2>
        <p className="text-sm text-slate-500">{users.length} accounts across all roles</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="form-input pl-9" placeholder="Search by name, email, or company..." />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="form-input w-auto">
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="recruiter">Recruiter</option>
          <option value="applicant">Applicant</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="spinner w-8 h-8" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-slate-400 text-sm">No users found</div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{u.full_name || `${u.first_name} ${u.last_name}`}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge capitalize ${ROLE_BADGE[u.role] || 'bg-slate-100 text-slate-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.company?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end">
        <button type="button" onClick={onRefresh} className="btn-secondary text-xs">Refresh</button>
      </div>
    </div>
  );
}

function AnalyticsTab({ stats }) {
  const statusData = stats?.applications_by_status
    ? Object.entries(stats.applications_by_status).map(([name, value]) => ({ name, value }))
    : [];
  const companyData = stats?.top_companies || [];
  const trendData = [
    { month: 'Sep', applications: 12, jobs: 3 },
    { month: 'Oct', applications: 24, jobs: 7 },
    { month: 'Nov', applications: 38, jobs: 10 },
    { month: 'Dec', applications: 29, jobs: 6 },
    { month: 'Jan', applications: 45, jobs: 12 },
    { month: 'Feb', applications: 62, jobs: 15 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Analytics</h2>
        <p className="text-sm text-slate-500">Platform performance and hiring trends</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}     label="Total Users"    value={stats?.totals?.users}        color="blue" />
        <StatCard icon={Building2} label="Companies"      value={stats?.totals?.companies}    color="purple" />
        <StatCard icon={Briefcase} label="Active Jobs"    value={stats?.totals?.active_jobs}  color="brand" />
        <StatCard icon={FileText}  label="Applications"   value={stats?.totals?.applications} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="section-title mb-4">Applications by Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
          )}
        </div>

        <div className="card">
          <h3 className="section-title mb-4">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="applications" stroke="#16a34a" strokeWidth={2} name="Applications" />
              <Line type="monotone" dataKey="jobs" stroke="#2563eb" strokeWidth={2} name="Jobs Posted" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title mb-4">Top Companies by Job Postings</h3>
        {companyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={companyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="jobs" fill="#16a34a" radius={[4, 4, 0, 0]} name="Jobs" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No company data</div>
        )}
      </div>

      <div className="card flex items-center justify-between gap-4">
        <div>
          <h3 className="section-title">Browse all jobs</h3>
          <p className="text-sm text-slate-500 mt-1">Open the public jobs listing to review postings.</p>
        </div>
        <Link to="/jobs" className="btn-primary inline-flex items-center gap-2">
          <Briefcase size={16} /> All Jobs
        </Link>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  const goTab = useCallback((next) => {
    if (!next || next === 'overview') setSearchParams({});
    else setSearchParams({ tab: next });
  }, [setSearchParams]);

  const loadStats = useCallback(() => {
    setStatsLoading(true);
    adminAPI.stats()
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const loadCompanies = useCallback(() => {
    setCompaniesLoading(true);
    adminAPI.companies()
      .then(r => setCompanies(r.data.companies || []))
      .catch(() => setCompanies([]))
      .finally(() => setCompaniesLoading(false));
  }, []);

  const loadUsers = useCallback(() => {
    setUsersLoading(true);
    adminAPI.users()
      .then(r => setUsers(r.data.users || []))
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false));
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (tab === 'companies') loadCompanies();
    if (tab === 'users') loadUsers();
  }, [tab, loadCompanies, loadUsers]);

  const titles = {
    overview: 'Admin Dashboard',
    companies: 'Companies',
    users: 'All Users',
    analytics: 'Analytics',
  };

  const handleQuickAction = (action) => {
    if (action === 'add-company') {
      goTab('companies');
      setShowCompanyModal(true);
      return;
    }
    if (action === 'users') return goTab('users');
    if (action === 'analytics') return goTab('analytics');
    if (action === 'jobs') return navigate('/jobs');
  };

  const handleCompanyCreated = (company) => {
    setCompanies(prev => [company, ...prev]);
    loadStats();
  };

  if (statsLoading && tab === 'overview') {
    return (
      <Layout title="Admin Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="spinner w-8 h-8" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={titles[tab] || 'Admin Dashboard'}>
      {tab === 'overview' && (
        <OverviewTab stats={stats} onAction={handleQuickAction} />
      )}
      {tab === 'companies' && (
        <CompaniesTab
          companies={companies}
          loading={companiesLoading}
          onAdd={() => setShowCompanyModal(true)}
          onRefresh={loadCompanies}
        />
      )}
      {tab === 'users' && (
        <UsersTab users={users} loading={usersLoading} onRefresh={loadUsers} />
      )}
      {tab === 'analytics' && (
        <AnalyticsTab stats={stats} />
      )}
      {!['overview', 'companies', 'users', 'analytics'].includes(tab) && (
        <div className="card text-center py-12">
          <p className="text-slate-500 mb-3">Unknown admin section.</p>
          <button type="button" onClick={() => goTab('overview')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      )}

      <CompanyModal
        open={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        onCreated={handleCompanyCreated}
      />
    </Layout>
  );
}
