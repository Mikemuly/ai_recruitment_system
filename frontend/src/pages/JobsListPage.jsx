// =============================================================
// src/pages/JobsListPage.jsx — Public job board
// =============================================================
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { jobsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, MapPin, Building2, Clock, BriefcaseBusiness, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const JOB_TYPES = ['', 'full-time', 'part-time', 'contract', 'internship', 'remote'];

export default function JobsListPage() {
  const { user }    = useAuth();
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ title: '', location: '', job_type: '' });
  const [searching, setSearching] = useState(false);

  const load = async (params = {}) => {
    setSearching(true);
    try {
      const res = await jobsAPI.list({ ...filters, ...params, page });
      setJobs(res.data.jobs || []);
      setTotalPages(res.data.pages || 1);
    } catch {} finally {
      setLoading(false);
      setSearching(false);
    }
  };

  useEffect(() => { load(); }, [page]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); load(); };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="spinner w-8 h-8" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <nav className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="font-bold text-slate-800">RecruitKE</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to={user.role === 'applicant' ? '/dashboard' : user.role === 'admin' ? '/admin' : '/hr'}
              className="btn-primary text-sm">My Dashboard</Link>
          ) : (
            <>
              <Link to="/login"    className="btn-secondary text-sm">Sign in</Link>
              <Link to="/register" className="btn-primary text-sm">Register</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero search */}
      <div className="bg-gradient-to-r from-slate-800 to-brand-800 py-14 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Find Your Next Opportunity in Kenya</h1>
          <p className="text-slate-300 mb-8">Hundreds of roles across Nairobi, Mombasa, Kisumu and beyond</p>
          <form onSubmit={handleSearch} className="bg-white rounded-2xl p-3 flex flex-col sm:flex-row gap-3 shadow-xl">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={filters.title} onChange={e => setFilters(f => ({ ...f, title: e.target.value }))}
                className="w-full pl-9 pr-3 py-2.5 text-sm text-slate-800 rounded-lg outline-none placeholder-slate-400"
                placeholder="Job title, skill..." />
            </div>
            <div className="relative flex-1">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={filters.location} onChange={e => setFilters(f => ({ ...f, location: e.target.value }))}
                className="w-full pl-9 pr-3 py-2.5 text-sm text-slate-800 rounded-lg outline-none placeholder-slate-400"
                placeholder="Location..." />
            </div>
            <select value={filters.job_type} onChange={e => setFilters(f => ({ ...f, job_type: e.target.value }))}
              className="px-3 py-2.5 text-sm text-slate-700 rounded-lg border border-slate-200 bg-white">
              {JOB_TYPES.map(t => <option key={t} value={t}>{t || 'All types'}</option>)}
            </select>
            <button type="submit" disabled={searching} className="btn-primary px-6 whitespace-nowrap">
              {searching ? <div className="spinner w-4 h-4" /> : 'Search Jobs'}
            </button>
          </form>
        </div>
      </div>

      {/* Job listings */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-slate-500">{jobs.length} jobs found</p>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-16">
            <BriefcaseBusiness size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium text-lg">No jobs found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your search or check back later</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <Link key={job.id} to={`/jobs/${job.id}`}
                className="card block hover:shadow-card-hover hover:border-brand-200 transition-all group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-brand-100 transition-colors">
                        <Building2 size={20} className="text-slate-500 group-hover:text-brand-700" />
                      </div>
                      <div>
                        <h2 className="font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                          {job.title}
                        </h2>
                        <p className="text-sm text-slate-600 mt-0.5">{job.company?.name}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-3 ml-14">
                      <span className="flex items-center gap-1 text-xs text-slate-500"><MapPin size={11} />{job.location}</span>
                      <span className="badge bg-brand-100 text-brand-700 text-xs">{job.job_type}</span>
                      <span className="badge bg-slate-100 text-slate-600 text-xs">{job.education_required}</span>
                      {job.salary_min && (
                        <span className="text-xs text-green-700 font-medium">
                          KES {job.salary_min?.toLocaleString()} – {job.salary_max?.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {job.required_skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 ml-14">
                        {job.required_skills.slice(0, 5).map(s => (
                          <span key={s} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-md">{s}</span>
                        ))}
                        {job.required_skills.length > 5 && (
                          <span className="text-xs text-slate-400">+{job.required_skills.length - 5} more</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={11} />
                      {job.created_at ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true }) : 'Recently'}
                    </span>
                    {job.application_deadline && (
                      <span className="text-xs text-red-500 font-medium">
                        Closes {new Date(job.application_deadline).toLocaleDateString('en-KE')}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{job.applications_count || 0} applicants</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm">
              ← Previous
            </button>
            <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-sm">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
