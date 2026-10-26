'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';

/** Minimal shape needed to summarize - compatible with the register's AttendanceRow. */
interface LogRow {
  userId: string;
  userName: string;
  userEmail: string;
  officeName: string;
  status: string;
  clockIn?: { time?: string | null };
  totalWorkMinutes: number | null;
}

export interface EmployeeSummary {
  userId: string;
  userName: string;
  userEmail: string;
  days: number;
  present: number;
  late: number;
  halfDay: number;
  leave: number;
  absent: number;
  totalMinutes: number;
  avgClockIn: string;
  offices: string[];
}

/** Group daily attendance rows into one summary row per employee. */
export function buildEmployeeSummary(rows: LogRow[]): EmployeeSummary[] {
  const byUser = new Map<string, LogRow[]>();
  for (const r of rows) {
    const list = byUser.get(r.userId) || [];
    list.push(r);
    byUser.set(r.userId, list);
  }

  const out: EmployeeSummary[] = [];
  for (const [userId, list] of byUser) {
    const first = list[0];
    const inMinutes: number[] = [];
    for (const r of list) {
      const t = r.clockIn?.time;
      if (t) {
        const d = new Date(t);
        inMinutes.push(d.getHours() * 60 + d.getMinutes());
      }
    }
    const avg = inMinutes.length
      ? Math.round(inMinutes.reduce((a, b) => a + b, 0) / inMinutes.length)
      : null;
    out.push({
      userId,
      userName: first.userName,
      userEmail: first.userEmail,
      days: list.length,
      present: list.filter((r) => r.status === 'PRESENT').length,
      late: list.filter((r) => r.status === 'LATE').length,
      halfDay: list.filter((r) => r.status === 'HALF_DAY').length,
      leave: list.filter((r) => r.status === 'LEAVE').length,
      absent: list.filter((r) => r.status === 'ABSENT').length,
      totalMinutes: list.reduce((a, r) => a + (r.totalWorkMinutes || 0), 0),
      avgClockIn:
        avg == null
          ? '—'
          : `${String(Math.floor(avg / 60)).padStart(2, '0')}:${String(avg % 60).padStart(2, '0')}`,
      offices: [...new Set(list.map((r) => r.officeName).filter(Boolean))],
    });
  }
  // Most days worked first, then alphabetically.
  return out.sort((a, b) => b.days - a.days || a.userName.localeCompare(b.userName));
}

export default function EmployeeSummaryTable({
  summary,
  onDrill,
}: {
  summary: EmployeeSummary[];
  onDrill: (userId: string) => void;
}) {
  if (summary.length === 0) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        No attendance in this range for these filters
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            <th className="py-3.5 px-4">Employee</th>
            <th className="py-3.5 px-4 text-center">Days</th>
            <th className="py-3.5 px-4 text-center">Present</th>
            <th className="py-3.5 px-4 text-center">Late</th>
            <th className="py-3.5 px-4 text-center">Half Day</th>
            <th className="py-3.5 px-4 text-center">Leave</th>
            <th className="py-3.5 px-4 text-center">Absent</th>
            <th className="py-3.5 px-4">Total Hours</th>
            <th className="py-3.5 px-4">Avg Clock-In</th>
            <th className="py-3.5 px-4">Branches</th>
            <th className="py-3.5 px-4 text-right">Daily Log</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-xs">
          {summary.map((s) => (
            <tr
              key={s.userId}
              onClick={() => onDrill(s.userId)}
              className="hover:bg-slate-800/30 transition-colors cursor-pointer"
            >
              <td className="py-3.5 px-4">
                <p className="font-bold text-white">{s.userName}</p>
                <p className="text-[10px] text-slate-400">{s.userEmail}</p>
              </td>
              <td className="py-3.5 px-4 text-center font-bold text-slate-200">{s.days}</td>
              <td className="py-3.5 px-4 text-center text-emerald-300">{s.present}</td>
              <td className="py-3.5 px-4 text-center text-amber-300">{s.late}</td>
              <td className="py-3.5 px-4 text-center text-sky-300">{s.halfDay}</td>
              <td className="py-3.5 px-4 text-center text-indigo-300">{s.leave}</td>
              <td className="py-3.5 px-4 text-center text-rose-300">{s.absent}</td>
              <td className="py-3.5 px-4 text-slate-200 tabular-nums">
                {Math.floor(s.totalMinutes / 60)}h {s.totalMinutes % 60}m
              </td>
              <td className="py-3.5 px-4 text-slate-300 tabular-nums">{s.avgClockIn}</td>
              <td className="py-3.5 px-4 text-slate-400">{s.offices.join(', ') || '—'}</td>
              <td className="py-3.5 px-4 text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-thermal-400">
                  View <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
