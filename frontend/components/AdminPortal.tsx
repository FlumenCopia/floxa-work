'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Briefcase,
  Layers,
  DollarSign,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  ExternalLink,
  Scale,
  Flag,
  Star,
  AlertTriangle,
} from 'lucide-react';
import {
  fetchAdminStats,
  fetchAdminUsers,
  toggleAdminUserVerify,
  fetchAdminDisputesApi,
  resolveDisputeApi,
  fetchAdminReportsApi,
  resolveAdminReportApi,
  fetchAdminReviewsApi,
  moderateReviewApi,
} from '@/lib/api';

export const AdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'disputes' | 'reports' | 'reviews'>('users');
  const [stats, setStats] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes, dispRes, repRes, revRes] = await Promise.all([
        fetchAdminStats().catch(() => null),
        fetchAdminUsers(page, 15, search).catch(() => ({ users: [], pagination: { totalPages: 1 } })),
        fetchAdminDisputesApi().catch(() => []),
        fetchAdminReportsApi().catch(() => []),
        fetchAdminReviewsApi().catch(() => []),
      ]);
      if (statsRes) setStats(statsRes);
      setUsers(usersRes.users || []);
      setTotalPages(usersRes.pagination?.totalPages || 1);
      setDisputes(dispRes || []);
      setReports(repRes || []);
      setReviews(revRes || []);
    } catch (err) {
      console.error('[Admin Data Load Error]:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveDispute = async (disputeId: string) => {
    const summary = prompt('Enter resolution summary:');
    if (!summary) return;
    try {
      await resolveDisputeApi(disputeId, { resolutionSummary: summary });
      alert('Dispute resolved successfully');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve dispute');
    }
  };

  const handleResolveReport = async (reportId: string, status: string) => {
    try {
      await resolveAdminReportApi(reportId, status, 'Reviewed and resolved by operations team');
      alert(`Report marked as ${status}`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve report');
    }
  };

  const handleModerateReview = async (reviewId: string, action: string) => {
    try {
      await moderateReviewApi(reviewId, action, 'Moderated by platform admin');
      alert(`Review action ${action} applied`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to moderate review');
    }
  };

  useEffect(() => {
    loadData();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleToggleVerify = async (userId: string) => {
    setIsUpdating(userId);
    try {
      await toggleAdminUserVerify(userId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle verification');
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert size={20} className="text-[#0084ff]" />
            <h1 className="text-xl font-bold text-slate-900">FLOXA Work — Platform Operations Portal</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            Platform governance, user verification, dispute monitoring, and real-time MongoDB transaction logs.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="btn-dark-pill text-xs px-3.5 py-2 inline-flex items-center gap-1.5"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="floxa-card p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Registered Users</span>
            <Users size={16} className="text-[#0084ff]" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900">
            {stats?.totalUsers || 0}
          </div>
          <div className="text-[10px] text-slate-500">
            {stats?.totalClients || 0} Clients • {stats?.totalFreelancers || 0} Freelancers
          </div>
        </div>

        <div className="floxa-card p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Briefs Created</span>
            <Briefcase size={16} className="text-[#0084ff]" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900">
            {stats?.totalBriefs || 0}
          </div>
          <div className="text-[10px] text-slate-500">
            {stats?.openBriefs || 0} Open Opportunities
          </div>
        </div>

        <div className="floxa-card p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Contracts</span>
            <Layers size={16} className="text-[#0084ff]" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900">
            {stats?.activeContracts || 0}
          </div>
          <div className="text-[10px] text-slate-500">
            {stats?.completedContracts || 0} Completed Handoves
          </div>
        </div>

        <div className="floxa-card p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Direct Disbursed</span>
            <DollarSign size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900">
            ${Number(stats?.totalVolume || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium">
            0% Platform Escrow Custody
          </div>
        </div>
      </div>

      {/* Admin Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users' ? 'bg-[#0084ff] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <Users size={14} />
          <span>User KYC Verification</span>
        </button>

        <button
          onClick={() => setActiveTab('disputes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'disputes' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <Scale size={14} />
          <span>Disputes Queue</span>
          {disputes.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
              {disputes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'reports' ? 'bg-[#0084ff] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <Flag size={14} />
          <span>Safety Reports</span>
          {reports.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
              {reports.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'reviews' ? 'bg-[#0084ff] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <Star size={14} />
          <span>Review Moderation</span>
          {reviews.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
              {reviews.length}
            </span>
          )}
        </button>
      </div>

      {/* Users Moderation Section */}
      {activeTab === 'users' && (
      <div className="floxa-card space-y-4 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">User Moderation & KYC Verification</h2>
            <p className="text-[11px] text-slate-500">
              Review platform participants, grant verified talent badges, and inspect accounts.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, handle, email..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-full border border-slate-200 outline-none focus:border-[#0084ff]"
              />
            </div>
            <button type="submit" className="btn-cyan-pill text-xs px-3 py-1.5">
              Search
            </button>
          </form>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10.5px]">
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id || u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                        alt={u.name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <span>{u.name}</span>
                          {u.isVerified && (
                            <CheckCircle2 size={13} className="text-[#0084ff]" />
                          )}
                        </div>
                        <div className="text-[10.5px] text-slate-500">@{u.handle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600">{u.email}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold uppercase text-[9.5px] ${
                        u.role === 'client'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {u.isVerified ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle2 size={12} /> Verified
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">Unverified</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleToggleVerify(u._id || u.id)}
                      disabled={isUpdating === (u._id || u.id)}
                      className="text-xs text-[#0084ff] hover:underline font-bold disabled:opacity-50"
                    >
                      {u.isVerified ? 'Revoke Badge' : 'Grant Verified'}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No users matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded-md border border-slate-200 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded-md border border-slate-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Disputes Moderation Section */}
      {activeTab === 'disputes' && (
        <div className="floxa-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Dispute Mediation Queue</h2>
              <p className="text-[11px] text-slate-500">
                Inspect open contract disputes, review evidence submissions, and issue formal mediation resolutions.
              </p>
            </div>
            <div className="text-xs text-amber-600 font-semibold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              0% Escrow Custody — Platform Mediation Only
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10.5px]">
                  <th className="py-2.5 px-3">Dispute Title</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Initiator / Respondent</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {disputes.map((d: any) => (
                  <tr key={d._id || d.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-bold text-slate-900">{d.title}</td>
                    <td className="py-3 px-3 font-mono text-[11px] uppercase text-slate-600">{d.category}</td>
                    <td className="py-3 px-3 text-slate-600">
                      <div>{d.initiatorId?.name} vs {d.respondentId?.name}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {d.status !== 'resolved' && d.status !== 'closed' ? (
                        <button
                          onClick={() => handleResolveDispute(d._id || d.id)}
                          className="btn-cyan-pill text-[11px] px-3 py-1 font-bold"
                        >
                          Resolve Dispute
                        </button>
                      ) : (
                        <span className="text-emerald-600 font-bold text-xs">Resolved ✓</span>
                      )}
                    </td>
                  </tr>
                ))}
                {disputes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No active contract disputes in queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Safety Reports Section */}
      {activeTab === 'reports' && (
        <div className="floxa-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Safety & Content Moderation Queue</h2>
              <p className="text-[11px] text-slate-500">
                Manage user conduct reports, policy violations, and harassment flags.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10.5px]">
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">Reporter</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r: any) => (
                  <tr key={r._id || r.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{r.targetType}: {r.targetId?.slice(-6)}</td>
                    <td className="py-3 px-3 text-slate-700">{r.reason}</td>
                    <td className="py-3 px-3 text-slate-500">{r.reporterId?.name || 'Member'}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      {r.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleResolveReport(r._id || r.id, 'resolved')}
                            className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => handleResolveReport(r._id || r.id, 'dismissed')}
                            className="px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 border border-slate-200 text-[11px]"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No pending user safety reports.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Flagged Reviews Section */}
      {activeTab === 'reviews' && (
        <div className="floxa-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Review Moderation Queue</h2>
              <p className="text-[11px] text-slate-500">
                Inspect flagged reviews and moderate ratings to preserve trust integrity.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10.5px]">
                  <th className="py-2.5 px-3">Reviewer / Target</th>
                  <th className="py-2.5 px-3">Rating</th>
                  <th className="py-2.5 px-3">Review Text</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.map((rev: any) => (
                  <tr key={rev._id || rev.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 text-slate-800">
                      <div>{rev.reviewerId?.name} → {rev.targetId?.name}</div>
                    </td>
                    <td className="py-3 px-3 font-bold text-amber-500">★ {rev.overallRating}</td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">{rev.reviewText}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100">
                        {rev.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-1.5">
                      {rev.status !== 'hidden' && (
                        <button
                          onClick={() => handleModerateReview(rev._id || rev.id, 'hide')}
                          className="px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 font-bold text-[11px]"
                        >
                          Hide Review
                        </button>
                      )}
                      {rev.status !== 'published' && (
                        <button
                          onClick={() => handleModerateReview(rev._id || rev.id, 'publish')}
                          className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]"
                        >
                          Publish
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {reviews.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No reviews currently requiring moderation.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

