'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calculator, Boxes, History, Percent, Upload, Coins } from 'lucide-react';

const TABS = [
  { label: 'Overview', path: '/pricing', icon: Calculator },
  { label: 'Items', path: '/pricing/items', icon: Boxes },
  { label: 'Costing', path: '/pricing/costing', icon: Coins },
  { label: 'Markup Rules', path: '/pricing/rules', icon: Percent },
  { label: 'Price History', path: '/pricing/history', icon: History },
  { label: 'Import / Export', path: '/pricing/import', icon: Upload },
];

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Module header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-thermal-500" /> Pricing
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Centralized item master, versioned prices, costing and markup rules
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="glass-card p-2 rounded-2xl border border-slate-800 flex flex-wrap gap-1">
        {TABS.map(({ label, path, icon: Icon }) => {
          const active = path === '/pricing' ? pathname === '/pricing' : pathname.startsWith(path);
          return (
            <Link
              key={path}
              href={path}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                active
                  ? 'bg-thermal-500/15 text-thermal-400 border border-thermal-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
