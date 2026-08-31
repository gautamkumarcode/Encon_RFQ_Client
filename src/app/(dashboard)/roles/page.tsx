'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useNotification } from '../../../context/NotificationContext';
import { Role, Permission } from '../../../types';
import {
  ShieldAlert,
  Check,
  Users,
  Save,
  ShieldCheck,
  Plus,
  Trash2,
  X,
  Lock,
} from 'lucide-react';

export default function RoleManagementPage() {
  const queryClient = useQueryClient();
  const { showToast, showConfirm } = useNotification();

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);

  // Create Role modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  // Queries
  const { data: roles = [], isLoading: loadingRoles } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/roles');
      return res.data.data;
    },
  });

  const { data: permissions = [] } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await api.get('/roles/permissions');
      return res.data.data;
    },
  });

  // Select active role
  const activeRole = roles.find((r) => r.id === (selectedRoleId || roles[0]?.id));

  React.useEffect(() => {
    if (activeRole) {
      const currentIds = activeRole.permissions?.map((p) => p.id) || [];
      setSelectedPermIds(currentIds);
    }
  }, [activeRole?.id, roles]);

  // Save Permissions Mutation
  const savePermissionsMutation = useMutation({
    mutationFn: async () => {
      if (!activeRole) return;
      const res = await api.put(`/roles/${activeRole.id}/permissions`, {
        permissionIds: selectedPermIds,
      });
      return res.data;
    },
    onSuccess: (res) => {
      showToast('Permissions Saved', res.message || 'Role access matrix updated successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err: any) => {
      showToast('Save Failed', err?.response?.data?.message || err.message || 'Failed to update permissions', 'error');
    },
  });

  // Create Role Mutation
  const createRoleMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/roles', {
        name: newRoleName,
        description: newRoleDesc,
      });
      return res.data;
    },
    onSuccess: (res) => {
      showToast('Role Created', res.message || 'New role created', 'success');
      setIsCreateOpen(false);
      setNewRoleName('');
      setNewRoleDesc('');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err: any) => {
      showToast('Create Error', err?.response?.data?.message || err.message || 'Failed to create role', 'error');
    },
  });

  // Delete Role Handler
  const handleDeleteRole = (role: Role) => {
    if (role.name === 'ADMIN' || role.isSystem) {
      showToast('Protected System Role', 'System default roles cannot be deleted', 'warning');
      return;
    }

    showConfirm({
      title: `Delete Role "${role.name}"?`,
      message: `Are you sure you want to delete role "${role.name}"? This action cannot be undone.`,
      confirmText: 'Delete Role',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await api.delete(`/roles/${role.id}`);
          showToast('Role Deleted', res.data.message || 'Role removed successfully', 'info');
          setSelectedRoleId(null);
          queryClient.invalidateQueries({ queryKey: ['roles'] });
        } catch (err: any) {
          showToast('Delete Error', err?.response?.data?.message || err.message || 'Failed to delete role', 'error');
        }
      },
    });
  };

  const togglePermission = (permId: string) => {
    if (activeRole?.name === 'ADMIN') {
      showToast('System Guard', 'Admin role automatically has full system bypass permissions', 'warning');
      return;
    }
    setSelectedPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const toggleModuleAll = (moduleName: string) => {
    if (activeRole?.name === 'ADMIN') return;
    const modPermIds = permissions.filter((p) => p.module === moduleName).map((p) => p.id);
    const allSelected = modPermIds.every((id) => selectedPermIds.includes(id));

    if (allSelected) {
      setSelectedPermIds((prev) => prev.filter((id) => !modPermIds.includes(id)));
    } else {
      setSelectedPermIds((prev) => Array.from(new Set([...prev, ...modPermIds])));
    }
  };

  // Group permissions by module
  const modulesList = Array.from(new Set(permissions.map((p) => p.module)));

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-card p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-thermal-500/10 border border-thermal-500/30 text-thermal-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">
              Role & Permission Matrix
            </h1>
            <p className="text-[11px] text-slate-400">
              Configure granular role-based access control (RBAC) across system modules
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-thermal-400" /> New Role
          </button>

          {activeRole && activeRole.name !== 'ADMIN' && (
            <button
              onClick={() => savePermissionsMutation.mutate()}
              disabled={savePermissionsMutation.isPending}
              className="px-4 py-1.5 bg-thermal-500 hover:bg-thermal-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" /> {savePermissionsMutation.isPending ? 'Saving...' : 'Save Matrix'}
            </button>
          )}
        </div>
      </div>

      {/* ROLE SELECTION GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {loadingRoles ? (
          <div className="col-span-4 p-8 text-center text-slate-400">Loading roles...</div>
        ) : (
          roles.map((r) => {
            const isSelected = r.id === (activeRole?.id || roles[0]?.id);
            return (
              <div
                key={r.id}
                onClick={() => setSelectedRoleId(r.id)}
                className={`p-3.5 rounded-xl text-left border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? 'bg-thermal-500/10 border-thermal-500/50 shadow-md'
                    : 'glass-card border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      {r.name === 'ADMIN' && <Lock className="w-3 h-3 text-amber-400" />}
                      {r.name}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                      <Users className="w-3 h-3 text-thermal-400" /> {r.userCount || 0}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{r.description}</p>
                </div>

                {!r.isSystem && r.name !== 'ADMIN' && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRole(r);
                      }}
                      className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3 h-3" /> Delete Role
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* PERMISSION MATRIX */}
      {activeRole && (
        <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Permissions assigned to {activeRole.name}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">{activeRole.description}</p>
            </div>
            {activeRole.name === 'ADMIN' ? (
              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-bold rounded-xl">
                🔒 System Admin (Full System Access Bypass)
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-mono">
                {selectedPermIds.length} / {permissions.length} Permissions Active
              </span>
            )}
          </div>

          <div className="space-y-4">
            {modulesList.map((mod) => {
              const modPerms = permissions.filter((p) => p.module === mod);
              const allModSelected = modPerms.every((p) => selectedPermIds.includes(p.id)) || activeRole.name === 'ADMIN';

              return (
                <div key={mod} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-thermal-400 uppercase tracking-wider">
                      {mod} Module
                    </h3>
                    {activeRole.name !== 'ADMIN' && (
                      <button
                        type="button"
                        onClick={() => toggleModuleAll(mod)}
                        className="text-[10px] font-bold text-slate-400 hover:text-white underline"
                      >
                        {allModSelected ? 'Deselect Module' : 'Select All in Module'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                    {modPerms.map((perm) => {
                      const isChecked = selectedPermIds.includes(perm.id) || activeRole.name === 'ADMIN';
                      return (
                        <div
                          key={perm.id}
                          onClick={() => togglePermission(perm.id)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-thermal-500/10 border-thermal-500/40 text-white'
                              : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-semibold block text-slate-200">{perm.action}</span>
                            <span className="text-[10px] text-slate-400 line-clamp-1">{perm.description}</span>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 ${
                              isChecked
                                ? 'bg-thermal-500 border-thermal-500 text-white'
                                : 'border-slate-700'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE NEW ROLE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card bg-obsidian-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-thermal-400" /> Create Custom Role
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createRoleMutation.mutate();
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Role Title / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. COSTING_ENGINEER"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white uppercase placeholder-slate-500 focus:outline-none focus:border-thermal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Description / Access Scope</label>
                <textarea
                  rows={3}
                  placeholder="Describe responsibility & module access for this role..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-thermal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRoleMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-thermal-500 hover:bg-thermal-600 text-white shadow-md transition-all"
                >
                  {createRoleMutation.isPending ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
