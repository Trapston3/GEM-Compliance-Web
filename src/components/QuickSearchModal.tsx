'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, FolderOpen, User, LayoutDashboard, Settings, Mail, ListChecks, Shield, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickSearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: 'Tenders' | 'Pages';
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole?: string;
  tenderId?: number | null;
}

export default function QuickSearchModal({ isOpen, onClose, currentUserRole, tenderId }: QuickSearchModalProps) {
  const [query, setQuery] = useState('');

  // Handle ESC and Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const isSuperuser = currentUserRole === 'superuser';

  const systemPages: QuickSearchResult[] = useMemo(() => {
    const pages: QuickSearchResult[] = [
      { id: 'page-tenders', title: 'My Tenders', subtitle: 'View all active and archived tenders', category: 'Pages', href: '/tenders', icon: FolderOpen },
      { id: 'page-account', title: 'My Account', subtitle: 'Profile settings and password update', category: 'Pages', href: '/account', icon: Settings },
    ];

    if (tenderId) {
      pages.push(
        { id: 'page-overview', title: 'Tender Overview', subtitle: 'Summary and key metrics', category: 'Pages', href: `/tenders/${tenderId}/overview`, icon: LayoutDashboard },
        { id: 'page-bidders', title: 'Bidder Database', subtitle: 'Manage tender participants', category: 'Pages', href: `/tenders/${tenderId}/bidders`, icon: User },
        { id: 'page-matrix', title: 'Compliance Matrix', subtitle: 'Verification status grid', category: 'Pages', href: `/tenders/${tenderId}/matrix`, icon: ListChecks },
        { id: 'page-checklist', title: 'Checklist Setup', subtitle: 'Configure verification criteria', category: 'Pages', href: `/tenders/${tenderId}/checklist`, icon: ListChecks },
        { id: 'page-emails', title: 'Email Queries', subtitle: 'Draft and send compliance emails', category: 'Pages', href: `/tenders/${tenderId}/emails`, icon: Mail },
        { id: 'page-settings', title: 'Tender Settings', subtitle: 'Tender name and subject line', category: 'Pages', href: `/tenders/${tenderId}/settings`, icon: Settings }
      );
    }

    if (isSuperuser) {
      pages.push({ id: 'page-admin', title: 'Admin Dashboard', subtitle: 'Manage users, templates, and audit logs', category: 'Pages', href: '/admin', icon: Shield });
    }

    return pages;
  }, [tenderId, isSuperuser]);

  const filteredPages = useMemo(() => {
    if (!query.trim()) return systemPages;
    return systemPages.filter(p => `${p.title} ${p.subtitle}`.toLowerCase().includes(query.toLowerCase()));
  }, [systemPages, query]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-start justify-center pt-16 px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-[rgb(15_27_45_/_0.65)] backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Command Palette Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ type: 'spring', stiffness: 450, damping: 32 }}
          className="relative w-full max-w-xl rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-2xl overflow-hidden z-10"
        >
          {/* Search Header */}
          <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-3.5">
            <Search size={18} className="text-[var(--text-muted)] shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages, sections, or press ESC to close..."
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            />
            <button
              onClick={onClose}
              className="p-1 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Results Area */}
          <div className="max-h-80 overflow-y-auto p-2">
            {filteredPages.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                No matching pages or sections found.
              </div>
            ) : (
              <div className="space-y-1">
                <span className="block px-3 py-1.5 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Quick Navigation
                </span>
                {filteredPages.map((page) => {
                  const Icon = page.icon;
                  return (
                    <Link
                      key={page.id}
                      href={page.href}
                      onClick={onClose}
                      className="flex items-center justify-between p-3 rounded-[var(--radius-sm)] transition-colors hover:bg-[var(--bg-subtle)] group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-[var(--radius-sm)] bg-[var(--brand-primary)]/10 p-2 text-[var(--brand-primary)]">
                          <Icon size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors">
                            {page.title}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)]">{page.subtitle}</p>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Shortcut Hint */}
          <div className="flex items-center justify-between border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-2.5 text-[11px] text-[var(--text-muted)]">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-[10px]">ESC</kbd> to exit</span>
            <span>Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-[10px]">Ctrl+K</kbd></span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
