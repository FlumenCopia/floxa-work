'use client';

import React from 'react';
import { Home, Compass, Plus, MessageSquare, Layers } from 'lucide-react';

export type NavTab = 'feed' | 'briefs' | 'post' | 'messages' | 'workspace';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  onOpenNewModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab, onOpenNewModal }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-lg px-2 py-2 sm:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-around">
        {/* Tab 1: Feed */}
        <button
          onClick={() => onChangeTab('feed')}
          className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
            activeTab === 'feed' ? 'text-[#0084ff] font-bold' : 'text-slate-500'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Feed</span>
        </button>

        {/* Tab 2: Briefs */}
        <button
          onClick={() => onChangeTab('briefs')}
          className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
            activeTab === 'briefs' ? 'text-[#0084ff] font-bold' : 'text-slate-500'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px]">Briefs</span>
        </button>

        {/* Action Button: Post (+) */}
        <button
          onClick={onOpenNewModal}
          className="relative -top-3 w-12 h-12 rounded-full bg-[#0084ff] text-white flex items-center justify-center shadow-[0_4px_20px_rgba(0,132,255,0.4)] border-2 border-white active:scale-95 transition-transform"
          aria-label="Create Action"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Tab 4: Messages */}
        <button
          onClick={() => onChangeTab('messages')}
          className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
            activeTab === 'messages' ? 'text-[#0084ff] font-bold' : 'text-slate-500'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px]">Chat</span>
        </button>

        {/* Tab 5: Workspace */}
        <button
          onClick={() => onChangeTab('workspace')}
          className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
            activeTab === 'workspace' ? 'text-[#0084ff] font-bold' : 'text-slate-500'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px]">Work</span>
        </button>
      </div>
    </nav>
  );
};
