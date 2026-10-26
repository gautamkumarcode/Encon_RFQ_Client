'use client';

import { useRef, useState } from 'react';
import { X, Upload, Loader2, FileSpreadsheet, CheckCircle2, AlertTriangle } from 'lucide-react';
import { fmt } from './utils';
import { useOrdersImport } from './hooks';
import type { ImportCommitResult, ImportPreviewOrder, ImportPreviewResult } from './types';

interface Props {
  onClose: () => void;
  onImported: () => void;
}

export default function ImportOrdersModal({ onClose, onImported }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewOrder[] | null>(null);
  const [result, setResult] = useState<ImportCommitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate, isPending } = useOrdersImport();

  const pickFile = (f: File | null) => {
    setFile(f);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const runPreview = () => {
    if (!file) return;
    setError(null);
    mutate(
      { file, dryRun: true },
      {
        onSuccess: (data) => {
          const d = data as ImportPreviewResult;
          if (d.success) setPreview(d.orders);
          else setError(d.message || 'Could not read the file.');
        },
        onError: (e) => setError(e.message || 'Preview failed.'),
      },
    );
  };

  const runImport = () => {
    if (!file) return;
    setError(null);
    mutate(
      { file, dryRun: false },
      {
        onSuccess: (data) => {
          const d = data as ImportCommitResult;
          if (d.success) {
            setResult(d);
            onImported();
          } else setError(d.message || 'Import failed.');
        },
        onError: (e) => setError(e.message || 'Import failed.'),
      },
    );
  };

  const duplicateCount = preview?.filter((o) => o.duplicate).length ?? 0;
  const importableCount = (preview?.length ?? 0) - duplicateCount;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-6">
      <div className="mb-8 flex max-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-slate-800 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <Upload className="h-5 w-5 text-thermal-400" />
            <div>
              <h2 className="text-sm font-semibold text-white">Import Orders from Excel</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">Upload a previous “Despatch Detail” sheet. We preview the parsed orders before saving.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-900 px-5 py-4">
          {/* File picker */}
          <div className="rounded-md border border-slate-800 bg-slate-800/30 p-4">
            <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-thermal-500/60"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-thermal-400" /> Choose Excel file
              </button>
              <span className="truncate text-xs text-slate-400">{file ? file.name : 'No file selected'}</span>
              <button
                onClick={runPreview}
                disabled={!file || isPending}
                className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending && !preview ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Preview parse
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-300">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
            </div>
          )}

          {/* Preview table */}
          {preview && preview.length > 0 && (
            <div className="overflow-hidden rounded-md border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-800/40 px-4 py-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Parsed orders ({preview.length})</h3>
                {duplicateCount > 0 && <span className="text-[11px] text-amber-300">{duplicateCount} already exist — will be skipped</span>}
              </div>
              <div className="max-h-[42vh] overflow-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="sticky top-0 bg-slate-900">
                    <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <th className="px-3 py-2">Job No</th>
                      <th className="px-3 py-2">Party</th>
                      <th className="px-3 py-2">PO No</th>
                      <th className="px-3 py-2 text-center">Items</th>
                      <th className="px-3 py-2 text-right">Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((o, i) => (
                      <tr key={`${o.jobNo}-${o.poNumber}-${i}`} className={`border-t border-slate-800/70 ${i % 2 ? 'bg-slate-800/30' : ''} ${o.duplicate ? 'opacity-50' : ''}`}>
                        <td className="px-3 py-2 text-xs text-slate-300">{o.jobNo || '—'}</td>
                        <td className="px-3 py-2 text-xs text-slate-200">
                          {o.clientName || '—'}
                          {o.duplicate && <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300">exists</span>}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-300">{o.poNumber || '—'}</td>
                        <td className="px-3 py-2 text-center text-xs tabular-nums text-slate-400">{o.itemCount}</td>
                        <td className="px-3 py-2 text-right text-xs tabular-nums text-slate-200">{fmt(o.orderValueINR)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {preview && preview.length === 0 && (
            <p className="rounded-md border border-slate-800 bg-slate-800/30 px-3 py-2 text-xs text-slate-400">
              No orders were detected. Check that the sheet has JOB NO and PARTY NAME columns and that each order block is present.
            </p>
          )}

          {/* Success result */}
          {result && (
            <div className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Imported <strong>{result.created}</strong> order{result.created === 1 ? '' : 's'}.
                {result.skipped > 0 ? ` Skipped ${result.skipped} (already existed).` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-800 bg-slate-900/80 px-5 py-3">
          <span className="text-[11px] text-slate-500">
            {preview ? `${importableCount} of ${preview.length} orders ready to import` : 'Select a file and preview first'}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="rounded-md border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100">
              {result ? 'Close' : 'Cancel'}
            </button>
            <button
              onClick={runImport}
              disabled={!preview || importableCount === 0 || isPending || !!result}
              className="inline-flex items-center gap-1.5 rounded-md bg-thermal-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-thermal-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Import {importableCount > 0 ? importableCount : ''} order{importableCount === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
