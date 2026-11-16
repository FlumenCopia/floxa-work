'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff, Check } from 'lucide-react';
import { resetPassword } from '@/lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const isMinLength = newPassword.length >= 8;
  const isMatching = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token) {
      setErrorMessage('Password reset link is invalid or missing token. Please use the link from your email.');
      return;
    }

    if (!isMinLength) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, newPassword, confirmPassword);
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password. The link may have expired or is invalid.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-200/80 overflow-hidden relative z-10 grid grid-cols-1 md:grid-cols-12 min-h-[520px]">
      
      {/* Left Column: Brand & Security Guarantee */}
      <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-[#0084ff]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-6">
            <img
              src="/image/FLOXA_log.png"
              alt="FLOXA"
              className="h-[26px] w-auto object-contain invert brightness-200"
            />
            <span className="text-[10px] uppercase tracking-wider font-bold bg-[#0084ff] text-white px-2 py-0.5 rounded">
              Work
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-3">
            Choose a New Secure Password
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
            Your new password will safeguard your client agreements, milestone approvals, and verified credentials across FLOXA Work.
          </p>

          <div className="space-y-2.5 pt-3 border-t border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isMinLength ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span className={isMinLength ? 'text-emerald-300' : 'text-slate-400'}>
                At least 8 characters
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isMatching ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span className={isMatching ? 'text-emerald-300' : 'text-slate-400'}>
                Passwords match
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0084ff]" />
              <span>All past active sessions will be terminated</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>

      {/* Right Column */}
      <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center bg-white">
        <div className="max-w-md w-full mx-auto">
          {!token && !isSuccess ? (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center">
                <AlertCircle size={26} strokeWidth={2.2} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">
                  Invalid or Missing Reset Token
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  No valid reset token was detected in your link. Please open the link directly from your email or request a new reset link.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/forgot-password"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0084ff] hover:bg-[#0070e0] text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <span>Request New Reset Link</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          ) : isSuccess ? (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={26} strokeWidth={2.2} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">
                  Password Updated Successfully
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your FLOXA Work account password has been updated. All active sessions have been securely closed. You can now sign in with your new credentials.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0084ff] hover:bg-[#0070e0] text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <span>Sign In with New Password</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-1.5">
                  Set New Password
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter and confirm your new password below.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    New Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock size={16} className="absolute left-3.5 text-slate-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/15 outline-none text-xs text-slate-900 placeholder:text-slate-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock size={16} className="absolute left-3.5 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/15 outline-none text-xs text-slate-900 placeholder:text-slate-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#0084ff] hover:bg-[#0070e0] text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  <span>{isLoading ? 'Updating Password...' : 'Update Password'}</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-slate-200/50 rounded-full blur-3xl pointer-events-none" />

      <Suspense fallback={
        <div className="w-full max-w-4xl bg-white rounded-2xl p-12 text-center text-slate-500 text-xs">
          Loading password reset...
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}

