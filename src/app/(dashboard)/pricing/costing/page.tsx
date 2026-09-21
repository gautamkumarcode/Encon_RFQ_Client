'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Coins, Search, Calculator, AlertTriangle, ExternalLink } from 'lucide-react';
import { pricingService } from '@/services/pricingService';
import {
  ItemTypeBadge,
  formatMoney,
  formatDate,
  formatDateTime,
  inputClass,
} from '@/components/pricing/ui';
import { CostVersionModal } from '@/components/pricing/CostVersionModal';

export default function CostingPage() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCostModal, setShowCostModal] = useState(false);

  // Item picker — searches the item master by code / name
  const { data: itemsData } = useQuery({
    queryKey: ['pricing-items', { search, limit: 10 }],
    queryFn: () => pricingService.getItems({ search, limit: 10 }),
    enabled: !selectedId,
  });

  const { data: detail, isLoading } = useQuery({
    queryKey: ['pricing-item', selectedId],
    queryFn: () => pricingService.getItem(selectedId as string),
    enabled: !!selectedId,
  });

  const items = itemsData?.items || [];
  const calc = detail?.calculation && !('error' in (detail.calculation as any)) ? (detail.calculation as any) : null;
  const calcError = detail?.calculation && 'error' in (detail.calculation as any) ? (detail.calculation as any) : null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Item picker */}
      <div className="glass-card p-5 rounded-3xl border border-slate-800">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Coins className="w-4 h-4 text-thermal-500" /> Costing Calculator
        </h2>
        <p className="text-[10px] text-slate-500 mb-4">
          Purchase / material price → internal cost → markup rule → selling price. All math runs on the server.
        </p>

        {selectedId && detail ? (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-thermal-400 text-xs">{detail.item.code}</span>
                <ItemTypeBadge type={detail.item.itemType} />
              </div>
              <p className="text-xs text-white font-semibold mt-0.5">{detail.item.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCostModal(true)}
                className="px-3.5 py-2 bg-thermal-600 hover:bg-thermal-500 text-white font-bold text-[11px] rounded-xl shadow-md flex items-center gap-1.5 transition-all"
              >
                <Coins className="w-3.5 h-3.5" /> New Cost Version
              </button>
              <Link
                href={`/pricing/items/${detail.item.id}`}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="Open item detail"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => {
                  setSelectedId(null);
                  setSearch('');
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold rounded-xl border border-slate-700 transition-colors"
              >
                Change item
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={inputClass + ' pl-9'}
              placeholder="Search item by code or name to cost…"
            />
            {search && (
              <div className="mt-2 rounded-2xl border border-slate-800 bg-slate-900/90 divide-y divide-slate-800/60 overflow-hidden">
                {items.length === 0 ? (
                  <p className="p-4 text-xs text-slate-500">No matching items</p>
                ) : (
                  items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-800/50 text-left transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs">
                          <span className="font-mono font-bold text-thermal-400">{item.code}</span>{' '}
                          <span className="text-white font-semibold">{item.name}</span>
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {item.category || '—'} {item.unit ? `· ${item.unit}` : ''}
                        </p>
                      </div>
                      <ItemTypeBadge type={item.itemType} />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Calculation result */}
      {!selectedId && (
        <div className="glass-card rounded-3xl border border-slate-800 p-12 text-center">
          <Calculator className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-xs text-slate-400">Select an item above to see its cost breakdown and selling price.</p>
        </div>
      )}

      {selectedId && isLoading && (
        <div className="glass-card rounded-3xl border border-slate-800 p-12 text-center text-xs text-slate-400">Calculating…</div>
      )}

      {selectedId && detail && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Flow: cost → markup → selling price */}
          <div className="glass-card rounded-3xl border border-slate-800 p-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Price Build-up</h3>

            {calcError ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-300">{calcError.error}</p>
                    <p className="text-[11px] text-slate-300 mt-1">{calcError.message}</p>
                  </div>
                </div>
              </div>
            ) : (
              calc && (
                <div className="space-y-4">
                  {/* Cost */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Internal Cost</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {calc.costBasis === 'COST_VERSION'
                          ? `From active cost version${detail.costVersion ? ` (v${detail.costVersion.version})` : ''}`
                          : `From ${calc.costBasis || 'current'} price`}
                      </p>
                    </div>
                    <span className="text-lg font-extrabold text-white">{formatMoney(calc.cost)}</span>
                  </div>

                  <div className="flex justify-center">
                    <span className="text-slate-600 text-xs">↓</span>
                  </div>

                  {/* Markup */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Markup Rule</p>
                      {calc.markupRule ? (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {calc.markupRule.name} — {calc.markupRule.type} {calc.markupRule.value}
                          {calc.markupRule.type === 'PERCENTAGE' ? '%' : calc.markupRule.type === 'MULTIPLIER' ? '×' : ' flat'}
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-500 mt-0.5">No rule matched — zero markup</p>
                      )}
                    </div>
                    <span className="text-lg font-extrabold text-thermal-400">+{formatMoney(calc.markupAmount)}</span>
                  </div>

                  <div className="flex justify-center">
                    <span className="text-slate-600 text-xs">↓</span>
                  </div>

                  {/* Selling price */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-thermal-500/10 border border-thermal-500/30">
                    <div>
                      <p className="text-[10px] text-thermal-400 uppercase tracking-wider font-bold">Selling Price</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Margin {formatMoney(calc.margin)} (
                        {calc.sellingPrice > 0 ? `${((calc.margin / calc.sellingPrice) * 100).toFixed(1)}%` : '—'} of selling price)
                      </p>
                    </div>
                    <span className="text-2xl font-extrabold text-thermal-400">{formatMoney(calc.sellingPrice)}</span>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Current inputs */}
          <div className="space-y-6">
            <div className="glass-card rounded-3xl border border-slate-800 p-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Current Price Input</h3>
              {detail.currentPrice ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Price ({detail.currentPrice.priceType}, v{detail.currentPrice.version})</span>
                    <span className="font-bold text-white">{formatMoney(detail.currentPrice.unitPrice, detail.currentPrice.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Effective from</span>
                    <span className="text-slate-300">{formatDate(detail.currentPrice.effectiveFrom)}</span>
                  </div>
                  {detail.currentPrice.reason && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Reason</span>
                      <span className="text-slate-300 italic max-w-[200px] truncate">{detail.currentPrice.reason}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No price configured for this item yet.</p>
              )}
            </div>

            <div className="glass-card rounded-3xl border border-slate-800 p-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Active Cost Version</h3>
              {detail.costVersion ? (
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-xl border border-slate-800">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900/80 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          <th className="py-2.5 px-3">Component</th>
                          <th className="py-2.5 px-3 text-right">Qty × Rate</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-[11px]">
                        {detail.costVersion.components.map((c: any, i: number) => (
                          <tr key={i}>
                            <td className="py-2.5 px-3">
                              <p className="text-slate-200 font-semibold">{c.name}</p>
                              <p className="text-[9px] text-slate-500">{c.type}</p>
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-400 font-mono">
                              {c.quantity} × {c.rate}
                            </td>
                            <td className="py-2.5 px-3 text-right text-white font-semibold font-mono">{formatMoney(c.amount)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-900/60">
                          <td className="py-2.5 px-3 text-slate-300 font-bold" colSpan={2}>
                            Total
                          </td>
                          <td className="py-2.5 px-3 text-right text-thermal-400 font-extrabold font-mono">
                            {formatMoney(detail.costVersion.totalCost, detail.costVersion.currency)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    v{detail.costVersion.version} · created {formatDateTime(detail.costVersion.createdAt)}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  No cost version — the calculator falls back to the current purchase / material price as cost.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {showCostModal && selectedId && detail && (
        <CostVersionModal itemId={detail.item.id} itemCode={detail.item.code} onClose={() => setShowCostModal(false)} />
      )}
    </div>
  );
}
