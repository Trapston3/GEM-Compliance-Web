'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';
import { Sun, Moon, UserCheck, ArrowLeftRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  title: string;
  currentUser: {
    nameEn: string;
    role: string;
  } | null;
  tender?: { id: number; name: string } | null;
}

export default function Header({ title, currentUser, tender }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  
  const activeSection = tender
    ? pathname.endsWith('/overview') ? 'Overview'
      : pathname.endsWith('/bidders') ? 'Bidders'
        : pathname.endsWith('/matrix') ? 'Compliance Matrix'
          : pathname.endsWith('/checklist') ? 'Checklist Setup'
            : pathname.endsWith('/emails') ? 'Emails'
              : pathname.endsWith('/settings') ? 'Settings'
                : null
    : null;

  const sectionLinks = tender ? [
    { label: 'Overview', href: `/tenders/${tender.id}/overview` },
    { label: 'Bidders', href: `/tenders/${tender.id}/bidders` },
    { label: 'Compliance Matrix', href: `/tenders/${tender.id}/matrix` },
    { label: 'Checklist Setup', href: `/tenders/${tender.id}/checklist` },
    { label: 'Emails', href: `/tenders/${tender.id}/emails` },
    { label: 'Settings', href: `/tenders/${tender.id}/settings` },
  ] : [];

  return (
    <header className="flex min-h-14 flex-shrink-0 flex-col border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-14 pr-3 transition-colors duration-200 sm:min-h-16 sm:pl-14 sm:pr-6 md:px-6">
      <div className="flex min-h-14 items-center justify-between gap-3 sm:min-h-16">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-[var(--text-primary)] sm:text-lg">
            {title}
          </h2>
          {tender && (
            <Link
              href={`/tenders/${tender.id}`}
              className="mt-0.5 block max-w-[52vw] truncate text-xs font-medium text-[var(--text-muted)] sm:hidden hover:text-[var(--brand-primary)]"
            >
              {tender.name} · {activeSection}
            </Link>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {tender && (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href={`/tenders/${tender.id}`}
                className="max-w-40 truncate text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--brand-primary)]"
              >
                Tender: {tender.name}
              </Link>
              <nav aria-label="Tender sections" className="flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-1">
                {sectionLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    aria-current={activeSection === link.label ? 'page' : undefined}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors ${
                      activeSection === link.label
                        ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <Link
                href="/tenders"
                aria-label="Switch tender"
                className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/10 px-2.5 py-1.5 text-[10px] font-bold text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/20 transition-colors"
              >
                <ArrowLeftRight size={12} /> Switch
              </Link>
            </div>
          )}

          {/* User Info Capsule */}
          {currentUser && (
            <div className="hidden items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] md:flex">
              <UserCheck size={14} className="text-[var(--brand-primary)]" />
              <span>Logged in as: <strong className="text-[var(--text-primary)]">{currentUser.nameEn}</strong></span>
            </div>
          )}

          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-subtle)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
}
