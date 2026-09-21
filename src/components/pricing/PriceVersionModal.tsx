'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, TrendingUp } from 'lucide-react';
import { pricingService } from '@/services/pricingService';
import { useNotification } from '@/context/NotificationContext';
import { Field, inputClass, selectClass, formatMoney } from '@/components/pricing/ui';

const PRICE_TYPES = ['PURCHASE', 'MATERIAL', 'COMPONENT', 'REFERENCE'];
const CURRENCIES = ['INR', 'USD', 'EUR'];

/**
 * Creates a NEW price version for an item. The previous ACTIVE price is never
 * overwritten — the backend expires it and stores this one as the new ACTIVE.
 */
export function PriceVersionModal({
  itemId,
  itemCode,
  currentPrice,
  onClose,
}: {
  itemId: string;
  itemCode: string;
  currentPrice: { unitPrice: number; currency: string; version: number } | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { showToast } = useNotification();

  const [form, setForm] = useState({
    priceType: 'PURCHASE',
    unitPrice: '',
    currency: currentPrice?.currency || 'INR',
    effectiveFrom: new Date().toISOString().slice(0, 10),
    reason: '',
  });

  const createMutation = useMutation({
    mutationFn: () =>
      pricingService.createPriceVersion(itemId, {
        priceType: form.priceType as any,
        unitPrice: Number(form.unitPrice),
        currency: form.currency,
        effectiveFrom: form.effectiveFrom,
        status: 'ACTIVE',
        reason: form.reason.trim() || 'Price update',
      }),
    onSuccess: () => {
      showToast('Price Version Created', `New price recorded for ${itemCode} — old price preserved in history`, 'success');
      queryClient.invalidateQueries({ queryKey: ['pricing-item', itemId] });
      queryClient.invalidateQueries({ queryKey: ['pricing-items'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-history'] });
      onClose();
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to create price version', 'error');
    },
  });

  const parsed = parseFloat(form.unitPrice);
  const delta = currentPrice && !Number.isNaN(parsed) ? parsed - currentPrice.unitPrice : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-lg w-full glass-card rounded-3xl p-6 border border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-thermal-500" /> New Price Version — {itemCode}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {currentPrice && (
          <div className="mb-4 p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
            <span className="text-slate-400">Current (v{currentPrice.version}):</span>{' '}
            <span className="font-bold text-white">{formatMoney(currentPrice.unitPrice, currentPrice.currency)}</span>
            {delta !== null && (
              <span className={`ml-2 font-semibold ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {delta >= 0 ? '+' : ''}
                {delta.toFixed(2)} ({currentPrice.unitPrice ? ((delta / currentPrice.unitPrice) * 100).toFixed(1) : '—'}%)
              </span>
            )}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (form.unitPrice === '') return;
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price Type">
              <select value={form.priceType} onChange={(e) => setForm({ ...form, priceType: e.target.value })} className={selectClass}>
                {PRICE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Currency">
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={selectClass}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="New Unit Price *">
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                className={inputClass}
                placeholder="0.00"
                autoFocus
              />
            </Field>
            <Field label="Effective From">
              <input
                type="date"
                required
                value={form.effectiveFrom}
                onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Reason for Change *" hint="Stored with this version for the price history audit trail">
            <input
              required
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className={inputClass}
              placeholder="e.g. Vendor revised rates (PO 1234)"
            />
          </Field>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 bg-thermal-600 hover:bg-thermal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              {createMutation.isPending ? 'Saving…' : 'Create Version'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
