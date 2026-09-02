'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { rfqService, Enquiry, Attachment } from '@/services/rfqService';
import { useNotification } from '@/context/NotificationContext';
import {
  CheckSquare,
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  FileText,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  Send,
  XCircle,
  Download,
  Eye,
  Layers,
  Calculator,
  Calendar,
  Folder,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useNotification();
  const { user } = useAuth();
  const userRole = (user?.role || '').toUpperCase();
  const canReview = ['ADMIN', 'CO', 'GM', 'PRODUCTION_HEAD'].includes(userRole);

  React.useEffect(() => {
    if (user && !canReview) {
      showToast('Access Denied', 'You do not have permission to review RFQs.', 'error');
      router.push('/rfq');
    }
  }, [user, canReview, router, showToast]);

  const enquiryId = params?.id ? (params.id as string) : null;

  const [offerNo, setOfferNo] = useState('');
  const [offerDate, setOfferDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ src: string; filename: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['review-enquiry', enquiryId],
    queryFn: async () => {
      if (!enquiryId) return null;
      const res = await rfqService.getEnquiryById(enquiryId);
      return res.data || null;
    },
    enabled: !!enquiryId,
  });

  const enquiry: Enquiry | null = data;

  const getAttachmentUrl = (attId: string | number, isDownload = false) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const dlParam = isDownload ? '?dl=1' : '';
    return `${baseUrl}/rfq/attachments/${attId}${dlParam}`;
  };

  const questionnaireFiles = useMemo(() => {
    if (!enquiry?.attachments) return [];
    return enquiry.attachments.filter(
      (a: Attachment) =>
        (a.kind && (a.kind.toLowerCase() === 'questionnaire' || a.kind.toLowerCase() === 'client_docs')) ||
        a.filename.toLowerCase().includes('questionnaire') ||
        a.filename.toLowerCase().includes('rfq') ||
        a.filename.toLowerCase().includes('spec') ||
        a.filename.toLowerCase().includes('req')
    );
  }, [enquiry?.attachments]);

  const technicalFiles = useMemo(() => {
    if (!enquiry?.attachments) return [];
    return enquiry.attachments.filter(
      (a: Attachment) =>
        (a.kind && a.kind.toLowerCase() === 'technical') ||
        a.filename.toLowerCase().includes('technical') ||
        a.filename.toLowerCase().includes('calc') ||
        a.filename.toLowerCase().includes('drawing') ||
        a.filename.toLowerCase().includes('design') ||
        a.filename.toLowerCase().includes('eng')
    );
  }, [enquiry?.attachments]);

  const costingFiles = useMemo(() => {
    if (!enquiry?.attachments) return [];
    return enquiry.attachments.filter(
      (a: Attachment) =>
        (a.kind && a.kind.toLowerCase() === 'costing') ||
        a.filename.toLowerCase().includes('costing') ||
        a.filename.toLowerCase().includes('cost') ||
        a.filename.toLowerCase().includes('price') ||
        a.filename.toLowerCase().includes('estimate')
    );
  }, [enquiry?.attachments]);

  const offerFiles = useMemo(() => {
    if (!enquiry?.attachments) return [];
    return enquiry.attachments.filter(
      (a: Attachment) =>
        (a.kind && a.kind.toLowerCase() === 'offer') ||
        a.filename.toLowerCase().includes('offer') ||
        a.filename.toLowerCase().includes('quote') ||
        a.filename.toLowerCase().includes('proposal')
    );
  }, [enquiry?.attachments]);

  const handleVerify = async () => {
    if (!enquiryId) return;
    setSubmitting(true);
    try {
      await rfqService.verifyReview(enquiryId, { remarks });

      queryClient.invalidateQueries({ queryKey: ['review-enquiry', enquiryId] });
      queryClient.invalidateQueries({ queryKey: ['all-review-enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['rfq-tracker'] });

      showToast('Costing Verified 🎯', `Costing for RFQ ${enquiry?.rfqId} verified and recommended for final Admin approval.`, 'success');
      router.push('/review');
    } catch (err: any) {
      showToast('Verification Failed', err.message || 'Failed to verify review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalApprove = async () => {
    if (!enquiryId) return;
    setSubmitting(true);
    try {
      await rfqService.approveReview(enquiryId, {
        offerNo: offerNo || enquiry?.offerNo || enquiry?.clientRefNo || '',
        offerDate: offerDate || enquiry?.offerDate || new Date().toISOString().split('T')[0],
        remarks,
        statusAction: 'APPROVE',
      });

      queryClient.invalidateQueries({ queryKey: ['review-enquiry', enquiryId] });
      queryClient.invalidateQueries({ queryKey: ['all-review-enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['rfq-tracker'] });

      showToast('Final Approval Granted 🚀', `Costing for RFQ ${enquiry?.rfqId} approved by Admin! Ready for client dispatch.`, 'success');
      router.push('/review');
    } catch (err: any) {
      showToast('Approval Failed', err.message || 'Failed to approve review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!enquiryId) return;
    if (!remarks.trim()) {
      showToast('Remarks Required', 'Please enter feedback remarks for requesting changes.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await rfqService.approveReview(enquiryId, {
        remarks,
        statusAction: 'REQUEST_CHANGES',
      });

      queryClient.invalidateQueries({ queryKey: ['review-enquiry', enquiryId] });
      queryClient.invalidateQueries({ queryKey: ['all-review-enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['rfq-tracker'] });

      showToast('Changes Requested ↩️', `Enquiry #${enquiry?.rfqId} sent back to Open for revision.`, 'info');
      router.push('/review');
    } catch (err: any) {
      showToast('Action Failed', err.message || 'Failed to request changes', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !enquiry) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3">
        <CheckSquare className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
        <p className="text-sm font-semibold">Loading Review Workstation...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* NAVIGATION & TOP HEADER */}
      <div className="flex items-center justify-between glass-card p-3 rounded-2xl border border-slate-800">
        <button
          type="button"
          onClick={() => router.push('/review')}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Reviews
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              if (!enquiryId) return;
              try {
                if (enquiry.driveFolderUrl) {
                  window.open(enquiry.driveFolderUrl, '_blank');
                } else {
                  showToast('Drive Setup', 'Opening Google Drive RFQ folder...', 'info');
                  const res = await rfqService.openDriveFolder(enquiryId);
                  if (res.driveFolderUrl) {
                    window.open(res.driveFolderUrl, '_blank');
                    queryClient.invalidateQueries({ queryKey: ['review-enquiry', enquiryId] });
                  } else {
                    showToast('Drive Setup Required', 'Google Drive credentials not configured in backend/.env', 'warning');
                  }
                }
              } catch (err: any) {
                showToast('Drive Error', err.message || 'Failed to open Drive folder', 'error');
              }
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 shadow-sm transition-all flex items-center gap-1.5"
            title="Open Google Drive folder for this RFQ"
          >
            <Folder className="w-3.5 h-3.5 text-emerald-400" /> Open Drive ↗
          </button>

          <span className="text-xs font-mono font-bold text-thermal-400 bg-thermal-500/10 px-2.5 py-1 rounded-xl border border-thermal-500/20">
            {enquiry.rfqId}
          </span>
          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Status: {enquiry.status}
          </span>
        </div>
      </div>

      {/* 4-COLUMN WORKSTATION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-stretch">
        {/* ITEM 1: ENQUIRY DETAILS */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-thermal-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4" /> 1. Customer Details
              </h3>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Company Name</label>
                <p className="font-bold text-white text-sm">{enquiry.companyName || 'N/A'}</p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Person</label>
                <p className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> {enquiry.contactPerson || 'N/A'}
                </p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Email & Phone</label>
                <p className="text-slate-300 flex items-center gap-1 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {enquiry.email || 'N/A'}
                </p>
                {enquiry.mobile && (
                  <p className="text-slate-300 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {enquiry.mobile}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Item Requirement</label>
                <p className="text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
                  {enquiry.itemDescription || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ITEM 2: FILLED QUESTIONNAIRE / RFQ DOCUMENT */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-thermal-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> 2. Questionnaire / RFQ
              </h3>
              {questionnaireFiles.length > 0 || enquiry.emailBody ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Uploaded Questionnaire File</label>
              {questionnaireFiles.length > 0 ? (
                <div className="space-y-1.5">
                  {questionnaireFiles.map((att) => (
                    <a
                      key={att.id}
                      href={getAttachmentUrl(att.id, true)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-thermal-500 text-slate-200 flex items-center justify-between transition-all"
                    >
                      <span className="truncate max-w-[140px] font-semibold">{att.filename}</span>
                      <Download className="w-3.5 h-3.5 text-thermal-400" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic text-[11px]">No separate questionnaire file uploaded.</p>
              )}

              {enquiry.emailBody && (
                <div className="mt-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Email Body</label>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 max-h-48 overflow-y-auto custom-scrollbar text-[11px] text-slate-300 leading-relaxed">
                    <div dangerouslySetInnerHTML={{ __html: enquiry.emailBody }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ITEM 3: TECHNICAL CALCULATIONS */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-thermal-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4" /> 3. Technical Calculation
              </h3>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Automation App Sync</label>
                <p className="font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                  <Layers className="w-3.5 h-3.5" /> {enquiry.isMappedToOffer ? 'Offer Mapped in Automation' : 'Pulled & Verified'}
                </p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Technical Parameters</label>
                <p className="text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
                  {enquiry.technical || 'Heat Exchanger / Recuperator Technical Specs Verified.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ITEM 4: COSTING & OFFER DOCUMENTS */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-thermal-400 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-4 h-4" /> 4. Costing & Offer Files
              </h3>
              {costingFiles.length > 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Costing Documents ({costingFiles.length})</label>
                {costingFiles.length > 0 ? (
                  <div className="space-y-1 mt-1">
                    {costingFiles.map((att) => (
                      <a
                        key={att.id}
                        href={getAttachmentUrl(att.id, true)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-thermal-500 text-slate-200 flex items-center justify-between transition-all"
                      >
                        <span className="truncate max-w-[140px] font-semibold">{att.filename}</span>
                        <Download className="w-3.5 h-3.5 text-thermal-400" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-[11px] mt-1">No costing document attached.</p>
                )}
              </div>

              <div className="pt-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Generated Offer Files ({offerFiles.length})</label>
                {offerFiles.length > 0 ? (
                  <div className="space-y-1 mt-1">
                    {offerFiles.map((att) => (
                      <a
                        key={att.id}
                        href={getAttachmentUrl(att.id, true)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-thermal-500 text-slate-200 flex items-center justify-between transition-all"
                      >
                        <span className="truncate max-w-[140px] font-semibold text-emerald-400">{att.filename}</span>
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-[11px] mt-1">Offer PDF to be registered upon approval.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ADMIN & MANAGEMENT DECISION & APPROVAL PANEL */}
      {enquiry.status === 'Under review' || enquiry.status === 'Verified' ? (
        <div className="glass-card p-4 rounded-2xl border border-slate-800 shadow-2xl space-y-3">
          <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-thermal-400" /> Multi-User Review & Admin Final Approval
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Reviewers (GM, CO, Production) can verify and recommend. <strong>Only Admin can give Final Approval</strong> to dispatch offer to client.
              </p>
            </div>
            {enquiry.status === 'Verified' && (
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                🎯 Verified by {enquiry.verifiedBy || 'Reviewer'} • Awaiting Admin Approval
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-300">Offer Reference Number (Final Admin Override)</label>
              <input
                type="text"
                placeholder={enquiry.offerNo || 'e.g. ENCON.04026.278/FBD/NK'}
                value={offerNo}
                onChange={(e) => setOfferNo(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-thermal-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300">Offer Date</label>
              <input
                type="date"
                value={offerDate}
                onChange={(e) => setOfferDate(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-thermal-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300">Review Remarks / Verification Note</label>
              <input
                type="text"
                placeholder="e.g. Technical costing checked & verified. Recommended for release."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-thermal-500"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={submitting}
              onClick={handleRequestChanges}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
            >
              <XCircle className="w-3.5 h-3.5" /> Request Changes / Reject
            </button>

            {/* Level 1: Verify & Recommend Button (Available for GM, CO, Production, Admin) */}
            {enquiry.status !== 'Verified' && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleVerify}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> {submitting ? 'Verifying...' : 'Verify & Recommend'}
              </button>
            )}

            {/* Level 2: Final Approve Button (STRICTLY ADMIN ONLY) */}
            {userRole === 'ADMIN' ? (
              <button
                type="button"
                disabled={submitting}
                onClick={handleFinalApprove}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> {submitting ? 'Granting Final Approval...' : 'Final Approve Offer (Admin)'}
              </button>
            ) : (
              <div className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Final Approval restricted to Admin</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                ✅ RFQ Approved & Offer Released
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                This RFQ has been reviewed and approved by Management. Offer Reference: <strong>{enquiry.offerNo || 'Pending Offer Mapping'}</strong> | Offer Date: <strong>{enquiry.offerDate || 'N/A'}</strong>
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {enquiry.status}
          </span>
        </div>
      )}
    </div>
  );
}
