'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  Send,
  Sparkles,
  Calendar,
  Briefcase,
  DollarSign,
  ChevronDown,
  X,
  ExternalLink,
  Layers,
  Inbox,
  Clock,
  ArrowUpDown,
  Mail,
  Zap,
  Package,
  Shield,
  Check,
} from 'lucide-react';
import {
  searchFreelancersApi,
  searchProjectsApi,
  fetchSavedFreelancersApi,
  saveFreelancerApi,
  removeSavedFreelancerApi,
  fetchSavedProjectsApi,
  saveProjectApi,
  removeSavedProjectApi,
  sendInvitationApi,
  fetchInvitationsApi,
  acceptInvitationApi,
  declineInvitationApi,
  fetchBriefs,
  getAuthUser,
  orderInstantPackageApi,
} from '@/lib/api';

interface DiscoveryViewProps {
  onOpenPitchModal?: (brief: any) => void;
  onOpenCall?: () => void;
}

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({
  onOpenPitchModal,
  onOpenCall,
}) => {
  const currentUser = getAuthUser();
  const isClient = currentUser?.role === 'client';

  // Active view tab
  const [activeTab, setActiveTab] = useState<'search' | 'recommended' | 'saved' | 'invitations'>('search');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [rateFilter, setRateFilter] = useState<'all' | 'under50' | '50to100' | 'over100'>('all');
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('match');

  // Instant Package Order Modal State
  const [packageModalTalent, setPackageModalTalent] = useState<any | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [packageOrderNote, setPackageOrderNote] = useState<string>('');
  const [isOrderingPackage, setIsOrderingPackage] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  // Data state
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [savedFreelancers, setSavedFreelancers] = useState<any[]>([]);
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [myBriefs, setMyBriefs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Invitation Modal State
  const [inviteModalTalent, setInviteModalTalent] = useState<any | null>(null);
  const [selectedBriefIdForInvite, setSelectedBriefIdForInvite] = useState<string>('');
  const [inviteMessage, setInviteMessage] = useState<string>('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);

  // Match Details Drawer State
  const [selectedMatchExplanation, setSelectedMatchExplanation] = useState<any | null>(null);

  // Load client briefs for invitation dropdown
  useEffect(() => {
    if (isClient) {
      fetchBriefs().then((briefs) => {
        setMyBriefs(briefs || []);
        if (briefs && briefs.length > 0) {
          setSelectedBriefIdForInvite(briefs[0]._id || briefs[0].id);
        }
      });
    }
  }, [isClient]);

  // Load primary data based on active tab
  const loadDiscoveryData = async () => {
    setIsLoading(true);
    try {
      if (isClient) {
        // Client discovers freelancers
        if (activeTab === 'search' || activeTab === 'recommended') {
          let minRate: number | undefined;
          let maxRate: number | undefined;
          if (rateFilter === 'under50') {
            maxRate = 50;
          } else if (rateFilter === '50to100') {
            minRate = 50;
            maxRate = 100;
          } else if (rateFilter === 'over100') {
            minRate = 100;
          }

          const res = await searchFreelancersApi({
            q: searchQuery,
            category: selectedCategory,
            skill: selectedSkill || undefined,
            minRate,
            maxRate,
            availability: availabilityFilter,
            verifiedOnly,
            sortBy,
            briefId: activeTab === 'recommended' && myBriefs[0] ? (myBriefs[0]._id || myBriefs[0].id) : undefined,
          });
          setFreelancers(res.freelancers || []);
        } else if (activeTab === 'saved') {
          const saved = await fetchSavedFreelancersApi();
          setSavedFreelancers(saved);
        } else if (activeTab === 'invitations') {
          const invs = await fetchInvitationsApi('sent');
          setInvitations(invs);
        }
      } else {
        // Freelancer discovers projects
        if (activeTab === 'search' || activeTab === 'recommended') {
          const res = await searchProjectsApi({
            q: searchQuery,
            category: selectedCategory,
            sortBy: activeTab === 'recommended' ? 'proposals' : sortBy,
          });
          setProjects(res.projects || []);
        } else if (activeTab === 'saved') {
          const saved = await fetchSavedProjectsApi();
          setSavedProjects(saved);
        } else if (activeTab === 'invitations') {
          const invs = await fetchInvitationsApi('received');
          setInvitations(invs);
        }
      }
    } catch (err) {
      console.error('[Discovery Load Error]:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDiscoveryData();
    }, 250);
    return () => clearTimeout(timer);
  }, [activeTab, searchQuery, selectedCategory, availabilityFilter, rateFilter, selectedSkill, verifiedOnly, sortBy, isClient]);

  // Handle Instant Package Order
  const handleOrderPackage = async () => {
    if (!packageModalTalent || !selectedPackage) return;
    setIsOrderingPackage(true);
    setOrderSuccessMsg(null);
    try {
      const talentUserId = packageModalTalent.userId?._id || packageModalTalent.userId?.id;
      await orderInstantPackageApi({
        freelancerId: talentUserId,
        packageTitle: selectedPackage.title,
        price: selectedPackage.price,
        deliveryDays: selectedPackage.deliveryDays || 5,
        deliverables: selectedPackage.deliverables || [selectedPackage.title],
        briefNote: packageOrderNote,
      });
      setOrderSuccessMsg('Package order placed successfully! Project Contract & Milestone 1 initialized.');
      setTimeout(() => {
        setPackageModalTalent(null);
        setSelectedPackage(null);
        setOrderSuccessMsg(null);
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to place package order');
    } finally {
      setIsOrderingPackage(false);
    }
  };

  // Handle Save / Unsave Freelancer
  const handleToggleSaveFreelancer = async (freelancerId: string) => {
    const isSaved = savedFreelancers.some((p) => p.userId?._id === freelancerId || p.userId?.id === freelancerId);
    try {
      if (isSaved) {
        await removeSavedFreelancerApi(freelancerId);
        setSavedFreelancers(savedFreelancers.filter((p) => (p.userId?._id || p.userId?.id) !== freelancerId));
      } else {
        await saveFreelancerApi(freelancerId);
        loadDiscoveryData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update saved talent');
    }
  };

  // Handle Save / Unsave Project
  const handleToggleSaveProject = async (projectId: string) => {
    const isSaved = savedProjects.some((b) => (b._id || b.id) === projectId);
    try {
      if (isSaved) {
        await removeSavedProjectApi(projectId);
        setSavedProjects(savedProjects.filter((b) => (b._id || b.id) !== projectId));
      } else {
        await saveProjectApi(projectId);
        loadDiscoveryData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save project');
    }
  };

  // Handle Send Project Invitation
  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBriefIdForInvite || !inviteModalTalent) return;
    setIsSendingInvite(true);
    setInviteFeedback(null);
    try {
      const talentUserId = inviteModalTalent.userId?._id || inviteModalTalent.userId?.id;
      await sendInvitationApi(selectedBriefIdForInvite, talentUserId, inviteMessage);
      setInviteFeedback('Invitation dispatched successfully! The consultant will be notified.');
      setTimeout(() => {
        setInviteModalTalent(null);
        setInviteFeedback(null);
      }, 1500);
    } catch (err: any) {
      setInviteFeedback(err.message || 'Failed to send invitation');
    } finally {
      setIsSendingInvite(false);
    }
  };

  // Handle Invitation Acceptance / Decline
  const handleAcceptInvite = async (invitationId: string) => {
    try {
      await acceptInvitationApi(invitationId);
      loadDiscoveryData();
    } catch (err: any) {
      alert(err.message || 'Failed to accept invitation');
    }
  };

  const handleDeclineInvite = async (invitationId: string) => {
    try {
      await declineInvitationApi(invitationId);
      loadDiscoveryData();
    } catch (err: any) {
      alert(err.message || 'Failed to decline invitation');
    }
  };

  const categories = [
    { id: 'all', label: 'All Fields' },
    { id: 'branding', label: 'Branding & Identity' },
    { id: 'uiux', label: 'UI / UX Design' },
    { id: 'webdev', label: 'Web Engineering' },
    { id: 'mobile', label: 'Mobile Architecture' },
    { id: 'consulting', label: 'Strategy Consulting' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Mode Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0084ff] bg-[#0084ff]/10 px-2 py-0.5 rounded-md">
              Discovery Engine
            </span>
            <span className="text-xs text-slate-400 font-medium">•</span>
            <span className="text-xs text-slate-500 font-medium">
              {isClient ? 'Intelligent Talent Discovery' : 'Opportunity Discovery'}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
            {isClient ? 'Discover & Match Verified Consultants' : 'Explore Open Discovery Briefs'}
          </h2>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none self-start sm:self-auto bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'search' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isClient ? 'Explore Talent' : 'Explore Briefs'}
          </button>
          <button
            onClick={() => setActiveTab('recommended')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === 'recommended' ? 'bg-[#0084ff] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles size={12} />
            <span>AI Matches</span>
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'saved' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Saved Items
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'invitations' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Invitations
          </button>
        </div>
      </div>

      {/* Search & Composable Filter Bar */}
      {(activeTab === 'search' || activeTab === 'recommended') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={
                  isClient
                    ? 'Search talent by skill, specialization, headline, or name...'
                    : 'Search briefs by problem statement, deliverables, or keywords...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0084ff] outline-none text-slate-900 shadow-xs font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Quick Sort Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 outline-none font-semibold shadow-xs"
              >
                {isClient ? (
                  <>
                    <option value="match">Sort by Compatibility</option>
                    <option value="rate_asc">Hourly Rate: Low to High</option>
                    <option value="rate_desc">Hourly Rate: High to Low</option>
                    <option value="experience">Years of Experience</option>
                  </>
                ) : (
                  <>
                    <option value="recent">Recently Posted</option>
                    <option value="budget_desc">Highest Budget First</option>
                    <option value="budget_asc">Lowest Budget First</option>
                  </>
                )}
              </select>

              {isClient && (
                <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer shadow-xs select-none">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="accent-[#0084ff] rounded"
                  />
                  <span>Verified Only</span>
                </label>
              )}
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-100">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#0084ff] text-white shadow-xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Rate & Skill Tag Filters for Client View */}
          {isClient && (
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              {/* Rate Range Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Rate:</span>
                {[
                  { id: 'all', label: 'All Rates' },
                  { id: 'under50', label: '< $50/hr' },
                  { id: '50to100', label: '$50 – $100/hr' },
                  { id: 'over100', label: '$100+/hr' },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRateFilter(r.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      rateFilter === r.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Skill Tag Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Skill:</span>
                {[
                  { id: '', label: 'All Skills' },
                  { id: 'Brand Identity', label: 'Brand Identity' },
                  { id: 'Design Systems', label: 'Design Systems' },
                  { id: 'Figma', label: 'Figma' },
                  { id: 'UI/UX Tokens', label: 'UI/UX Tokens' },
                  { id: 'Full-Stack', label: 'Full-Stack' },
                  { id: 'Next.js', label: 'Next.js' },
                ].map((sk) => (
                  <button
                    key={sk.id}
                    onClick={() => setSelectedSkill(sk.id)}
                    className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-medium transition-all whitespace-nowrap ${
                      selectedSkill === sk.id
                        ? 'bg-[#0084ff] text-white shadow-xs font-semibold'
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {sk.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="floxa-card py-16 text-center text-slate-500">
          <div className="inline-block animate-spin w-6 h-6 border-2 border-[#0084ff] border-t-transparent rounded-full mb-3" />
          <div className="text-xs font-medium">Evaluating matching algorithms & indexing results...</div>
        </div>
      )}

      {/* CLIENT VIEW: Freelancer Discovery Grid */}
      {!isLoading && isClient && (activeTab === 'search' || activeTab === 'recommended') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {freelancers.length === 0 ? (
            <div className="col-span-full floxa-card py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0084ff]/10 border border-[#0084ff]/25 flex items-center justify-center mx-auto text-[#0084ff]">
                <Search size={22} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Specialists Matched Your Query</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-normal">
                Try widening your search terms, clearing category filters, or exploring all availability statuses.
              </p>
            </div>
          ) : (
            freelancers.map((talent) => {
              const user = talent.userId || {};
              const name = user.name || 'Verified Specialist';
              const handle = user.handle || 'consultant';
              const avatar = user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80';
              const headline = talent.headline || 'Creative & Technical Consultant';
              const skills = talent.skills || [];
              const rate = talent.hourlyRate || 85;
              const isVerified = user.isVerified;
              const matchResult = talent.matchResult;
              const matchScore = talent.matchScore;
              const isSaved = savedFreelancers.some((s) => s.userId?._id === user._id || s.userId?.id === user.id);

              return (
                <div
                  key={talent._id || talent.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3.5"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={avatar}
                            alt={name}
                            className="w-12 h-12 rounded-full object-cover border border-[#0084ff]/30 shadow-xs"
                          />
                          {isVerified && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#0084ff] text-white flex items-center justify-center">
                              <CheckCircle2 size={11} strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 truncate">{name}</h3>
                          <div className="text-[11px] text-slate-500 font-medium truncate">
                            @{handle} • {talent.location || 'Remote'}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleSaveFreelancer(user._id || user.id)}
                        className={`p-1.5 rounded-xl border transition-colors ${
                          isSaved
                            ? 'bg-amber-50 border-amber-300 text-amber-600'
                            : 'bg-white border-slate-200 text-slate-400 hover:text-amber-500'
                        }`}
                        title={isSaved ? 'Saved' : 'Save consultant'}
                      >
                        {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                      </button>
                    </div>

                    {/* Headline */}
                    <p className="text-xs text-slate-700 font-medium line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {headline}
                    </p>

                    {/* Match Score Badge (If Brief context present) */}
                    {matchResult && (
                      <div
                        onClick={() => setSelectedMatchExplanation(matchResult)}
                        className="cursor-pointer bg-blue-50/90 hover:bg-blue-100/80 p-2 rounded-xl border border-blue-200/80 text-[11px] space-y-1 transition-all"
                      >
                        <div className="flex items-center justify-between font-bold text-[#0084ff]">
                          <span className="flex items-center gap-1">
                            <Sparkles size={12} />
                            <span>{matchResult.ratingTier}</span>
                          </span>
                          <span className="font-mono text-xs font-extrabold">{matchResult.overallScore}% Match</span>
                        </div>
                        <p className="text-slate-600 text-[10.5px] line-clamp-1">{matchResult.explanationSummary}</p>
                      </div>
                    )}

                    {/* Skills Tags */}
                    <div className="flex flex-wrap gap-1">
                      {skills.slice(0, 4).map((sk: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/70 text-slate-700 text-[10.5px] font-medium"
                        >
                          {sk}
                        </span>
                      ))}
                      {skills.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded-md text-slate-400 text-[10.5px] font-medium">
                          +{skills.length - 4}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer with Rate and Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Rate</div>
                      <div className="text-xs font-extrabold text-slate-900 font-mono">
                        ${rate}/hr
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setPackageModalTalent(talent);
                          setSelectedPackage(
                            talent.services?.[0] || {
                              title: 'Brand Identity & Visual System Kit',
                              description: 'Vector logo files, complete brand guidelines PDF, typography hierarchy & Figma color tokens.',
                              price: 1200,
                              deliveryDays: 5,
                              deliverables: [
                                'Vector Logo Master Files (SVG, AI, PNG)',
                                'Brand Style Guide & Token Spec PDF',
                                'Typography & Color Palette Tokens',
                                'Social Media Kit & Favicon Suite',
                              ],
                            }
                          );
                          setPackageOrderNote('');
                          setOrderSuccessMsg(null);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0084ff] border border-blue-200 text-xs font-bold inline-flex items-center gap-1 transition-all"
                        title="Fixed-scope turnkey packages"
                      >
                        <Zap size={12} className="fill-[#0084ff]" />
                        <span>Packages</span>
                      </button>
                      <button
                        onClick={() => {
                          setInviteModalTalent(talent);
                          setInviteFeedback(null);
                        }}
                        className="btn-cyan-pill text-xs px-3 py-1.5 shadow-xs"
                      >
                        <Send size={12} />
                        <span>Invite</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* FREELANCER VIEW: Project Discovery Grid */}
      {!isLoading && !isClient && (activeTab === 'search' || activeTab === 'recommended') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.length === 0 ? (
            <div className="col-span-full floxa-card py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0084ff]/10 border border-[#0084ff]/25 flex items-center justify-center mx-auto text-[#0084ff]">
                <Briefcase size={22} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Open Projects Matched</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-normal">
                Check back shortly or broaden your category filters to view new discovery briefs.
              </p>
            </div>
          ) : (
            projects.map((brief) => {
              const client = brief.clientId || {};
              const title = brief.title || 'Discovery Brief';
              const problem = brief.problemStatement || 'Problem description...';
              const budget = `$${brief.budgetMin?.toLocaleString()} - $${brief.budgetMax?.toLocaleString()}`;
              const category = brief.category || 'branding';
              const isSaved = savedProjects.some((b) => (b._id || b.id) === (brief._id || brief.id));

              return (
                <div
                  key={brief._id || brief.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3.5"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0084ff] bg-[#0084ff]/10 px-2 py-0.5 rounded-md">
                        {category}
                      </span>
                      <button
                        onClick={() => handleToggleSaveProject(brief._id || brief.id)}
                        className={`p-1.5 rounded-xl border transition-colors ${
                          isSaved
                            ? 'bg-amber-50 border-amber-300 text-amber-600'
                            : 'bg-white border-slate-200 text-slate-400 hover:text-amber-500'
                        }`}
                        title={isSaved ? 'Saved' : 'Save project'}
                      >
                        {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-normal">
                      {problem}
                    </p>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-500 font-medium">Contract Scope</span>
                      <span className="font-extrabold text-slate-900 font-mono">{budget}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-500 font-medium">
                      {brief.proposalsCount || 0} Pitches Submitted
                    </div>
                    <button
                      onClick={() => onOpenPitchModal && onOpenPitchModal(brief)}
                      className="btn-cyan-pill text-xs px-3.5 py-1.5 shadow-xs"
                    >
                      <Sparkles size={12} />
                      <span>Pitch Discovery</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SAVED ITEMS TAB */}
      {!isLoading && activeTab === 'saved' && (
        <div className="space-y-4">
          {isClient ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedFreelancers.length === 0 ? (
                <div className="col-span-full floxa-card py-16 text-center space-y-2">
                  <Bookmark size={24} className="text-slate-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-900">No Saved Professionals</h3>
                  <p className="text-xs text-slate-500">Bookmark talent during search to review them here.</p>
                </div>
              ) : (
                savedFreelancers.map((talent) => (
                  <div key={talent._id || talent.id} className="floxa-card space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={talent.userId?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'}
                          alt={talent.userId?.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="text-sm font-bold text-slate-900">{talent.userId?.name}</div>
                          <div className="text-xs text-slate-500">@{talent.userId?.handle}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleSaveFreelancer(talent.userId?._id || talent.userId?.id)}
                        className="text-amber-500 hover:text-red-500"
                        title="Remove"
                      >
                        <BookmarkCheck size={18} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {talent.headline}
                    </p>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedProjects.length === 0 ? (
                <div className="col-span-full floxa-card py-16 text-center space-y-2">
                  <Bookmark size={24} className="text-slate-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-900">No Saved Briefs</h3>
                  <p className="text-xs text-slate-500">Bookmark discovery briefs to review them here.</p>
                </div>
              ) : (
                savedProjects.map((brief) => (
                  <div key={brief._id || brief.id} className="floxa-card space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">{brief.title}</h4>
                      <button
                        onClick={() => handleToggleSaveProject(brief._id || brief.id)}
                        className="text-amber-500 hover:text-red-500"
                      >
                        <BookmarkCheck size={18} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {brief.problemStatement}
                    </p>
                    <button
                      onClick={() => onOpenPitchModal && onOpenPitchModal(brief)}
                      className="btn-cyan-pill text-xs w-full justify-center py-2"
                    >
                      Pitch Discovery
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* INVITATIONS TAB */}
      {!isLoading && activeTab === 'invitations' && (
        <div className="space-y-4">
          {invitations.length === 0 ? (
            <div className="floxa-card py-16 text-center space-y-2">
              <Mail size={24} className="text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">No Active Invitations</h3>
              <p className="text-xs text-slate-500">
                {isClient ? 'Invitations sent to vetted consultants will appear here.' : 'Direct client invitations to pitch on briefs will appear here.'}
              </p>
            </div>
          ) : (
            invitations.map((inv) => (
              <div key={inv._id || inv.id} className="floxa-card space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <span className="text-[10px] font-bold text-[#0084ff] uppercase tracking-wider">
                      {inv.briefId?.category || 'Brief'}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{inv.briefId?.title || 'Discovery Brief'}</h4>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0084ff] border border-blue-200/60 self-start sm:self-auto">
                    Status: {inv.status}
                  </span>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  "{inv.message}"
                </p>

                {!isClient && inv.status === 'pending' && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleAcceptInvite(inv._id || inv.id)}
                      className="btn-cyan-pill text-xs px-4 py-1.5"
                    >
                      Accept & Pitch
                    </button>
                    <button
                      onClick={() => handleDeclineInvite(inv._id || inv.id)}
                      className="px-3 py-1.5 rounded-full border border-slate-200 text-xs text-slate-600 hover:text-red-600"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* INVITATION MODAL */}
      {inviteModalTalent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-[#0084ff]" />
                <h3 className="text-sm font-bold text-slate-900">Invite Consultant</h3>
              </div>
              <button
                onClick={() => setInviteModalTalent(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Invite <strong className="text-slate-900">{inviteModalTalent.userId?.name}</strong> to submit a structured Mini-Discovery pitch on one of your active project briefs.
            </p>

            <form onSubmit={handleSendInvitation} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Discovery Brief</label>
                {myBriefs.length === 0 ? (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    You do not have any active briefs. Please create a brief first.
                  </div>
                ) : (
                  <select
                    value={selectedBriefIdForInvite}
                    onChange={(e) => setSelectedBriefIdForInvite(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 outline-none"
                  >
                    {myBriefs.map((b) => (
                      <option key={b._id || b.id} value={b._id || b.id}>
                        {b.title} (${b.budgetMin?.toLocaleString()} - ${b.budgetMax?.toLocaleString()})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Custom Message</label>
                <textarea
                  rows={3}
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="We reviewed your design portfolio and would appreciate your diagnostic proposal..."
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-800 leading-relaxed resize-none"
                />
              </div>

              {inviteFeedback && (
                <div className="text-xs p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[#0084ff] font-medium">
                  {inviteFeedback}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInviteModalTalent(null)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingInvite || myBriefs.length === 0}
                  className="btn-cyan-pill text-xs px-5 py-2 disabled:opacity-50"
                >
                  {isSendingInvite ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MATCH BREAKDOWN EXPLANATION MODAL */}
      {selectedMatchExplanation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 max-w-lg w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#0084ff]" />
                <h3 className="text-sm font-bold text-slate-900">Intelligent Match Explanation</h3>
              </div>
              <button
                onClick={() => setSelectedMatchExplanation(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-200 text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-[#0084ff]">
                <span>{selectedMatchExplanation.ratingTier}</span>
                <span className="text-sm font-extrabold font-mono">{selectedMatchExplanation.overallScore}%</span>
              </div>
              <p className="text-slate-700 text-[11px] leading-relaxed">
                {selectedMatchExplanation.explanationSummary}
              </p>
            </div>

            {/* Dimension Breakdown List */}
            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Transparent Dimension Evaluation:
              </span>
              {Object.entries(selectedMatchExplanation.dimensionBreakdown || {}).map(([dim, data]: [string, any]) => (
                <div key={dim} className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-0.5">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span className="capitalize">{dim}</span>
                    <span className="font-mono text-[#0084ff]">{data.score}%</span>
                  </div>
                  <div className="text-[10.5px] text-slate-500">{data.details}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedMatchExplanation(null)}
                className="btn-cyan-pill text-xs px-5 py-2"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSTANT PACKAGE HIRE MODAL (Contra / Fiverr Pro style 1-click hire) */}
      {packageModalTalent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#0084ff]/10 text-[#0084ff] flex items-center justify-center font-bold">
                  <Zap size={18} className="fill-[#0084ff]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Instant Fixed-Scope Hire</h3>
                  <p className="text-[11px] text-slate-500">
                    Direct contract & Milestone 1 with {packageModalTalent.userId?.name || 'Specialist'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPackageModalTalent(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            {/* Packages Selector */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Select Turnkey Service Package
              </label>
              {(packageModalTalent.services && packageModalTalent.services.length > 0
                ? packageModalTalent.services
                : [
                    {
                      title: 'Brand Identity & Visual System Kit',
                      description: 'Vector logo files, complete brand guidelines PDF, typography hierarchy & Figma color tokens.',
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
                  ]
              ).map((pkg: any, idx: number) => {
                const isSelected = selectedPackage?.title === pkg.title;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#0084ff] bg-blue-50/60 shadow-xs ring-1 ring-[#0084ff]'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <Package size={14} className={isSelected ? 'text-[#0084ff]' : 'text-slate-400'} />
                        <span>{pkg.title}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono font-extrabold text-sm text-[#0084ff]">${pkg.price?.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{pkg.deliveryDays || 5} days delivery</div>
                      </div>
                    </div>
                    {pkg.description && (
                      <p className="text-[11px] text-slate-600 mb-2 leading-relaxed">{pkg.description}</p>
                    )}
                    {pkg.deliverables && (
                      <ul className="text-[10.5px] text-slate-500 space-y-1 pl-1">
                        {pkg.deliverables.map((d: string, dIdx: number) => (
                          <li key={dIdx} className="flex items-center gap-1.5">
                            <Check size={11} className="text-emerald-500 shrink-0" />
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Client Note */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Project Notes / Reference Links (Optional)
              </label>
              <textarea
                rows={2}
                value={packageOrderNote}
                onChange={(e) => setPackageOrderNote(e.target.value)}
                placeholder="Include website URL, brand references, or specific target deadlines..."
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-800 resize-none font-medium"
              />
            </div>

            {/* Zero Custody Trust Banner */}
            <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-[11px] flex items-center gap-2 text-emerald-900">
              <Shield size={16} className="text-emerald-600 shrink-0" />
              <span>
                <strong>0% Platform Custody:</strong> Milestone 1 will be initialized for review. Direct verified milestone settlement between you and the specialist.
              </span>
            </div>

            {orderSuccessMsg && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-[#0084ff] font-bold">
                {orderSuccessMsg}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPackageModalTalent(null)}
                className="px-4 py-2 rounded-full border border-slate-200 text-xs text-slate-600 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOrderPackage}
                disabled={isOrderingPackage || !selectedPackage}
                className="btn-cyan-pill text-xs px-5 py-2 disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <Zap size={13} className="fill-white" />
                <span>
                  {isOrderingPackage
                    ? 'Creating Contract...'
                    : `Confirm & Order Package ($${selectedPackage?.price?.toLocaleString() || '0'})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

