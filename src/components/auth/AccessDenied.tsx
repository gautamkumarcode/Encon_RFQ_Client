'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';

/** Spinner shown while the session/profile is still resolving. */
export function GateFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-thermal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/**
 * Single access-denied panel shared by every route guard, so role gates and
 * permission gates look identical to the user.
 */
export default function AccessDenied({
  title = 'Access restricted',
  hint,
}: {
  title?: string;
  /** Who CAN get in — phrased by the caller, never a raw class name. */
  hint: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-6 py-16 text-center">
      <ShieldAlert className="w-8 h-8 text-amber-500" />
      <h2 className="text-sm font-bold text-slate-200">{title}</h2>
      <p className="text-xs text-slate-400 max-w-sm">{hint}</p>
    </div>
  );
}
