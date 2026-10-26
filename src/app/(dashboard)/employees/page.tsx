'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useNotification } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';
import RequirePermission from '../../../components/auth/RequirePermission';
import { Users, UserPlus, Search, Edit2, X, Briefcase } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  mobile: string;
  department: string;
  status: 'ACTIVE' | 'DISABLED';
  role: string;
  roleId: string;
  employeeCode: string;
  designation: string;
  employmentType: string;
  joiningDate: string | null;
  officeId: string | null;
  office: { id: string; name: string; city: string } | null;
}

interface RoleLite {
  id: string;
  name: string;
  description: string;
}
interface OfficeLite {
  id: string;
  name: string;
}

const emptyForm = () => ({
  name: '',
  email: '',
  password: 'Password123!',
  roleId: '',
  employeeCode: '',
  designation: '',
  department: '',
  mobile: '',
  employmentType: 'FULL_TIME',
  joiningDate: '',
  officeId: '',
});

type EmpForm = ReturnType<typeof emptyForm> & { id?: string };

export default function EmployeesPage() {
  return (
    <RequirePermission module="HR_EMPLOYEES" action="READ">
      <EmployeesContent />
    </RequirePermission>
  );
}

function EmployeesContent() {
  const queryClient = useQueryClient();
  const { showToast } = useNotification();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [officeFilter, setOfficeFilter] = useState('');
  const [form, setForm] = useState<EmpForm | null>(null);

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['employees', officeFilter],
    queryFn: async () =>
      (await api.get('/employees', { params: { officeId: officeFilter || undefined } })).data.data,
  });

  const { data: roles = [] } = useQuery<RoleLite[]>({
    queryKey: ['roles'],
    queryFn: async () => (await api.get('/roles')).data.data,
  });

  const { data: offices = [] } = useQuery<OfficeLite[]>({
    queryKey: ['offices'],
    queryFn: async () => (await api.get('/offices')).data.data,
  });

  const canWrite = hasPermission('HR_EMPLOYEES', 'WRITE');

  const saveMutation = useMutation({
    mutationFn: async (payload: EmpForm) => {
      const { id, ...rest } = payload;
      const body: any = { ...rest };
      if (!body.officeId) body.officeId = null;
      if (!body.joiningDate) body.joiningDate = null;
      if (id) {
        delete body.password; // password not managed here
        return (await api.put(`/employees/${id}`, body)).data;
      }
      return (await api.post('/employees', body)).data;
    },
    onSuccess: () => {
      showToast('Employee Saved', 'Employee record updated', 'success');
      setForm(null);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err: any) =>
      showToast('Error', err.response?.data?.message || 'Failed to save employee', 'error'),
  });

  const filtered = employees.filter(
    (e) => !search || `${e.name} ${e.email} ${e.employeeCode}`.toLowerCase().includes(search.toLowerCase()),
  );

  function set<K extends keyof EmpForm>(k: K, v: EmpForm[K]) {
    setForm((f) => (f ? { ...f, [k]: v } : f));
  }

  function openNew() {
    setForm({ ...emptyForm(), roleId: roles[0]?.id || '' });
  }

  function openEdit(e: Employee) {
    setForm({
      id: e.id,
      name: e.name,
      email: e.email,
      password: '',
      roleId: e.roleId || roles.find((r) => r.name === e.role)?.id || '',
      employeeCode: e.employeeCode || '',
      designation: e.designation || '',
      department: e.department || '',
      mobile: e.mobile || '',
      employmentType: e.employmentType || 'FULL_TIME',
      joiningDate: e.joiningDate ? String(e.joiningDate).slice(0, 10) : '',
      officeId: e.officeId || '',
    });
  }

  function submit() {
    if (!form?.name.trim() || !form.email.trim()) return;
    saveMutation.mutate(form);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-5 rounded-xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-thermal-400" /> Employee Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage employee records, branch assignment and employment details
          </p>
        </div>
        {canWrite && (
          <button
            onClick={openNew}
            className="px-4 py-2 bg-thermal-600 hover:bg-thermal-500 text-white font-semibold text-xs rounded-md flex items-center gap-2 self-start sm:self-auto transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Add Employee
          </button>
        )}
      </div>

      <div className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or code..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:border-thermal-500"
          />
        </div>
        <select
          value={officeFilter}
          onChange={(e) => setOfficeFilter(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-slate-300 focus:outline-none focus:border-thermal-500"
        >
          <option value="">All Offices</option>
          {offices.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      <div className="glass-card rounded-xl border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading employees...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No employees found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Designation</th>
                  <th className="py-3.5 px-4">Office</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center">
                          {e.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-white">{e.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {e.email}
                            {e.employeeCode && ` · ${e.employeeCode}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {e.designation || '—'}
                      <p className="text-[10px] text-slate-500">{e.role}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{e.office?.name || <span className="text-slate-600">Unassigned</span>}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                          e.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {canWrite && (
                        <button
                          onClick={() => openEdit(e)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {form && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-900 p-6 mb-8 max-h-[calc(100vh-3rem)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-thermal-400" />
                {form.id ? 'Edit Employee' : 'New Employee'}
              </h2>
              <button onClick={() => setForm(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Full Name *">
                <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Email *">
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} />
              </Field>
              {!form.id && (
                <Field label="Initial Password">
                  <input value={form.password} onChange={(e) => set('password', e.target.value)} className={inputCls} />
                </Field>
              )}
              <Field label="Employee Code">
                <input value={form.employeeCode} onChange={(e) => set('employeeCode', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Designation">
                <input value={form.designation} onChange={(e) => set('designation', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Department">
                <input value={form.department} onChange={(e) => set('department', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Mobile">
                <input value={form.mobile} onChange={(e) => set('mobile', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Employment Type">
                <select value={form.employmentType} onChange={(e) => set('employmentType', e.target.value)} className={inputCls}>
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERN">Intern</option>
                </select>
              </Field>
              <Field label="Joining Date">
                <input type="date" value={form.joiningDate} onChange={(e) => set('joiningDate', e.target.value)} className={inputCls} />
              </Field>
              <Field label="System Role">
                <select value={form.roleId} onChange={(e) => set('roleId', e.target.value)} className={inputCls}>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Assigned Office">
                <select value={form.officeId} onChange={(e) => set('officeId', e.target.value)} className={inputCls}>
                  <option value="">— None —</option>
                  {offices.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-5">
              <button onClick={() => setForm(null)} className="px-4 py-2 rounded-md text-xs font-medium text-slate-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={saveMutation.isPending}
                className="px-4 py-2 bg-thermal-600 hover:bg-thermal-500 text-white font-semibold text-xs rounded-md disabled:opacity-60 transition-colors"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-thermal-500';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
