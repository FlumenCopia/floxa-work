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
} from 'lucide-react';
import {
  fetchActiveContract,
  approveMilestoneDirect,
  submitMilestoneDeliverable,
  uploadFile,
  getAuthUser,
} from '@/lib/api';

export const WorkspaceView: React.FC = () => {
  const [activeMilestoneNum, setActiveMilestoneNum] = useState(1);
  const [contractData, setContractData] = useState<{ contract: any; milestones: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [deliverableNotes, setDeliverableNotes] = useState('');
  const [deliverableFileName, setDeliverableFileName] = useState('Deliverable_Handover_Bundle.zip');
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
            Contracts are initialized automatically when a client accepts a Mini-Discovery proposal and disburses the 40% advance milestone directly.
          </p>
        </div>
      </div>
    );
  }

  const { contract, milestones } = contractData;
  const brief = contract.briefId || {};
  const clientInfo = contract.clientId || {};
  const freelancerInfo = contract.freelancerId || {};

  const currentMilestone =
    milestones.find((m: any) => m.milestoneNumber === activeMilestoneNum) || milestones[0];

  const isReleased = currentMilestone?.escrowState === 'released';
  const isInReview = currentMilestone?.escrowState === 'in_review';
  const isAwaiting = currentMilestone?.escrowState === 'awaiting_deposit';

  const handleApproveAndPay = async () => {
    if (!currentMilestone) return;
    setIsProcessingPayment(true);
    setActionMessage(null);
    try {
      const res = await approveMilestoneDirect(currentMilestone._id || currentMilestone.id);
      setActionMessage({
        type: 'success',
        text: `Milestone ${currentMilestone.milestoneNumber} approved and direct payment disbursed ($${currentMilestone.amount.toLocaleString()})!`,
      });
      await loadContract();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to approve milestone payment',
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

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
        text: `Deliverable submitted for Milestone ${currentMilestone.milestoneNumber}! Status moved to Under Review.`,
      });
      await loadContract();
    } catch (err: any) {
      alert(err.message || 'Failed to submit deliverable');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingFile(true);
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
      setIsUploadingFile(false);
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

  const totalPaid = milestones
    .filter((m: any) => m.escrowState === 'released')
    .reduce((sum: number, m: any) => sum + (m.amount || 0), 0);

  return (
    <div className="space-y-4">
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
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0084ff] bg-[#0084ff]/10 px-2 py-0.5 rounded-md">
                {contract.status === 'completed' ? 'Completed Contract' : 'Active Milestone Contract'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ID: {contract._id?.toString().slice(-6)}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              {brief.title || 'Client Milestone Project'}
            </h2>

            <div className="text-xs text-slate-500 mt-0.5 font-medium flex flex-wrap items-center gap-2">
              <span>Talent: <strong className="text-slate-800">{freelancerInfo.name || 'Aravind V.'}</strong> (@{freelancerInfo.handle || 'aravind_design'})</span>
              <span>â€¢</span>
              <span>Client: <strong className="text-slate-800">{clientInfo.name || 'Sanjay Mehta'}</strong></span>
            </div>
          </div>

          <div className="sm:text-right flex items-center sm:block justify-between pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <div>
              <div className="text-xs text-slate-500 font-medium">Total Project Value</div>
              <div className="text-lg font-extrabold text-[#0084ff] font-mono">
                ${contract.totalBudget?.toLocaleString()}
              </div>
            </div>
            <div className="text-[11px] text-slate-500 font-medium sm:mt-0.5">
              ${totalPaid.toLocaleString()} Disbursed Directly
            </div>
          </div>
        </div>

        {/* Milestone Steps Navigation Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {milestones.map((m: any) => {
            const num = m.milestoneNumber;
            const isSelected = activeMilestoneNum === num;
            const mReleased = m.escrowState === 'released';
            const mInReview = m.escrowState === 'in_review';

            return (
              <button
                key={m._id || m.id || num}
                onClick={() => setActiveMilestoneNum(num)}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? 'border-[#0084ff] bg-[#0084ff]/10 text-slate-900 shadow-sm'
                    : 'border-slate-200 bg-white/80 text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider ${
                      isSelected ? 'text-[#0084ff]' : 'text-slate-400'
                    }`}
                  >
                    Milestone {num}
                  </span>
                  {mReleased ? (
                    <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                      <CheckCircle2 size={10} />
                      Paid
                    </span>
                  ) : mInReview ? (
                    <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                      In Review
                    </span>
                  ) : (
                    <span className="text-[9.5px] font-bold text-slate-400">
                      Pending
                    </span>
                  )}
                </div>

                <div className="text-xs font-semibold truncate mt-1 text-slate-900">{m.title}</div>
                <div className="text-xs font-mono font-bold text-[#0084ff] mt-1">
                  ${m.amount?.toLocaleString()}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Milestone Inspection & Action Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/95 border border-slate-200/90 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <span className="text-sm font-bold text-slate-900 block">
                {currentMilestone?.title}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Milestone Status:{' '}
                <strong className={isReleased ? 'text-emerald-600 font-bold' : isInReview ? 'text-sky-600 font-bold' : 'text-slate-700'}>
                  {isReleased
                    ? 'Approved & Paid Directly'
                    : isInReview
                    ? 'Under Review Window (Deliverable Handed Over)'
                    : 'Awaiting Deliverable Handover'}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold self-start sm:self-auto border">
              {isReleased ? (
                <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border-emerald-200">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Paid Directly</span>
                </div>
              ) : isInReview ? (
                <div className="flex items-center gap-1 text-sky-700 bg-sky-50 border-sky-200">
                  <Clock size={13} className="text-sky-600" />
                  <span>7-Day Inspection Window</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-slate-600 bg-slate-50 border-slate-200">
                  <Clock size={13} className="text-slate-400" />
                  <span>Awaiting Handover</span>
                </div>
              )}
            </div>
          </div>

          {/* Deliverable File Card */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#0084ff]/10 text-[#0084ff] flex items-center justify-center font-bold">
                <FileCheck size={18} />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  {currentMilestone?.submissions?.[0]?.fileUrls?.[0] || 'Deliverable_Handover_Bundle.zip'}
                </div>
                <div className="text-[10.5px] text-slate-500 font-medium">
                  {currentMilestone?.submissions?.[0]?.notes || 'Verified vector tokens, brand architecture & source files.'}
                </div>
              </div>
            </div>

            <button
              onClick={handleInspectDeliverable}
              className="text-xs text-[#0084ff] hover:underline font-bold flex items-center gap-1 shrink-0 ml-2"
            >
              <span>Inspect</span>
              <ExternalLink size={12} />
            </button>
          </div>

          {/* Payment Gateway Reference (When Paid) */}
          {isReleased && currentMilestone?.paymentGatewayRef && (
            <div className="text-[11px] font-mono text-slate-500 bg-slate-100/80 p-2.5 rounded-lg border border-slate-200/80 flex items-center justify-between">
              <span>Direct Payment Reference:</span>
              <span className="font-bold text-slate-800">{currentMilestone.paymentGatewayRef}</span>
            </div>
          )}

          {/* Action Row */}
          {isReleased ? (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>
                Milestone approved! Direct payment of <strong>${currentMilestone.amount.toLocaleString()}</strong> transferred directly to freelancer account. (Zero platform escrow custody).
              </span>
            </div>
          ) : (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
              {/* Freelancer Deliverable Submission Button */}
              {!isClient && !isReleased && (
                <button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="btn-dark-pill text-xs px-4 py-2.5 w-full sm:w-auto justify-center"
                >
                  <Upload size={14} className="text-[#0084ff]" />
                  <span>{isInReview ? 'Re-Submit Handover Deliverable' : 'Submit Milestone Deliverable'}</span>
                </button>
              )}

              {/* Client Approve & Pay Button */}
              {isClient && (
                <button
                  onClick={handleApproveAndPay}
                  disabled={isProcessingPayment}
                  className="btn-cyan-pill text-xs px-5 py-2.5 w-full sm:w-auto text-center justify-center disabled:opacity-50"
                >
                  {isProcessingPayment ? (
                    <div className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-1.5" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  <span>
                    Approve Deliverable & Pay Milestone (${currentMilestone.amount?.toLocaleString()})
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Deliverable Submission Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Submit Deliverable â€” Milestone {currentMilestone?.milestoneNumber}
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
                    <span>{isUploadingFile ? 'Uploading...' : 'Choose File'}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploadingFile}
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
    </div>
  );
};
