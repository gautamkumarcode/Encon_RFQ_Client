'use client';

import { X, Loader2, Building2 } from 'lucide-react';
import { useClientDetail } from './hooks';
import { inr } from './utils';

interface Props {
  id: string;
  name: string;
  onClose: () => void;
}

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">{title}</h3>
    {children}
  </div>
);

const miniTh = 'px-3 py-2 text-left font-semibold';

export default function ClientDetailModal({ id, name, onClose }: Props) {
  const { data, isLoading } = useClientDetail(id);
  const client = data?.data;
  const enquiries = data?.enquiries ?? [];
  const orders = data?.orders ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-4xl rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-white">
            <Building2 className="h-4 w-4 text-thermal-400" /> {name}
          </h2>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[75vh] space-y-5 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-slate-500">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-thermal-400" /> Loading…
            </div>
          ) : (
            <>
              {/* Overview */}
              {client && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:grid-cols-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Contact</div>
                    <div className="mt-0.5 text-xs text-slate-200">{client.contactPerson || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Mobile</div>
                    <div className="mt-0.5 text-xs text-slate-200">{client.mobile || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Email</div>
                    <div className="mt-0.5 text-xs text-slate-200">{client.email || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">GSTIN</div>
                    <div className="mt-0.5 text-xs text-slate-200">{client.gstin || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Country</div>
                    <div className="mt-0.5 text-xs text-slate-200">{client.country || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Order Value</div>
                    <div className="mt-0.5 text-xs font-semibold tabular-nums text-slate-100">{inr(client.orderValueINR)}</div>
                  </div>
                </div>
              )}

              {/* Addresses */}
              <Section title="Addresses">
                {client?.addresses?.length ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {client.addresses.map((a, i) => (
                      <div key={i} className="rounded-md border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-300">
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-thermal-400">{a.type || 'Address'}</div>
                        <div>{a.line1}</div>
                        {a.line2 && <div>{a.line2}</div>}
                        <div>
                          {[a.city, a.state, a.pincode].filter(Boolean).join(', ')}
                        </div>
                        <div className="text-slate-500">{a.country}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No addresses on file.</p>
                )}
              </Section>

              {/* Orders */}
              <Section title={`Orders (${orders.length})`}>
                {orders.length ? (
                  <div className="overflow-x-auto rounded-md border border-slate-800">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-900/60 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          <th className={miniTh}>Job No</th>
                          <th className={miniTh}>PO No</th>
                          <th className={miniTh}>PO Date</th>
                          <th className="px-3 py-2 text-right font-semibold">Value</th>
                          <th className="px-3 py-2 text-right font-semibold">INR</th>
                          <th className={miniTh}>Expected</th>
                          <th className={miniTh}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o, i) => (
                          <tr key={o._id || o.id || i} className={`border-t border-slate-800 ${i % 2 ? 'bg-slate-800/30' : ''}`}>
                            <td className="px-3 py-2 text-xs text-slate-300">{o.jobNo || '—'}</td>
                            <td className="px-3 py-2 text-xs text-slate-300">{o.poNumber || '—'}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-400">{fmtDate(o.poDate)}</td>
                            <td className="px-3 py-2 text-right text-xs tabular-nums text-slate-200">{o.currency === 'INR' ? '₹' : ''}{(o.orderValue || 0).toLocaleString('en-IN')}</td>
                            <td className="px-3 py-2 text-right text-xs tabular-nums text-slate-300">{(o.orderValueINR || 0).toLocaleString('en-IN')}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-400">{fmtDate(o.expectedDespatch)}</td>
                            <td className="px-3 py-2 text-xs text-slate-300">{o.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No orders yet for this client.</p>
                )}
              </Section>

              {/* Enquiries */}
              <Section title={`Enquiries (${enquiries.length})`}>
                {enquiries.length ? (
                  <div className="overflow-x-auto rounded-md border border-slate-800">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-900/60 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          <th className={miniTh}>RFQ</th>
                          <th className={miniTh}>Item</th>
                          <th className="px-3 py-2 text-right font-semibold">Offer No</th>
                          <th className={miniTh}>Received</th>
                          <th className={miniTh}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enquiries.map((e, i) => (
                          <tr key={e._id || e.id || i} className={`border-t border-slate-800 ${i % 2 ? 'bg-slate-800/30' : ''}`}>
                            <td className="px-3 py-2 text-xs text-slate-300">{e.rfqId || '—'}</td>
                            <td className="px-3 py-2 text-xs text-slate-200">{e.itemDescription || '—'}</td>
                            <td className="px-3 py-2 text-right text-xs text-slate-300">{e.offerNo || '—'}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-400">{fmtDate(e.dateReceived)}</td>
                            <td className="px-3 py-2 text-xs text-slate-300">{e.status || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No linked enquiries.</p>
                )}
              </Section>
            </>
          )}
        </div>

        <div className="flex items-center justify-end border-t border-slate-800 px-5 py-3">
          <button onClick={onClose} className="rounded-md border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:border-slate-600">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
