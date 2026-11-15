// =============================================================
// src/App.js — Root component with routing
// =============================================================
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import AdminDashboard   from './pages/AdminDashboard';
import HRDashboard      from './pages/HRDashboard';
import ApplicantDashboard from './pages/ApplicantDashboard';
import JobsListPage     from './pages/JobsListPage';
import JobDetailPage    from './pages/JobDetailPage';
import CreateJobPage    from './pages/CreateJobPage';
import ApplicantsPage   from './pages/ApplicantsPage';
import CandidateProfile from './pages/CandidateProfile';
import NotFoundPage     from './pages/NotFoundPage';

// ──────────────────────────────────────────────────────────────
// Route guard: redirect to login if not authenticated
// ──────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="spinner w-10 h-10 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to correct dashboard based on role
    const dashboards = { admin: '/admin', recruiter: '/hr', applicant: '/dashboard' };
    return <Navigate to={dashboards[user.role] || '/login'} replace />;
  }

  return children;
};

// ──────────────────────────────────────────────────────────────
// Root route: redirect logged-in users to their dashboard
// ──────────────────────────────────────────────────────────────
const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const dashboards = { admin: '/admin', recruiter: '/hr', applicant: '/dashboard' };
  return <Navigate to={dashboards[user.role] || '/login'} replace />;
};

// ──────────────────────────────────────────────────────────────
// App Routes
// ──────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"         element={<RootRedirect />} />
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/jobs"     element={<JobsListPage />} />
      <Route path="/jobs/:id" element={<JobDetailPage />} />

      {/* Admin only */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* HR Recruiter */}
      <Route path="/hr" element={
        <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
          <HRDashboard />
        </ProtectedRoute>
      } />
      <Route path="/hr/jobs/create" element={
        <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
          <CreateJobPage />
        </ProtectedRoute>
      } />
      <Route path="/hr/jobs/:id/applicants" element={
        <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
          <ApplicantsPage />
        </ProtectedRoute>
      } />
      <Route path="/hr/candidates/:appId" element={
        <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
          <CandidateProfile />
        </ProtectedRoute>
      } />

      {/* Applicant */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['applicant']}>
          <ApplicantDashboard />
        </ProtectedRoute>
      } />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

// ──────────────────────────────────────────────────────────────
// App root
// ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </Router>
    </AuthProvider>
  );
}
