'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { api } from '@/services/api';
import { EnconLogo } from '@/components/common/EnconLogo';
import {
  User,
  Mail,
  Phone,
  Building,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Lock,
  Save,
  Calendar,
  Sparkles,
} from 'lucide-react';

export default function UserProfilePage() {
  const { user, refreshProfile } = useAuth();
  const { showToast } = useNotification();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [department, setDepartment] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setMobile(user.mobile || '');
      setDepartment(user.department || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name Required', 'Please enter your full name.', 'error');
      return;
    }

    setSavingProfile(true);
    try {
      await api.put('/auth/profile', {
        name,
        mobile,
        department,
      });
      await refreshProfile();
      showToast('Profile Updated', 'Your profile details have been saved successfully.', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile';
      showToast('Update Failed', msg, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      showToast('Password Required', 'Please enter your current password.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Weak Password', 'New password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Password Mismatch', 'New password and confirmation do not match.', 'error');
      return;
    }

    setSavingPassword(true);
    try {
      await api.post('/auth/change-password', {
        oldPassword,
        newPassword,
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password Changed 🔒', 'Your account password has been updated successfully.', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to change password';
      showToast('Password Update Failed', msg, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="p-12 text-center text-slate-400">
        <User className="w-8 h-8 text-thermal-500 animate-spin mx-auto" />
        <p className="text-xs font-semibold mt-2">Loading user profile...</p>
      </div>
    );
  }

  const roleName = (user.role || 'USER').toUpperCase();
  const createdDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';

  return (
    <div className="space-y-6 w-full">
      {/* BRAND PROFILE HEADER */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {/* DEFAULT COMPANY LOGO AVATAR FRAME */}
          <div className="w-20 h-20 rounded-2xl bg-slate-950 p-2.5 border border-slate-800 shadow-2xl flex items-center justify-center shrink-0 relative group">
            <EnconLogo className="w-14 h-14" />
            <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full border-2 border-slate-950" title="Active Enterprise Account"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white tracking-wide">{user.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-thermal-500/20 text-thermal-400 border border-thermal-500/30">
                {roleName}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>{user.email}</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 font-mono">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span>Account Member Since {createdDate}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>256-bit Encrypted Session</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EDIT PROFILE DETAILS CARD */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-thermal-400" /> Personal Profile Details
            </h2>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">View & Edit</span>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-thermal-500"
                  placeholder="Enter your name"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Email Address (Read-Only)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full bg-slate-900/60 border border-slate-800/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Mobile / Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-thermal-500"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Department / Division</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-thermal-500"
                  placeholder="Thermal Engineering / Sales & Marketing"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-2.5 rounded-xl bg-thermal-500 hover:bg-thermal-600 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-thermal-500/20"
              >
                <Save className="w-4 h-4" />
                {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* SECURITY & PASSWORD CHANGE CARD */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" /> Account Security & Password
            </h2>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Protected</span>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Current Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-thermal-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">New Password (Min 6 chars)</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-thermal-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Confirm New Password</label>
              <div className="relative">
                <CheckCircle2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-thermal-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPassword}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 border border-slate-700"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                {savingPassword ? 'Updating Password...' : 'Update Account Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
