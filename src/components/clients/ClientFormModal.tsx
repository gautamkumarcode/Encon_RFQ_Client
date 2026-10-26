'use client';

import { X, Loader2, Building2 } from 'lucide-react';
import { INPUT_CLS, LABEL_CLS, COUNTRIES } from './constants';
import AddressEditor from './AddressEditor';
import type { ClientAddr, ClientFormState } from './types';

interface Props {
  isNew: boolean;
  form: ClientFormState;
  saving: boolean;
  setField: <K extends keyof ClientFormState>(k: K, v: ClientFormState[K]) => void;
  onAddrChange: (i: number, patch: Partial<ClientAddr>) => void;
  onAddAddr: () => void;
  onRemoveAddr: (i: number) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export default function ClientFormModal({
  isNew,
  form,
  saving,
  setField,
  onAddrChange,
  onAddAddr,
  onRemoveAddr,
  onSubmit,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-3xl rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-white">
            <Building2 className="h-4 w-4 text-thermal-400" /> {isNew ? 'New Client' : 'Edit Client'}
          </h2>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-4">
          {/* Identity + contact */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={LABEL_CLS}>Client / Party Name</label>
              <input value={form.name} onChange={(e) => setField('name', e.target.value)} className={INPUT_CLS} placeholder="e.g. ABC Processors Ltd" />
            </div>
            <div>
              <label className={LABEL_CLS}>Contact Person</label>
              <input value={form.contactPerson} onChange={(e) => setField('contactPerson', e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Country</label>
              <select value={form.country} onChange={(e) => setField('country', e.target.value)} className={INPUT_CLS}>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Mobile</label>
              <input value={form.mobile} onChange={(e) => setField('mobile', e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Email</label>
              <input value={form.email} onChange={(e) => setField('email', e.target.value)} className={INPUT_CLS} />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL_CLS}>GSTIN</label>
              <input value={form.gstin} onChange={(e) => setField('gstin', e.target.value)} className={INPUT_CLS} />
            </div>
          </div>

          {/* Addresses */}
          <AddressEditor addresses={form.addresses} onChange={onAddrChange} onAdd={onAddAddr} onRemove={onRemoveAddr} />

          <div>
            <label className={LABEL_CLS}>Notes</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setField('notes', e.target.value)} className={INPUT_CLS} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-800 px-5 py-3">
          <button onClick={onClose} className="rounded-md border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:border-slate-600">
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={saving || !form.name.trim()}
            className="inline-flex items-center gap-1.5 rounded-md bg-thermal-500 px-4 py-2 text-xs font-semibold text-white hover:bg-thermal-400 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {isNew ? 'Create Client' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
