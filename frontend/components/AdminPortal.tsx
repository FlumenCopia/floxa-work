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
  Activity,
  Download,
  FileText,
  Ban,
  Check,
  Eye,
  Sliders,
  Clock,
  HardDrive,
  Cpu,
  BarChart2,
} from 'lucide-react';
import {
  fetchAdminOverviewAnalyticsApi,
  fetchMarketplaceAnalyticsApi,
  fetchAdminContractsApi,
  fetchAdminUsers,
  fetchAdminUserDetailsApi,
  updateUserAccountStatusApi,
  updateUserRestrictionsApi,
  updateAdminUserRoleApi,
  toggleAdminUserVerify,
  fetchAdminDisputesApi,
  resolveDisputeApi,
  fetchAdminReportsApi,
  resolveAdminReportApi,
  fetchAdminReviewsApi,
  moderateReviewApi,
  fetchAdminAuditLogsApi,
  fetchSystemHealthApi,
  API_BASE,
  getAuthToken,
} from '@/lib/api';

export const AdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'marketplace' | 'contracts' | 'users' | 'disputes' | 'reports' | 'reviews' | 'audit' | 'health' | 'exports'
  >('overview');

  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d' | '90d' | 'all'>('30d');
  const [overviewData, setOverviewData] = useState<any | null>(null);
  const [marketplaceData, setMarketplaceData] = useState<any | null>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await fetchAdminOverviewAnalyticsApi(timeframe);
        setOverviewData(res);
      } else if (activeTab === 'marketplace') {
        const res = await fetchMarketplaceAnalyticsApi();
        setMarketplaceData(res);
      } else if (activeTab === 'contracts') {
        const res = await fetchAdminContractsApi({ page, limit: 15 });
        setContracts(res.contracts || []);
        setTotalPages(res.pagination?.totalPages || 1);
      } else if (activeTab === 'users') {
        const res = await fetchAdminUsers(page, 15, search);
        setUsers(res.users || []);
        setTotalPages(res.pagination?.totalPages || 1);
      } else if (activeTab === 'disputes') {
        const res = await fetchAdminDisputesApi();
        setDisputes(res || []);
      } else if (activeTab === 'reports') {
        const res = await fetchAdminReportsApi();
        setReports(res || []);
      } else if (activeTab === 'reviews') {
        const res = await fetchAdminReviewsApi();
        setReviews(res || []);
      } else if (activeTab === 'audit') {
        const res = await fetchAdminAuditLogsApi({ page, limit: 25 });
        setAuditLogs(res.logs || []);
        setTotalPages(res.pagination?.totalPages || 1);
      } else if (activeTab === 'health') {
        const res = await fetchSystemHealthApi();
        setHealthData(res);
      }
    } catch (err) {
      console.error('[Admin Data Load Error]:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, timeframe, page]);

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

  const handleSuspendUser = async (userId: string) => {
    const reason = prompt('Enter mandatory reason for user account suspension:');
    if (!reason || !reason.trim()) return;
    try {
      await updateUserAccountStatusApi(userId, 'suspended', reason.trim());
      alert('User suspended successfully');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to suspend user');
    }
  };

  const handleReinstateUser = async (userId: string) => {
    try {
      await updateUserAccountStatusApi(userId, 'active');
      alert('User reinstated successfully');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to reinstate user');
    }
  };

  const handleResolveDispute = async (disputeId: string) => {
    const summary = prompt('Enter formal resolution summary:');
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
      await resolveAdminReportApi(reportId, status, 'Resolved by operations team');
      alert(`Report marked as ${status}`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve report');
    }
  };

  const handleModerateReview = async (reviewId: string, action: string) => {
    try {
      await moderateReviewApi(reviewId, action, 'Moderated by platform operations');
      alert(`Review action ${action} applied`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to moderate review');
    }
  };

  const handleDownloadCsv = (type: string) => {
    const token = getAuthToken();
    if (!token) return;
    window.open(`${API_BASE}/admin/exports/${type}?token=${token}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert size={22} className="text-[#0084ff]" />
            <h1 className="text-xl font-bold text-slate-900">FLOXA Work — Operations & Governance Center</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            Platform business intelligence, non-custodial contractual analytics, user lifecycle governance, and audit trails.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="btn-dark-pill text-xs px-3.5 py-2 inline-flex items-center gap-1.5"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh View</span>
        </button>
      </div>

      {/* 2. Navigation Tab Switcher */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 max-w-full min-w-0">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'overview' ? 'bg-[#0084ff] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <BarChart2 size={13} />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('marketplace')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'marketplace' ? 'bg-[#0084ff] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <Activity size={13} />
          <span>Marketplace Health</span>
        </button>

        <button
          onClick={() => setActiveTab('contracts')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'contracts' ? 'bg-[#0084ff] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <Layers size={13} />
          <span>Projects & Contracts</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'users' ? 'bg-[#0084ff] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <Users size={13} />
          <span>User Management</span>
        </button>

        <button
          onClick={() => setActiveTab('disputes')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'disputes' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <Scale size={13} />
          <span>Disputes</span>
          {disputes.length > 0 && <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-black/20 font-mono">{disputes.length}</span>}
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'reports' ? 'bg-[#0084ff] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <Flag size={13} />
          <span>Safety Reports</span>
          {reports.length > 0 && <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-black/20 font-mono">{reports.length}</span>}
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'reviews' ? 'bg-[#0084ff] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <Star size={13} />
          <span>Review Moderation</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'audit' ? 'bg-[#0084ff] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <FileText size={13} />
          <span>Audit Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'health' ? 'bg-[#0084ff] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <Cpu size={13} />
          <span>System Health</span>
        </button>

        <button
          onClick={() => setActiveTab('exports')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'exports' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <Download size={13} />
          <span>Secure Exports</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: EXECUTIVE OVERVIEW DASHBOARD
          ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Timeframe Controls */}
          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700">Analytics Timeframe:</span>
            <div className="flex gap-1.5">
              {(['today', '7d', '30d', '90d', 'all'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                    timeframe === t ? 'bg-[#0084ff] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t === 'today' ? 'Today' : t}
                </button>
              ))}
            </div>
          </div>

          {/* Non-Custodial Legal Notice */}
          <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#0084ff] shrink-0" />
            <span>
              <strong>Zero Platform Money Custody Policy:</strong> Contractual project figures reflect negotiated scopes. Reported payment totals reflect participant external settlements. Neither represents platform revenue.
            </span>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="floxa-card p-4 space-y-1">
              <div className="text-[11px] font-semibold uppercase text-slate-500">Registered Users</div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {overviewData?.metrics?.users?.totalUsers ?? '...'}
              </div>
              <div className="text-[10px] text-slate-400">
                +{overviewData?.metrics?.users?.newRegistrationsInPeriod ?? 0} in selected window
              </div>
            </div>

            <div className="floxa-card p-4 space-y-1">
              <div className="text-[11px] font-semibold uppercase text-slate-500">Active Briefs</div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {overviewData?.metrics?.marketplace?.activeBriefs ?? '...'}
              </div>
              <div className="text-[10px] text-slate-400">
                {overviewData?.metrics?.marketplace?.totalBriefs ?? 0} total created
              </div>
            </div>

            <div className="floxa-card p-4 space-y-1">
              <div className="text-[11px] font-semibold uppercase text-slate-500">Active Agreements</div>
              <div className="text-2xl font-black text-[#0084ff] font-mono">
                {overviewData?.metrics?.contracts?.activeContracts ?? '...'}
              </div>
              <div className="text-[10px] text-slate-400">
                {overviewData?.metrics?.contracts?.completedContracts ?? 0} completed handovers
              </div>
            </div>

            <div className="floxa-card p-4 space-y-1">
              <div className="text-[11px] font-semibold uppercase text-slate-500">Total Contract Scope</div>
              <div className="text-2xl font-black text-emerald-600 font-mono">
                ${Number(overviewData?.metrics?.contracts?.contractualProjectMetrics?.totalContractualAgreedValue ?? 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-600 font-medium">
                Contractual negotiated value
              </div>
            </div>
          </div>

          {/* Breakdown Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="floxa-card p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Contractual Project Value Breakdown</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Active Contract Scope:</span>
                  <span className="font-mono font-bold text-slate-800">
                    ${Number(overviewData?.metrics?.contracts?.contractualProjectMetrics?.activeContractualValue ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Completed Contract Scope:</span>
                  <span className="font-mono font-bold text-slate-800">
                    ${Number(overviewData?.metrics?.contracts?.contractualProjectMetrics?.completedContractualValue ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Average Project Value:</span>
                  <span className="font-mono font-bold text-slate-800">
                    ${Number(overviewData?.metrics?.contracts?.contractualProjectMetrics?.averageContractValue ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="floxa-card p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">User-Reported External Settlement Volume</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Acknowledged External Payments:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    ${Number(overviewData?.metrics?.externalSettlements?.acknowledgedExternalPaymentAmount ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Pending Reported Payments:</span>
                  <span className="font-mono font-bold text-amber-600">
                    ${Number(overviewData?.metrics?.externalSettlements?.reportedExternalPaymentAmount ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Disputed Reported Payments:</span>
                  <span className="font-mono font-bold text-red-600">
                    ${Number(overviewData?.metrics?.externalSettlements?.disputedUserReportedPaymentAmount ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: MARKETPLACE CONVERSION ANALYTICS
          ======================================================== */}
      {activeTab === 'marketplace' && (
        <div className="space-y-5 animate-in fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="floxa-card p-4 space-y-1">
              <div className="text-[11px] font-semibold uppercase text-slate-500">Proposals / Brief</div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {marketplaceData?.funnel?.avgProposalsPerBrief ?? '...'}
              </div>
              <div className="text-[10px] text-slate-400">Average pitch density</div>
            </div>

            <div className="floxa-card p-4 space-y-1">
              <div className="text-[11px] font-semibold uppercase text-slate-500">Pitch Acceptance Rate</div>
              <div className="text-2xl font-black text-[#0084ff] font-mono">
                {marketplaceData?.funnel?.proposalAcceptanceRate ?? '...'}
              </div>
              <div className="text-[10px] text-slate-400">Brief-to-contract conversion</div>
            </div>

            <div className="floxa-card p-4 space-y-1">
              <div className="text-[11px] font-semibold uppercase text-slate-500">Project Completion Rate</div>
              <div className="text-2xl font-black text-emerald-600 font-mono">
                {marketplaceData?.funnel?.contractCompletionRate ?? '...'}
              </div>
              <div className="text-[10px] text-slate-400">Successful closeout ratio</div>
            </div>

            <div className="floxa-card p-4 space-y-1">
              <div className="text-[11px] font-semibold uppercase text-slate-500">Average Talent Rating</div>
              <div className="text-2xl font-black text-amber-500 font-mono flex items-center gap-1">
                <Star size={16} fill="#f59e0b" />
                <span>{Number(marketplaceData?.talentBenchmark?.avgRating ?? 5).toFixed(1)}</span>
              </div>
              <div className="text-[10px] text-slate-400">Across verified talent</div>
            </div>
          </div>

          {/* Category Distribution Table */}
          <div className="floxa-card p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Project Distribution By Category</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                    <th className="py-2">Category</th>
                    <th className="py-2">Briefs Count</th>
                    <th className="py-2">Avg Min Budget</th>
                    <th className="py-2">Avg Max Budget</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {marketplaceData?.briefsByCategory?.map((c: any) => (
                    <tr key={c._id}>
                      <td className="py-2.5 font-sans font-bold capitalize text-slate-800">{c._id}</td>
                      <td className="py-2.5 text-slate-600">{c.count}</td>
                      <td className="py-2.5 text-slate-600">${Math.round(c.avgBudgetMin || 0).toLocaleString()}</td>
                      <td className="py-2.5 text-slate-600">${Math.round(c.avgBudgetMax || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: CONTRACT OPERATIONS QUEUE
          ======================================================== */}
      {activeTab === 'contracts' && (
        <div className="floxa-card p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Project Contract Operations Pipeline</h2>
              <p className="text-[11px] text-slate-500">
                Operational tracking of active deliverables, milestones, and closeout handovers.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10.5px]">
                  <th className="py-2.5 px-3">Project Title</th>
                  <th className="py-2.5 px-3">Client / Freelancer</th>
                  <th className="py-2.5 px-3">Contract Scope</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Closeout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contracts.map((c) => (
                  <tr key={c._id || c.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-bold text-slate-900">{c.briefId?.title || 'Contract Agreement'}</td>
                    <td className="py-3 px-3 text-slate-600">
                      <div>{c.clientId?.name} ↔ {c.freelancerId?.name}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      ${Number(c.totalBudget).toLocaleString()} {c.currency}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        c.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : c.status === 'disputed' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {c.closeoutStatus || 'open'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: USER LIFECYCLE MANAGEMENT
          ======================================================== */}
      {activeTab === 'users' && (
        <div className="floxa-card space-y-4 p-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">User Lifecycle & KYC Administration</h2>
              <p className="text-[11px] text-slate-500">
                Inspect accounts, toggle verification badges, suspend fraudulent profiles, or manage restrictions.
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
              <button type="submit" className="btn-cyan-pill text-xs px-3 py-1.5 font-bold">
                Search
              </button>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10.5px]">
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Account Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id || u.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {u.isVerified && <CheckCircle2 size={13} className="text-[#0084ff]" />}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">@{u.handle}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">{u.email}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10.5px] uppercase">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {u.status || 'active'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-1.5">
                      <button
                        onClick={() => handleToggleVerify(u._id || u.id)}
                        className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 text-[11px] font-semibold"
                      >
                        {u.isVerified ? 'Unverify' : 'Verify'}
                      </button>
                      {u.status === 'suspended' ? (
                        <button
                          onClick={() => handleReinstateUser(u._id || u.id)}
                          className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold"
                        >
                          Reinstate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSuspendUser(u._id || u.id)}
                          className="px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold"
                        >
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 5: DISPUTES MEDIATION QUEUE
          ======================================================== */}
      {activeTab === 'disputes' && (
        <div className="floxa-card p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Dispute Mediation Operations Queue</h2>
              <p className="text-[11px] text-slate-500">
                Review platform disagreements, inspect participant statements, and record formal resolution findings.
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
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Participants</th>
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
                      <div>{d.initiatorId?.name} ↔ {d.respondentId?.name}</div>
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
                          Resolve
                        </button>
                      ) : (
                        <span className="text-emerald-600 font-bold text-xs">Resolved ✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 6: SAFETY REPORTS QUEUE
          ======================================================== */}
      {activeTab === 'reports' && (
        <div className="floxa-card p-5 space-y-4 animate-in fade-in">
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
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 7: REVIEWS MODERATION
          ======================================================== */}
      {activeTab === 'reviews' && (
        <div className="floxa-card p-5 space-y-4 animate-in fade-in">
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
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 8: AUDIT LOG EXPLORER
          ======================================================== */}
      {activeTab === 'audit' && (
        <div className="floxa-card p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Immutable Audit Trail Explorer</h2>
              <p className="text-[11px] text-slate-500">
                Tamper-evident logs of administrative operations, security events, and user lifecycle changes.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10.5px]">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log._id || log.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-slate-800 font-sans">{log.actorId?.name || log.actorId?.email || 'System'}</td>
                    <td className="py-2.5 px-3 font-bold text-[#0084ff]">{log.action}</td>
                    <td className="py-2.5 px-3 text-slate-600">{log.targetType || 'N/A'}: {log.targetId?.slice(-6) || ''}</td>
                    <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs font-sans text-[10.5px]">
                      {JSON.stringify(log.metadata || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 9: SYSTEM HEALTH & OPERATIONAL DIAGNOSTICS
          ======================================================== */}
      {activeTab === 'health' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="floxa-card p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Database Connectivity</span>
                <HardDrive size={16} className="text-[#0084ff]" />
              </div>
              <div className="text-xl font-mono font-black text-slate-900">
                {healthData?.database?.status === 'connected' ? 'Connected ✓' : 'Disconnected ✗'}
              </div>
              <div className="text-xs text-slate-500">
                Roundtrip Ping Latency: <strong className="text-slate-800 font-mono">{healthData?.database?.pingLatencyMs ?? '...'}</strong>
              </div>
            </div>

            <div className="floxa-card p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Memory Allocation</span>
                <Cpu size={16} className="text-emerald-600" />
              </div>
              <div className="text-xl font-mono font-black text-slate-900">
                {healthData?.memory?.heapUsedMb ?? 0} MB / {healthData?.memory?.heapTotalMb ?? 0} MB
              </div>
              <div className="text-xs text-slate-500">
                RSS: <strong className="text-slate-800 font-mono">{healthData?.memory?.rssMb ?? 0} MB</strong>
              </div>
            </div>

            <div className="floxa-card p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Process Uptime</span>
                <Clock size={16} className="text-amber-500" />
              </div>
              <div className="text-xl font-mono font-black text-slate-900">
                {Math.floor((healthData?.uptimeSeconds ?? 0) / 60)} minutes
              </div>
              <div className="text-xs text-slate-500">
                Node.js: <strong className="text-slate-800 font-mono">{healthData?.nodeVersion ?? '...'}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 10: SECURE EXPORTS
          ======================================================== */}
      {activeTab === 'exports' && (
        <div className="floxa-card p-6 space-y-4 animate-in fade-in">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Platform Data Export Center</h2>
            <p className="text-[11px] text-slate-500">
              Download sanitized operational reports with CSV formula injection defense and audited access.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Users Directory Export</h4>
                <p className="text-[10px] text-slate-500">Full platform participant registry with KYC statuses.</p>
              </div>
              <button
                onClick={() => handleDownloadCsv('users')}
                className="btn-cyan-pill text-xs px-3.5 py-1.5 font-bold inline-flex items-center gap-1"
              >
                <Download size={13} />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Contract Agreements Export</h4>
                <p className="text-[10px] text-slate-500">Negotiated contractual scopes and closeout states.</p>
              </div>
              <button
                onClick={() => handleDownloadCsv('contracts')}
                className="btn-cyan-pill text-xs px-3.5 py-1.5 font-bold inline-flex items-center gap-1"
              >
                <Download size={13} />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">User-Reported External Payments Export</h4>
                <p className="text-[10px] text-slate-500">Participant-reported bank/UPI settlement records.</p>
              </div>
              <button
                onClick={() => handleDownloadCsv('external-payment-records')}
                className="btn-cyan-pill text-xs px-3.5 py-1.5 font-bold inline-flex items-center gap-1"
              >
                <Download size={13} />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Disputes & Moderation Log Export</h4>
                <p className="text-[10px] text-slate-500">Documented disputes and resolution statuses.</p>
              </div>
              <button
                onClick={() => handleDownloadCsv('moderation')}
                className="btn-cyan-pill text-xs px-3.5 py-1.5 font-bold inline-flex items-center gap-1"
              >
                <Download size={13} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
