'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  User, 
  LogOut, 
  FileText,
  Menu,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/primitives';

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
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { name: 'My Tenders', href: '/tenders', icon: LayoutDashboard },
    { name: 'My Account', href: '/account', icon: User },
  ];

  const isSuperuser = currentUser?.role === 'superuser';
  const tenderMatch = pathname.match(/^\/tenders\/(\d+)/);
  const tenderId = tenderMatch?.[1];

  const mobileItems = tenderId
    ? [
        { name: 'Overview', href: `/tenders/${tenderId}/overview` },
        { name: 'Bidders', href: `/tenders/${tenderId}/bidders` },
        { name: 'Matrix', href: `/tenders/${tenderId}/matrix` },
        { name: 'Setup', href: `/tenders/${tenderId}/checklist` },
        { name: 'Emails', href: `/tenders/${tenderId}/emails` },
        { name: 'Settings', href: `/tenders/${tenderId}/settings` },
      ]
    : [
        { name: 'Tenders', href: '/tenders' },
        { name: 'Account', href: '/account' },
        ...(isSuperuser ? [{ name: 'Admin', href: '/admin' }] : []),
      ];

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setIsMobileOpen(true)}
        className="fixed left-3 top-3 z-40 inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs md:hidden"
      >
        <Menu size={18} />
      </button>

      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-[rgb(15_27_45_/_0.55)] backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`${
          isMobileOpen ? 'flex fixed inset-y-0 left-0 z-50 w-72' : 'hidden md:flex'
        } bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xl md:static md:z-auto md:w-64 md:shadow-none flex-col h-full flex-shrink-0 border-r border-[var(--border-subtle)] transition-colors duration-200`}
      >
        {/* Sidebar Header / Logo */}
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] p-4 sm:p-5">
          <div className="rounded-[var(--radius-sm)] bg-[var(--brand-primary)] p-2 text-white">
            <FileText size={20} />
          </div>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setIsMobileOpen(false)}
            className="ml-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] md:hidden"
          >
            <X size={18} />
          </button>
          <div>
            <h1 className="font-bold text-base leading-none text-[var(--text-primary)]">Queries & Compliance</h1>
            <span className="text-xs font-medium text-[var(--text-muted)]">Tender Tracker</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {currentUser?.mustChangePassword ? (
            <div className="text-xs font-semibold p-3 border border-[var(--status-warning)]/30 bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] rounded-[var(--radius-sm)]">
              Please reset your password to unlock navigation.
            </div>
          ) : (
            <>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/tenders'
                    ? pathname === '/tenders' || pathname.startsWith('/tenders/')
                    : pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
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
                  className={`flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold transition-colors ${
                    pathname === '/admin'
                      ? 'bg-[var(--status-danger)] text-white shadow-xs'
                      : 'text-[var(--status-danger-text)] hover:bg-[var(--bg-subtle)]'
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
          <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 text-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="overflow-hidden pr-2">
                <p className="font-semibold text-[var(--text-primary)] truncate">{currentUser.nameEn}</p>
                <p className="text-[10px] text-[var(--text-muted)] truncate">{currentUser.email}</p>
              </div>
              <Badge tone={currentUser.role === 'superuser' ? 'danger' : currentUser.role === 'guest' ? 'neutral' : 'note'}>
                {currentUser.role}
              </Badge>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-1.5 font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        )}

        {/* Mobile Bottom Navigation Bar */}
        <nav
          aria-label="Mobile navigation"
          className="fixed inset-x-0 bottom-0 z-30 grid border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 shadow-md md:hidden"
          style={{ gridTemplateColumns: `repeat(${mobileItems.length}, minmax(0, 1fr))` }}
        >
          {mobileItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] px-1 text-[11px] font-semibold ${
                  isActive ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]' : 'text-[var(--text-muted)]'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
