'use client';

import { X, ClipboardList, Pencil, Package, Banknote } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { fmt, sym } from './utils';
import type { Order } from './types';

interface Props {
  order: Order;
  onClose: () => void;
  onEdit: (o: Order) => void;
}

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');

// A labelled read-only value cell.
const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
    <div className="mt-0.5 text-xs text-slate-200">{value || '—'}</div>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">{title}</h3>
    {children}
  </div>
);

export default function OrderDetailModal({ order, onClose, onEdit }: Props) {
  const lineTotal = (order.lineItems || []).reduce((s, li) => s + (Number(li.value) || 0), 0);
  const totalQty = (order.lineItems || []).reduce((s, li) => s + (Number(li.qty) || 0), 0);
  const totalReceived = order.totalReceived ?? (order.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
  // Balance keys off the line-item total (kept in sync with orderValue on save),
  // so it always matches the items shown even for records saved before the fix.
  const balance = lineTotal - totalReceived;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-6">
      <div className="mb-8 flex max-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-800/60">
              <ClipboardList className="h-4 w-4 text-thermal-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">{order.clientName}</h2>
              <p className="text-[11px] text-slate-500">
                Job {order.jobNo || '—'} · PO {order.poNumber || '—'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto bg-slate-900 px-5 py-4">
          {/* Status + key figures */}
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={order.status} />
            <span className="text-[11px] text-slate-500">
              Order value{' '}
              <span className="font-semibold tabular-nums text-slate-200">
                {sym(order.currency)}
                {fmt(order.orderValue)}
              </span>
              {order.currency !== 'INR' && (
                <>
                  {' '}· {order.fxRate ? `@ ₹${order.fxRate} = ` : '· '}
                  <span className="font-semibold tabular-nums text-slate-300">₹{fmt(order.orderValueINR)}</span>
                </>
              )}
            </span>
          </div>

          {order.currentStatusNote && (
            <div className="rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status note: </span>
              {order.currentStatusNote}
            </div>
          )}

          {/* Order details grid */}
          <Section title="Order Details">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-md border border-slate-800 bg-slate-900/60 p-4 sm:grid-cols-3">
              <Field label="Party" value={order.clientName} />
              <Field label="Job No" value={order.jobNo} />
              <Field label="RFQ No" value={order.rfqId} />
              <Field label="PO No" value={order.poNumber} />
              <Field label="PO Date" value={fmtDate(order.poDate)} />
              <Field label="Order Received" value={fmtDate(order.orderReceivedDate)} />
              <Field label="Currency" value={order.currency} />
              {order.currency !== 'INR' && (
                <Field label={`Rate (₹ per 1 ${order.currency})`} value={order.fxRate ? String(order.fxRate) : '—'} />
              )}
              <Field label="Expected Despatch" value={fmtDate(order.expectedDespatch)} />
              <Field label="Dispatch as per PO" value={fmtDate(order.dispatchAsPerPo)} />
            </div>
          </Section>

          {/* Line items */}
          <Section title={`Items (${(order.lineItems || []).length} line${(order.lineItems || []).length === 1 ? '' : 's'} · Qty ${totalQty})`}>
            {order.lineItems?.length ? (
              <div className="overflow-x-auto rounded-md border border-slate-800">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-800/40 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.lineItems.map((li, i) => (
                      <tr key={i} className={`border-t border-slate-800 ${i % 2 ? 'bg-slate-800/30' : ''}`}>
                        <td className="px-3 py-2 text-xs tabular-nums text-slate-500">{i + 1}</td>
                        <td className="px-3 py-2 text-xs text-slate-200">{li.description || '—'}</td>
                        <td className="px-3 py-2 text-right text-xs tabular-nums text-slate-300">{li.qty || 0}</td>
                        <td className="px-3 py-2 text-right text-xs tabular-nums text-slate-200">
                          {sym(order.currency)}
                          {fmt(li.value)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-slate-700 bg-slate-900/60 text-xs font-semibold text-slate-200">
                      <td className="px-3 py-2" colSpan={3}>
                        <span className="flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5 text-thermal-400" /> Total
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {sym(order.currency)}
                        {fmt(lineTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No line items recorded.</p>
            )}
          </Section>

          {/* Commercials */}
          <Section title="Commercials & Payment">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-md border border-slate-800 bg-slate-900/60 p-4 sm:grid-cols-3">
              <Field label="Terms of Payment" value={order.termsOfPayment} />
              <Field
                label="Advance Amount"
                value={order.advanceAmount ? `${sym(order.currency)}${fmt(order.advanceAmount)}` : '—'}
              />
              <Field label="Advance Received" value={fmtDate(order.advanceReceivedDate)} />
              <Field label="PI No" value={order.piNumber} />
              <Field label="PI Date" value={fmtDate(order.piDate)} />
              <Field
                label="LD (Late Delivery)"
                value={order.ldApplicable ? `Yes · ${order.ldPercentage || 0}%` : 'No'}
              />
            </div>
          </Section>

          {/* Payments received */}
          <Section title="Payments Received">
            {order.payments?.length ? (
              <div className="overflow-x-auto rounded-md border border-slate-800">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-800/40 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Note</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.payments.map((p, i) => (
                      <tr key={i} className={`border-t border-slate-800 ${i % 2 ? 'bg-slate-800/30' : ''}`}>
                        <td className="px-3 py-2 text-xs text-slate-200">{p.type || '—'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-400">{fmtDate(p.date)}</td>
                        <td className="px-3 py-2 text-xs text-slate-400">{p.note || '—'}</td>
                        <td className="px-3 py-2 text-right text-xs tabular-nums text-emerald-300">
                          {sym(order.currency)}
                          {fmt(p.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-slate-700 bg-slate-900/60 text-xs font-semibold text-slate-200">
                      <td className="px-3 py-2" colSpan={3}>
                        <span className="flex items-center gap-1.5">
                          <Banknote className="h-3.5 w-3.5 text-thermal-400" /> Total received
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {sym(order.currency)}
                        {fmt(totalReceived)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No payments recorded.</p>
            )}
            <div className="mt-2 flex items-center justify-end gap-2 text-[11px]">
              <span className="uppercase tracking-wider text-slate-500">Balance</span>
              <span className={`font-bold tabular-nums ${balance > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                {sym(order.currency)}
                {fmt(balance)}
              </span>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-800 bg-slate-900/80 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100"
          >
            Close
          </button>
          <button
            onClick={() => onEdit(order)}
            className="inline-flex items-center gap-1.5 rounded-md bg-thermal-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-thermal-400"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit Order
          </button>
        </div>
      </div>
    </div>
  );
}
