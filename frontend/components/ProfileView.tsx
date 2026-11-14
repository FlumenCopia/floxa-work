'use client';

import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  CheckCircle2,
  Edit3,
  DollarSign,
  Star,
  Briefcase,
  Layers,
  Save,
  X,
  Sparkles,
  Paperclip,
  ShieldCheck,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { fetchUserProfile, updateUserProfile, uploadFile, fetchUserReviewsApi, reportReviewApi } from '@/lib/api';
import { AuthUser } from './auth/AuthScreen';

interface ProfileViewProps {
  currentUser: AuthUser;
  onProfileUpdated?: (updatedUser: any) => void;
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onProfileUpdated,
  onLogout,
}) => {
  const [profileData, setProfileData] = useState<any | null>(null);
  const [reviewsData, setReviewsData] = useState<{ reviews: any[]; reputationSummary: any } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState({
    name: '',
    handle: '',
    avatarUrl: '',
    headline: '',
    bio: '',
    skills: '',
    hourlyRate: 85,
    availabilityStatus: 'available',
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const res = await uploadFile(file, 'avatar', true);
      setFormData((prev) => ({ ...prev, avatarUrl: res.accessUrl }));
      setMessage({ type: 'success', text: `Avatar "${file.name}" uploaded successfully!` });
    } catch (err: any) {
      alert(err.message || 'Avatar upload failed');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUserProfile();
      if (data) {
        setProfileData(data);
        setFormData({
          name: data.user?.name || currentUser.name,
          handle: data.user?.handle || currentUser.handle,
          avatarUrl: data.user?.avatarUrl || currentUser.avatarUrl,
          headline: data.profile?.headline || 'Creative & Technical Consultant',
          bio: data.profile?.bio || 'Passionate about delivering exceptional outcomes via discovery-first workflows.',
          skills: Array.isArray(data.profile?.skills) ? data.profile.skills.join(', ') : '',
          hourlyRate: data.profile?.hourlyRate || 85,
          availabilityStatus: data.profile?.availabilityStatus || 'available',
        });
      }
      try {
        const rev = await fetchUserReviewsApi(currentUser.id);
        if (rev) setReviewsData(rev);
      } catch {}
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [currentUser.id]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await updateUserProfile({
        name: formData.name,
        handle: formData.handle,
        avatarUrl: formData.avatarUrl,
        headline: formData.headline,
        bio: formData.bio,
        skills: formData.skills,
        hourlyRate: Number(formData.hourlyRate),
        availabilityStatus: formData.availabilityStatus,
      });

      setMessage({ type: 'success', text: 'Profile updated and saved to database successfully!' });
      setIsEditModalOpen(false);
      await loadProfile();
      if (res.user && onProfileUpdated) {
        onProfileUpdated(res.user);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const user = profileData?.user || currentUser;
  const profile = profileData?.profile || {};
  const stats = profileData?.stats || {
    activeContractsCount: 1,
    completedContractsCount: 0,
    totalVolume: 960,
    ratingAverage: 5.0,
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-red-50 border border-red-200 text-red-900'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="floxa-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'}
                alt={user.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-[#0084ff] shadow-md"
              />
              <span
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_8px_rgba(16,185,129,0.9)]"
                title="Online Now"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">{user.name}</h2>
                <CheckCircle2 size={16} className="text-[#0084ff] shrink-0" />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  Online
                </span>
              </div>

              <div className="text-xs text-slate-500 font-medium mt-0.5">
                @{user.handle} â€¢ {user.email}
              </div>

              <div className="text-xs font-semibold text-[#0084ff] mt-1 capitalize flex items-center gap-1.5">
                <span>{user.role} Account</span>
                {profile.hourlyRate ? <span>â€¢ ${profile.hourlyRate}/hr</span> : null}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="btn-cyan-pill text-xs px-4 py-2 self-start sm:self-auto"
          >
            <Edit3 size={13} />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Headline & Bio */}
        <div className="space-y-3">
          {profile.headline && (
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                Headline
              </div>
              <h3 className="text-sm font-bold text-slate-800 mt-0.5">
                {profile.headline}
              </h3>
            </div>
          )}

          {profile.bio && (
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                Bio & Vision
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mt-0.5 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                {profile.bio}
              </p>
            </div>
          )}

          {profile.skills && profile.skills.length > 0 && (
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Verified Skills & Craft
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill: string) => (
                  <span
                    key={skill}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#0084ff]/10 text-[#0084ff] border border-[#0084ff]/20"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Database Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div className="text-lg font-bold text-slate-900 font-mono">
              {stats.activeContractsCount || 1}
            </div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">
              Active Contracts
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div className="text-lg font-bold text-slate-900 font-mono">
              {stats.completedContractsCount || 0}
            </div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">
              Completed Gigs
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div className="text-lg font-bold text-[#0084ff] font-mono">
              ${stats.totalVolume?.toLocaleString() || '960'}
            </div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">
              Direct Volume
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div className="text-lg font-bold text-amber-500 font-mono flex items-center justify-center gap-1">
              <Star size={14} fill="#f59e0b" />
              <span>{stats.ratingAverage || '5.0'}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">
              Client Rating
            </div>
          </div>
        </div>

        {/* Phase 11: Trust, Reputation & Verified Reviews Section */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#0084ff]" />
              <h3 className="text-sm font-bold text-slate-900">Verified Client Reviews & Reputation</h3>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
              <Award size={13} />
              <span>Contract-Verified Only</span>
            </div>
          </div>

          {reviewsData && reviewsData.reputationSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
              <div className="text-center p-2 rounded-lg bg-white border border-slate-200/60 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Communication</div>
                <div className="text-base font-bold text-slate-800 mt-0.5">
                  {reviewsData.reputationSummary.communicationScore || '5.0'} / 5.0
                </div>
              </div>
              <div className="text-center p-2 rounded-lg bg-white border border-slate-200/60 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Quality of Work</div>
                <div className="text-base font-bold text-slate-800 mt-0.5">
                  {reviewsData.reputationSummary.qualityScore || '5.0'} / 5.0
                </div>
              </div>
              <div className="text-center p-2 rounded-lg bg-white border border-slate-200/60 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Reliability</div>
                <div className="text-base font-bold text-slate-800 mt-0.5">
                  {reviewsData.reputationSummary.reliabilityScore || '5.0'} / 5.0
                </div>
              </div>
              <div className="text-center p-2 rounded-lg bg-white border border-slate-200/60 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Professionalism</div>
                <div className="text-base font-bold text-slate-800 mt-0.5">
                  {reviewsData.reputationSummary.professionalismScore || '5.0'} / 5.0
                </div>
              </div>
            </div>
          )}

          {reviewsData && reviewsData.reviews && reviewsData.reviews.length > 0 ? (
            <div className="space-y-3">
              {reviewsData.reviews.map((rev: any) => (
                <div key={rev._id || rev.id} className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                        {rev.reviewerId?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{rev.reviewerId?.name || 'Verified Client'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">@{rev.reviewerId?.handle || 'member'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-amber-700 text-xs font-bold">
                      <Star size={12} fill="#f59e0b" className="text-amber-500" />
                      <span>{rev.overallRating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                    &ldquo;{rev.reviewText}&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Verified Contract Review</span>
                    <span>{new Date(rev.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 px-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
              <ShieldCheck size={24} className="mx-auto mb-1 text-slate-300" />
              <span>No published reviews yet. Completed projects unlock mutual double-blind reviews.</span>
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-full text-xs font-semibold border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          >
            Sign Out of Account
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#0084ff]" />
                <h3 className="text-base font-bold text-slate-900">Edit Member Profile</h3>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0084ff]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Handle (@username)</label>
                  <input
                    type="text"
                    value={formData.handle}
                    onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0084ff]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Avatar Photo (Upload or URL)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0084ff]"
                    placeholder="https://... or upload from disk"
                  />
                  <label className="btn-dark-pill text-xs px-3 py-2 cursor-pointer inline-flex items-center gap-1 shrink-0">
                    <Paperclip size={12} className="text-[#0084ff]" />
                    <span>{isUploadingAvatar ? '...' : 'Upload'}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                      accept="image/*"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Headline</label>
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0084ff]"
                  placeholder="e.g. Brand Identity & Design Systems Architect"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0084ff] resize-none"
                  placeholder="Tell clients about your methodology, experience, and discovery approach..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0084ff]"
                    placeholder="Brand Identity, Figma, UI/UX"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Hourly Rate ($)</label>
                  <input
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0084ff]"
                    min={10}
                    max={1000}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-cyan-pill text-xs px-5 py-2 disabled:opacity-50"
                >
                  <Save size={13} />
                  <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
