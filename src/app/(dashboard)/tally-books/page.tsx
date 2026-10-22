'use client';

import React, { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '../../../services/api';
import {
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardList,
  Search,
  RefreshCw,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Wallet,
  X,
  ChevronRight,
} from 'lucide-react';

type TabKey = 'Debtors' | 'Creditors' | 'Bank' | 'Cash' | 'Orders';

interface BookRow {
  id: string;
  company: string;
  category: string;
  name: string;
  ref: string;
  date: string | null;
  amount: number;
  opening: number;
  syncedAt: string;
}

interface BooksResponse {
  success: boolean;
  category?: string;
  count: number;
  total: number;
  lastSynced: string | null;
  data: BookRow[];
}

interface CatSummary {
  count: number;
  total: number;
  totalOpening?: number;
}
interface SummaryResponse {
  success: boolean;
  lastSynced: string | null;
  data: {
    Debtors: CatSummary;
    Creditors: CatSummary;
    Bank: CatSummary;
    Cash: CatSummary;
    SalesOrder: CatSummary;
    PurchaseOrder: CatSummary;
    OrdersInHand: CatSummary;
  };
}

interface BankTxnRow {
  id: string;
  date: string;
  voucherType: string;
  voucherNumber: string;
  party: string;
  narration: string;
  debit: number;
  credit: number;
  balance: number;
}
interface BankTxnResponse {
  success: boolean;
  bank: string;
  company: string;
  opening: number;      // period opening (balance carried into the window)
  closing: number;      // period closing (balance at end of window)
  computedClosing: number;
  fyClosing: number;    // full-FY closing (unfiltered)
  count: number;        // rows in the window
  totalCount: number;   // rows across the whole FY for this account
  totalDebit: number;
  totalCredit: number;
  months: string[];     // 'YYYY-MM' list of months with activity
  data: BankTxnRow[];
}

const inr = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

// Tally number format: Indian grouping, 2 decimals, no symbol.
const fmt = (v: number) =>
  v ? new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) : '';

// Balance shown the accounting way (like Tally): magnitude + Dr/Cr side, so an
// overdraft/credit balance reads "50,37,283.58 Cr" instead of a raw minus sign.
const fmtBal = (v: number) => {
  const x = v || 0;
  if (Math.abs(x) < 0.005) return '0.00';
  const s = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(x));
  return `${s} ${x < 0 ? 'Cr' : 'Dr'}`;
};

// Split a party's display-convention balance into its Debit / Credit column.
// Stored positive = the party's normal side (Debtors/Bank -> Dr, Creditors -> Cr).
const split = (category: string, v: number): { dr: number; cr: number } => {
  const normalDr = category !== 'Creditors';
  const x = v || 0;
  return normalDr ? { dr: x > 0 ? x : 0, cr: x < 0 ? -x : 0 } : { cr: x > 0 ? x : 0, dr: x < 0 ? -x : 0 };
};

const AmountCell = ({ value, muted }: { value: number; muted?: boolean }) => (
  <td className={`px-4 py-2 text-right text-xs tabular-nums whitespace-nowrap ${value ? (muted ? 'text-slate-500' : 'text-slate-200') : 'text-slate-600'}`}>
    {value ? fmt(value) : '-'}
  </td>
);

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'Debtors', label: 'Debtors', icon: ArrowDownLeft },
  { key: 'Creditors', label: 'Creditors', icon: ArrowUpRight },
  { key: 'Bank', label: 'Bank', icon: Landmark },
  { key: 'Cash', label: 'Cash', icon: Wallet },
  { key: 'Orders', label: 'Orders in Hand', icon: ClipboardList },
];

// Clickable column header that toggles sort direction and shows an indicator.
const SortBtn = ({ label, active, dir, onClick }: { label: string; active: boolean; dir: 'asc' | 'desc'; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1 uppercase tracking-wider transition-colors hover:text-slate-100"
  >
    {label}
    {active
      ? dir === 'asc'
        ? <ChevronUp className="h-3 w-3 text-thermal-400" />
        : <ChevronDown className="h-3 w-3 text-thermal-400" />
      : <ArrowUpDown className="h-3 w-3 opacity-40" />}
  </button>
);

export default function TallyBooksPage() {
  const [tab, setTab] = useState<TabKey>('Debtors');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'amount'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showZero, setShowZero] = useState(false);
  const [drillBank, setDrillBank] = useState<string | null>(null);
  // Transaction drill-down date filter (month quick-select + explicit range).
  const [txnMonth, setTxnMonth] = useState('');       // 'YYYY-MM' or ''
  const [txnFrom, setTxnFrom] = useState('');         // 'YYYY-MM-DD'
  const [txnTo, setTxnTo] = useState('');             // 'YYYY-MM-DD'

  const { data: summary } = useQuery<SummaryResponse>({
    queryKey: ['tallyBooksSummary'],
    queryFn: async () => (await api.get('/tally/books/summary')).data,
  });

  const { data: drill, isFetching: drillFetching, isPlaceholderData } = useQuery<BankTxnResponse>({
    // Refetch whenever the account or the date window changes — the backend does
    // the filtering and computes the exact period-opening balance.
    queryKey: ['tallyBankTxns', drillBank, txnFrom, txnTo],
    queryFn: async () =>
      (await api.get('/tally/banks/transactions', {
        params: { bank: drillBank, ...(txnFrom ? { from: txnFrom } : {}), ...(txnTo ? { to: txnTo } : {}) },
      })).data,
    enabled: !!drillBank,
    // Keep the previous rows on screen while the new window loads — stops the
    // modal from flashing an empty/loading state and jumping height on month change.
    placeholderData: keepPreviousData,
  });

  // Months that have activity — served unfiltered so the picker stays stable.
  const txnMonths = drill?.months ?? [];
  // Rows already narrowed to the selected window by the backend.
  const filteredTxns = drill?.data ?? [];

  const resetTxnFilters = () => { setTxnMonth(''); setTxnFrom(''); setTxnTo(''); };
  // Picking a month also sets the explicit range to that month's bounds.
  const applyMonth = (m: string) => {
    setTxnMonth(m);
    if (m) {
      const [y, mo] = m.split('-').map(Number);
      const lastDay = new Date(Date.UTC(y, mo, 0)).getUTCDate();
      setTxnFrom(`${m}-01`);
      setTxnTo(`${m}-${String(lastDay).padStart(2, '0')}`);
    } else {
      setTxnFrom(''); setTxnTo('');
    }
  };
  const openDrill = (name: string) => { setDrillBank(name); resetTxnFilters(); };
  const closeDrill = () => { setDrillBank(null); resetTxnFilters(); };
  const monthLabel = (m: string) => {
    const [y, mo] = m.split('-').map(Number);
    return new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  };
  const txnFilterActive = !!(txnMonth || txnFrom || txnTo);

  const { data, isLoading, refetch, isRefetching } = useQuery<BooksResponse>({
    queryKey: ['tallyBooks', tab, search],
    queryFn: async () => {
      if (tab === 'Orders') {
        const [so, po] = await Promise.all([
          (await api.get('/tally/books', { params: { category: 'SalesOrder', search, limit: 500 } })).data as BooksResponse,
          (await api.get('/tally/books', { params: { category: 'PurchaseOrder', search, limit: 500 } })).data as BooksResponse,
        ]);
        const merged = [...(so.data || []), ...(po.data || [])].sort((a, b) => b.amount - a.amount);
        return {
          success: true,
          count: merged.length,
          total: (so.total || 0) + (po.total || 0),
          lastSynced: so.lastSynced || po.lastSynced || null,
          data: merged,
        } as BooksResponse;
      }
      return (await api.get('/tally/books', { params: { category: tab, search, limit: 500 } })).data;
    },
  });

  const records = data?.data ?? [];
  const isOrders = tab === 'Orders';
  const isAccount = tab === 'Bank' || tab === 'Cash';

  // Hide nil-closing rows by default (matches Tally, which omits zero-balance
  // parties AND zero-balance bank/cash ledgers). The "Show nil-balance" toggle
  // reveals them again. Orders in Hand always lists every open order.
  const visible = useMemo(() => {
    if (isOrders) return records;
    return showZero ? records : records.filter((r) => Math.abs(r.amount) >= 0.5);
  }, [records, showZero, isOrders]);

  const toggleSort = (key: 'name' | 'amount') => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const sorted = useMemo(() => {
    const arr = [...visible];
    arr.sort((a, b) =>
      sortKey === 'name'
        ? (sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))
        : (sortDir === 'asc' ? a.amount - b.amount : b.amount - a.amount)
    );
    return arr;
  }, [visible, sortKey, sortDir]);

  // Gross Debit / Credit totals for the Grand Total row.
  const totals = visible.reduce(
    (a, r) => { const c = split(r.category, r.amount); a.dr += c.dr; a.cr += c.cr; return a; },
    { dr: 0, cr: 0 }
  );

  const lastSync = data?.lastSynced || summary?.lastSynced;

  const cards = [
    { key: 'Debtors', label: 'Total Debtors', stat: summary?.data.Debtors, icon: ArrowDownLeft, dot: 'bg-emerald-400', unit: 'parties' },
    { key: 'Creditors', label: 'Total Creditors', stat: summary?.data.Creditors, icon: ArrowUpRight, dot: 'bg-rose-400', unit: 'parties' },
    { key: 'Bank', label: 'Bank Balance', stat: summary?.data.Bank, icon: Landmark, dot: 'bg-sky-400', unit: 'accounts' },
    { key: 'Orders', label: 'Orders in Hand', stat: summary?.data.OrdersInHand, icon: ClipboardList, dot: 'bg-amber-400', unit: 'orders' },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Books Position</h1>
          <p className="mt-1 text-xs text-slate-400">Party-wise balances and orders in hand, synced from Tally.</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.key} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <Icon className="h-3.5 w-3.5 text-slate-600" /> {c.label}
                </span>
                <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
              </div>
              <div className="mt-1 text-2xl font-bold tabular-nums text-white">
                {c.stat ? inr(c.stat.total) : '—'}
              </div>
              <div className="mt-0.5 text-[11px] tabular-nums text-slate-500">
                {c.stat ? `${c.stat.count} ${c.unit}` : ''}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-1 self-start rounded-lg border border-slate-800 bg-slate-900/60 p-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setDrillBank(null); }}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  active ? 'bg-slate-800 text-slate-100 shadow-sm ring-1 ring-inset ring-slate-700' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-4">
          {!isOrders && (
            <label className="inline-flex shrink-0 cursor-pointer select-none items-center gap-1.5 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={showZero}
                onChange={(e) => setShowZero(e.target.checked)}
                className="h-3.5 w-3.5 accent-thermal-500"
              />
              Show nil-balance
            </label>
          )}
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
            <input
              type="text"
              placeholder={isOrders ? 'Search party or order no.' : 'Search party'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/60 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-thermal-500/60 focus:outline-none focus:ring-1 focus:ring-thermal-500/40"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-slate-900/40">
        {isLoading ? (
          <div className="px-4 py-16 text-center text-xs text-slate-500">Loading…</div>
        ) : records.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <Landmark className="mx-auto h-6 w-6 text-slate-700" />
            <p className="mt-3 text-xs text-slate-400">No {tab.toLowerCase()} data synced yet.</p>
            <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-slate-600">
              Run the tally-connect agent with TALLY_SYNC_BOOKS=true while the company is open in Tally.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                {isOrders ? (
                  <tr className="bg-slate-900/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="w-10 px-4 py-2.5 font-semibold">#</th>
                    <th className="px-4 py-2.5 font-semibold">Type</th>
                    <th className="px-4 py-2.5 font-semibold">Order No.</th>
                    <th className="px-4 py-2.5 font-semibold"><SortBtn label="Party" active={sortKey === 'name'} dir={sortDir} onClick={() => toggleSort('name')} /></th>
                    <th className="px-4 py-2.5 font-semibold">Date</th>
                    <th className="px-4 py-2.5 text-right font-semibold"><span className="flex justify-end"><SortBtn label="Value" active={sortKey === 'amount'} dir={sortDir} onClick={() => toggleSort('amount')} /></span></th>
                  </tr>
                ) : (
                  <>
                    <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <th rowSpan={2} className="w-10 px-4 py-2.5 text-left align-bottom font-semibold">#</th>
                      <th rowSpan={2} className="px-4 py-2.5 align-bottom font-semibold"><SortBtn label="Particulars" active={sortKey === 'name'} dir={sortDir} onClick={() => toggleSort('name')} /></th>
                      <th colSpan={2} className="px-4 py-2 text-center font-semibold"><span className="flex justify-center"><SortBtn label="Closing Balance" active={sortKey === 'amount'} dir={sortDir} onClick={() => toggleSort('amount')} /></span></th>
                    </tr>
                    <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-2 text-right font-semibold">Debit</th>
                      <th className="px-4 py-2 text-right font-semibold">Credit</th>
                    </tr>
                  </>
                )}
              </thead>
              <tbody>
                {sorted.map((r, i) => {
                  if (isOrders) {
                    return (
                      <tr key={r.id} className={`transition-colors ${i % 2 ? 'bg-slate-800/40' : ''} hover:bg-slate-700/50`}>
                        <td className="px-4 py-2 text-xs tabular-nums text-slate-500">{i + 1}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${r.category === 'SalesOrder' ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20' : 'bg-sky-500/10 text-sky-300 ring-sky-500/20'}`}>
                            {r.category === 'SalesOrder' ? 'Sales' : 'Purchase'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-300">{r.ref || '—'}</td>
                        <td className="px-4 py-2 text-xs text-slate-200">{r.name}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-500">{r.date ? new Date(r.date).toLocaleDateString('en-IN') : '—'}</td>
                        <td className="px-4 py-2 text-right text-xs tabular-nums text-slate-200">{inr(r.amount)}</td>
                      </tr>
                    );
                  }
                  const c = split(r.category, r.amount);
                  return (
                    <tr
                      key={r.id}
                      onClick={isAccount ? () => openDrill(r.name) : undefined}
                      className={`transition-colors ${i % 2 ? 'bg-slate-800/40' : ''} ${isAccount ? 'cursor-pointer hover:bg-thermal-500/10' : 'hover:bg-slate-700/50'}`}
                    >
                      <td className="px-4 py-2 text-xs tabular-nums text-slate-500">{i + 1}</td>
                      <td className="px-4 py-2 text-xs text-slate-200">
                        {isAccount ? (
                          <span className="inline-flex items-center gap-1.5">
                            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                            {r.name}
                          </span>
                        ) : r.name}
                      </td>
                      <AmountCell value={c.dr} muted={!c.dr} />
                      <AmountCell value={c.cr} muted={!c.cr} />
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                {isOrders ? (
                  <tr className="bg-slate-900/60 text-xs font-semibold text-slate-100">
                    <td className="px-4 py-2.5" colSpan={5}>{records.length} orders</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{inr(data?.total ?? 0)}</td>
                  </tr>
                ) : (
                  <tr className="bg-slate-900/60 text-xs font-semibold text-slate-100">
                    <td className="px-4 py-2.5" colSpan={2}>Grand Total<span className="ml-1 font-normal text-slate-500">({visible.length})</span></td>
                    <AmountCell value={totals.dr} />
                    <AmountCell value={totals.cr} />
                  </tr>
                )}
              </tfoot>
            </table>
          </div>
        )}

        {/* Status bar */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/60 px-4 py-2 text-[11px] text-slate-500">
          <span>{isOrders ? 'Sales & purchase orders in hand' : isAccount ? 'Click an account to view its transactions' : 'Closing balances as per Tally'}</span>
          <span className="tabular-nums">
            Last sync: {lastSync ? new Date(lastSync).toLocaleString('en-IN') : 'Never'}
          </span>
        </div>
      </div>

      {/* Per-bank / per-cash transaction drill-down */}
      {drillBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => closeDrill()}>
          <div className="flex max-h-[80vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-slate-800 px-5 py-3">
              <div>
                <div className="text-sm font-semibold text-white">{drillBank}</div>
                <div className="mt-0.5 text-[11px] tabular-nums text-slate-500">
                  Opening {fmtBal(drill?.opening ?? 0)} · Closing {fmtBal(drill?.closing ?? 0)} · {drill?.totalCount ?? 0} transactions
                </div>
              </div>
              <button onClick={() => closeDrill()} className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Date filter — always shown so you can narrow before/while data loads. */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-900/60 px-5 py-2.5">
                <select
                  value={txnMonth}
                  onChange={(e) => applyMonth(e.target.value)}
                  className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:border-thermal-500/60 focus:outline-none"
                >
                  <option value="">All months</option>
                  {txnMonths.map((m) => (<option key={m} value={m}>{monthLabel(m)}</option>))}
                </select>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <input type="date" value={txnFrom} onChange={(e) => { setTxnFrom(e.target.value); setTxnMonth(''); }} className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:border-thermal-500/60 focus:outline-none" />
                  <span>to</span>
                  <input type="date" value={txnTo} onChange={(e) => { setTxnTo(e.target.value); setTxnMonth(''); }} className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:border-thermal-500/60 focus:outline-none" />
                </div>
                {txnFilterActive && (
                  <button onClick={resetTxnFilters} className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100">Clear</button>
                )}
                <span className="ml-auto text-[11px] tabular-nums text-slate-500">Showing {filteredTxns.length} of {drill?.totalCount ?? 0}</span>
              </div>
            {drillFetching && <div className="h-0.5 w-full animate-pulse bg-thermal-500/70" />}
            <div className="min-h-[220px] flex-1 overflow-auto">
              {!drill && drillFetching ? (
                <div className="px-4 py-16 text-center text-xs text-slate-500">Loading transactions…</div>
              ) : drill?.totalCount ? (
                <table className={`w-full border-collapse text-left transition-opacity duration-150 ${drillFetching ? 'opacity-50' : ''}`}>
                  <thead className="sticky top-0 bg-slate-900">
                    <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Voucher</th>
                      <th className="px-4 py-2">Particulars</th>
                      <th className="px-4 py-2 text-right">Debit</th>
                      <th className="px-4 py-2 text-right">Credit</th>
                      <th className="px-4 py-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTxns.map((t, idx) => (
                      <tr key={t.id} className={`border-t border-slate-800/70 ${idx % 2 ? 'bg-slate-800/30' : ''}`}>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-400">{new Date(t.date).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-400">{t.voucherType}{t.voucherNumber ? ` #${t.voucherNumber}` : ''}</td>
                        <td className="px-4 py-2 text-xs text-slate-200">
                          <div>{t.party || '—'}</div>
                          {t.narration ? <div className="mt-0.5 text-[11px] text-slate-500">{t.narration}</div> : null}
                        </td>
                        <td className={`px-4 py-2 text-right whitespace-nowrap text-xs tabular-nums ${t.debit ? 'text-emerald-300' : 'text-slate-600'}`}>{t.debit ? fmt(t.debit) : '-'}</td>
                        <td className={`px-4 py-2 text-right whitespace-nowrap text-xs tabular-nums ${t.credit ? 'text-rose-300' : 'text-slate-600'}`}>{t.credit ? fmt(t.credit) : '-'}</td>
                        <td className="px-4 py-2 text-right whitespace-nowrap text-xs tabular-nums text-slate-200 min-w-[130px]">{fmtBal(t.balance)}</td>
                      </tr>
                    ))}
                    {filteredTxns.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-16 text-center text-xs text-slate-500">No transactions in the selected date range.</td></tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-700 bg-slate-900/80 text-xs font-semibold text-slate-200">
                      <td className="px-4 py-2.5" colSpan={3}>Total<span className="ml-1 font-normal text-slate-500">({filteredTxns.length})</span></td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap tabular-nums text-emerald-300">{fmt(drill?.totalDebit ?? 0) || '0.00'}</td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap tabular-nums text-rose-300">{fmt(drill?.totalCredit ?? 0) || '0.00'}</td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap tabular-nums min-w-[130px]">{fmtBal(drill?.closing ?? 0)}</td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <div className="px-4 py-16 text-center text-xs text-slate-500">No transactions found for this account.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
