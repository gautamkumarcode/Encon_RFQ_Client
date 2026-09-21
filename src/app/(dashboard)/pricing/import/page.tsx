'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, AlertTriangle, CheckCircle2, X, Download, RefreshCw, Loader2 } from 'lucide-react';
import { pricingService, ImportRowInput, ImportAnalysis, ImportCommitResult, ItemType } from '@/services/pricingService';
import { useNotification } from '@/context/NotificationContext';
import { formatMoney } from '@/components/pricing/ui';

/* Expected columns and how they map to the import payload */
const COLUMNS: { key: keyof ImportRowInput; label: string; required?: boolean; aliases: string[] }[] = [
  { key: 'itemCode', label: 'Item Code', aliases: ['itemcode', 'code', 'item_code'] },
  { key: 'name', label: 'Item Name', required: true, aliases: ['name', 'item', 'item_name', 'itemname', 'description'] },
  { key: 'itemType', label: 'Item Type', aliases: ['itemtype', 'type', 'item_type'] },
  { key: 'category', label: 'Category', aliases: ['category', 'categoryname'] },
  { key: 'unit', label: 'Unit', aliases: ['unit', 'uom', 'unitname'] },
  { key: 'supplier', label: 'Supplier', aliases: ['supplier', 'vendor', 'suppliername', 'company'] },
  { key: 'manufacturer', label: 'Manufacturer', aliases: ['manufacturer', 'make', 'brand'] },
  { key: 'model', label: 'Model', aliases: ['model'] },
  { key: 'specification', label: 'Specification', aliases: ['specification', 'spec', 'specifications'] },
  { key: 'unitPrice', label: 'Unit Price', aliases: ['unitprice', 'price', 'rate', 'unit_price'] },
  { key: 'currency', label: 'Currency', aliases: ['currency', 'curr'] },
  { key: 'priceType', label: 'Price Type', aliases: ['pricetype', 'price_type'] },
  { key: 'effectiveFrom', label: 'Effective From', aliases: ['effectivefrom', 'effective_from', 'date'] },
  { key: 'reason', label: 'Reason', aliases: ['reason', 'remarks', 'note'] },
];

/** Minimal CSV parser (handles quoted fields and CRLF). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

const normalizeHeader = (h: string) => h.trim().toLowerCase().replace(/[\s_-]+/g, '');

function autoMap(headers: string[]): Record<number, keyof ImportRowInput | ''> {
  const mapping: Record<number, keyof ImportRowInput | ''> = {};
  headers.forEach((h, i) => {
    const norm = normalizeHeader(h);
    const col = COLUMNS.find((c) => c.aliases.includes(norm) || normalizeHeader(c.label) === norm);
    mapping[i] = col ? col.key : '';
  });
  return mapping;
}

export default function ImportPage() {
  const queryClient = useQueryClient();
  const { showToast, showConfirm } = useNotification();
  const fileRef = useRef<HTMLInputElement>(null);

  const [rawText, setRawText] = useState('');
  const [hasHeader, setHasHeader] = useState(true);
  const [mapping, setMapping] = useState<Record<number, keyof ImportRowInput | ''>>({});
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [result, setResult] = useState<ImportCommitResult | null>(null);

  const parsedRows = useMemo(() => (rawText.trim() ? parseCsv(rawText.trim()) : []), [rawText]);
  const dataRows = useMemo(() => {
    if (!parsedRows.length) return [];
    return hasHeader ? parsedRows.slice(1) : parsedRows;
  }, [parsedRows, hasHeader]);
  const headers = parsedRows[0] || [];

  // Auto-map whenever new content is pasted / uploaded
  const loadText = (text: string, withHeader = true) => {
    setRawText(text);
    setResult(null);
    setAnalysis(null);
    const rows = text.trim() ? parseCsv(text.trim()) : [];
    setMapping(rows.length && withHeader ? autoMap(rows[0]) : {});
  };

  const buildPayload = (): ImportRowInput[] =>
    dataRows.map((cells) => {
      const row: Record<string, unknown> = {};
      Object.entries(mapping).forEach(([colIndex, key]) => {
        if (!key) return;
        const raw = (cells[Number(colIndex)] || '').trim();
        if (raw === '') return;
        if (key === 'unitPrice') {
          const num = parseFloat(raw.replace(/[₹$€,\s]/g, ''));
          if (!Number.isNaN(num)) row.unitPrice = num;
        } else {
          row[key] = raw;
        }
      });
      row.row = undefined; // assigned server-side
      return row as unknown as ImportRowInput;
    }).filter((r) => r.name);

  const payload = buildPayload();

  const previewMutation = useMutation({
    mutationFn: () => pricingService.importPreview(payload),
    onSuccess: (data) => {
      setAnalysis(data);
      setResult(null);
      showToast('Preview Ready', `${data.summary.totalRows} rows analyzed — nothing has been imported yet`, 'info');
    },
    onError: (err: any) => showToast('Error', err.response?.data?.message || 'Preview failed', 'error'),
  });

  const commitMutation = useMutation({
    mutationFn: () => pricingService.importCommit(payload),
    onSuccess: (data) => {
      setResult(data);
      setAnalysis(null);
      showToast('Import Complete', `${data.summary.created} items created, ${data.summary.priceUpdated} prices updated`, 'success');
      queryClient.invalidateQueries({ queryKey: ['pricing-items'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-history'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-lookup'] });
    },
    onError: (err: any) => showToast('Error', err.response?.data?.message || 'Import failed', 'error'),
  });

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => loadText(String(reader.result || ''), true);
    reader.readAsText(file);
  };

  const summary = analysis?.summary;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Step 1 — provide data */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-thermal-500" /> Step 1 — Provide Pricing Data (CSV)
          </h2>
          <a
            href={pricingService.exportUrl}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export current data (CSV template)
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) onFile(file);
            }}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-thermal-500/50 rounded-2xl p-8 text-center cursor-pointer transition-colors"
          >
            <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-xs text-slate-300 font-semibold">Drop a .csv file here or click to browse</p>
            <p className="text-[10px] text-slate-500 mt-1">First row should be column headers</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFile(file);
              }}
            />
          </div>

          <div>
            <textarea
              value={rawText}
              onChange={(e) => loadText(e.target.value, hasHeader)}
              placeholder={'…or paste CSV rows here, e.g.\nname,category,unit,unitPrice\nHydraulic Pump Unit,HPU,NOS,450000'}
              className="w-full h-[144px] px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-[11px] text-white focus:outline-none focus:border-thermal-500 resize-y font-mono"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasHeader}
            onChange={(e) => {
              setHasHeader(e.target.checked);
              loadText(rawText, e.target.checked);
            }}
            className="w-4 h-4 rounded bg-slate-950 border-slate-600 accent-thermal-500"
          />
          <span className="text-xs text-slate-300">First row contains column headers</span>
        </label>
      </div>

      {/* Step 2 — column mapping */}
      {headers.length > 0 && hasHeader && (
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white">Step 2 — Map Columns</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {headers.map((h, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <p className="text-[10px] text-slate-500 font-mono truncate" title={h}>
                  “{h}”
                </p>
                <select
                  value={mapping[i] || ''}
                  onChange={(e) => setMapping({ ...mapping, [i]: e.target.value as keyof ImportRowInput | '' })}
                  className="w-full mt-1.5 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-[11px] text-slate-200 focus:outline-none focus:border-thermal-500"
                >
                  <option value="">— Ignore —</option>
                  {COLUMNS.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                      {c.required ? ' *' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-500">
            {payload.length} valid data rows detected · {payload.filter((r) => !r.name).length} rows will be skipped (no name)
          </p>
        </div>
      )}

      {/* Step 3 — preview */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Step 3 — Preview Before Import</h2>
          <button
            onClick={() => previewMutation.mutate()}
            disabled={payload.length === 0 || previewMutation.isPending}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
          >
            {previewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Analyze {payload.length} Rows
          </button>
        </div>
        <p className="text-[10px] text-slate-500">
          Nothing is written during preview. Existing items are never silently overwritten — price differences become NEW price versions.
        </p>

        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'New Items', value: summary.newItems, cls: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30' },
              { label: 'Existing (no change)', value: summary.existingItems, cls: 'text-slate-300 bg-slate-500/10 border-slate-500/30' },
              { label: 'Price Changes', value: summary.priceChanges, cls: 'text-thermal-400 bg-thermal-500/10 border-thermal-500/30' },
              { label: 'Duplicates', value: summary.duplicates, cls: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
              { label: 'Errors', value: summary.errors, cls: 'text-rose-300 bg-rose-500/10 border-rose-500/30' },
            ].map(({ label, value, cls }) => (
              <div key={label} className={`p-3.5 rounded-2xl border ${cls}`}>
                <p className="text-2xl font-extrabold">{value}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview detail */}
      {analysis && (
        <div className="space-y-4">
          {analysis.errors.length > 0 && (
            <PreviewTable
              title="Errors (will NOT be imported)"
              tone="rose"
              headers={['Row', 'Item', 'Problem']}
              rows={analysis.errors.map((e) => [String(e.row), e.name || '—', e.message])}
            />
          )}
          {analysis.duplicates.length > 0 && (
            <PreviewTable
              title="Duplicates (will be skipped)"
              tone="amber"
              headers={['Row', 'Name', 'Duplicate of']}
              rows={analysis.duplicates.map((d) => [String(d.row), d.name, d.duplicateOf])}
            />
          )}
          {analysis.priceChanges.length > 0 && (
            <PreviewTable
              title="Price Changes (new version will be created)"
              tone="thermal"
              headers={['Row', 'Item Code', 'Current Price', 'New Price', 'Change']}
              rows={analysis.priceChanges.map((c) => [
                String(c.row),
                c.itemCode || c.name,
                formatMoney(c.currentPrice, c.currency),
                formatMoney(c.newPrice, c.currency),
                `${c.currentPrice ? (((c.newPrice - c.currentPrice) / c.currentPrice) * 100).toFixed(1) : '—'}%`,
              ])}
            />
          )}
          {analysis.newItems.length > 0 && (
            <PreviewTable
              title="New Items (will be created)"
              tone="cyan"
              headers={['Row', 'Name', 'Type', 'Category', 'Price']}
              rows={analysis.newItems.map((n) => [
                String(n.row),
                n.name,
                n.itemType || 'COMPONENT',
                n.category || '—',
                n.unitPrice != null ? formatMoney(n.unitPrice, n.currency) : '—',
              ])}
            />
          )}

          {/* Commit */}
          <div className="glass-card p-6 rounded-3xl border border-thermal-500/30 bg-thermal-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-thermal-400" /> Confirm Import
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                {analysis.summary.newItems} new items · {analysis.summary.priceChanges} price updates ·{' '}
                {analysis.summary.duplicates + analysis.summary.errors + analysis.summary.existingItems} rows skipped
              </p>
            </div>
            <button
              onClick={() =>
                showConfirm({
                  title: 'Confirm Import',
                  message: `This will create ${analysis.summary.newItems} items and ${analysis.summary.priceChanges} new price versions. This action is audited and cannot create duplicates. Continue?`,
                  confirmText: 'Import Now',
                  type: 'warning',
                  onConfirm: () => commitMutation.mutate(),
                })
              }
              disabled={commitMutation.isPending || (analysis.summary.newItems + analysis.summary.priceChanges === 0)}
              className="px-5 py-2.5 bg-thermal-600 hover:bg-thermal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
            >
              {commitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Import {analysis.summary.newItems + analysis.summary.priceChanges} Changes
            </button>
          </div>
        </div>
      )}

      {/* Commit result */}
      {result && (
        <div className="glass-card p-6 rounded-3xl border border-emerald-500/30 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Import Complete
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['Created', result.summary.created],
              ['Prices Updated', result.summary.priceUpdated],
              ['Skipped', result.summary.skipped],
              ['Errors', result.summary.errors],
            ].map(([label, value]) => (
              <div key={label as string} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <p className="text-xl font-extrabold text-white">{value}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
          {result.results.length > 0 && (
            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-800 divide-y divide-slate-800/60">
              {result.results.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 text-xs">
                  <span className="text-slate-300">
                    Row {r.row} · <span className="font-mono text-thermal-400">{r.itemCode || '—'}</span>
                  </span>
                  <span
                    className={`text-[10px] font-semibold ${
                      r.action === 'ERROR' ? 'text-rose-400' : r.action === 'CREATED' ? 'text-cyan-400' : 'text-thermal-400'
                    }`}
                  >
                    {r.action}
                    {r.version ? ` (v${r.version})` : ''}
                    {r.message ? ` — ${r.message}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Preview section table ───────────────────────────────────────────────── */

function PreviewTable({
  title,
  tone,
  headers,
  rows,
}: {
  title: string;
  tone: 'rose' | 'amber' | 'cyan' | 'thermal';
  headers: string[];
  rows: string[][];
}) {
  const [open, setOpen] = useState(true);
  const toneCls = {
    rose: 'border-rose-500/30',
    amber: 'border-amber-500/30',
    cyan: 'border-cyan-500/30',
    thermal: 'border-thermal-500/30',
  }[tone];

  if (!rows.length) return null;

  return (
    <div className={`glass-card rounded-3xl border ${toneCls} overflow-hidden`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left">
        <span className="text-xs font-bold text-white flex items-center gap-2">
          {title}
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">{rows.length}</span>
        </span>
        {open ? <X className="w-3.5 h-3.5 text-slate-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />}
      </button>
      {open && (
        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                {headers.map((h) => (
                  <th key={h} className="py-2.5 px-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[11px]">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-800/30">
                  {row.map((cell, j) => (
                    <td key={j} className="py-2.5 px-4 text-slate-300">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
