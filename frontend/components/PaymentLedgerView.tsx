'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ExternalLink,
  Layers,
  FileCheck,
  CreditCard,
  Receipt,
  AlertTriangle,
} from 'lucide-react';
import { fetchActiveContract, getAuthUser } from '@/lib/api';

export const PaymentLedgerView: React.FC = () => {
  const [contractData, setContractData] = useState<{
    contract: any;
    milestones: any[];
    paymentRecords?: any[];
  } | null>(null);
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
  const paymentRecords = contractData?.paymentRecords || [];

  const totalAcknowledged = milestones
    .filter((m: any) => m.paymentStatus === 'acknowledged_by_freelancer' || m.escrowState === 'released')
    .reduce((sum: number, m: any) => sum + (m.amount || 0), 0);

  const totalReported = milestones
    .filter((m: any) => m.paymentStatus === 'reported_by_client')
    .reduce((sum: number, m: any) => sum + (m.amount || 0), 0);

  const totalPending = milestones
    .filter((m: any) => m.paymentStatus === 'not_recorded' || !m.paymentStatus)
    .reduce((sum: number, m: any) => sum + (m.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {isClient ? 'Direct Payment Dispatches & Audit Records' : 'Direct Milestone Earnings & Payment Audit'}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            FLOXA Work Direct Milestone Billing — 0% platform custody. All payments are settled directly between client and talent.
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
            <div className="kpi-label">{isClient ? 'Direct Payments Confirmed' : 'Total Earned Directly'}</div>
            <div className="kpi-value text-emerald-600">${totalAcknowledged.toLocaleString()}</div>
            <div className="kpi-sub">Acknowledged received by freelancer</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap">
            <Clock size={18} />
          </div>
          <div>
            <div className="kpi-label">Reported by Client</div>
            <div className="kpi-value text-[#0084ff]">${totalReported.toLocaleString()}</div>
            <div className="kpi-sub">Awaiting talent bank confirmation</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap">
            <Layers size={18} />
          </div>
          <div>
            <div className="kpi-label">Pending Delivery / Next Milestones</div>
            <div className="kpi-value">${totalPending.toLocaleString()}</div>
            <div className="kpi-sub">Remaining project value</div>
          </div>
        </div>
      </div>

      {/* Milestone Direct Billing Transaction Table */}
      <div className="floxa-card p-0 overflow-hidden space-y-0">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck size={16} className="text-[#0084ff]" />
            <span className="text-xs font-bold text-slate-900">
              Direct Milestone Settlement Records
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
                  <th className="py-3 px-4">Agreed Amount</th>
                  <th className="py-3 px-4">Deliverable State</th>
                  <th className="py-3 px-4">Payment Record State</th>
                  <th className="py-3 px-4">Method & UTR</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {milestones.map((m: any) => {
                  const isApproved = m.deliverableStatus === 'approved' || m.escrowState === 'released';
                  const isInReview = m.deliverableStatus === 'in_review' || m.escrowState === 'in_review';
                  const isAcknowledged = m.paymentStatus === 'acknowledged_by_freelancer' || m.escrowState === 'released';
                  const isReported = m.paymentStatus === 'reported_by_client';
                  const isDisputed = m.paymentStatus === 'disputed';

                  const record = paymentRecords.find((p: any) => p.milestoneId?.toString() === (m._id || m.id)?.toString());

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
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        ${m.amount?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isApproved ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 size={11} className="text-emerald-600" />
                            Deliverable Approved
                          </span>
                        ) : isInReview ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200 inline-flex items-center gap-1">
                            <Clock size={11} className="text-sky-600" />
                            Under Review
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200">
                            In Progress
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isAcknowledged ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 size={11} className="text-emerald-600" />
                            Confirmed by Talent
                          </span>
                        ) : isReported ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200 inline-flex items-center gap-1">
                            <Clock size={11} className="text-sky-600" />
                            Reported by Client
                          </span>
                        ) : isDisputed ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-800 border border-red-200 inline-flex items-center gap-1">
                            <AlertTriangle size={11} className="text-red-600" />
                            Disputed
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-50 text-slate-500 border border-slate-200">
                            Not Yet Recorded
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[10.5px] text-slate-600 whitespace-nowrap">
                        {record?.paymentMethod ? (
                          <div>
                            <span className="capitalize font-semibold">{record.paymentMethod.replace('_', ' ')}</span>
                            {record.externalReference && (
                              <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                                {record.externalReference}
                              </div>
                            )}
                          </div>
                        ) : m.paymentDetails?.paymentMethod ? (
                          <div>
                            <span className="capitalize font-semibold">{m.paymentDetails.paymentMethod.replace('_', ' ')}</span>
                            {m.paymentDetails.externalReference && (
                              <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                                {m.paymentDetails.externalReference}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {record?.receiptFileUrl || m.paymentDetails?.receiptFileUrl ? (
                          <a
                            href={record?.receiptFileUrl || m.paymentDetails?.receiptFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#0084ff] hover:underline font-bold text-xs inline-flex items-center gap-1"
                          >
                            <span>Receipt</span>
                            <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
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
