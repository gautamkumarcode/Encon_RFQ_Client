'use client';

import React from 'react';
import { X, MapPin, LogIn, LogOut, ShieldCheck, ShieldAlert, Smartphone, Globe } from 'lucide-react';

/** One punch as stored by the backend Attendance PunchSchema. */
export interface PunchDetail {
  time?: string | null;
  officeId?: string | null;
  lat?: number;
  lng?: number;
  accuracy?: number;
  address?: string;
  geofenceOk?: boolean;
  ip?: string;
  userAgent?: string;
}

export interface AttendanceDetailRow {
  id: string;
  userName: string;
  userEmail: string;
  officeId: string | null;
  officeName: string;
  date: string;
  status: string;
  clockIn: PunchDetail;
  clockOut: PunchDetail;
  totalWorkMinutes: number | null;
  source?: string;
  remark?: string;
}

const statusCls: Record<string, string> = {
  PRESENT: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  LATE: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  HALF_DAY: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  ABSENT: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  LEAVE: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
};

/** Extract a human-readable browser + OS from the raw UA string captured at punch time. */
export function parseUserAgent(ua?: string): { browser: string; os: string } {
  if (!ua) return { browser: 'Unknown', os: 'Unknown' };
  let browser = 'Other';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera';
  else if (/SamsungBrowser/.test(ua)) browser = 'Samsung Internet';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Safari\//.test(ua)) browser = 'Safari';
  let os = 'Unknown';
  if (/Windows/.test(ua)) os = 'Windows';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
  else if (/Macintosh|Mac OS X/.test(ua)) os = 'macOS';
  else if (/Linux/.test(ua)) os = 'Linux';
  return { browser, os };
}

const fmtFullTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'medium' }) : '—';
const fmtDur = (mins?: number | null) =>
  mins == null ? '—' : `${Math.floor(mins / 60)}h ${mins % 60}m`;

/**
 * Read-only audit view for one attendance day: which device/browser, IP, GPS fix,
 * address, geofence result and (for clock-out) which branch the punch happened at.
 */
export default function AttendanceDetailsModal({
  row,
  offices,
  onClose,
}: {
  row: AttendanceDetailRow;
  offices: { id: string; name: string }[];
  onClose: () => void;
}) {
  const officeNameFor = (id?: string | null) =>
    id ? offices.find((o) => o.id === id)?.name || id : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl mb-8 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900">
          <div>
            <h2 className="text-base font-bold text-white">Attendance Details</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {row.userName} · {row.userEmail}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${statusCls[row.status] || 'text-slate-300 border-slate-700'}`}
            >
              {row.status}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Day summary */}
          <div className="rounded-md bg-slate-900/60 border border-slate-800">
            <div className="px-4 py-2 rounded-t-xl bg-slate-800/40 border-b border-slate-800 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-thermal-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Day</span>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3">
              <Meta label="Date" value={new Date(row.date).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })} />
              <Meta label="Office (day tag)" value={row.officeName || '—'} />
              <Meta label="Total Hours" value={fmtDur(row.totalWorkMinutes)} />
              <Meta label="Punched Via" value={row.source === 'MOBILE' ? 'Mobile app' : row.source === 'WEB' ? 'Web' : '—'} />
              {row.remark && (
                <div className="col-span-2 md:col-span-4">
                  <Meta label="Remark" value={row.remark} />
                </div>
              )}
            </div>
          </div>

          <PunchCard
            title="Clock In"
            icon={<LogIn className="w-3.5 h-3.5 text-emerald-400" />}
            punch={row.clockIn}
            branchLabel={officeNameFor(row.clockIn?.officeId) || row.officeName}
          />
          <PunchCard
            title="Clock Out"
            icon={<LogOut className="w-3.5 h-3.5 text-rose-400" />}
            punch={row.clockOut}
            branchLabel={officeNameFor(row.clockOut?.officeId) || '—'}
            showBranch
          />
        </div>
      </div>
    </div>
  );
}

function PunchCard({
  title,
  icon,
  punch,
  branchLabel,
  showBranch = false,
}: {
  title: string;
  icon: React.ReactNode;
  punch: PunchDetail;
  branchLabel?: string | null;
  showBranch?: boolean;
}) {
  const { browser, os } = parseUserAgent(punch?.userAgent);
  const hasPunch = !!punch?.time;
  const geo =
    typeof punch?.lat === 'number' && typeof punch?.lng === 'number'
      ? { lat: punch.lat, lng: punch.lng }
      : null;

  return (
    <div className="rounded-md bg-slate-900/60 border border-slate-800">
      <div className="px-4 py-2 rounded-t-xl bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">{title}</span>
        </div>
        {hasPunch && (
          punch.geofenceOk ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> In geofence
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400">
              <ShieldAlert className="w-3.5 h-3.5" /> Outside geofence
            </span>
          )
        )}
      </div>

      {!hasPunch ? (
        <p className="p-4 text-xs text-slate-500">Not punched</p>
      ) : (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
          <Meta label="Time" value={fmtFullTime(punch.time)} />
          <Meta label="Device" value={`${browser} · ${os}`} />
          {showBranch && <Meta label="Branch at punch" value={branchLabel || '—'} />}
          <Meta label="IP Address" value={punch.ip || '—'} />
          <Meta
            label="GPS"
            value={
              geo ? (
                <a
                  href={`https://www.google.com/maps?q=${geo.lat},${geo.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-thermal-400 hover:underline inline-flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" />
                  {geo.lat.toFixed(6)}, {geo.lng.toFixed(6)}
                  {typeof punch.accuracy === 'number' && (
                    <span className="text-slate-400">± {Math.round(punch.accuracy)} m</span>
                  )}
                </a>
              ) : (
                '—'
              )
            }
          />
          {punch.address && <Meta label="Address" value={punch.address} />}
          {punch.userAgent && (
            <div className="md:col-span-2">
              <Meta label="User Agent (raw)" value={<span className="break-all font-mono text-[10px]">{punch.userAgent}</span>} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</p>
      <p className="mt-0.5 text-xs text-slate-200 flex items-center gap-1.5">
        {label === 'Device' && typeof value === 'string' && value !== 'Unknown · Unknown' && (
          <Smartphone className="w-3 h-3 text-slate-400 shrink-0" />
        )}
        {value || '—'}
      </p>
    </div>
  );
}
