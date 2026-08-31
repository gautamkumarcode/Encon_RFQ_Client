'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  BarChart3,
  History,
  Bell,
  Cpu,
  Lock,
  FileSpreadsheet,
  CheckSquare,
  User as UserIcon,
  X,
} from 'lucide-react';
import { EnconLogo } from '../common/EnconLogo';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onMobileClose }) => {
  const pathname = usePathname();
  const { user, hasPermission } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, perm: null },
    { label: 'RFQ & Offer Tracker', path: '/rfq', icon: FileSpreadsheet, perm: null },
    { label: 'Admin Review Portal', path: '/review', icon: CheckSquare, perm: null, reviewOnly: true },
    { label: 'User Management', path: '/users', icon: Users, perm: 'USER_MGMT', adminOnly: true },
    { label: 'Role & Permissions', path: '/roles', icon: ShieldAlert, perm: null, adminOnly: true },
    { label: 'Employee Analytics', path: '/analytics', icon: BarChart3, perm: 'ANALYTICS', adminOnly: true },
    { label: 'Audit Activity Logs', path: '/activity', icon: History, perm: 'ACTIVITY_LOGS', adminOnly: true },
    { label: 'Notifications', path: '/notifications', icon: Bell, perm: null },
    { label: 'Future Extensions', path: '/future-modules', icon: Cpu, perm: null, adminOnly: true },
  ];

  const userRole = (user?.role || '').toUpperCase();
  const canReview = ['ADMIN', 'CO', 'GM', 'PRODUCTION_HEAD'].includes(userRole);

  const renderNav = () => (
    <div className="space-y-3">
      <div>
        <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
          Core Operations
        </h3>
        <nav className="space-y-1">
          {navItems.map((item) => {
            if (item.reviewOnly && !canReview) return null;
            if (item.adminOnly && userRole !== 'ADMIN') return null;
            if (item.perm && !hasPermission(item.perm, 'READ') && userRole !== 'ADMIN') return null;

            const isActive = pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => onMobileClose && onMobileClose()}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-800 text-white font-bold border-l-2 border-thermal-500 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-thermal-500' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="w-60 bg-obsidian-900 border-r border-slate-800 hidden md:flex flex-col justify-between p-3 h-full shrink-0 overflow-y-auto">
        {renderNav()}
        <div className="glass-card rounded-xl p-3 border border-slate-800 text-center mt-auto">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-300">
            <Lock className="w-3.5 h-3.5 text-thermal-500" /> RBAC Enforced
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Encon Thermal Enterprise v1.0.4</p>
        </div>
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
          />

          {/* Drawer Content */}
          <div className="relative w-64 max-w-[80vw] bg-obsidian-900 border-r border-slate-800 flex flex-col justify-between p-4 h-full z-10 overflow-y-auto shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center border border-slate-200">
                    <EnconLogo className="w-5 h-5" />
                  </div>
                  <span className="font-extrabold text-base text-white tracking-wide">ENCON</span>
                </div>
                <button
                  onClick={onMobileClose}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {renderNav()}
            </div>

            <div className="glass-card rounded-xl p-3 border border-slate-800 text-center mt-6">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-300">
                <Lock className="w-3.5 h-3.5 text-thermal-500" /> RBAC Enforced
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Encon Thermal Enterprise v1.0.4</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
