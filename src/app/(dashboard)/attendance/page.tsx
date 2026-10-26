'use client';

import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useNotification } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';
import RequirePermission from '../../../components/auth/RequirePermission';
import AttendanceDetailsModal, { PunchDetail } from '../../../components/hr/AttendanceDetailsModal';
import EmployeeSummaryTable, { buildEmployeeSummary } from '../../../components/hr/EmployeeSummaryTable';
import AttendanceCalendar, { monthKey } from '../../../components/hr/AttendanceCalendar';
import HolidayManager, { Holiday } from '../../../components/hr/HolidayManager';
import { CalendarClock, Search, Edit2, Trash2, X, Eye, CalendarDays, List, CalendarRange, PartyPopper, Download } from 'lucide-react';

interface Punch extends PunchDetail {}
interface AttendanceRow {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  officeId: string | null;
  officeName: string;
  date: string;
  status: 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT' | 'LEAVE';
  clockIn: Punch;
  clockOut: Punch;
  totalWorkMinutes: number | null;
  source?: string;
  remark: string;
}

const fmtTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—');
const fmtDay = (iso: string) => new Date(iso).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDur = (mins?: number | null) => (mins == null ? '—' : `${Math.floor(mins / 60)}h ${mins % 60}m`);
const toLocalInput = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const statusCls: Record<string, string> = {
  PRESENT: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  LATE: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  HALF_DAY: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  ABSENT: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  LEAVE: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
};

function isoDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** First day of the current month -> today, as ISO date strings. */
function thisMonthRange() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: first.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
}

export default function AttendancePage() {
  return (
    <RequirePermission module="HR_ATTENDANCE" action="READ">
      <AttendanceContent />
    </RequirePermission>
  );
}

function AttendanceContent() {
  const queryClient = useQueryClient();
  const { showToast } = useNotification();
  const { hasPermission } = useAuth();

  const [from, setFrom] = useState(isoDaysAgo(7));
  const [to, setTo] = useState(isoDaysAgo(0));
  const [officeFilter, setOfficeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [edit, setEdit] = useState<AttendanceRow | null>(null);
  const [view, setView] = useState<AttendanceRow | null>(null);
  // 'log' = day-by-day rows, 'summary' = one row per employee, 'calendar' = month grid.
  const [tab, setTab] = useState<'log' | 'summary' | 'calendar'>('log');
  // Set when drilling into an employee from the summary tab.
  const [person, setPerson] = useState('');
  const [calMonth, setCalMonth] = useState(monthKey());
  const [showHolidays, setShowHolidays] = useState(false);
  const [exporting, setExporting] = useState(false);

  // In calendar mode the query range follows the visible month, not the From/To inputs.
  const calRange = useMemo(() => {
    const [yy, mm] = calMonth.split('-').map(Number);
    return {
      from: `${calMonth}-01`,
      to: new Date(Date.UTC(yy, mm - 1, new Date(yy, mm, 0).getDate())).toISOString().slice(0, 10),
    };
  }, [calMonth]);
  const effFrom = tab === 'calendar' ? calRange.from : from;
  const effTo = tab === 'calendar' ? calRange.to : to;

  const { data: rows = [], isLoading } = useQuery<AttendanceRow[]>({
    queryKey: ['attendance-register', effFrom, effTo, officeFilter],
    queryFn: async () =>
      (
        await api.get('/attendance/register', {
          params: { from: effFrom, to: effTo, officeId: officeFilter || undefined },
        })
      ).data.data,
  });

  const { data: offices = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['offices'],
    queryFn: async () => (await api.get('/offices')).data.data,
  });

  // Holidays for the visible range; office-specific ones included when filtering.
  const { data: holidays = [] } = useQuery<Holiday[]>({
    queryKey: ['holidays', effFrom, effTo, officeFilter],
    queryFn: async () =>
      (
        await api.get('/holidays', {
          params: { from: effFrom, to: effTo, officeId: officeFilter || undefined },
        })
      ).data.data,
  });

  const canWrite = hasPermission('HR_ATTENDANCE', 'WRITE');
  const canDelete = hasPermission('HR_ATTENDANCE', 'DELETE');
  const canManageHolidays = hasPermission('HR_HOLIDAYS', 'WRITE');
  const canDeleteHolidays = hasPermission('HR_HOLIDAYS', 'DELETE');

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => (await api.put(`/attendance/${payload.id}`, payload)).data,
    onSuccess: () => {
      showToast('Attendance Updated', 'Record regularized', 'success');
      setEdit(null);
      queryClient.invalidateQueries({ queryKey: ['attendance-register'] });
    },
    onError: (err: any) =>
      showToast('Error', err.response?.data?.message || 'Failed to update', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/attendance/${id}`)).data,
    onSuccess: () => {
      showToast('Deleted', 'Attendance record removed', 'success');
      queryClient.invalidateQueries({ queryKey: ['attendance-register'] });
    },
    onError: (err: any) =>
      showToast('Error', err.response?.data?.message || 'Failed to delete', 'error'),
  });

  const filtered = rows.filter(
    (r) =>
      (!person || r.userId === person) &&
      (!search || `${r.userName} ${r.userEmail}`.toLowerCase().includes(search.toLowerCase())),
  );

  const summary = useMemo(() => buildEmployeeSummary(filtered), [filtered]);
  const personName = person ? rows.find((r) => r.userId === person)?.userName || 'Employee' : '';

  // Download the monthly report as .xlsx. Sends the exact filters currently
  // on screen (range, office, drilled-in employee) so file matches the view.
  async function exportReport() {
    setExporting(true);
    try {
      const r = await api.get('/attendance/export', {
        params: { from: effFrom, to: effTo, officeId: officeFilter || undefined, userId: person || undefined },
        responseType: 'blob',
      });
      const blob = new Blob([r.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const cd = String(r.headers?.['content-disposition'] ?? '');
      const fn = cd.match(/filename="?([^"]+)"?/)?.[1] || `encon_attendance_${effFrom}_to_${effTo}.xlsx`;
      const a = document.createElement('a');
      a.href = url;
      a.download = fn;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Export Ready', fn, 'success');
    } catch {
      showToast('Error', 'Failed to export report', 'error');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-3xl border border-slate-800">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-thermal-500" /> Attendance Register
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          View and regularize employee clock-in / clock-out across branches
        </p>
      </div>

      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3 items-end justify-between">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">Office</label>
            <select value={officeFilter} onChange={(e) => setOfficeFilter(e.target.value)} className={inputCls}>
              <option value="">All Offices</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              const m = thisMonthRange();
              setFrom(m.from);
              setTo(m.to);
            }}
            className="px-3 py-2 rounded-xl text-[11px] font-bold bg-thermal-500/10 text-thermal-400 border border-thermal-500/30 hover:bg-thermal-500/20 flex items-center gap-1.5"
            title="Set range to the current month"
          >
            <CalendarDays className="w-3.5 h-3.5" /> This Month
          </button>
        </div>
        <div className="relative w-full md:w-56">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-thermal-500"
          />
        </div>
      </div>

      {/* View tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTab('log')}
          className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 transition-colors ${
            tab === 'log'
              ? 'bg-thermal-500/15 text-thermal-400 border-thermal-500/40'
              : 'bg-slate-900 text-slate-400 border-slate-700/60 hover:text-white'
          }`}
        >
          <List className="w-3.5 h-3.5" /> Daily Log
        </button>
        <button
          onClick={() => {
            setTab('summary');
            setPerson('');
          }}
          className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 transition-colors ${
            tab === 'summary'
              ? 'bg-thermal-500/15 text-thermal-400 border-thermal-500/40'
              : 'bg-slate-900 text-slate-400 border-slate-700/60 hover:text-white'
          }`}
        >
          <CalendarClock className="w-3.5 h-3.5" /> Monthly Summary by Employee
        </button>
        <button
          onClick={() => setTab('calendar')}
          className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 transition-colors ${
            tab === 'calendar'
              ? 'bg-thermal-500/15 text-thermal-400 border-thermal-500/40'
              : 'bg-slate-900 text-slate-400 border-slate-700/60 hover:text-white'
          }`}
        >
          <CalendarRange className="w-3.5 h-3.5" /> Calendar
        </button>
        <div className="ml-auto flex items-center gap-2">
        {person && tab !== 'summary' && (
          <button
            onClick={() => setPerson('')}
            className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 flex items-center gap-1.5"
            title="Show all employees again"
          >
            {personName} <X className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={exportReport}
          disabled={exporting}
          className="px-3.5 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 disabled:opacity-40 transition-colors"
          title="Export monthly report (Excel: summary + daily log + holidays)"
        >
          <Download className="w-3.5 h-3.5" /> {exporting ? 'Exporting…' : 'Export Excel'}
        </button>
        <button
          onClick={() => setShowHolidays(true)}
          className="px-3.5 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 bg-violet-500/10 text-violet-300 border-violet-500/30 hover:bg-violet-500/20 transition-colors"
          title="Manage the holiday calendar"
        >
          <PartyPopper className="w-3.5 h-3.5" /> Holidays
        </button>
        </div>
      </div>

      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading attendance...</div>
        ) : tab === 'calendar' ? (
          <AttendanceCalendar
            month={calMonth}
            onMonthChange={setCalMonth}
            rows={filtered}
            holidays={holidays}
            personMode={!!person}
            onSelectRecord={(r) => setView(r as AttendanceRow)}
          />
        ) : tab === 'summary' ? (
          <EmployeeSummaryTable
            summary={summary}
            onDrill={(id) => {
              setPerson(id);
              setTab('log');
            }}
          />
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No records for this range</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Office</th>
                  <th className="py-3.5 px-4">In</th>
                  <th className="py-3.5 px-4">Out</th>
                  <th className="py-3.5 px-4">Hours</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white">{r.userName}</p>
                      <p className="text-[10px] text-slate-400">{r.userEmail}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{fmtDay(r.date)}</td>
                    <td className="py-3.5 px-4 text-slate-300">{r.officeName || '—'}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-200">{fmtTime(r.clockIn?.time)}</span>
                      {r.clockIn?.geofenceOk === false && (
                        <span className="ml-1 text-[9px] text-amber-400">⚠</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-200">{fmtTime(r.clockOut?.time)}</span>
                      {r.clockOut?.geofenceOk === false && (
                        <span className="ml-1 text-[9px] text-amber-400">⚠</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{fmtDur(r.totalWorkMinutes)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusCls[r.status] || ''}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setView(r)}
                          className="p-1.5 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 text-slate-300 border border-slate-600/40"
                          title="Punch details (device, IP, GPS)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canWrite && (
                          <button
                            onClick={() => setEdit(r)}
                            className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                            title="Regularize"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this attendance record?')) deleteMutation.mutate(r.id);
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {edit && (
        <EditModal
          row={edit}
          offices={offices}
          saving={updateMutation.isPending}
          onClose={() => setEdit(null)}
          onSave={(payload) => updateMutation.mutate(payload)}
        />
      )}

      {view && (
        <AttendanceDetailsModal row={view} offices={offices} onClose={() => setView(null)} />
      )}

      {showHolidays && (
        <HolidayManager
          offices={offices}
          canWrite={canManageHolidays}
          canDelete={canDeleteHolidays}
          onClose={() => setShowHolidays(false)}
        />
      )}
    </div>
  );
}

function EditModal({
  row,
  offices,
  saving,
  onClose,
  onSave,
}: {
  row: AttendanceRow;
  offices: { id: string; name: string }[];
  saving: boolean;
  onClose: () => void;
  onSave: (payload: any) => void;
}) {
  const [form, setForm] = useState({
    id: row.id,
    status: row.status,
    officeId: row.officeId || '',
    clockInTime: toLocalInput(row.clockIn?.time),
    clockOutTime: toLocalInput(row.clockOut?.time),
    remark: row.remark || '',
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-lg w-full glass-card rounded-3xl p-6 border border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h2 className="text-lg font-bold text-white">Regularize Attendance</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          {row.userName} · {fmtDay(row.date)}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Clock In">
            <input
              type="datetime-local"
              value={form.clockInTime}
              onChange={(e) => set('clockInTime', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Clock Out">
            <input
              type="datetime-local"
              value={form.clockOutTime}
              onChange={(e) => set('clockOutTime', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => set('status', e.target.value as any)} className={inputCls}>
              {['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'LEAVE'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Office">
            <select value={form.officeId} onChange={(e) => set('officeId', e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Remark">
              <input value={form.remark} onChange={(e) => set('remark', e.target.value)} className={inputCls} />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white">
            Cancel
          </button>
          <button
            onClick={() =>
              onSave({
                ...form,
                clockInTime: form.clockInTime ? new Date(form.clockInTime).toISOString() : null,
                clockOutTime: form.clockOutTime ? new Date(form.clockOutTime).toISOString() : null,
                officeId: form.officeId || null,
              })
            }
            disabled={saving}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-thermal-500';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-300 mb-1">{label}</label>
      {children}
    </div>
  );
}
