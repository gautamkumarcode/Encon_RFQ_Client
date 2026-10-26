'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { Calculator, Search, RefreshCw, FileSpreadsheet, CalendarDays } from 'lucide-react';

interface TallyVoucher {
  id: string;
  company: string;
  voucherType: string;
  voucherNumber: string;
  date: string;
  partyName: string;
  amount: number;
  syncedAt: string;
}

interface TallyResponse {
  success: boolean;
  count: number;
  totalAmount: number;
  lastSynced: string | null;
  data: TallyVoucher[];
}

const inr = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

export default function TallyPage() {
  const [partyQuery, setPartyQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: types } = useQuery<{ success: boolean; data: string[] }>({
    queryKey: ['tallyVoucherTypes'],
    queryFn: async () => (await api.get('/tally/voucher-types')).data,
  });

  const { data, isLoading, refetch, isRefetching } = useQuery<TallyResponse>({
    queryKey: ['tallyVouchers', partyQuery, typeFilter],
    queryFn: async () => {
      const res = await api.get('/tally/vouchers', {
        params: { party: partyQuery, type: typeFilter, limit: 500 },
      });
      return res.data;
    },
  });

  const records = data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-thermal-500" /> Tally ERP — Vouchers
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Vouchers synced automatically from the office laptop&apos;s Tally into the cloud database
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-md text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Vouchers</div>
          <div className="text-2xl font-extrabold text-white mt-1">{data?.count ?? '—'}</div>
        </div>
        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Total Amount</div>
          <div className="text-2xl font-extrabold text-thermal-300 mt-1">
            {data ? inr(data.totalAmount) : '—'}
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1">
            <CalendarDays className="w-3 h-3" /> Last Sync
          </div>
          <div className="text-sm font-bold text-slate-200 mt-1.5">
            {data?.lastSynced ? new Date(data.lastSynced).toLocaleString() : 'Never synced'}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by party name..."
              value={partyQuery}
              onChange={(e) => setPartyQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/60 rounded-md text-xs text-white focus:outline-none focus:border-thermal-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700/60 rounded-md text-xs text-white focus:outline-none focus:border-thermal-500">
            <option value="">All voucher types</option>
            {(types?.data ?? []).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <p className="text-[10px] text-slate-500">
          Data flows: Tally → office laptop agent → cloud DB → this screen (every 30 min)
        </p>
      </div>

      {/* Voucher Table */}
      <div className="glass-card rounded-xl border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading Tally vouchers...</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FileSpreadsheet className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">No vouchers found in the synced Tally data.</p>
            <p className="text-[11px] text-slate-500">
              If the office laptop was off, data appears here after its next sync run.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Voucher No.</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Party Name</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4">Synced At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {records.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-[10px] font-semibold text-slate-300 whitespace-nowrap">
                        {v.voucherType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-200 font-semibold">{v.voucherNumber}</td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(v.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">{v.partyName}</td>
                    <td className="py-3.5 px-4 text-right text-thermal-300 font-bold">{inr(v.amount)}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(v.syncedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
