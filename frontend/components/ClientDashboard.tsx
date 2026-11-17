'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  FileText,
  Clock,
  CheckCircle,
  Play,
  Plus,
  CheckCircle2,
  Inbox,
  Scale,
  Bookmark,
  BookmarkCheck,
  ShieldCheck,
  AlertTriangle,
  X,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  fetchBriefs,
  fetchMyProposals,
  acceptProposalAndPayAdvance,
  shortlistProposal,
  declineProposal,
} from '@/lib/api';
import { WorkspaceView } from './WorkspaceView';
import { ProposalComparisonEngine } from './ProposalComparisonEngine';
import { formatCurrency } from '@/lib/currency';

interface ClientDashboardProps {
  onPostNewBrief: () => void;
  onOpenCall: () => void;
  onEscrowReleased?: () => void;
  onMilestoneSettled?: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  onPostNewBrief,
  onOpenCall,
  onEscrowReleased,
  onMilestoneSettled,
}) => {
  const [activeTab, setActiveTab] = useState<'review_bids' | 'active_milestones' | 'my_briefs'>('review_bids');
  const [briefs, setBriefs] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptedProposalId, setAcceptedProposalId] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Phase 15 Polish: Replaces browser alert/confirm with custom UI
  const [selectedProposalForAcceptance, setSelectedProposalForAcceptance] = useState<any | null>(null);
  const [declineTargetId, setDeclineTargetId] = useState<string | null>(null);
  const [isSubmittingAcceptance, setIsSubmittingAcceptance] = useState(false);
  const [isSubmittingDecline, setIsSubmittingDecline] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ type, text });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bData, pData] = await Promise.all([
        fetchBriefs(),
        fetchMyProposals(),
      ]);
      setBriefs(bData);
      setProposals(pData);
    } catch {
      setBriefs([]);
      setProposals([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmAcceptance = async () => {
    if (!selectedProposalForAcceptance) return;
    const propId = selectedProposalForAcceptance._id || selectedProposalForAcceptance.id;
    setIsSubmittingAcceptance(true);
    try {
      await acceptProposalAndPayAdvance(propId);
      setAcceptedProposalId(propId);
      setSelectedProposalForAcceptance(null);
      setIsComparing(false);
      showToast('Contract initialized successfully! Collaboration workspace is ready.', 'success');
      if (onMilestoneSettled) onMilestoneSettled();
      else if (onEscrowReleased) onEscrowReleased();
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to accept proposal and initialize contract', 'error');
    } finally {
      setIsSubmittingAcceptance(false);
    }
  };

  const handleShortlist = async (proposalId: string) => {
    try {
      await shortlistProposal(proposalId);
      showToast('Proposal shortlist status updated.', 'info');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update shortlist', 'error');
    }
  };

  const handleConfirmDecline = async () => {
    if (!declineTargetId) return;
    setIsSubmittingDecline(true);
    try {
      await declineProposal(declineTargetId);
      showToast('Proposal declined.', 'info');
      setDeclineTargetId(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to decline proposal', 'error');
    } finally {
      setIsSubmittingDecline(false);
    }
  };

  const activeBriefsCount = briefs.length;
  const pendingReviewsCount = proposals.filter((p) => p.status !== 'accepted').length;
  const acceptedCount = proposals.filter((p) => p.status === 'accepted').length;
  const activeMilestonesTotal = proposals
    .filter((p) => p.status === 'accepted')
    .reduce((acc, p) => acc + (p.totalPrice || 0), 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toast && (
        <div
          role="alert"
          aria-live="polite"
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold backdrop-blur-md transition-all animate-in slide-in-from-top-2 border ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/40'
              : toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-100 border-rose-500/40'
              : 'bg-slate-900/90 text-slate-100 border-cyan-500/40'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400" />}
          {toast.type === 'error' && <AlertTriangle size={16} className="text-rose-400" />}
          {toast.type === 'info' && <Info size={16} className="text-cyan-400" />}
          <span>{toast.text}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 rounded-full text-slate-400 hover:text-white"
            aria-label="Dismiss notification"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* 4 KPI Metrics Grid (Calculated from Live Database) */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap">
            <Wallet size={20} />
          </div>
          <div>
            <div className="kpi-label">Active Project Value</div>
            <div className="kpi-value">{formatCurrency(activeMilestonesTotal, 'USD')}</div>
            <div className="kpi-sub">{activeMilestonesTotal > 0 ? 'Direct milestone billing' : 'Zero active billing'}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap">
            <FileText size={20} />
          </div>
          <div>
            <div className="kpi-label">Active Briefs</div>
            <div className="kpi-value">{activeBriefsCount}</div>
            <div className="kpi-sub">{briefs.length > 0 ? 'Diagnostic briefs live' : 'No briefs published'}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap">
            <Clock size={20} />
          </div>
          <div>
            <div className="kpi-label">Proposals Received</div>
            <div className="kpi-value">{proposals.length}</div>
            <div className="kpi-sub">{pendingReviewsCount} awaiting evaluation</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap">
            <CheckCircle size={20} />
          </div>
          <div>
            <div className="kpi-label">Active Contracts</div>
            <div className="kpi-value">{acceptedCount}</div>
            <div className="kpi-sub">Collaborative workspaces</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full max-w-full min-w-0">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full max-w-full min-w-0">
          <button
            onClick={() => setActiveTab('review_bids')}
            className={`pill-tab ${activeTab === 'review_bids' ? 'active' : ''}`}
          >
            <span>Review Proposals</span>
            <span className="pill-tab-count">{pendingReviewsCount}</span>
          </button>

          <button
            onClick={() => setActiveTab('active_milestones')}
            className={`pill-tab ${activeTab === 'active_milestones' ? 'active' : ''}`}
          >
            <span>Active Workspaces</span>
            <span className="pill-tab-count">{formatCurrency(activeMilestonesTotal, 'USD')}</span>
          </button>

          <button
            onClick={() => setActiveTab('my_briefs')}
            className={`pill-tab ${activeTab === 'my_briefs' ? 'active' : ''}`}
          >
            <span>My Briefs</span>
            <span className="pill-tab-count">{activeBriefsCount}</span>
          </button>
        </div>

        <button onClick={onPostNewBrief} className="btn-cyan-pill self-start sm:self-auto">
          <Plus size={14} strokeWidth={3} />
          <span>Post Brief</span>
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="floxa-card py-16 text-center text-slate-500">
          <div className="inline-block animate-spin w-6 h-6 border-2 border-[#0084ff] border-t-transparent rounded-full mb-3" />
          <div className="text-xs font-medium">Loading live client dashboard...</div>
        </div>
      )}

      {/* Tab 1: Review Proposals */}
      {!isLoading && activeTab === 'review_bids' && (
        <div className="space-y-4">
          {proposals.length >= 2 && (
            <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-blue-50/90 rounded-2xl border border-blue-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0084ff]/10 border border-[#0084ff]/25 flex items-center justify-center text-[#0084ff] shrink-0">
                  <Scale size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Mini-Discovery Proposal Comparison Engine
                  </h4>
                  <p className="text-xs text-slate-500">
                    Evaluate diagnostics, strategies, and milestone breakdowns side-by-side before awarding.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsComparing(true)}
                className="btn-cyan-pill text-xs px-5 py-2.5 self-start sm:self-auto shrink-0 shadow-xs"
              >
                <Scale size={14} strokeWidth={2.5} />
                <span>Compare Proposals ({proposals.length})</span>
              </button>
            </div>
          )}

          {proposals.length === 0 ? (
            <div className="floxa-card py-16 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#0084ff]/10 border border-[#0084ff]/25 flex items-center justify-center mx-auto text-[#0084ff]">
                <Inbox size={26} />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">No Proposals Received Yet</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  When freelancers find your briefs in the marketplace, their Mini-Discovery pitches and problem diagnoses will appear here.
                </p>
              </div>
              {briefs.length === 0 && (
                <div>
                  <button onClick={onPostNewBrief} className="btn-cyan-pill text-xs px-5 py-2.5">
                    <Plus size={14} strokeWidth={3} />
                    <span>Publish Your First Brief</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            proposals.map((proposal) => {
              const freelancer = proposal.freelancerId || {};
              const authorName = freelancer.name || 'Candidate';
              const authorHandle = freelancer.handle || 'consultant';
              const avatar = freelancer.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80';
              const diagnosis = proposal.problemDiagnosis?.understanding || proposal.diagnosticAnswers?.[0]?.answer || 'Candidate provided detailed technical discovery.';
              const sliderVal = proposal.strategicSliders?.[0]?.value || 80;
              const isAccepted = proposal.status === 'accepted' || acceptedProposalId === proposal._id;

              return (
                <div key={proposal._id || proposal.id} className="floxa-card space-y-4">
                  {/* Header with Avatar, Verified badge, Bid info */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={avatar}
                          alt={authorName}
                          className="w-12 h-12 rounded-full object-cover border border-[#0084ff]/25 shadow-sm"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#0084ff] text-white flex items-center justify-center">
                          <CheckCircle2 size={12} strokeWidth={3} />
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-bold text-slate-900 tracking-wide">
                            {authorName}
                          </h3>
                          <CheckCircle2 size={15} className="text-[#0084ff]" />
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          @{authorHandle} • Verified Consultant
                        </div>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <div className="text-xl font-extrabold text-[#0084ff] font-mono">
                        {formatCurrency(proposal.totalPrice || 0, proposal.currency || 'USD')} Bid
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {proposal.proposedMilestones?.length || 3} Milestones • {proposal.estimatedDays || 21} Days
                      </div>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-[#0084ff] uppercase tracking-wider">
                      Problem Diagnosis & Discovery
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white/80 p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
                      {diagnosis}
                    </p>
                  </div>

                  {/* Slider Preview */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Execution Strategy Alignment</span>
                      <span className="text-[#0084ff] font-bold font-mono">
                        {sliderVal}% Structured Alignment
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-[#0084ff] shadow-[0_0_12px_rgba(0,132,255,0.6)]"
                        style={{ width: `${sliderVal}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={onOpenCall}
                        className="btn-dark-pill text-xs px-3.5 py-2 justify-center"
                      >
                        <Play size={13} className="text-[#0084ff]" fill="#0084ff" />
                        <span>Interview</span>
                      </button>

                      <button
                        onClick={() => handleShortlist(proposal._id || proposal.id)}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                          proposal.status === 'shortlisted'
                            ? 'bg-amber-50 border-amber-300 text-amber-600'
                            : 'bg-white border-slate-200 text-slate-500 hover:text-amber-500'
                        }`}
                        title={proposal.status === 'shortlisted' ? 'Shortlisted' : 'Shortlist proposal'}
                      >
                        {proposal.status === 'shortlisted' ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                      </button>

                      <button
                        onClick={() => setIsComparing(true)}
                        className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-[#0084ff] hover:border-[#0084ff]/40 text-xs font-bold transition-all"
                        title="Compare in side-by-side engine"
                      >
                        <Scale size={14} />
                      </button>

                      <button
                        onClick={() => setDeclineTargetId(proposal._id || proposal.id)}
                        disabled={isAccepted}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-rose-600 hover:border-rose-200 text-xs font-bold transition-colors disabled:opacity-40"
                      >
                        Decline
                      </button>
                    </div>

                    {isAccepted ? (
                      <span className="px-4 py-2 rounded-full bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd] text-xs font-bold flex items-center justify-center gap-1.5 w-full sm:w-auto">
                        <CheckCircle2 size={14} />
                        <span>Contract Signed & Initialized</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => setSelectedProposalForAcceptance(proposal)}
                        className="btn-cyan-pill text-xs px-4 sm:px-5 py-2.5 w-full sm:w-auto text-center justify-center"
                      >
                        <span>Review & Accept Proposal ({formatCurrency(Math.round((proposal.totalPrice || 2400) * 0.4), proposal.currency || 'USD')} Advance)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Active Contract Workspace */}
      {!isLoading && activeTab === 'active_milestones' && (
        <div className="space-y-4">
          <WorkspaceView />
        </div>
      )}

      {/* Tab 3: My Briefs */}
      {!isLoading && activeTab === 'my_briefs' && (
        <div className="space-y-4">
          {briefs.length === 0 ? (
            <div className="floxa-card py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0084ff]/10 border border-[#0084ff]/25 flex items-center justify-center mx-auto text-[#0084ff]">
                <FileText size={22} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Briefs Created Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-normal">
                Post a guided discovery brief to get diagnostic proposals from vetted talent.
              </p>
              <div>
                <button onClick={onPostNewBrief} className="btn-cyan-pill text-xs px-5 py-2">
                  <Plus size={14} strokeWidth={3} />
                  <span>Post Brief</span>
                </button>
              </div>
            </div>
          ) : (
            briefs.map((brief) => (
              <div key={brief._id || brief.id} className="floxa-card space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10.5px] font-bold text-[#0084ff] uppercase tracking-wider">
                      {brief.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">{brief.title}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold text-[#0084ff]">
                      {formatCurrency(brief.budgetMin, brief.currency || 'USD')} - {formatCurrency(brief.budgetMax, brief.currency || 'USD')}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {brief.proposalsCount || 0} proposals
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-white/80 p-3 rounded-xl border border-slate-200/80 shadow-sm">
                  {brief.problemStatement}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Side-by-Side Proposal Comparison Engine Modal */}
      {isComparing && proposals.length >= 2 && (
        <ProposalComparisonEngine
          brief={briefs[0] || { title: 'Project Discovery Brief' }}
          proposals={proposals}
          onAcceptProposal={(proposalOrId: any) => {
            if (typeof proposalOrId === 'string') {
              const matched = proposals.find((p) => (p._id || p.id) === proposalOrId);
              setSelectedProposalForAcceptance(matched || { _id: proposalOrId, totalPrice: 2400 });
            } else {
              setSelectedProposalForAcceptance(proposalOrId);
            }
          }}
          onShortlistProposal={handleShortlist}
          onDeclineProposal={(id: string) => setDeclineTargetId(id)}
          onOpenCall={onOpenCall}
          onClose={() => setIsComparing(false)}
        />
      )}

      {/* Phase 15 Polish: Explicit Proposal Acceptance Confirmation Modal */}
      {selectedProposalForAcceptance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0084ff]/10 text-[#0084ff] flex items-center justify-center font-bold">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Confirm Contract Initialization</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Review terms before freezing immutable snapshot</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProposalForAcceptance(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Candidate & Bid Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={
                    selectedProposalForAcceptance.freelancerId?.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'
                  }
                  alt="Candidate"
                  className="w-10 h-10 rounded-full object-cover border border-[#0084ff]/20"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {selectedProposalForAcceptance.freelancerId?.name || 'Selected Candidate'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    @{selectedProposalForAcceptance.freelancerId?.handle || 'consultant'}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-black text-[#0084ff] font-mono">
                  {formatCurrency(selectedProposalForAcceptance.totalPrice || 0, selectedProposalForAcceptance.currency || 'USD')}
                </div>
                <div className="text-[10.5px] text-slate-500 font-semibold">
                  {selectedProposalForAcceptance.estimatedDays || 21} Days Est.
                </div>
              </div>
            </div>

            {/* Proposed Milestones Snapshot Preview */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Agreed Milestones Schedule</span>
                <span className="text-[#0084ff] font-mono font-semibold">
                  {selectedProposalForAcceptance.proposedMilestones?.length || 3} Milestones
                </span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {(selectedProposalForAcceptance.proposedMilestones || [
                  { title: 'Discovery & Strategic Direction', amount: (selectedProposalForAcceptance.totalPrice || 2400) * 0.4, deliveryDays: 7 },
                  { title: 'Core Implementation & Deliverable', amount: (selectedProposalForAcceptance.totalPrice || 2400) * 0.4, deliveryDays: 14 },
                  { title: 'Final Handover & Polish', amount: (selectedProposalForAcceptance.totalPrice || 2400) * 0.2, deliveryDays: 7 },
                ]).map((m: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between shadow-2xs"
                  >
                    <div className="truncate mr-2">
                      <span className="font-bold text-slate-800">M{idx + 1}: {m.title}</span>
                      <span className="text-[10px] text-slate-400 block font-normal">{m.deliveryDays || 7} days</span>
                    </div>
                    <span className="font-mono font-extrabold text-slate-800 shrink-0">
                      {formatCurrency(m.amount || 0, selectedProposalForAcceptance.currency || 'USD')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Explicit Non-Custodial Legal & Settlement Notice */}
            <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-900 text-[11px] space-y-1.5 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 text-xs text-[#0084ff]">
                <ShieldCheck size={14} />
                <span>Zero-Custody Direct Billing Disclosure</span>
              </div>
              <p className="text-slate-600">
                FLOXA Work does not take custody of funds, provide escrow, or hold balances. Advance and milestone payments are settled directly between you and the freelancer via external channels (bank transfer, UPI, Stripe, wire).
              </p>
              <p className="text-slate-600">
                Accepting freezes the agreed deliverables and milestone schedule into an immutable collaboration workspace.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedProposalForAcceptance(null)}
                disabled={isSubmittingAcceptance}
                className="px-4 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Keep Reviewing
              </button>

              <button
                type="button"
                onClick={handleConfirmAcceptance}
                disabled={isSubmittingAcceptance}
                className="btn-cyan-pill text-xs px-5 py-2.5 shadow-md flex items-center gap-2"
              >
                {isSubmittingAcceptance ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Initializing Contract...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Confirm & Initialize Contract</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 15 Polish: Custom Decline Confirmation Modal */}
      {declineTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Decline Proposal</h4>
                <p className="text-xs text-slate-500">This action will archive the proposal.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to decline this proposal? The candidate will be notified that you are pursuing other proposals.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeclineTargetId(null)}
                disabled={isSubmittingDecline}
                className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecline}
                disabled={isSubmittingDecline}
                className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs"
              >
                {isSubmittingDecline ? 'Declining...' : 'Yes, Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
