'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Save, Wand2 } from 'lucide-react';
import { pricingService, CreateItemPayload, ItemType } from '@/services/pricingService';
import { useNotification } from '@/context/NotificationContext';
import { Field, inputClass, selectClass } from '@/components/pricing/ui';

const CURRENCIES = ['INR', 'USD', 'EUR'];
const PRICE_TYPES = ['PURCHASE', 'MATERIAL', 'COMPONENT', 'REFERENCE'];
const ITEM_TYPES: ItemType[] = ['COMPONENT', 'PRODUCT', 'ASSEMBLY', 'RAW_MATERIAL', 'SPARE', 'SERVICE'];

export default function NewItemPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useNotification();

  const { data: lookup } = useQuery({ queryKey: ['pricing-lookup'], queryFn: pricingService.getLookup });

  const [form, setForm] = useState({
    code: '',
    name: '',
    itemType: 'COMPONENT' as ItemType,
    categoryId: '',
    newCategory: '',
    unitId: '',
    newUnit: '',
    supplierId: '',
    newSupplier: '',
    manufacturer: '',
    model: '',
    description: '',
    specifications: '',
    isPurchasable: true,
    isSellable: true,
  });

  const [withInitialPrice, setWithInitialPrice] = useState(true);
  const [price, setPrice] = useState({
    priceType: 'PURCHASE',
    unitPrice: '',
    currency: 'INR',
    effectiveFrom: new Date().toISOString().slice(0, 10),
    reason: 'Initial price',
  });

  // Auto-generated code preview for the chosen item type
  const { data: nextCode } = useQuery({
    queryKey: ['pricing-next-code', form.itemType],
    queryFn: () => pricingService.getNextCode(form.itemType),
  });

  useEffect(() => {
    setForm((f) => ({ ...f, code: '' }));
  }, [form.itemType]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: CreateItemPayload = {
        name: form.name.trim(),
        itemType: form.itemType,
        manufacturer: form.manufacturer.trim() || undefined,
        model: form.model.trim() || undefined,
        description: form.description.trim() || undefined,
        specifications: form.specifications.trim() || undefined,
        isPurchasable: form.isPurchasable,
        isSellable: form.isSellable,
      };
      if (form.code.trim()) payload.code = form.code.trim().toUpperCase();
      if (form.newCategory.trim()) payload.categoryName = form.newCategory.trim();
      else if (form.categoryId) payload.categoryId = form.categoryId;
      if (form.newUnit.trim()) payload.unitName = form.newUnit.trim();
      else if (form.unitId) payload.unitId = form.unitId;
      if (form.newSupplier.trim()) payload.supplierName = form.newSupplier.trim();
      else if (form.supplierId) payload.supplierId = form.supplierId;

      if (withInitialPrice && price.unitPrice !== '') {
        payload.initialPrice = {
          priceType: price.priceType as any,
          unitPrice: Number(price.unitPrice),
          currency: price.currency,
          effectiveFrom: price.effectiveFrom,
          reason: price.reason.trim() || 'Initial price',
        };
      }
      const res = await pricingService.createItem(payload);
      return res.data as { item: { _id: string; code: string } };
    },
    onSuccess: (data) => {
      showToast('Item Created', `${data.item.code} added to the item master`, 'success');
      queryClient.invalidateQueries({ queryKey: ['pricing-items'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-dashboard'] });
      router.push(`/pricing/items/${data.item._id}`);
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to create item', 'error');
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
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href="/pricing/items"
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          title="Back to items"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Plus className="w-5 h-5 text-thermal-500" /> Add New Item
        </h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.name.trim()) return;
          createMutation.mutate();
        }}
        className="glass-card rounded-3xl border border-slate-800 p-6 space-y-5"
      >
        {/* Identity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Item Name *" hint="The permanent unique code is the identifier — names may repeat">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="e.g. Industrial Burner Nozzle"
            />
          </Field>

          <Field label="Item Type *">
            <select
              value={form.itemType}
              onChange={(e) => setForm({ ...form, itemType: e.target.value as ItemType })}
              className={selectClass}
            >
              {ITEM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace('_', ' ')}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Item Code"
            hint={form.code.trim() ? 'Custom code — must be unique' : `Leave blank to auto-generate (${nextCode?.nextCode || '…'})`}
          >
            <div className="relative">
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className={inputClass + ' font-mono'}
                placeholder={nextCode?.nextCode || 'AUTO'}
              />
              <button
                type="button"
                onClick={() => setForm({ ...form, code: nextCode?.nextCode || '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-thermal-500/10 hover:bg-thermal-500/20 text-thermal-400 border border-thermal-500/30"
                title="Use auto-generated code"
              >
                <Wand2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </Field>

          <Field label="Manufacturer">
            <input
              value={form.manufacturer}
              onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
              className={inputClass}
              placeholder="e.g. Siemens"
            />
          </Field>

          <Field label="Model">
            <input
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className={inputClass}
              placeholder="e.g. LME-22"
            />
          </Field>
        </div>

        {/* Classification */}
        <div className="border-t border-slate-800 pt-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Classification</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <option value="">— Select —</option>
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
                placeholder="…or type a new unit (e.g. Per Kg)"
              />
            </Field>

            <Field label="Preferred Supplier">
              <select
                value={form.supplierId}
                onChange={(e) => setForm({ ...form, supplierId: e.target.value, newSupplier: '' })}
                className={selectClass}
                disabled={!!form.newSupplier.trim()}
              >
                <option value="">— Select —</option>
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
        </div>

        {/* Details */}
        <div className="border-t border-slate-800 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass + ' min-h-[80px] resize-y'}
              placeholder="Short human-readable description"
            />
          </Field>
          <Field label="Specification">
            <textarea
              value={form.specifications}
              onChange={(e) => setForm({ ...form, specifications: e.target.value })}
              className={inputClass + ' min-h-[80px] resize-y'}
              placeholder="Technical specification / part no / grade"
            />
          </Field>
        </div>

        <div className="flex flex-wrap gap-6">
          {checkboxRow('Purchasable', form.isPurchasable, (v) => setForm({ ...form, isPurchasable: v }))}
          {checkboxRow('Sellable', form.isSellable, (v) => setForm({ ...form, isSellable: v }))}
        </div>

        {/* Initial price */}
        <div className="border-t border-slate-800 pt-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Initial Price (Version 1)</h3>
            {checkboxRow('Set an initial price now', withInitialPrice, setWithInitialPrice)}
          </div>
          {withInitialPrice && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Field label="Price Type">
                <select value={price.priceType} onChange={(e) => setPrice({ ...price, priceType: e.target.value })} className={selectClass}>
                  {PRICE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Unit Price *">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={price.unitPrice}
                  onChange={(e) => setPrice({ ...price, unitPrice: e.target.value })}
                  className={inputClass}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Currency">
                <select value={price.currency} onChange={(e) => setPrice({ ...price, currency: e.target.value })} className={selectClass}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Effective From">
                <input
                  type="date"
                  value={price.effectiveFrom}
                  onChange={(e) => setPrice({ ...price, effectiveFrom: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Reason">
                <input
                  value={price.reason}
                  onChange={(e) => setPrice({ ...price, reason: e.target.value })}
                  className={inputClass}
                  placeholder="Initial price"
                />
              </Field>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <Link
            href="/pricing/items"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            {createMutation.isPending ? 'Creating…' : 'Create Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
