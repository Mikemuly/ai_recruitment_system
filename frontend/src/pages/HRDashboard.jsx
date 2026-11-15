// =============================================================
// src/pages/HRDashboard.jsx — HR Recruiter dashboard
// =============================================================
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '../components/shared/Layout';
import { jobsAPI, aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ScoreBadge, RankingBadge } from '../components/shared/ScoreRing';
import {
  PlusCircle, Briefcase, Users, Eye, ChevronRight, Clock,
  MapPin, TrendingUp, CheckCircle, XCircle, AlertCircle, Star, Search
} from 'lucide-react';

const statusConfig = {
  submitted:   { label: 'Submitted',   icon: Clock,       color: 'bg-slate-100 text-slate-600' },
  reviewing:   { label: 'Reviewing',   icon: Eye,         color: 'bg-blue-100 text-blue-700' },
  shortlisted: { label: 'Shortlisted', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  interview:   { label: 'Interview',   icon: AlertCircle, color: 'bg-amber-100 text-amber-700' },
  offer:       { label: 'Offer',       icon: TrendingUp,  color: 'bg-purple-100 text-purple-700' },
  rejected:    { label: 'Rejected',    icon: XCircle,     color: 'bg-red-100 text-red-700' },
};

function JobsList({ jobs, emptyAction }) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <Briefcase size={40} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500 font-medium">No jobs posted yet</p>
        <p className="text-slate-400 text-sm mt-1">Create your first job posting to start receiving applications</p>
        {emptyAction}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map(job => (
        <div key={job.id}
          className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Briefcase size={18} className="text-brand-700" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 text-sm truncate">{job.title}</p>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin size={11} /> {job.location || '—'}
                </span>
                <span className={`badge text-xs ${job.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {job.status}
                </span>
                {job.application_deadline && (
                  <span className="text-xs text-slate-400">
                    Deadline: {new Date(job.application_deadline).toLocaleDateString('en-KE')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0 ml-4">
            <div className="text-center hidden sm:block">
              <p className="text-lg font-bold text-slate-900">{job.applications_count || 0}</p>
              <p className="text-xs text-slate-400">Applicants</p>
            </div>
            <Link
              to={`/hr/jobs/${job.id}/applicants`}
              className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3">
              View <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

function ApplicantsOverview({ jobs, selectedJobId, onSelectJob, applicants, loading, search, setSearch }) {
  const selectedJob = jobs.find(j => String(j.id) === String(selectedJobId));

  const filtered = applicants.filter(a => {
    const q = search.toLowerCase();
    if (!q) return true;
    return `${a.applicant?.first_name || ''} ${a.applicant?.last_name || ''}`.toLowerCase().includes(q)
      || a.applicant?.email?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Applicants</h2>
        <p className="text-sm text-slate-500">Select a job to review candidates</p>
      </div>

      {jobs.length === 0 ? (
        <div className="card text-center py-12 text-slate-400 text-sm">
          No jobs yet. <Link to="/hr/jobs/create" className="text-brand-600 font-medium hover:underline">Post a job</Link> first.
        </div>
      ) : (
        <>
          <div className="card py-4">
            <label className="form-label">Job posting</label>
            <select
              className="form-input"
              value={selectedJobId || ''}
              onChange={e => onSelectJob(e.target.value || null)}
            >
              <option value="">Select a job...</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.applications_count || 0} applicants)
                </option>
              ))}
            </select>
          </div>

          {!selectedJobId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {jobs.map(job => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => onSelectJob(String(job.id))}
                  className="card text-left hover:border-brand-200 hover:bg-brand-50/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{job.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{job.location || '—'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-slate-900">{job.applications_count || 0}</p>
                      <p className="text-xs text-slate-400">Applicants</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedJobId && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="section-title">{selectedJob?.title || 'Selected job'}</h3>
                  <p className="text-xs text-slate-500">{applicants.length} applicants</p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/hr/jobs/${selectedJobId}/applicants`} className="btn-primary text-xs py-2 px-3">
                    Open full page
                  </Link>
                  <button type="button" onClick={() => onSelectJob(null)} className="btn-secondary text-xs py-2 px-3">
                    Clear
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="form-input pl-9" placeholder="Search candidates..." />
              </div>

              {loading ? (
                <div className="flex justify-center py-12"><div className="spinner w-8 h-8" /></div>
              ) : filtered.length === 0 ? (
                <div className="card text-center py-10 text-slate-400 text-sm">No applicants found</div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((app, idx) => {
                    const cfg = statusConfig[app.status] || statusConfig.submitted;
                    return (
                      <div key={app.id} className="card py-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-bold text-slate-400 w-5">#{idx + 1}</span>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {app.applicant?.first_name} {app.applicant?.last_name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{app.applicant?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {app.ai_score != null && <ScoreBadge score={app.ai_score} />}
                          {app.ranking_label && <RankingBadge label={app.ranking_label} />}
                          <span className={`badge ${cfg.color}`}>{cfg.label}</span>
                          <Link to={`/hr/candidates/${app.id}`}
                            className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1">
                            Profile <ChevronRight size={12} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RankingsTab({ jobs, selectedJobId, onSelectJob, rankings, jobMeta, loading }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Top Candidates</h2>
        <p className="text-sm text-slate-500">AI-ranked applicants by match score</p>
      </div>

      {jobs.length === 0 ? (
        <div className="card text-center py-12 text-slate-400 text-sm">
          No jobs yet. <Link to="/hr/jobs/create" className="text-brand-600 font-medium hover:underline">Post a job</Link> first.
        </div>
      ) : (
        <>
          <div className="card py-4">
            <label className="form-label">Rank candidates for</label>
            <select
              className="form-input"
              value={selectedJobId || ''}
              onChange={e => onSelectJob(e.target.value || null)}
            >
              <option value="">Select a job...</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.applications_count || 0} applicants)
                </option>
              ))}
            </select>
          </div>

          {!selectedJobId && (
            <div className="card text-center py-10 text-slate-400 text-sm">
              Choose a job above to see AI rankings
            </div>
          )}

          {selectedJobId && loading && (
            <div className="flex justify-center py-12"><div className="spinner w-8 h-8" /></div>
          )}

          {selectedJobId && !loading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="section-title">{jobMeta?.title || 'Rankings'}</h3>
                  <p className="text-xs text-slate-500">{rankings.length} candidates ranked</p>
                </div>
                <Link to={`/hr/jobs/${selectedJobId}/applicants`} className="btn-secondary text-xs py-2 px-3">
                  Manage applicants
                </Link>
              </div>

              {rankings.length === 0 ? (
                <div className="card text-center py-10 text-slate-400 text-sm">No applicants to rank yet</div>
              ) : (
                rankings.map((app) => (
                  <div key={app.id} className="card py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0">
                        #{app.rank || '—'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {app.applicant?.first_name} {app.applicant?.last_name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{app.applicant?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {app.ai_score != null ? <ScoreBadge score={app.ai_score} /> : (
                        <span className="text-xs text-slate-400">No score</span>
                      )}
                      {app.ranking_label && <RankingBadge label={app.ranking_label} />}
                      <Link to={`/hr/candidates/${app.id}`}
                        className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1">
                        <Star size={12} /> View
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function HRDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';
  const selectedJobId = searchParams.get('job');

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applicants, setApplicants] = useState([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [applicantSearch, setApplicantSearch] = useState('');
  const [rankings, setRankings] = useState([]);
  const [rankingsMeta, setRankingsMeta] = useState(null);
  const [rankingsLoading, setRankingsLoading] = useState(false);

  const setTab = useCallback((nextTab, jobId) => {
    const params = {};
    if (nextTab && nextTab !== 'overview') params.tab = nextTab;
    if (jobId) params.job = String(jobId);
    setSearchParams(params);
  }, [setSearchParams]);

  const selectJobForTab = useCallback((jobId) => {
    const params = { tab };
    if (jobId) params.job = String(jobId);
    setSearchParams(params);
  }, [tab, setSearchParams]);

  useEffect(() => {
    jobsAPI.myJobs()
      .then(r => setJobs(r.data.jobs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== 'applicants' || !selectedJobId) {
      setApplicants([]);
      return;
    }
    setApplicantsLoading(true);
    jobsAPI.applicants(selectedJobId)
      .then(r => setApplicants(r.data.applicants || []))
      .catch(() => setApplicants([]))
      .finally(() => setApplicantsLoading(false));
  }, [tab, selectedJobId]);

  useEffect(() => {
    if (tab !== 'rankings' || !selectedJobId) {
      setRankings([]);
      setRankingsMeta(null);
      return;
    }
    setRankingsLoading(true);
    aiAPI.getRankings(selectedJobId)
      .then(r => {
        setRankings(r.data.rankings || []);
        setRankingsMeta(r.data.job || null);
      })
      .catch(() => {
        setRankings([]);
        setRankingsMeta(null);
      })
      .finally(() => setRankingsLoading(false));
  }, [tab, selectedJobId]);

  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applications_count || 0), 0);
  const activeJobs = jobs.filter(j => j.status === 'active').length;

  const titles = {
    overview: 'HR Recruiter Dashboard',
    jobs: 'My Jobs',
    applicants: 'Applicants',
    rankings: 'Top Candidates',
  };

  if (loading) {
    return (
      <Layout title="HR Dashboard">
        <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8" /></div>
      </Layout>
    );
  }

  return (
    <Layout title={titles[tab] || 'HR Recruiter Dashboard'}>
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-brand-700 to-brand-600 rounded-2xl p-6 text-white flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold">Welcome back, {user?.first_name}! 👋</h2>
              <p className="text-brand-100 text-sm mt-1">
                {user?.company?.name || 'Your company'} · HR Recruiter
              </p>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-sm"><span className="font-bold text-lg">{activeJobs}</span> active jobs</span>
                <span className="text-brand-300">·</span>
                <span className="text-sm"><span className="font-bold text-lg">{totalApplicants}</span> total applicants</span>
              </div>
            </div>
            <Link to="/hr/jobs/create"
              className="bg-white text-brand-700 hover:bg-brand-50 font-semibold px-5 py-3 rounded-xl flex items-center gap-2 text-sm transition-colors shadow-lg">
              <PlusCircle size={18} /> Post a Job
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Active Jobs', value: activeJobs, color: 'text-brand-700 bg-brand-50', icon: Briefcase, action: () => setTab('jobs') },
              { label: 'Total Jobs', value: jobs.length, color: 'text-slate-700 bg-slate-100', icon: Briefcase, action: () => setTab('jobs') },
              { label: 'Total Applicants', value: totalApplicants, color: 'text-blue-700 bg-blue-50', icon: Users, action: () => setTab('applicants') },
              { label: 'Avg Applicants', value: jobs.length ? Math.round(totalApplicants / jobs.length) : 0,
                color: 'text-amber-700 bg-amber-50', icon: TrendingUp, action: () => setTab('rankings') },
            ].map(s => (
              <button key={s.label} type="button" onClick={s.action}
                className="card flex items-center gap-3 text-left hover:border-brand-200 transition-colors">
                <div className={`p-3 rounded-xl ${s.color.split(' ')[1]} ${s.color.split(' ')[0]}`}>
                  <s.icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="section-title">My Job Postings</h3>
              <div className="flex gap-2">
                <button type="button" onClick={() => setTab('jobs')} className="btn-secondary text-xs py-2 px-3">
                  View all
                </button>
                <Link to="/hr/jobs/create" className="btn-primary flex items-center gap-1.5 text-xs py-2 px-3">
                  <PlusCircle size={14} /> New Job
                </Link>
              </div>
            </div>
            <JobsList
              jobs={jobs.slice(0, 5)}
              emptyAction={
                <Link to="/hr/jobs/create" className="btn-primary inline-flex items-center gap-2 mt-4">
                  <PlusCircle size={16} /> Post a Job
                </Link>
              }
            />
          </div>
        </div>
      )}

      {tab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">My Jobs</h2>
              <p className="text-sm text-slate-500">{jobs.length} job postings</p>
            </div>
            <Link to="/hr/jobs/create" className="btn-primary inline-flex items-center gap-2">
              <PlusCircle size={16} /> Post a Job
            </Link>
          </div>
          <div className="card">
            <JobsList
              jobs={jobs}
              emptyAction={
                <Link to="/hr/jobs/create" className="btn-primary inline-flex items-center gap-2 mt-4">
                  <PlusCircle size={16} /> Post a Job
                </Link>
              }
            />
          </div>
        </div>
      )}

      {tab === 'applicants' && (
        <ApplicantsOverview
          jobs={jobs}
          selectedJobId={selectedJobId}
          onSelectJob={selectJobForTab}
          applicants={applicants}
          loading={applicantsLoading}
          search={applicantSearch}
          setSearch={setApplicantSearch}
        />
      )}

      {tab === 'rankings' && (
        <RankingsTab
          jobs={jobs}
          selectedJobId={selectedJobId}
          onSelectJob={selectJobForTab}
          rankings={rankings}
          jobMeta={rankingsMeta}
          loading={rankingsLoading}
        />
      )}

      {!['overview', 'jobs', 'applicants', 'rankings'].includes(tab) && (
        <div className="card text-center py-12">
          <p className="text-slate-500 mb-3">Unknown HR section.</p>
          <button type="button" onClick={() => setTab('overview')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      )}
    </Layout>
  );
}
