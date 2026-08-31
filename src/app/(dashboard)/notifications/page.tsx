'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useNotification } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';
import { NotificationItem } from '../../../types';
import { Bell, Send, CheckCircle, AlertTriangle, Info, Megaphone } from 'lucide-react';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useNotification();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'ANNOUNCEMENT' | 'ALERT' | 'SYSTEM'>('ANNOUNCEMENT');

  const { data: notifications = [], isLoading } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data.data;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/notifications/${id}/read`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/notifications/announcement', { title, message, type });
      return res.data;
    },
    onSuccess: () => {
      showToast('Announcement Published', 'Broadcast message sent to all active users', 'success');
      setTitle('');
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to publish announcement', 'error');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-thermal-500" /> Notifications & Broadcast Center
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          System notifications, high-priority thermal project alerts, and director announcements
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Notifications List */}
        <div className="lg:col-span-2 space-y-3">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400 glass-card rounded-2xl">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 glass-card rounded-2xl">
              No notifications available
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border glass-card transition-all flex items-start justify-between gap-3 ${
                  n.isRead ? 'border-slate-800 text-slate-400' : 'border-thermal-500/40 text-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-thermal-500/10 text-thermal-400 border border-thermal-500/20 mt-0.5">
                    {n.type === 'ALERT' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : n.type === 'ANNOUNCEMENT' ? (
                      <Megaphone className="w-4 h-4 text-thermal-400" />
                    ) : (
                      <Info className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      {n.title}
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-thermal-500 animate-ping"></span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">{n.message}</p>
                    <span className="text-[9px] text-slate-500 mt-2 block">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => markReadMutation.mutate(n.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
                    title="Mark as read"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Publish Announcement Form (Admin / Director Only) */}
        {['ADMIN', 'CO', 'GM', 'PRODUCTION_HEAD'].includes((user?.role || '').toUpperCase()) && (
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-thermal-500" /> Broadcast System Announcement
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createAnnouncementMutation.mutate();
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-thermal-500"
                  placeholder="Announcement Title"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-thermal-500"
                >
                  <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
                  <option value="ALERT">ALERT</option>
                  <option value="SYSTEM">SYSTEM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Message</label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-thermal-500"
                  placeholder="Detailed announcement details..."
                />
              </div>

              <button
                type="submit"
                disabled={createAnnouncementMutation.isPending}
                className="w-full py-2.5 bg-gradient-to-r from-thermal-600 to-thermal-500 hover:from-thermal-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" /> Broadcast Announcement
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
