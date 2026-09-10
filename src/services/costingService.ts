import { api } from "./api";

export interface PriceItem {
  _id: string;
  itemCode: string;
  item: string;
  category: string;
  unit: string;
  price: number;
  previousPrice?: number;
  specification?: string;
  wastagePercent?: number;
  laborCost?: number;
  vendor?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CostingBomItem {
  _id?: string;
  sNo: number;
  itemCode?: string;
  particular: string;
  category?: string;
  qty: number;
  unit: string;
  rate: number;
  rateRef?: string;
  laborCost?: number;
  machiningCost?: number;
  totalAmount: number;
}

export interface CostingSheet {
  _id: string;
  sheetCode: string;
  title: string;
  productType: "Burner" | "Blower" | "HPU" | "Regen" | "Custom";
  capacityKw?: string;
  variant?: string;
  items: CostingBomItem[];
  materialTotal: number;
  laborTotal: number;
  totalCost: number;
  overheadPercent: number;
  markupPercent: number;
  sellingPrice: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const costingService = {
  getPriceItems: async (params?: { category?: string; search?: string }) => {
    const res = await api.get("/costing/prices", { params });
    return res.data;
  },

  createPriceItem: async (data: Partial<PriceItem>) => {
    const res = await api.post("/costing/prices", data);
    return res.data;
  },

  updatePriceItem: async (id: string, data: Partial<PriceItem>) => {
    const res = await api.put(`/costing/prices/${id}`, data);
    return res.data;
  },

  deletePriceItem: async (id: string) => {
    const res = await api.delete(`/costing/prices/${id}`);
    return res.data;
  },

  seedDefaultPrices: async () => {
    const res = await api.post("/costing/prices/seed");
    return res.data;
  },

  reorganizeCodes: async () => {
    const res = await api.post("/costing/prices/reorganize");
    return res.data;
  },

  getCostingSheets: async (params?: { productType?: string; search?: string }) => {
    const res = await api.get("/costing/sheets", { params });
    return res.data;
  },

  getCostingSheetById: async (id: string) => {
    const res = await api.get(`/costing/sheets/${id}`);
    return res.data;
  },

  createCostingSheet: async (data: Partial<CostingSheet>) => {
    const res = await api.post("/costing/sheets", data);
    return res.data;
  },

  updateCostingSheet: async (id: string, data: Partial<CostingSheet>) => {
    const res = await api.put(`/costing/sheets/${id}`, data);
    return res.data;
  },

  deleteCostingSheet: async (id: string) => {
    const res = await api.delete(`/costing/sheets/${id}`);
    return res.data;
  },

  uploadPricingJson: async (payload: { priceMaster?: any[]; costingSheets?: any[] }) => {
    const res = await api.post("/costing/import-json", payload);
    return res.data;
  },

  syncLiveOfferGenerator: async () => {
    const res = await api.post("/costing/sync-live");
    return res.data;
  },

  recalculateCostingSheets: async () => {
    const res = await api.post("/costing/recalculate");
    return res.data;
  },
};
