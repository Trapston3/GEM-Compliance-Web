'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Key, Mail, Phone, Loader2, User } from 'lucide-react';
import { updateOwnAccount } from '@/app/actions/user';
import { useToast } from '@/components/ui/toast';

interface AccountFormProps {
  user: {
    email: string;
    phone: string;
    nameEn: string;
    nameHi: string;
    designationEn: string | null;
    designationHi: string | null;
    departmentEn: string;
    departmentHi: string;
    mustChangePassword: boolean;
  };
}

export default function AccountForm({ user }: AccountFormProps) {
  const { update } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation do not match.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await updateOwnAccount({
        email,
        phone,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      if (res.success) {
        toast('Account updated successfully', 'success');
        
        // Trigger NextAuth session update
        await update({
          mustChangePassword: res.mustChangePassword,
          email: email,
        });

        // Reset password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while updating.');
      toast(err.message || 'Update failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {user.mustChangePassword && (
        <div className="p-4 border border-amber-900/30 bg-amber-950/20 text-amber-500 rounded-xl text-xs font-semibold">
          ⚠️ IMPORTANT: You are logged in with a temporary password. You must change your password below to unlock compliance tracker navigation.
        </div>
      )}

      {errorMsg && (
        <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-lg">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card (Read Only) */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 p-3 rounded-xl">
              <User size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white leading-none">{user.nameEn}</h3>
              <span className="text-[10px] text-slate-500 font-medium">{user.designationEn || 'No Designation'}</span>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-zinc-800 pt-4 space-y-2 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Name (Hindi)</span>
              <span className="text-slate-700 dark:text-zinc-300 font-semibold">{user.nameHi}</span>
            </div>
            {user.designationHi && (
              <div>
                <span className="text-slate-400 block font-medium">Designation (Hindi)</span>
                <span className="text-slate-700 dark:text-zinc-300 font-semibold">{user.designationHi}</span>
              </div>
            )}
            <div>
              <span className="text-slate-400 block font-medium">Department</span>
              <span className="text-slate-700 dark:text-zinc-300 font-semibold">{user.departmentHi} / {user.departmentEn}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Organization</span>
              <span className="text-slate-700 dark:text-zinc-300 font-semibold">एमआरपीएल MRPL (मंगलूरु Mangaluru)</span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleUpdate} className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-zinc-800 pb-2">
            Account Settings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail size={14} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-850 text-xs border border-slate-200 dark:border-zinc-750 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Phone size={14} />
                </span>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-850 text-xs border border-slate-200 dark:border-zinc-750 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-zinc-800 pb-2 pt-2">
            Security & Password Change
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                Current Password {(email !== user.email || newPassword) && <span className="text-rose-500">*</span>}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Key size={14} />
                </span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-850 text-xs border border-slate-200 dark:border-zinc-750 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                  required={email !== user.email || !!newPassword}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Key size={14} />
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-850 text-xs border border-slate-200 dark:border-zinc-750 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Key size={14} />
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-850 text-xs border border-slate-200 dark:border-zinc-750 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow-sm cursor-pointer transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
