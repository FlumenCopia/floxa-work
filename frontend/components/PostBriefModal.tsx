'use client';

import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { createBrief } from '@/lib/api';

interface PostBriefModalProps {
  onClose: () => void;
  onPostSuccess: () => void;
}

export const PostBriefModal: React.FC<PostBriefModalProps> = ({ onClose, onPostSuccess }) => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('branding');
  const [problemStatement, setProblemStatement] = useState('');
  const [speedCraftValue, setSpeedCraftValue] = useState(60);
  const [budgetMin, setBudgetMin] = useState(1500);
  const [budgetMax, setBudgetMax] = useState(3000);
  const [deliverables, setDeliverables] = useState('Logo, Brand Guidelines, Figma Component Library');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const delivList = deliverables
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);

      await createBrief({
        title,
        category,
        problemStatement,
        deliverablesRequired: delivList.length > 0 ? delivList : ['Core Deliverable'],
        budgetMin: Number(budgetMin),
        budgetMax: Number(budgetMax),
        deadlineWeeks: 3,
      });

      onPostSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to publish brief. Ensure you are signed in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg my-auto sm:my-8 rounded-2xl border border-white/90 bg-[rgba(255,255,255,0.96)] p-4 sm:p-6 shadow-[0_24px_70px_rgba(0,132,255,0.18)] text-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <div className="text-xs text-[#0084ff] font-bold tracking-wider uppercase">
              Post Guided Discovery Brief
            </div>
            <p className="text-xs text-slate-500 font-medium">Step {step} of 3</p>
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
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Modern Brand Identity for AI SaaS"
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0084ff] outline-none text-slate-900 shadow-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0084ff] outline-none text-slate-900 shadow-sm"
                >
                  <option value="branding">Brand & Visual Identity</option>
                  <option value="uiux">UI/UX & Product Design</option>
                  <option value="webdev">Full-Stack Web Development</option>
                  <option value="marketing">Growth & Performance Marketing</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1">
                  Core Business Problem to Solve
                </label>
                <textarea
                  required
                  rows={4}
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  placeholder="Explain the actual problem, target audience, and business context..."
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0084ff] outline-none text-slate-900 leading-relaxed resize-none shadow-sm"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!title || !problemStatement) {
                      setError('Please enter a title and problem description.');
                      return;
                    }
                    setError(null);
                    setStep(2);
                  }}
                  className="btn-cyan-pill text-xs px-5 py-2"
                >
                  Continue to Alignment Sliders
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Speed / MVP</span>
                  <span className="text-[#0084ff] font-bold font-mono">{speedCraftValue}% High Craft</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={speedCraftValue}
                  onChange={(e) => setSpeedCraftValue(Number(e.target.value))}
                  className="w-full accent-[#0084ff]"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1">Required Deliverables (comma-separated)</label>
                <input
                  type="text"
                  value={deliverables}
                  onChange={(e) => setDeliverables(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0084ff] outline-none text-slate-900 shadow-sm"
                />
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-dark-pill text-xs px-4 py-2"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn-cyan-pill text-xs px-5 py-2"
                >
                  Set Milestone Budget
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1">Min Budget ($)</label>
                  <input
                    type="number"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(Number(e.target.value))}
                    className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0084ff] outline-none text-slate-900 font-mono shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1">Max Budget ($)</label>
                  <input
                    type="number"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(Number(e.target.value))}
                    className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0084ff] outline-none text-slate-900 font-mono shadow-sm"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 space-y-1">
                <div className="text-[#0084ff] font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={13} />
                  <span>Direct Milestone Billing (Same as FLOXA Design)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                  Clients pay directly per milestone upon deliverable approval. Platform holds zero funds.
                </p>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-dark-pill text-xs px-4 py-2"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-cyan-pill text-xs px-6 py-2"
                >
                  {isSubmitting ? 'Publishing to DB...' : 'Publish Brief to Marketplace'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
