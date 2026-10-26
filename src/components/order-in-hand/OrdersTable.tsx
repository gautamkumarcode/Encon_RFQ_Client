'use client';

import { Pencil, Trash2, ClipboardList, Eye } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { fmt, sym } from './utils';
import type { Order } from './types';

interface Props {
  isLoading: boolean;
  rows: Order[];
  paged: Order[];
  startIdx: number;
  totalCount: number;
  onView: (o: Order) => void;
  onEdit: (o: Order) => void;
  onDelete: (o: Order) => void;
}

export default function OrdersTable({ isLoading, rows, paged, startIdx, totalCount, onView, onEdit, onDelete }: Props) {
  return (
    <div className="scroll-smooth overflow-hidden rounded-xl bg-slate-900/40">
      {isLoading ? (
        <div className="px-4 py-16 text-center text-xs text-slate-500">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="min-h-[40vh] px-4 py-16 text-center">
          <ClipboardList className="mx-auto h-6 w-6 text-slate-700" />
          <p className="mt-3 text-xs text-slate-400">No orders yet. Create one, or import from a PO-Received enquiry.</p>
        </div>
      ) : (
        <div className="scroll-smooth min-h-[40vh] overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-900/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="w-10 px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Job No</th>
                <th className="px-3 py-2.5">Party</th>
                <th className="px-3 py-2.5">PO No</th>
                <th className="px-3 py-2.5">PO Date</th>
                <th className="px-3 py-2.5 text-center">Items</th>
                <th className="px-3 py-2.5 text-right">Order Value</th>
                <th className="px-3 py-2.5 text-right">INR</th>
                <th className="px-3 py-2.5">Expected</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((o, i) => (
                <tr
                  key={o.id}
                  onClick={() => onView(o)}
                  className={`cursor-pointer transition-colors ${(startIdx + i) % 2 ? 'bg-slate-800/40' : ''} hover:bg-slate-700/50`}
                >
                  <td className="px-3 py-2 text-xs tabular-nums text-slate-500">{startIdx + i + 1}</td>
                  <td className="px-3 py-2 text-xs text-slate-300">{o.jobNo || '—'}</td>
                  <td className="px-3 py-2 text-xs text-slate-200">{o.clientName}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-300">{o.poNumber || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-400">
                    {o.poDate ? new Date(o.poDate).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-3 py-2 text-center text-xs tabular-nums text-slate-400">
                    {(o.lineItems || []).reduce((s, li) => s + (Number(li.qty) || 0), 0)}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap text-xs tabular-nums text-slate-200">
                    {sym(o.currency)}
                    {fmt(o.orderValue)}
                  </td>
                  <td
                    className="px-3 py-2 text-right whitespace-nowrap text-xs tabular-nums text-slate-300"
                    title="INR equivalent as entered on the order"
                  >
                    ₹{fmt(o.orderValueINR)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-400">
                    {o.expectedDespatch ? new Date(o.expectedDespatch).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(o);
                        }}
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-thermal-300"
                        title="View details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(o);
                        }}
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-thermal-300"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(o);
                        }}
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
        <span>Order in hand &amp; production planning position</span>
        <span className="tabular-nums">{totalCount} order{totalCount === 1 ? '' : 's'}</span>
      </div>
    </div>
  );
}
