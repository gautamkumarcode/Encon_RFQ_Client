// ---------------------------------------------------------------------------
// Formatting + form helpers for the Order in Hand feature.
// ---------------------------------------------------------------------------
import { CURRENCY_SYMBOL } from './constants';
import type { Client, ClientAddressLite, FormState, Order, Payment } from './types';

// Indian grouping, 2 decimals, no symbol (empty when zero).
export const fmt = (v: number) =>
  v ? new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) : '0.00';

// Currency in INR, no decimals.
export const inr = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

// ISO date -> yyyy-mm-dd for <input type="date">.
export const toInputDate = (d: string | null) => (d ? new Date(d).toISOString().slice(0, 10) : '');

// Currency symbol lookup.
export const sym = (c: string) => CURRENCY_SYMBOL[(c || 'INR').toUpperCase()] ?? (c + ' ');

// --- Client de-dup helpers -------------------------------------------------
// Mirror of the backend nameKey normalizer: strip case/punctuation/extra space
// only. Two names equal here are treated as the SAME client (auto-linked).
export const normalizeName = (s: string) =>
  (s || '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();

// Suffix-insensitive fingerprint used only for the "did you mean" prompt, never
// for storage — so "Encon" and "Encon Pvt Ltd" surface as a possible match
// without being silently merged.
const SUFFIX_TOKENS = /\b(PVT|PRIVATE|LTD|LIMITED|CO|COMPANY|CORP|CORPORATION|INC|LLP|LLC|INDIA)\b/g;
export const nameFingerprint = (s: string) =>
  normalizeName(s).replace(SUFFIX_TOKENS, ' ').replace(/\s+/g, ' ').trim();

export interface ClientMatch {
  exact?: Client;
  similar: Client[];
}

// Given a typed name, find the exact master match (normalized-equal) plus any
// suffix-similar candidates to offer as "link instead of create".
export function findClientMatches(name: string, clients: Client[]): ClientMatch {
  const q = normalizeName(name);
  if (!q) return { similar: [] };
  const exact = clients.find((c) => normalizeName(c.name) === q);
  const fp = nameFingerprint(name);
  const similar = fp
    ? clients.filter((c) => c !== exact && nameFingerprint(c.name) === fp).slice(0, 5)
    : [];
  return { exact, similar };
}

// Blank client-address factory.
export const emptyAddress = (): ClientAddressLite => ({
  line1: '', line2: '', city: '', state: '', country: 'India', pincode: '',
});

// Blank payment-received row factory.
export const emptyPayment = (): Payment => ({
  type: 'Advance', amount: 0, date: '', note: '',
});

// Blank form factory.
export const emptyForm = (): FormState => ({
  clientName: '',
  clientId: '',
  enquiryId: '',
  contactPerson: '',
  mobile: '',
  email: '',
  country: 'India',
  address: emptyAddress(),
  jobNo: '',
  poNumber: '',
  poDate: '',
  orderReceivedDate: '',
  currency: 'INR',
  orderValueINR: '',
  termsOfPayment: '',
  advanceAmount: '',
  advanceReceivedDate: '',
  payments: [emptyPayment()],
  dispatchAsPerPo: '',
  expectedDespatch: '',
  piNumber: '',
  piDate: '',
  status: 'Received',
  currentStatusNote: '',
  lineItems: [{ description: '', qty: 1, value: 0 }],
});

// Map a saved order back into form state for editing.
// Client contact/address live on the master, not the order, so they start blank.
export const orderToForm = (o: Order): FormState => ({
  clientName: o.clientName,
  clientId: o.client,
  enquiryId: o.enquiry,
  contactPerson: '',
  mobile: '',
  email: '',
  country: 'India',
  address: emptyAddress(),
  jobNo: o.jobNo,
  poNumber: o.poNumber,
  poDate: toInputDate(o.poDate),
  orderReceivedDate: toInputDate(o.orderReceivedDate),
  currency: o.currency,
  orderValueINR: o.orderValueINR ? String(o.orderValueINR) : '',
  termsOfPayment: o.termsOfPayment,
  advanceAmount: o.advanceAmount ? String(o.advanceAmount) : '',
  advanceReceivedDate: toInputDate(o.advanceReceivedDate),
  payments: o.payments?.length
    ? o.payments.map((p) => ({ type: p.type || 'Advance', amount: p.amount || 0, date: toInputDate(p.date as any), note: p.note || '' }))
    : [emptyPayment()],
  dispatchAsPerPo: toInputDate(o.dispatchAsPerPo),
  expectedDespatch: toInputDate(o.expectedDespatch),
  piNumber: o.piNumber,
  piDate: toInputDate(o.piDate),
  status: o.status,
  currentStatusNote: o.currentStatusNote,
  lineItems: o.lineItems?.length ? o.lineItems : [{ description: '', qty: 1, value: 0 }],
});

// Build the API payload from form state.
export const formToPayload = (form: FormState) => ({
  clientName: form.clientName.trim(),
  clientId: form.clientId || undefined,
  enquiryId: form.enquiryId || undefined,
  contactPerson: form.contactPerson,
  mobile: form.mobile,
  email: form.email,
  country: form.country,
  address: form.address,
  jobNo: form.jobNo,
  poNumber: form.poNumber,
  poDate: form.poDate || null,
  orderReceivedDate: form.orderReceivedDate || null,
  lineItems: form.lineItems.filter((li) => li.description.trim() || Number(li.value) > 0),
  currency: form.currency,
  orderValueINR: Number(form.orderValueINR) || 0,
  termsOfPayment: form.termsOfPayment,
  advanceAmount: Number(form.advanceAmount) || 0,
  advanceReceivedDate: form.advanceReceivedDate || null,
  payments: form.payments
    .filter((p) => Number(p.amount) > 0 || p.note.trim())
    .map((p) => ({ type: p.type, amount: Number(p.amount) || 0, date: p.date || null, note: p.note })),
  dispatchAsPerPo: form.dispatchAsPerPo || null,
  expectedDespatch: form.expectedDespatch || null,
  piNumber: form.piNumber,
  piDate: form.piDate || null,
  status: form.status,
  currentStatusNote: form.currentStatusNote,
});
