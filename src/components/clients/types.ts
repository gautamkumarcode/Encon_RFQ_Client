// ---------------------------------------------------------------------------
// Shared types for the Clients (party master) feature.
// Mirror backend clientController listClients / getClientById / upsertClient.
// ---------------------------------------------------------------------------

export interface ClientAddr {
  type: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface ClientRow {
  id: string;
  name: string;
  contactPerson: string;
  mobile: string;
  email: string;
  gstin: string;
  country: string;
  addresses: ClientAddr[];
  enquiryCount: number;
  orderCount: number;
  dispatchedCount: number;
  orderValueINR: number;
}

export interface ClientsResponse {
  success: boolean;
  count: number;
  data: ClientRow[];
}

export interface EnquiryLite {
  _id?: string;
  id?: string;
  rfqId?: string;
  companyName?: string;
  itemDescription?: string;
  status?: string;
  dateReceived?: string | null;
  offerNo?: string;
}

// A client order as returned raw by getClientById (mongoose doc shape).
export interface ClientOrderLite {
  _id?: string;
  id?: string;
  jobNo?: string;
  poNumber?: string;
  poDate?: string | null;
  currency?: string;
  orderValue?: number;
  orderValueINR?: number;
  status?: string;
  expectedDespatch?: string | null;
}

export interface ClientDetailResponse {
  success: boolean;
  data: ClientRow & { notes?: string };
  enquiries: EnquiryLite[];
  orders: ClientOrderLite[];
}

// Add/edit client form state.
export interface ClientFormState {
  id: string | null;
  name: string;
  contactPerson: string;
  mobile: string;
  email: string;
  gstin: string;
  country: string;
  notes: string;
  addresses: ClientAddr[];
}
