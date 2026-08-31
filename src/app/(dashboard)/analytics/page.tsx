'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { EmployeeKPI } from '../../../types';
import { BarChart3, TrendingUp, Award, Clock, DollarSign, FileText, Calculator } from 'lucide-react';

export default function EmployeeAnalyticsPage() {
  const { data: employees = [], isLoading } = useQuery<EmployeeKPI[]>({
    queryKey: ['employeeAnalytics'],
    queryFn: async () => {
      const res = await api.get('/dashboard/employee-analytics');
      return res.data.data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-thermal-500" /> Employee Performance & Analytics
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Individual KPI tracking for Sales Executives, Design Engineers, and Sales Managers
        </p>
      </div>

      {/* KPI Leaderboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {employees.map((emp, i) => (
          <div
            key={emp.email}
            className="glass-card glass-card-hover p-5 rounded-3xl border border-slate-800 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-thermal-500/20 text-thermal-300 border border-thermal-500/30">
                Rank #{i + 1}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" /> Active
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-bold text-white">{emp.name}</h3>
              <p className="text-[11px] text-slate-400">{emp.role}</p>
            </div>

            <div className="mt-4 space-y-2 pt-3 border-t border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">RFQs Created:</span>
                <span className="font-bold text-white">{emp.rfqsCreated}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Offers Generated:</span>
                <span className="font-bold text-indigo-400">{emp.offersGenerated}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Conversion Rate:</span>
                <span className="font-bold text-emerald-400">{emp.conversionRate}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Revenue Booked:</span>
                <span className="font-bold text-thermal-400">₹{(emp.totalRevenueINR / 100000).toFixed(1)} L</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Analytics Table */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-thermal-500" /> Performance Breakdown
          </h3>
          <span className="text-xs text-slate-400">Encon Thermal Engineers</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading performance data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">RFQs Created</th>
                  <th className="py-3.5 px-4">Offers Generated</th>
                  <th className="py-3.5 px-4">Approved Deals</th>
                  <th className="py-3.5 px-4">Conversion Rate</th>
                  <th className="py-3.5 px-4">Total Revenue (INR)</th>
                  <th className="py-3.5 px-4">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {employees.map((emp) => (
                  <tr key={emp.email} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-thermal-500/20 text-thermal-400 font-bold text-xs flex items-center justify-center border border-thermal-500/30">
                          {emp.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-white">{emp.name}</p>
                          <p className="text-[10px] text-slate-400">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">{emp.rfqsCreated}</td>
                    <td className="py-3.5 px-4 font-semibold text-indigo-400">{emp.offersGenerated}</td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-400">{emp.approvedOffers}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${emp.conversionRate}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-emerald-400 text-xs">{emp.conversionRate}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-thermal-400">
                      ₹{(emp.totalRevenueINR / 100000).toFixed(2)} Lakhs
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(emp.lastActivity).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
