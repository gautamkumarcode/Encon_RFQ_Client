'use client';

import { STATUS_BADGE_CLASS, DEFAULT_BADGE_CLASS } from './constants';

export default function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_BADGE_CLASS[status] || DEFAULT_BADGE_CLASS;
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {status}
    </span>
  );
}
