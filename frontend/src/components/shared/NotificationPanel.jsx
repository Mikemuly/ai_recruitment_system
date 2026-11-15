// =============================================================
// src/components/shared/NotificationPanel.jsx
// =============================================================
import React, { useEffect, useState } from 'react';
import { applicationsAPI } from '../../services/api';
import { Bell, CheckCheck, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const typeIcons = {
  application_received:  '📬',
  shortlisted:           '🎉',
  interview_scheduled:   '📅',
  offer_extended:        '🎊',
  application_rejected:  '📋',
  job_posted:            '💼',
  system:                '🔔',
};

export default function NotificationPanel({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applicationsAPI.getNotifications()
      .then(r => setNotifications(r.data.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await applicationsAPI.markNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-brand-600" />
          <span className="font-semibold text-sm text-slate-800">Notifications</span>
          {notifications.filter(n => !n.is_read).length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
              {notifications.filter(n => !n.is_read).length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={markAllRead} className="text-brand-600 hover:text-brand-700 p-1 rounded" title="Mark all read">
            <CheckCheck size={15} />
          </button>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
        {loading ? (
          <div className="py-8 text-center text-slate-400 text-sm">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">No notifications yet</div>
        ) : notifications.map(n => (
          <div
            key={n.id}
            className={`px-4 py-3 flex gap-3 hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-brand-50' : ''}`}
          >
            <span className="text-lg flex-shrink-0">{typeIcons[n.type] || '🔔'}</span>
            <div className="min-w-0">
              <p className={`text-sm ${!n.is_read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                {n.title}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
              <p className="text-xs text-slate-400 mt-1">
                {n.created_at ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true }) : ''}
              </p>
            </div>
            {!n.is_read && (
              <div className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0 mt-1.5" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
