'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import { Sun, Moon, ArrowLeftRight, Search, Keyboard } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import QuickSearchModal from './QuickSearchModal';
import ShortcutsModal from './ShortcutsModal';

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
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  
  // Global Keyboard listener for Ctrl+K and Ctrl+/ with Focus Guard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused = activeEl && (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) || (activeEl as HTMLElement).isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        if (isInputFocused && !isSearchOpen) return;
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        if (isInputFocused && !isShortcutsOpen) return;
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        if (isSearchOpen) setIsSearchOpen(false);
        if (isShortcutsOpen) setIsShortcutsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isShortcutsOpen]);

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
    <header className="flex min-h-16 flex-shrink-0 flex-col border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-14 pr-4 transition-colors duration-200 sm:min-h-20 sm:pl-16 sm:pr-8 md:px-8 py-3.5 relative z-20">
      <div className="flex min-h-12 items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold tracking-tight text-[var(--text-primary)] sm:text-xl">
            {title}
          </h2>
          {tender && (
            <span className="mt-0.5 block max-w-[52vw] truncate text-xs font-semibold text-[var(--text-muted)] sm:hidden">
              Tender: {tender.name}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {/* Desktop Tender Navigation */}
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

          {/* Universal Quick Search Button (Visible at ALL Breakpoints, NO Ctrl+K text badge) */}
          <button
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search tenders and bidders"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--brand-primary)]/40 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Search Tenders & Bidders (Ctrl+K)"
          >
            <Search size={16} className="text-[var(--brand-primary)] shrink-0" />
            <span className="hidden sm:inline text-xs">Search...</span>
          </button>

          {/* Shortcuts Cheat Sheet Button */}
          <button
            onClick={() => setIsShortcutsOpen(true)}
            aria-label="Keyboard Shortcuts"
            className="hidden min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-subtle)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] sm:inline-flex"
            title="Shortcuts Cheat Sheet (Ctrl+/)"
          >
            <Keyboard size={17} />
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

      {/* Option C: Horizontal Scrollable Sub-Header Section Tab Pill Bar (Mobile Viewports Only) */}
      {tender && (
        <nav
          aria-label="Mobile tender section navigation"
          className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-[var(--border-subtle)] pt-2.5 sm:hidden no-scrollbar"
        >
          {sectionLinks.map((link) => {
            const isActive = activeSection === link.label;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold transition-all shrink-0 border ${
                  isActive
                    ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-xs'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Global Quick-Jump Modal */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        currentUserRole={currentUser?.role}
        tenderId={tender?.id}
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </header>
  );
}
