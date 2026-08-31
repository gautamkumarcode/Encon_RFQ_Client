'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '../../../services/api';
import { useNotification } from '../../../context/NotificationContext';
import { Flame, Mail, ArrowLeft, Send } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const { showToast } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      showToast('Reset Requested', res.data.message, 'success');
      if (res.data.debugToken) {
        setResetToken(res.data.debugToken);
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Failed to request reset', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full glass-card rounded-3xl p-8 border border-slate-800 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-thermal-500/20 text-thermal-400 mb-3 border border-thermal-500/30">
            <Flame className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white">Reset Password</h1>
          <p className="text-xs text-slate-400 mt-1">Enter your registered Encon email address</p>
        </div>

        {resetToken ? (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              <p className="font-semibold mb-1">Reset Token Dispatched</p>
              <p className="text-[11px]">For dev environment testing, your reset token is:</p>
              <code className="block mt-2 p-2 bg-slate-950 rounded text-[10px] text-white font-mono break-all">
                {resetToken}
              </code>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-thermal-400 hover:text-thermal-300"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </div>
        ) : (
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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-thermal-500"
                  placeholder="name@encon.co.in"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-thermal-600 to-thermal-500 hover:from-thermal-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Reset Request</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link href="/login" className="text-xs text-slate-400 hover:text-white transition-colors">
                ← Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
