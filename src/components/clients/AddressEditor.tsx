'use client';

import { Plus, Trash2 } from 'lucide-react';
import { INPUT_CLS, LABEL_CLS, ADDRESS_TYPES, COUNTRIES } from './constants';
import type { ClientAddr } from './types';

interface Props {
  addresses: ClientAddr[];
  onChange: (i: number, patch: Partial<ClientAddr>) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}

export default function AddressEditor({ addresses, onChange, onAdd, onRemove }: Props) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className={`${LABEL_CLS} mb-0`}>Addresses</label>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:border-thermal-500/60 hover:text-thermal-300"
        >
          <Plus className="h-3 w-3" /> Add address
        </button>
      </div>
      <div className="space-y-3">
        {addresses.map((a, i) => (
          <div key={i} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Address {i + 1}</span>
                <select
                  value={a.type}
                  onChange={(e) => onChange(i, { type: e.target.value })}
                  className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200 focus:border-thermal-500/60 focus:outline-none"
                >
                  {ADDRESS_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => onRemove(i)}
                disabled={addresses.length === 1}
                className="rounded-md p-1.5 text-slate-500 hover:text-rose-300 disabled:opacity-30"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input placeholder="Line 1" value={a.line1} onChange={(e) => onChange(i, { line1: e.target.value })} className={`${INPUT_CLS} sm:col-span-2`} />
              <input placeholder="Line 2" value={a.line2} onChange={(e) => onChange(i, { line2: e.target.value })} className={`${INPUT_CLS} sm:col-span-2`} />
              <input placeholder="City" value={a.city} onChange={(e) => onChange(i, { city: e.target.value })} className={INPUT_CLS} />
              <input placeholder="State" value={a.state} onChange={(e) => onChange(i, { state: e.target.value })} className={INPUT_CLS} />
              <input placeholder="Pincode" value={a.pincode} onChange={(e) => onChange(i, { pincode: e.target.value })} className={INPUT_CLS} />
              <select value={a.country} onChange={(e) => onChange(i, { country: e.target.value })} className={INPUT_CLS}>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
