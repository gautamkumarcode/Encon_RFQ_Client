'use client';

import { Building2, Eye, Pencil, Trash2 } from 'lucide-react';
import { inr } from './utils';
import type { ClientRow } from './types';

interface Props {
  isLoading: boolean;
  rows: ClientRow[];
  paged: ClientRow[];
  startIdx: number;
  totalCount: number;
  onView: (c: ClientRow) => void;
  onEdit: (c: ClientRow) => void;
  onDelete: (c: ClientRow) => void;
}

const th = 'px-3 py-2.5 font-semibold';
const num = 'px-3 py-2 text-center text-xs tabular-nums';

export default function ClientsTable({ isLoading, rows, paged, startIdx, totalCount, onView, onEdit, onDelete }: Props) {
  return (
    <div className="scroll-smooth overflow-hidden rounded-xl bg-slate-900/40">
      {isLoading ? (
        <div className="px-4 py-16 text-center text-xs text-slate-500">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="min-h-[40vh] px-4 py-16 text-center">
          <Building2 className="mx-auto h-6 w-6 text-slate-700" />
          <p className="mt-3 text-xs text-slate-400">No clients yet. Clients are captured automatically when you save an order, or add one here.</p>
        </div>
      ) : (
        <div className="scroll-smooth min-h-[40vh] overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-900/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className={`w-10 ${th}`}>#</th>
                <th className={th}>Client</th>
                <th className={th}>Country</th>
                <th className={th}>Contact</th>
                <th className={`${th} text-center`}>Enquiries</th>
                <th className={`${th} text-center`}>Orders</th>
                <th className={`${th} text-center`}>Dispatched</th>
                <th className={`${th} text-right`}>Order Value</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((c, i) => (
                <tr
                  key={c.id}
                  onClick={() => onView(c)}
                  className={`cursor-pointer transition-colors ${(startIdx + i) % 2 ? 'bg-slate-800/40' : ''} hover:bg-thermal-500/10`}
                >
                  <td className="px-3 py-2 text-xs tabular-nums text-slate-500">{startIdx + i + 1}</td>
                  <td className="px-3 py-2 text-xs font-medium text-slate-200">{c.name}</td>
                  <td className="px-3 py-2 text-xs text-slate-400">{c.country || '—'}</td>
                  <td className="px-3 py-2 text-xs text-slate-400">
                    <div>{c.contactPerson || '—'}</div>
                    <div className="text-[11px] text-slate-500">{[c.mobile, c.email].filter(Boolean).join(' · ')}</div>
                  </td>
                  <td className={`${num} text-slate-300`}>{c.enquiryCount}</td>
                  <td className={`${num} text-slate-300`}>{c.orderCount}</td>
                  <td className={`${num} text-emerald-300/80`}>{c.dispatchedCount}</td>
                  <td className="px-3 py-2 text-right text-xs tabular-nums text-slate-200">{inr(c.orderValueINR)}</td>
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onView(c)}
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-thermal-300"
                        title="View"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onEdit(c)}
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-thermal-300"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(c)}
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-rose-300"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/60 px-4 py-2 text-[11px] text-slate-500">
        <span>Click a client to view their enquiries &amp; order history</span>
        <span className="tabular-nums">{totalCount} client{totalCount === 1 ? '' : 's'}</span>
      </div>
    </div>
  );
}
