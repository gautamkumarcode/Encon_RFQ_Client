'use client';

import { Building2, MessagesSquare, ClipboardList, IndianRupee } from 'lucide-react';
import { inr } from './utils';
import type { ClientRow } from './types';

interface Props {
  rows: ClientRow[];
}

// Tally Books–style summary cards computed from the loaded client list.
export default function SummaryChips({ rows }: Props) {
  const totalValue = rows.reduce((s, r) => s + (r.orderValueINR || 0), 0);
  const totalEnquiries = rows.reduce((s, r) => s + (r.enquiryCount || 0), 0);
  const totalOrders = rows.reduce((s, r) => s + (r.orderCount || 0), 0);

  const cards = [
    { label: 'Clients', icon: Building2, dot: 'bg-sky-400', value: String(rows.length), sub: 'in party master' },
    { label: 'Enquiries', icon: MessagesSquare, dot: 'bg-indigo-400', value: String(totalEnquiries), sub: 'linked to clients' },
    { label: 'Orders', icon: ClipboardList, dot: 'bg-amber-400', value: String(totalOrders), sub: 'in hand from clients' },
    { label: 'Order Value', icon: IndianRupee, dot: 'bg-emerald-400', value: inr(totalValue), sub: 'total (INR)' },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
