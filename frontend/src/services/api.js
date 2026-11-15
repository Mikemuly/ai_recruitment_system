// =============================================================
// src/services/api.js — Axios instance with auth interceptors
// =============================================================
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach access token automatically ──
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 (expired token) ──
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            {},
            { headers: { Authorization: `Bearer ${refreshToken}` } }
          );
          const newToken = res.data.access_token;
          localStorage.setItem('access_token', newToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          original.headers['Authorization'] = `Bearer ${newToken}`;
          return api(original);
        } catch {
          // Refresh failed — force logout
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ── Convenience API functions ──

export const authAPI = {
  register:       (data) => api.post('/auth/register', data),
  login:          (data) => api.post('/auth/login', data),
  me:             ()     => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const jobsAPI = {
  list:       (params) => api.get('/jobs', { params }),
  get:        (id)     => api.get(`/jobs/${id}`),
  create:     (data)   => api.post('/jobs', data),
  update:     (id, d)  => api.put(`/jobs/${id}`, d),
  delete:     (id)     => api.delete(`/jobs/${id}`),
  myJobs:     ()       => api.get('/jobs/my'),
  applicants: (id)     => api.get(`/jobs/${id}/applicants`),
};

export const applicationsAPI = {
  apply:              (formData) => api.post('/applications/apply', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                      }),
  myApplications:     ()         => api.get('/applications/my'),
  updateStatus:       (id, data) => api.put(`/applications/${id}/status`, data),
  getNotifications:   ()         => api.get('/applications/notifications'),
  markNotificationsRead: ()      => api.put('/applications/notifications/read'),
};

export const aiAPI = {
  getAnalysis:   (appId) => api.get(`/ai/analyze/${appId}`),
  getQuestions:  (appId) => api.get(`/ai/questions/${appId}`),
  getRankings:   (jobId) => api.get(`/ai/rankings/${jobId}`),
  chatbot:       (data)  => api.post('/ai/chatbot', data),
};

export const adminAPI = {
  stats:         ()         => api.get('/admin/stats'),
  users:         ()         => api.get('/admin/users'),
  companies:     ()         => api.get('/admin/companies'),
  createCompany: (data)     => api.post('/admin/companies', data),
};

export default api;
