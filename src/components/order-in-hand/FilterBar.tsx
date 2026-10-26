'use client';

import { Search } from 'lucide-react';
import { ORDER_STATUS } from './constants';

interface Props {
  search: string;
  onSearch: (v: string) => void;
  status: string;
  onStatus: (v: string) => void;
}

export default function FilterBar({ search, onSearch, status, onStatus }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-2">
      <div className="relative w-full sm:w-64">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
        <input
          type="text"
          placeholder="Search party / PO / job no"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full rounded-md border border-slate-800 bg-slate-900/60 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-thermal-500/60 focus:outline-none focus:ring-1 focus:ring-thermal-500/40"
        />
      </div>
      <select
        value={status}
        onChange={(e) => onStatus(e.target.value)}
        className="rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-200 focus:border-thermal-500/60 focus:outline-none"
      >
        <option value="">All Statuses</option>
        {ORDER_STATUS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
