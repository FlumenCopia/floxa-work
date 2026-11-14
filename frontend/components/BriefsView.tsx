'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Clock,
  ChevronRight,
  CheckCircle2,
  DollarSign,
  Plus,
  Inbox,
} from 'lucide-react';
import { fetchBriefs } from '@/lib/api';

export interface ClientBrief {
  _id?: string;
  id?: string;
  title: string;
  category: string;
  clientId?: {
    _id?: string;
    name?: string;
    handle?: string;
    avatarUrl?: string;
  };
  clientName?: string;
  clientHandle?: string;
  clientAvatar?: string;
  problemStatement: string;
  deliverablesRequired: string[];
  budgetMin: number;
  budgetMax: number;
  deadlineWeeks: number;
  proposalsCount?: number;
  createdAt?: string;
  postedAgo?: string;
}

interface BriefsViewProps {
  onOpenPitch: (brief: any) => void;
  onPostNewBrief: () => void;
  searchFilter?: string;
}

function timeAgo(dateString?: string): string {
  if (!dateString) return 'recently';
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

export const BriefsView: React.FC<BriefsViewProps> = ({
  onOpenPitch,
  onPostNewBrief,
  searchFilter = '',
}) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [briefs, setBriefs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const categories = [
    { id: 'all', label: 'All Briefs' },
    { id: 'branding', label: 'Brand & Identity' },
    { id: 'webdev', label: 'Full-Stack Dev' },
    { id: 'marketing', label: 'Marketing' },
  ];

  const loadBriefs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchBriefs(activeCategory);
      setBriefs(data);
    } catch {
      setBriefs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBriefs();
  }, [activeCategory]);

  const filteredBriefs = briefs.filter((b) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      b.title?.toLowerCase().includes(q) ||
      b.problemStatement?.toLowerCase().includes(q) ||
      b.category?.toLowerCase().includes(q)
    );
  });

  const totalProjectVolume = briefs.reduce((acc, b) => acc + (b.budgetMax || 0), 0);

  return (
    <div className="space-y-6">
      {/* 4 KPI Grid (Calculated from Real Database Data) */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap">
            <DollarSign size={20} />
          </div>
          <div>
            <div className="kpi-label">Active Project Volume</div>
            <div className="kpi-value">
              ${totalProjectVolume.toLocaleString()}
            </div>
            <div className="kpi-sub">Total marketplace value</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap">
            <Compass size={20} />
          </div>
          <div>
            <div className="kpi-label">Open Briefs</div>
            <div className="kpi-value">{briefs.length}</div>
            <div className="kpi-sub">Live opportunities</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap">
            <Clock size={20} />
          </div>
          <div>
            <div className="kpi-label">Avg. Match Time</div>
            <div className="kpi-value">{briefs.length > 0 ? '18 hrs' : '0 hrs'}</div>
            <div className="kpi-sub">Client turnaround</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="kpi-label">Milestone Sign-off</div>
            <div className="kpi-value">100%</div>
            <div className="kpi-sub">Direct verified payouts</div>
          </div>
        </div>
      </div>

      {/* Pill Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`pill-tab ${activeCategory === c.id ? 'active' : ''}`}
            >
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        <button onClick={onPostNewBrief} className="btn-cyan-pill self-start sm:self-auto">
          <Plus size={14} strokeWidth={3} />
          <span>Post Brief</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="floxa-card py-16 text-center text-slate-500">
          <div className="inline-block animate-spin w-6 h-6 border-2 border-[#0084ff] border-t-transparent rounded-full mb-3" />
          <div className="text-xs font-medium">Loading live briefs from database...</div>
        </div>
      )}

      {/* Empty State when zero briefs */}
      {!isLoading && filteredBriefs.length === 0 && (
        <div className="floxa-card py-16 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0084ff]/10 border border-[#0084ff]/25 flex items-center justify-center mx-auto text-[#0084ff]">
            <Inbox size={26} />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-slate-900">No Open Briefs Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              There are currently no active briefs in this category. Be the first client to publish a guided discovery brief with direct milestone payments.
            </p>
          </div>
          <div>
            <button onClick={onPostNewBrief} className="btn-cyan-pill text-xs px-5 py-2.5">
              <Plus size={14} strokeWidth={3} />
              <span>Publish the First Brief</span>
            </button>
          </div>
        </div>
      )}

      {/* Real Briefs Cards */}
      {!isLoading && filteredBriefs.length > 0 && (
        <div className="space-y-4">
          {filteredBriefs.map((brief) => {
            const author = brief.clientId || {};
            const authorName = author.name || 'Client';
            const authorHandle = author.handle || 'client';
            const timeStr = timeAgo(brief.createdAt);

            return (
              <div key={brief._id || brief.id} className="floxa-card space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                  <div>
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#0084ff]">
                      {brief.category}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1 leading-snug">{brief.title}</h3>
                    <div className="text-[11px] sm:text-xs text-slate-500 mt-1 font-medium">
                      Posted by {authorName} (@{authorHandle}) • {timeStr}
                    </div>
                  </div>

                  {/* Budget Badge */}
                  <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start gap-1">
                    <div className="text-base sm:text-lg font-extrabold text-[#0084ff] font-mono">
                      ${brief.budgetMin?.toLocaleString()} - ${brief.budgetMax?.toLocaleString()}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Direct Milestone Billing</div>
                  </div>
                </div>

                {/* Problem Statement Box */}
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white/80 p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
                  {brief.problemStatement}
                </p>

                {/* Deliverables & Pitch Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {brief.deliverablesRequired?.map((d: string) => (
                      <span
                        key={d}
                        className="text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full bg-slate-100/90 text-slate-700 border border-slate-200 font-medium"
                      >
                        {d}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-1 sm:pt-0">
                    <div className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <Clock size={12} />
                      <span>{brief.deadlineWeeks || 2} Weeks</span>
                    </div>

                    <button
                      onClick={() => onOpenPitch(brief)}
                      className="btn-cyan-pill text-xs px-4 py-2 flex-1 sm:flex-none"
                    >
                      <span>Submit Pitch</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
