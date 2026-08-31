'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useNotification } from '../../../context/NotificationContext';
import { Application, User } from '../../../types';
import { AppWindow, ExternalLink, ShieldCheck, UserCheck, Plus, Trash2 } from 'lucide-react';

export default function ApplicationGatewayPage() {
  const queryClient = useQueryClient();
  const { showToast } = useNotification();

  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Queries
  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ['applications'],
    queryFn: async () => {
      const res = await api.get('/applications');
      return res.data.data;
    },
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data.data;
    },
  });

  // Mutations
  const grantAccessMutation = useMutation({
    mutationFn: async ({ userId, applicationId }: { userId: string; applicationId: string }) => {
      const res = await api.post('/applications/access/grant', { userId, applicationId });
      return res.data;
    },
    onSuccess: (res) => {
      showToast('Access Granted', res.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  const revokeAccessMutation = useMutation({
    mutationFn: async ({ userId, applicationId }: { userId: string; applicationId: string }) => {
      const res = await api.post('/applications/access/revoke', { userId, applicationId });
      return res.data;
    },
    onSuccess: (res) => {
      showToast('Access Revoked', res.message, 'info');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  const handleLaunch = async (appCode: string) => {
    try {
      const res = await api.get(`/applications/launch/${appCode}`);
      if (res.data.success && res.data.data.redirectUrl) {
        window.open(res.data.data.redirectUrl, '_blank');
      }
    } catch (err: any) {
      showToast('Launch Error', err.response?.data?.message || 'Failed to launch application', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <AppWindow className="w-5 h-5 text-thermal-500" /> Application Access Control
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Delegation and user access rights management for Encon RFQ & Offer Automation System
        </p>
      </div>

      {/* Application Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {applications.map((app) => (
          <div
            key={app.id}
            className="glass-card glass-card-hover p-6 rounded-3xl border border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-thermal-400 px-2.5 py-1 rounded-lg bg-thermal-500/10 border border-thermal-500/20">
                  {app.code}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    app.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {app.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-white">{app.name}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{app.description}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" /> {app.activeUsersCount || 0} Active Users
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedApp(app)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                >
                  Manage Users
                </button>
                <button
                  onClick={() => handleLaunch(app.code)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-thermal-600 to-thermal-500 hover:from-thermal-500 hover:to-amber-500 text-white text-xs font-bold shadow-md flex items-center gap-1"
                >
                  Launch <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Application User Access Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full glass-card rounded-3xl p-6 border border-slate-800 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-thermal-500" /> Manage Access: {selectedApp.name}
                </h2>
                <p className="text-xs text-slate-400">Grant or revoke user access rights for this application</p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {users.map((u) => {
                const hasAccess = u.applications?.some((a) => a.id === selectedApp.id);
                return (
                  <div
                    key={u.id}
                    className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-thermal-500/20 text-thermal-400 font-bold text-xs flex items-center justify-center border border-thermal-500/30">
                        {u.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{u.name}</p>
                        <p className="text-[10px] text-slate-400">{u.email} • {typeof u.role === 'object' ? (u.role as any).name : u.role}</p>
                      </div>
                    </div>

                    {hasAccess ? (
                      <button
                        onClick={() =>
                          revokeAccessMutation.mutate({ userId: u.id, applicationId: selectedApp.id })
                        }
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Revoke Access
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          grantAccessMutation.mutate({ userId: u.id, applicationId: selectedApp.id })
                        }
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Grant Access
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
