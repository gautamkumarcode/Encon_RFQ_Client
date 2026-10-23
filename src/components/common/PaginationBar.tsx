'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
  onPageSize: (n: number) => void;
}

// Tally Books–style pagination footer: rows-per-page picker, range indicator and
// windowed page numbers (1 … 4 5 6 … N). Shared by the Order in Hand / Clients tables.
export default function PaginationBar({ page, pageSize, total, onPage, onPageSize }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);
  const navBtn =
    'inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40';

  const pages: (number | 'gap')[] = [];
  if (totalPages <= 7) {
    for (let n = 1; n <= totalPages; n++) pages.push(n);
  } else {
    pages.push(1);
    if (current > 3) pages.push('gap');
    for (let n = Math.max(2, current - 1); n <= Math.min(totalPages - 1, current + 1); n++) pages.push(n);
    if (current < totalPages - 2) pages.push('gap');
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-800 bg-slate-900/60 px-4 py-2.5 sm:flex-row">
      <div className="flex items-center gap-2 text-[11px] text-slate-500">
        <span>Rows per page</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          className="rounded-md border border-slate-700 bg-slate-800 px-1.5 py-1 text-xs text-slate-200 focus:border-thermal-500/60 focus:outline-none"
        >
          {[25, 50, 100, 250].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className="tabular-nums">
          Showing {from}–{to} of {total}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button type="button" className={navBtn} onClick={() => onPage(current - 1)} disabled={current <= 1}>
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </button>
        {pages.map((p, idx) =>
          p === 'gap' ? (
            <span key={`gap-${idx}`} className="px-1 text-xs text-slate-600">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              className={`min-w-[28px] rounded-md px-2 py-1 text-xs tabular-nums transition-colors ${
                p === current
                  ? 'bg-slate-700 text-slate-100 ring-1 ring-inset ring-slate-600'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button type="button" className={navBtn} onClick={() => onPage(current + 1)} disabled={current >= totalPages}>
          Next <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
