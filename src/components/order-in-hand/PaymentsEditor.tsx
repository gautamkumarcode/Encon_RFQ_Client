'use client';

import { Plus, Trash2 } from 'lucide-react';
import { INPUT_CLS, PAYMENT_TYPES } from './constants';
import { fmt, sym } from './utils';
import type { Payment } from './types';

interface Props {
  payments: Payment[];
  currency: string;
  orderValue: number;
  onChange: (i: number, patch: Partial<Payment>) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}

// Type | Amount | Date | Note | remove-button. Type and Note flex to fill.
const ROW =
  'grid grid-cols-[minmax(0,1.1fr)_7rem_8.5rem_minmax(0,1.3fr)_1.75rem] items-center gap-2';
const NUM_CLS =
  `${INPUT_CLS} text-right tabular-nums [appearance:textfield] ` +
  '[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

export default function PaymentsEditor({ payments, currency, orderValue, onChange, onAdd, onRemove }: Props) {
  const totalReceived = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const balance = orderValue - totalReceived;

  return (
    <div>
      {/* Column header */}
      <div className={`${ROW} mb-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500`}>
        <span>Type</span>
        <span className="text-right">Amount ({sym(currency).trim() || currency})</span>
        <span className="text-left">Date</span>
        <span>Note</span>
        <span />
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {payments.map((p, i) => (
          <div key={i} className={ROW}>
            <select value={p.type} onChange={(e) => onChange(i, { type: e.target.value })} className={INPUT_CLS}>
              {PAYMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={p.amount === 0 ? '' : p.amount}
              onChange={(e) => onChange(i, { amount: Number(e.target.value) || 0 })}
              className={NUM_CLS}
            />
            <input type="date" value={p.date} onChange={(e) => onChange(i, { date: e.target.value })} className={INPUT_CLS} />
            <input
              placeholder="Reference / remarks"
              value={p.note}
              onChange={(e) => onChange(i, { note: e.target.value })}
              className={INPUT_CLS}
            />
            <button
              onClick={() => onRemove(i)}
              disabled={payments.length === 1}
              title="Remove payment"
              className="flex h-8 w-8 items-center justify-center justify-self-center rounded-md text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Footer: add + totals */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3">
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-[11px] font-medium text-slate-300 transition-colors hover:border-thermal-500/60 hover:text-thermal-300"
        >
          <Plus className="h-3.5 w-3.5" /> Add payment
        </button>
        <div className="flex items-center gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] uppercase tracking-wider text-slate-500">Received</span>
            <span className="text-sm font-bold tabular-nums text-emerald-300">
              {sym(currency)}
              {fmt(totalReceived)}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] uppercase tracking-wider text-slate-500">Balance</span>
            <span className={`text-sm font-bold tabular-nums ${balance > 0 ? 'text-amber-300' : 'text-slate-100'}`}>
              {sym(currency)}
              {fmt(balance)}
            </span>
          </div>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-slate-600">
        Record each money received against the order. Balance = order value minus total received.
      </p>
    </div>
  );
}
