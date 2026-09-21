import { api } from './api';

/* ─── Types (mirror backend/src/modules/pricing/pricing.types.ts) ──────────── */

export type ItemType = 'COMPONENT' | 'PRODUCT' | 'ASSEMBLY' | 'RAW_MATERIAL' | 'SPARE' | 'SERVICE';
export type PriceType = 'PURCHASE' | 'MATERIAL' | 'COMPONENT' | 'REFERENCE';
export type PriceStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
export type RuleType = 'PERCENTAGE' | 'FIXED' | 'MULTIPLIER';
export type RuleAppliesTo = 'ITEM' | 'CATEGORY' | 'GLOBAL';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PricingMeta {
  itemTypes: ItemType[];
  priceTypes: PriceType[];
  priceStatuses: PriceStatus[];
  ruleTypes: RuleType[];
  ruleAppliesTo: RuleAppliesTo[];
  costComponentTypes: string[];
  currencies: string[];
  itemTypePrefixes: Record<string, string>;
}

export interface LookupRef {
  _id: string;
  name: string;
}

export interface PricingLookup {
  categories: LookupRef[];
  units: LookupRef[];
  suppliers: LookupRef[];
}

export interface CurrentPrice {
  version: number;
  priceType: PriceType;
  unitPrice: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: PriceStatus;
  reason?: string;
  createdBy?: string;
}

export interface PricingItemRow {
  id: string;
  code: string;
  name: string;
  itemType: ItemType;
  category: string;
  unit: string;
  supplier: string;
  manufacturer: string;
  model: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  currentPrice: {
    version: number;
    priceType: PriceType;
    unitPrice: number;
    currency: string;
    effectiveFrom: string;
    status: PriceStatus;
  } | null;
}

export interface PriceVersionRow {
  _id: string;
  version: number;
  priceType: PriceType;
  unitPrice: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: PriceStatus;
  reason?: string;
  createdBy?: string;
  createdAt: string;
}

export interface CostComponentRow {
  type: string;
  name: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface CostVersionRow {
  _id: string;
  version: number;
  status: string;
  effectiveFrom: string;
  components: CostComponentRow[];
  totalCost: number;
  currency: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
}

export interface LegacyReference {
  source: string;
  value: string;
}

export interface PricingItemDetail {
  item: {
    id: string;
    code: string;
    name: string;
    itemType: ItemType;
    category: string;
    categoryId: string | null;
    unit: string;
    supplier: string;
    manufacturer: string;
    model: string;
    description: string;
    specifications: string;
    isPurchasable: boolean;
    isSellable: boolean;
    isActive: boolean;
    legacyReferences: LegacyReference[];
    createdBy: string;
    updatedBy: string;
    createdAt: string;
    updatedAt: string;
  };
  currentPrice: CurrentPrice | null;
  priceVersions: PriceVersionRow[];
  priceVersionsMeta: PaginationMeta;
  costVersion: CostVersionRow | null;
  calculation: CalculationResult | { error: string; message: string } | null;
}

export interface HistoryRow {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  category: string;
  itemType: ItemType;
  previousPrice: number | null;
  newPrice: number;
  currency: string;
  version: number;
  priceType: PriceType;
  reason: string;
  changedBy: string;
  changedAt: string;
  effectiveFrom: string;
  status: PriceStatus;
}

export interface CalculationResult {
  itemId: string;
  itemCode: string;
  itemName?: string;
  costBasis: string;
  cost: number;
  currency?: string;
  markupRule: { id: string; name: string; ruleType: string; ruleValue: number; priority: number } | null;
  markupAmount: number;
  sellingPrice: number;
  margin: number;
  priceUsed?: { version: number; priceType: string; unitPrice: number } | null;
  costVersionUsed?: { version: number; totalCost: number } | null;
}

export interface PricingRule {
  id: string;
  name: string;
  ruleType: RuleType;
  ruleValue: number;
  appliesTo: RuleAppliesTo;
  itemId?: string | null;
  itemName?: string | null;
  itemCode?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  priority: number;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  cards: {
    totalItems: number;
    activeItems: number;
    inactiveItems: number;
    itemsWithoutPrice: number;
    priceChangesThisMonth: number;
    byType: Record<string, number>;
    products: number;
    components: number;
    assemblies: number;
    rawMaterials: number;
    spares: number;
    services: number;
  };
  recentPriceChanges: HistoryRow[];
  itemsWithMissingPricing: { id: string; code: string; name: string; itemType: string }[];
}

export interface ImportRowInput {
  row?: number;
  itemCode?: string;
  name: string;
  itemType?: ItemType;
  category?: string;
  unit?: string;
  supplier?: string;
  manufacturer?: string;
  model?: string;
  specification?: string;
  unitPrice?: number | null;
  currency?: string;
  priceType?: PriceType;
  effectiveFrom?: string;
  reason?: string;
}

export interface ImportAnalysis {
  summary: {
    totalRows: number;
    newItems: number;
    existingItems: number;
    priceChanges: number;
    duplicates: number;
    errors: number;
  };
  newItems: (ImportRowInput & { row: number })[];
  existingItems: (ImportRowInput & {
    row: number;
    existingItemId: string;
    currentPrice: number | null;
    note: string;
    willAddPrice: boolean;
  })[];
  priceChanges: (ImportRowInput & {
    row: number;
    existingItemId: string;
    currentPrice: number;
    newPrice: number;
  })[];
  duplicates: (ImportRowInput & { row: number; duplicateOf: string })[];
  errors: { row: number; name?: string; message: string }[];
}

export interface ImportCommitResult {
  results: {
    row: number;
    itemCode?: string;
    action: string;
    itemId?: string;
    version?: number;
    message?: string;
  }[];
  summary: { created: number; priceUpdated: number; skipped: number; errors: number };
}

/* ─── Request payloads ─────────────────────────────────────────────────────── */

export interface ItemListParams {
  search?: string;
  itemType?: string;
  categoryId?: string;
  supplierId?: string;
  isActive?: string;
  priceStatus?: string;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}

export interface CreateItemPayload {
  code?: string;
  name: string;
  itemType: ItemType;
  categoryId?: string;
  categoryName?: string;
  unitId?: string;
  unitName?: string;
  supplierId?: string;
  supplierName?: string;
  manufacturer?: string;
  model?: string;
  description?: string;
  specifications?: string;
  isPurchasable?: boolean;
  isSellable?: boolean;
  initialPrice?: {
    priceType: PriceType;
    unitPrice: number;
    currency?: string;
    effectiveFrom?: string;
    reason?: string;
  };
}

export interface CreatePricePayload {
  priceType: PriceType;
  unitPrice: number;
  currency?: string;
  effectiveFrom?: string;
  status?: string;
  reason?: string;
}

export interface CreateCostPayload {
  components: { type: string; name: string; quantity: number; unit?: string; rate: number }[];
  effectiveFrom?: string;
  status?: string;
  currency?: string;
  notes?: string;
}

export interface RulePayload {
  name: string;
  ruleType: RuleType;
  ruleValue: number;
  appliesTo: RuleAppliesTo;
  itemId?: string | null;
  categoryId?: string | null;
  priority?: number;
  isActive?: boolean;
}

/* ─── API calls ────────────────────────────────────────────────────────────── */

const unwrap = (res: any) => res.data?.data;

export const pricingService = {
  /* Meta & lookup */
  getMeta: async (): Promise<PricingMeta> => unwrap(await api.get('/pricing/meta')),
  getLookup: async (): Promise<PricingLookup> => unwrap(await api.get('/pricing/lookup')),
  getDashboard: async (): Promise<DashboardStats> => unwrap(await api.get('/pricing/dashboard')),

  /* Items */
  getItems: async (params: ItemListParams): Promise<{ items: PricingItemRow[]; meta: PaginationMeta }> => {
    const res = await api.get('/pricing/items', { params });
    return { items: res.data.data || [], meta: res.data.meta };
  },
  getNextCode: async (itemType: ItemType): Promise<{ itemType: ItemType; nextCode: string }> =>
    unwrap(await api.get('/pricing/items/next-code', { params: { itemType } })),
  getItem: async (id: string): Promise<PricingItemDetail> => unwrap(await api.get(`/pricing/items/${id}`)),
  createItem: async (payload: CreateItemPayload) => {
    const res = await api.post('/pricing/items', payload);
    return res.data;
  },
  updateItem: async (id: string, payload: Partial<CreateItemPayload>) => {
    const res = await api.patch(`/pricing/items/${id}`, payload);
    return res.data;
  },
  deactivateItem: async (id: string) => {
    const res = await api.delete(`/pricing/items/${id}`);
    return res.data;
  },

  /* Price versions */
  getItemPrices: async (id: string, page = 1, limit = 50) => {
    const res = await api.get(`/pricing/items/${id}/prices`, { params: { page, limit } });
    return { versions: (res.data.data || []) as PriceVersionRow[], meta: res.data.meta as PaginationMeta };
  },
  createPriceVersion: async (id: string, payload: CreatePricePayload) => {
    const res = await api.post(`/pricing/items/${id}/prices`, payload);
    return res.data;
  },

  /* Cost versions */
  getItemCosts: async (id: string, page = 1, limit = 50) => {
    const res = await api.get(`/pricing/items/${id}/cost`, { params: { page, limit } });
    return { versions: (res.data.data || []) as CostVersionRow[], meta: res.data.meta as PaginationMeta };
  },
  createCostVersion: async (id: string, payload: CreateCostPayload) => {
    const res = await api.post(`/pricing/items/${id}/cost`, payload);
    return res.data;
  },

  /* Rules */
  getRules: async (params?: { isActive?: string; appliesTo?: string; search?: string }): Promise<PricingRule[]> =>
    unwrap(await api.get('/pricing/rules', { params })) || [],
  createRule: async (payload: RulePayload) => {
    const res = await api.post('/pricing/rules', payload);
    return res.data;
  },
  updateRule: async (id: string, payload: Partial<RulePayload>) => {
    const res = await api.patch(`/pricing/rules/${id}`, payload);
    return res.data;
  },

  /* History */
  getHistory: async (params: {
    search?: string;
    from?: string;
    to?: string;
    user?: string;
    page?: number;
    limit?: number;
  }): Promise<{ rows: HistoryRow[]; meta: PaginationMeta }> => {
    const res = await api.get('/pricing/history', { params });
    return { rows: res.data.data || [], meta: res.data.meta };
  },

  /* Calculate */
  calculate: async (ref: { itemId?: string; itemCode?: string }) =>
    unwrap(await api.post('/pricing/calculate', ref)),

  /* Import / export */
  importPreview: async (rows: ImportRowInput[]): Promise<ImportAnalysis> =>
    unwrap(await api.post('/pricing/import/preview', { rows })),
  importCommit: async (rows: ImportRowInput[]): Promise<ImportCommitResult> =>
    unwrap(await api.post('/pricing/import/commit', { rows, confirmed: true })),
  exportUrl: '/api/pricing/export',
};
