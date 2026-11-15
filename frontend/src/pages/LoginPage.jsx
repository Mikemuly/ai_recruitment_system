// =============================================================
// src/pages/LoginPage.jsx — Authentication login page
// =============================================================
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn, BriefcaseBusiness } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await authAPI.login(form);
      const { user, access_token, refresh_token, message } = res.data;
      login(user, access_token, refresh_token);
      toast.success(message || 'Welcome back!');

      // Redirect to role-specific dashboard
      const dashboards = { admin: '/admin', recruiter: '/hr', applicant: '/dashboard' };
      navigate(dashboards[user.role] || '/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please try again.';
      toast.error(msg);
      if (err.response?.status === 401) {
        setErrors({ password: 'Invalid email or password' });
      }
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (email, password) => {
    setForm({ email, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg">
              <BriefcaseBusiness size={24} className="text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-white font-bold text-2xl">RecruitKE</h1>
              <p className="text-slate-400 text-sm">AI-Powered Recruitment</p>
            </div>
          </div>
          <p className="text-slate-300 text-sm">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Email */}
            <div>
              <label className="form-label">Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className={`form-input ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className={`form-input pr-10 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <><div className="spinner w-4 h-4" /> Signing in...</>
              ) : (
                <><LogIn size={16} /> Sign in</>
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-medium hover:underline">
              Create one for free
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center mb-3 font-medium uppercase tracking-wide">
              Demo accounts
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '👑 Admin',    email: 'admin@recruitke.co.ke',  pw: 'Admin@123' },
                { label: '💼 HR',       email: 'hr@safaricom.co.ke',     pw: 'HR@123456' },
                { label: '👤 Applicant',email: 'john.kamau@gmail.com',   pw: 'Test@123'  },
              ].map(d => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => quickLogin(d.email, d.pw)}
                  className="text-xs bg-slate-50 hover:bg-brand-50 hover:text-brand-700 text-slate-600 border border-slate-200 rounded-lg px-2 py-2 transition-colors font-medium"
                >
                  {d.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 text-center mt-2">
              Click a role to auto-fill credentials
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          © 2024 RecruitKE · Built for Kenya's workforce
        </p>
      </div>
    </div>
  );
}
