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
} from 'lucide-react';
import { fetchBriefs, fetchMyProposals, acceptProposalAndFundEscrow } from '@/lib/api';
import { WorkspaceView } from './WorkspaceView';

interface ClientDashboardProps {
  onPostNewBrief: () => void;
  onOpenCall: () => void;
  onEscrowReleased: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  onPostNewBrief,
  onOpenCall,
  onEscrowReleased,
}) => {
  const [activeTab, setActiveTab] = useState<'review_bids' | 'active_escrow' | 'my_briefs'>('review_bids');
  const [briefs, setBriefs] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptedProposalId, setAcceptedProposalId] = useState<string | null>(null);

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

  const handleApproveEscrow = async (proposalId: string) => {
    try {
      await acceptProposalAndFundEscrow(proposalId);
      setAcceptedProposalId(proposalId);
      onEscrowReleased();
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to accept proposal');
    }
  };

  const activeBriefsCount = briefs.length;
  const pendingReviewsCount = proposals.filter((p) => p.status !== 'accepted').length;
  const acceptedCount = proposals.filter((p) => p.status === 'accepted').length;
  const escrowTotal = proposals
    .filter((p) => p.status === 'accepted')
    .reduce((acc, p) => acc + (p.totalPrice || 0), 0);

  return (
    <div className="space-y-6">
      {/* 4 KPI Metrics Grid (Calculated from Live Database) */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap">
            <Wallet size={20} />
          </div>
          <div>
            <div className="kpi-label">Active Project Value</div>
            <div className="kpi-value">${escrowTotal.toLocaleString()}</div>
            <div className="kpi-sub">{escrowTotal > 0 ? 'Direct milestone billing' : 'Zero active billing'}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap">
            <FileText size={20} />
          </div>
          <div>
            <div className="kpi-label">Active Briefs</div>
            <div className="kpi-value">{activeBriefsCount}</div>
            <div className="kpi-sub">{activeBriefsCount > 0 ? `${activeBriefsCount} live in marketplace` : 'No active briefs'}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap">
            <Clock size={20} />
          </div>
          <div>
            <div className="kpi-label">Pending Reviews</div>
            <div className="kpi-value">{pendingReviewsCount}</div>
            <div className="kpi-sub">{pendingReviewsCount > 0 ? 'Proposals awaiting review' : 'All reviews clear'}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap">
            <CheckCircle size={20} />
          </div>
          <div>
            <div className="kpi-label">Completed Gigs</div>
            <div className="kpi-value">{acceptedCount}</div>
            <div className="kpi-sub">Accepted contracts</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('review_bids')}
            className={`pill-tab ${activeTab === 'review_bids' ? 'active' : ''}`}
          >
            <span>Review Proposals</span>
            <span className="pill-tab-count">{pendingReviewsCount}</span>
          </button>

          <button
            onClick={() => setActiveTab('active_escrow')}
            className={`pill-tab ${activeTab === 'active_escrow' ? 'active' : ''}`}
          >
            <span>Active Contract</span>
            <span className="pill-tab-count">${escrowTotal.toLocaleString()}</span>
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
              const authorName = freelancer.name || 'Aravind V.';
              const authorHandle = freelancer.handle || 'aravind_design';
              const avatar = freelancer.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80';
              const diagnosis = proposal.diagnosticAnswers?.[0]?.answer || 'Candidate provided detailed technical discovery.';
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
                        ${proposal.totalPrice?.toLocaleString()} Bid
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {proposal.proposedMilestones?.length || 3} Milestones • {proposal.estimatedDays || 21} Days
                      </div>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-[#0084ff] uppercase tracking-wider">
                      Problem Diagnosis
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white/80 p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
                      {diagnosis}
                    </p>
                  </div>

                  {/* Slider Preview */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Execution Direction</span>
                      <span className="text-[#0084ff] font-bold font-mono">
                        {sliderVal}% Consumer Friendly
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
                    <button
                      onClick={onOpenCall}
                      className="btn-dark-pill text-xs px-4 py-2 w-full sm:w-auto justify-center"
                    >
                      <Play size={13} className="text-[#0084ff]" fill="#0084ff" />
                      <span>Video Interview</span>
                    </button>

                    {isAccepted ? (
                      <span className="px-4 py-2 rounded-full bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd] text-xs font-bold flex items-center justify-center gap-1.5 w-full sm:w-auto">
                        <CheckCircle2 size={14} />
                        <span>Proposal Accepted & Advance Paid</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApproveEscrow(proposal._id || proposal.id)}
                        className="btn-cyan-pill text-xs px-4 sm:px-5 py-2.5 w-full sm:w-auto text-center justify-center"
                      >
                        <span>Accept Proposal & Pay Advance (${Math.round((proposal.totalPrice || 2400) * 0.4).toLocaleString()})</span>
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
      {!isLoading && activeTab === 'active_escrow' && (
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
                      ${brief.budgetMin?.toLocaleString()} - ${brief.budgetMax?.toLocaleString()}
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
    </div>
  );
};
