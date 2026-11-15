// =============================================================
// src/pages/JobDetailPage.jsx — Single job detail page
// =============================================================
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { jobsAPI, applicationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeft, MapPin, Building2, Clock, Briefcase,
  Upload, CheckCircle, Send, GraduationCap, DollarSign
} from 'lucide-react';

function ApplySection({ jobId, onSuccess }) {
  const [file, setFile]             = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [uploading, setUploading]   = useState(false);

  const onDrop = useCallback(accepted => { if (accepted[0]) setFile(accepted[0]); }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1, maxSize: 5 * 1024 * 1024,
  });

  const submit = async () => {
    if (!file) { toast.error('Please select your CV'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('cv_file', file);
    fd.append('job_id', jobId);
    fd.append('cover_letter', coverLetter);
    try {
      await applicationsAPI.apply(fd);
      toast.success('Application submitted! AI is analyzing your CV 🤖');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 sticky top-6">
      <h3 className="font-bold text-slate-900 mb-4">Apply for this Job</h3>
      <div {...getRootProps()} className={`
        border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all mb-3
        ${isDragActive ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'}
        ${file ? 'border-green-400 bg-green-50' : ''}
      `}>
        <input {...getInputProps()} />
        {file ? (
          <div className="flex items-center justify-center gap-2 text-green-700">
            <CheckCircle size={18} /> <span className="text-sm font-medium">{file.name}</span>
          </div>
        ) : (
          <>
            <Upload size={24} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm text-slate-600 font-medium">Upload your CV</p>
            <p className="text-xs text-slate-400">PDF or DOCX · Max 5MB</p>
          </>
        )}
      </div>
      <textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
        rows={4} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none mb-3
          focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-400"
        placeholder="Cover letter (optional)..." />
      <button onClick={submit} disabled={uploading || !file}
        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl
          flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50">
        {uploading ? <><div className="spinner w-4 h-4" /> Submitting...</> : <><Send size={16} /> Submit Application</>}
      </button>
      <p className="text-xs text-slate-400 text-center mt-2">AI will analyze your CV instantly</p>
    </div>
  );
}

export default function JobDetailPage() {
  const { id }  = useParams();
  const { user } = useAuth();
  const [job, setJob]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    jobsAPI.get(id).then(r => setJob(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="spinner w-8 h-8" />
    </div>
  );
  if (!job) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-500">Job not found.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 px-6 py-4">
        <Link to="/jobs" className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand-700 transition-colors w-fit">
          <ArrowLeft size={16} /> Back to jobs
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Building2 size={24} className="text-brand-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
                <p className="text-slate-600 font-medium mt-0.5">{job.company?.name}</p>
                <div className="flex flex-wrap gap-3 mt-3">
                  <span className="flex items-center gap-1 text-sm text-slate-500"><MapPin size={13} /> {job.location}</span>
                  <span className="flex items-center gap-1 text-sm text-slate-500"><Briefcase size={13} /> {job.job_type}</span>
                  <span className="flex items-center gap-1 text-sm text-slate-500"><GraduationCap size={13} /> {job.education_required}</span>
                  {job.salary_min && (
                    <span className="flex items-center gap-1 text-sm text-green-700 font-medium">
                      <DollarSign size={13} /> KES {job.salary_min?.toLocaleString()} – {job.salary_max?.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Required skills */}
          {job.required_skills?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
              <h2 className="font-bold text-slate-900 mb-3">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.map(s => (
                  <span key={s} className="bg-brand-100 text-brand-800 text-sm font-medium px-3 py-1 rounded-full">{s}</span>
                ))}
              </div>
              {job.preferred_skills?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-slate-500 mb-2">Nice to have:</p>
                  <div className="flex flex-wrap gap-2">
                    {job.preferred_skills.map(s => (
                      <span key={s} className="bg-slate-100 text-slate-600 text-sm px-3 py-1 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
            <h2 className="font-bold text-slate-900 mb-3">About the Role</h2>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{job.description}</p>
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
            <h2 className="font-bold text-slate-900 mb-3">Responsibilities & Requirements</h2>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{job.requirements}</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {applied ? (
            <div className="bg-white rounded-2xl border border-green-200 shadow-card p-6 text-center">
              <CheckCircle size={36} className="mx-auto text-green-600 mb-3" />
              <p className="font-bold text-green-800">Application Submitted!</p>
              <p className="text-green-600 text-sm mt-1">AI is analyzing your CV</p>
              {user && (
                <Link to="/dashboard" className="btn-primary w-full mt-4 inline-block text-center">
                  View My Applications
                </Link>
              )}
            </div>
          ) : user?.role === 'applicant' ? (
            <ApplySection jobId={job.id} onSuccess={() => setApplied(true)} />
          ) : !user ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 text-center">
              <p className="text-slate-600 text-sm mb-4">Create a free account to apply for this job</p>
              <Link to="/register" className="btn-primary w-full block">Create Account</Link>
              <Link to="/login" className="btn-secondary w-full block mt-2">Sign in</Link>
            </div>
          ) : null}

          {/* Job meta */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 mt-4">
            <h3 className="font-semibold text-slate-800 text-sm mb-3">Job Details</h3>
            <dl className="space-y-2 text-sm">
              {[
                ['Experience', `${job.min_experience}–${job.max_experience} years`],
                ['Type', job.job_type],
                ['Education', job.education_required],
                ['Deadline', job.application_deadline ? new Date(job.application_deadline).toLocaleDateString('en-KE') : 'Open'],
                ['Applicants', job.applications_count || 0],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="font-medium text-slate-700">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}


// =============================================================
// src/pages/NotFoundPage.jsx
// =============================================================
export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-8xl font-black text-brand-600 mb-4">404</p>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Page not found</h1>
        <p className="text-slate-500 mb-6">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          ← Go home
        </Link>
      </div>
    </div>
  );
}
