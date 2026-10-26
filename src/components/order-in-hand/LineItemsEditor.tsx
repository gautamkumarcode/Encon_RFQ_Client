'use client';

import { Plus, Trash2 } from 'lucide-react';
import { INPUT_CLS } from './constants';
import { fmt, sym } from './utils';
import type { LineItem } from './types';

interface Props {
  items: LineItem[];
  currency: string;
  total: number;
  onChange: (i: number, patch: Partial<LineItem>) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}

// Shared column template so the header labels and every row line up exactly.
// Description takes the remaining width (minmax(0,1fr) prevents it collapsing).
const ROW = 'grid grid-cols-[minmax(0,1fr)_5rem_7rem_1.75rem] items-center gap-2';
// Number field: right-aligned, tabular figures, native spinners removed.
const NUM_CLS =
  `${INPUT_CLS} text-right tabular-nums [appearance:textfield] ` +
  '[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

export default function LineItemsEditor({ items, currency, total, onChange, onAdd, onRemove }: Props) {
  return (
    <div>
      {/* Column header */}
      <div className={`${ROW} mb-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500`}>
        <span>Description</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Value ({sym(currency).trim() || currency})</span>
        <span />
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {items.map((li, i) => (
          <div key={i} className={ROW}>
            <input
              placeholder="Item description"
              value={li.description}
              onChange={(e) => onChange(i, { description: e.target.value })}
              className={INPUT_CLS}
            />
            <input
              type="number"
              min={0}
              placeholder="1"
              value={li.qty === 0 ? '' : li.qty}
              onChange={(e) => onChange(i, { qty: Number(e.target.value) || 0 })}
              className={NUM_CLS}
            />
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={li.value === 0 ? '' : li.value}
              onChange={(e) => onChange(i, { value: Number(e.target.value) || 0 })}
              className={NUM_CLS}
            />
            <button
              onClick={() => onRemove(i)}
              disabled={items.length === 1}
              title="Remove line"
              className="flex h-8 w-8 items-center justify-center justify-self-center rounded-md text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Footer: add + total */}
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-800 pt-3">
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-[11px] font-medium text-slate-300 transition-colors hover:border-thermal-500/60 hover:text-thermal-300"
        >
          <Plus className="h-3.5 w-3.5" /> Add item
        </button>
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] uppercase tracking-wider text-slate-500">Total</span>
          <span className="text-sm font-bold tabular-nums text-slate-100">
            {sym(currency)}
            {fmt(total)}
          </span>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-slate-600">
        Enter a description, quantity and value for each line. Total is the sum of the Value column.
      </p>
    </div>
  );
}
