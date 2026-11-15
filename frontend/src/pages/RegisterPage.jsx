// =============================================================
// src/pages/RegisterPage.jsx
// =============================================================
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, UserPlus, BriefcaseBusiness, CheckCircle } from 'lucide-react';

const passwordRules = [
  { test: pw => pw.length >= 8,         label: 'At least 8 characters' },
  { test: pw => /[A-Z]/.test(pw),       label: 'One uppercase letter' },
  { test: pw => /[a-z]/.test(pw),       label: 'One lowercase letter' },
  { test: pw => /\d/.test(pw),          label: 'One number' },
];

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]       = useState({
    first_name: '', last_name: '', email: '', phone: '', password: '', confirm_password: '',
  });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'First name is required';
    if (!form.last_name.trim())  e.last_name  = 'Last name is required';
    if (!form.email.trim())      e.email      = 'Email is required';
    if (!form.password)          e.password   = 'Password is required';
    if (!passwordRules.every(r => r.test(form.password))) e.password = 'Password does not meet requirements';
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authAPI.register(form);
      const { user, access_token, refresh_token } = res.data;
      login(user, access_token, refresh_token);
      toast.success('Account created! Welcome to RecruitKE 🎉');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed.';
      toast.error(msg);
      if (err.response?.status === 409) setErrors({ email: 'This email is already registered' });
    } finally {
      setLoading(false);
    }
  };

  const field = (name, label, type = 'text', placeholder = '') => (
    <div>
      <label className="form-label">{label}</label>
      <input
        type={type}
        value={form[name]}
        onChange={e => setForm({ ...form, [name]: e.target.value })}
        className={`form-input ${errors[name] ? 'border-red-400' : ''}`}
        placeholder={placeholder}
      />
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-11 h-11 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg">
              <BriefcaseBusiness size={22} className="text-white" />
            </div>
            <h1 className="text-white font-bold text-2xl">RecruitKE</h1>
          </div>
          <p className="text-slate-300 text-sm">Create your free applicant account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              {field('first_name', 'First Name', 'text', 'John')}
              {field('last_name',  'Last Name',  'text', 'Kamau')}
            </div>

            {field('email', 'Email Address', 'email', 'john.kamau@gmail.com')}
            {field('phone', 'Phone Number (optional)', 'tel', '+254 7XX XXX XXX')}

            {/* Password with strength indicator */}
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className={`form-input pr-10 ${errors.password ? 'border-red-400' : ''}`}
                  placeholder="Create a strong password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Password rules */}
              {form.password && (
                <div className="mt-2 grid grid-cols-2 gap-1">
                  {passwordRules.map(r => (
                    <div key={r.label} className={`flex items-center gap-1 text-xs ${r.test(form.password) ? 'text-green-600' : 'text-slate-400'}`}>
                      <CheckCircle size={11} className={r.test(form.password) ? 'text-green-500' : 'text-slate-300'} />
                      {r.label}
                    </div>
                  ))}
                </div>
              )}
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                value={form.confirm_password}
                onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                className={`form-input ${errors.confirm_password ? 'border-red-400' : ''}`}
                placeholder="Repeat your password"
              />
              {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {loading ? <><div className="spinner w-4 h-4" /> Creating account...</> : <><UserPlus size={16} /> Create account</>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
