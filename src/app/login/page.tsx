'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FileText, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Button, Card, Input } from '@/components/ui/primitives';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error.includes('Too many failed attempts')) {
          setErrorMsg('Too many failed attempts. Try again in 15 minutes.');
          toast('Account locked temporarily due to failed attempts.', 'error');
        } else {
          setErrorMsg('Invalid email or password.');
          toast('Failed to sign in', 'error');
        }
      } else {
        toast('Logged in successfully', 'success');
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] p-4 transition-colors duration-200">
      <Card className="max-w-md w-full p-8 space-y-6">
        
        {/* Logo / Branding */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="bg-[var(--brand-primary)] text-white p-3 rounded-[var(--radius-md)] shadow-sm">
            <FileText size={28} />
          </div>
          <h2 className="text-xl font-extrabold text-[var(--text-primary)]">
            Queries & Compliance
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Tender Compliance Tracker Login
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 text-xs font-semibold text-[var(--status-danger-text)] bg-[var(--status-danger-bg)] border border-[var(--status-danger)]/30 rounded-[var(--radius-sm)]">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
          />

          <div className="space-y-1 relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-[26px] flex min-h-11 min-w-11 items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full mt-2">
            Sign In
          </Button>
        </form>
      </Card>
    </div>
  );
}
