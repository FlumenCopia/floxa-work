'use client';

import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, User as UserIcon, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { loginUser, registerUser } from '@/lib/api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  handle: string;
  role: 'freelancer' | 'client';
  avatarUrl: string;
  isVerified: boolean;
}

interface AuthScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<'client' | 'freelancer'>('client');
  const [email, setEmail] = useState('client@floxa.work');
  const [password, setPassword] = useState('Password123!');
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectRole = (newRole: 'client' | 'freelancer') => {
    setRole(newRole);
    if (!isRegister) {
      if (newRole === 'client') {
        setEmail('client@floxa.work');
        setPassword('Password123!');
      } else {
        setEmail('freelancer@floxa.work');
        setPassword('Password123!');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!email || !password) {
        setError('Please enter both email and password.');
        setIsLoading(false);
        return;
      }

      if (isRegister) {
        if (!name) {
          setError('Please enter your full name.');
          setIsLoading(false);
          return;
        }
        const generatedHandle = handle || email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const res = await registerUser({
          email,
          password,
          name,
          handle: generatedHandle,
          role,
        });
        const u = res.user;
        onLoginSuccess({
          id: u._id || u.id,
          email: u.email,
          name: u.name,
          handle: u.handle,
          role: u.role === 'freelancer' ? 'freelancer' : 'client',
          avatarUrl: u.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
          isVerified: u.isVerified || false,
        });
      } else {
        const res = await loginUser(email, password);
        const u = res.user;
        onLoginSuccess({
          id: u._id || u.id,
          email: u.email,
          name: u.name,
          handle: u.handle,
          role: u.role === 'freelancer' ? 'freelancer' : 'client',
          avatarUrl: u.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
          isVerified: u.isVerified || false,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50 relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-slate-200/50 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-200/80 overflow-hidden relative z-10 grid grid-cols-1 md:grid-cols-12 min-h-[540px]">
        
        {/* Left Column: Brand & Value Proposition (5 Cols) */}
        <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Ambient Light */}
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-[#0084ff]/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            {/* Logo Row */}
            <div className="flex items-center gap-2.5 mb-6">
              <img
                src="/image/FLOXA_log.png"
                alt="FLOXA"
                className="h-[26px] w-auto object-contain invert brightness-200"
              />
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#0084ff] text-white tracking-widest uppercase shadow-sm">
                WORK
              </span>
            </div>

            {/* Subtitle */}
            <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-snug tracking-tight mb-4">
              {role === 'client'
                ? 'Hire top talent with discovery & milestone clarity.'
                : 'Win high-value projects with structured proposals.'}
            </h2>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              A high-precision freelance marketplace. Milestone-driven proof of work and direct client-talent coordination.
            </p>

            {/* Feature List */}
            <div className="space-y-3.5 text-xs text-slate-300 font-medium">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-[#0084ff] shrink-0 mt-0.5" />
                <span>Discovery-first client briefs & mini-discovery bids</span>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck size={16} className="text-[#0084ff] shrink-0 mt-0.5" />
                <span>Milestone deliverables & verified acceptance</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Sparkles size={16} className="text-[#0084ff] shrink-0 mt-0.5" />
                <span>Zero-spam reputation and proof-of-work profiles</span>
              </div>
            </div>
          </div>

          {/* Bottom Note */}
          <div className="relative z-10 pt-6 border-t border-slate-800 text-[11px] text-slate-500">
            Non-custodial collaboration platform.
          </div>
        </div>

        {/* Right Column: Authentication Form (7 Cols) */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center bg-white">
          <div className="w-full max-w-sm mx-auto">
            
            {/* Role Tabs */}
            <div className="flex bg-slate-100 p-1 border border-slate-200/80 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => handleSelectRole('client')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  role === 'client'
                    ? 'bg-[#0084ff] text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Client Portal
              </button>
              <button
                type="button"
                onClick={() => handleSelectRole('freelancer')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  role === 'freelancer'
                    ? 'bg-[#0084ff] text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Freelancer Portal
              </button>
            </div>

            {/* Heading */}
            <div className="mb-5">
              <h3 className="text-lg font-bold text-slate-900">
                {isRegister ? 'Create an account' : 'Welcome back'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRegister
                  ? `Register as a ${role === 'client' ? 'Client' : 'Freelancer'}`
                  : `Sign in as a ${role === 'client' ? 'Client' : 'Freelancer'}`}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium leading-relaxed">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {isRegister && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative flex items-center">
                    <UserIcon size={16} className="absolute left-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Morgan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/15 outline-none text-xs text-slate-900 placeholder:text-slate-400 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/15 outline-none text-xs text-slate-900 placeholder:text-slate-400 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/15 outline-none text-xs text-slate-900 placeholder:text-slate-400 transition-all"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#0084ff] hover:bg-[#0070e0] text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                <span>{isLoading ? 'Signing In...' : isRegister ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight size={15} />
              </button>

              {/* Toggle Register / Sign In */}
              <div className="text-center pt-3 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-xs text-slate-500 hover:text-[#0084ff] font-medium transition-colors cursor-pointer"
                >
                  {isRegister
                    ? 'Already have an account? Sign In'
                    : "Don't have an account? Create one"}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
