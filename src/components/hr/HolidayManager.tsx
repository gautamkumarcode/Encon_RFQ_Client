'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { X, Plus, Trash2, CalendarDays, MapPin } from 'lucide-react';

export interface Holiday {
  id: string;
  name: string;
  date: string; // ISO UTC-midnight
  officeId: string | null;
  officeName: string;
  allOffices: boolean;
}

const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

/**
 * Holiday calendar maintenance: add / remove company-wide or branch-specific
 * holidays. Changes reflect immediately in both attendance calendars.
 */
export default function HolidayManager({
  offices,
  canWrite,
  canDelete,
  onClose,
}: {
  offices: { id: string; name: string }[];
  canWrite: boolean;
  canDelete: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { showToast } = useNotification();
  const [form, setForm] = useState({ name: '', date: '', officeId: '' });

  const { data: holidays = [] } = useQuery<Holiday[]>({
    queryKey: ['holidays'],
    queryFn: async () => (await api.get('/holidays')).data.data,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['holidays'] });
    queryClient.invalidateQueries({ queryKey: ['attendance-register'] });
  };

  const createMutation = useMutation({
    mutationFn: async (payload: any) => (await api.post('/holidays', payload)).data,
    onSuccess: () => {
      showToast('Holiday Added', 'Visible in attendance calendars', 'success');
      setForm({ name: '', date: '', officeId: '' });
      invalidate();
    },
    onError: (err: any) =>
      showToast('Error', err.response?.data?.message || 'Failed to add holiday', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/holidays/${id}`)).data,
    onSuccess: () => {
      showToast('Deleted', 'Holiday removed', 'success');
      invalidate();
    },
    onError: (err: any) =>
      showToast('Error', err.response?.data?.message || 'Failed to delete holiday', 'error'),
  });

  const upcoming = holidays.filter((h) => new Date(h.date) >= new Date(new Date().toDateString()));
  const past = holidays.filter((h) => new Date(h.date) < new Date(new Date().toDateString()));

  function renderGroup(title: string, list: Holiday[]) {
    if (!list.length) return null;
    return (
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">{title}</p>
        <div className="space-y-1.5">
          {list.map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between rounded-md bg-slate-800/40 border border-slate-700/60 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{h.name}</p>
                <p className="text-[10px] text-slate-400 flex items-center gap-2">
                  <span>{fmtDay(h.date)}</span>
                  <span className={`flex items-center gap-1 ${h.allOffices ? 'text-thermal-400' : 'text-violet-300'}`}>
                    {h.allOffices ? (
                      'All branches'
                    ) : (
                      <>
                        <MapPin className="w-2.5 h-2.5" /> {h.officeName || 'Branch'}
                      </>
                    )}
                  </span>
                </p>
              </div>
              {canDelete && (
                <button
                  onClick={() => {
                    if (window.confirm(`Delete holiday "${h.name}"?`)) deleteMutation.mutate(h.id);
                  }}
                  className="p-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0 ml-3"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mb-8 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-thermal-400" />
            <h2 className="text-base font-bold text-white">Holiday Calendar</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {canWrite && (
            <div className="rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="px-4 py-2 rounded-t-lg bg-slate-800/40 border-b border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Add Holiday</span>
              </div>
              <div className="p-4 space-y-3">
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Holiday name (e.g. Diwali, Founders Day)"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-thermal-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-thermal-500"
                  />
                  <select
                    value={form.officeId}
                    onChange={(e) => setForm((f) => ({ ...f, officeId: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-thermal-500"
                  >
                    <option value="">All branches</option>
                    {offices.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} only
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() =>
                    form.name.trim() &&
                    form.date &&
                    createMutation.mutate({ name: form.name.trim(), date: form.date, officeId: form.officeId || null })
                  }
                  disabled={!form.name.trim() || !form.date || createMutation.isPending}
                  className="w-full py-2 rounded-md bg-thermal-600 hover:bg-thermal-500 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> {createMutation.isPending ? 'Adding...' : 'Add Holiday'}
                </button>
                <p className="text-[10px] text-slate-500">
                  Branch-specific holidays (e.g. a city holiday) show only for that branch when the register is filtered by office; employees see both.
                </p>
              </div>
            </div>
          )}

          {holidays.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-6">No holidays added yet</p>
          ) : (
            <>
              {renderGroup('Upcoming', upcoming)}
              {renderGroup('Past', past.slice(-15).reverse())}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
