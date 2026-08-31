import { api } from './api';

export interface Attachment {
  id: string | number;
  enquiryId: string | number;
  filename: string;
  contentType: string;
  size: number;
  kind: string;
  uploadedBy: string;
  createdAt: string;
  url?: string;
}

export interface Enquiry {
  id: string | number;
  rfqId: string;
  dateReceived: string;
  receivedOn: string;
  type: string;
  companyName: string;
  contactPerson: string;
  mobile: string;
  email: string;
  itemDescription: string;
  assignedTo: string;
  assignedDate: string;
  tat: string;
  salesResponsibility: string;
  technical: string;
  status: string;
  remarks: string;
  pendingRemarks?: string;
  followupRemarks: string;
  nextActionDate: string;
  lastCallDate?: string;
  proposedOfferDate: string;
  offerNo: string;
  offerDate: string;
  clientRefNo?: string;
  doc: string;
  costing: string;
  timeline: string;
  costingNotified: string;
  reminderSent: string;
  driveFolderId?: string;
  driveFolderUrl?: string;
  emailBody?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
  daysOpen: number | null;
  ageClass: string;
  tentativeOfferDate: string | null;
  followupDue: boolean;
  isOverdue: boolean;
  tatDays: number;
  isMappedToOffer: boolean;
}

export interface RfqStats {
  total: number;
  active: number;
  incompleteCount?: number;
  underReview: number;
  offerSent: number;
  closed: number;
  overdue: number;
  dueFollowups: number;
  mappedOffersCount: number;
  byAssignee: { name: string; count: number }[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ActivityLogItem {
  id: string;
  userId?: string;
  userEmail: string;
  action: string;
  details?: string;
  createdAt: string;
}

export interface DirectoryItem {
  name: string;
  email: string;
  role?: string;
  origName?: string;
}

export const rfqService = {
  getEnquiries: async (params?: {
    tab?: string;
    status?: string;
    assignedTo?: string;
    search?: string;
    due?: boolean;
    overdue?: boolean;
    mapped?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get('/rfq', { params });
    return res.data;
  },

  getEnquiryById: async (id: string | number) => {
    const res = await api.get(`/rfq/${id}`);
    return res.data;
  },

  getAnalyticsDashboard: async () => {
    const res = await api.get('/rfq/analytics-dashboard');
    return res.data;
  },

  getOfferMappingView: async (params?: { show?: 'quoted' | 'pending'; q?: string }) => {
    const res = await api.get('/rfq/offer-mapping-view', { params });
    return res.data;
  },

  createEnquiry: async (data: Partial<Enquiry>) => {
    const { emailBody, attachments, daysOpen, ageClass, tentativeOfferDate, followupDue, isOverdue, tatDays, isMappedToOffer, createdAt, updatedAt, ...cleanPayload } = data as any;
    const res = await api.post('/rfq', cleanPayload);
    return res.data;
  },

  updateEnquiry: async (id: string | number, data: Partial<Enquiry>) => {
    const { emailBody, attachments, daysOpen, ageClass, tentativeOfferDate, followupDue, isOverdue, tatDays, isMappedToOffer, createdAt, updatedAt, ...cleanPayload } = data as any;
    const res = await api.put(`/rfq/${id}`, cleanPayload);
    return res.data;
  },

  inlineUpdateField: async (id: string | number, field: string, value: any) => {
    const res = await api.patch(`/rfq/${id}/inline`, { field, value });
    return res.data;
  },

  sendForReview: async (id: string | number) => {
    const res = await api.post(`/rfq/${id}/send-review`);
    return res.data;
  },

  verifyReview: async (id: string | number, payload: { remarks?: string }) => {
    const res = await api.post(`/rfq/${id}/verify-review`, payload);
    return res.data;
  },

  approveReview: async (
    id: string | number,
    payload: { offerNo?: string; offerDate?: string; remarks?: string; statusAction?: 'APPROVE' | 'OFFER_SENT' | 'REJECT' | 'REQUEST_CHANGES' }
  ) => {
    const res = await api.post(`/rfq/${id}/approve-review`, payload);
    return res.data;
  },

  uploadAttachment: async (id: string | number, file: File, kind: string = '') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('kind', kind);
    const res = await api.post(`/rfq/${id}/attachments`, formData);
    return res.data;
  },

  deleteAttachment: async (attachmentId: string | number) => {
    const res = await api.delete(`/rfq/attachments/${attachmentId}`);
    return res.data;
  },

  deleteEnquiry: async (id: string | number) => {
    const res = await api.delete(`/rfq/${id}`);
    return res.data;
  },

  bulkDeleteEnquiries: async (ids: (string | number)[]) => {
    const res = await api.post('/rfq/bulk-delete', { ids });
    return res.data;
  },

  getDirectory: async () => {
    const res = await api.get('/rfq/directory');
    return res.data;
  },

  saveDirectory: async (items: DirectoryItem[]) => {
    const res = await api.post('/rfq/directory', { items });
    return res.data;
  },

  importExcel: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/rfq/import', formData);
    return res.data;
  },

  syncInbox: async () => {
    const res = await api.post('/rfq/sync-inbox');
    return res.data;
  },

  getInboxStatus: async () => {
    const res = await api.get('/rfq/inbox-status');
    return res.data;
  },

  getAutomationUrl: async (id: string | number) => {
    const res = await api.get(`/rfq/${id}/automation-url`);
    return res.data;
  },

  openDriveFolder: async (id: string | number) => {
    const res = await api.get(`/rfq/${id}/drive`);
    return res.data;
  },

  syncDriveFolder: async (id: string | number) => {
    const res = await api.post(`/rfq/${id}/sync-drive`);
    return res.data;
  },
};
