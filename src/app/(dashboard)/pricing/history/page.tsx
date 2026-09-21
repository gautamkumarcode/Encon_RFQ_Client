'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { History, Search } from 'lucide-react';
import { pricingService } from '@/services/pricingService';
import {
  ItemTypeBadge,
  StatusPill,
  EmptyRow,
  Pagination,
  formatMoney,
  formatDateTime,
  formatDate,
  inputClass,
  selectClass,
} from '@/components/pricing/ui';

export default function PriceHistoryPage() {
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const limit = 25;

  useEffect(() => {
    setPage(1);
  }, [search, from, to]);

  const { data, isLoading } = useQuery({
    queryKey: ['pricing-history', { search, from, to, page }],
    queryFn: () => pricingService.getHistory({ search, from, to, page, limit }),
  });

  const rows = data?.rows || [];

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by item code or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-thermal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass + ' !w-auto'} title="Changed from" />
          <span className="text-[10px] text-slate-500">to</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass + ' !w-auto'} title="Changed to" />
          {(from || to) && (
            <button
              onClick={() => {
                setFrom('');
                setTo('');
              }}
              className="text-[10px] font-semibold text-thermal-400 hover:text-thermal-300"
            >
              Clear dates
            </button>
          )}
        </div>
      </div>

      {/* History table */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-5 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-thermal-500" /> Price Change History
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Every price version ever created — old prices are never deleted or overwritten
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading history…</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Previous</th>
                    <th className="py-3 px-4 text-right">New Price</th>
                    <th className="py-3 px-4">Change</th>
                    <th className="py-3 px-4">Version</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Changed By</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {rows.length === 0 ? (
                    <EmptyRow message="No price changes found" colSpan={9} />
                  ) : (
                    rows.map((h) => {
                      const pct =
                        h.previousPrice && h.previousPrice !== 0
                          ? ((h.newPrice - h.previousPrice) / h.previousPrice) * 100
                          : null;
                      return (
                        <tr key={h.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4">
                            <Link href={`/pricing/items/${h.itemId}`} className="font-bold text-thermal-400 hover:text-thermal-300 font-mono text-[11px]">
                              {h.itemCode}
                            </Link>
                            <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{h.itemName}</p>
                          </td>
                          <td className="py-3 px-4">
                            <ItemTypeBadge type={h.itemType} />
                          </td>
                          <td className="py-3 px-4 text-right text-slate-400">
                            {h.previousPrice !== null ? formatMoney(h.previousPrice, h.currency) : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-white">{formatMoney(h.newPrice, h.currency)}</td>
                          <td className="py-3 px-4">
                            {pct !== null ? (
                              <span className={`font-semibold ${pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {pct >= 0 ? '+' : ''}
                                {pct.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">first price</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono font-semibold text-slate-300">v{h.version}</span>
                            <p className="text-[10px] text-slate-500">{h.priceType}</p>
                          </td>
                          <td className="py-3 px-4 text-slate-400 max-w-[200px] truncate" title={h.reason}>
                            {h.reason || '—'}
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-slate-300">{h.changedBy || '—'}</p>
                            <p className="text-[10px] text-slate-500">{formatDateTime(h.changedAt)}</p>
                            <p className="text-[9px] text-slate-600">effective {formatDate(h.effectiveFrom)}</p>
                          </td>
                          <td className="py-3 px-4">
                            <StatusPill status={h.status} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={data?.meta.page ?? 1} totalPages={data?.meta.totalPages ?? 1} total={data?.meta.total ?? 0} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
