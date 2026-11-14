'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  ExternalLink,
  Layers,
  CheckCircle2,
  Upload,
  AlertCircle,
  FileCheck,
  Send,
  X,
  Paperclip,
  ShieldCheck,
  CreditCard,
  Building,
  Check,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import {
  fetchActiveContract,
  approveMilestoneDeliverable,
  submitMilestoneDeliverable,
  reportMilestonePayment,
  acknowledgeMilestonePayment,
  disputeMilestonePayment,
  uploadFile,
  getAuthUser,
} from '@/lib/api';

export const WorkspaceView: React.FC = () => {
  const [activeMilestoneNum, setActiveMilestoneNum] = useState(1);
  const [contractData, setContractData] = useState<{
    contract: any;
    milestones: any[];
    paymentRecords?: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Deliverable Submission Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isUploadingDeliverable, setIsUploadingDeliverable] = useState(false);
  const [deliverableNotes, setDeliverableNotes] = useState('');
  const [deliverableFileName, setDeliverableFileName] = useState('Deliverable_Handover_Bundle.zip');

  // Record Payment Modal State (Client)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'upi' | 'razorpay_direct' | 'stripe_direct' | 'paypal' | 'other'>('bank_transfer');
  const [externalReference, setExternalReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [receiptFileUrl, setReceiptFileUrl] = useState('');

  // Dispute Modal State
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentUser = getAuthUser();
  const isClient = currentUser?.role === 'client';

  const loadContract = async () => {
    setIsLoading(true);
    try {
      const data = await fetchActiveContract();
      if (data && data.contract && data.milestones && data.milestones.length > 0) {
        setContractData(data);
      } else {
        setContractData(null);
      }
    } catch {
      setContractData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContract();
  }, []);

  if (isLoading) {
    return (
      <div className="floxa-card py-16 text-center text-slate-500">
        <div className="inline-block animate-spin w-6 h-6 border-2 border-[#0084ff] border-t-transparent rounded-full mb-3" />
        <div className="text-xs font-medium">Loading live milestone contract from database...</div>
      </div>
    );
  }

  if (!contractData || !contractData.contract) {
    return (
      <div className="floxa-card py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#0084ff]/10 border border-[#0084ff]/25 flex items-center justify-center mx-auto text-[#0084ff]">
          <Layers size={26} />
        </div>
        <div className="max-w-md mx-auto space-y-1.5">
          <h3 className="text-base font-bold text-slate-900">No Active Milestone Contract</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-normal">
            Contracts are initialized when a client accepts a Mini-Discovery proposal and both parties sign the digital project agreement.
          </p>
        </div>
      </div>
    );
  }

  const { contract, milestones, paymentRecords = [] } = contractData;
  const brief = contract.briefId || {};
  const clientInfo = contract.clientId || {};
  const freelancerInfo = contract.freelancerId || {};

  const currentMilestone =
    milestones.find((m: any) => m.milestoneNumber === activeMilestoneNum) || milestones[0];

  const deliverableStatus = currentMilestone?.deliverableStatus || (currentMilestone?.escrowState === 'released' ? 'approved' : currentMilestone?.escrowState === 'in_review' ? 'in_review' : 'in_progress');
  const paymentStatus = currentMilestone?.paymentStatus || (currentMilestone?.escrowState === 'released' ? 'acknowledged_by_freelancer' : 'not_recorded');

  const isDeliverableApproved = deliverableStatus === 'approved';
  const isDeliverableInReview = deliverableStatus === 'in_review';
  const isPaymentReported = paymentStatus === 'reported_by_client';
  const isPaymentAcknowledged = paymentStatus === 'acknowledged_by_freelancer';
  const isPaymentDisputed = paymentStatus === 'disputed';

  // 1. Deliverable Handover Submission
  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMilestone) return;
    try {
      await submitMilestoneDeliverable(currentMilestone._id || currentMilestone.id, {
        fileUrls: [deliverableFileName],
        notes: deliverableNotes || 'Handover deliverables uploaded for client review.',
      });
      setIsSubmitModalOpen(false);
      setDeliverableNotes('');
      setActionMessage({
        type: 'success',
        text: `Deliverable for Milestone ${currentMilestone.milestoneNumber} submitted! Client inspection window open.`,
      });
      await loadContract();
    } catch (err: any) {
      alert(err.message || 'Failed to submit deliverable');
    }
  };

  // 2. Deliverable Approval by Client
  const handleApproveDeliverable = async () => {
    if (!currentMilestone) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      await approveMilestoneDeliverable(currentMilestone._id || currentMilestone.id);
      setActionMessage({
        type: 'success',
        text: `Milestone ${currentMilestone.milestoneNumber} deliverable approved! You can now arrange direct payment with the freelancer.`,
      });
      await loadContract();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to approve deliverable',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Client Reports Direct Payment
  const handleReportPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMilestone) return;
    setIsProcessing(true);
    try {
      await reportMilestonePayment(currentMilestone._id || currentMilestone.id, {
        paymentMethod,
        externalReference,
        notes: paymentNotes,
        receiptFileUrl,
      });
      setIsPaymentModalOpen(false);
      setExternalReference('');
      setPaymentNotes('');
      setReceiptFileUrl('');
      setActionMessage({
        type: 'success',
        text: `Direct payment reported for Milestone ${currentMilestone.milestoneNumber}. Freelancer notified to acknowledge receipt.`,
      });
      await loadContract();
    } catch (err: any) {
      alert(err.message || 'Failed to record payment');
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Freelancer Acknowledges Direct Payment
  const handleAcknowledgePayment = async () => {
    if (!currentMilestone) return;
    setIsProcessing(true);
    try {
      await acknowledgeMilestonePayment(currentMilestone._id || currentMilestone.id);
      setActionMessage({
        type: 'success',
        text: `Direct payment for Milestone ${currentMilestone.milestoneNumber} confirmed and acknowledged!`,
      });
      await loadContract();
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge payment');
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. Dispute Direct Payment
  const handleDisputePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMilestone) return;
    setIsProcessing(true);
    try {
      await disputeMilestonePayment(currentMilestone._id || currentMilestone.id, disputeReason);
      setIsDisputeModalOpen(false);
      setDisputeReason('');
      setActionMessage({
        type: 'error',
        text: `Discrepancy reported for Milestone ${currentMilestone.milestoneNumber}. Status marked as disputed.`,
      });
      await loadContract();
    } catch (err: any) {
      alert(err.message || 'Failed to dispute payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeliverableFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingDeliverable(true);
    try {
      const res = await uploadFile(file, 'deliverable', false);
      setDeliverableFileName(res.downloadUrl || res.accessUrl || res.originalName);
      setActionMessage({
        type: 'success',
        text: `Uploaded "${file.name}" (${(file.size / 1024).toFixed(1)} KB) successfully.`,
      });
    } catch (err: any) {
      alert(err.message || 'File upload failed');
    } finally {
      setIsUploadingDeliverable(false);
    }
  };

  const handleReceiptFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingReceipt(true);
    try {
      const res = await uploadFile(file, 'attachment', true);
      setReceiptFileUrl(res.downloadUrl || res.accessUrl);
      setActionMessage({
        type: 'success',
        text: `Payment receipt "${file.name}" uploaded.`,
      });
    } catch (err: any) {
      alert(err.message || 'Receipt upload failed');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleInspectDeliverable = () => {
    const fileUrl = currentMilestone?.submissions?.[0]?.fileUrls?.[0];
    if (!fileUrl) {
      alert('Deliverable package preview ready.');
      return;
    }
    if (fileUrl.startsWith('http')) {
      window.open(fileUrl, '_blank');
    } else {
      window.open(`http://localhost:5001/api/files/${encodeURIComponent(fileUrl)}/download`, '_blank');
    }
  };

  const totalAcknowledged = milestones
    .filter((m: any) => m.paymentStatus === 'acknowledged_by_freelancer' || m.escrowState === 'released')
    .reduce((sum: number, m: any) => sum + (m.amount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Platform Non-Custody Permanent Disclaimer */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
        <ShieldCheck size={16} className="text-[#0084ff] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-900">FLOXA Work Direct Milestone Billing:</strong> Payments occur directly between client and freelancer via external methods (Bank Transfer, UPI, Stripe, or Razorpay). FLOXA Work facilitates milestone agreement and deliverable tracking; it does not hold, collect, or disburse customer funds.
        </div>
      </div>

      {/* Alert Notice */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-red-50 border border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600" />
            ) : (
              <AlertCircle size={16} className="text-red-600" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Active Contract Header */}
      <div className="floxa-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-[#0084ff] uppercase tracking-wider">
                Active Project Agreement
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              {brief.title || 'Client Brief'}
            </h1>
            <div className="text-xs text-slate-500 font-medium">
              {isClient ? (
                <span>Talent: <strong>{freelancerInfo.name || 'Verified Talent'}</strong> (@{freelancerInfo.handle || 'talent'})</span>
              ) : (
                <span>Client: <strong>{clientInfo.name || 'Client Lead'}</strong> (@{clientInfo.handle || 'client'})</span>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-xs text-slate-500 font-medium">Total Project Value</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-slate-900">
              ${contract.totalBudget?.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold">
              ${totalAcknowledged.toLocaleString()} Direct Settled
            </div>
          </div>
        </div>

        {/* Milestone Steps Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {milestones.map((m: any) => {
            const isSelected = m.milestoneNumber === activeMilestoneNum;
            const isMApproved = m.deliverableStatus === 'approved' || m.escrowState === 'released';
            const isMAcknowledged = m.paymentStatus === 'acknowledged_by_freelancer' || m.escrowState === 'released';

            return (
              <button
                key={m._id || m.id}
                onClick={() => setActiveMilestoneNum(m.milestoneNumber)}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? 'border-[#0084ff] bg-[#0084ff]/5 shadow-sm ring-1 ring-[#0084ff]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-1">
                  <span className={isSelected ? 'text-[#0084ff]' : 'text-slate-500'}>
                    Milestone {m.milestoneNumber}
                  </span>
                  <span className="font-mono text-slate-900 font-bold">${m.amount.toLocaleString()}</span>
                </div>
                <div className="text-xs font-semibold text-slate-800 line-clamp-1">{m.title}</div>
                <div className="mt-2 flex items-center justify-between text-[10.5px]">
                  <span className={isMApproved ? 'text-emerald-600 font-bold' : 'text-slate-500 font-medium'}>
                    {isMApproved ? '✓ Deliverable Approved' : 'In Progress'}
                  </span>
                  <span className={isMAcknowledged ? 'text-emerald-700 font-semibold' : 'text-amber-600'}>
                    {isMAcknowledged ? 'Paid Direct' : 'Pending Direct'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Current Active Milestone Detail */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-[#0084ff] uppercase tracking-wider">
                Milestone {currentMilestone?.milestoneNumber} of 3
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                {currentMilestone?.title}
              </h3>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                <span>Deliverable: <strong className={isDeliverableApproved ? 'text-emerald-600 font-bold' : isDeliverableInReview ? 'text-[#0084ff] font-bold' : 'text-slate-700'}>{isDeliverableApproved ? 'Approved by Client' : isDeliverableInReview ? 'Under Inspection Window' : 'In Progress'}</strong></span>
                <span>•</span>
                <span>Payment: <strong className={isPaymentAcknowledged ? 'text-emerald-600 font-bold' : isPaymentReported ? 'text-sky-600 font-bold' : isPaymentDisputed ? 'text-red-600 font-bold' : 'text-slate-700'}>{isPaymentAcknowledged ? 'Acknowledged by Freelancer' : isPaymentReported ? 'Reported by Client' : isPaymentDisputed ? 'Disputed' : 'Not Yet Recorded'}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-base font-bold text-slate-900">
              ${currentMilestone?.amount.toLocaleString()}
            </div>
          </div>

          {/* Deliverable File Card */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#0084ff]/10 text-[#0084ff] flex items-center justify-center shrink-0">
                <FileCheck size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {currentMilestone?.submissions?.[0]?.fileUrls?.[0] || 'Deliverable_Handover_Bundle.zip'}
                </div>
                <div className="text-[10.5px] text-slate-500 font-medium truncate">
                  {currentMilestone?.submissions?.[0]?.notes || 'Verified vector tokens, brand architecture & source files.'}
                </div>
              </div>
            </div>

            <button
              onClick={handleInspectDeliverable}
              className="text-xs text-[#0084ff] hover:underline font-bold flex items-center gap-1 shrink-0 ml-3"
            >
              <span>Inspect</span>
              <ExternalLink size={12} />
            </button>
          </div>

          {/* User-Reported Direct Payment Details Box */}
          {currentMilestone?.paymentDetails?.reportedAt && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-semibold text-slate-900">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <CreditCard size={14} className="text-[#0084ff]" />
                  <span>Reported Direct Payment:</span>
                </span>
                <span className="capitalize">{currentMilestone.paymentDetails.paymentMethod?.replace('_', ' ')}</span>
              </div>
              {currentMilestone.paymentDetails.externalReference && (
                <div className="text-[11px] text-slate-600 font-mono">
                  UTR / Reference: <strong>{currentMilestone.paymentDetails.externalReference}</strong>
                </div>
              )}
              {currentMilestone.paymentDetails.receiptFileUrl && (
                <div className="pt-1">
                  <a
                    href={currentMilestone.paymentDetails.receiptFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0084ff] hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <Receipt size={12} />
                    <span>View Client Payment Receipt</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            {/* Freelancer: Submit Deliverable */}
            {!isClient && !isDeliverableApproved && (
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="btn-dark-pill text-xs px-4 py-2.5 justify-center"
              >
                <Upload size={14} className="text-[#0084ff]" />
                <span>{isDeliverableInReview ? 'Re-Submit Deliverable' : 'Submit Milestone Deliverable'}</span>
              </button>
            )}

            {/* Client: Approve Deliverable */}
            {isClient && isDeliverableInReview && !isDeliverableApproved && (
              <button
                onClick={handleApproveDeliverable}
                disabled={isProcessing}
                className="btn-cyan-pill text-xs px-5 py-2.5 justify-center"
              >
                <Check size={14} />
                <span>{isProcessing ? 'Saving...' : 'Approve Deliverable'}</span>
              </button>
            )}

            {/* Client: Record Direct Payment */}
            {isClient && (!isPaymentReported || isPaymentDisputed) && (
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="btn-dark-pill text-xs px-4 py-2.5 justify-center"
              >
                <CreditCard size={14} className="text-[#0084ff]" />
                <span>Record Direct Payment</span>
              </button>
            )}

            {/* Freelancer: Acknowledge Direct Payment */}
            {!isClient && isPaymentReported && !isPaymentAcknowledged && (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsDisputeModalOpen(true)}
                  className="px-3.5 py-2 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
                >
                  Report Discrepancy
                </button>
                <button
                  onClick={handleAcknowledgePayment}
                  disabled={isProcessing}
                  className="btn-cyan-pill text-xs px-5 py-2.5 justify-center"
                >
                  <Check size={14} />
                  <span>{isProcessing ? 'Confirming...' : 'Acknowledge Payment Receipt'}</span>
                </button>
              </div>
            )}

            {/* Both: Payment Acknowledged Badge */}
            {isPaymentAcknowledged && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Payment Confirmed by Parties outside platform</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deliverable Submission Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Submit Deliverable — Milestone {currentMilestone?.milestoneNumber}
              </h3>
              <button onClick={() => setIsSubmitModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitDeliverable} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Upload Deliverable File (.zip, .pdf, .png)
                </label>
                <div className="flex items-center gap-2">
                  <label className="btn-dark-pill text-xs px-3 py-2 cursor-pointer inline-flex items-center gap-1.5 shrink-0">
                    <Paperclip size={13} className="text-[#0084ff]" />
                    <span>{isUploadingDeliverable ? 'Uploading...' : 'Choose File'}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleDeliverableFileUpload}
                      disabled={isUploadingDeliverable}
                      accept=".zip,.pdf,.png,.jpg,.jpeg,.json"
                    />
                  </label>
                  <span className="text-[11px] text-slate-500 truncate max-w-[240px]">
                    {deliverableFileName}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Deliverable Bundle Name / URL
                </label>
                <input
                  type="text"
                  value={deliverableFileName}
                  onChange={(e) => setDeliverableFileName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0084ff]"
                  placeholder="e.g. Deliverable_Vector_Assets_v1.zip"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Handover Notes & Documentation
                </label>
                <textarea
                  rows={3}
                  value={deliverableNotes}
                  onChange={(e) => setDeliverableNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0084ff] resize-none"
                  placeholder="Describe the deliverables included, vector specs, fonts, or access keys..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-cyan-pill text-xs px-5 py-2">
                  <Send size={13} />
                  <span>Submit for Client Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Direct Payment Modal (Client) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Record Direct Payment — Milestone {currentMilestone?.milestoneNumber}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Agreed Amount: <strong>${currentMilestone?.amount.toLocaleString()}</strong>
                </p>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleReportPayment} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Method Used</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0084ff] bg-white"
                >
                  <option value="bank_transfer">Direct Bank Transfer (NEFT/RTGS/IMPS/Wire)</option>
                  <option value="upi">UPI (Google Pay, PhonePe, Paytm)</option>
                  <option value="stripe_direct">Direct Stripe Transfer</option>
                  <option value="razorpay_direct">Direct Razorpay Link</option>
                  <option value="paypal">Direct PayPal</option>
                  <option value="other">Other Agreed External Method</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  External Reference / UTR Number
                </label>
                <input
                  type="text"
                  value={externalReference}
                  onChange={(e) => setExternalReference(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0084ff]"
                  placeholder="e.g. UTR-20261114-9842187 or Stripe txn ID"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Upload Payment Receipt / Screenshot (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <label className="btn-dark-pill text-xs px-3 py-2 cursor-pointer inline-flex items-center gap-1.5 shrink-0">
                    <Paperclip size={13} className="text-[#0084ff]" />
                    <span>{isUploadingReceipt ? 'Uploading...' : 'Choose Receipt'}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleReceiptFileUpload}
                      disabled={isUploadingReceipt}
                      accept="image/*,.pdf"
                    />
                  </label>
                  <span className="text-[11px] text-slate-500 truncate max-w-[220px]">
                    {receiptFileUrl ? 'Receipt attached ✓' : 'No receipt attached'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0084ff] resize-none"
                  placeholder="Add any additional bank or transfer notes..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-cyan-pill text-xs px-5 py-2">
                  <span>Record Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {isDisputeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 text-red-600">
                <AlertTriangle size={16} />
                <span>Report Payment Discrepancy</span>
              </h3>
              <button onClick={() => setIsDisputeModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleDisputePaymentSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Reason for Discrepancy
                </label>
                <textarea
                  rows={3}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-red-500 resize-none"
                  placeholder="Explain why the reported payment was not received or if the amount differs..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDisputeModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-red-600 text-white font-bold text-xs hover:bg-red-700"
                >
                  Submit Discrepancy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
