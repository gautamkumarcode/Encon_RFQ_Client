'use client';

import React from 'react';
import { Cpu, Receipt, FolderArchive, Users, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export default function FutureModulesPage() {
  const modules = [
    {
      title: 'Tally ERP Connector',
      icon: Receipt,
      category: 'Financial Ledger & Invoicing',
      status: 'IN_DEVELOPMENT',
      description: 'Automated sync between Encon Costing system approved offers, purchase orders, and Tally Prime ledgers.',
      features: [
        'Automatic Voucher Generation',
        'Tax & GST Calculation Validation',
        'Client Credit Limit Warnings',
      ],
    },
    {
      title: 'Technical Document Vault',
      icon: FolderArchive,
      category: 'Compliance & CAD Repository',
      status: 'IN_DEVELOPMENT',
      description: 'Centralized repository for furnace CAD drawings, combustion datasheets, ISO certifications, and client specs.',
      features: [
        'Version Controlled CAD Drawers',
        'Thermal Calculation Datasheets',
        'Granular Role Access Encryption',
      ],
    },
    {
      title: 'Encon HRMS Integration',
      icon: Users,
      category: 'Human Capital & Appraisals',
      status: 'IN_DEVELOPMENT',
      description: 'Employee directory sync, attendance logs, travel expense reimbursements, and sales target appraisals.',
      features: [
        'Engineering Performance Appraisals',
        'Site Travel Allowance Approvals',
        'Shift Attendance & Leave Management',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-2 text-thermal-400 font-bold text-xs mb-1">
          <Sparkles className="w-4 h-4 animate-spin" /> Extensible Architecture
        </div>
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-thermal-500" /> Future Ready Enterprise Extensions
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Modular extension slots built into Encon Command Center API Gateway for upcoming microservices
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.title} className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-thermal-500/10 text-thermal-400 border border-thermal-500/20">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                    {m.status}
                  </span>
                </div>

                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{m.category}</span>
                <h3 className="text-base font-bold text-white mt-1">{m.title}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{m.description}</p>

                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300">Planned Capabilities:</span>
                  {m.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-thermal-500 flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <button
                  disabled
                  className="w-full py-2.5 bg-slate-900 border border-slate-800 text-slate-500 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <span>API Adapter Ready</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
