'use client';

import { Search } from 'lucide-react';

interface Props {
  search: string;
  onSearch: (v: string) => void;
}

export default function FilterBar({ search, onSearch }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full sm:w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
        <input
          type="text"
          placeholder="Search client"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full rounded-md border border-slate-800 bg-slate-900/60 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-thermal-500/60 focus:outline-none focus:ring-1 focus:ring-thermal-500/40"
        />
      </div>
    </div>
  );
}
