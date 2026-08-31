'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { ActivityLog } from '../../../types';
import { History, Search, Shield, Filter, Terminal } from 'lucide-react';

export default function ActivityLogsPage() {
  const [actionFilter, setActionFilter] = useState('');
  const [emailQuery, setEmailQuery] = useState('');

  const { data: logs = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ['activityLogs', actionFilter, emailQuery],
    queryFn: async () => {
      const res = await api.get('/activity', {
        params: { action: actionFilter, email: emailQuery },
      });
      return res.data.data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-thermal-500" /> System Activity Audit Logs
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Immutable audit trail for logins, RFQ creations, offer approvals, and administrative actions
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by email address..."
            value={emailQuery}
            onChange={(e) => setEmailQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-thermal-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-thermal-500 w-full md:w-auto"
        >
          <option value="">All Action Types</option>
          <option value="LOGIN">LOGIN</option>
          <option value="LOGOUT">LOGOUT</option>
          <option value="USER_CREATED">USER_CREATED</option>
          <option value="RFQ_CREATED">RFQ_CREATED</option>
          <option value="OFFER_GENERATED">OFFER_GENERATED</option>
          <option value="APPLICATION_LAUNCHED">APPLICATION_LAUNCHED</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No activity logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-4">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">{log.userEmail}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-thermal-500/20 text-thermal-300 border border-thermal-500/30">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="py-3.5 px-4">
                      <code className="text-[10px] bg-slate-950 px-2 py-1 rounded text-slate-300 font-mono block max-w-xs truncate border border-slate-800">
                        {log.details || '{}'}
                      </code>
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
