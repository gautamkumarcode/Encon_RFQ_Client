'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { DashboardSummary } from '@/types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  FileText,
  Calculator,
  Clock,
  CheckCircle2,
  Award,
  Layers,
  ArrowUpRight,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';

interface DashboardClientProps {
  initialData?: DashboardSummary | null;
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const { user } = useAuth();
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useQuery<DashboardSummary>({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const res = await api.get('/dashboard/summary');
      return res.data.data;
    },
    initialData: initialData || undefined,
    staleTime: 60000,
  });

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-4 border-thermal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400">Loading Encon Live Dashboard Metrics...</p>
      </div>
    );
  }

  if ((isError && !data) || !data) {
    return (
      <div className="p-8 text-center glass-card rounded-2xl border-rose-500/30 space-y-3">
        <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
        <p className="text-rose-400 font-semibold text-sm">Failed to load dashboard metrics.</p>
        <p className="text-xs text-slate-400">Ensure backend API server is running.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white font-bold"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const { summaryCards, recentRFQs, recentOffers, topEmployees, monthlyTrends } = data;
  const isFullAccessRole = ['ADMIN', 'CO', 'GM', 'PRODUCTION_HEAD', 'SALES_MARKETING'].includes((user?.role || '').toUpperCase());
  const userName = user?.name || 'Encon User';

  return (
    <div className="space-y-4">
      {/* ROLE-BASED WELCOME HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-obsidian-900 via-slate-900 to-obsidian-950">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">
              Welcome back, {userName}!
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/rfq?tab=all"
            className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-thermal-500/50 text-right transition-all cursor-pointer group"
          >
            <span className="text-[10px] text-slate-400 block font-semibold group-hover:text-slate-300">
              {isFullAccessRole ? 'Total RFQ Database' : 'My Assigned RFQs'}
            </span>
            <span className="text-sm font-bold text-thermal-400 font-mono group-hover:text-thermal-300">
              {summaryCards.totalRFQs} Enquiries
            </span>
          </Link>
          <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 block font-semibold">Live Conversion Rate</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {summaryCards.overallConversionRate}%
            </span>
          </div>
        </div>
      </div>

      {/* METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total RFQs */}
        <Link
          href="/rfq?tab=all"
          className="glass-card glass-card-hover p-4 rounded-2xl border border-slate-800 hover:border-thermal-500/50 relative overflow-hidden transition-all duration-200 cursor-pointer group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200 uppercase tracking-wider transition-colors">
              Total Live RFQs
            </span>
            <div className="p-2 rounded-xl bg-thermal-500/10 text-thermal-400 border border-thermal-500/20 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-white font-mono group-hover:text-thermal-400 transition-colors">
              {summaryCards.totalRFQs}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
              <span>All database enquiries</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-thermal-400 transition-colors" />
            </p>
          </div>
        </Link>

        {/* 2. Under Review */}
        <Link
          href="/rfq?tab=review"
          className="glass-card glass-card-hover p-4 rounded-2xl border border-slate-800 hover:border-amber-500/50 relative overflow-hidden transition-all duration-200 cursor-pointer group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200 uppercase tracking-wider transition-colors">
              Under Review
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-amber-300 font-mono group-hover:text-amber-400 transition-colors">
              {summaryCards.pendingRFQs}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
              <span>Awaiting costing & approval</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </p>
          </div>
        </Link>

        {/* 3. Approved Costing */}
        <Link
          href="/rfq?tab=approved"
          className="glass-card glass-card-hover p-4 rounded-2xl border border-slate-800 hover:border-emerald-500/50 relative overflow-hidden transition-all duration-200 cursor-pointer group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200 uppercase tracking-wider transition-colors">
              Approved Costing
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-emerald-400 font-mono group-hover:text-emerald-300 transition-colors">
              {summaryCards.approvedOffers}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
              <span>Costing approved by management</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </p>
          </div>
        </Link>

        {/* 4. Offers Sent */}
        <Link
          href="/rfq?tab=offersent"
          className="glass-card glass-card-hover p-4 rounded-2xl border border-slate-800 hover:border-indigo-500/50 relative overflow-hidden transition-all duration-200 cursor-pointer group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200 uppercase tracking-wider transition-colors">
              Offers Sent
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-white font-mono group-hover:text-indigo-400 transition-colors">
              {summaryCards.totalOffersGenerated}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
              <span>Official offers sent to customer</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </p>
          </div>
        </Link>
      </div>

      {/* MAIN CHARTS & LEADERBOARD SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area Chart: Monthly Live Trends */}
        <div className="lg:col-span-2 glass-card p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-white">Engineering RFQ Pipeline Trends</h3>
              <p className="text-xs text-slate-400">Live Database RFQs vs Offers Generated</p>
            </div>
            <span className="text-xs text-thermal-400 font-semibold bg-thermal-500/10 px-2.5 py-1 rounded-lg border border-thermal-500/20">
              Live Database
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRfqs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOffers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="rfqs" stroke="#f97316" fillOpacity={1} fill="url(#colorRfqs)" name="RFQs" />
                <Area type="monotone" dataKey="offers" stroke="#6366f1" fillOpacity={1} fill="url(#colorOffers)" name="Offers" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real Assignees / Employee Performance */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-thermal-500" /> Assignee Workload & KPIs
              </h3>
              <span className="text-[10px] text-slate-400">Live DB</span>
            </div>

            <div className="space-y-2.5">
              {topEmployees.slice(0, 4).map((emp, i) => (
                <div key={emp.name} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-thermal-500/20 text-thermal-400 font-bold text-xs flex items-center justify-center border border-thermal-500/30">
                      #{i + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white truncate max-w-[110px]">{emp.name}</h4>
                      <p className="text-[10px] text-slate-400 truncate max-w-[110px]">{emp.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400">{emp.rfqsCreated} RFQs</span>
                    <span className="text-[9px] text-slate-500 block">{emp.approvedOffers} Offers</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 text-center">
            <Link href="/analytics" className="text-xs font-semibold text-thermal-400 hover:text-thermal-300 flex items-center justify-center gap-1">
              View Assignee Analytics <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* RECENT RFQS & OFFERS DUAL TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Live Recent RFQs */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-thermal-500" /> Recent Enquiries
            </h3>
            <Link href="/rfq" className="text-xs font-bold text-thermal-400 hover:underline">
              View All RFQs
            </Link>
          </div>

          <div className="space-y-2">
            {recentRFQs.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-4 text-center">No RFQs logged yet.</p>
            ) : (
              recentRFQs.map((rfq) => (
                <Link
                  key={rfq.id}
                  href={`/rfq/${rfq.id}`}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-slate-900/80 border border-slate-800 hover:border-thermal-500/40 flex items-center justify-between text-xs transition-all cursor-pointer group block"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-thermal-400 font-mono group-hover:underline">{rfq.rfqNumber}</span>
                      <span className="text-[11px] text-slate-300 truncate max-w-[130px]">• {rfq.clientName}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{rfq.projectType}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
                      {rfq.status}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-thermal-400 transition-colors" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Live Recent Offers */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-400" /> Recent Offers Released
            </h3>
            <Link href="/review" className="text-xs font-bold text-indigo-400 hover:underline">
              View Review Portal
            </Link>
          </div>

          <div className="space-y-2">
            {recentOffers.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-4 text-center">No offer mapped yet.</p>
            ) : (
              recentOffers.map((off) => (
                <Link
                  key={off.id}
                  href={`/rfq/${off.id}`}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 flex items-center justify-between text-xs transition-all cursor-pointer group block"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-400 font-mono group-hover:underline">{off.offerNumber}</span>
                      <span className="text-[11px] text-slate-300 truncate max-w-[130px]">• {off.clientName}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-slate-500" /> {off.preparedBy}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                      {off.status}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
