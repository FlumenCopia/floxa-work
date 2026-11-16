'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { createBrief } from '@/lib/api';
import { CURRENCY_OPTIONS, getCurrencySymbol } from '@/lib/currency';

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
  const [currency, setCurrency] = useState('USD');
  const [budgetMin, setBudgetMin] = useState(1500);
  const [budgetMax, setBudgetMax] = useState(3000);
  const [deliverables, setDeliverables] = useState('Logo, Brand Guidelines, Figma Component Library');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isStep1Valid = title.trim().length >= 5 && problemStatement.trim().length >= 20;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (budgetMax < budgetMin) {
      setError('Maximum budget must be greater than or equal to minimum budget.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const delivList = deliverables
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);

      await createBrief({
        title: title.trim(),
        category,
        problemStatement: problemStatement.trim(),
        deliverablesRequired: delivList.length > 0 ? delivList : ['Core Deliverable'],
        budgetMin: Number(budgetMin),
        budgetMax: Number(budgetMax),
        currency,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg my-auto sm:my-8 rounded-3xl border border-white/90 bg-white/95 p-5 sm:p-6 shadow-2xl text-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="text-[11px] text-[#0084ff] font-extrabold tracking-widest uppercase">
              Guided Discovery Brief
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              {step === 1 && '1. Project Scope & Diagnostic Problem'}
              {step === 2 && '2. Strategic Alignment & Deliverables'}
              {step === 3 && '3. Milestone Budget & Guidelines'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="space-y-1">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step >= s ? 'bg-[#0084ff]' : 'bg-slate-200'
                }`}
              />
              <div className="text-[10px] text-slate-400 font-semibold text-center hidden sm:block">
                {s === 1 ? 'Scope' : s === 2 ? 'Alignment' : 'Budget'}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {step === 1 && (
            <div className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-700 font-bold block">Project Title</label>
                  <span className="text-[10.5px] text-slate-400 font-mono">{title.length}/100</span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Modern Brand Identity & Design System for AI SaaS"
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0084ff] focus:bg-white outline-none text-slate-900 shadow-2xs transition-all"
                />
                {title.length > 0 && title.length < 5 && (
                  <span className="text-[10px] text-amber-600 font-medium">Title must be at least 5 characters.</span>
                )}
              </div>

              <div>
                <label className="text-xs text-slate-700 font-bold block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0084ff] focus:bg-white outline-none text-slate-900 shadow-2xs font-medium transition-all"
                >
                  <option value="branding">Brand & Visual Identity</option>
                  <option value="uiux">UI/UX & Product Design</option>
                  <option value="webdev">Full-Stack Web Development</option>
                  <option value="marketing">Growth & Performance Marketing</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-700 font-bold block">
                    Core Business Problem to Solve
                  </label>
                  <span className="text-[10.5px] text-slate-400 font-mono">{problemStatement.length}/1000</span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  placeholder="Explain the actual problem, audience pain points, technical goals, and business context so freelancers can provide real strategic diagnoses..."
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0084ff] focus:bg-white outline-none text-slate-900 leading-relaxed resize-none shadow-2xs transition-all"
                />
                {problemStatement.length > 0 && problemStatement.length < 20 && (
                  <span className="text-[10px] text-amber-600 font-medium">Please provide at least 20 characters describing the problem.</span>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={!isStep1Valid}
                  onClick={() => {
                    setError(null);
                    setStep(2);
                  }}
                  className="btn-cyan-pill text-xs px-5 py-2.5 flex items-center gap-1.5 shadow-xs disabled:opacity-40"
                >
                  <span>Continue to Alignment</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-bold">Speed / MVP vs. High Craft</span>
                  <span className="text-[#0084ff] font-extrabold font-mono">{speedCraftValue}% High Craft</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={speedCraftValue}
                  onChange={(e) => setSpeedCraftValue(Number(e.target.value))}
                  className="w-full accent-[#0084ff]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Fast Delivery / Lean MVP</span>
                  <span>Institutional High Polish</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-700 font-bold block mb-1">
                  Required Deliverables (comma-separated)
                </label>
                <input
                  type="text"
                  value={deliverables}
                  onChange={(e) => setDeliverables(e.target.value)}
                  placeholder="e.g. Design System, User Flows, Prototype"
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0084ff] focus:bg-white outline-none text-slate-900 shadow-2xs transition-all"
                />
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-dark-pill text-xs px-4 py-2 flex items-center gap-1.5"
                >
                  <ArrowLeft size={13} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn-cyan-pill text-xs px-5 py-2 flex items-center gap-1.5"
                >
                  <span>Set Milestone Budget</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {/* Currency Selector */}
              <div>
                <label className="text-xs text-slate-700 font-bold block mb-1">Project Contractual Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0084ff] focus:bg-white outline-none text-slate-900 font-medium shadow-2xs"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10.5px] text-slate-400 mt-1">
                  Proposals and agreed milestones will be bound to this currency.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">
                    Min Budget ({getCurrencySymbol(currency)})
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(Number(e.target.value))}
                    className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0084ff] focus:bg-white outline-none text-slate-900 font-mono shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">
                    Max Budget ({getCurrencySymbol(currency)})
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(Number(e.target.value))}
                    className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0084ff] focus:bg-white outline-none text-slate-900 font-mono shadow-2xs"
                  />
                </div>
              </div>

              {budgetMax < budgetMin && (
                <div className="text-[11px] text-rose-600 font-medium">
                  Max budget must be greater than or equal to minimum budget.
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-slate-700 space-y-1.5 leading-relaxed">
                <div className="text-[#0084ff] font-bold flex items-center gap-1.5 text-xs">
                  <ShieldCheck size={14} />
                  <span>Direct Milestone Settlement (0% Platform Custody)</span>
                </div>
                <p className="text-[11px] text-slate-600 font-normal">
                  Clients disburse funds directly per milestone upon deliverable signoff. FLOXA Work does not collect, hold, process, transfer, or verify payments.
                </p>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-dark-pill text-xs px-4 py-2 flex items-center gap-1.5"
                >
                  <ArrowLeft size={13} />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || budgetMax < budgetMin}
                  className="btn-cyan-pill text-xs px-6 py-2.5 shadow-md flex items-center gap-2 disabled:opacity-40"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Publishing Brief...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Publish Brief to Marketplace</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
