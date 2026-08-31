'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useNotification } from '../../../context/NotificationContext';
import { User, Role, Application } from '../../../types';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  CheckCircle2,
  XCircle,
  KeyRound,
  Edit2,
  AppWindow,
} from 'lucide-react';

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const { showToast } = useNotification();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('Password123!');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'Password123!',
    roleId: '',
    applicationIds: [] as string[],
  });

  // Queries
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users', search, roleFilter, statusFilter],
    queryFn: async () => {
      const res = await api.get('/users', {
        params: { search, roleId: roleFilter, status: statusFilter },
      });
      return res.data.data;
    },
  });

  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/roles');
      return res.data.data;
    },
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ['applications'],
    queryFn: async () => {
      const res = await api.get('/applications');
      return res.data.data;
    },
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await api.post('/users', data);
      return res.data;
    },
    onSuccess: () => {
      showToast('User Created', 'New user account initialized successfully', 'success');
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: 'Password123!', roleId: '', applicationIds: [] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to create user', 'error');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.patch(`/users/${userId}/status`);
      return res.data;
    },
    onSuccess: (res) => {
      showToast('Status Updated', res.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, pass }: { userId: string; pass: string }) => {
      const res = await api.post(`/users/${userId}/reset-password`, { newPassword: pass });
      return res.data;
    },
    onSuccess: () => {
      showToast('Password Reset', 'User password has been updated', 'success');
      setShowResetModal(null);
    },
  });

  const handleAppCheckbox = (appId: string) => {
    setFormData((prev) => {
      const exists = prev.applicationIds.includes(appId);
      if (exists) {
        return { ...prev, applicationIds: prev.applicationIds.filter((id) => id !== appId) };
      } else {
        return { ...prev, applicationIds: [...prev.applicationIds, appId] };
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-thermal-500" /> User Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Provision users, assign roles, reset credentials, and control application access
          </p>
        </div>
        <button
          onClick={() => {
            if (roles.length > 0) setFormData((prev) => ({ ...prev, roleId: roles[0].id }));
            setShowCreateModal(true);
          }}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 self-start sm:self-auto transition-all"
        >
          <UserPlus className="w-4 h-4" /> Add New User
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-thermal-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-thermal-500"
          >
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-thermal-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DISABLED">DISABLED</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading user directory...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Assigned Apps</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-thermal-500/20 text-thermal-400 font-bold text-xs flex items-center justify-center border border-thermal-500/30">
                          {u.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-white">{u.name}</p>
                          <p className="text-[10px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-thermal-400 font-semibold text-[10px] flex items-center gap-1 w-fit">
                        <Shield className="w-3 h-3 text-thermal-500" /> {typeof u.role === 'object' ? (u.role as any).name : u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {u.applications && u.applications.length > 0 ? (
                          u.applications.map((app) => (
                            <span
                              key={app.id}
                              className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[9px] font-medium"
                            >
                              {app.code}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-500">None</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold inline-flex items-center gap-1 ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleStatusMutation.mutate(u.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition-colors"
                        >
                          {u.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => setShowResetModal(u)}
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full glass-card rounded-3xl p-6 border border-slate-800 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-thermal-500" /> Create Encon User Account
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createUserMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-thermal-500"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-thermal-500"
                  placeholder="rahul@encon.co.in"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-thermal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Role</label>
                <select
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-thermal-500"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} - {r.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Grant Application Access
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {applications.map((app) => (
                    <label
                      key={app.id}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 cursor-pointer hover:border-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={formData.applicationIds.includes(app.id)}
                        onChange={() => handleAppCheckbox(app.id)}
                        className="rounded border-slate-700 text-thermal-500 focus:ring-thermal-500"
                      />
                      <span className="text-xs font-semibold text-slate-200">{app.code}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  {createUserMutation.isPending ? 'Creating...' : 'Initialize User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card rounded-3xl p-6 border border-slate-800 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" /> Reset User Password
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Forced reset for <span className="text-white font-semibold">{showResetModal.email}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowResetModal(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    resetPasswordMutation.mutate({ userId: showResetModal.id, pass: newPassword })
                  }
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
