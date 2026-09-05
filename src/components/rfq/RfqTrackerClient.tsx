'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Building2,
  Calendar,
  ExternalLink,
  Edit,
  Trash2,
  Download,
  Upload,
  BookOpen,
  Send,
  Sparkles,
  RefreshCw,
  Tag,
  Check,
  X,
  Mail,
  BarChart3,
  PieChart,
  Layers,
  Paperclip,
  ArrowRight,
  ChevronRight,
  Eye,
  Users,
  Folder,
  History,
  Phone,
} from 'lucide-react';
import { rfqService, Enquiry, RfqStats, DirectoryItem, Attachment } from '@/services/rfqService';
import { useNotification } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';

const STATUS_OPTIONS = ['Open', 'Incomplete', 'Under review', 'Verified', 'Approved', 'Offer Sent', 'PO Received', 'REGRET', 'Closed'];

const getTabFromUrl = (urlTab: string | null) => {
  if (!urlTab) return null;
  const norm = urlTab.toLowerCase();
  if (norm === 'underreview' || norm === 'review') return 'review';
  if (['all', 'active', 'incomplete', 'review', 'approved', 'offersent', 'unmapped', 'due', 'overdue'].includes(norm)) {
    return norm as any;
  }
  return null;
};

const getAgingDays = (dateStr?: string) => {
  if (!dateStr) return '0 days';
  const rec = new Date(dateStr);
  if (isNaN(rec.getTime())) return '0 days';
  const diffTime = Math.abs(Date.now() - rec.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
};

const getPageNumbers = (currentPage: number, totalPages: number): (number | string)[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, 4, '...', totalPages];
  }
  if (currentPage >= totalPages - 2) {
    return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
};

interface RfqTrackerClientProps {
  initialData?: any;
}

export default function RfqTrackerClient({ initialData }: RfqTrackerClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { showToast, showConfirm } = useNotification();
  const { user } = useAuth();
  const userRole = (user?.role || '').toUpperCase();
  const isFullAccessRole = ['ADMIN', 'CO', 'GM', 'PRODUCTION_HEAD', 'SALES_MARKETING'].includes(userRole);
  const canReview = ['ADMIN', 'CO', 'GM', 'PRODUCTION_HEAD'].includes(userRole);
  const canEdit = ['ADMIN', 'CO', 'GM', 'PRODUCTION_HEAD', 'SALES_MARKETING'].includes(userRole);
  const isTechnicalOnly = userRole === 'TECHNICAL_PERSON';

  const initialTab = getTabFromUrl(searchParams.get('tab')) || 'all';
  const initialSearch = searchParams.get('search') || '';
  const initialStatus = searchParams.get('status') || '';
  const initialAssignee = searchParams.get('assignedTo') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialLimit = parseInt(searchParams.get('limit') || '10', 10);

  // Main Enquiry Tracker filter & search state
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [assigneeFilter, setAssigneeFilter] = useState(initialAssignee);
  const [tabFilter, setTabFilter] = useState<'all' | 'active' | 'incomplete' | 'review' | 'approved' | 'offersent' | 'unmapped' | 'due' | 'overdue'>(initialTab);

  // Pagination state
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  // Helper to sync state changes to browser URL query parameters
  const updateUrlParams = (newParams: {
    tab?: string;
    search?: string;
    status?: string;
    assignedTo?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    const nextTab = newParams.tab !== undefined ? newParams.tab : tabFilter;
    const nextSearch = newParams.search !== undefined ? newParams.search : searchInput;
    const nextStatus = newParams.status !== undefined ? newParams.status : statusFilter;
    const nextAssignee = newParams.assignedTo !== undefined ? newParams.assignedTo : assigneeFilter;
    const nextPage = newParams.page !== undefined ? newParams.page : page;
    const nextLimit = newParams.limit !== undefined ? newParams.limit : limit;

    if (nextTab) params.set('tab', nextTab);
    else params.delete('tab');

    if (nextSearch && nextSearch.trim()) params.set('search', nextSearch.trim());
    else params.delete('search');

    if (nextStatus && nextStatus !== 'All Statuses') params.set('status', nextStatus);
    else params.delete('status');

    if (nextAssignee) params.set('assignedTo', nextAssignee);
    else params.delete('assignedTo');

    if (nextPage > 1) params.set('page', String(nextPage));
    else params.delete('page');

    if (nextLimit && nextLimit !== 10) params.set('limit', String(nextLimit));
    else params.delete('limit');

    const newQueryStr = params.toString();
    const currentQueryStr = searchParams.toString();
    if (newQueryStr !== currentQueryStr) {
      router.replace(`/rfq?${newQueryStr}`, { scroll: false });
    }
  };

  // Sync state when URL search parameters change (e.g. back/forward navigation or dashboard cards)
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    const urlSearch = searchParams.get('search') || '';
    const urlStatus = searchParams.get('status') || '';
    const urlAssignee = searchParams.get('assignedTo') || '';
    const urlPage = parseInt(searchParams.get('page') || '1', 10);
    const urlLimit = parseInt(searchParams.get('limit') || '10', 10);

    const matchedTab = getTabFromUrl(urlTab);
    if (matchedTab && matchedTab !== tabFilter) {
      setTabFilter(matchedTab);
    }
    if (urlSearch !== searchInput) {
      setSearchInput(urlSearch);
      setDebouncedSearch(urlSearch);
    }
    if (urlStatus !== statusFilter) {
      setStatusFilter(urlStatus);
    }
    if (urlAssignee !== assigneeFilter) {
      setAssigneeFilter(urlAssignee);
    }
    if (urlPage !== page) {
      setPage(urlPage);
    }
    if (urlLimit !== limit) {
      setLimit(urlLimit);
    }
  }, [searchParams]);

  // Debounce search input by 350ms and update URL
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
      updateUrlParams({ search: searchInput, page: 1 });
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const isDefaultState = page === 1 && limit === 10 && tabFilter === 'all' && !statusFilter && !assigneeFilter && !debouncedSearch;

  // React Query: Tracker Enquiries & Stats
  const trackerQuery = useQuery({
    queryKey: ['rfq-tracker', statusFilter, assigneeFilter, tabFilter, debouncedSearch, page, limit],
    queryFn: async () => {
      const params: any = { page, limit, tab: tabFilter };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (statusFilter && statusFilter !== 'All Statuses') params.status = statusFilter;
      if (assigneeFilter) params.assignedTo = assigneeFilter;

      const res = await rfqService.getEnquiries(params);
      if (!res.success) return { enquiries: [], pagination: null, stats: null };
      return { enquiries: res.data || [], pagination: res.pagination || null, stats: res.stats || null };
    },
    initialData: (isDefaultState && initialData)
      ? {
        enquiries: Array.isArray(initialData) ? initialData : (initialData.data || []),
        pagination: initialData.pagination || null,
        stats: initialData.stats || null,
      }
      : undefined,
    placeholderData: keepPreviousData,
  });

  const enquiries = trackerQuery.data?.enquiries || [];
  const pagination = trackerQuery.data?.pagination || null;
  const stats = trackerQuery.data?.stats || null;
  const loading = trackerQuery.isLoading;

  const fetchTrackerData = () => {
    queryClient.invalidateQueries({ queryKey: ['rfq-tracker'] });
  };
  const fetchOfferMappingData = () => {
    queryClient.invalidateQueries({ queryKey: ['offer-mapping'] });
  };

  // Quick Map Offer modal state
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerMappingTarget, setOfferMappingTarget] = useState<Enquiry | null>(null);
  const [offerNoInput, setOfferNoInput] = useState('');
  const [offerDateInput, setOfferDateInput] = useState('');

  // Inline Remark Edit State
  const [editingRemarkId, setEditingRemarkId] = useState<string | number | null>(null);
  const [editingRemarkValue, setEditingRemarkValue] = useState<string>('');

  // Follow-up & Remark History Modal State
  const [historyTargetEnquiry, setHistoryTargetEnquiry] = useState<Enquiry | null>(null);
  const [historyModalNote, setHistoryModalNote] = useState('');
  const [historyModalType, setHistoryModalType] = useState('Call');
  const [historyModalDate, setHistoryModalDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [historySaving, setHistorySaving] = useState(false);

  // Directory modal state
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [directoryItems, setDirectoryItems] = useState<DirectoryItem[]>([]);
  const [directorySaving, setDirectorySaving] = useState(false);

  // Import modal state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  // Email Sync state
  const [syncingInbox, setSyncingInbox] = useState(false);

  // Sync assigned users list for Assignee Filter dropdown
  const { data: directoryData } = useQuery({
    queryKey: ['staff-directory'],
    queryFn: async () => {
      const res = await rfqService.getDirectory();
      return res.data || [];
    },
    staleTime: 60000,
  });

  const staffUsers = useMemo(() => {
    if (!directoryData) return [];
    return directoryData.map((d: DirectoryItem) => d.name).filter(Boolean);
  }, [directoryData]);

  const handleOpenCreate = () => {
    router.push('/rfq/new');
  };

  const handleInlineAssigneeChange = async (id: string | number, newAssignee: string) => {
    try {
      await rfqService.inlineUpdateField(id, 'assignedTo', newAssignee);
      fetchTrackerData();
      showToast('Assignee Updated', 'Enquiry assignment saved', 'success');
    } catch (err: any) {
      showToast('Update Error', err?.response?.data?.message || err.message || 'Failed to update assignee', 'error');
    }
  };

  const handleInlineStatusChange = async (id: string | number, newStatus: string) => {
    try {
      await rfqService.inlineUpdateField(id, 'status', newStatus);
      fetchTrackerData();
      showToast('Status Updated', `Status changed to ${newStatus}`, 'success');
    } catch (err: any) {
      showToast('Update Error', err?.response?.data?.message || err.message || 'Failed to update status', 'error');
    }
  };

  const handleSaveInlineRemark = async (id: string | number) => {
    try {
      await rfqService.inlineUpdateField(id, 'remarks', editingRemarkValue);
      setEditingRemarkId(null);
      fetchTrackerData();
      showToast('Remark Saved', 'Enquiry remarks updated successfully', 'success');
    } catch (err: any) {
      showToast('Update Error', err?.response?.data?.message || err.message || 'Failed to update remarks', 'error');
    }
  };

  const handleSaveModalFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!historyTargetEnquiry || !historyModalNote.trim()) return;
    setHistorySaving(true);
    try {
      const res = await rfqService.addFollowup(historyTargetEnquiry.id, {
        type: historyModalType,
        note: historyModalNote.trim(),
        lastCallDate: historyModalDate,
      });
      fetchTrackerData();
      if (res.data) {
        setHistoryTargetEnquiry(res.data);
      }
      setHistoryModalNote('');
      showToast('Follow-up Recorded 📞', 'New follow-up entry logged with author info', 'success');
    } catch (err: any) {
      showToast('Error', err?.response?.data?.message || err.message || 'Failed to record follow-up', 'error');
    } finally {
      setHistorySaving(false);
    }
  };

  const handleOpenMapOfferModal = (enquiry: Enquiry) => {
    setOfferMappingTarget(enquiry);
    setOfferNoInput(enquiry.offerNo || '');
    setOfferDateInput(enquiry.offerDate || '');
    setIsOfferModalOpen(true);
  };

  const handleSaveOfferMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerMappingTarget) return;
    try {
      if (offerNoInput) {
        await rfqService.inlineUpdateField(offerMappingTarget.id, 'offerNo', offerNoInput);
      }
      if (offerDateInput) {
        await rfqService.inlineUpdateField(offerMappingTarget.id, 'offerDate', offerDateInput);
      }
      setIsOfferModalOpen(false);
      fetchTrackerData();
      showToast('Offer Mapped', 'Offer details linked successfully', 'success');
    } catch (err: any) {
      showToast('Mapping Error', err?.response?.data?.message || err.message || 'Failed to map offer', 'error');
    }
  };

  const handleDeleteEnquiry = (id: string | number) => {
    showConfirm({
      title: 'Delete Enquiry?',
      message: 'Are you sure you want to permanently delete this RFQ enquiry record?',
      confirmText: 'Delete RFQ',
      type: 'danger',
      onConfirm: async () => {
        try {
          await rfqService.deleteEnquiry(id);
          fetchTrackerData();
          showToast('RFQ Deleted', 'Enquiry record has been removed', 'info');
        } catch (err: any) {
          showToast('Delete Error', err?.response?.data?.message || err.message || 'Failed to delete enquiry', 'error');
        }
      },
    });
  };

  const handleOpenDirectory = async () => {
    try {
      const res = await rfqService.getDirectory();
      if (res.success) {
        setDirectoryItems(res.data.map((item: DirectoryItem) => ({ ...item, origName: item.name })));
        setIsDirectoryOpen(true);
      }
    } catch (err: any) {
      showToast('Directory Error', err?.response?.data?.message || err.message || 'Failed to load directory', 'error');
    }
  };

  const handleSaveDirectory = async () => {
    setDirectorySaving(true);
    try {
      await rfqService.saveDirectory(directoryItems);
      setIsDirectoryOpen(false);
      showToast('Directory Saved', 'Team directory saved successfully', 'success');
      fetchTrackerData();
    } catch (err: any) {
      showToast('Save Error', err?.response?.data?.message || err.message || 'Failed to save directory', 'error');
    } finally {
      setDirectorySaving(false);
    }
  };

  const handleImportExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    try {
      const res = await rfqService.importExcel(importFile);
      setIsImportOpen(false);
      setImportFile(null);
      showToast('Import Complete', res.message || 'Excel file imported successfully', 'success');
      fetchTrackerData();
    } catch (err: any) {
      showToast('Import Error', err?.response?.data?.message || err.message || 'Failed to import Excel file', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleSyncInbox = async () => {
    setSyncingInbox(true);
    try {
      const res = await rfqService.syncInbox();
      showToast('Email Sync Success', res.message || 'Customer emails processed into RFQs', 'success');
      fetchTrackerData();
    } catch (err: any) {
      showToast('Sync Error', err?.response?.data?.message || err.message || 'Failed to sync email inbox', 'error');
    } finally {
      setSyncingInbox(false);
    }
  };

  const handleExportCsv = () => {
    if (!enquiries || enquiries.length === 0) return;
    const headers = [
      'RFQ ID',
      'Date Received',
      'Type',
      'Company',
      'Contact',
      'Email',
      'Item Description',
      'Assigned To',
      'Remarks',
      'Status',
      'Offer No',
      'Offer Date',
      'Tentative Offer Date',
    ];
    const rows = (enquiries as Enquiry[]).map((e: Enquiry) => [
      `"${e.rfqId || ''}"`,
      `"${e.dateReceived || ''}"`,
      `"${e.type || ''}"`,
      `"${(e.companyName || '').replace(/"/g, '""')}"`,
      `"${(e.contactPerson || '').replace(/"/g, '""')}"`,
      `"${e.email || ''}"`,
      `"${(e.itemDescription || '').replace(/"/g, '""')}"`,
      `"${e.assignedTo || ''}"`,
      `"${(e.remarks || e.followupRemarks || e.pendingRemarks || '').replace(/"/g, '""')}"`,
      `"${e.status || ''}"`,
      `"${e.offerNo || ''}"`,
      `"${e.offerDate || ''}"`,
      `"${e.tentativeOfferDate || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `encon_rfqs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEnquiries = (enquiries as Enquiry[]).filter((e: Enquiry) => {
    if (!debouncedSearch || !debouncedSearch.trim()) return true;
    const q = debouncedSearch.trim().toLowerCase();
    return (
      (e.rfqId || '').toLowerCase().includes(q) ||
      (e.companyName || '').toLowerCase().includes(q) ||
      (e.itemDescription || '').toLowerCase().includes(q) ||
      (e.contactPerson || '').toLowerCase().includes(q) ||
      (e.email || '').toLowerCase().includes(q) ||
      (e.offerNo || '').toLowerCase().includes(q) ||
      (e.assignedTo || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-obsidian-900 via-slate-900 to-obsidian-950">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-thermal-500/10 text-thermal-400 border border-thermal-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              RFQ Tracker
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Unified RFQ lifecycle management, assignee workload, costing review, and offer tracking.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {canEdit && (
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> New Enquiry
              </button>
            )}
            <button
              onClick={handleOpenDirectory}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" /> Assignee Directory
            </button>
            {canEdit && (
              <button
                onClick={() => setIsImportOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
              >
                <Upload className="w-4 h-4 text-amber-400" /> Import Excel
              </button>
            )}
            <button
              onClick={handleSyncInbox}
              disabled={syncingInbox}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all disabled:opacity-50"
            >
              <Mail className={`w-4 h-4 text-cyan-400 ${syncingInbox ? 'animate-bounce' : ''}`} />
              {syncingInbox ? 'Syncing Email...' : 'Sync Email Inbox'}
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" /> Export CSV
          </button>
        </div>

        {/* Filters Toolbar with Notification Count Badges */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800 bg-obsidian-900 space-y-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800 text-xs font-semibold overflow-x-auto max-w-full custom-scrollbar whitespace-nowrap">
              {[
                { key: 'all', label: 'All Enquiries', count: stats?.total ?? enquiries.length },
                { key: 'incomplete', label: 'Incomplete Data', count: stats?.incompleteCount ?? 0 },
                { key: 'review', label: 'Under Review', count: stats?.underReview ?? 0 },
                { key: 'approved', label: 'Approved Costing', count: stats?.approvedCosting ?? 0 },
                { key: 'offersent', label: 'Offers Sent', count: stats?.offersSent ?? 0 },
                { key: 'unmapped', label: 'Unmapped Offers', count: stats?.unmappedOffers ?? 0 },
                { key: 'due', label: 'Due Today', count: stats?.dueToday ?? 0 },
                { key: 'overdue', label: 'Overdue TAT', count: stats?.overdueCount ?? 0 },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    const nextTab = tab.key as any;
                    setTabFilter(nextTab);
                    setPage(1);
                    updateUrlParams({ tab: nextTab, page: 1 });
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 ${tabFilter === tab.key
                    ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${tabFilter === tab.key
                        ? 'bg-white/20 text-white'
                        : tab.key === 'overdue'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : tab.key === 'review'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar & Assignee/Status Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by RFQ ID, Company Name, Contact, Email, Item, Offer No..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Assignee Filter Dropdown */}
              <select
                value={assigneeFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setAssigneeFilter(val);
                  setPage(1);
                  updateUrlParams({ assignedTo: val, page: 1 });
                }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 max-w-[160px]"
              >
                <option value="">All Assignees</option>
                {staffUsers.map((name: string) => (
                  <option key={name} value={name} className="bg-obsidian-900 text-white">
                    {name}
                  </option>
                ))}
              </select>

              {/* Status Filter Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setStatusFilter(val);
                  setPage(1);
                  updateUrlParams({ status: val, page: 1 });
                }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 max-w-[150px]"
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-obsidian-900 text-white">
                    {opt}
                  </option>
                ))}
              </select>

              {/* Reset Filters Button */}
              {!isDefaultState && (
                <button
                  onClick={() => {
                    setSearchInput('');
                    setDebouncedSearch('');
                    setStatusFilter('');
                    setAssigneeFilter('');
                    setTabFilter('all');
                    setPage(1);
                    router.replace('/rfq', { scroll: false });
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all whitespace-nowrap"
                  title="Reset All Filters"
                >
                  <X className="w-3.5 h-3.5" /> Reset Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* High Density Table View */}
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          {loading && enquiries.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-xs font-semibold">Loading ENCON Enquiries Database...</p>
            </div>
          ) : enquiries.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Folder className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Matching Enquiries Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No enquiry records match your current filter selection or search query.
              </p>
              {canEdit && (
                <button
                  onClick={handleOpenCreate}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md transition-all inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Create New RFQ
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">RFQ ID</th>
                    <th className="py-3 px-4">DATE RECD</th>
                    <th className="py-3 px-4">COMPANY</th>
                    <th className="py-3 px-4">ITEM DESCRIPTION</th>
                    <th className="py-3 px-4">TECHNICAL PERSON</th>
                    <th className="py-3 px-4">REMARKS</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4">AGING</th>
                    <th className="py-3 px-4">OFFER MAPPING</th>
                    <th className="py-3 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {enquiries.map((e: Enquiry) => (
                    <tr key={e.id} className="hover:bg-slate-800/40 transition-colors group">
                      {/* RFQ ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Link
                          href={`/rfq/${e.id}`}
                          className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold inline-flex items-center gap-1.5 hover:bg-amber-500/20 transition-colors"
                        >
                          <span>{e.rfqId || `ENC/RFQ/2026/${String(e.id).padStart(3, '0')}`}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </Link>
                      </td>

                      {/* DATE RECD */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 font-mono text-xs">
                        {e.dateReceived || e.receivedOn || 'N/A'}
                      </td>

                      {/* COMPANY */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white max-w-[200px] truncate" title={e.companyName}>
                          {e.companyName || 'Unnamed Customer'}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]" title={e.contactPerson}>
                          {e.contactPerson || e.email || 'N/A'}
                        </div>
                      </td>

                      {/* ITEM DESCRIPTION */}
                      <td className="py-3.5 px-4 max-w-[240px]">
                        <div className="text-slate-300 truncate font-medium text-xs" title={e.itemDescription}>
                          {e.itemDescription || 'No requirement description'}
                        </div>
                      </td>

                      {/* TECHNICAL PERSON */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 text-xs">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span className={e.assignedTo ? 'font-medium text-slate-200' : 'italic text-slate-500'}>
                            {e.assignedTo || 'Unassigned'}
                          </span>
                        </div>
                      </td>

                      {/* REMARKS */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        {editingRemarkId === e.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editingRemarkValue}
                              onChange={(evt) => setEditingRemarkValue(evt.target.value)}
                              onKeyDown={(evt) => {
                                if (evt.key === 'Enter') handleSaveInlineRemark(e.id);
                                if (evt.key === 'Escape') setEditingRemarkId(null);
                              }}
                              autoFocus
                              className="w-full bg-slate-950 border border-cyan-500 rounded px-2 py-1 text-xs text-white focus:outline-none"
                              placeholder="Enter remarks..."
                            />
                            <button
                              onClick={() => handleSaveInlineRemark(e.id)}
                              className="p-1 text-emerald-400 hover:text-emerald-300 rounded hover:bg-emerald-500/10 transition-colors"
                              title="Save Remark"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingRemarkId(null)}
                              className="p-1 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-500/10 transition-colors"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-1 group/remark">
                            <span
                              className={`text-slate-300 truncate text-xs ${canEdit ? 'cursor-pointer hover:text-white hover:underline' : ''}`}
                              title={e.remarks || e.followupRemarks || e.pendingRemarks || ''}
                              onClick={() => {
                                if (canEdit) {
                                  setEditingRemarkId(e.id);
                                  setEditingRemarkValue(e.remarks || e.followupRemarks || e.pendingRemarks || '');
                                }
                              }}
                            >
                              {e.remarks || e.followupRemarks || e.pendingRemarks || <span className="italic text-slate-500">—</span>}
                            </span>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover/remark:opacity-100 transition-opacity flex-shrink-0">
                              <button
                                onClick={(evt) => {
                                  evt.stopPropagation();
                                  setHistoryTargetEnquiry(e);
                                }}
                                className="p-1 text-slate-400 hover:text-cyan-400 rounded transition-colors"
                                title="View Remark & Follow-up History (Who wrote what)"
                              >
                                <History className="w-3 h-3 text-cyan-400" />
                              </button>
                              {canEdit && (
                                <button
                                  onClick={() => {
                                    setEditingRemarkId(e.id);
                                    setEditingRemarkValue(e.remarks || e.followupRemarks || e.pendingRemarks || '');
                                  }}
                                  className="p-1 text-slate-400 hover:text-cyan-400 rounded transition-colors"
                                  title="Edit Remark"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* STATUS */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5 ${e.status === 'Open'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : e.status === 'Incomplete'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : e.status === 'Under review'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : e.status === 'Verified'
                                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                                  : e.status === 'Approved'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : e.status === 'Offer Sent'
                                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                                      : e.status === 'PO Received'
                                        ? 'bg-green-500/10 text-green-300 border-green-500/30'
                                        : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {e.status || 'Open'}
                        </span>
                      </td>

                      {/* AGING */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono">
                          {getAgingDays(e.dateReceived || e.receivedOn || e.createdAt)}
                        </span>
                      </td>

                      {/* OFFER MAPPING */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {e.offerNo ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 font-mono text-xs font-bold">
                            <span>{e.offerNo}</span>
                            <button onClick={() => handleOpenMapOfferModal(e)} className="text-purple-400 hover:text-white" title="Edit Offer Mapping">
                              <Edit className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenMapOfferModal(e)}
                            className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold inline-flex items-center gap-1 transition-all"
                          >
                            <Plus className="w-3 h-3 text-cyan-400" /> Map Offer
                          </button>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {e.driveFolderUrl && (
                            <a
                              href={e.driveFolderUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              title="Open Google Drive Folder"
                            >
                              <Folder className="w-4 h-4" />
                            </a>
                          )}
                          <Link
                            href={`/rfq/${e.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Inspect Workstation"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {canEdit && (
                            <button
                              onClick={() => handleDeleteEnquiry(e.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete Enquiry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {pagination && (() => {
            const activePage = pagination.page || 1;
            const activeLimit = pagination.limit || limit;
            const totalCount = pagination.total || 0;
            const startItem = totalCount === 0 ? 0 : ((activePage - 1) * activeLimit) + 1;
            const endItem = Math.min(activePage * activeLimit, totalCount);

            return (
              <div className="p-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 text-xs text-slate-400">
                <div>
                  Showing <span className="font-bold text-white font-mono">{startItem}</span> to{' '}
                  <span className="font-bold text-white font-mono">{endItem}</span> of{' '}
                  <span className="font-bold text-cyan-400 font-mono">{totalCount}</span> enquiries
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span>Per page:</span>
                    <select
                      value={limit}
                      onChange={(evt) => {
                        const newLimit = Number(evt.target.value);
                        setLimit(newLimit);
                        setPage(1);
                        updateUrlParams({ page: 1, limit: newLimit });
                      }}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      disabled={!pagination.hasPrevPage}
                      onClick={() => {
                        const p = activePage - 1;
                        setPage(p);
                        updateUrlParams({ page: p });
                      }}
                      className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-800 text-white font-bold"
                    >
                      Previous
                    </button>

                    {getPageNumbers(activePage, pagination.totalPages).map((item, idx) => {
                      if (typeof item === 'string') {
                        return (
                          <span key={`ellipsis-${idx}`} className="px-1.5 py-1 text-slate-600 font-mono select-none">
                            ...
                          </span>
                        );
                      }
                      const pageNum = item;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setPage(pageNum);
                            updateUrlParams({ page: pageNum });
                          }}
                          className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition-all ${activePage === pageNum
                            ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                            : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      disabled={!pagination.hasNextPage}
                      onClick={() => {
                        const p = activePage + 1;
                        setPage(p);
                        updateUrlParams({ page: p });
                      }}
                      className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-800 text-white font-bold"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* QUICK MAP OFFER MODAL */}
      {isOfferModalOpen && offerMappingTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card bg-obsidian-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-cyan-400" /> Map Offer Document to RFQ #{offerMappingTarget.rfqId || offerMappingTarget.id}
              </h3>
              <button onClick={() => setIsOfferModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveOfferMapping} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Offer Document Number</label>
                <input
                  type="text"
                  placeholder="e.g. ENC/OFR/2026/044"
                  value={offerNoInput}
                  onChange={(e) => setOfferNoInput(e.target.value)}
                  className="w-full bg-slate-950 border border-indigo-900/80 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Offer Date</label>
                <input
                  type="date"
                  value={offerDateInput}
                  onChange={(e) => setOfferDateInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsOfferModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-all">
                  Save Offer Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGNEE DIRECTORY MODAL */}
      {isDirectoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card bg-obsidian-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" /> Team Assignees (User Management)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Synchronized with registered users in User Management DB.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDirectoryOpen(false);
                    router.push('/users');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all flex items-center gap-1"
                >
                  <Users className="w-3.5 h-3.5" /> Open User Mgmt
                </button>
                <button onClick={() => setIsDirectoryOpen(false)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
              {directoryItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <input
                    type="text"
                    placeholder="Name"
                    value={item.name}
                    onChange={(e) => {
                      const updated = [...directoryItems];
                      updated[idx].name = e.target.value;
                      setDirectoryItems(updated);
                    }}
                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <input
                    type="email"
                    placeholder="email@encon.in"
                    value={item.email}
                    onChange={(e) => {
                      const updated = [...directoryItems];
                      updated[idx].email = e.target.value;
                      setDirectoryItems(updated);
                    }}
                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDirectoryItems([...directoryItems, { name: '', email: '' }])}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700"
              >
                + Add Member
              </button>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setIsDirectoryOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white">
                  Cancel
                </button>
                <button onClick={handleSaveDirectory} disabled={directorySaving} className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-all">
                  {directorySaving ? 'Saving...' : 'Save Directory'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT EXCEL MODAL */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card bg-obsidian-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-400" /> Import Enquiries from Excel
              </h3>
              <button onClick={() => setIsImportOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload an Excel (.xlsx) file matching company spreadsheet headers.
            </p>
            <form onSubmit={handleImportExcel} className="space-y-4 pt-2">
              <input
                type="file"
                accept=".xlsx, .xls"
                required
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="text-xs text-slate-300 block w-full file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-amber-400 hover:file:bg-slate-700"
              />
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsImportOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white">
                  Cancel
                </button>
                <button type="submit" disabled={importing} className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-all">
                  {importing ? 'Importing...' : 'Upload & Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOLLOW-UP & REMARK HISTORY MODAL */}
      {historyTargetEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card bg-obsidian-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  Follow-up & Remarks History — {historyTargetEnquiry.rfqId || `RFQ #${historyTargetEnquiry.id}`}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {historyTargetEnquiry.companyName} {historyTargetEnquiry.contactPerson ? `· ${historyTargetEnquiry.contactPerson}` : ''}
                </p>
              </div>
              <button onClick={() => setHistoryTargetEnquiry(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Add Form */}
            {canEdit && (
              <form onSubmit={handleSaveModalFollowup} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-300">Quick Log New Follow-up:</span>
                  <div className="flex items-center gap-1">
                    {['Call', 'Followup', 'Email', 'Meeting', 'Remark'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setHistoryModalType(t)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${historyModalType === t
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder={`Enter ${historyModalType.toLowerCase()} discussion details...`}
                    value={historyModalNote}
                    onChange={(e) => setHistoryModalNote(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={historySaving}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs whitespace-nowrap"
                  >
                    {historySaving ? 'Saving...' : 'Add Log'}
                  </button>
                </div>
              </form>
            )}

            {/* Timeline Log List */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Log History (Who wrote what & when)
              </label>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-72 overflow-y-auto space-y-2.5 custom-scrollbar">
                {(() => {
                  const items = Array.isArray(historyTargetEnquiry.followups) && historyTargetEnquiry.followups.length > 0
                    ? [...historyTargetEnquiry.followups].reverse()
                    : (historyTargetEnquiry.followupRemarks || historyTargetEnquiry.remarks || '')
                      .split(/\n\n+/)
                      .filter(Boolean)
                      .map((raw, idx) => ({
                        _id: `legacy-${idx}`,
                        type: 'Remark',
                        note: raw.trim(),
                        author: historyTargetEnquiry.assignedTo || 'Team Member',
                        createdAt: historyTargetEnquiry.dateReceived || '',
                      }));

                  if (items.length === 0) {
                    return (
                      <div className="p-4 text-center text-xs text-slate-500 italic">
                        No follow-up remarks recorded yet for this RFQ.
                      </div>
                    );
                  }

                  return items.map((entry: any, idx: number) => {
                    const typeLabel = entry.type || 'Remark';
                    const formattedDate = entry.createdAt
                      ? (isNaN(new Date(entry.createdAt).getTime()) ? entry.createdAt : new Date(entry.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }))
                      : 'N/A';

                    return (
                      <div key={entry._id || entry.id || idx} className="p-3 bg-obsidian-900 rounded-xl border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1 text-[11px]">
                          <div className="flex items-center gap-1.5 font-bold text-white">
                            <span className="px-1.5 py-0.2 text-[9px] rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                              {typeLabel}
                            </span>
                            <UserCheck className="w-3 h-3 text-cyan-400" />
                            <span>{entry.author || 'User'}</span>
                          </div>
                          <span className="font-mono text-slate-400">{formattedDate}</span>
                        </div>
                        <div className="text-xs text-slate-200 leading-relaxed pt-1 whitespace-pre-wrap">
                          {entry.note}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setHistoryTargetEnquiry(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
