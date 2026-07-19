'use client';

import React, { useState } from 'react';
import { useTheme } from './ThemeProvider';
import { Sun, Moon, ArrowLeftRight, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import QuickSearchModal from './QuickSearchModal';

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
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
    <header className="flex min-h-16 flex-shrink-0 flex-col border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-14 pr-4 transition-colors duration-200 sm:min-h-20 sm:pl-16 sm:pr-8 md:px-8 py-3.5">
      <div className="flex min-h-12 items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold tracking-tight text-[var(--text-primary)] sm:text-xl">
            {title}
          </h2>
          {tender && (
            <Link
              href={`/tenders/${tender.id}`}
              className="mt-0.5 block max-w-[52vw] truncate text-xs font-semibold text-[var(--text-muted)] sm:hidden hover:text-[var(--brand-primary)]"
            >
              {tender.name} · {activeSection}
            </Link>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-5">
          {tender && (
            <div className="hidden items-center gap-3 sm:flex">
              <Link
                href={`/tenders/${tender.id}`}
                className="max-w-44 truncate text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
              >
                Tender: {tender.name}
              </Link>
              <nav aria-label="Tender sections" className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-1.5">
                {sectionLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    aria-current={activeSection === link.label ? 'page' : undefined}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
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
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/10 px-3 py-1.5 text-xs font-bold text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/20 transition-colors"
              >
                <ArrowLeftRight size={13} /> Switch
              </Link>
            </div>
          )}

          {/* Global Quick-Jump Search Control */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden items-center gap-2.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--brand-primary)]/40 transition-colors cursor-pointer md:flex"
            title="Global Quick-Jump (Ctrl+K)"
          >
            <Search size={14} className="text-[var(--brand-primary)]" />
            <span className="text-xs">Quick Jump...</span>
            <kbd className="ml-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-muted)]">
              Ctrl+K
            </kbd>
          </button>

          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-subtle)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>

      {/* Global Quick-Jump Modal */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        currentUserRole={currentUser?.role}
        tenderId={tender?.id}
      />
    </header>
  );
}
