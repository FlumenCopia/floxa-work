'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Layers,
  FileCheck,
} from 'lucide-react';
import { fetchActiveContract, fetchMyContracts, getAuthUser } from '@/lib/api';

export const PaymentLedgerView: React.FC = () => {
  const [contractData, setContractData] = useState<{ contract: any; milestones: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentUser = getAuthUser();
  const isClient = currentUser?.role === 'client';

  useEffect(() => {
    async function loadLedger() {
      setIsLoading(true);
      try {
        const data = await fetchActiveContract();
        if (data && data.contract && data.milestones) {
          setContractData(data);
        } else {
          setContractData(null);
        }
      } catch {
        setContractData(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadLedger();
  }, []);

  if (isLoading) {
    return (
      <div className="floxa-card py-16 text-center text-slate-500">
        <div className="inline-block animate-spin w-6 h-6 border-2 border-[#0084ff] border-t-transparent rounded-full mb-3" />
        <div className="text-xs font-medium">Loading live payment ledger from database...</div>
      </div>
    );
  }

  const contract = contractData?.contract;
  const milestones = contractData?.milestones || [];

  const totalPaid = milestones
    .filter((m: any) => m.escrowState === 'released')
    .reduce((sum: number, m: any) => sum + (m.amount || 0), 0);

  const pendingReview = milestones
    .filter((m: any) => m.escrowState === 'in_review')
    .reduce((sum: number, m: any) => sum + (m.amount || 0), 0);

  const awaitingDeposit = milestones
    .filter((m: any) => m.escrowState === 'awaiting_deposit')
    .reduce((sum: number, m: any) => sum + (m.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {isClient ? 'Direct Payment Dispatches & Audit' : 'Direct Milestone Earnings & Receipts'}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            FLOXA Work Direct Milestone Billing â€” 0% platform escrow custody. All payments transfer directly between client and talent.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
          <ShieldCheck size={15} className="text-emerald-600" />
          <span>Zero Escrow Custody</span>
        </div>
      </div>

      {/* 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="kpi-card">
          <div className="kpi-icon-wrap">
            <Wallet size={18} />
          </div>
          <div>
            <div className="kpi-label">{isClient ? 'Total Paid Directly' : 'Total Earned Directly'}</div>
            <div className="kpi-value text-[#0084ff]">${totalPaid.toLocaleString()}</div>
            <div className="kpi-sub">Released directly upon milestone approval</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap">
            <Clock size={18} />
          </div>
          <div>
            <div className="kpi-label">Under Inspection Window</div>
            <div className="kpi-value">${pendingReview.toLocaleString()}</div>
            <div className="kpi-sub">Handover deliverables under review</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap">
            <Layers size={18} />
          </div>
          <div>
            <div className="kpi-label">Scheduled Milestones</div>
            <div className="kpi-value">${awaitingDeposit.toLocaleString()}</div>
            <div className="kpi-sub">Final handover & asset delivery</div>
          </div>
        </div>
      </div>

      {/* Milestone Direct Billing Transaction Table */}
      <div className="floxa-card p-0 overflow-hidden space-y-0">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck size={16} className="text-[#0084ff]" />
            <span className="text-xs font-bold text-slate-900">
              Contract Milestone Audit Records
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono font-medium">
            {milestones.length} Milestones
          </span>
        </div>

        {milestones.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No milestone transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Milestone</th>
                  <th className="py-3 px-4">Deliverable Title</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Reference</th>
                  <th className="py-3 px-4">Billing Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {milestones.map((m: any) => {
                  const isReleased = m.escrowState === 'released';
                  const isInReview = m.escrowState === 'in_review';

                  return (
                    <tr key={m._id || m.id || m.milestoneNumber} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        Milestone {m.milestoneNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{m.title}</div>
                        <div className="text-[10.5px] text-slate-400">
                          {contract?.briefId?.title || 'Active Contract'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0084ff] whitespace-nowrap">
                        ${m.amount?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[10.5px] text-slate-500 whitespace-nowrap">
                        {m.paymentGatewayRef || 'â€”'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isReleased ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 size={11} />
                            Paid Directly
                          </span>
                        ) : isInReview ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 inline-flex items-center gap-1">
                            <Clock size={11} />
                            Under Review
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Awaiting Handover
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isReleased ? (
                          <button
                            onClick={() => alert(`Direct Payment Receipt for Milestone ${m.milestoneNumber}\nRef: ${m.paymentGatewayRef || 'DIRECT_PAY_VERIFIED'}\nAmount: $${m.amount}\nStatus: Settled directly`)}
                            className="text-[#0084ff] hover:underline font-bold text-xs inline-flex items-center gap-1"
                          >
                            <span>Receipt</span>
                            <ExternalLink size={11} />
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">â€”</span>
                        )}
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
};

