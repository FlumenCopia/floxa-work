'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  X,
  Scale,
  Calendar,
  Layers,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  Star,
  Play,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Info,
  DollarSign,
  Briefcase,
  Sliders,
  Filter,
  ArrowUpDown,
  Search,
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface ProposalComparisonEngineProps {
  brief: any;
  proposals: any[];
  onAcceptProposal: (proposalId: string) => void;
  onShortlistProposal: (proposalId: string) => void;
  onDeclineProposal: (proposalId: string) => void;
  onOpenCall: () => void;
  onClose: () => void;
}

export const ProposalComparisonEngine: React.FC<ProposalComparisonEngineProps> = ({
  brief,
  proposals,
  onAcceptProposal,
  onShortlistProposal,
  onDeclineProposal,
  onOpenCall,
  onClose,
}) => {
  // Select up to 4 proposals for comparison (defaults to first 2-3)
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    return proposals.slice(0, Math.min(3, proposals.length)).map((p) => p._id || p.id);
  });

  const [activeMobileIdx, setActiveMobileIdx] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'shortlisted'>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  const showWarning = (msg: string) => {
    setWarningMsg(msg);
    setTimeout(() => setWarningMsg(null), 3500);
  };

  // Filter & sort proposals
  let filteredProposals = proposals.filter((p) => {
    if (activeTab === 'shortlisted' && p.status !== 'shortlisted') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = p.freelancerId?.name?.toLowerCase() || '';
      const handle = p.freelancerId?.handle?.toLowerCase() || '';
      const diag = p.problemDiagnosis?.understanding?.toLowerCase() || p.diagnosticAnswers?.[0]?.answer?.toLowerCase() || '';
      return name.includes(q) || handle.includes(q) || diag.includes(q);
    }
    return true;
  });

  if (sortBy === 'price_asc') {
    filteredProposals.sort((a, b) => (a.totalPrice || 0) - (b.totalPrice || 0));
  } else if (sortBy === 'price_desc') {
    filteredProposals.sort((a, b) => (b.totalPrice || 0) - (a.totalPrice || 0));
  } else if (sortBy === 'days_asc') {
    filteredProposals.sort((a, b) => (a.estimatedDays || 0) - (b.estimatedDays || 0));
  } else if (sortBy === 'milestones') {
    filteredProposals.sort((a, b) => (b.proposedMilestones?.length || 0) - (a.proposedMilestones?.length || 0));
  }

  // Active compared proposals
  const comparedProposals = proposals.filter((p) => selectedIds.includes(p._id || p.id));

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 2) {
        showWarning('You must compare at least 2 proposals side-by-side.');
        return;
      }
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length >= 4) {
        showWarning('Maximum of 4 proposals can be compared simultaneously.');
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Difference metric calculations
  const prices = comparedProposals.map((p) => p.totalPrice || 0);
  const minPrice = Math.min(...(prices.length ? prices : [0]));
  const maxPrice = Math.max(...(prices.length ? prices : [0]));
  const priceDelta = maxPrice - minPrice;

  const daysList = comparedProposals.map((p) => p.estimatedDays || 0);
  const minDays = Math.min(...(daysList.length ? daysList : [0]));
  const maxDays = Math.max(...(daysList.length ? daysList : [0]));

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#0084ff]/10 border border-[#0084ff]/25 flex items-center justify-center text-[#0084ff] shrink-0">
            <Scale size={20} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0084ff] bg-[#0084ff]/10 px-2 py-0.5 rounded-md">
                Discovery Comparison Engine
              </span>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">•</span>
              <span className="text-xs text-slate-500 font-medium truncate hidden sm:inline">
                {brief?.title || 'Project Brief'}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 truncate mt-0.5">
              Side-by-Side Proposal Evaluation ({comparedProposals.length} of {proposals.length} Selected)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Close comparison"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-3 sm:p-6 space-y-4">
        {warningMsg && (
          <div className="bg-amber-50 border border-amber-300 text-amber-800 text-xs px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in">
            <span className="font-semibold">{warningMsg}</span>
            <button onClick={() => setWarningMsg(null)} className="text-amber-600 hover:text-amber-900 ml-2">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Proposal Selector Strip */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full max-w-full min-w-0">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none max-w-full min-w-0">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                <Filter size={14} className="text-[#0084ff]" /> Select Proposals:
              </span>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'all'
                    ? 'bg-[#0084ff] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Proposals ({proposals.length})
              </button>
              <button
                onClick={() => setActiveTab('shortlisted')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'shortlisted'
                    ? 'bg-[#0084ff] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Shortlisted ({proposals.filter((p) => p.status === 'shortlisted').length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter talent / diagnosis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0084ff] outline-none text-slate-800 w-44 sm:w-56"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 outline-none font-medium"
              >
                <option value="recent">Newest Proposals</option>
                <option value="price_asc">Lowest Price First</option>
                <option value="price_desc">Highest Price First</option>
                <option value="days_asc">Fastest Delivery</option>
                <option value="milestones">Most Milestones</option>
              </select>
            </div>
          </div>

          {/* Proposal Selection Badges */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-100 max-w-full min-w-0">
            {filteredProposals.map((p) => {
              const id = p._id || p.id;
              const isSelected = selectedIds.includes(id);
              const author = p.freelancerId?.name || 'Talent';
              const price = p.totalPrice?.toLocaleString() || '0';

              return (
                <button
                  key={id}
                  onClick={() => toggleSelect(id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold shrink-0 transition-all ${
                    isSelected
                      ? 'bg-[#0084ff]/10 border-[#0084ff] text-[#0084ff] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="accent-[#0084ff] pointer-events-none rounded"
                  />
                  <span>{author}</span>
                  <span className="font-mono text-[11px] font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                    {formatCurrency(price, p.currency || brief.currency || 'USD')}
                  </span>
                  {p.status === 'shortlisted' && (
                    <span className="w-2 h-2 rounded-full bg-amber-500" title="Shortlisted" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Intelligent Difference Summary Strip */}
        {comparedProposals.length >= 2 && (
          <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-blue-50/80 rounded-2xl border border-blue-200/80 p-3.5 sm:p-4 text-xs">
            <div className="flex items-center gap-2 font-bold text-[#0084ff] mb-2 uppercase tracking-wider">
              <Sparkles size={15} />
              <span>Transparent Comparison Signals</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
              <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100 shadow-xs">
                <div className="text-[11px] text-slate-500 font-medium">Bid Range</div>
                <div className="text-sm font-extrabold text-slate-900 font-mono mt-0.5">
                  {formatCurrency(minPrice, brief.currency || 'USD')} - {formatCurrency(maxPrice, brief.currency || 'USD')}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Variance: {formatCurrency(priceDelta, brief.currency || 'USD')}
                </div>
              </div>

              <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100 shadow-xs">
                <div className="text-[11px] text-slate-500 font-medium">Timeline Spread</div>
                <div className="text-sm font-extrabold text-slate-900 font-mono mt-0.5">
                  {minDays} - {maxDays} Days
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Spread: {maxDays - minDays} days
                </div>
              </div>

              <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100 shadow-xs">
                <div className="text-[11px] text-slate-500 font-medium">Milestone Structure</div>
                <div className="text-sm font-extrabold text-slate-900 font-mono mt-0.5">
                  {Math.min(...comparedProposals.map((p) => p.proposedMilestones?.length || 3))} to{' '}
                  {Math.max(...comparedProposals.map((p) => p.proposedMilestones?.length || 3))} Milestones
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Staged Direct Deliverables
                </div>
              </div>

              <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100 shadow-xs">
                <div className="text-[11px] text-slate-500 font-medium">Billing Model</div>
                <div className="text-sm font-extrabold text-[#0084ff] font-mono mt-0.5">
                  0% Custody Escrow
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Direct Milestone Invoicing
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Switcher (Visible on small screens) */}
        <div className="sm:hidden flex items-center justify-between bg-white rounded-xl border border-slate-200 p-2.5 shadow-xs">
          <button
            onClick={() => setActiveMobileIdx(Math.max(0, activeMobileIdx - 1))}
            disabled={activeMobileIdx === 0}
            className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 text-slate-700"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="text-xs font-bold text-slate-900 text-center">
            Proposal {activeMobileIdx + 1} of {comparedProposals.length}:{' '}
            <span className="text-[#0084ff]">
              {comparedProposals[activeMobileIdx]?.freelancerId?.name || 'Talent'}
            </span>
          </div>
          <button
            onClick={() => setActiveMobileIdx(Math.min(comparedProposals.length - 1, activeMobileIdx + 1))}
            disabled={activeMobileIdx === comparedProposals.length - 1}
            className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 text-slate-700"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Side-by-Side Comparison Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {comparedProposals.map((proposal, idx) => {
            // In mobile mode, only display current mobile index
            const isVisibleOnMobile = idx === activeMobileIdx;
            const author = proposal.freelancerId?.name || 'Verified Talent';
            const handle = proposal.freelancerId?.handle || 'consultant';
            const avatar =
              proposal.freelancerId?.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80';
            const diagnosis =
              proposal.problemDiagnosis?.understanding ||
              proposal.diagnosticAnswers?.[0]?.answer ||
              'Diagnosis pending';
            const rootCauses = proposal.problemDiagnosis?.rootCauses || [];
            const risks = proposal.problemDiagnosis?.risksAndConstraints || [];
            const questions = proposal.problemDiagnosis?.clarifyingQuestions || [];
            const strategy = proposal.proposedStrategy?.strategicApproach || 'Staged Discovery & Production Workflow';
            const outcomes = proposal.proposedStrategy?.expectedOutcomes || [];
            const milestones = proposal.proposedMilestones || [];
            const portfolio = proposal.portfolioItems || [];
            const isShortlisted = proposal.status === 'shortlisted';
            const isAccepted = proposal.status === 'accepted';
            const price = proposal.totalPrice || 2400;
            const days = proposal.estimatedDays || 21;
            const currency = proposal.currency || brief.currency || 'USD';

            return (
              <div
                key={proposal._id || proposal.id}
                className={`bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden transition-all ${
                  isVisibleOnMobile ? 'block' : 'hidden sm:flex'
                } ${isShortlisted ? 'ring-2 ring-amber-400' : ''}`}
              >
                {/* 1. Consultant Identity Header */}
                <div className="p-4 bg-slate-50/70 border-b border-slate-200 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={avatar}
                          alt={author}
                          className="w-11 h-11 rounded-full object-cover border border-[#0084ff]/30 shadow-xs"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#0084ff] text-white flex items-center justify-center">
                          <CheckCircle2 size={10} strokeWidth={3} />
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="text-sm font-bold text-slate-900 truncate">{author}</h3>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium truncate">
                          @{handle}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onShortlistProposal(proposal._id || proposal.id)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isShortlisted
                          ? 'bg-amber-50 border-amber-300 text-amber-600'
                          : 'bg-white border-slate-200 text-slate-400 hover:text-amber-500'
                      }`}
                      title={isShortlisted ? 'Remove from shortlist' : 'Shortlist proposal'}
                    >
                      {isShortlisted ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                    </button>
                  </div>

                  {/* Price & Delivery Days */}
                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-xs text-slate-500 font-medium">Total Bid</span>
                      <div className="text-xl font-extrabold text-[#0084ff] font-mono">
                        {formatCurrency(price, currency)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 font-medium">Delivery</span>
                      <div className="text-sm font-bold text-slate-800 font-mono flex items-center justify-end gap-1">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{days} Days</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-100 flex items-center justify-between font-medium">
                    <span>Advance (40%):</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {formatCurrency(Math.round(price * 0.4), currency)} direct
                    </span>
                  </div>
                </div>

                {/* 2. Structured Comparison Body */}
                <div className="p-4 space-y-4 flex-1 text-xs">
                  {/* Category A: Problem Diagnosis */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#0084ff] flex items-center gap-1">
                        <Info size={12} /> Problem Diagnosis
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 font-normal">
                      {diagnosis}
                    </p>

                    {rootCauses.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          Identified Root Causes:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                          {rootCauses.map((rc: string, i: number) => (
                            <li key={i}>{rc}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {risks.length > 0 && (
                      <div className="mt-1.5 p-2 rounded-lg bg-amber-50/70 border border-amber-200/60 text-amber-900 text-[11px] space-y-0.5">
                        <div className="font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-700">
                          <ShieldAlert size={12} /> Identified Risks / Constraints
                        </div>
                        {risks.map((r: string, i: number) => (
                          <div key={i}>• {r}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category B: Strategic Approach */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                      <Briefcase size={12} /> Proposed Strategy
                    </span>
                    <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 font-normal">
                      {strategy}
                    </p>

                    {outcomes.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          Expected Outcomes:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {outcomes.map((oc: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10.5px] font-medium"
                            >
                              {oc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Category C: Strategy Dimension Sliders */}
                  {proposal.strategicSliders && proposal.strategicSliders.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                        <Sliders size={12} /> Strategy Configuration
                      </span>
                      {proposal.strategicSliders.map((slider: any, i: number) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500 font-medium">
                              {slider.label || 'Execution Direction'}
                            </span>
                            <span className="font-bold font-mono text-[#0084ff]">
                              {slider.value}% Craft
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                            <div
                              className="h-full bg-[#0084ff]"
                              style={{ width: `${slider.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Category D: Milestone Roadmap */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                      <Layers size={12} /> Execution Plan ({milestones.length} Milestones)
                    </span>
                    <div className="space-y-1.5">
                      {milestones.map((m: any, mIdx: number) => (
                        <div
                          key={mIdx}
                          className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] space-y-0.5"
                        >
                          <div className="flex items-center justify-between font-bold text-slate-800">
                            <span className="truncate pr-1">
                              M{mIdx + 1}: {m.title}
                            </span>
                            <span className="font-mono text-[#0084ff] shrink-0">
                              {formatCurrency(m.amount, currency)}
                            </span>
                          </div>
                          {m.description && (
                            <p className="text-slate-500 text-[10.5px] leading-tight line-clamp-2">
                              {m.description}
                            </p>
                          )}
                          <div className="text-[10px] text-slate-400 font-medium pt-0.5">
                            Duration: {m.deliveryDays || 7} days
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category E: Portfolio Proof Evidence */}
                  {portfolio.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                        <ExternalLink size={12} /> Relevant Portfolio Proof
                      </span>
                      <div className="space-y-1.5">
                        {portfolio.slice(0, 2).map((item: any, pIdx: number) => (
                          <div
                            key={pIdx}
                            className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-0.5"
                          >
                            <div className="font-bold text-slate-800 truncate">{item.title}</div>
                            {item.description && (
                              <p className="text-slate-500 text-[10.5px] line-clamp-1">
                                {item.description}
                              </p>
                            )}
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-[#0084ff] hover:underline flex items-center gap-1 font-medium pt-0.5"
                              >
                                <span>Inspect Project Evidence</span>
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clarifying Questions */}
                  {questions.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-[11px] space-y-1">
                      <div className="font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
                        <HelpCircle size={12} /> Clarifying Questions:
                      </div>
                      {questions.map((q: string, qIdx: number) => (
                        <div key={qIdx} className="text-slate-600">
                          {qIdx + 1}. {q}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Decisive Action Footer */}
                <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-2 mt-auto">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={onOpenCall}
                      className="btn-dark-pill text-[11px] py-1.5 justify-center w-full"
                    >
                      <Play size={11} className="text-[#0084ff]" fill="#0084ff" />
                      <span>Interview</span>
                    </button>

                    <button
                      onClick={() => onDeclineProposal(proposal._id || proposal.id)}
                      disabled={isAccepted}
                      className="px-2.5 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:border-red-200 text-[11px] font-bold text-center transition-colors disabled:opacity-40"
                    >
                      Decline
                    </button>
                  </div>

                  {isAccepted ? (
                    <div className="w-full py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5">
                      <CheckCircle2 size={14} />
                      <span>Contract Initialized</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onAcceptProposal(proposal)}
                      className="btn-cyan-pill w-full text-xs py-2 justify-center shadow-xs"
                    >
                      <span>Review & Initialize Contract</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
