'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Boxes,
  TrendingUp,
  AlertTriangle,
  History,
  Plus,
  Upload,
  ArrowRight,
  Package,
} from 'lucide-react';
import { pricingService } from '@/services/pricingService';
import { ItemTypeBadge, StatusPill, EmptyRow, formatMoney, formatDateTime } from '@/components/pricing/ui';

const TYPE_LABELS: Record<string, string> = {
  PRODUCT: 'Products',
  COMPONENT: 'Components',
  ASSEMBLY: 'Assemblies',
  RAW_MATERIAL: 'Raw Materials',
  SPARE: 'Spares',
  SERVICE: 'Services',
};

export default function PricingDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['pricing-dashboard'],
    queryFn: pricingService.getDashboard,
  });

  const cards = data?.cards;

  const statCards = [
    {
      label: 'Total Items',
      value: cards?.totalItems ?? 0,
      icon: Boxes,
      tone: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      link: '/pricing/items',
    },
    {
      label: 'Active Items',
      value: cards?.activeItems ?? 0,
      icon: Package,
      tone: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      link: '/pricing/items?isActive=true',
    },
    {
      label: 'Items Without Price',
      value: cards?.itemsWithoutPrice ?? 0,
      icon: AlertTriangle,
      tone: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      link: '/pricing/items?priceStatus=MISSING',
    },
    {
      label: 'Price Changes This Month',
      value: cards?.priceChangesThisMonth ?? 0,
      icon: TrendingUp,
      tone: 'text-thermal-400 bg-thermal-500/10 border-thermal-500/30',
      link: '/pricing/history',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/pricing/items/new"
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Item
        </Link>
        <Link
          href="/pricing/rules"
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all border border-slate-700"
        >
          <History className="w-4 h-4 text-thermal-400" /> View Markup Rules
        </Link>
        <Link
          href="/pricing/import"
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all border border-slate-700"
        >
          <Upload className="w-4 h-4 text-thermal-400" /> Import / Export
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, tone, link }) => (
          <Link key={label} href={link} className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-extrabold text-white mt-1.5">
                  {isLoading ? <span className="text-slate-600">···</span> : value.toLocaleString('en-IN')}
                </p>
              </div>
              <div className={`p-3 rounded-xl border ${tone}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Item type breakdown */}
      <div className="glass-card rounded-3xl border border-slate-800 p-5">
        <h2 className="text-sm font-bold text-white mb-4">Item Master by Type</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(TYPE_LABELS).map(([type, label]) => (
            <Link
              key={type}
              href={`/pricing/items?itemType=${type}`}
              className="bg-slate-900/60 border border-slate-800 hover:border-thermal-500/40 rounded-2xl p-4 transition-colors"
            >
              <ItemTypeBadge type={type} />
              <p className="text-xl font-extrabold text-white mt-2">
                {cards ? (cards.byType[type] || 0).toLocaleString('en-IN') : '···'}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Recent price changes */}
        <div className="xl:col-span-3 glass-card rounded-3xl border border-slate-800 overflow-hidden">
          <div className="p-5 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Recent Price Changes</h2>
            <Link href="/pricing/history" className="text-[10px] font-semibold text-thermal-400 hover:text-thermal-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4 text-right">Previous</th>
                  <th className="py-3 px-4 text-right">New</th>
                  <th className="py-3 px-4">Changed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-xs text-slate-400">Loading…</td>
                  </tr>
                ) : !data?.recentPriceChanges?.length ? (
                  <EmptyRow message="No price changes yet" colSpan={4} />
                ) : (
                  data.recentPriceChanges.map((h) => {
                    const pct =
                      h.previousPrice && h.previousPrice !== 0
                        ? ((h.newPrice - h.previousPrice) / h.previousPrice) * 100
                        : null;
                    return (
                      <tr key={h.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-white">{h.itemCode}</p>
                          <p className="text-[10px] text-slate-500 truncate max-w-[220px]">{h.itemName}</p>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400">
                          {h.previousPrice !== null ? formatMoney(h.previousPrice, h.currency) : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-white">{formatMoney(h.newPrice, h.currency)}</span>
                          {pct !== null && (
                            <span className={`ml-1.5 text-[10px] font-semibold ${pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {pct >= 0 ? '+' : ''}
                              {pct.toFixed(1)}%
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-slate-300">{formatDateTime(h.changedAt)}</p>
                          <p className="text-[10px] text-slate-500">{h.changedBy}</p>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Missing pricing */}
        <div className="xl:col-span-2 glass-card rounded-3xl border border-slate-800 overflow-hidden">
          <div className="p-5 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Missing Pricing
            </h2>
            <StatusPill status={`${cards?.itemsWithoutPrice ?? 0} items`} />
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!data?.itemsWithMissingPricing?.length ? (
              <div className="py-12 text-center text-xs text-slate-400">All active items are priced</div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {data.itemsWithMissingPricing.map((i) => (
                  <Link
                    key={i.id}
                    href={`/pricing/items/${i.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white">{i.code}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[240px]">{i.name}</p>
                    </div>
                    <ItemTypeBadge type={i.itemType} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
