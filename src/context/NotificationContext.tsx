'use client';

import React, { createContext, useContext, useState } from 'react';
import { AlertTriangle, AlertCircle, HelpCircle, CheckCircle2, X } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

export interface ConfirmConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void | Promise<void>;
}

interface NotificationContextType {
  toasts: Toast[];
  showToast: (title: string, message?: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  showConfirm: (config: ConfirmConfig) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null);

  const showToast = (title: string, message?: string, type: Toast['type'] = 'info') => {
    console.log('[NotificationContext] showToast:', { title, message, type });
    const id = Math.random().toString(36).substring(2);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showConfirm = (config: ConfirmConfig) => {
    setConfirmConfig(config);
  };

  const handleConfirmAction = async () => {
    if (confirmConfig?.onConfirm) {
      const fn = confirmConfig.onConfirm;
      setConfirmConfig(null);
      await fn();
    } else {
      setConfirmConfig(null);
    }
  };

  return (
    <NotificationContext.Provider value={{ toasts, showToast, removeToast, showConfirm }}>
      {children}

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmConfig && (
        <div className="fixed inset-0 z-[999999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card bg-obsidian-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl border ${
                    confirmConfig.type === 'danger'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : confirmConfig.type === 'warning'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  }`}
                >
                  {confirmConfig.type === 'danger' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : confirmConfig.type === 'warning' ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <HelpCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{confirmConfig.title}</h3>
                  <p className="text-[11px] text-slate-400">Confirmation required</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmConfig(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pt-1">{confirmConfig.message}</p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmConfig(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                {confirmConfig.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all ${
                  confirmConfig.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : confirmConfig.type === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-cyan-600 hover:bg-cyan-500'
                }`}
              >
                {confirmConfig.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREMIUM FLOATING TOAST CONTAINER AT TOP-RIGHT */}
      <div
        style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 99999999 }}
        className="flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              backgroundColor: '#0f172a',
              border:
                t.type === 'success'
                  ? '1px solid rgba(16, 185, 129, 0.6)'
                  : t.type === 'error'
                  ? '1px solid rgba(244, 63, 94, 0.6)'
                  : t.type === 'warning'
                  ? '1px solid rgba(245, 158, 11, 0.6)'
                  : '1px solid rgba(249, 115, 22, 0.6)',
              boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.8)',
            }}
            className="p-3.5 rounded-2xl flex items-start justify-between gap-3 pointer-events-auto transition-all duration-300 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {t.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400" />}
                {t.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-400" />}
                {t.type === 'info' && <HelpCircle className="w-5 h-5 text-thermal-400" />}
              </div>
              <div className="space-y-0.5">
                <h4 style={{ color: '#ffffff', fontWeight: 700, fontSize: '13px', margin: 0, lineHeight: 1.3 }}>
                  {t.title}
                </h4>
                {t.message && (
                  <p style={{ color: '#cbd5e1', fontSize: '11px', margin: 0, lineHeight: 1.4, fontWeight: 500 }}>
                    {t.message}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              style={{ color: '#94a3b8' }}
              className="hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};
