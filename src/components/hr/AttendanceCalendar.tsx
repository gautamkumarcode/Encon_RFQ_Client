'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Minimal shape the calendar needs - compatible with the register's AttendanceRow. */
export interface CalRow {
  userId: string;
  userName: string;
  date: string; // ISO, stored as UTC-midnight of the office day
  status: string;
  officeName: string;
  clockIn?: { time?: string | null };
  clockOut?: { time?: string | null };
  totalWorkMinutes: number | null;
}

const dayKey = (iso: string) => iso.slice(0, 10);
const fmtHM = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

// Status -> cell styling (same palette as the register chips).
const cellCls: Record<string, string> = {
  PRESENT: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
  LATE: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
  HALF_DAY: 'bg-sky-500/15 border-sky-500/40 text-sky-300',
  ABSENT: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
  LEAVE: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300',
};

export function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function shiftMonth(key: string, delta: number) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKey(d);
}

export interface HolidayCell {
  id: string;
  date: string;
  name: string;
}

/**
 * Month grid over attendance rows. With a person drilled in it shows that
 * employee's daily status (click a day for punch details); otherwise it shows
 * per-day headcounts across everyone in range.
 */
export default function AttendanceCalendar({
  month,
  onMonthChange,
  rows,
  holidays = [],
  personMode,
  onSelectRecord,
}: {
  month: string; // 'YYYY-MM'
  onMonthChange: (key: string) => void;
  rows: CalRow[];
  holidays?: HolidayCell[];
  personMode: boolean;
  onSelectRecord?: (row: CalRow) => void;
}) {
  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const startWeekday = (new Date(y, m - 1, 1).getDay() + 6) % 7; // Mon = 0
  const label = new Date(y, m - 1, 1).toLocaleDateString([], { month: 'long', year: 'numeric' });

  const byDay = new Map<string, CalRow[]>();
  for (const r of rows) {
    const k = dayKey(r.date);
    const list = byDay.get(k) || [];
    list.push(r);
    byDay.set(k, list);
  }

  // Holiday names per day (multiple possible: company + branch specific).
  const holidaysByDay = new Map<string, string[]>();
  for (const h of holidays) {
    const k = dayKey(h.date);
    const list = holidaysByDay.get(k) || [];
    list.push(h.name);
    holidaysByDay.set(k, list);
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="p-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onMonthChange(shiftMonth(month, -1))}
            className="p-1.5 rounded-md bg-slate-800/70 text-slate-300 hover:text-white border border-slate-700/60"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMonthChange(shiftMonth(month, 1))}
            className="p-1.5 rounded-md bg-slate-800/70 text-slate-300 hover:text-white border border-slate-700/60"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <h3 className="text-sm font-bold text-white ml-1">{label}</h3>
        </div>
        <button
          onClick={() => onMonthChange(monthKey())}
          className="text-[11px] font-bold text-thermal-400 hover:text-white px-2.5 py-1.5 rounded-md border border-thermal-500/30 bg-thermal-500/10"
        >
          Today
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className={`text-center text-[10px] font-bold uppercase tracking-wider py-1 ${d === 'Sun' ? 'text-slate-300' : 'text-slate-500'}`}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, idx) => {
          if (day == null) return <div key={idx} />;
          const key = `${month}-${String(day).padStart(2, '0')}`;
          const recs = byDay.get(key) || [];
          const holNames = holidaysByDay.get(key) || [];
          const isHoliday = holNames.length > 0;
          const isSunday = idx % 7 === 6; // Monday-first grid -> last column is the weekly off
          const isToday = key === todayKey;
          const personRec = personMode && recs.length ? recs[0] : null;

          const counts = { P: 0, L: 0, H: 0, A: 0 };
          if (!personMode) {
            for (const r of recs) {
              if (r.status === 'PRESENT') counts.P++;
              else if (r.status === 'LATE') counts.L++;
              else if (r.status === 'HALF_DAY') counts.H++;
              else if (r.status === 'ABSENT') counts.A++;
            }
          }

          const cls = personRec ? cellCls[personRec.status] || '' : '';
          return (
            <button
              key={idx}
              disabled={!personRec}
              onClick={() => personRec && onSelectRecord?.(personRec)}
              className={`min-h-[64px] rounded-md border p-1.5 text-left transition-colors ${
                personRec
                  ? `${cls} cursor-pointer hover:brightness-125`
                  : isHoliday
                    ? 'border-violet-500/40 bg-violet-500/10'
                    : isSunday
                      ? 'border-slate-700/60 bg-slate-800/50'
                      : 'border-slate-800 bg-slate-900/60'
              } ${isToday ? 'ring-1 ring-thermal-500' : ''}`}
            >
              <p className="text-[10px] font-bold tabular-nums text-slate-400 flex items-center justify-between">
                <span>{day}</span>
                {isHoliday && <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />}
              </p>
              {personRec ? (
                <div className="mt-1 space-y-0.5">
                  <p className="text-[9px] font-black leading-none">{personRec.status.replace('_', ' ')}</p>
                  {fmtHM(personRec.clockIn?.time) && (
                    <p className="text-[9px] tabular-nums leading-none opacity-80">
                      {fmtHM(personRec.clockIn?.time)}
                      {personRec.clockOut?.time ? ` → ${fmtHM(personRec.clockOut.time)}` : ''}
                    </p>
                  )}
                  {personRec.officeName && (
                    <p className="text-[8px] leading-none opacity-70 truncate">{personRec.officeName}</p>
                  )}
                </div>
              ) : recs.length ? (
                <div className="mt-1 space-y-0.5 text-[9px] font-bold tabular-nums leading-none">
                  <p className="text-emerald-400">{counts.P} present</p>
                  {counts.L > 0 && <p className="text-amber-400">{counts.L} late</p>}
                  {counts.H > 0 && <p className="text-sky-400">{counts.H} half</p>}
                  {counts.A > 0 && <p className="text-rose-400">{counts.A} absent</p>}
                </div>
              ) : isSunday && !isHoliday ? (
                <p className="mt-1 text-[8px] font-black text-slate-500 leading-none tracking-wide">OFF</p>
              ) : null}
              {isHoliday && (
                <p className="text-[8px] font-bold text-violet-300 leading-none truncate" title={holNames.join(', ')}>
                  {holNames.join(', ')}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-violet-500/40 bg-violet-500/15" /> Holiday
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-slate-700/60 bg-slate-800/50" /> Weekly off (Sunday)
        </span>
        {personMode ? (
          Object.entries({
            PRESENT: 'Present',
            LATE: 'Late',
            HALF_DAY: 'Half Day',
            LEAVE: 'Leave',
            ABSENT: 'Absent',
          }).map(([s, labelTxt]) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded border ${cellCls[s] || ''}`} /> {labelTxt}
            </span>
          ))
        ) : (
          <span>Select an employee in the Daily Log or Summary tab to see their personal calendar</span>
        )}
      </div>
    </div>
  );
}
