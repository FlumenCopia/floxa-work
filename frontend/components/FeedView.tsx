'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  ArrowUpRight,
  Heart,
  MessageSquare,
  Share2,
  Inbox,
  Plus,
  X,
  Upload,
  Sparkles,
  Paperclip,
} from 'lucide-react';
import { fetchFeed, likePost, createSocialPost, uploadFile, getAuthUser } from '@/lib/api';

interface FeedViewProps {
  onDirectPitch: (authorName: string) => void;
}

export const FeedView: React.FC<FeedViewProps> = ({ onDirectPitch }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // New Post Modal State
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [newCategory, setNewCategory] = useState('branding');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newTags, setNewTags] = useState('BrandIdentity, DesignSystem, UI/UX');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const res = await uploadFile(file, 'post', true);
      setNewMediaUrl(res.accessUrl);
    } catch (err: any) {
      alert(err.message || 'Image upload failed');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const currentUser = getAuthUser();

  const categories = [
    { id: 'all', label: 'All Proofs' },
    { id: 'branding', label: 'Branding' },
    { id: 'uiux', label: 'UI/UX' },
    { id: 'webdev', label: 'Webdev' },
    { id: 'marketing', label: 'Marketing' },
  ];

  const loadFeed = async (pageToLoad = 1, append = false) => {
    if (pageToLoad === 1) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const data = await fetchFeed(activeCategory, pageToLoad, 10);
      if (append) {
        setPosts((prev) => [...prev, ...data]);
      } else {
        setPosts(data);
      }
      setHasMore(data.length >= 10);
      setPage(pageToLoad);
    } catch {
      if (!append) setPosts([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    loadFeed(1, false);
  }, [activeCategory]);

  const handleToggleLike = async (id: string) => {
    try {
      await likePost(id);
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id === id || p.id === id) {
            const isLiked = !p.isLiked;
            return {
              ...p,
              isLiked,
              likesCount: (p.likesCount || 0) + (isLiked ? 1 : -1),
            };
          }
          return p;
        })
      );
    } catch {}
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaption.trim()) return;

    setIsPublishing(true);
    try {
      const tagsArray = newTags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      await createSocialPost({
        caption: newCaption.trim(),
        mediaUrls: newMediaUrl.trim()
          ? [newMediaUrl.trim()]
          : ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80'],
        tags: tagsArray,
        projectCategory: newCategory,
        caseStudyMetrics: {
          deliverableType: 'Verified Case Study',
          verifiedFloxaWork: true,
        },
      });

      setIsPostModalOpen(false);
      setNewCaption('');
      setNewMediaUrl('');
      loadFeed(1, false);
    } catch (err: any) {
      alert(err.message || 'Failed to publish post');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Category Filter Pills & Create Post Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`pill-tab ${activeCategory === c.id ? 'active' : ''}`}
            >
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {currentUser?.role !== 'client' && (
          <button
            onClick={() => setIsPostModalOpen(true)}
            className="btn-cyan-pill text-xs px-4 py-2 self-start sm:self-auto shrink-0"
          >
            <Plus size={14} strokeWidth={3} />
            <span>Post Proof of Work</span>
          </button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="floxa-card py-16 text-center text-slate-500">
          <div className="inline-block animate-spin w-6 h-6 border-2 border-[#0084ff] border-t-transparent rounded-full mb-3" />
          <div className="text-xs font-medium">Loading live proof feed from database...</div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && posts.length === 0 && (
        <div className="floxa-card py-16 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0084ff]/10 border border-[#0084ff]/25 flex items-center justify-center mx-auto text-[#0084ff]">
            <Inbox size={26} />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-slate-900">No Proof Posts in this Category</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Verified proof-of-work case studies appear here as talent delivers and completes milestone contracts.
            </p>
          </div>
        </div>
      )}

      {/* Feed Cards List */}
      {!isLoading && posts.length > 0 && (
        <div className="space-y-6">
          {posts.map((post) => {
            const author = post.authorId || {};
            const authorName = author.name || 'Aravind V.';
            const authorHandle = author.handle || 'aravind_design';
            const avatar = author.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80';
            const isVerified = author.isVerified ?? true;
            const mediaUrl = post.mediaUrls?.[0] || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80';

            return (
              <article key={post._id || post.id} className="floxa-card space-y-4">
                {/* Top Author Row */}
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={avatar}
                        alt={authorName}
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-[#0084ff]/25 shadow-sm"
                      />
                      {isVerified && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#0084ff] text-white flex items-center justify-center">
                          <CheckCircle2 size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-900 font-bold text-xs sm:text-sm tracking-wide truncate">
                          {authorName}
                        </span>
                        {isVerified && (
                          <CheckCircle2 size={14} className="text-[#0084ff] shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                        <span>@{authorHandle}</span>
                        <span>â€¢</span>
                        <span className="text-[#0084ff] font-semibold">
                          Verified Talent
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDirectPitch(authorName)}
                    className="btn-dark-pill px-3.5 py-1.5 text-xs font-semibold shrink-0"
                  >
                    <span>Hire</span>
                    <ArrowUpRight size={13} className="text-[#0084ff]" />
                  </button>
                </div>

                {/* Caption / Title */}
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-snug">
                  {post.caption}
                </h3>

                {/* Hashtag Pills */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {post.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-mono font-medium bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Deliverable Showcase Image */}
                <div className="relative rounded-2xl border border-slate-200/80 overflow-hidden bg-white aspect-[16/9] sm:aspect-[24/9] shadow-[0_8px_30px_rgba(0,132,255,0.08)] group">
                  <img
                    src={mediaUrl}
                    alt="Deliverable Proof Showcase"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
                  />
                </div>

                {/* Post Interactions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleToggleLike(post._id || post.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        post.isLiked ? 'text-[#0084ff]' : 'hover:text-slate-900'
                      }`}
                    >
                      <Heart size={14} className={post.isLiked ? 'fill-current text-rose-500' : ''} />
                      <span>{post.likesCount || 0}</span>
                    </button>
                    <div className="flex items-center gap-1.5 hover:text-slate-900 cursor-pointer">
                      <MessageSquare size={14} />
                      <span>{post.commentsCount || 0} comments</span>
                    </div>
                  </div>

                  <div
                    onClick={() => alert('Proof link copied to clipboard!')}
                    className="flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                  >
                    <Share2 size={14} />
                    <span>Share Proof</span>
                  </div>
                </div>
              </article>
            );
          })}

          {/* Load More Pagination */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={() => loadFeed(page + 1, true)}
                disabled={isLoadingMore}
                className="btn-dark-pill px-6 py-2.5 text-xs font-semibold mx-auto"
              >
                {isLoadingMore ? 'Loading more proofs...' : 'Load More Proofs'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Proof Post Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#0084ff]" />
                <h3 className="text-sm font-bold text-slate-900">Publish Proof of Work Case Study</h3>
              </div>
              <button onClick={() => setIsPostModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Case Study Title / Overview
                </label>
                <textarea
                  rows={3}
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0084ff] resize-none"
                  placeholder="e.g. Brand Identity & Design System for an AI Fintech startup in Bangalore..."
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0084ff] bg-white"
                >
                  <option value="branding">Branding</option>
                  <option value="uiux">UI/UX</option>
                  <option value="webdev">Webdev</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Deliverable Showcase Banner Image
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0084ff]"
                    placeholder="https://... or upload local image"
                  />
                  <label className="btn-dark-pill text-xs px-3 py-2 cursor-pointer inline-flex items-center gap-1 shrink-0">
                    <Paperclip size={12} className="text-[#0084ff]" />
                    <span>{isUploadingImage ? '...' : 'Upload'}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                      accept="image/*"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0084ff]"
                  placeholder="BrandIdentity, DesignSystem, Fintech"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPublishing}
                  className="btn-cyan-pill text-xs px-5 py-2 disabled:opacity-50"
                >
                  <Upload size={13} />
                  <span>{isPublishing ? 'Publishing...' : 'Publish Proof'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
