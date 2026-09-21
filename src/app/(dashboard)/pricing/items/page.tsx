'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Download, Eye, Boxes } from 'lucide-react';
import { pricingService } from '@/services/pricingService';
import {
  ItemTypeBadge,
  SortHeader,
  EmptyRow,
  Pagination,
  formatMoney,
  formatDate,
  inputClass,
  selectClass,
} from '@/components/pricing/ui';

function ItemsTable() {
  const searchParams = useSearchParams();

  const [search, setSearch] = useState('');
  const [itemType, setItemType] = useState(searchParams.get('itemType') || '');
  const [isActive, setIsActive] = useState(searchParams.get('isActive') || '');
  const [priceStatus, setPriceStatus] = useState(searchParams.get('priceStatus') || '');
  const [sort, setSort] = useState('code');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data, isLoading } = useQuery({
    queryKey: ['pricing-items', { search, itemType, isActive, priceStatus, sort, order, page }],
    queryFn: () =>
      pricingService.getItems({ search, itemType, isActive, priceStatus, sort, order, page, limit }),
  });

  const { data: meta } = useQuery({ queryKey: ['pricing-meta'], queryFn: pricingService.getMeta });
  const { data: lookup } = useQuery({ queryKey: ['pricing-lookup'], queryFn: pricingService.getLookup });

  const [categoryId, setCategoryId] = useState('');
  useEffect(() => {
    setPage(1);
  }, [search, itemType, categoryId, isActive, priceStatus]);

  const onSort = (field: string) => {
    if (sort === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(field);
      setOrder('asc');
    }
    setPage(1);
  };

  const items = data?.items || [];

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search code, name, manufacturer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-thermal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select value={itemType} onChange={(e) => setItemType(e.target.value)} className={selectClass + ' !w-auto'}>
            <option value="">All Types</option>
            {meta?.itemTypes.map((t) => (
              <option key={t} value={t}>
                {t.replace('_', ' ')}
              </option>
            ))}
          </select>

          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={selectClass + ' !w-auto'}>
            <option value="">All Categories</option>
            {lookup?.categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <select value={priceStatus} onChange={(e) => setPriceStatus(e.target.value)} className={selectClass + ' !w-auto'}>
            <option value="">Any Price Status</option>
            <option value="ACTIVE">Priced</option>
            <option value="MISSING">Missing Price</option>
          </select>

          <select value={isActive} onChange={(e) => setIsActive(e.target.value)} className={selectClass + ' !w-auto'}>
            <option value="">All Items</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={pricingService.exportUrl}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Download current price list as CSV"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </a>
          <Link
            href="/pricing/items/new"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Item
          </Link>
        </div>
      </div>

      {/* Items table */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading items…</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                    <SortHeader label="Code" field="code" sort={sort} order={order} onSort={onSort} />
                    <SortHeader label="Item" field="name" sort={sort} order={order} onSort={onSort} />
                    <SortHeader label="Type" field="itemType" sort={sort} order={order} onSort={onSort} />
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Unit</th>
                    <SortHeader label="Current Price" field="unitPrice" sort={sort} order={order} onSort={onSort} align="right" />
                    <SortHeader label="Updated" field="updatedAt" sort={sort} order={order} onSort={onSort} />
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {items.length === 0 ? (
                    <EmptyRow message="No items match the current filters" colSpan={9} />
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-thermal-400">{item.code}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-thermal-500/15 text-thermal-400 font-bold text-[10px] flex items-center justify-center border border-thermal-500/25">
                              <Boxes className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <Link href={`/pricing/items/${item.id}`} className="font-bold text-white hover:text-thermal-400 transition-colors">
                                {item.name}
                              </Link>
                              <p className="text-[10px] text-slate-500 truncate max-w-[280px]">
                                {[item.manufacturer, item.model].filter(Boolean).join(' · ') || '—'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <ItemTypeBadge type={item.itemType} />
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">{item.category || '—'}</td>
                        <td className="py-3.5 px-4 text-slate-300">{item.unit || '—'}</td>
                        <td className="py-3.5 px-4 text-right">
                          {item.currentPrice ? (
                            <div>
                              <span className="font-bold text-white">
                                {formatMoney(item.currentPrice.unitPrice, item.currentPrice.currency)}
                              </span>
                              <p className="text-[10px] text-slate-500">
                                v{item.currentPrice.version} · {item.currentPrice.priceType}
                              </p>
                            </div>
                          ) : (
                            <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                              NOT CONFIGURED
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{formatDate(item.updatedAt)}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold inline-flex items-center border ${
                              item.isActive
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {item.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/pricing/items/${item.id}`}
                            className="inline-flex p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-colors"
                            title="View item details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              page={data?.meta.page ?? 1}
              totalPages={data?.meta.totalPages ?? 1}
              total={data?.meta.total ?? 0}
              onPage={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default function PricingItemsPage() {
  return (
    <Suspense fallback={<div className="glass-card rounded-3xl border border-slate-800 p-12 text-center text-xs text-slate-400">Loading…</div>}>
      <ItemsTable />
    </Suspense>
  );
}
