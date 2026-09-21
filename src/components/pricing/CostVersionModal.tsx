'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Coins, Plus, Trash2 } from 'lucide-react';
import { pricingService } from '@/services/pricingService';
import { useNotification } from '@/context/NotificationContext';
import { Field, inputClass, selectClass, formatMoney } from '@/components/pricing/ui';

const COST_TYPES = [
  'Material',
  'Labour',
  'Fabrication',
  'Electrical',
  'Engineering',
  'Testing',
  'Packing',
  'Freight',
  'Overhead',
  'Other',
];

interface ComponentRow {
  type: string;
  name: string;
  quantity: string;
  unit: string;
  rate: string;
}

const emptyRow = (): ComponentRow => ({ type: 'Material', name: '', quantity: '1', unit: 'Nos', rate: '' });

/**
 * Creates a NEW cost version. Amounts (quantity × rate) and the total are
 * computed server-side — this editor only collects the raw inputs.
 */
export function CostVersionModal({
  itemId,
  itemCode,
  onClose,
}: {
  itemId: string;
  itemCode: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { showToast } = useNotification();

  const [rows, setRows] = useState<ComponentRow[]>([emptyRow()]);
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const setRow = (index: number, patch: Partial<ComponentRow>) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const total = rows.reduce((sum, r) => {
    const q = parseFloat(r.quantity) || 0;
    const rate = parseFloat(r.rate) || 0;
    return sum + q * rate;
  }, 0);

  const createMutation = useMutation({
    mutationFn: () =>
      pricingService.createCostVersion(itemId, {
        components: rows
          .filter((r) => r.name.trim() && (parseFloat(r.rate) || 0) !== 0)
          .map((r) => ({
            type: r.type,
            name: r.name.trim(),
            quantity: parseFloat(r.quantity) || 0,
            unit: r.unit.trim() || undefined,
            rate: parseFloat(r.rate) || 0,
          })),
        effectiveFrom,
        status: 'ACTIVE',
        currency: 'INR',
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      showToast('Cost Version Created', `New internal cost recorded for ${itemCode}`, 'success');
      queryClient.invalidateQueries({ queryKey: ['pricing-item', itemId] });
      queryClient.invalidateQueries({ queryKey: ['pricing-items'] });
      onClose();
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to create cost version', 'error');
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-3xl w-full glass-card rounded-3xl p-6 border border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-thermal-500" /> New Cost Version — {itemCode}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          {/* Component rows */}
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              <span className="col-span-3">Cost Type</span>
              <span className="col-span-3">Name</span>
              <span className="col-span-2">Qty</span>
              <span className="col-span-1">Unit</span>
              <span className="col-span-2">Rate (₹)</span>
              <span className="col-span-1" />
            </div>
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <select
                  value={row.type}
                  onChange={(e) => setRow(i, { type: e.target.value })}
                  className="col-span-3 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-thermal-500"
                >
                  {COST_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <input
                  value={row.name}
                  onChange={(e) => setRow(i, { name: e.target.value })}
                  className="col-span-3 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-thermal-500"
                  placeholder="e.g. MS Plate 5mm"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.quantity}
                  onChange={(e) => setRow(i, { quantity: e.target.value })}
                  className="col-span-2 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-thermal-500"
                />
                <input
                  value={row.unit}
                  onChange={(e) => setRow(i, { unit: e.target.value })}
                  className="col-span-1 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-thermal-500"
                  placeholder="Kg"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.rate}
                  onChange={(e) => setRow(i, { rate: e.target.value })}
                  className="col-span-2 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-thermal-500"
                  placeholder="0.00"
                />
                <button
                  type="button"
                  onClick={() => setRows((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))}
                  className="col-span-1 p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 flex justify-center transition-colors"
                  title="Remove row"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setRows((prev) => [...prev, emptyRow()])}
              className="w-full py-2 rounded-xl border border-dashed border-slate-700 hover:border-thermal-500/50 text-[11px] font-semibold text-slate-400 hover:text-thermal-400 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add cost component
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold">Total Cost (computed server-side)</span>
            <span className="text-sm font-extrabold text-thermal-400">{formatMoney(total)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Effective From">
              <input type="date" required value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Notes">
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} placeholder="Optional notes" />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || total === 0}
              className="px-5 py-2 bg-thermal-600 hover:bg-thermal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              {createMutation.isPending ? 'Saving…' : 'Create Cost Version'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
