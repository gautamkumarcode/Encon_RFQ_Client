'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Percent, Plus, Search, Edit2, Power, X } from 'lucide-react';
import { pricingService, PricingRule, RulePayload, RuleType, RuleAppliesTo } from '@/services/pricingService';
import { useNotification } from '@/context/NotificationContext';
import { EmptyRow, formatDateTime, inputClass, selectClass, Field } from '@/components/pricing/ui';

const RULE_TYPES: RuleType[] = ['PERCENTAGE', 'FIXED', 'MULTIPLIER'];
const APPLIES_TO: RuleAppliesTo[] = ['GLOBAL', 'CATEGORY', 'ITEM'];

function valueHint(ruleType: RuleType): string {
  switch (ruleType) {
    case 'PERCENTAGE':
      return 'e.g. 25 → cost + 25%';
    case 'FIXED':
      return 'e.g. 1500 → flat ₹1500 added to cost';
    case 'MULTIPLIER':
      return 'e.g. 1.8 → selling price = cost × 1.8';
  }
}

function valueSuffix(ruleType: RuleType): string {
  return ruleType === 'PERCENTAGE' ? '%' : ruleType === 'MULTIPLIER' ? '×' : '₹';
}

export default function MarkupRulesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useNotification();

  const [search, setSearch] = useState('');
  const [appliesTo, setAppliesTo] = useState('');
  const [editing, setEditing] = useState<PricingRule | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['pricing-rules', { search, appliesTo }],
    queryFn: () => pricingService.getRules({ search, appliesTo }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
    queryClient.invalidateQueries({ queryKey: ['pricing-dashboard'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: RulePayload) => pricingService.createRule(payload),
    onSuccess: () => {
      showToast('Rule Created', 'Markup rule added', 'success');
      setShowCreate(false);
      invalidate();
    },
    onError: (err: any) => showToast('Error', err.response?.data?.message || 'Failed to create rule', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<RulePayload> }) => pricingService.updateRule(id, payload),
    onSuccess: () => {
      showToast('Rule Updated', 'Markup rule saved', 'success');
      setEditing(null);
      invalidate();
    },
    onError: (err: any) => showToast('Error', err.response?.data?.message || 'Failed to update rule', 'error'),
  });

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search rules by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-thermal-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <select value={appliesTo} onChange={(e) => setAppliesTo(e.target.value)} className={selectClass + ' !w-auto'}>
            <option value="">All Scopes</option>
            {APPLIES_TO.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Rule
          </button>
        </div>
      </div>

      {/* Rules table */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-5 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Percent className="w-4 h-4 text-thermal-500" /> Markup Rules
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Resolution order: item-specific rule beats category rule beats global; higher priority wins within a scope
          </p>
        </div>
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading rules…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Rule</th>
                  <th className="py-3.5 px-4">Markup</th>
                  <th className="py-3.5 px-4">Applies To</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Updated</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {rules.length === 0 ? (
                  <EmptyRow message="No markup rules yet — selling price will equal cost until a rule exists" colSpan={7} />
                ) : (
                  rules.map((rule) => (
                    <tr key={rule.id} className={`hover:bg-slate-800/30 transition-colors ${!rule.isActive ? 'opacity-50' : ''}`}>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white">{rule.name}</p>
                        <p className="text-[10px] text-slate-500">by {rule.createdBy || '—'}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-thermal-400">
                          {rule.ruleType === 'FIXED' ? '₹' : ''}
                          {rule.ruleValue}
                          {valueSuffix(rule.ruleType)}
                        </span>
                        <p className="text-[10px] text-slate-500">{rule.ruleType}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold ${
                            rule.appliesTo === 'ITEM'
                              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                              : rule.appliesTo === 'CATEGORY'
                              ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                              : 'bg-slate-500/10 text-slate-300 border-slate-500/30'
                          }`}
                        >
                          {rule.appliesTo}
                        </span>
                        {(rule.appliesTo === 'ITEM' || rule.appliesTo === 'CATEGORY') && (
                          <p className="text-[10px] text-slate-500 mt-1">
                            {rule.appliesTo === 'ITEM' ? `${rule.itemCode || ''} ${rule.itemName || ''}`.trim() : rule.categoryName || ''}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-semibold text-slate-300">{rule.priority}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            rule.isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {rule.isActive ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{formatDateTime(rule.updatedAt)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditing(rule)}
                            className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-colors"
                            title="Edit rule"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              updateMutation.mutate({
                                id: rule.id,
                                payload: { isActive: !rule.isActive },
                              })
                            }
                            className={`p-1.5 rounded-lg border transition-colors ${
                              rule.isActive
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}
                            title={rule.isActive ? 'Disable rule' : 'Enable rule'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(showCreate || editing) && (
        <RuleFormModal
          rule={editing}
          onClose={() => {
            setShowCreate(false);
            setEditing(null);
          }}
          onSubmit={(payload) => {
            if (editing) updateMutation.mutate({ id: editing.id, payload });
            else createMutation.mutate(payload);
          }}
          pending={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}

/* ─── Create / edit modal ─────────────────────────────────────────────────── */

function RuleFormModal({
  rule,
  onClose,
  onSubmit,
  pending,
}: {
  rule: PricingRule | null;
  onClose: () => void;
  onSubmit: (payload: RulePayload) => void;
  pending: boolean;
}) {
  const { data: lookup } = useQuery({ queryKey: ['pricing-lookup'], queryFn: pricingService.getLookup });
  const [itemSearch, setItemSearch] = useState('');

  const [form, setForm] = useState({
    name: rule?.name || '',
    ruleType: (rule?.ruleType || 'PERCENTAGE') as RuleType,
    ruleValue: rule ? String(rule.ruleValue) : '',
    appliesTo: (rule?.appliesTo || 'GLOBAL') as RuleAppliesTo,
    itemId: rule?.itemId || '',
    categoryId: rule?.categoryId || '',
    priority: rule ? String(rule.priority) : '0',
  });

  // Item picker (only when appliesTo === 'ITEM')
  const { data: itemsData } = useQuery({
    queryKey: ['pricing-items', { search: itemSearch, limit: 8 }],
    queryFn: () => pricingService.getItems({ search: itemSearch, limit: 8 }),
    enabled: form.appliesTo === 'ITEM',
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-lg w-full glass-card rounded-3xl p-6 border border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Percent className="w-5 h-5 text-thermal-500" /> {rule ? 'Edit Markup Rule' : 'New Markup Rule'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const payload: RulePayload = {
              name: form.name.trim(),
              ruleType: form.ruleType,
              ruleValue: Number(form.ruleValue),
              appliesTo: form.appliesTo,
              priority: parseInt(form.priority, 10) || 0,
            };
            if (form.appliesTo === 'ITEM' && form.itemId) payload.itemId = form.itemId;
            if (form.appliesTo === 'CATEGORY' && form.categoryId) payload.categoryId = form.categoryId;
            onSubmit(payload);
          }}
          className="space-y-4"
        >
          <Field label="Rule Name *">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="e.g. HPU Standard Markup"
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Markup Type">
              <select value={form.ruleType} onChange={(e) => setForm({ ...form, ruleType: e.target.value as RuleType })} className={selectClass}>
                {RULE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Value *" hint={valueHint(form.ruleType)}>
              <input
                type="number"
                step="0.01"
                required
                value={form.ruleValue}
                onChange={(e) => setForm({ ...form, ruleValue: e.target.value })}
                className={inputClass}
                placeholder={form.ruleType === 'MULTIPLIER' ? '1.8' : form.ruleType === 'PERCENTAGE' ? '25' : '1500'}
              />
            </Field>
          </div>

          <Field label="Applies To">
            <select
              value={form.appliesTo}
              onChange={(e) => setForm({ ...form, appliesTo: e.target.value as RuleAppliesTo })}
              className={selectClass}
            >
              {APPLIES_TO.map((a) => (
                <option key={a} value={a}>
                  {a === 'GLOBAL' ? 'GLOBAL (all items)' : a === 'CATEGORY' ? 'CATEGORY (all items in a category)' : 'ITEM (one specific item)'}
                </option>
              ))}
            </select>
          </Field>

          {form.appliesTo === 'CATEGORY' && (
            <Field label="Category *">
              <select
                required
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className={selectClass}
              >
                <option value="">— Select category —</option>
                {lookup?.categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {form.appliesTo === 'ITEM' && (
            <Field label="Item *">
              <div className="space-y-2">
                <input
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className={inputClass}
                  placeholder="Search item by code or name…"
                />
                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-800 divide-y divide-slate-800/60">
                  {(itemsData?.items || []).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setForm({ ...form, itemId: item.id })}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                        form.itemId === item.id ? 'bg-thermal-500/15 text-thermal-300' : 'hover:bg-slate-800/50 text-slate-300'
                      }`}
                    >
                      <span className="font-mono font-bold">{item.code}</span> — {item.name}
                    </button>
                  ))}
                </div>
                {form.itemId && (
                  <p className="text-[10px] text-emerald-400 font-semibold">✓ Item selected</p>
                )}
              </div>
            </Field>
          )}

          <Field label="Priority" hint="Higher number wins when multiple rules match the same scope">
            <input
              type="number"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className={inputClass}
            />
          </Field>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || (form.appliesTo === 'ITEM' && !form.itemId) || (form.appliesTo === 'CATEGORY' && !form.categoryId)}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              {pending ? 'Saving…' : rule ? 'Save Changes' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
