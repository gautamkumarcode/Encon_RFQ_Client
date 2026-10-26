'use client';

import type { ReactNode } from 'react';
import {
  X,
  Loader2,
  Package,
  Building2,
  Users,
  FileText,
  Wallet,
  Download,
  CheckCircle2,
  AlertTriangle,
  Banknote,
} from 'lucide-react';
import { INPUT_CLS, LABEL_CLS, ORDER_STATUS, CURRENCIES } from './constants';
import LineItemsEditor from './LineItemsEditor';
import PaymentsEditor from './PaymentsEditor';
import { findClientMatches, fmt, sym } from './utils';
import type { Client, EnqLite, FormState, LineItem, Payment } from './types';

interface Props {
  editingId: string | null;
  form: FormState;
  lineTotal: number;
  clients: Client[];
  enquiries: EnqLite[];
  saving: boolean;
  setField: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  onClientNameChange: (v: string) => void;
  onImport: (enquiryId: string) => void;
  onLineChange: (i: number, patch: Partial<LineItem>) => void;
  onAddLine: () => void;
  onRemoveLine: (i: number) => void;
  onPayChange: (i: number, patch: Partial<Payment>) => void;
  onAddPay: () => void;
  onRemovePay: (i: number) => void;
  onSubmit: () => void;
  onClose: () => void;
}

// Section chrome — flat slate cards matching the Tally Books modal palette.
function Section({
  icon,
  title,
  hint,
  children,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-md border border-slate-800 bg-slate-900/60">
      <header className="flex items-center gap-2 border-b border-slate-800 bg-slate-800/40 px-4 py-2">
        <span className="text-thermal-400">{icon}</span>
        <div className="min-w-0">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">{title}</h3>
          {hint && <p className="truncate text-[10px] text-slate-500">{hint}</p>}
        </div>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

// Labelled field wrapper for uniform spacing/typography.
function Field({ label, className = '', children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label className={LABEL_CLS}>{label}</label>
      {children}
    </div>
  );
}

export default function OrderFormModal({
  editingId,
  form,
  lineTotal,
  clients,
  enquiries,
  saving,
  setField,
  onClientNameChange,
  onImport,
  onLineChange,
  onAddLine,
  onRemoveLine,
  onPayChange,
  onAddPay,
  onRemovePay,
  onSubmit,
  onClose,
}: Props) {
  // De-dup guard: is the typed party already a known client (exact) or a close
  // spelling/suffix variant (similar → offer to link instead of create)?
  const match = findClientMatches(form.clientName, clients);
  const pickExisting = (c: Client) => {
    setField('clientName', c.name);
    setField('clientId', c.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-6">
      <div className="mb-8 flex max-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-slate-800 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <Package className="h-5 w-5 text-thermal-400" />
            <div>
              <h2 className="text-sm font-semibold text-white">{editingId ? 'Edit Order' : 'New Order in Hand'}</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {editingId ? 'Update the order, delivery and commercial details.' : 'Capture the PO, client and delivery details in one place.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-900 px-5 py-4">
          {/* Import banner (new orders only) */}
          {!editingId && enquiries.length > 0 && (
            <div className="rounded-md border border-slate-800 bg-slate-800/30 p-4">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-thermal-400" />
                <span className="text-xs font-semibold text-slate-200">Start from a PO-Received enquiry</span>
              </div>
              <p className="mt-0.5 mb-2 text-[11px] text-slate-500">
                Prefills the client, contact details and line items so you only finish the order-specific fields.
              </p>
              <select onChange={(e) => onImport(e.target.value)} value="" className={INPUT_CLS}>
                <option value="">— Select an enquiry —</option>
                {enquiries.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.rfqId} · {e.companyName}
                    {e.itemDescription ? ` · ${e.itemDescription}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Client / Party */}
          <Section icon={<Users className="h-4 w-4" />} title="Client / Party" hint="Pick an existing client or add a new one">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Client / Party" className="sm:col-span-2">
                <input
                  list="client-names"
                  placeholder="Type or pick a client"
                  value={form.clientName}
                  onChange={(e) => onClientNameChange(e.target.value)}
                  className={INPUT_CLS}
                />
                <datalist id="client-names">
                  {clients.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </Field>
              <Field label="Job No">
                <input value={form.jobNo} onChange={(e) => setField('jobNo', e.target.value)} className={INPUT_CLS} />
              </Field>
            </div>

            {form.clientName.trim() && match.exact && (
              <p className="mt-3 flex items-center gap-1.5 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Existing client — this order links to the master and back-fills any missing details.
              </p>
            )}
            {form.clientName.trim() && !match.exact && match.similar.length > 0 && (
              <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Similar client exists — link to it instead of creating a duplicate?
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {match.similar.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => pickExisting(c)}
                      className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] text-slate-200 transition-colors hover:border-thermal-500/60 hover:text-white"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* Client details (from enquiry) */}
          <Section icon={<Building2 className="h-4 w-4" />} title="Client Details" hint="Copied from enquiry — saved back to the client master">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Contact Person">
                <input value={form.contactPerson} onChange={(e) => setField('contactPerson', e.target.value)} className={INPUT_CLS} />
              </Field>
              <Field label="Mobile">
                <input value={form.mobile} onChange={(e) => setField('mobile', e.target.value)} className={INPUT_CLS} />
              </Field>
              <Field label="Email">
                <input value={form.email} onChange={(e) => setField('email', e.target.value)} className={INPUT_CLS} />
              </Field>
              <Field label="Address Line 1" className="sm:col-span-3">
                <input value={form.address.line1} onChange={(e) => setField('address', { ...form.address, line1: e.target.value })} className={INPUT_CLS} />
              </Field>
              <Field label="Address Line 2" className="sm:col-span-3">
                <input value={form.address.line2} onChange={(e) => setField('address', { ...form.address, line2: e.target.value })} className={INPUT_CLS} />
              </Field>
              <Field label="City">
                <input value={form.address.city} onChange={(e) => setField('address', { ...form.address, city: e.target.value })} className={INPUT_CLS} />
              </Field>
              <Field label="State">
                <input value={form.address.state} onChange={(e) => setField('address', { ...form.address, state: e.target.value })} className={INPUT_CLS} />
              </Field>
              <Field label="Pincode">
                <input value={form.address.pincode} onChange={(e) => setField('address', { ...form.address, pincode: e.target.value })} className={INPUT_CLS} />
              </Field>
              <Field label="Country" className="sm:col-span-3">
                <input
                  value={form.country}
                  onChange={(e) => setField('country', e.target.value)}
                  onBlur={() => setField('address', { ...form.address, country: form.country })}
                  className={INPUT_CLS}
                />
              </Field>
            </div>
          </Section>

          {/* Order reference */}
          <Section icon={<FileText className="h-4 w-4" />} title="Order Reference" hint="PO and receipt dates">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="PO No">
                <input value={form.poNumber} onChange={(e) => setField('poNumber', e.target.value)} className={INPUT_CLS} />
              </Field>
              <Field label="PO Date">
                <input type="date" value={form.poDate} onChange={(e) => setField('poDate', e.target.value)} className={INPUT_CLS} />
              </Field>
              <Field label="Order Received Date">
                <input type="date" value={form.orderReceivedDate} onChange={(e) => setField('orderReceivedDate', e.target.value)} className={INPUT_CLS} />
              </Field>
            </div>
          </Section>

          {/* Line items */}
          <Section icon={<Package className="h-4 w-4" />} title="Line Items" hint="What is being supplied">
            <LineItemsEditor
              items={form.lineItems}
              currency={form.currency}
              total={lineTotal}
              onChange={onLineChange}
              onAdd={onAddLine}
              onRemove={onRemoveLine}
            />
          </Section>

          {/* Commercials & delivery */}
          <Section icon={<Wallet className="h-4 w-4" />} title="Commercials & Delivery" hint="Payment terms, dispatch and status">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Currency">
                <select value={form.currency} onChange={(e) => setField('currency', e.target.value)} className={INPUT_CLS}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Order Value (INR)">
                <input
                  type="number"
                  placeholder={form.currency === 'INR' ? 'auto = total' : 'INR equivalent'}
                  value={form.orderValueINR}
                  onChange={(e) => setField('orderValueINR', e.target.value)}
                  disabled={form.currency === 'INR'}
                  className={`${INPUT_CLS} disabled:cursor-not-allowed disabled:opacity-50`}
                />
              </Field>
              <Field label="Advance Amount">
                <input type="number" value={form.advanceAmount} onChange={(e) => setField('advanceAmount', e.target.value)} className={INPUT_CLS} />
              </Field>
              <Field label="Terms of Payment" className="sm:col-span-3">
                <textarea rows={2} value={form.termsOfPayment} onChange={(e) => setField('termsOfPayment', e.target.value)} className={INPUT_CLS} />
              </Field>
              <Field label="Advance Received Date">
                <input type="date" value={form.advanceReceivedDate} onChange={(e) => setField('advanceReceivedDate', e.target.value)} className={INPUT_CLS} />
              </Field>
              <Field label="LD (Late Delivery) Applicable">
                <div className="flex items-center gap-2">
                  {([true, false] as const).map((val) => {
                    const active = form.ldApplicable === val;
                    return (
                      <button
                        key={String(val)}
                        type="button"
                        onClick={() => setField('ldApplicable', val)}
                        className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                          active
                            ? 'border-thermal-500/60 bg-thermal-500/10 text-thermal-300'
                            : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {val ? 'Yes' : 'No'}
                      </button>
                    );
                  })}
                </div>
              </Field>
              {form.ldApplicable && (
                <Field label="LD Percentage (%)">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    placeholder="0.00"
                    value={form.ldPercentage}
                    onChange={(e) => setField('ldPercentage', e.target.value)}
                    className={INPUT_CLS}
                  />
                </Field>
              )}
              <Field label="Dispatch as per PO">
                <input type="date" value={form.dispatchAsPerPo} onChange={(e) => setField('dispatchAsPerPo', e.target.value)} className={INPUT_CLS} />
              </Field>
              <Field label="Expected Despatch">
                <input type="date" value={form.expectedDespatch} onChange={(e) => setField('expectedDespatch', e.target.value)} className={INPUT_CLS} />
              </Field>
              <Field label="P.I. No">
                <input value={form.piNumber} onChange={(e) => setField('piNumber', e.target.value)} className={INPUT_CLS} />
              </Field>
              <Field label="P.I. Date">
                <input type="date" value={form.piDate} onChange={(e) => setField('piDate', e.target.value)} className={INPUT_CLS} />
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={(e) => setField('status', e.target.value)} className={INPUT_CLS}>
                  {ORDER_STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Current Status Note" className="sm:col-span-3">
                <textarea rows={2} value={form.currentStatusNote} onChange={(e) => setField('currentStatusNote', e.target.value)} className={INPUT_CLS} />
              </Field>
            </div>
          </Section>

          {/* Payments received ledger */}
          <Section icon={<Banknote className="h-4 w-4" />} title="Payments Received" hint="Advance, milestones, misc & other receipts">
            <PaymentsEditor
              payments={form.payments}
              currency={form.currency}
              orderValue={lineTotal}
              onChange={onPayChange}
              onAdd={onAddPay}
              onRemove={onRemovePay}
            />
          </Section>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-800 bg-slate-900/80 px-5 py-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Line total</span>
            <span className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 font-semibold tabular-nums text-slate-200">
              {sym(form.currency)}
              {fmt(lineTotal)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={saving || !form.clientName.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-thermal-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-thermal-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {editingId ? 'Save Changes' : 'Create Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
