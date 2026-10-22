'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  ChevronLeft,
  Receipt,
  Truck,
  Loader2,
} from 'lucide-react';

type TabKey = 'Debtors' | 'Creditors' | 'Bank' | 'Cash' | 'SalesReg' | 'PurchaseReg';

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

interface VoucherRow {
  id: string;
  company: string;
  voucherType: string;
  voucherNumber: string;
  date: string;
  partyName: string;
  amount: number;
}
interface VouchersResponse {
  success: boolean;
  count: number;
  totalAmount: number;
  lastSynced: string | null;
  data: VoucherRow[];
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

// Reusable pagination footer: rows-per-page picker, range indicator and
// windowed page numbers (1 … 4 5 6 … 20). Used by every table on the page.
const PaginationBar = ({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
  onPageSize: (n: number) => void;
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);
  const navBtn =
    'inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40';
  const pages: (number | 'gap')[] = [];
  if (totalPages <= 7) {
    for (let n = 1; n <= totalPages; n++) pages.push(n);
  } else {
    pages.push(1);
    if (current > 3) pages.push('gap');
    for (let n = Math.max(2, current - 1); n <= Math.min(totalPages - 1, current + 1); n++) pages.push(n);
    if (current < totalPages - 2) pages.push('gap');
    pages.push(totalPages);
  }
  return (
    <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-800 bg-slate-900/60 px-4 py-2.5 sm:flex-row">
      <div className="flex items-center gap-2 text-[11px] text-slate-500">
        <span>Rows per page</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          className="rounded-md border border-slate-700 bg-slate-800 px-1.5 py-1 text-xs text-slate-200 focus:border-thermal-500/60 focus:outline-none"
        >
          {[25, 50, 100, 250].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span className="tabular-nums">Showing {from}–{to} of {total}</span>
      </div>
      <div className="flex items-center gap-1">
        <button type="button" className={navBtn} onClick={() => onPage(current - 1)} disabled={current <= 1}>
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </button>
        {pages.map((p, idx) =>
          p === 'gap' ? (
            <span key={`gap-${idx}`} className="px-1 text-xs text-slate-600">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              className={`min-w-[28px] rounded-md px-2 py-1 text-xs tabular-nums transition-colors ${
                p === current
                  ? 'bg-slate-700 text-slate-100 ring-1 ring-inset ring-slate-600'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button type="button" className={navBtn} onClick={() => onPage(current + 1)} disabled={current >= totalPages}>
          Next <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

// A single full-width spinner row shown inside <tbody> while a search/fetch is
// in flight, so the table body itself reflects loading (header + footer stay put).
const LoadingBodyRow = ({ colSpan }: { colSpan: number }) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-16 text-center text-xs text-slate-500">
      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-thermal-400" />
      Loading…
    </td>
  </tr>
);

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'Debtors', label: 'Debtors', icon: ArrowDownLeft },
  { key: 'Creditors', label: 'Creditors', icon: ArrowUpRight },
  { key: 'Bank', label: 'Bank', icon: Landmark },
  { key: 'Cash', label: 'Cash', icon: Wallet },
  { key: 'SalesReg', label: 'Sales Register', icon: Receipt },
  { key: 'PurchaseReg', label: 'Purchase Register', icon: Truck },
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

// Debounce a fast-changing value (e.g. the search box) so we only re-query the
// API after typing pauses for `delay` ms — not on every keystroke.
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function TallyBooksPage() {
  const [tab, setTab] = useState<TabKey>('Debtors');
  const [search, setSearch] = useState('');
  // Only the debounced value reaches the queries; the input stays instant-typed.
  const debSearch = useDebouncedValue(search, 400);
  const [sortKey, setSortKey] = useState<'name' | 'amount'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showZero, setShowZero] = useState(false);
  const [drillBank, setDrillBank] = useState<string | null>(null);
  // Transaction drill-down date filter (month quick-select + explicit range).
  const [txnMonth, setTxnMonth] = useState('');       // 'YYYY-MM' or ''
  const [txnFrom, setTxnFrom] = useState('');         // 'YYYY-MM-DD'
  const [txnTo, setTxnTo] = useState('');             // 'YYYY-MM-DD'

  // Pagination — the content table and the transaction modal keep separate page
  // state so paging one doesn't disturb the other.
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [txnPage, setTxnPage] = useState(1);
  const [txnPageSize, setTxnPageSize] = useState(100);
  const tableRef = useRef<HTMLDivElement>(null);
  const txnScrollRef = useRef<HTMLDivElement>(null);

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

  // Sales / Purchase registers list realized vouchers from tally_vouchers. The
  // `type` filter must match the stored voucherType: this company books its sales
  // under "GST INVOICE1" (not "Sales"), purchases under "Purchase".
  const isRegister = tab === 'SalesReg' || tab === 'PurchaseReg';
  const regType = tab === 'SalesReg' ? 'GST INVOICE1' : 'Purchase';
  const regLabel = tab === 'SalesReg' ? 'Sales' : 'Purchase';

  const { data, isLoading, refetch, isRefetching } = useQuery<BooksResponse>({
    queryKey: ['tallyBooks', tab, debSearch],
    queryFn: async () =>
      (await api.get('/tally/books', { params: { category: tab, search: debSearch, limit: 500 } })).data,
    enabled: !isRegister,
  });

  // Register query — only active on the Sales/Purchase tabs. High limit so the
  // whole register loads (backend caps totalAmount to the returned rows).
  const {
    data: vdata,
    isLoading: vLoading,
    isFetching: vFetching,
    refetch: vRefetch,
  } = useQuery<VouchersResponse>({
    queryKey: ['tallyVouchers', regType, debSearch],
    queryFn: async () =>
      (await api.get('/tally/vouchers', {
        params: { type: regType, ...(debSearch ? { party: debSearch } : {}), limit: 2000 },
      })).data as VouchersResponse,
    enabled: isRegister,
  });

  const records = data?.data ?? [];
  const isAccount = tab === 'Bank' || tab === 'Cash';

  // Hide nil-closing rows by default (matches Tally, which omits zero-balance
  // parties AND zero-balance bank/cash ledgers). The "Show nil-balance" toggle
  // reveals them again.
  const visible = useMemo(() => {
    return showZero ? records : records.filter((r) => Math.abs(r.amount) >= 0.5);
  }, [records, showZero]);

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

  // Loading feedback for search: true while the debounce hasn't settled (typed
  // text differs from the queried value) or the request is in flight.
  const activeFetching = isRegister ? vFetching : isRefetching;
  const searching = search !== debSearch || activeFetching;

  // Reset to page 1 whenever the underlying rows change (tab, search, sort,
  // nil-balance toggle) or the modal's account/date window changes.
  useEffect(() => { setPage(1); }, [tab, debSearch, sortKey, sortDir, showZero]);
  useEffect(() => { setTxnPage(1); }, [drillBank, txnFrom, txnTo]);

  // Page the active content table. startIdx offsets row numbers + zebra striping
  // so they stay continuous across pages. The Grand Total / footer still reflects
  // the full result set, not just the visible page.
  const changePage = (p: number) => {
    setPage(p);
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const changePageSize = (n: number) => { setPageSize(n); setPage(1); };
  const mainTotal = isRegister ? (vdata?.data?.length ?? 0) : sorted.length;
  const startIdx = (page - 1) * pageSize;
  const pagedSorted = sorted.slice(startIdx, startIdx + pageSize);
  const pagedReg = (vdata?.data ?? []).slice(startIdx, startIdx + pageSize);

  const changeTxnPage = (p: number) => {
    setTxnPage(p);
    txnScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const changeTxnPageSize = (n: number) => { setTxnPageSize(n); setTxnPage(1); };
  const txnTotal = filteredTxns.length;
  const txnStart = (txnPage - 1) * txnPageSize;
  const pagedTxns = filteredTxns.slice(txnStart, txnStart + txnPageSize);

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
          onClick={() => (isRegister ? vRefetch() : refetch())}
          disabled={isRegister ? vFetching : isRefetching}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${(isRegister ? vFetching : isRefetching) ? 'animate-spin' : ''}`} />
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
          {!isRegister && (
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
            {searching ? (
              <Loader2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-thermal-400" />
            ) : (
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
            )}
            <input
              type="text"
              placeholder="Search party"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/60 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-thermal-500/60 focus:outline-none focus:ring-1 focus:ring-thermal-500/40"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div ref={tableRef} className="scroll-smooth relative overflow-hidden rounded-xl bg-slate-900/40">
        {isRegister ? (
          vLoading ? (
            <div className="px-4 py-16 text-center text-xs text-slate-500">Loading…</div>
          ) : !(vdata?.data?.length) ? (
            <div className="px-4 py-16 text-center">
              <Receipt className="mx-auto h-6 w-6 text-slate-700" />
              <p className="mt-3 text-xs text-slate-400">No {regLabel.toLowerCase()} vouchers synced yet.</p>
              <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-slate-600">
                Run the tally-connect agent while the company is open in Tally to sync vouchers.
              </p>
            </div>
          ) : (
            <div className="scroll-smooth min-h-[40vh] overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-900/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="w-10 px-4 py-2.5 font-semibold">#</th>
                    <th className="px-4 py-2.5 font-semibold">Date</th>
                    <th className="px-4 py-2.5 font-semibold">Voucher No.</th>
                    <th className="px-4 py-2.5 font-semibold">Party</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {searching ? (
                    <LoadingBodyRow colSpan={5} />
                  ) : (
                    pagedReg.map((v, i) => (
                      <tr key={v.id} className={`transition-colors ${(startIdx + i) % 2 ? 'bg-slate-800/40' : ''} hover:bg-slate-700/50`}>
                        <td className="px-4 py-2 text-xs tabular-nums text-slate-500">{startIdx + i + 1}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-400">{new Date(v.date).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-300">{v.voucherNumber || '—'}</td>
                        <td className="px-4 py-2 text-xs text-slate-200">{v.partyName}</td>
                        <td className="px-4 py-2 text-right whitespace-nowrap text-xs tabular-nums text-slate-200">{fmt(v.amount) || '0.00'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {/* Grand total as a table footer row so each figure lines up under
                    its own column. Plain (uncoloured) text to match the body. */}
                <tfoot>
                  <tr className="border-t border-slate-700 bg-slate-900/60 text-xs font-semibold text-slate-200">
                    <td colSpan={4} className="px-4 py-2.5">{vdata.count} {regLabel} vouchers</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{fmt(vdata.totalAmount) || '0.00'}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )
        ) : isLoading ? (
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
          <div className="scroll-smooth min-h-[40vh] overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th rowSpan={2} className="w-10 px-4 py-2.5 text-left align-bottom font-semibold">#</th>
                  <th rowSpan={2} className="px-4 py-2.5 align-bottom font-semibold"><SortBtn label="Particulars" active={sortKey === 'name'} dir={sortDir} onClick={() => toggleSort('name')} /></th>
                  <th colSpan={2} className="px-4 py-2 text-center font-semibold"><span className="flex justify-center"><SortBtn label="Closing Balance" active={sortKey === 'amount'} dir={sortDir} onClick={() => toggleSort('amount')} /></span></th>
                </tr>
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-2 text-right font-semibold">Debit</th>
                  <th className="px-4 py-2 text-right font-semibold">Credit</th>
                </tr>
              </thead>
              <tbody>
                {searching ? (
                  <LoadingBodyRow colSpan={4} />
                ) : (
                  pagedSorted.map((r, i) => {
                    const c = split(r.category, r.amount);
                    return (
                      <tr
                        key={r.id}
                        onClick={isAccount ? () => openDrill(r.name) : undefined}
                        className={`transition-colors ${(startIdx + i) % 2 ? 'bg-slate-800/40' : ''} ${isAccount ? 'cursor-pointer hover:bg-thermal-500/10' : 'hover:bg-slate-700/50'}`}
                      >
                        <td className="px-4 py-2 text-xs tabular-nums text-slate-500">{startIdx + i + 1}</td>
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
                  })
                )}
              </tbody>
              {/* Grand total as a table footer row so each figure lines up under its
                  own column. Plain (uncoloured) text to match the body. */}
              <tfoot>
                <tr className="border-t border-slate-700 bg-slate-900/60 text-xs font-semibold text-slate-200">
                  <td className="px-4 py-2.5"></td>
                  <td className="px-4 py-2.5">Grand Total<span className="ml-1 font-normal text-slate-500">({visible.length})</span></td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmt(totals.dr) || '0.00'}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmt(totals.cr) || '0.00'}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {mainTotal > 0 && (
          <PaginationBar
            page={page}
            pageSize={pageSize}
            total={mainTotal}
            onPage={changePage}
            onPageSize={changePageSize}
          />
        )}

        {/* Status bar */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/60 px-4 py-2 text-[11px] text-slate-500">
          <span>{isRegister ? `Realized ${regLabel.toLowerCase()} vouchers as per Tally` : isAccount ? 'Click an account to view its transactions' : 'Closing balances as per Tally'}</span>
          <span className="tabular-nums">
            Last sync: {(() => { const ls = isRegister ? vdata?.lastSynced : lastSync; return ls ? new Date(ls).toLocaleString('en-IN') : 'Never'; })()}
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
            <div ref={txnScrollRef} className="scroll-smooth min-h-[220px] flex-1 overflow-auto">
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
                    {pagedTxns.map((t, idx) => (
                      <tr key={t.id} className={`border-t border-slate-800/70 ${(txnStart + idx) % 2 ? 'bg-slate-800/30' : ''}`}>
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
            {txnTotal > 0 && (
              <PaginationBar
                page={txnPage}
                pageSize={txnPageSize}
                total={txnTotal}
                onPage={changeTxnPage}
                onPageSize={changeTxnPageSize}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
