'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Mail, 
  ShieldAlert, 
  User, 
  LogOut, 
  Save, 
  Loader2,
  FileText,
  Menu,
  X
} from 'lucide-react';
import { updateTender } from '@/app/actions/tender';
import { useToast } from './ui/toast';

interface SidebarProps {
  tender: {
    id: number;
    name: string;
    subjectLine: string | null;
  } | null;
  currentUser: {
    nameEn: string;
    email: string;
    role: string;
    mustChangePassword: boolean;
  } | null;
}

export default function Sidebar({ tender, currentUser }: SidebarProps) {
  const pathname = usePathname();
  const { toast } = useToast();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const [tenderName, setTenderName] = useState(tender?.name || '');
  const [subjectLine, setSubjectLine] = useState(tender?.subjectLine || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleTenderSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tender) return;
    setIsSaving(true);
    try {
      const res = await updateTender({
        id: tender.id,
        name: tenderName,
        subjectLine: subjectLine || null,
      });
      if (res.success) {
        toast('Tender details updated successfully', 'success');
      }
    } catch (err: any) {
      toast(err.message || 'Failed to update tender details', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Checklist Settings', href: '/checklist', icon: CheckSquare },
    { name: 'Bulk Emails', href: '/emails', icon: Mail },
    { name: 'My Account', href: '/account', icon: User },
  ];

  const isSuperuser = currentUser?.role === 'superuser';

  return (
    <>
      <button type="button" aria-label="Open navigation" onClick={() => setIsMobileOpen(true)} className="fixed left-3 top-3 z-40 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm md:hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
        <Menu size={18} />
      </button>
      {isMobileOpen && (
        <button type="button" aria-label="Close navigation overlay" onClick={() => setIsMobileOpen(false)} className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[1px] md:hidden" />
      )}
      <aside className={isMobileOpen ? "flex fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 shadow-2xl md:static md:z-auto md:flex md:w-64 md:shadow-none flex-col h-full flex-shrink-0 border-r border-slate-800" : "hidden fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 shadow-2xl md:static md:z-auto md:flex md:w-64 md:shadow-none flex-col h-full flex-shrink-0 border-r border-slate-800"}>
      {/* Sidebar Header / Logo */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-indigo-600 text-white p-2 rounded-lg">
          <FileText size={20} />
        </div>
        <button type="button" aria-label="Close navigation" onClick={() => setIsMobileOpen(false)} className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-white md:hidden">
          <X size={18} />
        </button>
        <div>
          <h1 className="text-white font-bold text-base leading-none">MRPL Compliance</h1>
          <span className="text-xs text-slate-500 font-medium">Tender Tracker</span>
        </div>
      </div>

      {/* Tender Settings Form (Visible to authenticated users) */}
      {tender && !currentUser?.mustChangePassword && (
        <form onSubmit={handleTenderSave} className="p-4 border-b border-slate-800 bg-slate-950/40">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tender Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Tender Name</label>
              <input
                type="text"
                value={tenderName}
                onChange={(e) => setTenderName(e.target.value)}
                placeholder="Tender Name"
                className="w-full text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded p-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Subject Line</label>
              <textarea
                value={subjectLine}
                onChange={(e) => setSubjectLine(e.target.value)}
                placeholder="Reply to Queries subject suffix"
                className="w-full text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded p-1.5 focus:outline-none focus:border-indigo-500 transition-colors resize-none h-14"
              />
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-1.5 px-3 rounded cursor-pointer transition-colors disabled:bg-indigo-850"
            >
              {isSaving ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Save size={12} />
              )}
              Save Settings
            </button>
          </div>
        </form>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {currentUser?.mustChangePassword ? (
          <div className="text-xs text-amber-500 font-semibold p-2 border border-amber-900/30 bg-amber-950/20 rounded">
            Please reset your password to unlock navigation.
          </div>
        ) : (
          <>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon size={16} />
                  {item.name}
                </Link>
              );
            })}

            {isSuperuser && (
              <Link
                href="/admin"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  pathname === '/admin'
                    ? 'bg-rose-600 text-white'
                    : 'hover:bg-slate-800 text-rose-400 hover:text-rose-300'
                }`}
              >
                <ShieldAlert size={16} />
                Admin Dashboard
              </Link>
            )}
          </>
        )}
      </nav>

      {/* Sidebar Footer / User Profile & Logout */}
      {currentUser && (
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="overflow-hidden pr-2">
              <p className="font-semibold text-slate-200 truncate">{currentUser.nameEn}</p>
              <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide shrink-0 ${
              currentUser.role === 'superuser' 
                ? 'bg-rose-950/40 text-rose-400 border border-rose-900/30' 
                : currentUser.role === 'guest'
                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                : 'bg-indigo-950/40 text-indigo-400 border border-indigo-900/30'
            }`}>
              {currentUser.role}
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center justify-center gap-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold py-1.5 border border-slate-800 rounded transition-colors cursor-pointer"
          >
            <LogOut size={12} />
            Sign Out
          </button>
        </div>
      )}
      </aside>
    </>
  );
}
