'use client';

import { ClipboardList, IndianRupee, Hourglass } from 'lucide-react';
import { inr } from './utils';

interface Props {
  count: number;
  totalINR: number;
  openINR: number;
  openCount?: number;
}

// Tally Books–style summary cards: icon + label header, accent dot, big value, subline.
export default function SummaryChips({ count, totalINR, openINR, openCount }: Props) {
  const cards = [
    {
      label: 'Orders in Hand',
      icon: ClipboardList,
      dot: 'bg-amber-400',
      value: String(count),
      sub: `${count} order${count === 1 ? '' : 's'}`,
    },
    {
      label: 'Total Value',
      icon: IndianRupee,
      dot: 'bg-emerald-400',
      value: inr(totalINR),
      sub: 'order book (INR)',
    },
    {
      label: 'Open (not dispatched)',
      icon: Hourglass,
      dot: 'bg-sky-400',
      value: inr(openINR),
      sub: openCount != null ? `${openCount} live order${openCount === 1 ? '' : 's'}` : 'awaiting dispatch',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <Icon className="h-3.5 w-3.5 text-slate-600" /> {c.label}
              </span>
              <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
            </div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-white">{c.value}</div>
            <div className="mt-0.5 text-[11px] tabular-nums text-slate-500">{c.sub}</div>
          </div>
        );
      })}
    </div>
  );
}
