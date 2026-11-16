'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { requestPasswordReset } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      await requestPasswordReset(cleanEmail);
      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-slate-200/50 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-200/80 overflow-hidden relative z-10 grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
        
        {/* Left Column: Brand & Security Guarantee */}
        <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-[#0084ff]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Logo Row */}
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
              Account Security &amp; Access Recovery
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
              Recover access to your FLOXA Work account securely. We deliver a cryptographic single-use reset link directly to your verified inbox.
            </p>

            <div className="space-y-3 pt-2 border-t border-slate-800 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0084ff]" />
                <span>Single-use encrypted tokens (60 min expiry)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0084ff]" />
                <span>Instant session revocation across devices</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0084ff]" />
                <span>Zero spam &amp; tamper-evident audit logging</span>
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

        {/* Right Column: Recovery Form or Success State */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto">
            {isSubmitted ? (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={26} strokeWidth={2.2} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-1">
                    Reset Link Dispatched
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    If an account exists for <strong className="text-slate-900 font-semibold">{email}</strong>, a secure password reset link has been dispatched to your inbox.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">Next Steps:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                    <li>Check your inbox and spam / promotions folder.</li>
                    <li>Click the link inside within <strong>60 minutes</strong>.</li>
                    <li>Choose a strong, unique new password.</li>
                  </ul>
                </div>

                <div className="pt-2 space-y-3">
                  <Link
                    href="/"
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0084ff] hover:bg-[#0070e0] text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Return to Sign In</span>
                    <ArrowRight size={15} />
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSubmitted(false);
                      setErrorMessage('');
                    }}
                    className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-medium py-1 transition-colors cursor-pointer"
                  >
                    Try another email address
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-1.5">
                    Forgot Password?
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Enter the email associated with your FLOXA Work account and we&apos;ll send you a password reset link.
                  </p>
                </div>

                {errorMessage && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0 text-red-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail size={16} className="absolute left-3.5 text-slate-400" />
                      <input
                        type="email"
                        required
                        autoFocus
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/15 outline-none text-xs text-slate-900 placeholder:text-slate-400 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#0084ff] hover:bg-[#0070e0] text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                  >
                    <span>{isLoading ? 'Sending Link...' : 'Send Reset Link'}</span>
                    <ArrowRight size={15} />
                  </button>

                  <div className="text-center pt-3 border-t border-slate-100 mt-4">
                    <Link
                      href="/"
                      className="text-xs text-slate-500 hover:text-[#0084ff] font-medium transition-colors inline-flex items-center gap-1.5"
                    >
                      <ArrowLeft size={13} />
                      <span>Back to Sign In</span>
                    </Link>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

