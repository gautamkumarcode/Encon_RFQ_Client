// ---------------------------------------------------------------------------
// Formatting + form helpers for the Clients feature.
// ---------------------------------------------------------------------------
import type { ClientAddr, ClientFormState, ClientRow } from './types';

// Indian grouping, 2 decimals, no symbol.
export const fmt = (v: number) =>
  v ? new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) : '0.00';

// Currency in INR, no decimals.
export const inr = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

export const emptyAddr = (): ClientAddr => ({
  type: 'Billing',
  line1: '',
  line2: '',
  city: '',
  state: '',
  country: 'India',
  pincode: '',
});

export const emptyClientForm = (): ClientFormState => ({
  id: null,
  name: '',
  contactPerson: '',
  mobile: '',
  email: '',
  gstin: '',
  country: 'India',
  notes: '',
  addresses: [emptyAddr()],
});

export const clientToForm = (c: ClientRow & { notes?: string }): ClientFormState => ({
  id: c.id,
  name: c.name,
  contactPerson: c.contactPerson || '',
  mobile: c.mobile || '',
  email: c.email || '',
  gstin: c.gstin || '',
  country: c.country || 'India',
  notes: c.notes || '',
  addresses: c.addresses?.length ? c.addresses : [emptyAddr()],
});

export const clientFormToPayload = (f: ClientFormState) => ({
  name: f.name.trim(),
  contactPerson: f.contactPerson,
  mobile: f.mobile,
  email: f.email,
  gstin: f.gstin,
  country: f.country,
  notes: f.notes,
  addresses: f.addresses.filter((a) => a.line1.trim() || a.city.trim() || a.pincode.trim()),
});
