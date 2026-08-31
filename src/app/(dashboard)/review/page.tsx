'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { rfqService, Enquiry } from '@/services/rfqService';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import {
  CheckSquare,
  Search,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Send,
  UserCheck,
} from 'lucide-react';

export default function ReviewDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useNotification();
  const userRole = (user?.role || '').toUpperCase();
  const canReview = ['ADMIN', 'CO', 'GM', 'PRODUCTION_HEAD'].includes(userRole);

  useEffect(() => {
    if (user && !canReview) {
      showToast('Access Denied', 'You do not have permission to review RFQs.', 'error');
      router.push('/rfq');
    }
  }, [user, canReview, router, showToast]);

  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState<'pending' | 'approved'>('pending');

  const { data, isLoading } = useQuery({
    queryKey: ['all-review-enquiries'],
    queryFn: async () => {
      const res = await rfqService.getEnquiries({ tab: 'review' });
      return res.data || [];
    },
  });

  const allEnquiries: Enquiry[] = data || [];

  // Includes both 'Under review' and 'Verified' items awaiting Final Admin Approval
  const pendingEnquiries = useMemo(
    () =>
      allEnquiries.filter((e) => {
        const s = (e.status || '').toLowerCase();
        return s === 'under review' || s === 'verified';
      }),
    [allEnquiries]
  );

  const approvedEnquiries = useMemo(
    () =>
      allEnquiries.filter((e) => {
        const s = (e.status || '').toLowerCase();
        return s === 'approved' || s === 'offer sent' || s === 'po received';
      }),
    [allEnquiries]
  );

  const activeList = useMemo(() => {
    const list = tab === 'pending' ? pendingEnquiries : approvedEnquiries;

    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(
      (e) =>
        e.companyName.toLowerCase().includes(q) ||
        e.rfqId.toLowerCase().includes(q) ||
        e.itemDescription.toLowerCase().includes(q) ||
        (e.contactPerson && e.contactPerson.toLowerCase().includes(q))
    );
  }, [tab, pendingEnquiries, approvedEnquiries, searchTerm]);

  return (
    <div className="space-y-4">
      {/* BRAND CONSTANT TOP HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 glass-card p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-thermal-500/10 border border-thermal-500/30 text-thermal-400">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Admin Review Portal</h1>
            <p className="text-[11px] text-slate-400">
              Inspect 4-item checklist, verify calculations, and grant final approval for offer release
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* SEARCH BAR */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-thermal-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* BRAND TAB NAVIGATION */}
      <div className="flex items-center justify-between gap-3 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTab('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === 'pending'
                ? 'bg-thermal-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pending Review & Approval
            <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-slate-900 text-thermal-400 border border-thermal-500/30 font-extrabold">
              {pendingEnquiries.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab('approved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === 'approved'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Approved Offers
            <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-slate-900 text-slate-300 font-extrabold">
              {approvedEnquiries.length}
            </span>
          </button>
        </div>
      </div>

      {/* HIGH-DENSITY REVIEW TABLE WITH BRAND COLOR SCHEME */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <Clock className="w-6 h-6 text-thermal-500 animate-spin mx-auto" />
            <p className="text-xs font-semibold">Loading reviews list...</p>
          </div>
        ) : activeList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Items in this Tab</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {tab === 'pending'
                ? 'There are currently no pending reviews waiting for verification or approval.'
                : 'No approved offer records found matching your filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">RFQ ID</th>
                  <th className="py-3 px-4">Company & Contact</th>
                  <th className="py-3 px-4">Item Requirement</th>
                  <th className="py-3 px-4">Received Date</th>
                  <th className="py-3 px-4 text-center">4-Item Checklist</th>
                  <th className="py-3 px-4 text-center">Approval Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {activeList.map((enquiry) => {
                  const hasQuestionnaire =
                    enquiry.attachments?.some((a) => a.kind === 'questionnaire' || a.filename.toLowerCase().includes('questionnaire')) ||
                    Boolean(enquiry.emailBody);
                  const hasCosting =
                    enquiry.attachments?.some((a) => a.kind === 'costing' || a.filename.toLowerCase().includes('costing')) ||
                    Boolean(enquiry.costing);

                  const st = (enquiry.status || '').toLowerCase();

                  return (
                    <tr
                      key={enquiry.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* RFQ ID */}
                      <td className="py-3 px-4 font-mono font-bold text-thermal-400">
                        <span className="bg-thermal-500/10 px-2 py-1 rounded-md border border-thermal-500/20 whitespace-nowrap">
                          {enquiry.rfqId || `RFQ #${enquiry.id}`}
                        </span>
                      </td>

                      {/* COMPANY & CONTACT */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white max-w-[180px] truncate" title={enquiry.companyName}>
                          {enquiry.companyName || 'Unnamed Customer'}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate" title={enquiry.contactPerson}>
                          {enquiry.contactPerson || 'N/A'}
                        </div>
                      </td>

                      {/* ITEM DESCRIPTION */}
                      <td className="py-3 px-4 max-w-[220px]">
                        <div className="text-slate-300 truncate font-medium" title={enquiry.itemDescription}>
                          {enquiry.itemDescription || 'No requirement description'}
                        </div>
                      </td>

                      {/* RECEIVED DATE */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{enquiry.dateReceived || enquiry.receivedOn || 'N/A'}</span>
                        </div>
                      </td>

                      {/* 4-ITEM CHECKLIST ICONS */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2 text-[11px]">
                          {/* 1. Details */}
                          <span className="flex items-center gap-0.5 text-slate-300" title="1. Customer Info: Complete">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> <span className="text-[10px]">Info</span>
                          </span>

                          {/* 2. Questionnaire */}
                          <span
                            className="flex items-center gap-0.5 text-slate-300"
                            title={hasQuestionnaire ? '2. Questionnaire: Attached' : '2. Questionnaire: Missing'}
                          >
                            {hasQuestionnaire ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />}
                            <span className="text-[10px]">RFQ</span>
                          </span>

                          {/* 3. Tech Calc */}
                          <span className="flex items-center gap-0.5 text-slate-300" title="3. Technical Calculation: Pulled">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> <span className="text-[10px]">Calc</span>
                          </span>

                          {/* 4. Costing */}
                          <span
                            className="flex items-center gap-0.5 text-slate-300"
                            title={hasCosting ? '4. Costing: Attached' : '4. Costing: Missing'}
                          >
                            {hasCosting ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />}
                            <span className="text-[10px]">Costing</span>
                          </span>
                        </div>
                      </td>

                      {/* STATUS BADGE */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {st === 'approved' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Approved
                          </span>
                        ) : st === 'verified' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 inline-flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-purple-400" /> Verified by {enquiry.verifiedBy || 'Reviewer'}
                          </span>
                        ) : st === 'offer sent' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 inline-flex items-center gap-1">
                            <Send className="w-3 h-3 text-indigo-400" /> Offer Sent
                          </span>
                        ) : st === 'po received' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-cyan-400" /> PO Received
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" /> Under Review
                          </span>
                        )}
                      </td>

                      {/* ACTION BUTTON */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/review/${enquiry.id}`}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 shadow-md ${
                            st === 'verified'
                              ? 'bg-purple-600 hover:bg-purple-500 text-white'
                              : 'bg-thermal-500 hover:bg-thermal-600 text-white'
                          }`}
                        >
                          {st === 'verified' ? 'Admin Final Sign-off' : 'Inspect Workstation'} <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
