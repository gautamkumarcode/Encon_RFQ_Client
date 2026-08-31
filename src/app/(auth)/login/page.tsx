'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { EnconLogo } from '../../../components/common/EnconLogo';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '647158339779-20m9220t1cg0err1jfd2fk5pmdf3cjlv.apps.googleusercontent.com';

function LoginFormContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, googleLogin } = useAuth();
  const { showToast } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await login(email, password);
      showToast('Authentication Successful', 'Welcome to Encon Command Center', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password';
      setErrorMsg(msg);
      showToast('Authentication Failed', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) return;
    setErrorMsg('');
    setSubmitting(true);
    try {
      await googleLogin(credentialResponse.credential);
      showToast('Google Sign-In Successful', 'Welcome to Encon Command Center', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Google Sign-In failed';
      setErrorMsg(msg);
      showToast('Google Authentication Failed', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-thermal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-thermal-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full glass-card rounded-3xl p-8 border border-slate-800 shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white p-2.5 mb-4 shadow-xl border border-slate-200">
            <EnconLogo className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide">ENCON</h1>
          <p className="text-xs text-slate-400 mt-1">Encon Thermal Engineers Pvt Ltd • Central Portal</p>
        </div>

        {/* ERROR ALERT BOX */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <span className="font-bold text-rose-400">⚠️ Error:</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-thermal-500 transition-colors"
                placeholder="pm@encon.co.in"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <Link
                href="/forgot-password"
                className="text-[11px] text-thermal-400 hover:text-thermal-300 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-thermal-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-thermal-600 to-thermal-500 hover:from-thermal-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-thermal-500/25 transition-all duration-200 flex items-center justify-center gap-2 border border-thermal-400/30"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In to Command Center</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* OR SEPARATOR */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <span className="relative bg-obsidian-900 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Or Continue With
          </span>
        </div>

        {/* GOOGLE SIGN IN BUTTON */}
        <div className="flex justify-center w-full min-h-[44px]">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              setErrorMsg('Google Sign-In was cancelled or failed.');
              showToast('Google Sign-In Failed', 'Unable to authenticate with Google', 'error');
            }}
            theme="filled_black"
            shape="pill"
            size="large"
            width="320"
            text="signin_with"
          />
        </div>

        <div className="mt-8 pt-4 border-t border-slate-800 text-center flex items-center justify-center gap-2 text-[10px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 256-bit JWT & RBAC Encrypted Session
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <LoginFormContent />
    </GoogleOAuthProvider>
  );
}
