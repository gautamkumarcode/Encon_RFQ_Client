'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Edit2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { pricingService, PricingItemDetail } from '@/services/pricingService';
import { useNotification } from '@/context/NotificationContext';
import { Field, inputClass, selectClass } from '@/components/pricing/ui';

/**
 * Edits item master data only — prices and costs are immutable versions and
 * are never edited through this modal.
 */
export function EditItemModal({ item, onClose }: { item: PricingItemDetail['item']; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { showToast } = useNotification();
  const { data: lookup } = useQuery({ queryKey: ['pricing-lookup'], queryFn: pricingService.getLookup });

  const [form, setForm] = useState({
    name: item.name,
    categoryId: item.categoryId || '',
    newCategory: '',
    unitId: '',
    newUnit: '',
    supplierId: '',
    newSupplier: '',
    manufacturer: item.manufacturer,
    model: item.model,
    description: item.description,
    specifications: item.specifications,
    isPurchasable: item.isPurchasable,
    isSellable: item.isSellable,
    isActive: item.isActive,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        manufacturer: form.manufacturer.trim() || undefined,
        model: form.model.trim() || undefined,
        description: form.description.trim() || undefined,
        specifications: form.specifications.trim() || undefined,
        isPurchasable: form.isPurchasable,
        isSellable: form.isSellable,
        isActive: form.isActive,
      };
      if (form.newCategory.trim()) payload.categoryName = form.newCategory.trim();
      else if (form.categoryId) payload.categoryId = form.categoryId;
      if (form.newUnit.trim()) payload.unitName = form.newUnit.trim();
      else if (form.unitId) payload.unitId = form.unitId;
      if (form.newSupplier.trim()) payload.supplierName = form.newSupplier.trim();
      else if (form.supplierId) payload.supplierId = form.supplierId;
      return pricingService.updateItem(item.id, payload as any);
    },
    onSuccess: () => {
      showToast('Item Updated', `${item.code} master data saved`, 'success');
      queryClient.invalidateQueries({ queryKey: ['pricing-item', item.id] });
      queryClient.invalidateQueries({ queryKey: ['pricing-items'] });
      onClose();
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to update item', 'error');
    },
  });

  const checkboxRow = (label: string, checked: boolean, onChange: (v: boolean) => void) => (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded bg-slate-950 border-slate-600 accent-thermal-500"
      />
      <span className="text-xs font-semibold text-slate-300">{label}</span>
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-2xl w-full glass-card rounded-3xl p-6 border border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-thermal-500" /> Edit Item — <span className="font-mono text-thermal-400">{item.code}</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Item Name *" hint="Item code never changes — it is the permanent identifier">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Manufacturer">
              <input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Model">
              <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className={inputClass} />
            </Field>

            <Field label="Category">
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value, newCategory: '' })}
                className={selectClass}
                disabled={!!form.newCategory.trim()}
              >
                <option value="">— Select —</option>
                {lookup?.categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                value={form.newCategory}
                onChange={(e) => setForm({ ...form, newCategory: e.target.value, categoryId: '' })}
                className={inputClass + ' mt-2'}
                placeholder="…or type a new category"
              />
            </Field>

            <Field label="Unit of Measure">
              <select
                value={form.unitId}
                onChange={(e) => setForm({ ...form, unitId: e.target.value, newUnit: '' })}
                className={selectClass}
                disabled={!!form.newUnit.trim()}
              >
                <option value="">— Keep current ({item.unit || 'none'}) —</option>
                {lookup?.units.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <input
                value={form.newUnit}
                onChange={(e) => setForm({ ...form, newUnit: e.target.value, unitId: '' })}
                className={inputClass + ' mt-2'}
                placeholder="…or type a new unit"
              />
            </Field>

            <Field label="Preferred Supplier">
              <select
                value={form.supplierId}
                onChange={(e) => setForm({ ...form, supplierId: e.target.value, newSupplier: '' })}
                className={selectClass}
                disabled={!!form.newSupplier.trim()}
              >
                <option value="">— Keep current ({item.supplier || 'none'}) —</option>
                {lookup?.suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input
                value={form.newSupplier}
                onChange={(e) => setForm({ ...form, newSupplier: e.target.value, supplierId: '' })}
                className={inputClass + ' mt-2'}
                placeholder="…or type a new supplier"
              />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass + ' min-h-[60px] resize-y'}
            />
          </Field>
          <Field label="Specification">
            <textarea
              value={form.specifications}
              onChange={(e) => setForm({ ...form, specifications: e.target.value })}
              className={inputClass + ' min-h-[60px] resize-y'}
            />
          </Field>

          <div className="flex flex-wrap gap-6">
            {checkboxRow('Purchasable', form.isPurchasable, (v) => setForm({ ...form, isPurchasable: v }))}
            {checkboxRow('Sellable', form.isSellable, (v) => setForm({ ...form, isSellable: v }))}
            {checkboxRow('Active', form.isActive, (v) => setForm({ ...form, isActive: v }))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
