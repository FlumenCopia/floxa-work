'use client';

import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, User as UserIcon } from 'lucide-react';
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
    <div id="login-screen">
      <div className="login-card">
        <div className="login-access-wrap">
          {/* Left Column: Brand */}
          <div className="login-access-intro">
            <div className="flex items-center gap-2.5">
              <img
                src="/image/FLOXA_log.png"
                alt="FLOXA"
                className="login-brand-logo-img brightness-0"
              />
              <span className="text-[11px] font-black px-2 py-0.5 rounded bg-[#0084ff] text-white tracking-wider uppercase shadow-[0_2px_8px_rgba(0,132,255,0.3)]">
                WORK
              </span>
            </div>
            <h2 className="login-brand-subtitle">
              {role === 'client'
                ? 'Hire top talent with escrow clarity.'
                : 'Win high-value projects with discovery.'}
            </h2>

            <div className="text-xs text-slate-500 space-y-2.5 hidden sm:block font-medium">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0084ff]" />
                <span>Discovery-first client briefs and bidding</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0084ff]" />
                <span>Milestone-driven escrow protection</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0084ff]" />
                <span>Zero spam proposals and verified deliveries</span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Form */}
          <div className="w-full">
            {/* Role Tabs */}
            <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-full mb-4">
              <button
                type="button"
                onClick={() => handleSelectRole('client')}
                className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${
                  role === 'client'
                    ? 'bg-[#0084ff] text-white font-bold shadow-[0_2px_10px_rgba(0,132,255,0.35)]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Client Portal
              </button>
              <button
                type="button"
                onClick={() => handleSelectRole('freelancer')}
                className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${
                  role === 'freelancer'
                    ? 'bg-[#0084ff] text-white font-bold shadow-[0_2px_10px_rgba(0,132,255,0.35)]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Freelancer Portal
              </button>
            </div>

            {error && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-pill-form">
              {isRegister && (
                <div className="login-pill-input-wrap">
                  <span className="login-pill-icon">
                    <UserIcon size={18} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="login-pill-input"
                  />
                </div>
              )}

              {/* Input: Email */}
              <div className="login-pill-input-wrap">
                <span className="login-pill-icon">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-pill-input"
                />
              </div>

              {/* Input: Password */}
              <div className="login-pill-input-wrap">
                <span className="login-pill-icon">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-pill-input"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="login-pill-submit-btn mt-2"
              >
                <span>{isLoading ? 'Signing In...' : isRegister ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight size={16} />
              </button>

              {/* Toggle Register / Sign In */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-xs text-[var(--muted)] hover:text-[#00e5ff] transition-colors"
                >
                  {isRegister
                    ? 'Already have an account? Sign in'
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
