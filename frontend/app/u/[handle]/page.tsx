'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  Star,
  Zap,
  Package,
  ShieldCheck,
  Check,
  ExternalLink,
  Share2,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Briefcase,
  MapPin,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { fetchFreelancerDetailsApi, getAuthUser, orderInstantPackageApi } from '@/lib/api';

export default function PublicTalentProfilePage() {
  const params = useParams();
  const handle = params?.handle as string;

  const [talentData, setTalentData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Instant Package Hire Modal State
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [packageOrderNote, setPackageOrderNote] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const currentUser = getAuthUser();

  useEffect(() => {
    if (!handle) return;
    setIsLoading(true);
    fetchFreelancerDetailsApi(handle)
      .then((data) => {
        if (data && (data.profile || data.freelancer)) {
          setTalentData(data.profile || data.freelancer || data);
        } else {
          setError('Specialist profile not found.');
        }
      })
      .catch((err) => {
        setError(err.message || 'Specialist profile not found.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [handle]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleOrderPackage = async () => {
    if (!currentUser) {
      // Redirect or store intended package in localStorage
      localStorage.setItem('floxa_pending_order', JSON.stringify({
        freelancerId: talentData?.userId?._id || talentData?.userId?.id,
        package: selectedPackage,
      }));
      window.location.href = '/';
      return;
    }

    if (currentUser.role !== 'client' && currentUser.role !== 'admin') {
      alert('Only client accounts can place instant package orders.');
      return;
    }

    setIsOrdering(true);
    try {
      await orderInstantPackageApi({
        freelancerId: talentData.userId?._id || talentData.userId?.id,
        packageTitle: selectedPackage.title,
        price: selectedPackage.price,
        deliveryDays: selectedPackage.deliveryDays || 5,
        deliverables: selectedPackage.deliverables || [selectedPackage.title],
        briefNote: packageOrderNote,
      });
      setOrderSuccess('Order successfully placed! Milestone 1 has been initialized in your active workspace.');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to place package order');
    } finally {
      setIsOrdering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-500">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-[#0084ff] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !talentData) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <Briefcase size={28} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Specialist Profile Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          The requested profile @{handle} does not exist or has been made private.
        </p>
        <a href="/" className="btn-cyan-pill text-xs px-5 py-2">
          Return to Marketplace
        </a>
      </div>
    );
  }

  const user = talentData.userId || {};
  const name = user.name || 'Verified Specialist';
  const userHandle = user.handle || handle;
  const avatar = user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80';
  const headline = talentData.headline || 'Creative & Technical Consultant';
  const bio = talentData.bio || 'Delivering high-caliber specialized outcomes with non-custodial milestone governance.';
  const skills = talentData.skills || ['Brand Identity', 'Design Systems', 'Figma', 'UI/UX'];
  const hourlyRate = talentData.hourlyRate || 85;
  const services = talentData.services && talentData.services.length > 0 ? talentData.services : [
    {
      title: 'Brand Identity & Visual System Kit',
      description: 'Comprehensive brand identity sprint: vector logos, typography hierarchy, and Figma color tokens.',
      price: 1200,
      deliveryDays: 5,
      deliverables: [
        'Vector Logo Master Files (SVG, AI, PNG)',
        'Brand Style Guide & Token Spec PDF',
        'Typography & Color Palette Tokens',
        'Social Media Kit & Favicon Suite',
      ],
    },
    {
      title: 'High-Conversion SaaS UI/UX Sprint',
      description: '5 core desktop & mobile screen designs in Figma with clickable prototype and dev handoff specs.',
      price: 1800,
      deliveryDays: 7,
      deliverables: [
        '5 Production-Ready Screen Designs',
        'Interactive Clickable Figma Prototype',
        'Atomic UI Component Library',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-16">
      {/* Top Floating Navigation */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-8 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img
              src="/image/FLOXA_log.png"
              alt="FLOXA"
              className="h-[22px] w-auto object-contain brightness-0"
            />
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#0084ff] text-white tracking-widest uppercase">
              WORK
            </span>
          </a>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 bg-white shadow-xs inline-flex items-center gap-1.5 transition-all"
            >
              <Share2 size={13} />
              <span>{copiedLink ? 'Link Copied!' : 'Share Profile'}</span>
            </button>

            <a
              href="/"
              className="btn-cyan-pill text-xs px-4 py-1.5 shadow-xs"
            >
              {currentUser ? 'My Workspace' : 'Sign In / Hire'}
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        
        {/* Profile Hero Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
          {/* Subtle Ambient Background */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#0084ff]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              <div className="relative">
                <img
                  src={avatar}
                  alt={name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-lg ring-2 ring-[#0084ff]/30"
                />
                <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" title="Online & Available" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{name}</h1>
                  <CheckCircle2 size={18} className="text-[#0084ff] shrink-0" />
                </div>
                <div className="text-xs text-slate-500 font-medium flex items-center justify-center sm:justify-start gap-2">
                  <span>@{userHandle}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin size={11} className="text-slate-400" />
                    <span>{talentData.location || 'Remote Global'}</span>
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-700 max-w-xl pt-1">
                  {headline}
                </p>
              </div>
            </div>

            {/* Availability & Rate Card */}
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 shrink-0 gap-2">
              <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Available for Hire</span>
              </div>
              <div className="text-right">
                <div className="text-xl font-extrabold text-slate-900 font-mono">${hourlyRate}/hr</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Standard Rate</div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="pt-2 text-xs text-slate-600 leading-relaxed max-w-3xl">
            {bio}
          </div>

          {/* Skills Tags */}
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
            {skills.map((s: string, idx: number) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700"
              >
                {s}
              </span>
            ))}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-center">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-base font-extrabold text-slate-900 font-mono">
                {talentData.completedContractsCount || 14}
              </div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">Projects Delivered</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-base font-extrabold text-[#0084ff] font-mono">
                ${(talentData.escrowVolumeEarned || 28400).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">Verified Volume</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-base font-extrabold text-amber-500 font-mono flex items-center justify-center gap-1">
                <Star size={14} fill="#f59e0b" />
                <span>{talentData.ratingAverage || '5.0'}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">Client Rating</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-base font-extrabold text-emerald-600 font-mono">100%</div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">Direct Settlement</div>
            </div>
          </div>
        </div>

        {/* Turnkey Service Packages Section (Contra / Fiverr Pro Model) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Zap size={18} className="fill-[#0084ff] text-[#0084ff]" />
                <span>Fixed-Scope Service Packages</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pre-scoped turnkey services ready for 1-click hire with guaranteed milestone delivery.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0084ff] text-xs font-bold">
              <ShieldCheck size={14} />
              <span>Non-Custodial Direct Ledger</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map((pkg: any, idx: number) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">{pkg.title}</h3>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-extrabold text-base text-[#0084ff]">${pkg.price?.toLocaleString()}</div>
                      <div className="text-[10.5px] text-slate-400 font-medium flex items-center gap-1 justify-end">
                        <Clock size={11} />
                        <span>{pkg.deliveryDays || 5} days</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {pkg.description}
                  </p>

                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Included Deliverables:</div>
                    <ul className="text-xs text-slate-700 space-y-1 pl-1">
                      {(pkg.deliverables || []).map((d: string, dIdx: number) => (
                        <li key={dIdx} className="flex items-center gap-1.5 text-[11.5px]">
                          <Check size={12} className="text-emerald-500 shrink-0" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPackage(pkg)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0084ff] hover:bg-[#0070d6] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Zap size={13} className="fill-white" />
                  <span>Order Package (${pkg.price?.toLocaleString()})</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Non-Custodial Direct Ledger Assurance */}
        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-3 text-xs text-emerald-950">
          <ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Zero Platform Escrow Custody: </span>
            <span>
              All contracts created through FLOXA Work operate on direct client-talent milestone verification. Payments are settled directly with zero platform fund holding.
            </span>
          </div>
        </div>
      </main>

      {/* Package Order Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Zap size={18} className="fill-[#0084ff] text-[#0084ff]" />
                <h3 className="text-base font-bold text-slate-900">Instant Package Order</h3>
              </div>
              <button onClick={() => setSelectedPackage(null)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-1.5">
              <div className="flex items-center justify-between font-bold text-xs text-slate-900">
                <span>{selectedPackage.title}</span>
                <span className="font-mono text-sm text-[#0084ff]">${selectedPackage.price?.toLocaleString()}</span>
              </div>
              <div className="text-[11px] text-slate-600">
                Delivery Turnaround: {selectedPackage.deliveryDays || 5} business days with {name}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Project Notes & Requirements
              </label>
              <textarea
                rows={3}
                value={packageOrderNote}
                onChange={(e) => setPackageOrderNote(e.target.value)}
                placeholder="Include website link, brand guidelines URL, or specific turnaround requirements..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0084ff] resize-none"
              />
            </div>

            {orderSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                {orderSuccess}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedPackage(null)}
                className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOrderPackage}
                disabled={isOrdering}
                className="btn-cyan-pill text-xs px-5 py-2 disabled:opacity-50"
              >
                {isOrdering
                  ? 'Initializing...'
                  : currentUser
                  ? `Confirm & Order ($${selectedPackage.price?.toLocaleString()})`
                  : 'Sign In to Complete Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
