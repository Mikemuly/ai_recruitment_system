// =============================================================
// src/pages/ApplicantDashboard.jsx — Applicant's home dashboard
// =============================================================
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import Layout from '../components/shared/Layout';
import { applicationsAPI, jobsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Briefcase, Upload, CheckCircle, Clock, XCircle,
  FileText, Send, MapPin, Building2, AlertCircle, MessageSquare
} from 'lucide-react';
import { aiAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

const statusConfig = {
  submitted:   { label: 'Submitted',   color: 'bg-slate-100 text-slate-600',  icon: Clock },
  reviewing:   { label: 'Under Review',color: 'bg-blue-100 text-blue-700',    icon: Clock },
  shortlisted: { label: 'Shortlisted!',color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  interview:   { label: 'Interview 📅',color: 'bg-amber-100 text-amber-700',  icon: AlertCircle },
  offer:       { label: 'Offer 🎊',    color: 'bg-purple-100 text-purple-700',icon: CheckCircle },
  rejected:    { label: 'Not Selected',color: 'bg-red-100 text-red-600',      icon: XCircle },
  withdrawn:   { label: 'Withdrawn',   color: 'bg-slate-100 text-slate-400',  icon: XCircle },
};

// CV Upload Dropzone component
function CVUploadZone({ jobId, onSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [file, setFile] = useState(null);

  const onDrop = useCallback(accepted => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const handleSubmit = async () => {
    if (!file) { toast.error('Please select your CV file'); return; }
    setUploading(true);
    const formData = new FormData();
    formData.append('cv_file', file);
    formData.append('job_id', jobId);
    formData.append('cover_letter', coverLetter);
    try {
      await applicationsAPI.apply(formData);
      toast.success('Application submitted! AI is analyzing your CV... 🤖');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit application');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div {...getRootProps()} className={`
        border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
        ${isDragActive ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-400 hover:bg-slate-50'}
        ${file ? 'border-green-400 bg-green-50' : ''}
      `}>
        <input {...getInputProps()} />
        {file ? (
          <div className="flex items-center justify-center gap-2 text-green-700">
            <CheckCircle size={20} /> <span className="font-medium text-sm">{file.name}</span>
          </div>
        ) : (
          <>
            <Upload size={28} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-600">
              {isDragActive ? 'Drop your CV here' : 'Drag & drop your CV here'}
            </p>
            <p className="text-xs text-slate-400 mt-1">PDF or DOCX · Max 5MB</p>
          </>
        )}
      </div>
      <textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
        className="form-input resize-none text-sm" rows={3}
        placeholder="Cover letter (optional) — tell the recruiter why you're a great fit..." />
      <button onClick={handleSubmit} disabled={uploading || !file}
        className="btn-primary w-full flex items-center justify-center gap-2">
        {uploading ? <><div className="spinner w-4 h-4" /> Submitting & analyzing...</> : <><Send size={16} /> Submit Application</>}
      </button>
    </div>
  );
}

export default function ApplicantDashboard() {
  const { user }     = useAuth();
  const [applications, setApplications] = useState([]);
  const [recentJobs, setRecentJobs]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [applyJobId, setApplyJobId]     = useState(null);
  const [chatOpen, setChatOpen]         = useState(false);
  const [chatMsg, setChatMsg]           = useState('');
  const [chatHistory, setChatHistory]   = useState([]);
  const [chatLoading, setChatLoading]   = useState(false);

  const loadData = async () => {
    try {
      const [appsRes, jobsRes] = await Promise.all([
        applicationsAPI.myApplications(),
        jobsAPI.list({ per_page: 6 }),
      ]);
      setApplications(appsRes.data.applications || []);
      setRecentJobs(jobsRes.data.jobs || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const alreadyApplied = (jobId) => applications.some(a => a.job_id === jobId);

  const sendChat = async () => {
    if (!chatMsg.trim()) return;
    const msg = chatMsg;
    setChatMsg('');
    setChatHistory(h => [...h, { role: 'user', text: msg }]);
    setChatLoading(true);
    try {
      const res = await aiAPI.chatbot({ message: msg });
      setChatHistory(h => [...h, { role: 'ai', text: res.data.response }]);
    } catch {
      setChatHistory(h => [...h, { role: 'ai', text: 'Sorry, I am unavailable right now.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) return (
    <Layout title="My Dashboard">
      <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8" /></div>
    </Layout>
  );

  return (
    <Layout title="Applicant Dashboard">
      <div className="space-y-6">

        {/* Welcome */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-2xl p-6 text-white">
          <h2 className="text-xl font-bold">Welcome back, {user?.first_name}! 👋</h2>
          <p className="text-blue-100 text-sm mt-1">Track your applications and discover new opportunities in Kenya</p>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-sm font-medium"><span className="text-lg font-bold">{applications.length}</span> Applications</span>
            <span className="text-blue-300">·</span>
            <span className="text-sm font-medium">
              <span className="text-lg font-bold">{applications.filter(a => a.status === 'shortlisted').length}</span> Shortlisted
            </span>
          </div>
        </div>

        {/* Application pipeline */}
        <div className="card">
          <h3 className="section-title mb-4">My Applications</h3>
          {applications.length === 0 ? (
            <div className="text-center py-10">
              <FileText size={36} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No applications yet</p>
              <p className="text-slate-400 text-sm">Browse jobs below and apply with your CV</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map(app => {
                const sc = statusConfig[app.status] || statusConfig.submitted;
                const StatusIcon = sc.icon;
                return (
                  <div key={app.id}
                    className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Briefcase size={18} className="text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{app.job?.title}</p>
                      <p className="text-xs text-slate-500">{app.job?.company}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Applied {app.applied_at ? formatDistanceToNow(new Date(app.applied_at), { addSuffix: true }) : ''}
                      </p>
                    </div>
                    {app.ai_score != null && (
                      <div className="text-center hidden sm:block flex-shrink-0">
                        <p className="text-sm font-bold text-brand-700">{Math.round(app.ai_score)}%</p>
                        <p className="text-xs text-slate-400">AI Match</p>
                      </div>
                    )}
                    <span className={`badge text-xs flex-shrink-0 flex items-center gap-1 ${sc.color}`}>
                      <StatusIcon size={11} /> {sc.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Job listings */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Recent Job Openings</h3>
            <Link to="/jobs" className="text-brand-600 text-sm font-medium hover:underline">View all →</Link>
          </div>
          <div className="grid gap-3">
            {recentJobs.map(job => (
              <div key={job.id} className="border border-slate-100 rounded-xl p-4 hover:border-brand-200 hover:bg-brand-50/30 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{job.title}</p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Building2 size={11} /> {job.company?.name}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin size={11} /> {job.location}
                      </span>
                      <span className="badge bg-brand-100 text-brand-700 text-xs">{job.job_type}</span>
                    </div>
                    {job.salary_min && (
                      <p className="text-xs text-green-700 font-medium mt-1.5">
                        KES {job.salary_min?.toLocaleString()} – {job.salary_max?.toLocaleString()}/month
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {alreadyApplied(job.id) ? (
                      <span className="badge bg-green-100 text-green-700 text-xs flex items-center gap-1">
                        <CheckCircle size={11} /> Applied
                      </span>
                    ) : (
                      <button onClick={() => setApplyJobId(applyJobId === job.id ? null : job.id)}
                        className="btn-primary text-xs py-1.5 px-3">
                        {applyJobId === job.id ? 'Close' : 'Apply Now'}
                      </button>
                    )}
                    <Link to={`/jobs/${job.id}`} className="text-xs text-brand-600 hover:underline text-center">
                      View details
                    </Link>
                  </div>
                </div>

                {/* Inline apply form */}
                {applyJobId === job.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100 animate-slide-up">
                    <CVUploadZone jobId={job.id} onSuccess={() => { setApplyJobId(null); loadData(); }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating AI Chatbot */}
      <div className="fixed bottom-6 right-6 z-50">
        {chatOpen && (
          <div className="mb-4 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 animate-slide-up overflow-hidden">
            <div className="bg-brand-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <MessageSquare size={16} />
                <span className="font-medium text-sm">AI Career Assistant</span>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-brand-200 hover:text-white text-lg leading-none">×</button>
            </div>
            <div className="h-52 overflow-y-auto p-3 space-y-2 bg-slate-50">
              {chatHistory.length === 0 && (
                <p className="text-slate-400 text-xs text-center pt-4">
                  Hi {user?.first_name}! Ask me anything about jobs, CVs, or interviews.
                </p>
              )}
              {chatHistory.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-56 text-xs px-3 py-2 rounded-xl ${
                    m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                  }`}>{m.text}</div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 px-3 py-2 rounded-xl">
                    <div className="spinner w-3 h-3" />
                  </div>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-slate-100 flex gap-2">
              <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                className="form-input flex-1 text-xs py-2" placeholder="Ask me anything..." />
              <button onClick={sendChat} disabled={chatLoading} className="btn-primary text-xs px-3 py-2">Send</button>
            </div>
          </div>
        )}
        <button onClick={() => setChatOpen(!chatOpen)}
          className="w-14 h-14 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110">
          <MessageSquare size={22} />
        </button>
      </div>
    </Layout>
  );
}
