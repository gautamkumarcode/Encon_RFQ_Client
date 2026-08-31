'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { NotificationItem } from '../../types';
import { EnconLogo } from '../common/EnconLogo';
import Link from 'next/link';
import {
  Bell,
  Search,
  LogOut,
  ChevronDown,
  Moon,
  Sun,
  Menu,
  User as UserIcon,
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useNotification();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const { data: notifications = [] } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data.data || [];
    },
    enabled: !!user?.id,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-40 h-16 bg-obsidian-900/90 backdrop-blur-md border-b border-slate-800 px-3 md:px-6 flex items-center justify-between">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center gap-2 md:gap-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 md:hidden border border-slate-700/50"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5 text-slate-200" />
          </button>
        )}
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-slate-950 p-1 flex items-center justify-center border border-slate-800 shrink-0">
          <EnconLogo className="w-6 h-6 md:w-7 md:h-7" />
        </div>
        <div>
          <span className="font-extrabold text-lg md:text-xl text-white tracking-wide">ENCON</span>
          <p className="text-[10px] text-slate-400 hidden sm:block">Thermal Engineers Pvt Ltd • Centralized OS</p>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="hidden md:flex items-center relative max-w-md w-full mx-4">
        <Search className="w-4 h-4 absolute left-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search RFQs, Offers, Users, or Logs..."
          className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-900/80 border border-slate-700/60 rounded-xl text-slate-200 focus:outline-none focus:border-thermal-500 transition-colors"
        />
      </div>

      {/* Right Tools */}
      <div className="flex items-center gap-3">
        {/* Notifications Dropdown */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowUserMenu(false);
            }}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors relative border border-slate-700/50"
          >
            <Bell className="w-4 h-4 text-slate-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-thermal-500 text-white text-[9px] font-bold flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 glass-card rounded-2xl p-4 shadow-2xl z-50">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-thermal-500" /> System Notifications
                </span>
                <span className="text-[10px] text-thermal-400">{unreadCount} unread</span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl border text-xs transition-colors ${
                        n.isRead ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-800/80 border-thermal-500/30'
                      }`}
                    >
                      <h5 className="font-semibold text-white">{n.title}</h5>
                      <p className="text-[11px] text-slate-300 mt-0.5">{n.message}</p>
                      <span className="text-[9px] text-slate-500 mt-1 block">
                        {new Date(n.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-slate-300 hover:text-white transition-all duration-300 group"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400 group-hover:-rotate-12 transition-transform duration-300" />
          )}
        </button>

        {/* User Avatar Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifMenu(false);
            }}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-950 p-0.5 border border-slate-800 flex items-center justify-center shrink-0">
              <EnconLogo className="w-5 h-5" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-white leading-tight">{user?.name}</div>
              <div className="text-[10px] text-thermal-400 leading-tight">
                {typeof user?.role === 'object' ? (user?.role as any).name : user?.role}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 glass-card rounded-2xl p-2 shadow-2xl z-50">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <p className="text-xs font-bold text-white">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[9px] px-2 py-0.5 rounded bg-thermal-500/20 text-thermal-300 font-medium">
                  {typeof user?.role === 'object' ? (user?.role as any).name : user?.role}
                </span>
              </div>

              <Link
                href="/profile"
                onClick={() => setShowUserMenu(false)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800/60 rounded-xl transition-colors font-medium"
              >
                <UserIcon className="w-3.5 h-3.5 text-thermal-400" /> My Profile & Settings
              </Link>

              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors mt-1 font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out Session
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
