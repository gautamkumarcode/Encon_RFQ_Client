// ---------------------------------------------------------------------------
// Shared types for the Order in Hand feature.
// Mirror backend orderController.serialize() + clientController responses.
// ---------------------------------------------------------------------------

export interface LineItem {
  description: string;
  qty: number;
  value: number;
}

// A money-received entry against the order (in the order currency).
export interface Payment {
  type: string;
  amount: number;
  date: string;   // yyyy-mm-dd for the date input ('' when unset)
  note: string;
}

export interface Order {
  id: string;
  client: string | null;
  clientName: string;
  enquiry: string | null;
  jobNo: string;
  rfqId: string;
  poNumber: string;
  poDate: string | null;
  orderReceivedDate: string | null;
  lineItems: LineItem[];
  currency: string;
  orderValue: number;
  orderValueINR: number;
  termsOfPayment: string;
  advanceAmount: number;
  advanceReceivedDate: string | null;
  payments: Payment[];
  totalReceived: number;
  ldApplicable: boolean;
  ldPercentage: number;
  dispatchAsPerPo: string | null;
  expectedDespatch: string | null;
  piNumber: string;
  piDate: string | null;
  status: string;
  currentStatusNote: string;
}

export interface OrdersResponse {
  success: boolean;
  count: number;
  totalINR: number;
  openINR: number;
  data: Order[];
}

export interface ClientAddr {
  type: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

// A plain address (no type) captured on the order form / prefill.
export interface ClientAddressLite {
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface Client {
  id: string;
  name: string;
  addresses: ClientAddr[];
  country: string;
  contactPerson: string;
  mobile: string;
  email: string;
}

export interface ClientsResponse {
  success: boolean;
  count: number;
  data: Client[];
}

export interface PrefillData {
  enquiryId: string;
  jobNo: string;
  rfqId: string;
  clientId: string | null;
  clientName: string;
  addresses: ClientAddr[];
  contactPerson: string;
  mobile: string;
  email: string;
  country: string;
  address: ClientAddressLite | null;
  lineItems: LineItem[];
  currency: string;
}

export interface EnqLite {
  id: string;
  rfqId: string;
  companyName: string;
  itemDescription: string;
}

// Excel import: one parsed order preview (dry-run) + the commit result.
export interface ImportPreviewOrder {
  jobNo: string;
  clientName: string;
  poNumber: string;
  orderValueINR: number;
  itemCount: number;
  duplicate: boolean;
}

export interface ImportPreviewResult {
  success: boolean;
  dryRun: true;
  total: number;
  orders: ImportPreviewOrder[];
  message?: string;
}

export interface ImportCommitResult {
  success: boolean;
  dryRun: false;
  total: number;
  created: number;
  skipped: number;
  message?: string;
}

// Shape of the add/edit form state.
export interface FormState {
  clientName: string;
  clientId: string | null;
  enquiryId: string | null;
  contactPerson: string;
  mobile: string;
  email: string;
  country: string;
  address: ClientAddressLite;
  jobNo: string;
  poNumber: string;
  poDate: string;
  orderReceivedDate: string;
  currency: string;
  orderValueINR: string;
  termsOfPayment: string;
  advanceAmount: string;
  advanceReceivedDate: string;
  payments: Payment[];
  ldApplicable: boolean;
  ldPercentage: string;
  dispatchAsPerPo: string;
  expectedDespatch: string;
  piNumber: string;
  piDate: string;
  status: string;
  currentStatusNote: string;
  lineItems: LineItem[];
}
