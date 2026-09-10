'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { costingService, PriceItem, CostingSheet, CostingBomItem } from '@/services/costingService';
import { useNotification } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { getRolePermissions } from '@/utils/rfqPermissions';
import {
  Calculator,
  Search,
  Plus,
  Pencil,
  Trash2,
  Tag,
  Coins,
  RefreshCw,
  Copy,
  Check,
  FileSpreadsheet,
  X,
  PlusCircle,
  Zap,
  Sparkles,
  Filter,
  Loader2,
  Flame,
  Gauge,
  Activity,
  ChevronDown,
  ChevronUp,
  Info,
  Grid,
  CheckCircle2,
  Package,
  Layers,
  Wrench,
  HelpCircle,
} from 'lucide-react';

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  'Raw Material': { bg: 'bg-emerald-50 dark:bg-emerald-950/70', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  'Bought Out': { bg: 'bg-sky-50 dark:bg-sky-950/70', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800' },
  'Burner Component': { bg: 'bg-amber-50 dark:bg-amber-950/70', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  'Blower Equipment': { bg: 'bg-cyan-50 dark:bg-cyan-950/70', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800' },
  'HPU Component': { bg: 'bg-purple-50 dark:bg-purple-950/70', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  'Regen Material': { bg: 'bg-rose-50 dark:bg-rose-950/70', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
  'Spare Part': { bg: 'bg-indigo-50 dark:bg-indigo-950/70', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
  'ENCON Purchase': { bg: 'bg-teal-50 dark:bg-teal-950/70', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
};

const DEFAULT_CATEGORY_STYLE = { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' };

// Formulas matching offer-generator-v1 internal_costing.html
const FORMULA_RULES: Record<string, Record<string, string>> = {
  film: {
    'BURNER ALONE': 'Σ(first 5 oil-burner parts, incl. S.S. Assembly) × 2.5',
    'MICRO VALVE': 'micro-valve part × 2',
    'C.I.BURNER PLATE': 'burner-plate part × 1.8',
    'HIGH AL. WHYTEHEAT K BURNER BLOCK': 'block part × 2 (5A/6A × 2.2)',
    'FLEXIBLE HOSES SET': 'Σ(2 hose parts) × 2',
    'Y TYPE STRAINER': 'Y-strainer part × 2.5',
    'BUTTERFLY VALVE': 'butterfly part × 2',
    'BURNER SET': 'Sum of all 7 component columns',
  },
  dual: {
    'BURNER ALONE': 'Film Burner Alone + S.G. Assembly',
    'MICRO VALVE': '= Film Micro Valve',
    'C.I.BURNER PLATE': '= Film C.I. Plate',
    'HIGH AL. WHYTEHEAT K BURNER BLOCK': '= Film block (5A/6A = 11,850 fixed)',
    'FLEXIBLE HOSES SET': 'Film hoses × 1.5 (−5 for 2A/3A/4A)',
    'BALL VALVE': '2 × Pricelist NB ball-valve × 0.78',
    'Y TYPE STRAINER': '= Film Y-Strainer',
    'BUTTERFLY VALVE': '= Film Butterfly',
    'BURNER SET': 'Sum of all 8 component columns',
  },
  gas: {
    'BURNER ALONE': '= Film Burner Alone',
    'C.I.BURNER PLATE': '= Film C.I. Plate',
    'HIGH AL. WHYTEHEAT K BURNER BLOCK': '= Film block',
    'FLEXIBLE HOSES SET': '= Film hoses',
    'BALL VALVE': '2 × Pricelist NB ball-valve × 0.78',
    'BUTTERFLY VALVE': '= Film Butterfly',
    'BURNER SET': 'Sum of all 6 component columns',
  },
  hv_oil: {
    'BURNER ALONE': '= Film Burner Alone (same size)',
    'BURNER BLOCK': 'Pricelist "Burner Block for High Velocity Burners"',
    'MICRO VALVE': '= Film Micro Valve (one size down)',
    'FLEXIBLE HOSES SET': 'Σ(HV-oil hose parts) × 2',
    'Y TYPE STRAINER': '= Film Y-Strainer',
    'BUTTERFLY VALVE': '= Film Butterfly',
    'BURNER SET': 'Sum of all 6 component columns',
  },
  hv_gas: {
    'BURNER ALONE': '= Film Burner Alone',
    'BURNER BLOCK': 'Pricelist HV Burner Block',
    'BALL VALVE': '= Gas Ball Valve',
    'FLEXIBLE HOSES SET': '= Film hoses',
    'BUTTERFLY VALVE': '= Film Butterfly',
    'BURNER SET': 'Sum of all 5 component columns',
  },
};

export default function InternalCostingSuitePage() {
  const queryClient = useQueryClient();
  const { showToast } = useNotification();
  const { user } = useAuth();
  const { canViewPurchasePrices, canEditPurchasePrices } = getRolePermissions(user?.role);

  // Top Equipment System Tabs matching internal_costing.html
  // Non-purchase users only see tabs with selling prices; master catalog is purchase/admin only
  const [activeTab, setActiveTab] = useState<'burner' | 'hpu' | 'blower' | 'regen' | 'master'>('burner');

  // Interactive fx Formula Bar selection state
  const [selectedFormulaCell, setSelectedFormulaCell] = useState<{
    label: string;
    size?: string;
    formula: string;
    value: string | number;
  } | null>(null);

  // Collapsible formulas panel state
  const [isFormulasExpanded, setIsFormulasExpanded] = useState<boolean>(false);

  // Master Price Catalog state
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fast Inline Rate Editing
  const [inlineEditingRateId, setInlineEditingRateId] = useState<string | null>(null);
  const [inlineRateValue, setInlineRateValue] = useState<string>('');

  // Markup Master factors
  const [overheadPercent, setOverheadPercent] = useState<number>(12);
  const [markupPercent, setMarkupPercent] = useState<number>(25);

  // Modals state
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [editingPriceItem, setEditingPriceItem] = useState<PriceItem | null>(null);
  const [priceFormData, setPriceFormData] = useState<Partial<PriceItem>>({
    itemCode: '',
    item: '',
    category: 'Raw Material',
    unit: 'Nos',
    price: 0,
    specification: '',
    vendor: '',
    remarks: '',
  });

  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ type: 'price' | 'sheet'; id: string; title: string } | null>(null);

  // 300ms Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Master Prices
  const { data: pricesResponse, isLoading: loadingPrices, isFetching: fetchingPrices } = useQuery({
    queryKey: ['price-master', selectedCategory, debouncedSearchQuery],
    queryFn: async () => {
      const res = await costingService.getPriceItems({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        search: debouncedSearchQuery || undefined,
      });
      return res;
    },
  });

  // Fetch System Costing Sheets
  const { data: sheetsResponse, isLoading: loadingSheets, isFetching: fetchingSheets } = useQuery({
    queryKey: ['costing-sheets', debouncedSearchQuery],
    queryFn: async () => {
      const res = await costingService.getCostingSheets({
        search: debouncedSearchQuery || undefined,
      });
      return res;
    },
  });

  const isSearchLoading = searchQuery !== debouncedSearchQuery || (activeTab === 'master' ? fetchingPrices : fetchingSheets);
  const priceItems: PriceItem[] = useMemo(() => pricesResponse?.data || [], [pricesResponse]);
  const categoriesList: string[] = useMemo(() => pricesResponse?.meta?.categories || [], [pricesResponse]);
  const priceMeta = pricesResponse?.meta || { total: 0, categoriesCount: 0, changesCount: 0 };
  const costingSheets: CostingSheet[] = useMemo(() => sheetsResponse?.data || [], [sheetsResponse]);

  // Unified Master Items List (Combines Price Master + Burner/System BOM items matching search)
  const displayMasterItems = useMemo(() => {
    const list = [...priceItems];

    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.trim().toLowerCase();
      const existingNames = new Set(list.map((i) => (i.item || '').toLowerCase()));

      costingSheets.forEach((sheet) => {
        (sheet.items || []).forEach((bomIt) => {
          const pName = (bomIt.particular || '').trim();
          if (pName && pName.toLowerCase().includes(q) && !existingNames.has(pName.toLowerCase())) {
            existingNames.add(pName.toLowerCase());
            list.push({
              _id: `bom-${sheet._id}-${bomIt.sNo}`,
              itemCode: bomIt.itemCode || `${sheet.sheetCode}-BOM${bomIt.sNo}`,
              item: `${sheet.title} — ${pName}`,
              category: bomIt.category || 'Burner Component',
              unit: bomIt.unit || 'Nos',
              price: bomIt.rate || 0,
              specification: `Linked to ${sheet.title} (${sheet.sheetCode})`,
            });
          }
        });
      });
    }

    return list;
  }, [priceItems, costingSheets, debouncedSearchQuery]);

  // Search match counters for each tab header
  const searchMatchCounts = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return { burner: 0, hpu: 0, blower: 0, regen: 0, master: 0 };
    const q = debouncedSearchQuery.trim().toLowerCase();

    const burner = costingSheets.filter(
      (s) => s.productType === 'Burner' && (s.title.toLowerCase().includes(q) || (s.items || []).some((it) => it.particular.toLowerCase().includes(q)))
    ).length;

    const hpu = costingSheets.filter(
      (s) => s.productType === 'HPU' && (s.title.toLowerCase().includes(q) || (s.items || []).some((it) => it.particular.toLowerCase().includes(q)))
    ).length;

    const blower = costingSheets.filter(
      (s) => s.productType === 'Blower' && (s.title.toLowerCase().includes(q) || (s.items || []).some((it) => it.particular.toLowerCase().includes(q)))
    ).length;

    const regen = costingSheets.filter(
      (s) => s.productType === 'Regen' && (s.title.toLowerCase().includes(q) || (s.items || []).some((it) => it.particular.toLowerCase().includes(q)))
    ).length;

    const master = displayMasterItems.length;

    return { burner, hpu, blower, regen, master };
  }, [debouncedSearchQuery, costingSheets, displayMasterItems]);

  // Mutations
  const createPriceMutation = useMutation({
    mutationFn: costingService.createPriceItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-master'] });
      queryClient.invalidateQueries({ queryKey: ['costing-sheets'] });
      showToast('Master item created & system costing recalculated!', 'success');
      setIsPriceModalOpen(false);
      resetPriceForm();
    },
    onError: (err: any) => showToast(err.response?.data?.message || 'Failed to create item', 'error'),
  });

  const updatePriceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PriceItem> }) => costingService.updatePriceItem(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['price-master'] });
      queryClient.invalidateQueries({ queryKey: ['costing-sheets'] });
      showToast(res.message || 'Item rate updated. All system costing sheets recalculated!', 'success');
      setIsPriceModalOpen(false);
      setInlineEditingRateId(null);
      resetPriceForm();
    },
    onError: (err: any) => showToast(err.response?.data?.message || 'Failed to update item rate', 'error'),
  });

  const deletePriceMutation = useMutation({
    mutationFn: costingService.deletePriceItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-master'] });
      queryClient.invalidateQueries({ queryKey: ['costing-sheets'] });
      showToast('Item deleted from master catalog', 'success');
      setDeleteConfirmTarget(null);
    },
    onError: (err: any) => showToast(err.response?.data?.message || 'Failed to delete item', 'error'),
  });

  const recalculateAllMutation = useMutation({
    mutationFn: costingService.recalculateCostingSheets,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['costing-sheets'] });
      queryClient.invalidateQueries({ queryKey: ['price-master'] });
      showToast(res.message || 'System-wide costing recalculation completed!', 'success');
    },
    onError: (err: any) => showToast(err.response?.data?.message || 'Recalculation failed', 'error'),
  });

  const resetPriceForm = () => {
    setEditingPriceItem(null);
    setPriceFormData({
      itemCode: '',
      item: '',
      category: 'Raw Material',
      unit: 'Nos',
      price: 0,
      specification: '',
      vendor: '',
      remarks: '',
    });
  };

  const startInlineEdit = (item: PriceItem) => {
    setInlineEditingRateId(item._id);
    setInlineRateValue(String(item.price));
  };

  const handleSaveInlineRate = (item: PriceItem) => {
    const num = parseFloat(inlineRateValue);
    if (isNaN(num) || num < 0) {
      showToast('Please enter a valid price rate', 'error');
      return;
    }
    // If it's a synthetic BOM item, create or update via backend
    if (item._id.startsWith('bom-')) {
      const realName = item.item.split('—')[1]?.trim() || item.item;
      createPriceMutation.mutate({
        itemCode: item.itemCode,
        item: realName,
        category: item.category,
        unit: item.unit,
        price: num,
        specification: item.specification,
      });
    } else {
      updatePriceMutation.mutate({
        id: item._id,
        data: { price: num },
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Matrix Data Construction per Equipment System
  const matrixData = useMemo(() => {
    const buildMatrixForVariant = (variantName: string, titleLabel: string, fkey: string) => {
      const sheets = costingSheets.filter((s) => s.variant === variantName);
      if (!sheets.length) return null;

      const cols: string[] = [];
      sheets.forEach((s) => {
        (s.items || []).forEach((it) => {
          if (it.particular && !cols.includes(it.particular)) {
            cols.push(it.particular);
          }
        });
      });

      const rows = sheets.map((s) => {
        const rowMap: Record<string, number> = {};
        (s.items || []).forEach((it) => {
          rowMap[it.particular] = it.totalAmount || 0;
        });
        return {
          sheetCode: s.sheetCode,
          size: s.title.replace(/ENCON\s*/i, '').replace(/Burner\s*/i, '').replace(/Oil\s*/i, '').replace(/Film\s*/i, '').trim(),
          title: s.title,
          capacityKw: s.capacityKw,
          materialTotal: s.materialTotal,
          sellingPrice: s.sellingPrice,
          cellValues: rowMap,
        };
      });

      return { titleLabel, cols, rows, fkey };
    };

    return {
      oilFilm: buildMatrixForVariant('Oil Film Burner', 'ENCON Oil "Film" Burner & Accessories — price list (computed from parts)', 'film'),
      dualFuel: buildMatrixForVariant('Dual Fuel Burner', 'ENCON Dual Fuel Burner & Accessories — price list (computed from Film)', 'dual'),
      gas: buildMatrixForVariant('Gas Burner', 'ENCON Gas Burner & Accessories — price list (computed from Film)', 'gas'),
      hvOil: buildMatrixForVariant('HV Oil Burner', 'ENCON High Velocity Oil Burner — price list (computed)', 'hv_oil'),
      hvGas: buildMatrixForVariant('HV Gas Burner', 'ENCON High Velocity Gas Burner — price list (computed)', 'hv_gas'),
      spares: buildMatrixForVariant('Oil Burner Spares', 'ENCON Oil Burner Spares & Accessories — price list', 'spares'),
    };
  }, [costingSheets]);

  // Render Computed Matrix Table
  const renderMatrixTable = (m: any) => {
    if (!m || !m.rows || !m.rows.length) return null;
    const rules = FORMULA_RULES[m.fkey] || {};
    const searchLower = searchQuery.trim().toLowerCase();

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs mb-6">
        <div className="p-4 bg-slate-50/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">{m.titleLabel}</h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
            {m.rows.length} SIZES
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse font-mono">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-3.5 py-2.5 w-[110px]">Burner Size</th>
                <th className="px-3.5 py-2.5 text-center w-[130px]">kW (firing range)</th>
                {m.cols.map((colName: string) => {
                  const isColMatch = searchLower && colName.toLowerCase().includes(searchLower);
                  return (
                    <th
                      key={colName}
                      className={`px-3.5 py-2.5 text-right min-w-[110px] transition-colors ${
                        isColMatch
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-black ring-1 ring-amber-500/50'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>{colName}</span>
                        {isColMatch && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block" />}
                      </div>
                    </th>
                  );
                })}
                <th className="px-4 py-2.5 text-right w-[140px] bg-slate-200/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-extrabold">
                  Burner Set Total (₹)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {m.rows.map((r: any) => (
                <tr key={r.size} className="hover:bg-cyan-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-3.5 py-2.5 font-sans font-extrabold text-slate-900 dark:text-white text-xs whitespace-nowrap">
                    ENCON {r.size}
                  </td>
                  <td className="px-3.5 py-2.5 text-center text-slate-500 text-[11px] font-bold whitespace-nowrap">
                    {r.capacityKw || '—'}
                  </td>
                  {m.cols.map((colName: string) => {
                    const val = r.cellValues[colName] || 0;
                    const fText = rules[colName] || 'Computed from component BOM rate master';
                    const isSelected = selectedFormulaCell?.size === `ENCON ${r.size}` && selectedFormulaCell?.label === colName;
                    const isColMatch = searchLower && colName.toLowerCase().includes(searchLower);

                    return (
                      <td
                        key={colName}
                        onClick={() =>
                          setSelectedFormulaCell({
                            size: `ENCON ${r.size}`,
                            label: colName,
                            formula: fText,
                            value: val > 0 ? `₹ ${val.toLocaleString('en-IN')}` : '—',
                          })
                        }
                        className={`px-3.5 py-2.5 text-right text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-600 text-white font-black ring-2 ring-cyan-500/50'
                            : isColMatch
                            ? 'bg-amber-100/70 dark:bg-amber-950/50 font-bold text-amber-900 dark:text-amber-200'
                            : 'hover:bg-cyan-100/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold'
                        }`}
                        title="Click to view formula in fx bar"
                      >
                        {val > 0 ? val.toLocaleString('en-IN') : '—'}
                      </td>
                    );
                  })}
                  <td
                    onClick={() =>
                      setSelectedFormulaCell({
                        size: `ENCON ${r.size}`,
                        label: 'Burner Set Total',
                        formula: 'Sum of all component line rates in this row',
                        value: `₹ ${r.materialTotal.toLocaleString('en-IN')}`,
                      })
                    }
                    className="px-4 py-2.5 text-right font-black text-emerald-600 dark:text-emerald-400 bg-slate-100/50 dark:bg-slate-800/30 text-xs sm:text-sm cursor-pointer hover:bg-emerald-500/10 transition-colors"
                  >
                    ₹ {r.materialTotal.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6 max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 pb-16">
      {/* ─── HERO HEADER BANNER ─── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400 shadow-2xs">
              <Calculator className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Internal Costing Suite
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 animate-pulse" /> LIVE RATE LINKED
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl font-medium">
                Cost-side view — BOM cost without customer markup with live rate linking across equipment systems.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <button
              onClick={() => recalculateAllMutation.mutate()}
              disabled={recalculateAllMutation.isPending}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recalculateAllMutation.isPending ? 'animate-spin text-cyan-600' : ''}`} />
              <span>{recalculateAllMutation.isPending ? 'Recalculating...' : 'Recalculate All Costing'}</span>
            </button>

            <button
              onClick={() => {
                resetPriceForm();
                setIsPriceModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Master Item</span>
            </button>
          </div>
        </div>

        {/* STATS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="p-3 bg-slate-50/70 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Master Items & Spares</div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                {priceItems.length || priceMeta.total || 0}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 bg-slate-50/70 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">System Costing Sheets</div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {costingSheets.length || 57}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 bg-slate-50/70 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Item Categories</div>
              <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
                {categoriesList.length || 8}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Tag className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 bg-slate-50/70 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Live Rate Linking</div>
              <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE (◆)
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>


      {/* ─── TOP EQUIPMENT SYSTEM TABS WITH SEARCH MATCH BADGES ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 inline-flex items-center gap-1 overflow-x-auto max-w-full">
          {[
            { id: 'burner', label: 'Burner Systems', icon: Flame, color: 'text-amber-500', matches: searchMatchCounts.burner },
            { id: 'hpu', label: 'HPU Units', icon: Gauge, color: 'text-purple-500', matches: searchMatchCounts.hpu },
            { id: 'blower', label: 'Blower Skids', icon: Activity, color: 'text-cyan-500', matches: searchMatchCounts.blower },
            { id: 'regen', label: 'Regen Burners', icon: Zap, color: 'text-rose-500', matches: searchMatchCounts.regen },
            ...(canViewPurchasePrices
              ? [{ id: 'master', label: 'Master Price Catalog', icon: Coins, color: 'text-emerald-500', matches: searchMatchCounts.master }]
              : []),
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.color}`} />
                <span>{tab.label}</span>
                {tab.matches > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-black bg-amber-500 text-white animate-pulse">
                    {tab.matches}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* SEARCH INPUT */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search items, components e.g. Burner Alone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all font-medium"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
            {isSearchLoading ? (
              <Loader2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 animate-spin" />
            ) : searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedSearchQuery('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* ─── TAB 1: BURNER SYSTEMS ─── */}
      {activeTab === 'burner' && (
        <div className="space-y-6">
          {/* COLLAPSIBLE FORMULAS PANEL — purchase/admin only (contains cost breakdown) */}
          {canViewPurchasePrices && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <button
              onClick={() => setIsFormulasExpanded(!isFormulasExpanded)}
              className="w-full p-4 bg-slate-50/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-left hover:bg-slate-100/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  📐 How every price is computed — formulas
                </span>
                <span className="text-[10px] text-slate-400 font-normal ml-1">(click to toggle guide)</span>
              </div>
              {isFormulasExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {isFormulasExpanded && (
              <div className="p-4 sm:p-5 space-y-3 text-xs text-slate-600 dark:text-slate-300 font-medium bg-slate-50/40 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <strong className="text-cyan-600 dark:text-cyan-400 font-bold">Part cost — all burners:</strong> Amount = Qty × Rate · Total = Amount + M/C Cost · <span className="text-cyan-500 font-bold">◆</span> rates are pulled live from the Rate Master.
                </div>
                <div>
                  <strong className="text-amber-600 dark:text-amber-400 font-bold">Film Burner & Accessories:</strong> Burner Alone = Σ(first 5 oil-burner parts, incl. S.S. assy) × 2.5 · Micro Valve = part × 2 · C.I. Plate = part × 1.8 · Burner Block = block part × 2 (5A/6A × 2.2) · Flex Hoses = Σ(2 hose parts) × 2 · Y-Strainer = part × 2.5 · Butterfly = part × 2.
                </div>
                <div>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Dual Fuel:</strong> Burner Alone = Film Burner Alone + S.G. Assembly · High Al = Film block (5A/6A = 11,850 fixed) · Ball Valve = 2 × Pricelist NB ball-valve × 0.78.
                </div>
              </div>
            )}
          </div>
          )} {/* end canViewPurchasePrices formulas panel */}

          {/* 5 COMPUTED PRICE MATRICES */}
          {renderMatrixTable(matrixData.oilFilm)}
          {renderMatrixTable(matrixData.dualFuel)}
          {renderMatrixTable(matrixData.gas)}
          {renderMatrixTable(matrixData.hvOil)}
          {renderMatrixTable(matrixData.hvGas)}

          {/* DETAILED INTERNAL BOM PARTS COSTING TABLES — purchase/admin only */}
          {canViewPurchasePrices && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Parts Costing (Internal) — drives every price above
              </h3>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {costingSheets.filter((s) => s.productType === 'Burner').length} Burner BOM Sheets Linked
              </span>
            </div>

            {costingSheets
              .filter((s) => s.productType === 'Burner')
              .map((sheet) => (
                <div key={sheet._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                  <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-500 mr-2">{sheet.sheetCode}</span>
                      <strong className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">{sheet.title}</strong>
                    </div>
                    <div className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                      Total Cost: ₹ {(sheet.materialTotal + sheet.laborTotal).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse font-mono">
                      <thead>
                        <tr className="bg-slate-100/70 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase">
                          <th className="px-3 py-2 w-[40px]">S.No</th>
                          <th className="px-3 py-2">Particular</th>
                          <th className="px-3 py-2 text-center w-[60px]">Qty</th>
                          <th className="px-3 py-2 text-center w-[60px]">Unit</th>
                          {canViewPurchasePrices && <th className="px-3 py-2 text-right w-[110px]">Rate</th>}
                          {canViewPurchasePrices && <th className="px-3 py-2 text-right w-[110px]">Amount</th>}
                          {canViewPurchasePrices && <th className="px-3 py-2 text-right w-[100px]">M/C Cost</th>}
                          <th className="px-3 py-2 text-right w-[120px]">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(sheet.items || []).map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="px-3 py-2 text-slate-400">{it.sNo || idx + 1}</td>
                            <td className="px-3 py-2 font-sans font-bold text-slate-900 dark:text-white">{it.particular}</td>
                            <td className="px-3 py-2 text-center font-bold">{it.qty}</td>
                            <td className="px-3 py-2 text-center text-slate-500">{it.unit}</td>
                            {canViewPurchasePrices && (
                              <td
                                className="px-3 py-2 text-right font-bold text-cyan-600 dark:text-cyan-400"
                                title="◆ Linked rate driven by Rate Master"
                              >
                                ₹ {it.rate.toLocaleString('en-IN')} ◆
                              </td>
                            )}
                            {canViewPurchasePrices && (
                              <td className="px-3 py-2 text-right font-bold">
                                ₹ {(it.qty * it.rate).toLocaleString('en-IN')}
                              </td>
                            )}
                            {canViewPurchasePrices && (
                              <td className="px-3 py-2 text-right text-slate-500">
                                ₹ {(it.machiningCost || 0).toLocaleString('en-IN')}
                              </td>
                            )}
                            <td className="px-3 py-2 text-right font-black text-emerald-600 dark:text-emerald-400">
                              ₹ {(it.totalAmount || 0).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
          </div>
          )} {/* end canViewPurchasePrices BOM section */}

          {/* MARKUP MASTER TABLE — purchase/admin only */}
          {canViewPurchasePrices && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  Markup Master — cost → price factors (edit to reprice every burner table above)
                </h3>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">Overhead Markup %</span>
                    <p className="text-[10px] text-slate-400">Applied to BOM Total Cost</p>
                  </div>
                  <input
                    type="number"
                    value={overheadPercent}
                    onChange={(e) => setOverheadPercent(parseFloat(e.target.value) || 0)}
                    className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-right font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">Profit Margin Markup %</span>
                    <p className="text-[10px] text-slate-400">Applied to Total Cost + Overhead</p>
                  </div>
                  <input
                    type="number"
                    value={markupPercent}
                    onChange={(e) => setMarkupPercent(parseFloat(e.target.value) || 0)}
                    className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-right font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: HPU UNITS ─── */}
      {activeTab === 'hpu' && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-purple-500" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Hydraulic Power Unit (HPU) Costing Breakups</h3>
            </div>
            <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">Simplex & Duplex Variants</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {costingSheets
              .filter((s) => s.productType === 'HPU')
              .map((sheet) => (
                <div key={sheet._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                  <div className="p-4 bg-slate-50/70 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-500 mr-2">{sheet.sheetCode}</span>
                      <strong className="text-sm font-black text-slate-900 dark:text-white">{sheet.title}</strong>
                      {sheet.capacityKw && <span className="text-xs text-slate-400 ml-2 font-mono">({sheet.capacityKw})</span>}
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-emerald-600 font-mono">₹ {(sheet.sellingPrice || 0).toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-slate-400">Mat: ₹{(sheet.materialTotal || 0).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ─── TAB 3: BLOWER SKIDS ─── */}
      {activeTab === 'blower' && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-500" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Blower Skid Costing & Motor Ratings</h3>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">Air Fan & Motor Assemblies</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {costingSheets
              .filter((s) => s.productType === 'Blower')
              .map((sheet) => (
                <div key={sheet._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                  <div className="p-4 bg-slate-50/70 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-500 mr-2">{sheet.sheetCode}</span>
                      <strong className="text-sm font-black text-slate-900 dark:text-white">{sheet.title}</strong>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-emerald-600 font-mono">₹ {(sheet.sellingPrice || 0).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ─── TAB 4: REGEN BURNERS ─── */}
      {activeTab === 'regen' && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-rose-500" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Regenerative Burner System Costing</h3>
            </div>
            <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">Regen Beds, Media & Switching Valves</span>
          </div>
        </div>
      )}

      {/* ─── TAB 5: MASTER PRICE CATALOG — purchase/admin only ─── */}
      {activeTab === 'master' && canViewPurchasePrices && (
        <div className="space-y-4">
          {/* CATEGORY DROPDOWN FILTER TOOLBAR */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
                <Filter className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Filter by Category:</span>
              </span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all cursor-pointer min-w-[220px]"
              >
                <option value="All">All Categories ({displayMasterItems.length} items)</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing <strong className="text-slate-900 dark:text-white font-mono">{displayMasterItems.length}</strong> items in catalog
            </div>
          </div>

          {/* MASTER ITEMS TABLE */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Master Price Catalog & Spare Parts
                </h3>
              </div>
              {canEditPurchasePrices && (
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Click any rate to edit inline & update system costing
                </span>
              )}
            </div>

            {loadingPrices ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-8 h-8 text-cyan-600 animate-spin mb-3" />
                <p className="text-xs font-bold text-slate-500">Loading master price list...</p>
              </div>
            ) : displayMasterItems.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <Package className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No items found matching search</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-3 w-[120px]">Item Code</th>
                      <th className="px-4 py-3">Item / Description / Particular</th>
                      <th className="px-4 py-3 w-[140px]">Category</th>
                      <th className="px-4 py-3">Specification</th>
                      <th className="px-4 py-3 text-center w-[80px]">Unit</th>
                      <th className="px-4 py-3 text-right w-[160px]">Unit Rate (₹)</th>
                      {canEditPurchasePrices && <th className="px-4 py-3 text-center w-[110px]">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {displayMasterItems.map((item) => {
                      const style = CATEGORY_STYLES[item.category] || DEFAULT_CATEGORY_STYLE;
                      const isEditingInline = inlineEditingRateId === item._id;

                      return (
                        <tr key={item._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-mono text-[11px] font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>{item.itemCode}</span>
                              <button
                                onClick={() => handleCopyCode(item.itemCode)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                              >
                                {copiedCode === item.itemCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                            {item.item}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${style.bg} ${style.text} ${style.border}`}>
                              {item.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-[11px]">
                            {item.specification || '—'}
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {item.unit || 'Nos'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                            {canEditPurchasePrices && isEditingInline ? (
                              <div className="flex items-center justify-end gap-1">
                                <input
                                  type="number"
                                  value={inlineRateValue}
                                  onChange={(e) => setInlineRateValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveInlineRate(item);
                                    if (e.key === 'Escape') setInlineEditingRateId(null);
                                  }}
                                  autoFocus
                                  className="w-24 bg-white dark:bg-slate-950 border border-cyan-500 rounded px-2 py-1 text-right text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none ring-2 ring-cyan-500/20"
                                />
                                <button
                                  onClick={() => handleSaveInlineRate(item)}
                                  disabled={updatePriceMutation.isPending || createPriceMutation.isPending}
                                  className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                                >
                                  {updatePriceMutation.isPending || createPriceMutation.isPending ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )}
                                </button>
                                <button
                                  onClick={() => setInlineEditingRateId(null)}
                                  className="p-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => canEditPurchasePrices && startInlineEdit(item)}
                                className={`group flex items-center justify-end gap-1.5 transition-colors ${
                                  canEditPurchasePrices
                                    ? 'cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400'
                                    : 'cursor-default'
                                }`}
                                title={canEditPurchasePrices ? 'Click to edit rate inline' : undefined}
                              >
                                <span>₹ {Number(item.price || 0).toLocaleString('en-IN')}</span>
                                {canEditPurchasePrices && (
                                  <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />
                                )}
                              </div>
                            )}
                          </td>
                          {canEditPurchasePrices && (
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingPriceItem(item);
                                    setPriceFormData(item);
                                    setIsPriceModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-cyan-600 transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                {!item._id.startsWith('bom-') && (
                                  <button
                                    onClick={() =>
                                      setDeleteConfirmTarget({
                                        type: 'price',
                                        id: item._id,
                                        title: `${item.itemCode} (${item.item})`,
                                      })
                                    }
                                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD / EDIT MASTER ITEM ─── */}
      {isPriceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-cyan-600" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {editingPriceItem ? 'Edit Master Item Rate' : 'Add New Master Item / Spare'}
                </h3>
              </div>
              <button onClick={() => setIsPriceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingPriceItem && !editingPriceItem._id.startsWith('bom-')) {
                  updatePriceMutation.mutate({ id: editingPriceItem._id, data: priceFormData });
                } else {
                  createPriceMutation.mutate(priceFormData);
                }
              }}
              className="p-4 space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Item Particular / Name *</label>
                <input
                  type="text"
                  required
                  value={priceFormData.item || ''}
                  onChange={(e) => setPriceFormData({ ...priceFormData, item: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Unit Rate (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={priceFormData.price ?? ''}
                    onChange={(e) => setPriceFormData({ ...priceFormData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Category</label>
                  <select
                    value={priceFormData.category || 'Raw Material'}
                    onChange={(e) => setPriceFormData({ ...priceFormData, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Spare Part">Spare Part</option>
                    <option value="Burner Component">Burner Component</option>
                    <option value="Raw Material">Raw Material</option>
                    <option value="Bought Out">Bought Out</option>
                    <option value="Blower Equipment">Blower Equipment</option>
                    <option value="HPU Component">HPU Component</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPriceModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPriceMutation.isPending || updatePriceMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-500"
                >
                  Save & Recalculate System
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: DELETE CONFIRMATION ─── */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-5 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Confirm Deletion</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deleteConfirmTarget.title}</strong>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmTarget.type === 'price') {
                    deletePriceMutation.mutate(deleteConfirmTarget.id);
                  }
                }}
                disabled={deletePriceMutation.isPending}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
