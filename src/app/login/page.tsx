'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FileText, Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

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
        // NextAuth sends "CredentialsSignin" or custom errors
        if (res.error.includes('Too many failed attempts')) {
          setErrorMsg('Too many failed attempts. Try again in 15 minutes.');
          toast('Account locked temporarily due to failed attempts.', 'error');
        } else {
          setErrorMsg('Invalid email or password.');
          toast('Failed to sign in', 'error');
        }
      } else {
        toast('Logged in successfully', 'success');
        // Redirect to dashboard
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4 transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-8 space-y-6">
        
        {/* Logo / Branding */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-md">
            <FileText size={28} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">
            MRPL Materials Department
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Tender Compliance Tracker login
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-lg">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 block">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@mrpl.co.in"
                className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-zinc-800/50 text-sm border border-slate-200 dark:border-zinc-700/50 rounded-xl focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-slate-800 dark:text-white transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 block">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2 bg-slate-50 dark:bg-zinc-800/50 text-sm border border-slate-200 dark:border-zinc-700/50 rounded-xl focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-slate-800 dark:text-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-md cursor-pointer transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
