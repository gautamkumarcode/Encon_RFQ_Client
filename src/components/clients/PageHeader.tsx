'use client';

import { Plus, RefreshCw } from 'lucide-react';

interface Props {
  refreshing: boolean;
  onRefresh: () => void;
  onNew: () => void;
}

export default function PageHeader({ refreshing, onRefresh, onNew }: Props) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-white">Clients</h1>
        <p className="mt-1 text-xs text-slate-400">Party master — enquiries, orders and follow-ups per client.</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-1.5 rounded-md bg-thermal-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-thermal-400"
        >
          <Plus className="h-3.5 w-3.5" /> New Client
        </button>
      </div>
    </div>
  );
}
