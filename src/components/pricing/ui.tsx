'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, PackageX } from 'lucide-react';
import type { ItemType, PriceStatus } from '@/services/pricingService';

/* ─── Formatting helpers ───────────────────────────────────────────────────── */

export function formatMoney(value: number | null | undefined, currency = 'INR'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value);
  return `${currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : `${currency} `}${formatted}`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${formatDate(d)} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

/* ─── Badges & pills ───────────────────────────────────────────────────────── */

const ITEM_TYPE_STYLES: Record<ItemType, string> = {
  COMPONENT: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
  PRODUCT: 'bg-thermal-500/10 text-thermal-400 border-thermal-500/30',
  ASSEMBLY: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
  RAW_MATERIAL: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  SPARE: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  SERVICE: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
};

export function ItemTypeBadge({ type }: { type: string }) {
  const style = ITEM_TYPE_STYLES[type as ItemType] || 'bg-slate-500/10 text-slate-300 border-slate-500/30';
  return (
    <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold tracking-wide ${style}`}>
      {type.replace('_', ' ')}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const style =
    status === 'ACTIVE'
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      : status === 'EXPIRED' || status === 'CANCELLED' || status === 'DISABLED'
      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      : 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold inline-flex items-center gap-1 border ${style}`}>
      {status}
    </span>
  );
}

/* ─── Table helpers ────────────────────────────────────────────────────────── */

export function SortHeader({
  label,
  field,
  sort,
  order,
  onSort,
  align = 'left',
}: {
  label: string;
  field: string;
  sort: string;
  order: 'asc' | 'desc';
  onSort: (field: string) => void;
  align?: 'left' | 'right';
}) {
  const active = sort === field;
  return (
    <th
      className={`py-3.5 px-4 cursor-pointer select-none hover:text-thermal-400 transition-colors ${
        align === 'right' ? 'text-right' : ''
      } ${active ? 'text-thermal-400' : ''}`}
      onClick={() => onSort(field)}
    >
      <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        {label}
        <span className="text-[8px] leading-none">{active ? (order === 'asc' ? '▲' : '▼') : '↕'}</span>
      </span>
    </th>
  );
}

export function EmptyRow({ message, colSpan }: { message: string; colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center text-xs text-slate-400">
        <PackageX className="w-6 h-6 mx-auto mb-2 text-slate-600" />
        {message}
      </td>
    </tr>
  );
}

/* ─── Pagination ───────────────────────────────────────────────────────────── */

export function Pagination({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return (
      <div className="px-4 py-3 border-t border-slate-800 text-[10px] text-slate-500">
        {total} record{total === 1 ? '' : 's'}
      </div>
    );
  }
  return (
    <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between">
      <span className="text-[10px] text-slate-500">
        Page {page} of {totalPages} · {total} records
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 transition-colors"
          title="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 transition-colors"
          title="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ─── Form atoms ───────────────────────────────────────────────────────────── */

export const inputClass =
  'w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-thermal-500 placeholder:text-slate-600';

export const selectClass =
  'w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-thermal-500';

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-300 mb-1">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}
