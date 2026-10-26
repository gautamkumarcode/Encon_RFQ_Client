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
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react';

/**
 * One entry per capability module the backend catalogue (backend/src/config/capabilities.ts)
 * knows about, so an admin reads plain English instead of a raw module code. Keep the two
 * lists in step: a module missing here still renders, but under a generated "XYZ Module" label.
 */
const MODULE_CONFIG: Record<string, { label: string; desc: string; category: string; legacy?: boolean }> = {
  USER_MGMT: { label: 'User Management', desc: 'Create users, change role assignment, enable or disable accounts', category: 'SYSTEM' },
  ROLE_MGMT: { label: 'Role & Permission Matrix', desc: 'Edit which capabilities each role holds; create or delete custom roles', category: 'SYSTEM' },
  APP_MGMT: { label: 'Application Access', desc: 'Grant or revoke single sign-on access to connected apps', category: 'SYSTEM' },
  DASHBOARD: { label: 'Executive Dashboard', desc: 'View the landing dashboard and its KPI summary', category: 'SYSTEM' },
  ANALYTICS: { label: 'Employee Analytics', desc: 'View technical, commercial and performance analytics for all staff', category: 'SYSTEM' },
  ACTIVITY_LOGS: { label: 'Audit Activity Logs', desc: 'Inspect system activity trails and security logs', category: 'SYSTEM' },
  NOTIFICATIONS: { label: 'Notifications Center', desc: 'Send and receive system-wide announcement notifications', category: 'SYSTEM' },

  RFQ_LIST: { label: 'RFQ Tracker - Open & View Own', desc: 'See the tracker: own and assigned enquiries, plus anything under review', category: 'RFQ' },
  RFQ_VIEW_ALL: { label: 'RFQ Tracker - View Every Record', desc: 'See all enquiries in the system, not only the ones assigned to you', category: 'RFQ' },
  RFQ_ENTRY: { label: 'RFQ Entry - Create & Edit', desc: 'Create an enquiry and edit its core fields (item, description, quantity, notes)', category: 'RFQ' },
  RFQ_CLIENT_DETAILS: { label: 'RFQ Entry - Update Client Details', desc: 'Change client name, contact person, mobile, email and address on an enquiry', category: 'RFQ' },
  RFQ_SOURCE_DOC: { label: 'RFQ Entry - Mail Source & Raw Content', desc: 'View and edit the captured enquiry mail, sender details and raw content', category: 'RFQ' },
  RFQ_ASSIGNMENT: { label: 'RFQ - Change Assignment', desc: 'Re-assign the sales and technical owners of an enquiry', category: 'RFQ' },
  RFQ_STATUS: { label: 'RFQ - Change Status', desc: 'Move an enquiry between Open, In Progress, Under Review, Closed and Regret', category: 'RFQ' },
  RFQ_FOLLOWUP: { label: 'RFQ - Follow-up Log', desc: 'Add follow-up entries. Deleting them is a separate right below', category: 'RFQ' },
  RFQ_FOLLOWUP_ADMIN: { label: 'RFQ - Delete Anyone\u2019s Follow-ups', desc: 'Remove follow-up entries recorded by other users', category: 'RFQ' },
  RFQ_CLIENT_FOLLOWUP: { label: 'RFQ - Send Client Follow-up Mail', desc: 'Send a follow-up email directly to the client from the enquiry', category: 'RFQ' },
  RFQ_ENTRY_DELETE: { label: 'RFQ - Delete Enquiry', desc: 'Delete a single enquiry record', category: 'RFQ' },
  RFQ_BULK_DELETE: { label: 'RFQ - Bulk Delete', desc: 'Delete many enquiries at once from the tracker', category: 'RFQ' },
  RFQ_ATTACHMENT: { label: 'RFQ - Attachments', desc: 'Upload documents against an enquiry. Deleting uploads is separate', category: 'RFQ' },
  RFQ_ATTACHMENT_DELETE: { label: 'RFQ - Delete Attachments', desc: 'Remove attachments uploaded by any user', category: 'RFQ' },
  RFQ_DRIVE: { label: 'RFQ - Google Drive Folder', desc: 'Open and sync the Drive folder created for an enquiry', category: 'RFQ' },
  RFQ_IMPORT: { label: 'RFQ - Import from Excel', desc: 'Bulk-create enquiries by uploading a spreadsheet', category: 'RFQ' },
  RFQ_INBOX_SYNC: { label: 'RFQ - Sync Enquiry Inbox', desc: 'Pull new enquiries from the shared mailbox and view sync status', category: 'RFQ' },
  RFQ_OFFER_MAPPING: { label: 'RFQ - Auto-map Offer Documents', desc: 'Attach generated offer PDFs to enquiries automatically', category: 'RFQ' },
  RFQ_DIRECTORY: { label: 'RFQ - Client Directory', desc: 'Look up and save client details in the shared directory', category: 'RFQ' },
  RFQ_COSTING: { label: 'RFQ - Costing Sheets', desc: 'Open costing tools (Tundish Dryer, VLPH, Ladle Dryer) and edit rate inputs', category: 'RFQ' },
  RFQ_REVIEW: { label: 'RFQ - Review & Verification', desc: 'Send an enquiry for review and complete the verification stage checks', category: 'RFQ' },
  RFQ_APPROVAL: { label: 'RFQ - Manager Approval', desc: 'Grant the final managerial sign-off on an enquiry', category: 'RFQ' },
  RFQ_OFFERS: { label: 'RFQ - Offer Generator', desc: 'Generate the official PDF proposal and sync with the Offer Generator', category: 'RFQ' },
  RFQ_MGMT: { label: 'RFQ - General Management (legacy umbrella)', desc: 'Old blanket grant, kept only while unmigrated checks read it. Superseded by the sub-capabilities above - do not grant new roles through this row', category: 'RFQ', legacy: true },

  ORDER_MGMT: { label: 'Order in Hand', desc: 'View the order register. WRITE creates and edits orders plus Excel import/export; DELETE removes orders', category: 'ORDERS' },
  ORDER_PAYMENT: { label: 'Order Payments Ledger', desc: 'Record and amend payments received, misc payments and other charges against an order', category: 'ORDERS' },
  CLIENT_MGMT: { label: 'Client Master', desc: 'View the client directory. WRITE adds or edits client records and addresses', category: 'ORDERS' },

  TALLY: { label: 'Tally ERP Data & Books', desc: 'Read vouchers, ledgers, debtors/creditors, bank transactions and the sales/purchase registers synced from Tally', category: 'TALLY' },

  HR_OFFICES: { label: 'Office / Branch Management', desc: 'Create branches, set their location, geofence radius and working-hour rules', category: 'HR' },
  HR_EMPLOYEES: { label: 'Employee Directory', desc: 'Manage employee records - branch assignment, designation, join date, employment type', category: 'HR' },
  HR_ATTENDANCE: { label: 'Attendance Register & Reports', desc: "View every employee's attendance; edit, regularize punches and export the monthly report", category: 'HR' },
  HR_HOLIDAYS: { label: 'Holiday Calendar', desc: 'Maintain the company / branch holiday list shown in both attendance calendars', category: 'HR' },
  ATTENDANCE_CLOCK: { label: 'Clock In / Out (Self-service)', desc: 'Lets the role clock itself in/out from the attendance app - grant to every staff role', category: 'HR' },
};

/** Sections on the matrix, in display order. Unknown categories fall to the end. */
const CATEGORY_ORDER = ['SYSTEM', 'HR', 'RFQ', 'ORDERS', 'TALLY'];
const CATEGORY_TITLES: Record<string, string> = {
  SYSTEM: 'System Administration',
  HR: 'HR · People & Attendance',
  RFQ: 'RFQ Tracker & Lifecycle',
  ORDERS: 'Orders & Clients',
  TALLY: 'Tally Integration',
};

export default function RoleManagementPage() {
  const queryClient = useQueryClient();
  const { showToast, showConfirm } = useNotification();

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
  // Collapsible category dropdowns - start closed so the matrix opens as a
  // scannable list of sections instead of ~74 rows.
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

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

  // Group permissions by module, then by section, so ~50 capability rows stay scannable
  const modulesList = Array.from(new Set(permissions.map((p) => p.module)));
  const categoryOf = (mod: string) => MODULE_CONFIG[mod]?.category ?? 'OTHER';
  const sections = [
    ...CATEGORY_ORDER,
    ...Array.from(new Set(modulesList.map(categoryOf))).filter((c) => !CATEGORY_ORDER.includes(c)),
  ]
    .map((cat) => ({ cat, mods: modulesList.filter((m) => categoryOf(m) === cat) }))
    .filter((group) => group.mods.length > 0);

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
              Configure granular role-based access control (RBAC) across System, HR, RFQ, Orders & Tally modules
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const anyClosed = sections.some((s) => !openSections[s.cat]);
                    setOpenSections(Object.fromEntries(sections.map((s) => [s.cat, anyClosed])));
                  }}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-400 border border-slate-800 bg-slate-950 hover:text-white hover:border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <ChevronsUpDown className="w-3.5 h-3.5" />
                  {sections.some((s) => !openSections[s.cat]) ? 'Expand all' : 'Collapse all'}
                </button>
                <span className="text-xs text-slate-400 font-mono">
                  {selectedPermIds.length} / {permissions.length} Permissions Active
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {sections.map((section) => {
              const sectionPerms = permissions.filter((p) => section.mods.includes(p.module));
              const grantedCount = sectionPerms.filter((p) => selectedPermIds.includes(p.id)).length;
              const isOpen = !!openSections[section.cat];
              return (
              <div key={section.cat} className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden">
                {/* Section dropdown header - click to expand the whole area */}
                <button
                  type="button"
                  onClick={() => setOpenSections((prev) => ({ ...prev, [section.cat]: !prev[section.cat] }))}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ChevronDown className={`w-4 h-4 shrink-0 text-thermal-400 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                    <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">
                      {CATEGORY_TITLES[section.cat] ?? section.cat}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">{section.mods.length} modules</span>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-bold ${
                      activeRole.name === 'ADMIN' || (sectionPerms.length > 0 && grantedCount === sectionPerms.length)
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : grantedCount > 0
                          ? 'bg-thermal-500/10 text-thermal-400 border-thermal-500/30'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                  >
                    {activeRole.name === 'ADMIN' ? 'ALL' : `${grantedCount}/${sectionPerms.length}`} granted
                  </span>
                </button>
                {isOpen && (
                <div className="px-4 pb-4 pt-1 space-y-4 border-t border-slate-800">
            {section.mods.map((mod) => {
              const modPerms = permissions.filter((p) => p.module === mod);
              const allModSelected = modPerms.every((p) => selectedPermIds.includes(p.id)) || activeRole.name === 'ADMIN';
              const cfg = MODULE_CONFIG[mod] || { label: `${mod} Module`, desc: 'Raw capability module - add a readable label in MODULE_CONFIG', category: section.cat };

              return (
                <div key={mod} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-thermal-400 uppercase tracking-wider">
                          {cfg.label}
                        </h3>
                        {cfg.category === 'RFQ' && !cfg.legacy && (
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-extrabold text-emerald-400 rounded-md">
                            RFQ Sub-Module
                          </span>
                        )}
                        {cfg.legacy && (
                          <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-[9px] font-extrabold text-amber-400 rounded-md">
                            LEGACY - DO NOT GRANT
                          </span>
                        )}
                        <span className="text-[9px] font-mono text-slate-600">{mod}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{cfg.desc}</p>
                    </div>

                    {activeRole.name !== 'ADMIN' && (
                      <button
                        type="button"
                        onClick={() => toggleModuleAll(mod)}
                        className="text-[10px] font-bold text-slate-400 hover:text-white underline shrink-0"
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
                )}
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
