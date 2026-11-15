// =============================================================
// src/pages/CreateJobPage.jsx — Post a new job form
// =============================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/shared/Layout';
import { jobsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { PlusCircle, X, Briefcase, MapPin, DollarSign } from 'lucide-react';

const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'remote'];
const EDU_LEVELS = ['any', 'certificate', 'diploma', 'bachelor', 'master', 'phd'];

export default function CreateJobPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput]     = useState('');
  const [prefSkillInput, setPrefSkillInput] = useState('');

  const [form, setForm] = useState({
    title: '', description: '', requirements: '',
    required_skills: [], preferred_skills: [],
    min_experience: 0, max_experience: 5,
    education_required: 'bachelor', job_type: 'full-time',
    salary_min: '', salary_max: '',
    location: 'Nairobi, Kenya',
    application_deadline: '',
    status: 'active',
  });

  const [errors, setErrors] = useState({});

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const addSkill = (type) => {
    const raw = type === 'required' ? skillInput : prefSkillInput;
    const skill = raw.trim();
    if (!skill) return;
    const key = type === 'required' ? 'required_skills' : 'preferred_skills';
    if (!form[key].includes(skill)) set(key, [...form[key], skill]);
    type === 'required' ? setSkillInput('') : setPrefSkillInput('');
  };

  const removeSkill = (type, skill) => {
    const key = type === 'required' ? 'required_skills' : 'preferred_skills';
    set(key, form[key].filter(s => s !== skill));
  };

  const handleSkillKeyDown = (e, type) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(type); }
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim())        e.title       = 'Job title is required';
    if (!form.description.trim())  e.description = 'Description is required';
    if (!form.requirements.trim()) e.requirements = 'Requirements are required';
    if (form.required_skills.length === 0) e.required_skills = 'Add at least one required skill';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error('Please fix the form errors'); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        salary_min: form.salary_min ? parseFloat(form.salary_min) : null,
        salary_max: form.salary_max ? parseFloat(form.salary_max) : null,
        min_experience: parseFloat(form.min_experience),
        max_experience: parseFloat(form.max_experience),
      };
      await jobsAPI.create(payload);
      toast.success('Job posted successfully! 🎉');
      navigate('/hr');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  const SkillTag = ({ skill, type }) => (
    <span className="inline-flex items-center gap-1.5 bg-brand-100 text-brand-800 text-xs font-medium px-2.5 py-1 rounded-full">
      {skill}
      <button type="button" onClick={() => removeSkill(type, skill)}
        className="text-brand-500 hover:text-brand-800 transition-colors">
        <X size={11} />
      </button>
    </span>
  );

  return (
    <Layout title="Post a New Job">
      <div className="max-w-3xl mx-auto">
        <div className="card">
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
            <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
              <Briefcase size={20} className="text-brand-700" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Create Job Posting</h2>
              <p className="text-slate-500 text-sm">Fill in the details below to attract the right candidates</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Basic info */}
            <section>
              <h3 className="section-title mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Job Title *</label>
                  <input value={form.title} onChange={e => set('title', e.target.value)}
                    className={`form-input ${errors.title ? 'border-red-400' : ''}`}
                    placeholder="e.g. Senior Software Engineer" />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Job Type</label>
                    <select value={form.job_type} onChange={e => set('job_type', e.target.value)} className="form-input">
                      {JOB_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label flex items-center gap-1"><MapPin size={13} />Location</label>
                    <input value={form.location} onChange={e => set('location', e.target.value)}
                      className="form-input" placeholder="Nairobi, Kenya" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Min Experience (years)</label>
                    <input type="number" min="0" step="0.5" value={form.min_experience}
                      onChange={e => set('min_experience', e.target.value)} className="form-input" />
                  </div>
                  <div>
                    <label className="form-label">Max Experience (years)</label>
                    <input type="number" min="0" step="0.5" value={form.max_experience}
                      onChange={e => set('max_experience', e.target.value)} className="form-input" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Education Required</label>
                    <select value={form.education_required} onChange={e => set('education_required', e.target.value)} className="form-input">
                      {EDU_LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Application Deadline</label>
                    <input type="date" value={form.application_deadline}
                      onChange={e => set('application_deadline', e.target.value)} className="form-input" />
                  </div>
                </div>

                {/* Salary (KES) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label flex items-center gap-1"><DollarSign size={13} />Min Salary (KES)</label>
                    <input type="number" value={form.salary_min}
                      onChange={e => set('salary_min', e.target.value)}
                      className="form-input" placeholder="e.g. 80000" />
                  </div>
                  <div>
                    <label className="form-label flex items-center gap-1"><DollarSign size={13} />Max Salary (KES)</label>
                    <input type="number" value={form.salary_max}
                      onChange={e => set('salary_max', e.target.value)}
                      className="form-input" placeholder="e.g. 150000" />
                  </div>
                </div>
              </div>
            </section>

            {/* Skills */}
            <section className="border-t border-slate-100 pt-5">
              <h3 className="section-title mb-4">Skills Requirements</h3>
              <div className="space-y-4">

                {/* Required skills */}
                <div>
                  <label className="form-label">Required Skills * <span className="text-slate-400 font-normal">(press Enter to add)</span></label>
                  <div className="flex gap-2">
                    <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={e => handleSkillKeyDown(e, 'required')}
                      className={`form-input flex-1 ${errors.required_skills ? 'border-red-400' : ''}`}
                      placeholder="e.g. Python, React, MySQL..." />
                    <button type="button" onClick={() => addSkill('required')} className="btn-primary px-3">
                      <PlusCircle size={16} />
                    </button>
                  </div>
                  {errors.required_skills && <p className="text-red-500 text-xs mt-1">{errors.required_skills}</p>}
                  {form.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.required_skills.map(s => <SkillTag key={s} skill={s} type="required" />)}
                    </div>
                  )}
                </div>

                {/* Preferred skills */}
                <div>
                  <label className="form-label">Preferred Skills <span className="text-slate-400 font-normal">(nice to have)</span></label>
                  <div className="flex gap-2">
                    <input value={prefSkillInput} onChange={e => setPrefSkillInput(e.target.value)}
                      onKeyDown={e => handleSkillKeyDown(e, 'preferred')}
                      className="form-input flex-1" placeholder="e.g. Docker, TypeScript..." />
                    <button type="button" onClick={() => addSkill('preferred')} className="btn-secondary px-3">
                      <PlusCircle size={16} />
                    </button>
                  </div>
                  {form.preferred_skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.preferred_skills.map(s => <SkillTag key={s} skill={s} type="preferred" />)}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Description & requirements */}
            <section className="border-t border-slate-100 pt-5">
              <h3 className="section-title mb-4">Job Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Job Description *</label>
                  <textarea rows={5} value={form.description} onChange={e => set('description', e.target.value)}
                    className={`form-input resize-none ${errors.description ? 'border-red-400' : ''}`}
                    placeholder="Describe the role, team, and what the candidate will do day-to-day..." />
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                </div>
                <div>
                  <label className="form-label">Responsibilities & Requirements *</label>
                  <textarea rows={5} value={form.requirements} onChange={e => set('requirements', e.target.value)}
                    className={`form-input resize-none ${errors.requirements ? 'border-red-400' : ''}`}
                    placeholder="List the key responsibilities and requirements for this role..." />
                  {errors.requirements && <p className="text-red-500 text-xs mt-1">{errors.requirements}</p>}
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button type="button" onClick={() => navigate('/hr')} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 px-6">
                {loading ? <><div className="spinner w-4 h-4" /> Publishing...</> : <><Briefcase size={16} /> Publish Job</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
