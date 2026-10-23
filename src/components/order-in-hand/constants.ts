// ---------------------------------------------------------------------------
// Static configuration for the Order in Hand feature.
// ---------------------------------------------------------------------------

export const ORDER_STATUS = [
  'Received',
  'In Progress',
  'Waiting for PI',
  'PO HOLD',
  'Dispatch under progress',
  'Dispatched',
  'On Hold',
  'Closed',
];

export const CURRENCIES = ['INR', 'USD', 'EUR', 'AED'];

export const CURRENCY_SYMBOL: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  AED: 'AED ',
};

// Tailwind classes for the status pill in the orders table.
export const STATUS_BADGE_CLASS: Record<string, string> = {
  Received: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  'In Progress': 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
  'Waiting for PI': 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  'PO HOLD': 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  'On Hold': 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  'Dispatch under progress': 'bg-violet-500/10 text-violet-300 border-violet-500/30',
  Dispatched: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  Closed: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
};

export const DEFAULT_BADGE_CLASS = 'bg-slate-500/10 text-slate-300 border-slate-500/30';

// Shared input styling for the dark slate theme (matches the Tally Books modal).
export const INPUT_CLS =
  'w-full rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-thermal-500/60 focus:outline-none focus:ring-1 focus:ring-thermal-500/40';

export const LABEL_CLS = 'mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500';
