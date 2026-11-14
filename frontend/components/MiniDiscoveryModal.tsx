'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { submitProposal } from '@/lib/api';

interface MiniDiscoveryModalProps {
  brief: any | null;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export const MiniDiscoveryModal: React.FC<MiniDiscoveryModalProps> = ({
  brief,
  onClose,
  onSubmitSuccess,
}) => {
  if (!brief) return null;

  const [diagnosticQ1, setDiagnosticQ1] = useState('');
  const [craftSlider, setCraftSlider] = useState(80);
  const [totalBidPrice, setTotalBidPrice] = useState(
    brief.budgetMin ? Math.round(brief.budgetMin + (brief.budgetMax - brief.budgetMin) / 2) : 2400
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const briefId = brief._id || brief.id;
      const m1 = Math.round(Number(totalBidPrice) * 0.4);
      const m2 = Math.round(Number(totalBidPrice) * 0.4);
      const m3 = Number(totalBidPrice) - m1 - m2;

      await submitProposal({
        briefId,
        diagnosticAnswers: [
          {
            question: 'Problem Diagnosis',
            answer: diagnosticQ1,
          },
        ],
        strategicSliders: [{ key: 'craft_direction', value: craftSlider }],
        proposedMilestones: [
          { title: 'Milestone 1: Discovery & Concept Exploration', amount: m1, deliveryDays: 7, estimatedDays: 7 },
          { title: 'Milestone 2: Production & Asset Engineering', amount: m2, deliveryDays: 7, estimatedDays: 7 },
          { title: 'Milestone 3: Final Delivery & Handover', amount: m3, deliveryDays: 7, estimatedDays: 7 },
        ],
        totalPrice: Number(totalBidPrice),
        estimatedDays: 21,
      });

      onSubmitSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit proposal. Please ensure you are signed in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl my-auto sm:my-8 rounded-2xl border border-white/90 bg-[rgba(255,255,255,0.96)] p-4 sm:p-6 shadow-[0_24px_70px_rgba(0,132,255,0.18)] text-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <div className="text-xs text-[#0084ff] font-bold tracking-wider uppercase">
              The Mini-Discovery Pitch
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">{brief.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section 1: Problem Diagnosis */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#0084ff] uppercase tracking-wider">
              1. Problem Diagnosis
            </h3>
            <textarea
              required
              rows={3}
              value={diagnosticQ1}
              onChange={(e) => setDiagnosticQ1(e.target.value)}
              placeholder="State your clear diagnosis of the client's problem statement..."
              className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0084ff] outline-none text-slate-900 leading-relaxed resize-none shadow-sm"
            />
          </div>

          {/* Section 2: Execution Direction Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Execution Direction</span>
              <span className="text-[#0084ff] font-bold font-mono">{craftSlider}% Consumer Friendly</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={craftSlider}
              onChange={(e) => setCraftSlider(Number(e.target.value))}
              className="w-full accent-[#0084ff]"
            />
          </div>

          {/* Section 3: Bid & Milestones */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1">Total Bid Price ($)</label>
              <input
                type="number"
                value={totalBidPrice}
                onChange={(e) => setTotalBidPrice(Number(e.target.value))}
                className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0084ff] outline-none text-slate-900 font-mono font-bold shadow-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1">Direct Milestones</label>
              <div className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 shadow-sm font-medium">
                40% Advance • 40% Mid • 20% Final
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="btn-dark-pill text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-cyan-pill text-xs px-6 py-2"
            >
              {isSubmitting ? 'Saving to Database...' : 'Submit Proposal to Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
