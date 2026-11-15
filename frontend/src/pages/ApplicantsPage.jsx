// =============================================================
// src/pages/ApplicantsPage.jsx — Ranked applicants for a job
// =============================================================
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/shared/Layout';
import { jobsAPI, applicationsAPI } from '../services/api';
import { ScoreBadge, RankingBadge } from '../components/shared/ScoreRing';
import toast from 'react-hot-toast';
import {
  Users, Search, Filter, ChevronRight, Clock,
  CheckCircle, XCircle, AlertCircle, Eye, Star
} from 'lucide-react';

const STATUS_OPTIONS = ['submitted','reviewing','shortlisted','interview','offer','rejected'];

const statusColors = {
  submitted:   'bg-slate-100 text-slate-600',
  reviewing:   'bg-blue-100 text-blue-700',
  shortlisted: 'bg-green-100 text-green-700',
  interview:   'bg-amber-100 text-amber-700',
  offer:       'bg-purple-100 text-purple-700',
  rejected:    'bg-red-100 text-red-700',
  withdrawn:   'bg-slate-100 text-slate-400',
};

export default function ApplicantsPage() {
  const { id: jobId } = useParams();
  const [job, setJob]             = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    jobsAPI.applicants(jobId)
      .then(r => {
        setJob(r.data.job);
        setApplicants(r.data.applicants || []);
        setFiltered(r.data.applicants || []);
      })
      .catch(() => toast.error('Failed to load applicants'))
      .finally(() => setLoading(false));
  }, [jobId]);

  // Filter applicants by search + status
  useEffect(() => {
    let result = applicants;
    if (statusFilter !== 'all') result = result.filter(a => a.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        `${a.applicant?.first_name} ${a.applicant?.last_name}`.toLowerCase().includes(q) ||
        a.applicant?.email?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, statusFilter, applicants]);

  const updateStatus = async (appId, newStatus) => {
    setUpdatingId(appId);
    try {
      await applicationsAPI.updateStatus(appId, { status: newStatus });
      setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
      toast.success(`Status updated to "${newStatus}"`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return (
    <Layout title="Applicants">
      <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8" /></div>
    </Layout>
  );

  const shortlisted = applicants.filter(a => ['shortlisted','interview','offer'].includes(a.status)).length;
  const avgScore    = applicants.filter(a => a.ai_score).reduce((s, a, _, arr) =>
    s + a.ai_score / arr.length, 0);

  return (
    <Layout title={`Applicants — ${job?.title || 'Job'}`}>
      <div className="space-y-5">

        {/* Header stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Applicants', value: applicants.length,       icon: Users,        color: 'bg-blue-50 text-blue-700' },
            { label: 'Shortlisted',      value: shortlisted,             icon: CheckCircle,  color: 'bg-green-50 text-green-700' },
            { label: 'Avg AI Score',     value: `${Math.round(avgScore)}%`, icon: Star,      color: 'bg-amber-50 text-amber-700' },
            { label: 'Pending Review',   value: applicants.filter(a => a.status === 'submitted').length,
              icon: Clock, color: 'bg-slate-100 text-slate-600' },
          ].map(s => (
            <div key={s.label} className="card flex items-center gap-3 py-4">
              <div className={`p-2.5 rounded-lg ${s.color}`}><s.icon size={18} /></div>
              <div>
                <p className="text-xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="card py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="form-input pl-9" placeholder="Search candidates by name or email..." />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-slate-400" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-input w-auto">
                <option value="all">All statuses</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Applicants table */}
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="section-title">
              Candidates <span className="text-slate-400 font-normal text-sm">({filtered.length})</span>
            </h3>
            <span className="text-xs text-slate-400">Sorted by AI Match Score</span>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Users size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No applicants found</p>
              <p className="text-slate-400 text-sm">
                {applicants.length === 0 ? 'No one has applied yet' : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map((app, idx) => (
                <div key={app.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  {/* Rank */}
                  <span className="text-slate-400 text-sm font-bold w-6 flex-shrink-0">#{idx + 1}</span>

                  {/* Avatar */}
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {app.applicant?.first_name?.[0]}{app.applicant?.last_name?.[0]}
                    </span>
                  </div>

                  {/* Name & email */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">
                      {app.applicant?.first_name} {app.applicant?.last_name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{app.applicant?.email}</p>
                    {app.ranking_label && (
                      <div className="mt-1"><RankingBadge label={app.ranking_label} /></div>
                    )}
                  </div>

                  {/* AI Score */}
                  <div className="text-center hidden sm:block flex-shrink-0">
                    {app.ai_score != null ? (
                      <ScoreBadge score={app.ai_score} />
                    ) : (
                      <span className="text-xs text-slate-400">Analyzing...</span>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">AI Score</p>
                  </div>

                  {/* Status selector */}
                  <div className="flex-shrink-0">
                    <select
                      value={app.status}
                      disabled={updatingId === app.id}
                      onChange={e => updateStatus(app.id, e.target.value)}
                      className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border-0 cursor-pointer
                        ${statusColors[app.status] || 'bg-slate-100 text-slate-600'}
                        disabled:opacity-50`}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  {/* View profile button */}
                  <Link to={`/hr/candidates/${app.id}`}
                    className="btn-secondary flex items-center gap-1 text-xs py-1.5 px-3 flex-shrink-0">
                    <Eye size={13} /> View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
