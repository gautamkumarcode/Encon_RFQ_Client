'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { api } from '../../../services/api';
import { useNotification } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';
import RequirePermission from '../../../components/auth/RequirePermission';
import { Building2, Plus, Search, Edit2, Trash2, X, MapPin, Crosshair, Loader2 } from 'lucide-react';

const OfficeMapPicker = dynamic(() => import('../../../components/hr/OfficeMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xs text-slate-400">
      Loading map…
    </div>
  ),
});

interface Office {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  lat: number | null;
  lng: number | null;
  geofenceRadiusMeters: number;
  timezone: string;
  workStart: string;
  workEnd: string;
  lateGraceMinutes: number;
  halfDayThresholdHours: number;
  status: 'ACTIVE' | 'INACTIVE';
}

type OfficeForm = Omit<Office, 'id'> & { id?: string };

const emptyForm = (): OfficeForm => ({
  name: '',
  code: '',
  address: '',
  city: '',
  lat: null,
  lng: null,
  geofenceRadiusMeters: 200,
  timezone: 'Asia/Kolkata',
  workStart: '09:30',
  workEnd: '18:30',
  lateGraceMinutes: 15,
  halfDayThresholdHours: 4,
  status: 'ACTIVE',
});

export default function OfficesPage() {
  return (
    <RequirePermission module="HR_OFFICES" action="READ">
      <OfficesContent />
    </RequirePermission>
  );
}

function OfficesContent() {
  const queryClient = useQueryClient();
  const { showToast } = useNotification();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<OfficeForm | null>(null);
  const [addrQuery, setAddrQuery] = useState('');
  const [geoBusy, setGeoBusy] = useState(false);
  const [focusToken, setFocusToken] = useState(0);

  const { data: offices = [], isLoading } = useQuery<Office[]>({
    queryKey: ['offices'],
    queryFn: async () => (await api.get('/offices')).data.data,
  });

  const canWrite = hasPermission('HR_OFFICES', 'WRITE');
  const canDelete = hasPermission('HR_OFFICES', 'DELETE');

  const saveMutation = useMutation({
    mutationFn: async (payload: OfficeForm) => {
      const { id, ...rest } = payload;
      if (id) return (await api.put(`/offices/${id}`, rest)).data;
      return (await api.post('/offices', rest)).data;
    },
    onSuccess: () => {
      showToast('Office Saved', 'Branch office details updated', 'success');
      setForm(null);
      queryClient.invalidateQueries({ queryKey: ['offices'] });
    },
    onError: (err: any) =>
      showToast('Error', err.response?.data?.message || 'Failed to save office', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/offices/${id}`)).data,
    onSuccess: () => {
      showToast('Office Deleted', 'Branch office removed', 'success');
      queryClient.invalidateQueries({ queryKey: ['offices'] });
    },
    onError: (err: any) =>
      showToast('Error', err.response?.data?.message || 'Failed to delete office', 'error'),
  });

  const filtered = offices.filter(
    (o) =>
      !search ||
      `${o.name} ${o.city} ${o.code}`.toLowerCase().includes(search.toLowerCase()),
  );

  function set<K extends keyof OfficeForm>(k: K, v: OfficeForm[K]) {
    setForm((f) => (f ? { ...f, [k]: v } : f));
  }

  function submit() {
    if (!form?.name.trim()) return;
    saveMutation.mutate(form);
  }

  function bumpFocus() {
    setFocusToken((n) => n + 1);
  }

  async function doSearch() {
    const q = addrQuery.trim();
    if (!q || !form) return;
    setGeoBusy(true);
    try {
      const hit = await searchAddress(q);
      if (hit) {
        setForm((f) => (f ? { ...f, lat: hit.lat, lng: hit.lng, address: hit.display_name } : f));
        bumpFocus();
      } else {
        showToast('Not found', 'No matching address found', 'error');
      }
    } catch {
      showToast('Error', 'Address search failed', 'error');
    } finally {
      setGeoBusy(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      showToast('Error', 'Geolocation is not supported on this device', 'error');
      return;
    }
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const la = pos.coords.latitude;
        const ln = pos.coords.longitude;
        setForm((f) => (f ? { ...f, lat: la, lng: ln } : f));
        bumpFocus();
        const addr = await reverseGeocode(la, ln);
        if (addr) {
          setForm((f) => (f ? { ...f, address: addr } : f));
          setAddrQuery(addr);
        }
        setGeoBusy(false);
      },
      (err) => {
        showToast('Error', err.message || 'Location permission denied', 'error');
        setGeoBusy(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-5 rounded-xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-thermal-400" /> Office / Branch Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure branch locations, geofence radius and attendance working-hour rules
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => {
              setForm(emptyForm());
              setAddrQuery('');
            }}
            className="px-4 py-2 bg-thermal-600 hover:bg-thermal-500 text-white font-semibold text-xs rounded-md flex items-center gap-2 self-start sm:self-auto transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Office
          </button>
        )}
      </div>

      <div className="glass-card p-4 rounded-xl border border-slate-800">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search offices..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:border-thermal-500"
          />
        </div>
      </div>

      <div className="glass-card rounded-xl border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading offices...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No offices found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Office</th>
                  <th className="py-3.5 px-4">Timings</th>
                  <th className="py-3.5 px-4">Geofence</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white">{o.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {o.city} {o.code && `· ${o.code}`}
                      </p>
                      {o.lat != null && o.lng != null ? (
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {o.lat.toFixed(4)}, {o.lng.toFixed(4)}
                        </p>
                      ) : (
                        <p className="text-[10px] text-amber-400/80 mt-0.5">No coordinates set</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {o.workStart} – {o.workEnd}
                      <p className="text-[10px] text-slate-500">
                        {o.timezone} · grace {o.lateGraceMinutes}m
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{o.geofenceRadiusMeters} m</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                          o.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canWrite && (
                          <button
                            onClick={() => {
                              setForm({ ...o });
                              setAddrQuery(o.address || '');
                            }}
                            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete office "${o.name}"?`)) deleteMutation.mutate(o.id);
                            }}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
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

      {form && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-900 p-6 mb-8 max-h-[calc(100vh-3rem)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-thermal-400" />
                {form.id ? 'Edit Office' : 'New Office'}
              </h2>
              <button onClick={() => setForm(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Office Name *">
                <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Code">
                <input value={form.code} onChange={(e) => set('code', e.target.value)} className={inputCls} />
              </Field>
              <Field label="City">
                <input value={form.city} onChange={(e) => set('city', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={(e) => set('status', e.target.value as any)} className={inputCls}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </Field>
              <div className="md:col-span-2">
                <Field label="Address">
                  <input value={form.address} onChange={(e) => set('address', e.target.value)} className={inputCls} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Office Location — search an address, use your current location, or drop the pin">
                  <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        value={addrQuery}
                        onChange={(e) => setAddrQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            doSearch();
                          }
                        }}
                        placeholder="e.g. 12 AJC Bose Road, Kolkata"
                        className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:border-thermal-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={doSearch}
                      disabled={geoBusy}
                      className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 disabled:opacity-60 transition-colors"
                    >
                      {geoBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Search
                    </button>
                    <button
                      type="button"
                      onClick={useMyLocation}
                      disabled={geoBusy}
                      className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-thermal-400 border border-slate-700 flex items-center justify-center gap-1.5 disabled:opacity-60 transition-colors"
                    >
                      <Crosshair className="w-4 h-4" /> My location
                    </button>
                  </div>
                  <OfficeMapPicker
                    lat={form.lat}
                    lng={form.lng}
                    radiusMeters={form.geofenceRadiusMeters}
                    focusToken={focusToken}
                    onChange={(la, ln) => setForm((f) => (f ? { ...f, lat: la, lng: ln } : f))}
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    {form.lat != null && form.lng != null
                      ? `Pin at ${form.lat.toFixed(5)}, ${form.lng.toFixed(5)} · clock-in allowed within ${form.geofenceRadiusMeters} m`
                      : 'No pin yet — clock-in geofence is OFF for this office until you set a location.'}
                  </p>
                </Field>
              </div>
              <Field label="Latitude">
                <input
                  type="number"
                  step="any"
                  value={form.lat ?? ''}
                  onChange={(e) => set('lat', e.target.value === '' ? null : Number(e.target.value))}
                  className={inputCls}
                />
              </Field>
              <Field label="Longitude">
                <input
                  type="number"
                  step="any"
                  value={form.lng ?? ''}
                  onChange={(e) => set('lng', e.target.value === '' ? null : Number(e.target.value))}
                  className={inputCls}
                />
              </Field>
              <Field label="Geofence Radius (m)">
                <input
                  type="number"
                  value={form.geofenceRadiusMeters}
                  onChange={(e) => set('geofenceRadiusMeters', Number(e.target.value))}
                  className={inputCls}
                />
              </Field>
              <Field label="Timezone">
                <input value={form.timezone} onChange={(e) => set('timezone', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Work Start (HH:MM)">
                <input value={form.workStart} onChange={(e) => set('workStart', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Work End (HH:MM)">
                <input value={form.workEnd} onChange={(e) => set('workEnd', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Late Grace (minutes)">
                <input
                  type="number"
                  value={form.lateGraceMinutes}
                  onChange={(e) => set('lateGraceMinutes', Number(e.target.value))}
                  className={inputCls}
                />
              </Field>
              <Field label="Half-Day Threshold (hours)">
                <input
                  type="number"
                  step="any"
                  value={form.halfDayThresholdHours}
                  onChange={(e) => set('halfDayThresholdHours', Number(e.target.value))}
                  className={inputCls}
                />
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
                {saveMutation.isPending ? 'Saving...' : 'Save Office'}
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

// OpenStreetMap Nominatim (free, keyless) - reverse + forward geocoding.
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
    );
    const j = await r.json();
    return j?.display_name || '';
  } catch {
    return '';
  }
}

async function searchAddress(
  q: string,
): Promise<{ lat: number; lng: number; display_name: string } | null> {
  const r = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`,
  );
  const j = await r.json();
  const hit = Array.isArray(j) ? j[0] : null;
  if (!hit) return null;
  return { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon), display_name: hit.display_name };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
