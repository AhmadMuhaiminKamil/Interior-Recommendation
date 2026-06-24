'use client';

import { useState } from 'react';
import Link from 'next/link';
import { login } from '../actions';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(username, password);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Username atau password salah';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4" style={{ overflow: 'hidden', position: 'relative' }}>

      {/* Ambient background orbs — clipped inside viewport */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-purple-700/10 rounded-full blur-[100px] animate-pulse -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-pink-700/10 rounded-full blur-[100px] animate-pulse translate-x-1/3 translate-y-1/3" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 left-2/3 w-[250px] h-[250px] bg-violet-600/5 rounded-full blur-[70px]" />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-[420px]">

        {/* Glow ring behind card */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-600/20 via-pink-600/10 to-transparent blur-xl scale-105 -z-10" />

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/[0.07] rounded-3xl shadow-2xl shadow-black/60 overflow-hidden">

          {/* Top accent bar */}
          <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-purple-500 to-pink-500" />

          <div className="p-8 pt-10">

            {/* Logo + Header */}
            <div className="text-center mb-10">
              {/* Icon badge */}
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg shadow-purple-600/40 mb-5">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="9 22 9 12 15 12 15 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent leading-tight">
                Interior AI
              </h1>
              <p className="text-slate-500 text-sm mt-2 font-light tracking-wide">
                Masuk ke akun Anda untuk melanjutkan
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <span className="text-red-400 mt-0.5 shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                <p className="text-red-400 text-sm font-medium leading-snug">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">

              {/* Username Input */}
              <div className="space-y-2">
                <label htmlFor="username" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Username
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </span>
                  <input
                    id="username"
                    type="text"
                    placeholder="Masukkan username Anda"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-800/60 border border-white/[0.07] text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 focus:bg-slate-800/80 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    Password
                  </label>
                </div>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password Anda"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-slate-800/60 border border-white/[0.07] text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 focus:bg-slate-800/80 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full overflow-hidden group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-purple-700/30 disabled:shadow-none flex items-center justify-center gap-2 text-sm tracking-wide"
                >
                  {/* Shimmer effect */}
                  <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 ease-in-out" />

                  {loading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-[2px] border-white/30 border-t-white" />
                      <span>Sedang Masuk...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>


      </div>
    </div>
  );
}