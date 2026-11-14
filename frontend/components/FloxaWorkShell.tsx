'use client';

import React, { useState } from 'react';
import {
  Compass,
  Search,
  Briefcase,
  Layers,
  MessageSquare,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  Plus,
  MoreHorizontal,
  ChevronDown,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { AuthUser } from './auth/AuthScreen';

export type FloxaWorkTab =
  | 'briefs'
  | 'feed'
  | 'mini-discovery'
  | 'workspace'
  | 'chat'
  | 'escrow'
  | 'profile'
  | 'client_dashboard'
  | 'admin';

export interface FloxaNotification {
  id: string;
  type: 'chat' | 'proposal' | 'milestone' | 'call' | 'info';
  title: string;
  message: string;
  senderName?: string;
  senderAvatar?: string;
  timestamp: string;
  read: boolean;
  tab?: FloxaWorkTab;
}

interface FloxaWorkShellProps {
  currentUser: AuthUser;
  currentTab: FloxaWorkTab;
  onChangeTab: (tab: FloxaWorkTab) => void;
  onLogout: () => void;
  onOpenNewAction: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  badgeCounts?: {
    reviewBids?: number;
    myBriefs?: number;
    exploreBriefs?: number;
    activeContractEscrow?: number;
    activeContractValue?: number;
  };
  unreadMessagesCount?: number;
  notifications?: FloxaNotification[];
  unreadNotificationsCount?: number;
  onClearNotifications?: () => void;
  onSelectNotification?: (notification: FloxaNotification) => void;
  isOnline?: boolean;
  children: React.ReactNode;
}

export const FloxaWorkShell: React.FC<FloxaWorkShellProps> = ({
  currentUser,
  currentTab,
  onChangeTab,
  onLogout,
  onOpenNewAction,
  searchQuery,
  onSearchChange,
  badgeCounts = {},
  unreadMessagesCount = 0,
  notifications = [],
  unreadNotificationsCount = 0,
  onClearNotifications,
  onSelectNotification,
  isOnline = true,
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const isClient = currentUser.role === 'client';

  const handleNavClick = (tab: FloxaWorkTab) => {
    onChangeTab(tab);
    setIsSidebarOpen(false);
  };

  return (
    <div className="shell flex flex-col lg:flex-row min-h-screen w-full relative">
      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar: Desktop fixed/sticky, Mobile slide-over drawer */}
      <aside className={`sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
        {/* Brand Header */}
        <div className="logo-area">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src="/image/FLOXA_log.png"
                alt="FLOXA"
                className="h-[24px] w-auto object-contain brightness-0"
              />
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#0084ff] text-white tracking-wider uppercase shadow-[0_2px_8px_rgba(0,132,255,0.3)]">
                WORK
              </span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
          <div className="text-xs text-slate-500 mt-1.5 font-medium">
            {isClient ? 'Client Portal' : 'Freelancer Portal'}
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="nav-section flex-1 overflow-y-auto">
          <div className="nav-lbl">Workspace</div>

          {isClient ? (
            <>
              <button
                onClick={() => handleNavClick('client_dashboard')}
                className={`nav-item ${
                  currentTab === 'client_dashboard' || currentTab === 'mini-discovery' ? 'active' : ''
                }`}
              >
                <Briefcase size={15} className="nav-icon" />
                <span>Review Bids</span>
                {Boolean(badgeCounts.reviewBids && badgeCounts.reviewBids > 0) && (
                  <span className="nav-badge">{badgeCounts.reviewBids}</span>
                )}
              </button>

              <button
                onClick={() => handleNavClick('briefs')}
                className={`nav-item ${currentTab === 'briefs' ? 'active' : ''}`}
              >
                <Compass size={15} className="nav-icon" />
                <span>My Briefs</span>
                {Boolean(badgeCounts.myBriefs && badgeCounts.myBriefs > 0) && (
                  <span className="nav-badge">{badgeCounts.myBriefs}</span>
                )}
              </button>

              <button
                onClick={() => handleNavClick('workspace')}
                className={`nav-item ${currentTab === 'workspace' ? 'active' : ''}`}
              >
                <Layers size={15} className="nav-icon" />
                <span>Milestones</span>
                {Boolean(badgeCounts.activeContractEscrow && badgeCounts.activeContractEscrow > 0) && (
                  <span className="nav-badge">${badgeCounts.activeContractEscrow}</span>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleNavClick('briefs')}
                className={`nav-item ${currentTab === 'briefs' ? 'active' : ''}`}
              >
                <Search size={15} className="nav-icon" />
                <span>Explore Briefs</span>
                {Boolean(badgeCounts.exploreBriefs && badgeCounts.exploreBriefs > 0) && (
                  <span className="nav-badge">{badgeCounts.exploreBriefs}</span>
                )}
              </button>

              <button
                onClick={() => handleNavClick('feed')}
                className={`nav-item ${currentTab === 'feed' ? 'active' : ''}`}
              >
                <Layers size={15} className="nav-icon" />
                <span>Proof Feed</span>
              </button>

              <button
                onClick={() => handleNavClick('mini-discovery')}
                className={`nav-item ${currentTab === 'mini-discovery' ? 'active' : ''}`}
              >
                <Briefcase size={15} className="nav-icon" />
                <span>My Pitches</span>
              </button>

              <button
                onClick={() => handleNavClick('workspace')}
                className={`nav-item ${currentTab === 'workspace' ? 'active' : ''}`}
              >
                <Layers size={15} className="nav-icon" />
                <span>Active Contract</span>
                {Boolean(badgeCounts.activeContractEscrow && badgeCounts.activeContractEscrow > 0) && (
                  <span className="nav-badge">${badgeCounts.activeContractEscrow}</span>
                )}
              </button>
            </>
          )}

          <div className="nav-lbl mt-4">Collaboration</div>

          <button
            onClick={() => handleNavClick('chat')}
            className={`nav-item ${currentTab === 'chat' ? 'active' : ''}`}
          >
            <MessageSquare size={15} className="nav-icon" />
            <span>Messages</span>
            {Boolean(unreadMessagesCount && unreadMessagesCount > 0) && (
              <span className="nav-badge bg-[#0084ff] text-white animate-pulse">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleNavClick('escrow')}
            className={`nav-item ${currentTab === 'escrow' ? 'active' : ''}`}
          >
            <ShieldCheck size={15} className="nav-icon" />
            <span>Payment Ledger</span>
          </button>

          <div className="nav-lbl mt-4">Account</div>

          <button
            onClick={() => handleNavClick('profile')}
            className={`nav-item ${currentTab === 'profile' ? 'active' : ''}`}
          >
            <User size={15} className="nav-icon" />
            <span>Profile</span>
          </button>

          <button
            onClick={() => handleNavClick('admin')}
            className={`nav-item ${currentTab === 'admin' ? 'active' : ''}`}
          >
            <ShieldAlert size={15} className="nav-icon text-[#0084ff]" />
            <span>Operations & KYC</span>
          </button>

          <button onClick={onLogout} className="nav-item hover:text-red-500 text-slate-500">
            <LogOut size={15} className="nav-icon" />
            <span>Log Out</span>
          </button>
        </div>

        {/* User Chip Footer */}
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                    isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]' : 'bg-slate-300'
                  }`}
                  title={isOnline ? 'Online on FLOXA Work' : 'Offline'}
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-800 truncate">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500 truncate capitalize font-medium flex items-center gap-1.5">
                  <span>{currentUser.role} Account</span>
                  {isOnline && (
                    <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      <span>Online</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="text-slate-400 hover:text-slate-800 p-1"
              title="Log Out"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="main flex-1 flex flex-col min-w-0 w-full">
        {/* Topbar: Fully responsive for mobile and desktop */}
        <header className="topbar">
          <div className="flex items-center gap-2">
            {/* Hamburger for mobile */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100/80 transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            {/* Mobile Logo Brand */}
            <div className="flex items-center gap-2 lg:hidden">
              <img
                src="/image/FLOXA_log.png"
                alt="FLOXA"
                className="h-[20px] w-auto object-contain brightness-0"
              />
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#0084ff] text-white tracking-wider uppercase">
                WORK
              </span>
            </div>
          </div>

          {/* Desktop Search Box */}
          <div className="search-wrap hidden lg:flex">
            <Search size={14} className="text-slate-400" />
            <input
              type="text"
              placeholder={isClient ? "Search briefs, proposals or freelancers..." : "Search briefs, gigs or clients..."}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 whitespace-nowrap font-medium">
              Ctrl K
            </span>
          </div>

          <div className="flex-1" />

          {/* Mobile Search Toggle Icon */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="lg:hidden p-2 rounded-full border border-slate-200/90 bg-white/90 text-slate-600 hover:text-slate-900 shadow-sm"
            aria-label="Toggle search"
          >
            <Search size={15} />
          </button>

          {/* Role Pill Dropdown */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 border border-slate-200/90 text-slate-800 shadow-sm">
            <span className="capitalize">{currentUser.role}</span>
            <ChevronDown size={12} className="text-slate-500" />
          </div>

          {/* Desktop Action Button */}
          {isClient ? (
            <button onClick={onOpenNewAction} className="btn-cyan-pill hidden sm:inline-flex">
              <Plus size={14} strokeWidth={3} />
              <span>Post Brief</span>
            </button>
          ) : (
            <button onClick={onOpenNewAction} className="btn-cyan-pill hidden sm:inline-flex">
              <span>Explore Gigs</span>
            </button>
          )}

          {/* Notification Bell with Badge and Frosted Glass Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="p-2 rounded-full border border-slate-200/90 bg-white/90 text-slate-600 hover:text-slate-900 shadow-sm relative transition-colors"
              aria-label="Notifications"
            >
              <Bell size={15} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] rounded-full bg-[#0084ff] text-white text-[9.5px] font-extrabold flex items-center justify-center px-1 shadow-[0_2px_8px_rgba(0,132,255,0.45)] animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_20px_60px_rgba(0,132,255,0.15),0_8px_24px_rgba(15,23,42,0.12)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-3.5 px-4 bg-slate-50/90 border-b border-slate-200/90 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                    {unreadNotificationsCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0084ff]/10 text-[#0084ff] border border-[#0084ff]/20">
                        {unreadNotificationsCount} unread
                      </span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={() => {
                        onClearNotifications?.();
                      }}
                      className="text-[11px] font-semibold text-[#0084ff] hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs font-medium">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          onSelectNotification?.(notif);
                          setIsNotificationOpen(false);
                        }}
                        className={`p-3.5 hover:bg-slate-50/90 cursor-pointer transition-colors flex items-start gap-3 ${
                          !notif.read ? 'bg-[#0084ff]/5' : ''
                        }`}
                      >
                        <div className="relative shrink-0">
                          {notif.senderAvatar ? (
                            <img
                              src={notif.senderAvatar}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#0084ff]/10 text-[#0084ff] flex items-center justify-center font-bold text-xs">
                              <Bell size={14} />
                            </div>
                          )}
                          {!notif.read && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#0084ff] rounded-full ring-2 ring-white" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">
                              {notif.timestamp}
                            </span>
                          </div>
                          <p className="text-[11.5px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                            {notif.message}
                          </p>
                          {notif.tab && (
                            <div className="mt-1.5 flex items-center gap-1 text-[10.5px] font-bold text-[#0084ff]">
                              <span>Open {notif.tab === 'chat' ? 'Messages' : notif.tab === 'workspace' ? 'Contract' : notif.tab === 'mini-discovery' ? 'Pitches' : 'View'}</span>
                              <ArrowRight size={11} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            title="Log Out"
            className="p-2 rounded-full border border-slate-200/90 bg-white/90 text-slate-600 hover:text-red-500 shadow-sm"
            aria-label="Log Out"
          >
            <LogOut size={15} />
          </button>
        </header>

        {/* Collapsible Mobile Search Input */}
        {isMobileSearchOpen && (
          <div className="lg:hidden px-4 py-2 bg-white/95 border-b border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 bg-slate-100/90 rounded-full px-3 py-1.5 border border-slate-200">
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search marketplace..."
                className="bg-transparent border-none outline-none text-xs text-slate-900 w-full"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => onSearchChange('')} className="text-slate-400 hover:text-slate-600">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content Children with ample padding at bottom for mobile down-nav */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto pb-24 lg:pb-8">
          {children}
        </div>
      </div>

      {/* ========================================================
          MOBILE DOWN NAVIGATION BAR (DOWN NAV FOR MOBILE USERS)
          ======================================================== */}
      <nav className="mobile-down-nav lg:hidden">
        {isClient ? (
          <>
            {/* 1. Review Bids */}
            <button
              onClick={() => handleNavClick('client_dashboard')}
              className={`mobile-nav-btn ${
                currentTab === 'client_dashboard' || currentTab === 'mini-discovery' ? 'active' : ''
              }`}
            >
              <div className="mobile-nav-icon-wrap">
                <Briefcase size={18} />
                {Boolean(badgeCounts.reviewBids && badgeCounts.reviewBids > 0) && (
                  <span className="mobile-nav-dot-badge">{badgeCounts.reviewBids}</span>
                )}
              </div>
              <span>Bids</span>
            </button>

            {/* 2. My Briefs */}
            <button
              onClick={() => handleNavClick('briefs')}
              className={`mobile-nav-btn ${currentTab === 'briefs' ? 'active' : ''}`}
            >
              <div className="mobile-nav-icon-wrap">
                <Compass size={18} />
                {Boolean(badgeCounts.myBriefs && badgeCounts.myBriefs > 0) && (
                  <span className="mobile-nav-dot-badge">{badgeCounts.myBriefs}</span>
                )}
              </div>
              <span>Briefs</span>
            </button>

            {/* 3. Center Elevated Action Button: + Post */}
            <button
              onClick={onOpenNewAction}
              className="mobile-nav-center-btn"
              title="Post New Brief"
            >
              <div className="mobile-nav-center-icon">
                <Plus size={20} strokeWidth={3} />
              </div>
              <span className="text-[10px] font-bold text-[#0084ff] mt-0.5">Post</span>
            </button>

            {/* 4. Milestones */}
            <button
              onClick={() => handleNavClick('workspace')}
              className={`mobile-nav-btn ${currentTab === 'workspace' ? 'active' : ''}`}
            >
              <div className="mobile-nav-icon-wrap">
                <Layers size={18} />
                {Boolean(badgeCounts.activeContractEscrow && badgeCounts.activeContractEscrow > 0) && (
                  <span className="mobile-nav-dot-badge">${badgeCounts.activeContractEscrow}</span>
                )}
              </div>
              <span>Milestones</span>
            </button>

            {/* 5. Messages */}
            <button
              onClick={() => handleNavClick('chat')}
              className={`mobile-nav-btn ${currentTab === 'chat' ? 'active' : ''}`}
            >
              <div className="mobile-nav-icon-wrap">
                <MessageSquare size={18} />
                {Boolean(unreadMessagesCount && unreadMessagesCount > 0) && (
                  <span className="mobile-nav-dot-badge animate-pulse">{unreadMessagesCount}</span>
                )}
              </div>
              <span>Messages</span>
            </button>
          </>
        ) : (
          <>
            {/* 1. Explore Briefs */}
            <button
              onClick={() => handleNavClick('briefs')}
              className={`mobile-nav-btn ${currentTab === 'briefs' ? 'active' : ''}`}
            >
              <div className="mobile-nav-icon-wrap">
                <Search size={18} />
                {Boolean(badgeCounts.exploreBriefs && badgeCounts.exploreBriefs > 0) && (
                  <span className="mobile-nav-dot-badge">{badgeCounts.exploreBriefs}</span>
                )}
              </div>
              <span>Explore</span>
            </button>

            {/* 2. Proof Feed */}
            <button
              onClick={() => handleNavClick('feed')}
              className={`mobile-nav-btn ${currentTab === 'feed' ? 'active' : ''}`}
            >
              <div className="mobile-nav-icon-wrap">
                <Layers size={18} />
              </div>
              <span>Feed</span>
            </button>

            {/* 3. Center Elevated Action Button: My Pitches */}
            <button
              onClick={() => handleNavClick('mini-discovery')}
              className="mobile-nav-center-btn"
              title="My Pitches"
            >
              <div className="mobile-nav-center-icon">
                <Briefcase size={18} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold text-[#0084ff] mt-0.5">Pitches</span>
            </button>

            {/* 4. Active Contract */}
            <button
              onClick={() => handleNavClick('workspace')}
              className={`mobile-nav-btn ${currentTab === 'workspace' ? 'active' : ''}`}
            >
              <div className="mobile-nav-icon-wrap">
                <ShieldCheck size={18} />
                {Boolean(badgeCounts.activeContractEscrow && badgeCounts.activeContractEscrow > 0) && (
                  <span className="mobile-nav-dot-badge">${badgeCounts.activeContractEscrow}</span>
                )}
              </div>
              <span>Contract</span>
            </button>

            {/* 5. Messages */}
            <button
              onClick={() => handleNavClick('chat')}
              className={`mobile-nav-btn ${currentTab === 'chat' ? 'active' : ''}`}
            >
              <div className="mobile-nav-icon-wrap">
                <MessageSquare size={18} />
                {Boolean(unreadMessagesCount && unreadMessagesCount > 0) && (
                  <span className="mobile-nav-dot-badge animate-pulse">{unreadMessagesCount}</span>
                )}
              </div>
              <span>Messages</span>
            </button>
          </>
        )}
      </nav>
    </div>
  );
};