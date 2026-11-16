'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Activity,
  ArrowLeft,
  KeyRound,
  LogOut,
} from 'lucide-react';
import { loginUser, getAuthUser, clearAuthSession } from '@/lib/api';
import { AdminPortal } from '@/components/AdminPortal';

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [email, setEmail] = useState('admin@floxa.work');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const user = getAuthUser();
    if (user && (user.role === 'admin' || user.adminRole)) {
      setCurrentUser(user);
    }
    setIsCheckingAuth(false);
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!email || !password) {
        setError('Please enter both administrator email and password.');
        setIsLoading(false);
        return;
      }

      const res = await loginUser(email, password);
      const user = res.user;

      if (user.role !== 'admin' && !user.adminRole) {
        clearAuthSession();
        setError('Access Denied: This account does not possess executive administrator privileges.');
        setIsLoading(false);
        return;
      }

      setCurrentUser(user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify administrator credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogout = () => {
    clearAuthSession();
    setCurrentUser(null);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#070d1e] flex items-center justify-center text-slate-400">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-[#0084ff] border-t-transparent rounded-full" />
      </div>
    );
  }

  // If already authenticated as Administrator, render Admin Operations Center
  if (currentUser && (currentUser.role === 'admin' || currentUser.adminRole)) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900">
        {/* Top Executive Header */}
        <header className="bg-[#0b1329] border-b border-slate-800 text-white px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0084ff]/20 border border-[#0084ff]/40 flex items-center justify-center text-[#38bdf8]">
              <ShieldAlert size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wide text-white">FLOXA WORK</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                  ADMIN ONLY
                </span>
              </div>
              <div className="text-[11px] text-slate-400">Operations & Governance Center</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Admin: {currentUser.name || currentUser.email}</span>
            </div>

            <a
              href="/"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/80 hover:bg-slate-800/80 transition-all"
            >
              <ArrowLeft size={13} />
              <span>Marketplace</span>
            </a>

            <button
              onClick={handleAdminLogout}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-900/50 hover:bg-red-950/40 transition-all font-semibold"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Admin Portal Body */}
        <main className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
          <AdminPortal />
        </main>
      </div>
    );
  }

  // Otherwise, render dedicated Executive Admin Login Portal
  return (
    <div className="min-h-screen bg-[#070d1e] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-[#0084ff]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#0b1329] rounded-2xl border border-slate-800 p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-[#38bdf8] mx-auto shadow-inner">
            <KeyRound size={22} />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Executive Operations Login</h2>
          <p className="text-xs text-slate-400">
            Dedicated administrative portal for platform governance, KYC audit trails, and dispute resolution.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
            <ShieldAlert size={16} className="text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider text-[11px]">
              Admin Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail size={15} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@floxa.work"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:border-[#0084ff] outline-none font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider text-[11px]">
              Master Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock size={15} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:border-[#0084ff] outline-none font-medium"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-[#0084ff] hover:bg-[#0070d6] text-white font-bold text-xs shadow-lg shadow-[#0084ff]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{isLoading ? 'Authenticating...' : 'Authenticate as Administrator'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <a
            href="/"
            className="text-slate-400 hover:text-white inline-flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Return to User Marketplace</span>
          </a>
          <span className="font-mono text-[11px] text-slate-600">v1.2-GOV</span>
        </div>
      </div>
    </div>
  );
}

