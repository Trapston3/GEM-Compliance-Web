'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import { Sun, Moon, ArrowLeftRight, Search, Menu, X, Keyboard } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import QuickSearchModal from './QuickSearchModal';
import ShortcutsModal from './ShortcutsModal';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
        if (isMobileMenuOpen) setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isShortcutsOpen, isMobileMenuOpen]);

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
            <Link
              href={`/tenders/${tender.id}`}
              className="mt-0.5 block max-w-[52vw] truncate text-xs font-semibold text-[var(--text-muted)] sm:hidden hover:text-[var(--brand-primary)]"
            >
              {tender.name} · {activeSection}
            </Link>
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

          {/* Mobile Quick Search Button (Touch Trigger for Mobile) */}
          <button
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search tenders and bidders"
            className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-subtle)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] sm:hidden"
            title="Search Tenders & Bidders"
          >
            <Search size={18} className="text-[var(--brand-primary)]" />
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

          {/* Mobile Hamburger Button for Sub-Nav */}
          {tender && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile navigation menu"
              className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-subtle)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] sm:hidden"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Hamburger Sub-Nav Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && tender && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] pt-3 pb-4 px-2 mt-3 sm:hidden"
          >
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Tender Sections ({tender.name})
              </span>
              <Link
                href="/tenders"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex items-center gap-1 text-xs font-bold text-[var(--brand-primary)]"
              >
                <ArrowLeftRight size={12} /> Switch Tender
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {sectionLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`p-2.5 rounded-[var(--radius-sm)] text-xs font-bold text-center border transition-all ${
                    activeSection === link.label
                      ? 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)] text-[var(--brand-primary)] shadow-xs'
                      : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
