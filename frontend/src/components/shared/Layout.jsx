// =============================================================
// src/components/shared/Layout.jsx — Main app layout with sidebar
// =============================================================
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Briefcase, Users, Building2, Bell,
  LogOut, Menu, X, ChevronRight, Settings, FileText,
  BarChart3, PlusCircle, Star
} from 'lucide-react';
import NotificationPanel from './NotificationPanel';

// Navigation items per role
const navItems = {
  admin: [
    { label: 'Dashboard',  icon: LayoutDashboard, href: '/admin' },
    { label: 'Companies',  icon: Building2,        href: '/admin?tab=companies' },
    { label: 'All Users',  icon: Users,            href: '/admin?tab=users' },
    { label: 'Analytics',  icon: BarChart3,        href: '/admin?tab=analytics' },
    { label: 'All Jobs',   icon: Briefcase,        href: '/jobs' },
  ],
  recruiter: [
    { label: 'Dashboard',     icon: LayoutDashboard, href: '/hr' },
    { label: 'Post a Job',    icon: PlusCircle,      href: '/hr/jobs/create' },
    { label: 'My Jobs',       icon: Briefcase,       href: '/hr?tab=jobs' },
    { label: 'Applicants',    icon: Users,           href: '/hr?tab=applicants' },
    { label: 'Top Candidates',icon: Star,            href: '/hr?tab=rankings' },
  ],
  applicant: [
    { label: 'My Dashboard',  icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Browse Jobs',   icon: Briefcase,       href: '/jobs' },
    { label: 'My Applications',icon: FileText,       href: '/dashboard?tab=applications' },
    { label: 'Profile',       icon: Settings,        href: '/dashboard?tab=profile' },
  ],
};

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const items = navItems[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (href) => {
    const [path, query] = href.split('?');
    if (location.pathname !== path) return false;
    const hrefTab = new URLSearchParams(query || '').get('tab');
    const locTab = new URLSearchParams(location.search).get('tab');
    // Items without ?tab= are active only on the default (no-tab) view
    if (!hrefTab) return !locTab;
    return hrefTab === locTab;
  };

  const roleColors = {
    admin:     'bg-purple-600',
    recruiter: 'bg-brand-600',
    applicant: 'bg-blue-600',
  };
  const roleLabels = { admin: 'Admin', recruiter: 'HR Recruiter', applicant: 'Applicant' };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900
        flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <div>
              <span className="text-white font-bold text-base">RecruitKE</span>
              <p className="text-slate-400 text-xs">AI Recruitment</p>
            </div>
          </Link>
          <button className="lg:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 ${roleColors[user?.role]} rounded-full flex items-center justify-center`}>
              <span className="text-white font-semibold text-sm">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <span className="text-xs text-slate-400">{roleLabels[user?.role]}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {isActive(item.href) && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="nav-link w-full text-red-400 hover:text-red-300 hover:bg-red-900/30"
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top header */}
        <header className="bg-white border-b border-slate-100 px-4 lg:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-slate-500 hover:text-slate-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              {showNotifications && (
                <NotificationPanel onClose={() => setShowNotifications(false)} />
              )}
            </div>

            {/* User avatar */}
            <div className={`w-8 h-8 ${roleColors[user?.role]} rounded-full flex items-center justify-center`}>
              <span className="text-white font-semibold text-xs">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
