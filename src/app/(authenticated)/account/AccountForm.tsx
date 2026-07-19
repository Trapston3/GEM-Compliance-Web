'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Key, Mail, Phone, User, AlertTriangle } from 'lucide-react';
import { updateOwnAccount } from '@/app/actions/user';
import { useToast } from '@/components/ui/toast';
import { Button, Card, Input } from '@/components/ui/primitives';

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
        
        await update({
          mustChangePassword: res.mustChangePassword,
          email: email,
        });

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        window.location.href = '/';
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
        <div className="p-4 border border-[var(--status-warning)]/30 bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] rounded-[var(--radius-sm)] text-xs font-semibold flex items-center gap-2">
          <AlertTriangle size={18} className="shrink-0 text-[var(--status-warning)]" />
          <span>You are logged in with a temporary password. You must change your password below to unlock navigation.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 text-xs font-semibold text-[var(--status-danger-text)] bg-[var(--status-danger-bg)] border border-[var(--status-danger)]/30 rounded-[var(--radius-sm)]">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <Card className="lg:col-span-1 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] p-3 rounded-[var(--radius-sm)]">
              <User size={24} />
            </div>
            <div>
              <h3 className="font-bold text-[var(--text-primary)] leading-none">{user.nameEn}</h3>
              <span className="text-[10px] text-[var(--text-muted)] font-medium">{user.designationEn || 'No Designation'}</span>
            </div>
          </div>

          <div className="border-t border-[var(--border-subtle)] pt-4 space-y-2 text-xs">
            <div>
              <span className="text-[var(--text-muted)] block font-medium">Name (Hindi)</span>
              <span className="text-[var(--text-primary)] font-semibold">{user.nameHi}</span>
            </div>
            {user.designationHi && (
              <div>
                <span className="text-[var(--text-muted)] block font-medium">Designation (Hindi)</span>
                <span className="text-[var(--text-primary)] font-semibold">{user.designationHi}</span>
              </div>
            )}
            <div>
              <span className="text-[var(--text-muted)] block font-medium">Department</span>
              <span className="text-[var(--text-primary)] font-semibold">{user.departmentHi} / {user.departmentEn}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block font-medium">Organization</span>
              <span className="text-[var(--text-primary)] font-semibold">Tender Compliance System</span>
            </div>
          </div>
        </Card>

        {/* Edit Form */}
        <form onSubmit={handleUpdate} className="lg:col-span-2">
          <Card className="p-6 space-y-5">
            <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
              Account Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Phone Number"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2 pt-2">
              Security & Password Change
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required={email !== user.email || !!newPassword}
              />

              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={isLoading}>
                Save Changes
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}
