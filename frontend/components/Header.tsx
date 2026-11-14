'use client';

import React from 'react';
import { Bell, Plus, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  userRole: 'freelancer' | 'client';
  onToggleRole: () => void;
  onOpenNewModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ userRole, onToggleRole, onOpenNewModal }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 shadow-sm">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <img
            src="/image/FLOXA_log.png"
            alt="FLOXA"
            className="h-[22px] w-auto object-contain"
          />
          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#0084ff] text-white tracking-wider uppercase">
            WORK
          </span>
        </div>

        {/* Actions & Role Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleRole}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-slate-200 bg-slate-50 hover:border-[#0084ff] transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-[#0084ff] animate-pulse" />
            <span className="text-slate-500">Mode:</span>
            <span className="text-slate-900 font-semibold capitalize">{userRole}</span>
          </button>

          <button
            onClick={onOpenNewModal}
            className="btn-cyan-pill text-xs px-3.5 py-1.5 hidden sm:flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>{userRole === 'client' ? 'Post Brief' : 'Share Work'}</span>
          </button>

          <div className="relative p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900 cursor-pointer">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#0084ff] rounded-full" />
          </div>
        </div>
      </div>
    </header>
  );
};
