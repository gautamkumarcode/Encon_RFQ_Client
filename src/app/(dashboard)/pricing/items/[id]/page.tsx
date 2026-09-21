'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit2,
  TrendingUp,
  Coins,
  Calculator,
  Trash2,
  AlertTriangle,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { pricingService } from '@/services/pricingService';
import { useNotification } from '@/context/NotificationContext';
import {
  ItemTypeBadge,
  StatusPill,
  EmptyRow,
  formatMoney,
  formatDate,
  formatDateTime,
} from '@/components/pricing/ui';
import { PriceVersionModal } from '@/components/pricing/PriceVersionModal';
import { CostVersionModal } from '@/components/pricing/CostVersionModal';
import { EditItemModal } from '@/components/pricing/EditItemModal';

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast, showConfirm } = useNotification();

  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const { data, isLoading, isError, error }: any = useQuery({
    queryKey: ['pricing-item', id],
    queryFn: () => pricingService.getItem(id as string),
    enabled: !!id,
  });

  const deactivateMutation = useMutation({
    mutationFn: () => pricingService.deactivateItem(id as string),
    onSuccess: () => {
      showToast('Item Deactivated', `${data?.item.code} is now inactive`, 'success');
      queryClient.invalidateQueries({ queryKey: ['pricing-item', id] });
      queryClient.invalidateQueries({ queryKey: ['pricing-items'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-dashboard'] });
    },
    onError: (err: any) => showToast('Error', err.response?.data?.message || 'Failed to deactivate', 'error'),
  });

  if (isLoading) {
    return <div className="glass-card rounded-3xl border border-slate-800 p-12 text-center text-xs text-slate-400">Loading item…</div>;
  }

  if (isError || !data) {
    return (
      <div className="glass-card rounded-3xl border border-slate-800 p-12 text-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
        <p className="text-xs text-slate-300">{error?.response?.data?.message || 'Item not found'}</p>
        <Link href="/pricing/items" className="text-xs font-semibold text-thermal-400 hover:text-thermal-300">
          ← Back to items
        </Link>
      </div>
    );
  }

  const { item, currentPrice, priceVersions, costVersion, calculation } = data;
  const calcError = calculation && 'error' in calculation ? calculation : null;
  const calc = calculation && !calcError ? calculation : null;

  const infoRows = [
    ['Category', item.category || '—'],
    ['Unit', item.unit || '—'],
    ['Supplier', item.supplier || '—'],
    ['Manufacturer', item.manufacturer || '—'],
    ['Model', item.model || '—'],
    ['Created', `${formatDate(item.createdAt)} by ${item.createdBy || '—'}`],
    ['Last Updated', `${formatDate(item.updatedAt)} by ${item.updatedBy || '—'}`],
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div className="flex items-start gap-4">
          <Link
            href="/pricing/items"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors mt-1"
            title="Back to items"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold text-white font-mono text-thermal-400">{item.code}</h2>
              <ItemTypeBadge type={item.itemType} />
              <StatusPill status={item.isActive ? 'ACTIVE' : 'INACTIVE'} />
              {item.isPurchasable && <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">PURCHASABLE</span>}
              {item.isSellable && <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">SELLABLE</span>}
            </div>
            <h1 className="text-xl font-extrabold text-white mt-1">{item.name}</h1>
            {item.specifications && <p className="text-xs text-slate-400 mt-1 max-w-2xl">{item.specifications}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowPriceModal(true)}
            className="px-4 py-2.5 bg-thermal-600 hover:bg-thermal-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
          >
            <TrendingUp className="w-4 h-4" /> New Price Version
          </button>
          <button
            onClick={() => setShowCostModal(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-2 transition-all"
          >
            <Coins className="w-4 h-4 text-thermal-400" /> New Cost Version
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className="p-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-colors"
            title="Edit item master data"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {item.isActive && (
            <button
              onClick={() =>
                showConfirm({
                  title: 'Deactivate Item',
                  message: `Deactivate ${item.code}? Existing price versions are preserved. The item will no longer appear as active in the item master.`,
                  confirmText: 'Deactivate',
                  type: 'warning',
                  onConfirm: () => deactivateMutation.mutate(),
                })
              }
              className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
              title="Deactivate item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Price / calculation / cost cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current price */}
        <div className="glass-card rounded-3xl border border-slate-800 p-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Current Price</h3>
          {currentPrice ? (
            <>
              <p className="text-2xl font-extrabold text-white">
                {formatMoney(currentPrice.unitPrice, currentPrice.currency)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Version {currentPrice.version} · {currentPrice.priceType} · effective {formatDate(currentPrice.effectiveFrom)}
              </p>
              {currentPrice.reason && <p className="text-[10px] text-slate-500 mt-1 italic">“{currentPrice.reason}”</p>}
              <div className="mt-3">
                <StatusPill status={currentPrice.status} />
              </div>
            </>
          ) : (
            <div className="py-4">
              <AlertTriangle className="w-6 h-6 text-amber-400 mb-2" />
              <p className="text-xs text-slate-300 font-semibold">PRICING_NOT_CONFIGURED</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Pricing is not configured for item {item.code}. Create the first price version.
              </p>
            </div>
          )}
        </div>

        {/* Selling price calculation */}
        <div className="glass-card rounded-3xl border border-slate-800 p-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-thermal-400" /> Selling Price Calculation
          </h3>
          {calcError ? (
            <div className="py-2">
              <p className="text-xs font-semibold text-amber-400">{calcError.error}</p>
              <p className="text-[10px] text-slate-500 mt-1">{calcError.message}</p>
            </div>
          ) : calc ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Cost ({calc.costBasis || 'basis'})</span>
                <span className="font-semibold text-white">{formatMoney(calc.cost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">
                  Markup {calc.markupRule ? `(${calc.markupRule.name} · ${calc.markupRule.type} ${calc.markupRule.value})` : ''}
                </span>
                <span className="font-semibold text-thermal-400">+{formatMoney(calc.markupAmount)}</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between items-center">
                <span className="text-slate-300 font-bold">Selling Price</span>
                <span className="text-lg font-extrabold text-thermal-400">{formatMoney(calc.sellingPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Margin</span>
                <span className="font-semibold text-emerald-400">
                  {calc.sellingPrice > 0 ? `${((calc.margin / calc.sellingPrice) * 100).toFixed(1)}%` : '—'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-4">No calculation available</p>
          )}
        </div>

        {/* Current cost version */}
        <div className="glass-card rounded-3xl border border-slate-800 p-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Internal Cost (Latest)</h3>
          {costVersion ? (
            <>
              <p className="text-2xl font-extrabold text-white">{formatMoney(costVersion.totalCost, costVersion.currency)}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Version {costVersion.version} · {costVersion.components.length} components · effective {formatDate(costVersion.effectiveFrom)}
              </p>
              {costVersion.components.length > 0 && (
                <p className="text-[10px] text-slate-500 mt-3 italic">
                  Full component list in the Bill of Materials below.
                </p>
              )}
            </>
          ) : (
            <div className="py-4">
              <Coins className="w-6 h-6 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400">No cost version yet — costing falls back to price-based cost.</p>
            </div>
          )}
        </div>
      </div>

      {/* Master data */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-card rounded-3xl border border-slate-800 p-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Item Master Data</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
            {infoRows.map(([label, value]) => (
              <div key={label}>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{label}</p>
                <p className="text-xs text-slate-200 mt-0.5">{value}</p>
              </div>
            ))}
          </div>
          {item.description && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Description</p>
              <p className="text-xs text-slate-300 mt-1">{item.description}</p>
            </div>
          )}
        </div>

        {/* Legacy references (migration compatibility) */}
        <div className="glass-card rounded-3xl border border-slate-800 p-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Legacy References</h3>
          {item.legacyReferences?.length ? (
            <div className="space-y-2">
              {item.legacyReferences.map((ref: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400">{ref.source}</span>
                  <span className="text-xs text-slate-200 font-mono">{ref.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No legacy system references — item was created in this module.</p>
          )}
        </div>
      </div>

      {/* Bill of Materials — components of the active cost version */}
      {costVersion && costVersion.components.length > 0 && (
        <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
          <div className="p-5 pb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-thermal-500" /> Bill of Materials
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Active cost version v{costVersion.version} · {costVersion.components.length} components · effective{' '}
                {formatDate(costVersion.effectiveFrom)}
              </p>
            </div>
            <button
              onClick={() => setShowCostModal(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Coins className="w-3.5 h-3.5 text-thermal-400" /> New Cost Version
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Component</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Qty</th>
                  <th className="py-3 px-4 text-right">Rate</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {costVersion.components.map((c: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-4 text-slate-600 font-mono">{i + 1}</td>
                    <td className="py-2.5 px-4">
                      {c.matchedItem ? (
                        <Link
                          href={`/pricing/items/${c.matchedItem.id}`}
                          className="group flex items-center gap-2 text-slate-200 hover:text-thermal-400 font-semibold transition-colors"
                        >
                          {c.name}
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 group-hover:text-thermal-400">
                            {c.matchedItem.code}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-slate-200 font-semibold">{c.name}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">{c.type}</td>
                    <td className="py-2.5 px-4 text-right text-slate-300 font-mono">
                      {c.quantity} {c.unit}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-400 font-mono">{formatMoney(c.rate)}</td>
                    <td className="py-2.5 px-4 text-right text-white font-semibold font-mono">{formatMoney(c.amount)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-900/60">
                  <td className="py-3 px-4 text-slate-300 font-bold" colSpan={5}>
                    Total Internal Cost
                  </td>
                  <td className="py-3 px-4 text-right text-thermal-400 font-extrabold font-mono text-sm">
                    {formatMoney(costVersion.totalCost, costVersion.currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Price versions history */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-5 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-thermal-500" /> Price Version History
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Old prices are never overwritten — every change is a new version</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4">Effective Period</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Changed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {priceVersions.length === 0 ? (
                <EmptyRow message="No price versions yet" colSpan={7} />
              ) : (
                priceVersions.map((v: any) => (
                  <tr key={v._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-thermal-400">v{v.version}</td>
                    <td className="py-3 px-4 text-slate-300">{v.priceType}</td>
                    <td className="py-3 px-4 text-right font-bold text-white">{formatMoney(v.unitPrice, v.currency)}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {formatDate(v.effectiveFrom)} → {v.effectiveTo ? formatDate(v.effectiveTo) : 'open'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusPill status={v.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-[220px] truncate" title={v.reason}>
                      {v.reason || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-300">{formatDateTime(v.createdAt)}</p>
                      <p className="text-[10px] text-slate-500">{v.createdBy || '—'}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showPriceModal && (
        <PriceVersionModal
          itemId={item.id}
          itemCode={item.code}
          currentPrice={currentPrice ? { unitPrice: currentPrice.unitPrice, currency: currentPrice.currency, version: currentPrice.version } : null}
          onClose={() => setShowPriceModal(false)}
        />
      )}
      {showCostModal && <CostVersionModal itemId={item.id} itemCode={item.code} onClose={() => setShowCostModal(false)} />}
      {showEditModal && <EditItemModal item={item} onClose={() => setShowEditModal(false)} />}
    </div>
  );
}
