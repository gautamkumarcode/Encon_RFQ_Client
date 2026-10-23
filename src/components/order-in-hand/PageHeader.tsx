'use client';

import { Plus, RefreshCw, Upload, Download } from 'lucide-react';

interface Props {
  refreshing: boolean;
  exporting: boolean;
  onRefresh: () => void;
  onExport: () => void;
  onNew: () => void;
  onImport: () => void;
}

export default function PageHeader({ refreshing, exporting, onRefresh, onExport, onNew, onImport }: Props) {
  return (
    <div className="flex items-end justify-between gap-4 py-2">
      <div>
        <h1 className="text-xl font-bold text-white">Order in Hand</h1>
        <p className="mt-1 text-xs text-slate-400">Order book &amp; production planning position.</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
        <button
          onClick={onExport}
          disabled={exporting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100 disabled:opacity-50"
        >
          <Download className={`h-3.5 w-3.5 ${exporting ? 'animate-pulse' : ''}`} /> Export Excel
        </button>
        <button
          onClick={onImport}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100"
        >
          <Upload className="h-3.5 w-3.5" /> Import Excel
        </button>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-1.5 rounded-lg bg-thermal-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-thermal-400"
        >
          <Plus className="h-3.5 w-3.5" /> New Order
        </button>
      </div>
    </div>
  );
}
